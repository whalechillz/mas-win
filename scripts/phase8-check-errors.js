#!/usr/bin/env node

/**
 * Phase 8: 마이그레이션 오류 확인 스크립트
 * 
 * 마이그레이션 중 발생한 오류 2개를 확인하고 수정합니다.
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs').promises;
const path = require('path');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Supabase 환경 변수가 설정되지 않았습니다.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);
const CAMPAIGNS_DIR = path.join(process.cwd(), 'public', 'campaigns');

async function checkErrors() {
  console.log('🔍 Phase 8: 마이그레이션 오류 확인\n');
  console.log('='.repeat(60));

  try {
    // 1. Storage에서 업로드된 이미지 확인
    console.log('\n📊 1단계: Storage 이미지 확인');
    const months = ['2025-05', '2025-06', '2025-07', '2025-08', '2025-09'];
    
    for (const month of months) {
      const { data: files, error } = await supabase.storage
        .from('blog-images')
        .list(`originals/campaigns/${month}`, {
          limit: 1000,
          sortBy: { column: 'name', order: 'asc' }
        });

      if (error) {
        console.error(`❌ ${month} 폴더 조회 실패:`, error.message);
        continue;
      }

      if (files && files.length > 0) {
        console.log(`✅ ${month}: ${files.length}개 파일`);
      } else {
        console.log(`⚠️ ${month}: 파일 없음`);
      }
    }

    // 2. 로컬 파일과 Storage 파일 비교
    console.log('\n📁 2단계: 로컬 파일과 Storage 파일 비교');
    
    for (const month of months) {
      const localMonthDir = path.join(CAMPAIGNS_DIR, month);
      
      try {
        const localFiles = await fs.readdir(localMonthDir);
        const imageFiles = localFiles.filter(file => 
          /\.(jpg|jpeg|png|gif|webp|svg|mp4)$/i.test(file)
        );

        if (imageFiles.length === 0) continue;

        const { data: storageFiles } = await supabase.storage
          .from('blog-images')
          .list(`originals/campaigns/${month}`, { limit: 1000 });

        const storageFileNames = (storageFiles || []).map(f => f.name);
        const missingFiles = imageFiles.filter(localFile => {
          // UUID-파일명 형식으로 변환된 파일명과 비교
          return !storageFileNames.some(storageFile => 
            storageFile.includes(localFile.replace(/\.[^/.]+$/, ''))
          );
        });

        if (missingFiles.length > 0) {
          console.log(`\n⚠️ ${month} 누락된 파일 (${missingFiles.length}개):`);
          missingFiles.forEach(file => {
            console.log(`  - ${file}`);
          });
        } else {
          console.log(`✅ ${month}: 모든 파일 업로드 완료`);
        }
      } catch (e) {
        if (e.code !== 'ENOENT') {
          console.error(`❌ ${month} 폴더 확인 실패:`, e.message);
        }
      }
    }

    // 3. DB 메타데이터 확인
    console.log('\n📋 3단계: DB 메타데이터 확인');
    
    const { data: metadata, error: metadataError } = await supabase
      .from('image_metadata')
      .select('*')
      .like('folder_path', 'originals/campaigns/%')
      .limit(100);

    if (metadataError) {
      console.error('❌ 메타데이터 조회 실패:', metadataError.message);
    } else {
      console.log(`✅ 메타데이터: ${metadata?.length || 0}개`);
      
      // 메타데이터가 없는 이미지 확인
      const { data: allStorageFiles } = await supabase.storage
        .from('blog-images')
        .list('originals/campaigns', { limit: 1000, recursive: true });
      
      if (allStorageFiles) {
        const metadataUrls = new Set((metadata || []).map(m => m.image_url));
        const missingMetadata = allStorageFiles.filter(file => {
          if (!file.name || file.name === '.keep.png') return false;
          // Storage URL 생성
          const { data } = supabase.storage
            .from('blog-images')
            .getPublicUrl(`originals/campaigns/${file.name}`);
          return !metadataUrls.has(data?.publicUrl);
        });

        if (missingMetadata.length > 0) {
          console.log(`\n⚠️ 메타데이터가 없는 이미지 (${missingMetadata.length}개):`);
          missingMetadata.slice(0, 10).forEach(file => {
            console.log(`  - ${file.name}`);
          });
          if (missingMetadata.length > 10) {
            console.log(`  ... 외 ${missingMetadata.length - 10}개 더`);
          }
        }
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('✅ 오류 확인 완료\n');

  } catch (error) {
    console.error('\n❌ 오류 확인 중 오류 발생:', error);
    process.exit(1);
  }
}

checkErrors();








