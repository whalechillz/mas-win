#!/usr/bin/env node

/**
 * Phase 8: Storage 파일 직접 다운로드하여 hash_md5 계산 및 중복 감지
 * 
 * Storage에 있는 모든 파일을 다운로드하여 hash_md5를 계산하고,
 * 중복을 찾습니다. 메타데이터가 없는 파일도 포함합니다.
 * 
 * 사용 방법:
 * ```bash
 * node scripts/phase8-calculate-hash-for-storage-files.js originals/campaigns/2025-05
 * ```
 */

const path = require('path');
const crypto = require('crypto');
require('dotenv').config({ path: path.join(process.cwd(), '.env.local') });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const bucketName = process.env.NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET || 'blog-images';

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Supabase 환경 변수가 설정되지 않았습니다.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// 이미지 다운로드 및 해시 계산 (Supabase Storage API 사용)
async function downloadAndCalculateHash(filePath) {
  try {
    const { data, error } = await supabase.storage
      .from(bucketName)
      .download(filePath);

    if (error) {
      throw new Error(`이미지 다운로드 실패: ${error.message}`);
    }
    
    // Blob을 Buffer로 변환
    const arrayBuffer = await data.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    const hashMd5 = crypto.createHash('md5').update(buffer).digest('hex');
    const hashSha256 = crypto.createHash('sha256').update(buffer).digest('hex');
    
    return { hashMd5, hashSha256, size: buffer.length };
  } catch (error) {
    console.error(`❌ 이미지 다운로드 오류 (${filePath}):`, error.message);
    return null;
  }
}

