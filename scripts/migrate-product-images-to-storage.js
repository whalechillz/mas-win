/**
 * 제품 이미지를 Supabase Storage로 마이그레이션
 * 로컬 public/main/products/ 폴더의 이미지를 Supabase Storage의 originals/products/ 구조로 업로드
 */

// 환경 변수 로드 (.env.local)
require('dotenv').config({ path: '.env.local' });

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Supabase 환경 변수가 설정되지 않았습니다.');
  console.error('NEXT_PUBLIC_SUPABASE_URL과 SUPABASE_SERVICE_ROLE_KEY를 설정해주세요.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

/**
 * 제품 slug를 기반으로 Storage 경로 결정
 */
function getProductStoragePath(productSlug, category) {
  if (category === 'hat' || category === 'accessory') {
    return 'originals/products/goods';
  }

  const driverSlugToFolder = {
    'secret-weapon-black': 'black-weapon',
    'black-beryl': 'black-beryl',
    'secret-weapon-4-1': 'gold-weapon4',
    'secret-force-gold-2': 'gold2',
    'gold2-sapphire': 'gold2-sapphire',
    'secret-force-pro-3': 'pro3',
    'pro3-muziik': 'pro3-muziik',
    'secret-force-v3': 'v3',
  };

  const folderName = driverSlugToFolder[productSlug] || productSlug;
  return `originals/products/${folderName}`;
}

/**
 * 이미지 파일을 WebP로 변환하고 Storage에 업로드
 */
async function uploadImageToStorage(filePath, storagePath) {
  try {
    // 파일 읽기
    const fileBuffer = fs.readFileSync(filePath);
    const ext = path.extname(filePath).toLowerCase();
    
    let webpBuffer;
    
    // 이미 WebP인 경우 그대로 사용, 아니면 변환
    if (ext === '.webp') {
      webpBuffer = fileBuffer;
    } else {
      webpBuffer = await sharp(fileBuffer)
        .webp({ quality: 85 })
        .toBuffer();
    }

    // Storage에 업로드
    const { data, error } = await supabase.storage
      .from('blog-images')
      .upload(storagePath, webpBuffer, {
        contentType: 'image/webp',
        cacheControl: '3600',
        upsert: true // 이미 있으면 덮어쓰기
      });

    if (error) {
      console.error(`  ❌ 업로드 실패: ${error.message}`);
      return null;
    }

    return storagePath;
  } catch (error) {
    console.error(`  ❌ 처리 실패: ${error.message}`);
    return null;
  }
}

/**
 * 폴더의 모든 이미지 파일을 재귀적으로 찾기
 */
function getAllImageFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      getAllImageFiles(filePath, fileList);
    } else if (/\.(jpg|jpeg|png|webp)$/i.test(file)) {
      fileList.push(filePath);
    }
  });
  
  return fileList;
}

/**
 * 마이그레이션 실행
 */
async function migrateProductImages() {
  console.log('🔄 제품 이미지 마이그레이션 시작...\n');

  const productsDir = path.join(process.cwd(), 'public/main/products');
  
  if (!fs.existsSync(productsDir)) {
    console.error(`❌ 제품 폴더를 찾을 수 없습니다: ${productsDir}`);
    process.exit(1);
  }

  // goods 폴더 (모자, 파우치)
  const goodsDir = path.join(productsDir, 'goods');
  if (fs.existsSync(goodsDir)) {
    console.log('📁 goods 폴더 처리 중...');
    const goodsFiles = getAllImageFiles(goodsDir);
    const storageFolder = 'originals/products/goods';
    
    for (const filePath of goodsFiles) {
      const fileName = path.basename(filePath);
      const storagePath = `${storageFolder}/${fileName}`;
      
      console.log(`  📤 ${fileName} → ${storagePath}`);
      const uploaded = await uploadImageToStorage(filePath, storagePath);
      if (uploaded) {
        console.log(`  ✅ 성공: ${uploaded}`);
      }
    }
    console.log(`\n✅ goods 폴더 완료: ${goodsFiles.length}개 파일\n`);
  }

  // 드라이버 제품 폴더들
  const driverFolders = [
    'black-beryl',
    'black-weapon',
    'gold-weapon4',
    'gold2',
    'gold2-sapphire',
    'pro3',
    'pro3-muziik',
    'v3',
  ];

  for (const folderName of driverFolders) {
    const folderPath = path.join(productsDir, folderName);
    if (!fs.existsSync(folderPath)) {
      console.log(`⚠️  폴더 없음: ${folderName}`);
      continue;
    }

    console.log(`📁 ${folderName} 폴더 처리 중...`);
    const files = getAllImageFiles(folderPath);
    const storageFolder = `originals/products/${folderName}`;
    
    for (const filePath of files) {
      const relativePath = path.relative(folderPath, filePath);
      const storagePath = `${storageFolder}/${relativePath.replace(/\\/g, '/')}`;
      
      console.log(`  📤 ${relativePath} → ${storagePath}`);
      const uploaded = await uploadImageToStorage(filePath, storagePath);
      if (uploaded) {
        console.log(`  ✅ 성공: ${uploaded}`);
      }
    }
    console.log(`\n✅ ${folderName} 폴더 완료: ${files.length}개 파일\n`);
  }

  console.log('🎉 마이그레이션 완료!');
}

// 실행
migrateProductImages().catch(error => {
  console.error('❌ 마이그레이션 중 오류 발생:', error);
  process.exit(1);
});

