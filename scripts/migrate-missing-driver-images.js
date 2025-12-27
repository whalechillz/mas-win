/**
 * 누락된 드라이버 제품 이미지를 Supabase Storage로 마이그레이션
 * 로컬 파일을 찾아서 Storage에 업로드하고 데이터베이스 경로 업데이트
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
 * 제품별 이미지 매핑 (로컬 경로 → Storage 경로)
 */
const PRODUCT_IMAGE_MAPPING = {
  'gold2': {
    localPath: 'public/main/products/gold2',
    storagePath: 'originals/products/gold2/detail',
    images: [
      'gold2_00_01.jpg',
      'gold2_01.jpg',
    ]
  },
  'pro3': {
    localPath: 'public/main/products/pro3',
    storagePath: 'originals/products/pro3/detail',
    images: [
      'secret-force-pro-3-gallery-00.webp',
      'secret-force-pro-3-gallery-01.webp',
    ]
  },
  'v3': {
    localPath: 'public/main/products/v3',
    storagePath: 'originals/products/v3/detail',
    images: [
      'secret-force-v3-gallery-05-00.webp',
      'secret-force-v3-gallery-02.webp',
    ]
  },
  'black-weapon': {
    localPath: 'public/main/products/black-weapon',
    storagePath: 'originals/products/black-weapon/detail',
    images: [
      'secret-weapon-black-00.webp',
      'secret-weapon-black-01.webp',
    ]
  },
  'gold-weapon4': {
    localPath: 'public/main/products/gold-weapon4',
    storagePath: 'originals/products/gold-weapon4/detail',
    images: [
      'secret-weapon-gold-4-1-gallery-00-01.webp',
      'secret-weapon-gold-4-1-gallery-01.webp',
    ]
  }
};

/**
 * 한글 파일명을 영문으로 변환
 */
