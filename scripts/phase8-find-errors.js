#!/usr/bin/env node

/**
 * Phase 8: 마이그레이션 오류 확인 스크립트
 * 
 * 마이그레이션 중 발생한 오류 2개를 확인합니다.
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');

// 환경 변수 로드
require('dotenv').config({ path: path.join(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Supabase 환경 변수가 설정되지 않았습니다.');
  console.error('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '설정됨' : '없음');
  console.error('SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? '설정됨' : '없음');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);
const CAMPAIGNS_DIR = path.join(process.cwd(), 'public', 'campaigns');
const BUCKET_NAME = 'blog-images';

async function findErrors() {
  console.log('🔍 Phase 8: 마이그레이션 오류 확인\n');
  console.log('='.repeat(60));

  try {
    const months = ['2025-05', '2025-06', '2025-07', '2025-08', '2025-09'];
    const errors = [];

    for (const month of months) {
      console.log(`\n📁 ${month} 폴더 확인 중...`);
      
      const localMonthDir = path.join(CAMPAIGNS_DIR, month);
      
      try {
        // 로컬 파일 목록
        const localFiles = await fs.readdir(localMonthDir);
        const imageFiles = localFiles.filter(file => 
          /\.(jpg|jpeg|png|gif|webp|svg|mp4)$/i.test(file)
        );

        if (imageFiles.length === 0) {
          console.log(`  ⚠️ 로컬 파일 없음`);
          continue;
        }

        console.log(`  📄 로컬 파일: ${imageFiles.length}개`);

        // Storage 파일 목록
        const { data: storageFiles, error: storageError } = await supabase.storage
          .from(BUCKET_NAME)
          .list(`originals/campaigns/${month}`, {
            limit: 1000,
            sortBy: { column: 'name', order: 'asc' }
          });

        if (storageError) {
          console.error(`  ❌ Storage 조회 실패:`, storageError.message);
          errors.push({
            month,
            type: 'storage_list_error',
            error: storageError.message
          });
          continue;
        }

        const storageFileNames = (storageFiles || [])
          .filter(f => f.name !== '.keep.png')
          .map(f => f.name);
        
        console.log(`  📦 Storage 파일: ${storageFileNames.length}개`);

        // 누락된 파일 확인
        const missingFiles = [];
        
        for (const localFile of imageFiles) {
          const localFilePath = path.join(localMonthDir, localFile);
          
          try {
            // 파일 읽기 및 해시 계산
            const fileBuffer = await fs.readFile(localFilePath);
            const hashMd5 = crypto.createHash('md5').update(fileBuffer).digest('hex');
            
        // DB에서 해시로 확인 (image_assets 테이블 사용)
        const { data: existingMetadata } = await supabase
          .from('image_assets')
          .select('*')
          .eq('hash_md5', hashMd5)
          .single();

            // Storage에서 파일명으로 확인
            const foundInStorage = storageFileNames.some(storageFile => {
              // UUID-파일명 형식으로 변환된 파일명과 비교
              const baseName = localFile.replace(/\.[^/.]+$/, '');
              return storageFile.includes(baseName) || storageFile.endsWith(localFile);
            });

            if (!existingMetadata && !foundInStorage) {
              missingFiles.push({
                fileName: localFile,
                path: localFilePath,
                size: fileBuffer.length,
                hash: hashMd5
              });
            }
          } catch (fileError) {
            console.error(`  ❌ 파일 읽기 실패 (${localFile}):`, fileError.message);
            errors.push({
              month,
              fileName: localFile,
              type: 'file_read_error',
              error: fileError.message
            });
          }
        }

        if (missingFiles.length > 0) {
          console.log(`  ⚠️ 누락된 파일: ${missingFiles.length}개`);
          missingFiles.forEach(file => {
            console.log(`    - ${file.fileName} (${(file.size / 1024).toFixed(2)} KB)`);
            errors.push({
              month,
              fileName: file.fileName,
              type: 'missing_file',
              path: file.path,
              size: file.size,
              hash: file.hash
            });
          });
        } else {
          console.log(`  ✅ 모든 파일 업로드 완료`);
        }

        // DB 메타데이터 확인 (image_assets 테이블 사용, file_path 컬럼 사용)
        const { data: metadata, error: metadataError } = await supabase
          .from('image_assets')
          .select('*')
          .like('file_path', `originals/campaigns/${month}%`)
          .limit(100);

        if (metadataError) {
          console.error(`  ❌ 메타데이터 조회 실패:`, metadataError.message);
        } else {
          console.log(`  📋 메타데이터: ${metadata?.length || 0}개`);
          
          // Storage에 있지만 메타데이터가 없는 파일 확인
          if (storageFileNames.length > 0 && metadata) {
            const metadataUrls = new Set(metadata.map(m => {
              // storage_url, cdn_url, 또는 file_path에서 파일명 추출
              const url = m.storage_url || m.cdn_url || m.image_url;
              if (url) {
                const urlParts = url.split('/');
                return urlParts ? urlParts[urlParts.length - 1] : null;
              }
              // file_path 또는 original_path에서 파일명 추출
              const path = m.file_path || m.original_path;
              if (path) {
                const pathParts = path.split('/');
                return pathParts ? pathParts[pathParts.length - 1] : null;
              }
              return null;
            }).filter(Boolean));

            const missingMetadata = storageFileNames.filter(storageFile => {
              // UUID-파일명 형식에서 원본 파일명 추출
              const baseName = storageFile.replace(/^[^-]+-/, '').replace(/\.[^/.]+$/, '');
              const originalName = storageFile.replace(/^[^-]+-/, '');
              
              return !metadataUrls.has(storageFile) && 
                     !metadataUrls.has(originalName) &&
                     !metadata.some(m => {
                       const mFileName = m.file_name || m.filename || '';
                       const mPath = m.file_path || m.original_path || '';
                       return mFileName === storageFile || 
                              mFileName === originalName ||
                              mFileName.includes(baseName) ||
                              mPath.includes(storageFile) ||
                              mPath.includes(originalName);
                     });
            });

            if (missingMetadata.length > 0) {
              console.log(`  ⚠️ 메타데이터 없는 파일: ${missingMetadata.length}개`);
              missingMetadata.slice(0, 5).forEach(file => {
                console.log(`    - ${file}`);
              });
              if (missingMetadata.length > 5) {
                console.log(`    ... 외 ${missingMetadata.length - 5}개 더`);
              }
            }
          }
        }

      } catch (e) {
        if (e.code === 'ENOENT') {
          console.log(`  ⚠️ 로컬 폴더 없음: ${localMonthDir}`);
        } else {
          console.error(`  ❌ 폴더 확인 실패:`, e.message);
          errors.push({
            month,
            type: 'folder_error',
            error: e.message
          });
        }
      }
    }

    // 결과 요약
    console.log('\n' + '='.repeat(60));
    console.log('📊 오류 확인 결과\n');
    
    if (errors.length === 0) {
      console.log('✅ 오류가 없습니다!');
    } else {
      console.log(`❌ 총 ${errors.length}개의 오류/이슈 발견:\n`);
      
      const errorTypes = {};
      errors.forEach(err => {
        const type = err.type || 'unknown';
        errorTypes[type] = (errorTypes[type] || 0) + 1;
      });

      console.log('오류 유형:');
      Object.entries(errorTypes).forEach(([type, count]) => {
        console.log(`  - ${type}: ${count}개`);
      });

      console.log('\n상세 오류 목록:');
      errors.forEach((err, index) => {
        console.log(`\n${index + 1}. ${err.type || 'unknown'}`);
        console.log(`   월: ${err.month || 'N/A'}`);
        if (err.fileName) {
          console.log(`   파일: ${err.fileName}`);
        }
        if (err.error) {
          console.log(`   오류: ${err.error}`);
        }
        if (err.path) {
          console.log(`   경로: ${err.path}`);
        }
      });

      // 오류 결과를 JSON 파일로 저장
      const errorFile = path.join(process.cwd(), 'docs', 'phase8-errors.json');
      await fs.writeFile(errorFile, JSON.stringify(errors, null, 2));
      console.log(`\n📄 오류 결과 저장: ${errorFile}`);
    }

  } catch (error) {
    console.error('\n❌ 오류 확인 중 오류 발생:', error);
    process.exit(1);
  }
}

findErrors();








