/**
 * 특정 파일명을 기반으로 Gallery 이미지를 색상별 폴더로 이동
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
  golfHat: { beige: [], white: [], errors: [] }
};

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
 * 버킷햇 이미지 이동
 */
async function moveBucketHatImages() {
  console.log('\n1️⃣ 버킷햇 이미지 이동 시작...\n');
  
  const sourceFolder = 'originals/goods/bucket-hat-muziik/gallery';
  
  // 블랙으로 이동할 파일명 리스트
  const blackFiles = [
    'composed-1-a10ed3c2-fd40-4dae-8063-7b245ab7b2f2-1767338691526.png',
    'composed-1-a10ed3c2-fd40-4dae-8063-7b245ab7b2f2-1767061550580.png',
    'bucket-hat-muziik-4.webp',
    'bucket-hat-muziik-2.webp',
    'bucket-hat-muziik-12.webp',
    'bucket-hat-muziik-11.webp',
    'bucket-hat-muziik-1.webp'
  ];
  
  const targetBlack = 'originals/goods/bucket-hat-muziik-black/gallery';
  const targetWhite = 'originals/goods/bucket-hat-muziik-white/gallery';
  
  // 소스 폴더의 모든 파일 조회
  const { data: files, error: listError } = await supabase.storage
    .from(STORAGE_BUCKET)
    .list(sourceFolder, {
      limit: 1000,
      sortBy: { column: 'name', order: 'asc' }
    });
  
  if (listError) {
    console.error('❌ 파일 목록 조회 실패:', listError);
    return;
  }
  
  if (!files || files.length === 0) {
    console.log('   ℹ️ 이동할 이미지가 없습니다.');
    return;
  }
  
  console.log(`   📋 발견된 이미지: ${files.length}개`);
  
  // 파일 이동
  for (const file of files) {
    if (file.id === null) continue; // 폴더 제외
    
    const fromPath = `${sourceFolder}/${file.name}`;
    const isBlack = blackFiles.includes(file.name);
    const targetFolder = isBlack ? targetBlack : targetWhite;
    const toPath = `${targetFolder}/${file.name}`;
    
    console.log(`   📦 이동 중: ${file.name} → ${isBlack ? '블랙' : '화이트'}`);
    const result = await moveFile(fromPath, toPath);
    
    if (result.success) {
      if (isBlack) {
        results.bucketHat.black.push({
          fileName: file.name,
          from: fromPath,
          to: toPath
        });
      } else {
        results.bucketHat.white.push({
          fileName: file.name,
          from: fromPath,
          to: toPath
        });
      }
      console.log(`   ✅ 이동 완료: ${file.name}`);
    } else {
      results.bucketHat.errors.push({
        fileName: file.name,
        error: result.error
      });
      console.error(`   ❌ 이동 실패: ${file.name} - ${result.error}`);
    }
  }
  
  console.log(`\n   ✅ 버킷햇 이동 완료:`);
  console.log(`      - 블랙: ${results.bucketHat.black.length}개`);
  console.log(`      - 화이트: ${results.bucketHat.white.length}개`);
  if (results.bucketHat.errors.length > 0) {
    console.log(`      - 오류: ${results.bucketHat.errors.length}개`);
  }
}

/**
 * 골프모자 이미지 이동
 */
async function moveGolfHatImages() {
  console.log('\n2️⃣ 골프모자 이미지 이동 시작...\n');
  
  const sourceFolder = 'originals/goods/golf-hat-muziik/gallery';
  
  // 베이지로 이동할 파일명 리스트
  const beigeFiles = [
    'golf-hat-muziik-6.webp',
    'golf-hat-muziik-1.webp'
  ];
  
  const targetBeige = 'originals/goods/golf-hat-muziik-beige/gallery';
  const targetWhite = 'originals/goods/golf-hat-muziik-white/gallery';
  
  // 소스 폴더의 모든 파일 조회
  const { data: files, error: listError } = await supabase.storage
    .from(STORAGE_BUCKET)
    .list(sourceFolder, {
      limit: 1000,
      sortBy: { column: 'name', order: 'asc' }
    });
  
  if (listError) {
    console.error('❌ 파일 목록 조회 실패:', listError);
    return;
  }
  
  if (!files || files.length === 0) {
    console.log('   ℹ️ 이동할 이미지가 없습니다.');
    return;
  }
  
  console.log(`   📋 발견된 이미지: ${files.length}개`);
  
  // 파일 이동
  for (const file of files) {
    if (file.id === null) continue; // 폴더 제외
    
    const fromPath = `${sourceFolder}/${file.name}`;
    const isBeige = beigeFiles.includes(file.name);
    const targetFolder = isBeige ? targetBeige : targetWhite;
    const toPath = `${targetFolder}/${file.name}`;
    
    console.log(`   📦 이동 중: ${file.name} → ${isBeige ? '베이지' : '화이트'}`);
    const result = await moveFile(fromPath, toPath);
    
    if (result.success) {
      if (isBeige) {
        results.golfHat.beige.push({
          fileName: file.name,
          from: fromPath,
          to: toPath
        });
      } else {
        results.golfHat.white.push({
          fileName: file.name,
          from: fromPath,
          to: toPath
        });
      }
      console.log(`   ✅ 이동 완료: ${file.name}`);
    } else {
      results.golfHat.errors.push({
        fileName: file.name,
        error: result.error
      });
      console.error(`   ❌ 이동 실패: ${file.name} - ${result.error}`);
    }
  }
  
  console.log(`\n   ✅ 골프모자 이동 완료:`);
  console.log(`      - 베이지: ${results.golfHat.beige.length}개`);
  console.log(`      - 화이트: ${results.golfHat.white.length}개`);
  if (results.golfHat.errors.length > 0) {
    console.log(`      - 오류: ${results.golfHat.errors.length}개`);
  }
}

/**
 * 메인 실행 함수
 */
async function main() {
  console.log('🚀 Gallery 이미지 색상별 이동 시작...\n');
  console.log('='.repeat(60));

  try {
    // 1. 버킷햇 이미지 이동
    await moveBucketHatImages();

    // 2. 골프모자 이미지 이동
    await moveGolfHatImages();

    // 결과 저장
    const resultPath = path.join(__dirname, 'move-gallery-images-by-filename-result.json');
    fs.writeFileSync(resultPath, JSON.stringify(results, null, 2));
    console.log(`\n📄 결과 저장: ${resultPath}`);

    // 최종 요약
    console.log('\n' + '='.repeat(60));
    console.log('✅ 이미지 이동 완료!\n');
    console.log('📊 작업 요약:');
    console.log(`   버킷햇:`);
    console.log(`      - 블랙: ${results.bucketHat.black.length}개`);
    console.log(`      - 화이트: ${results.bucketHat.white.length}개`);
    console.log(`   골프모자:`);
    console.log(`      - 베이지: ${results.golfHat.beige.length}개`);
    console.log(`      - 화이트: ${results.golfHat.white.length}개`);
    
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