function convertKoreanToEnglish(fileName) {
  // 한글 파일명 매핑 (기존 스크립트에서 가져옴)
  const koreanToEnglishMap = {
    // gold2
    '마쓰구_시크릿포스_골드_2_350_long.png': 'massgoo-secret-force-gold-2-350-long.png',
    '마쓰구_시크릿포스_골드_2_500.png': 'massgoo-secret-force-gold-2-500.png',
    '마쓰구_시크릿포스_골드_2_공홈_01.png': 'massgoo-secret-force-gold-2-official-01.png',
    
    // pro3
    '마쓰구_시크릿포스_PRO_1000.png': 'massgoo-secret-force-pro-1000.png',
    '마쓰구_시크릿포스_PRO_1000.webp': 'massgoo-secret-force-pro-1000.webp',
    '마쓰구_시크릿포스_PRO_350_long.png': 'massgoo-secret-force-pro-350-long.png',
    '마쓰구_시크릿포스_PRO_350_long.webp': 'massgoo-secret-force-pro-350-long.webp',
    '마쓰구_시크릿포스_PRO_3_공홈_00.jpg': 'massgoo-secret-force-pro-3-official-00.jpg',
    '마쓰구_시크릿포스_PRO_3_공홈_01.jpg': 'massgoo-secret-force-pro-3-official-01.jpg',
    '마쓰구_시크릿포스_PRO_3_공홈_02.jpg': 'massgoo-secret-force-pro-3-official-02.jpg',
    '마쓰구_시크릿포스_PRO_3_공홈_03.jpg': 'massgoo-secret-force-pro-3-official-03.jpg',
    '마쓰구_시크릿포스_PRO_3_공홈_04.jpg': 'massgoo-secret-force-pro-3-official-04.jpg',
    '마쓰구_시크릿포스_PRO_3_공홈_05.jpg': 'massgoo-secret-force-pro-3-official-05.jpg',
    '마쓰구_시크릿포스_PRO_3_공홈_06.jpg': 'massgoo-secret-force-pro-3-official-06.jpg',
    '마쓰구_시크릿포스_PRO_3_공홈_07.jpg': 'massgoo-secret-force-pro-3-official-07.jpg',
    '마쓰구_시크릿포스_PRO_3_공홈_08.jpg': 'massgoo-secret-force-pro-3-official-08.jpg',
    '마쓰구_시크릿포스_PRO_500.png': 'massgoo-secret-force-pro-500.png',
    
    // v3
    '마쓰구_시크릿포스_V3_05_00.jpg': 'massgoo-secret-force-v3-05-00.jpg',
    '마쓰구_시크릿포스_V3_350_bg.png': 'massgoo-secret-force-v3-350-bg.png',
    '마쓰구_시크릿포스_V3_350_long.png': 'massgoo-secret-force-v3-350-long.png',
    '마쓰구_시크릿포스_V3_350_long.webp': 'massgoo-secret-force-v3-350-long.webp',
    '마쓰구_시크릿포스_V3_공홈_01.png': 'massgoo-secret-force-v3-official-01.png',
    '마쓰구_시크릿포스_V3_공홈_01.webp': 'massgoo-secret-force-v3-official-01.webp',
    '마쓰구_시크릿포스_V3_공홈_02.jpg': 'massgoo-secret-force-v3-official-02.jpg',
    '마쓰구_시크릿포스_V3_공홈_03.jpg': 'massgoo-secret-force-v3-official-03.jpg',
    '마쓰구_시크릿포스_V3_공홈_04.jpg': 'massgoo-secret-force-v3-official-04.jpg',
    '마쓰구_시크릿포스_V3_공홈_05.jpg': 'massgoo-secret-force-v3-official-05.jpg',
    '마쓰구_시크릿포스_V3_공홈_06.jpg': 'massgoo-secret-force-v3-official-06.jpg',
    '마쓰구_시크릿포스_V3_공홈_07.jpg': 'massgoo-secret-force-v3-official-07.jpg',
    '마쓰구_시크릿포스_V3_공홈_08.jpg': 'massgoo-secret-force-v3-official-08.jpg',
    '마쓰구_시크릿포스_V3_공홈_08.webp': 'massgoo-secret-force-v3-official-08.webp',
    
    // black-weapon
    '마쓰구_시크릿웨폰_블랙_500.png': 'massgoo-secret-weapon-black-500.png',
    '마쓰구_시크릿웨폰_블랙_500_long.png': 'massgoo-secret-weapon-black-500-long.png',
    '마쓰구_시크릿웨폰_블랙_500_long.webp': 'massgoo-secret-weapon-black-500-long.webp',
    '마쓰구_시크릿웨폰_블랙_공홈_00_01.jpg': 'massgoo-secret-weapon-black-official-00-01.jpg',
    '마쓰구_시크릿웨폰_블랙_공홈_01.jpg': 'massgoo-secret-weapon-black-official-01.jpg',
    '마쓰구_시크릿웨폰_블랙_공홈_01.png': 'massgoo-secret-weapon-black-official-01.png',
    '마쓰구_시크릿웨폰_블랙_공홈_02.jpg': 'massgoo-secret-weapon-black-official-02.jpg',
    '마쓰구_시크릿웨폰_블랙_공홈_03.jpg': 'massgoo-secret-weapon-black-official-03.jpg',
    '마쓰구_시크릿웨폰_블랙_공홈_04.jpg': 'massgoo-secret-weapon-black-official-04.jpg',
    '마쓰구_시크릿웨폰_블랙_공홈_05.jpg': 'massgoo-secret-weapon-black-official-05.jpg',
    '마쓰구_시크릿웨폰_블랙_공홈_06.jpg': 'massgoo-secret-weapon-black-official-06.jpg',
    '마쓰구_시크릿웨폰_블랙_공홈_07.jpg': 'massgoo-secret-weapon-black-official-07.jpg',
    '마쓰구_시크릿웨폰_블랙_공홈_08_01.jpg': 'massgoo-secret-weapon-black-official-08-01.jpg',
    
    // gold-weapon4
    '마쓰구_시크릿웨폰_4.1_500.png': 'massgoo-secret-weapon-4-1-500.png',
    '마쓰구_시크릿웨폰_4.1_공홈_00_01.webp': 'massgoo-secret-weapon-4-1-official-00-01.webp',
    '마쓰구_시크릿웨폰_4.1_공홈_01.jpg': 'massgoo-secret-weapon-4-1-official-01.jpg',
    '마쓰구_시크릿웨폰_4.1_공홈_01.webp': 'massgoo-secret-weapon-4-1-official-01.webp',
    '마쓰구_시크릿웨폰_4.1_공홈_02.webp': 'massgoo-secret-weapon-4-1-official-02.webp',
    '마쓰구_시크릿웨폰_4.1_공홈_03.webp': 'massgoo-secret-weapon-4-1-official-03.webp',
    '마쓰구_시크릿웨폰_4.1_공홈_04.webp': 'massgoo-secret-weapon-4-1-official-04.webp',
    '마쓰구_시크릿웨폰_4.1_공홈_05.webp': 'massgoo-secret-weapon-4-1-official-05.webp',
    '마쓰구_시크릿웨폰_4.1_공홈_06.webp': 'massgoo-secret-weapon-4-1-official-06.webp',
    '마쓰구_시크릿웨폰_4.1_공홈_07.webp': 'massgoo-secret-weapon-4-1-official-07.webp',
    '마쓰구_시크릿웨폰_4.1_공홈_08_01.webp': 'massgoo-secret-weapon-4-1-official-08-01.webp',
  };
  
  // 정확한 매칭이 있으면 사용
  if (koreanToEnglishMap[fileName]) {
    return koreanToEnglishMap[fileName];
  }
  
  // 매핑이 없으면 일반 변환
  let converted = fileName;
  converted = converted.replace(/마쓰구_시크릿포스_골드_2/g, 'massgoo-secret-force-gold-2');
  converted = converted.replace(/마쓰구_시크릿포스_PRO/g, 'massgoo-secret-force-pro');
  converted = converted.replace(/마쓰구_시크릿포스_V3/g, 'massgoo-secret-force-v3');
  converted = converted.replace(/마쓰구_시크릿웨폰_블랙/g, 'massgoo-secret-weapon-black');
  converted = converted.replace(/마쓰구_시크릿웨폰_4\.1/g, 'massgoo-secret-weapon-4-1');
  converted = converted.replace(/공홈/g, 'official');
  converted = converted.replace(/[가-힣]/g, '');
  converted = converted.replace(/\s+/g, '-');
  converted = converted.replace(/[^a-zA-Z0-9._-]/g, '-');
  converted = converted.replace(/-+/g, '-');
  converted = converted.replace(/^-|-$/g, '');
  
  return converted || fileName.replace(/[^a-zA-Z0-9._-]/g, '-');
}

