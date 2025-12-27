/**
 * 설문 페이지 이미지를 Supabase Storage로 마이그레이션
 * 버킷햇/골프모자 이미지를 originals/products/goods/{product-slug}/gallery/ 경로로 업로드
 * 
 * 로컬에 이미지가 없으면 기존 경로를 기반으로 데이터베이스에 제품만 등록
 */

require('dotenv').config({ path: '.env.local' });

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Supabase 환경 변수가 설정되지 않았습니다.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

/**
 * 이미지 파일을 WebP로 변환하고 Storage에 업로드
 */
async function uploadImageToStorage(filePath, storagePath) {
  try {
    const fileBuffer = fs.readFileSync(filePath);
    const ext = path.extname(filePath).toLowerCase();
    
    let webpBuffer;
    let finalStoragePath = storagePath;
    
    if (ext === '.webp') {
      webpBuffer = fileBuffer;
    } else {
      webpBuffer = await sharp(fileBuffer)
        .webp({ quality: 85 })
        .toBuffer();
      finalStoragePath = storagePath.replace(/\.(jpg|jpeg|png)$/i, '.webp');
    }

    const { data, error } = await supabase.storage
      .from('blog-images')
      .upload(finalStoragePath, webpBuffer, {
        contentType: 'image/webp',
        cacheControl: '3600',
        upsert: true
      });

    if (error) {
      console.error(`  ❌ 업로드 실패: ${error.message}`);
      return null;
    }

    return finalStoragePath;
  } catch (error) {
    console.error(`  ❌ 처리 실패: ${error.message}`);
    return null;
  }
}

/**
 * 설문 페이지 이미지를 Supabase Storage로 마이그레이션
 */
async function migrateSurveyImages() {
  console.log('🔄 설문 페이지 이미지 마이그레이션 시작...\n');

  // 여러 가능한 경로 확인 (재귀적으로 검색)
  const searchPaths = [
    path.join(process.cwd(), 'public'),
    path.join(process.cwd(), 'public/main/products'),
    path.join(process.cwd(), 'public/main/products/goods'),
  ];

  // 재귀적으로 이미지 파일 찾기
  function findImageFiles(dir, fileList = []) {
    if (!fs.existsSync(dir)) return fileList;
    
    try {
      const files = fs.readdirSync(dir);
      files.forEach(file => {
        const filePath = path.join(dir, file);
        try {
          const stat = fs.statSync(filePath);
          
          if (stat.isDirectory()) {
            findImageFiles(filePath, fileList);
          } else if (/\.(webp|jpg|jpeg|png)$/i.test(file) && 
                     (file.includes('bucket-hat-muziik') || file.includes('golf-hat-muziik'))) {
            fileList.push(filePath);
          }
        } catch (err) {
          // 파일 접근 오류 무시
        }
      });
    } catch (err) {
      // 디렉토리 읽기 오류 무시
    }
    
    return fileList;
  }

  let allFiles = [];
  for (const searchPath of searchPaths) {
    if (fs.existsSync(searchPath)) {
      const found = findImageFiles(searchPath);
      allFiles = allFiles.concat(found);
    }
  }

  const bucketHatImages = [];
  const golfCapImages = [];

  if (allFiles.length === 0) {
    console.log('⚠️  로컬에 이미지 파일을 찾을 수 없습니다.');
    console.log('기존 경로를 기반으로 데이터베이스에 제품을 등록합니다.\n');
    
    // Fallback: 설문 페이지 코드에서 사용하는 경로를 기반으로 제품 등록
    // 이미지는 나중에 관리자 페이지에서 업로드 가능
    for (let i = 1; i <= 12; i++) {
      bucketHatImages.push(`originals/products/goods/bucket-hat-muziik/gallery/bucket-hat-muziik-${i}.webp`);
    }
    
    for (let i = 1; i <= 7; i++) {
      golfCapImages.push(`originals/products/goods/golf-hat-muziik/gallery/golf-hat-muziik-${i}.webp`);
    }
    
    console.log('📝 예상 이미지 경로를 생성했습니다:');
    console.log(`버킷햇: ${bucketHatImages.length}개`);
    console.log(`골프모자: ${golfCapImages.length}개`);
    console.log('\n💡 이미지는 관리자 페이지(/admin/products)에서 업로드하세요.\n');
  } else {
    console.log(`📁 발견된 이미지 파일: ${allFiles.length}개\n`);

    for (const filePath of allFiles) {
      const fileName = path.basename(filePath);
      
      // 버킷햇 이미지 분류
      if (fileName.includes('bucket-hat-muziik')) {
        const storagePath = `originals/products/goods/bucket-hat-muziik/gallery/${fileName}`;
        console.log(`📤 버킷햇: ${fileName} → ${storagePath}`);
        
        const uploaded = await uploadImageToStorage(filePath, storagePath);
        if (uploaded) {
          bucketHatImages.push(uploaded);
          console.log(`  ✅ 성공: ${uploaded}\n`);
        } else {
          console.log(`  ❌ 실패: ${fileName}\n`);
        }
      }
      
      // 골프모자 이미지 분류
      if (fileName.includes('golf-hat-muziik')) {
        const storagePath = `originals/products/goods/golf-hat-muziik/gallery/${fileName}`;
        console.log(`📤 골프모자: ${fileName} → ${storagePath}`);
        
        const uploaded = await uploadImageToStorage(filePath, storagePath);
        if (uploaded) {
          golfCapImages.push(uploaded);
          console.log(`  ✅ 성공: ${uploaded}\n`);
        } else {
          console.log(`  ❌ 실패: ${fileName}\n`);
        }
      }
    }
  }

  console.log(`\n✅ 마이그레이션 완료!`);
  console.log(`📊 버킷햇: ${bucketHatImages.length}개`);
  console.log(`📊 골프모자: ${golfCapImages.length}개`);

  return {
    bucketHatImages: bucketHatImages.sort(),
    golfCapImages: golfCapImages.sort()
  };
}

// 실행
migrateSurveyImages()
  .then((result) => {
    console.log('\n📝 다음 단계: 데이터베이스에 제품 등록 및 이미지 경로 업데이트');
    console.log('\n버킷햇 이미지 경로:');
    result.bucketHatImages.forEach(img => console.log(`  - ${img}`));
    console.log('\n골프모자 이미지 경로:');
    result.golfCapImages.forEach(img => console.log(`  - ${img}`));
    
    // 결과를 JSON 파일로 저장 (다음 스크립트에서 사용)
    fs.writeFileSync(
      path.join(process.cwd(), 'scripts/survey-images-migration-result.json'),
      JSON.stringify(result, null, 2)
    );
    console.log('\n💾 결과가 scripts/survey-images-migration-result.json에 저장되었습니다.');
  })
  .catch((error) => {
    console.error('❌ 마이그레이션 오류:', error);
    process.exit(1);
  });
