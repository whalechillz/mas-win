/**
 * 모자 이미지를 색상별로 분리하는 스크립트
 * 1. bucket-hat-muziik/gallery/ → bucket-hat-muziik-black/gallery/, bucket-hat-muziik-white/gallery/
 * 2. golf-hat-muziik/gallery/ → golf-hat-muziik-black/gallery/, golf-hat-muziik-white/gallery/, golf-hat-muziik-navy/gallery/, golf-hat-muziik-beige/gallery/
 * 3. composition 폴더도 동일하게 분리
 */

require('dotenv').config({ path: '.env.local' });

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Supabase 환경 변수가 설정되지 않았습니다.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);
const STORAGE_BUCKET = 'blog-images';

const results = {
  bucketHat: { black: [], white: [], errors: [] },
  golfHat: { black: [], white: [], navy: [], beige: [], errors: [] }
};

/**
 * 파일명에서 색상 추출
 */
function extractColor(fileName) {
  const lowerName = fileName.toLowerCase();
  
  // 버킷햇 색상
  if (lowerName.includes('black') || lowerName.includes('블랙')) {
    return 'black';
  }
  if (lowerName.includes('white') || lowerName.includes('화이트')) {
    return 'white';
  }
  
  // 골프모자 색상
  if (lowerName.includes('navy') || lowerName.includes('네이비')) {
    return 'navy';
  }
  if (lowerName.includes('beige') || lowerName.includes('베이지')) {
    return 'beige';
  }
  
  // 기본값 (파일명에 색상이 없으면 null 반환)
  return null;
}

/**
 * 파일 이동 (복사 후 원본 삭제)
 */
async function moveFile(fromPath, toPath) {
  try {
    // 1. 파일 다운로드
    const { data: fileData, error: downloadError } = await supabase.storage
      .from(STORAGE_BUCKET)
      .download(fromPath);

    if (downloadError) {
      throw new Error(`다운로드 실패: ${downloadError.message}`);
    }

    // 2. 새 위치에 업로드
    const { error: uploadError } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(toPath, fileData, {
        contentType: 'image/webp',
        upsert: true
      });

    if (uploadError) {
      throw new Error(`업로드 실패: ${uploadError.message}`);
    }

    // 3. 원본 삭제
    const { error: deleteError } = await supabase.storage
      .from(STORAGE_BUCKET)
      .remove([fromPath]);

    if (deleteError) {
      console.warn(`⚠️ 원본 삭제 실패 (이미 이동됨): ${fromPath} - ${deleteError.message}`);
    }

    return { success: true, fromPath, toPath };
  } catch (error) {
    return { success: false, fromPath, toPath, error: error.message };
  }
}

/**
 * 폴더 내 모든 파일 목록 조회 (재귀)
 */