/**
 * 이미지를 WebP로 변환하고 Storage에 업로드
 */
async function uploadImageToStorage(filePath, storagePath) {
  try {
    if (!fs.existsSync(filePath)) {
      console.log(`  ⚠️  파일 없음: ${filePath}`);
      return null;
    }
    
    const fileBuffer = fs.readFileSync(filePath);
    const ext = path.extname(filePath).toLowerCase();
    const fileName = path.basename(filePath);
    
    // 한글 파일명 변환
    const englishFileName = convertKoreanToEnglish(fileName);
    const storageDir = path.dirname(storagePath);
    let finalStoragePath = `${storageDir}/${englishFileName}`;
    
    let webpBuffer;
    
    if (ext === '.webp') {
      webpBuffer = fileBuffer;
    } else {
      webpBuffer = await sharp(fileBuffer)
        .webp({ quality: 85 })
        .toBuffer();
      finalStoragePath = finalStoragePath.replace(/\.(jpg|jpeg|png)$/i, '.webp');
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
 * 제품별 이미지 마이그레이션
 */
async function migrateProductImages(productSlug, mapping) {
  console.log(`\n📦 ${productSlug} 이미지 마이그레이션 시작...`);
  
  const localDir = path.join(process.cwd(), mapping.localPath);
  
  if (!fs.existsSync(localDir)) {
    console.log(`  ⚠️  로컬 폴더 없음: ${localDir}`);
    return [];
  }
  
  // 폴더 내 모든 이미지 파일 찾기
  const files = fs.readdirSync(localDir).filter(file => 
    /\.(webp|jpg|jpeg|png)$/i.test(file)
  );
  
  if (files.length === 0) {
    console.log(`  ⚠️  이미지 파일 없음: ${localDir}`);
    return [];
  }
  
  console.log(`  📁 발견된 파일: ${files.length}개`);
  
  const uploadedImages = [];
  
  for (const fileName of files) {
    const localFilePath = path.join(localDir, fileName);
    const storageFilePath = `${mapping.storagePath}/${fileName}`;
    
    console.log(`  📤 ${fileName} → ${storageFilePath}`);
    
    const uploaded = await uploadImageToStorage(localFilePath, storageFilePath);
    if (uploaded) {
      uploadedImages.push(uploaded);
      console.log(`    ✅ 성공`);
    } else {
      console.log(`    ❌ 실패`);
    }
  }
  
  return uploadedImages.sort();
}

/**
 * 데이터베이스 제품의 detail_images 업데이트
 */
async function updateProductImages(productSlug, imagePaths) {
  if (imagePaths.length === 0) {
    console.log(`  ⚠️  업데이트할 이미지 없음`);
    return false;
  }
  
  console.log(`\n📝 데이터베이스 업데이트: ${productSlug}`);
  
  const { data: product } = await supabase
    .from('products')
    .select('id')
    .eq('slug', productSlug)
    .single();
  
  if (!product) {
    console.log(`  ❌ 제품을 찾을 수 없음: ${productSlug}`);
    return false;
  }
  
  const { error } = await supabase
    .from('products')
    .update({
      detail_images: imagePaths,
      updated_at: new Date().toISOString()
    })
    .eq('id', product.id);
  
  if (error) {
    console.error(`  ❌ 업데이트 실패: ${error.message}`);
    return false;
  }
  
  console.log(`  ✅ 업데이트 완료: ${imagePaths.length}개 이미지`);
  return true;
}

/**
 * 메인 실행 함수
 */
async function migrateMissingImages() {
  console.log('🔄 누락된 드라이버 제품 이미지 마이그레이션 시작...\n');
  
  const results = {};
  
  for (const [productSlug, mapping] of Object.entries(PRODUCT_IMAGE_MAPPING)) {
    const uploadedImages = await migrateProductImages(productSlug, mapping);
    
    if (uploadedImages.length > 0) {
      await updateProductImages(productSlug, uploadedImages);
      results[productSlug] = {
        success: true,
        imageCount: uploadedImages.length,
        images: uploadedImages
      };
    } else {
      results[productSlug] = {
        success: false,
        reason: '이미지 파일을 찾을 수 없음'
      };
    }
  }
  
  console.log('\n📊 마이그레이션 완료 요약:');
  Object.entries(results).forEach(([slug, result]) => {
    if (result.success) {
      console.log(`  ✅ ${slug}: ${result.imageCount}개 이미지`);
    } else {
      console.log(`  ❌ ${slug}: ${result.reason}`);
    }
  });
  
  // 결과 저장
  fs.writeFileSync(
    path.join(process.cwd(), 'scripts/missing-images-migration-result.json'),
    JSON.stringify(results, null, 2)
  );
  
  console.log('\n💾 결과가 scripts/missing-images-migration-result.json에 저장되었습니다.');
}

// 실행
migrateMissingImages()
  .then(() => {
    console.log('\n✅ 작업 완료!');
    console.log('\n📋 확인 사항:');
    console.log('1. 메인 페이지에서 이미지 표시 확인');
    console.log('2. /admin/products 페이지에서 제품 확인');
  })
  .catch((error) => {
    console.error('❌ 오류 발생:', error);
    process.exit(1);
  });