async function calculateHashForStorageFiles() {
  const folderPath = process.argv[2] || 'originals/campaigns/2025-05';
  
  console.log('🔍 Phase 8: Storage 파일 hash_md5 계산 및 중복 감지\n');
  console.log('='.repeat(60));
  console.log(`📁 대상 폴더: ${folderPath}\n`);

  try {
    // 1. Storage에서 모든 파일 조회
    console.log('📦 1단계: Storage에서 파일 조회');
    const { data: storageFiles, error: storageError } = await supabase.storage
      .from(bucketName)
      .list(folderPath, { limit: 1000 });

    if (storageError) {
      console.error('❌ Storage 조회 실패:', storageError.message);
      process.exit(1);
    }

    // 이미지 파일만 필터링
    const imageFiles = storageFiles.filter(f => {
      const ext = f.name.toLowerCase();
      return ext.endsWith('.jpg') || ext.endsWith('.jpeg') || ext.endsWith('.png') || 
             ext.endsWith('.gif') || ext.endsWith('.webp') || ext.endsWith('.mp4');
    }).filter(f => f.name !== '.keep.png');

    console.log(`✅ Storage 파일 조회: ${imageFiles.length}개`);

    // 2. 각 파일의 hash_md5 계산
    console.log('\n📝 2단계: hash_md5 계산 중...');
    const fileHashes = [];
    const hashMap = new Map();

    for (let i = 0; i < imageFiles.length; i++) {
      const file = imageFiles[i];
      const filePath = `${folderPath}/${file.name}`;
      const { data } = supabase.storage.from(bucketName).getPublicUrl(filePath);
      const imageUrl = data.publicUrl;

      console.log(`  ${i + 1}/${imageFiles.length}: ${file.name}...`);
      
      const hashResult = await downloadAndCalculateHash(filePath);
      
      if (hashResult) {
        const fileInfo = {
          name: file.name,
          path: `${folderPath}/${file.name}`,
          url: imageUrl,
          hash_md5: hashResult.hashMd5,
          hash_sha256: hashResult.hashSha256,
          size: hashResult.size,
        };
        
        fileHashes.push(fileInfo);
        
        // hash_md5 기반 그룹화
        if (hashMap.has(hashResult.hashMd5)) {
          hashMap.get(hashResult.hashMd5).push(fileInfo);
        } else {
          hashMap.set(hashResult.hashMd5, [fileInfo]);
        }
      }
    }

    console.log(`✅ hash_md5 계산 완료: ${fileHashes.length}개`);

    // 3. 중복 그룹 찾기
    console.log('\n🔄 3단계: 중복 그룹 찾기');
    const duplicateGroups = [];

    hashMap.forEach((group, hash) => {
      if (group.length > 1) {
        duplicateGroups.push({ hash_md5: hash, count: group.length, files: group });
      }
    });

    console.log(`✅ 중복 그룹: ${duplicateGroups.length}개`);

    // 4. 중복 그룹 상세 정보 출력
    if (duplicateGroups.length > 0) {
      console.log('\n📊 중복 그룹 상세:');
      duplicateGroups.forEach((dup, index) => {
        console.log(`\n   그룹 ${index + 1}: ${dup.count}개 파일 (hash_md5: ${dup.hash_md5.substring(0, 16)}...)`);
        dup.files.forEach((file, fileIndex) => {
          console.log(`     ${fileIndex + 1}. ${file.name}`);
          console.log(`        경로: ${file.path}`);
          console.log(`        크기: ${(file.size / 1024).toFixed(2)} KB`);
        });
      });
    } else {
      console.log('\n✅ hash_md5 기반 중복이 없습니다.');
      console.log('   (시각적 중복은 pHash 또는 GPT Vision으로 확인 필요)');
    }

    // 5. DB와 비교하여 메타데이터 없는 파일 확인
    console.log('\n📋 4단계: DB 메타데이터 확인');
    const { data: dbImages } = await supabase
      .from('image_assets')
      .select('cdn_url, hash_md5, filename')
      .like('file_path', `${folderPath}%`);

    const dbUrls = new Set((dbImages || []).map(img => img.cdn_url));
    const dbHashes = new Set((dbImages || []).map(img => img.hash_md5).filter(Boolean));

    const filesWithoutMetadata = fileHashes.filter(file => !dbUrls.has(file.url));
    const filesWithHashButNoMetadata = fileHashes.filter(file => 
      dbHashes.has(file.hash_md5) && !dbUrls.has(file.url)
    );

    console.log(`   DB에 메타데이터 있는 파일: ${fileHashes.length - filesWithoutMetadata.length}개`);
    console.log(`   DB에 메타데이터 없는 파일: ${filesWithoutMetadata.length}개`);
    if (filesWithHashButNoMetadata.length > 0) {
      console.log(`   ⚠️  hash_md5는 있지만 메타데이터 없는 파일: ${filesWithHashButNoMetadata.length}개`);
    }

    // 6. 결과 저장
    const result = {
      timestamp: new Date().toISOString(),
      folderPath,
      summary: {
        totalFiles: imageFiles.length,
        filesWithHash: fileHashes.length,
        duplicateGroups: duplicateGroups.length,
        totalDuplicates: duplicateGroups.reduce((sum, dup) => sum + dup.count, 0),
        filesWithoutMetadata: filesWithoutMetadata.length,
      },
      duplicateGroups: duplicateGroups,
      filesWithoutMetadata: filesWithoutMetadata.map(file => ({
        name: file.name,
        path: file.path,
        url: file.url,
        hash_md5: file.hash_md5,
      })),
      allFiles: fileHashes,
    };

    const outputPath = path.join(process.cwd(), 'docs', `phase8-storage-hash-calculation-${Date.now()}.json`);
    const fs = require('fs');
    fs.writeFileSync(outputPath, JSON.stringify(result, null, 2));
    console.log(`\n📄 결과 저장: ${outputPath}`);

    // 7. 요약 출력
    console.log('\n' + '='.repeat(60));
    console.log('📊 hash_md5 계산 및 중복 감지 결과 요약\n');
    console.log(`전체 파일: ${result.summary.totalFiles}개`);
    console.log(`hash_md5 계산 완료: ${result.summary.filesWithHash}개`);
    console.log(`중복 그룹: ${result.summary.duplicateGroups}개`);
    console.log(`총 중복 파일: ${result.summary.totalDuplicates}개`);
    console.log(`메타데이터 없는 파일: ${result.summary.filesWithoutMetadata}개`);
    
    if (duplicateGroups.length > 0) {
      console.log('\n💡 다음 단계:');
      console.log('   1. 이미지 사용 현황 확인 (HTML 파일, 블로그 본문)');
      console.log('   2. 안전한 중복 제거 실행');
    }

    console.log('\n' + '='.repeat(60));

  } catch (error) {
    console.error('❌ 오류 발생:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  calculateHashForStorageFiles();
}

module.exports = { calculateHashForStorageFiles };