async function listFilesRecursive(folderPath) {
  const allFiles = [];
  let offset = 0;
  const batchSize = 1000;

  while (true) {
    const { data, error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .list(folderPath, {
        limit: batchSize,
        offset: offset,
        sortBy: { column: 'name', order: 'asc' }
      });

    if (error) {
      console.error(`❌ 폴더 목록 조회 실패: ${folderPath}`, error.message);
      break;
    }

    if (!data || data.length === 0) {
      break;
    }

    // 파일만 필터링 (폴더 제외)
    const files = data.filter(item => item.id !== null);
    allFiles.push(...files.map(file => ({
      name: file.name,
      path: `${folderPath}/${file.name}`
    })));

    if (data.length < batchSize) {
      break;
    }

    offset += batchSize;
  }

  return allFiles;
}

/**
 * 버킷햇 이미지 색상별 분리
 */
async function splitBucketHatImages() {
  console.log('\n1️⃣ 버킷햇 이미지 색상별 분리 시작...\n');
  
  const sourceGallery = 'originals/goods/bucket-hat-muziik/gallery';
  const sourceComposition = 'originals/goods/bucket-hat-muziik/composition';
  
  // gallery 폴더 이미지 분리
  console.log('   📁 gallery 폴더 처리 중...');
  const galleryFiles = await listFilesRecursive(sourceGallery);
  console.log(`   📋 발견된 이미지: ${galleryFiles.length}개`);

  for (const file of galleryFiles) {
    const color = extractColor(file.name);
    
    if (!color || (color !== 'black' && color !== 'white')) {
      console.log(`   ⚠️ 색상을 확인할 수 없음 (건너뜀): ${file.name}`);
      results.bucketHat.errors.push({
        fileName: file.name,
        reason: 'color_not_detected'
      });
      continue;
    }

    const targetFolder = `originals/goods/bucket-hat-muziik-${color}/gallery`;
    const targetPath = `${targetFolder}/${file.name}`;

    console.log(`   📦 이동 중: ${file.name} → ${color}`);
    const result = await moveFile(file.path, targetPath);

    if (result.success) {
      results.bucketHat[color].push({
        fileName: file.name,
        from: file.path,
        to: targetPath
      });
      console.log(`   ✅ 이동 완료: ${file.name}`);
    } else {
      results.bucketHat.errors.push({
        fileName: file.name,
        error: result.error
      });
      console.error(`   ❌ 이동 실패: ${file.name} - ${result.error}`);
    }
  }

  // composition 폴더 이미지 분리
  console.log('\n   📁 composition 폴더 처리 중...');
  const compositionFiles = await listFilesRecursive(sourceComposition);
  console.log(`   📋 발견된 이미지: ${compositionFiles.length}개`);

  for (const file of compositionFiles) {
    const color = extractColor(file.name);
    
    if (!color || (color !== 'black' && color !== 'white')) {
      console.log(`   ⚠️ 색상을 확인할 수 없음 (건너뜀): ${file.name}`);
      results.bucketHat.errors.push({
        fileName: file.name,
        reason: 'color_not_detected'
      });
      continue;
    }

    const targetFolder = `originals/goods/bucket-hat-muziik-${color}/composition`;
    const targetPath = `${targetFolder}/${file.name}`;

    console.log(`   📦 이동 중: ${file.name} → ${color}`);
    const result = await moveFile(file.path, targetPath);

    if (result.success) {
      results.bucketHat[color].push({
        fileName: file.name,
        from: file.path,
        to: targetPath
      });
      console.log(`   ✅ 이동 완료: ${file.name}`);
    } else {
      results.bucketHat.errors.push({
        fileName: file.name,
        error: result.error
      });
      console.error(`   ❌ 이동 실패: ${file.name} - ${result.error}`);
    }
  }

  console.log(`\n   ✅ 버킷햇 분리 완료:`);
  console.log(`      - 블랙: ${results.bucketHat.black.length}개`);
  console.log(`      - 화이트: ${results.bucketHat.white.length}개`);
  if (results.bucketHat.errors.length > 0) {
    console.log(`      - 오류: ${results.bucketHat.errors.length}개`);
  }
}

/**
 * 골프모자 이미지 색상별 분리
 */
async function splitGolfHatImages() {
  console.log('\n2️⃣ 골프모자 이미지 색상별 분리 시작...\n');
  
  const sourceGallery = 'originals/goods/golf-hat-muziik/gallery';
  const sourceComposition = 'originals/goods/golf-hat-muziik/composition';
  
  // gallery 폴더 이미지 분리
  console.log('   📁 gallery 폴더 처리 중...');
  const galleryFiles = await listFilesRecursive(sourceGallery);
  console.log(`   📋 발견된 이미지: ${galleryFiles.length}개`);

  for (const file of galleryFiles) {
    const color = extractColor(file.name);
    
    if (!color || !['black', 'white', 'navy', 'beige'].includes(color)) {
      console.log(`   ⚠️ 색상을 확인할 수 없음 (건너뜀): ${file.name}`);
      results.golfHat.errors.push({
        fileName: file.name,
        reason: 'color_not_detected'
      });
      continue;
    }

    const targetFolder = `originals/goods/golf-hat-muziik-${color}/gallery`;
    const targetPath = `${targetFolder}/${file.name}`;

    console.log(`   📦 이동 중: ${file.name} → ${color}`);
    const result = await moveFile(file.path, targetPath);

    if (result.success) {
      results.golfHat[color].push({
        fileName: file.name,
        from: file.path,
        to: targetPath
      });
      console.log(`   ✅ 이동 완료: ${file.name}`);
    } else {
      results.golfHat.errors.push({
        fileName: file.name,
        error: result.error
      });
      console.error(`   ❌ 이동 실패: ${file.name} - ${result.error}`);
    }
  }

  // composition 폴더 이미지 분리
  console.log('\n   📁 composition 폴더 처리 중...');
  const compositionFiles = await listFilesRecursive(sourceComposition);
  console.log(`   📋 발견된 이미지: ${compositionFiles.length}개`);

  for (const file of compositionFiles) {
    const color = extractColor(file.name);
    
    if (!color || !['black', 'white', 'navy', 'beige'].includes(color)) {
      console.log(`   ⚠️ 색상을 확인할 수 없음 (건너뜀): ${file.name}`);
      results.golfHat.errors.push({
        fileName: file.name,
        reason: 'color_not_detected'
      });
      continue;
    }

    const targetFolder = `originals/goods/golf-hat-muziik-${color}/composition`;
    const targetPath = `${targetFolder}/${file.name}`;

    console.log(`   📦 이동 중: ${file.name} → ${color}`);
    const result = await moveFile(file.path, targetPath);

    if (result.success) {
      results.golfHat[color].push({
        fileName: file.name,
        from: file.path,
        to: targetPath
      });
      console.log(`   ✅ 이동 완료: ${file.name}`);
    } else {
      results.golfHat.errors.push({
        fileName: file.name,
        error: result.error
      });
      console.error(`   ❌ 이동 실패: ${file.name} - ${result.error}`);
    }
  }

  console.log(`\n   ✅ 골프모자 분리 완료:`);
  console.log(`      - 블랙: ${results.golfHat.black.length}개`);
  console.log(`      - 화이트: ${results.golfHat.white.length}개`);
  console.log(`      - 네이비: ${results.golfHat.navy.length}개`);
  console.log(`      - 베이지: ${results.golfHat.beige.length}개`);
  if (results.golfHat.errors.length > 0) {
    console.log(`      - 오류: ${results.golfHat.errors.length}개`);
  }
}

/**
 * 메인 실행 함수
 */
async function main() {
  console.log('🚀 모자 이미지 색상별 분리 시작...\n');
  console.log('='.repeat(60));

  try {
    // 1. 버킷햇 이미지 분리
    await splitBucketHatImages();

    // 2. 골프모자 이미지 분리
    await splitGolfHatImages();

    // 결과 저장
    const resultPath = path.join(__dirname, 'split-hat-images-by-color-result.json');
    fs.writeFileSync(resultPath, JSON.stringify(results, null, 2));
    console.log(`\n📄 결과 저장: ${resultPath}`);

    // 최종 요약
    console.log('\n' + '='.repeat(60));
    console.log('✅ 이미지 분리 완료!\n');
    console.log('📊 작업 요약:');
    console.log(`   버킷햇:`);
    console.log(`      - 블랙: ${results.bucketHat.black.length}개`);
    console.log(`      - 화이트: ${results.bucketHat.white.length}개`);
    console.log(`   골프모자:`);
    console.log(`      - 블랙: ${results.golfHat.black.length}개`);
    console.log(`      - 화이트: ${results.golfHat.white.length}개`);
    console.log(`      - 네이비: ${results.golfHat.navy.length}개`);
    console.log(`      - 베이지: ${results.golfHat.beige.length}개`);
    
    const totalErrors = results.bucketHat.errors.length + results.golfHat.errors.length;
    if (totalErrors > 0) {
      console.log(`\n⚠️ 오류 발생: ${totalErrors}개`);
    } else {
      console.log('\n✨ 모든 작업이 성공적으로 완료되었습니다!');
    }

  } catch (error) {
    console.error('\n❌ 치명적 오류:', error);
    process.exit(1);
  }
}

// 실행
main();

