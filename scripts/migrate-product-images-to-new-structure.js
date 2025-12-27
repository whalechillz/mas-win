/**
 * 제품 이미지를 새로운 구조로 마이그레이션
 * 기존: /main/products/{product-slug}/
 * 신규: /originals/products/{product-slug}/{type}/
 * 
 * type: detail, composition, gallery
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
 * 파일명을 기반으로 이미지 타입 결정
 */
function determineImageType(fileName) {
  const lowerName = fileName.toLowerCase();
  
  // 합성용 이미지 (배경 없는 순수 제품)
  if (
    lowerName.includes('-sole-') ||
    lowerName.includes('-500') ||
    lowerName.includes('-500-long') ||
    lowerName.includes('composition') ||
    lowerName.includes('composed')
  ) {
    return 'composition';
  }
  
  // 갤러리 이미지
  if (lowerName.includes('gallery-')) {
    return 'gallery';
  }
  
  // 기본값: 상세페이지용
  return 'detail';
}

/**
 * 제품 slug를 기반으로 Storage 경로 결정
 */
function getProductStoragePath(productSlug, category, imageType) {
  // 굿즈/액세서리도 제품별 폴더 구조 사용
  if (category === 'hat' || category === 'accessory') {
    return `originals/products/goods/${productSlug}/${imageType}`;
  }

  // 드라이버 제품 slug → 폴더 매핑
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
  return `originals/products/${folderName}/${imageType}`;
}

/**
 * 이미지 파일을 WebP로 변환하고 Storage에 업로드
 */
async function uploadImageToStorage(filePath, storagePath) {
  try {
    const fileBuffer = fs.readFileSync(filePath);
    const ext = path.extname(filePath).toLowerCase();
    
    let webpBuffer;
    
    if (ext === '.webp') {
      webpBuffer = fileBuffer;
    } else {
      webpBuffer = await sharp(fileBuffer)
        .webp({ quality: 85 })
        .toBuffer();
    }

    // WebP 확장자로 변경
    const webpPath = storagePath.replace(/\.(jpg|jpeg|png)$/i, '.webp');
    
    const { data, error } = await supabase.storage
      .from('blog-images')
      .upload(webpPath, webpBuffer, {
        contentType: 'image/webp',
        cacheControl: '3600',
        upsert: true
      });

    if (error) {
      console.error(`  ❌ 업로드 실패: ${error.message}`);
      return null;
    }

    return webpPath;
  } catch (error) {
    console.error(`  ❌ 처리 실패: ${error.message}`);
    return null;
  }
}

/**
 * 폴더의 모든 이미지 파일을 재귀적으로 찾기
 */
function getAllImageFiles(dir, fileList = []) {
  if (!fs.existsSync(dir)) {
    return fileList;
  }
  
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
  console.log('🔄 제품 이미지 새 구조 마이그레이션 시작...\n');

  const productsDir = path.join(process.cwd(), 'public/main/products');
  
  if (!fs.existsSync(productsDir)) {
    console.error(`❌ 제품 폴더를 찾을 수 없습니다: ${productsDir}`);
    process.exit(1);
  }

  const migrationLog = {
    success: [],
    failed: [],
    summary: {
      detail: 0,
      composition: 0,
      gallery: 0,
      total: 0
    }
  };

  // goods 폴더 처리 (제품별로 분리 필요)
  const goodsDir = path.join(productsDir, 'goods');
  if (fs.existsSync(goodsDir)) {
    console.log('📁 goods 폴더 처리 중...');
    const goodsFiles = getAllImageFiles(goodsDir);
    
    // goods는 파일명에서 제품명 추출 (예: white-bucket-hat.webp → white-bucket-hat)
    const goodsByProduct = {};
    
    goodsFiles.forEach(filePath => {
      const fileName = path.basename(filePath);
      // 파일명에서 제품명 추출 (예: white-bucket-hat.webp → white-bucket-hat)
      const productName = fileName.split('.')[0].replace(/[-_]/g, '-');
      if (!goodsByProduct[productName]) {
        goodsByProduct[productName] = [];
      }
      goodsByProduct[productName].push(filePath);
    });
    
    for (const [productSlug, files] of Object.entries(goodsByProduct)) {
      console.log(`  📦 ${productSlug} 제품 처리 중...`);
      
      for (const filePath of files) {
        const fileName = path.basename(filePath);
        const imageType = determineImageType(fileName);
        const storageFolder = getProductStoragePath(productSlug, 'hat', imageType);
        const storagePath = `${storageFolder}/${fileName}`;
        
        console.log(`    📤 ${fileName} → ${storagePath} [${imageType}]`);
        const uploaded = await uploadImageToStorage(filePath, storagePath);
        
        if (uploaded) {
          migrationLog.success.push({
            original: filePath,
            new: uploaded,
            type: imageType
          });
          migrationLog.summary[imageType]++;
          migrationLog.summary.total++;
        } else {
          migrationLog.failed.push({
            original: filePath,
            type: imageType
          });
        }
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

  // 폴더명 → slug 매핑
  const folderToSlug = {
    'black-beryl': 'black-beryl',
    'black-weapon': 'secret-weapon-black',
    'gold-weapon4': 'secret-weapon-4-1',
    'gold2': 'secret-force-gold-2',
    'gold2-sapphire': 'gold2-sapphire',
    'pro3': 'secret-force-pro-3',
    'pro3-muziik': 'pro3-muziik',
    'v3': 'secret-force-v3',
  };

  for (const folderName of driverFolders) {
    const folderPath = path.join(productsDir, folderName);
    if (!fs.existsSync(folderPath)) {
      console.log(`⚠️  폴더 없음: ${folderName}`);
      continue;
    }

    const productSlug = folderToSlug[folderName] || folderName;
    console.log(`📁 ${folderName} 폴더 처리 중... (slug: ${productSlug})`);
    
    const files = getAllImageFiles(folderPath);
    
    for (const filePath of files) {
      const fileName = path.basename(filePath);
      const imageType = determineImageType(fileName);
      const storageFolder = getProductStoragePath(productSlug, 'driver', imageType);
      const storagePath = `${storageFolder}/${fileName}`;
      
      console.log(`  📤 ${fileName} → ${storagePath} [${imageType}]`);
      const uploaded = await uploadImageToStorage(filePath, storagePath);
      
      if (uploaded) {
        migrationLog.success.push({
          original: filePath,
          new: uploaded,
          type: imageType,
          product: productSlug
        });
        migrationLog.summary[imageType]++;
        migrationLog.summary.total++;
      } else {
        migrationLog.failed.push({
          original: filePath,
          type: imageType,
          product: productSlug
        });
      }
    }
    
    console.log(`\n✅ ${folderName} 폴더 완료: ${files.length}개 파일\n`);
  }

  // 마이그레이션 로그 저장
  const logPath = path.join(process.cwd(), 'migration-log-product-images.json');
  fs.writeFileSync(logPath, JSON.stringify(migrationLog, null, 2));
  
  console.log('\n📊 마이그레이션 요약:');
  console.log(`  ✅ 성공: ${migrationLog.success.length}개`);
  console.log(`  ❌ 실패: ${migrationLog.failed.length}개`);
  console.log(`  📁 detail: ${migrationLog.summary.detail}개`);
  console.log(`  🔧 composition: ${migrationLog.summary.composition}개`);
  console.log(`  🖼️  gallery: ${migrationLog.summary.gallery}개`);
  console.log(`\n📝 로그 저장: ${logPath}`);
  console.log('\n🎉 마이그레이션 완료!');
  
  return migrationLog;
}

// 실행
migrateProductImages().catch(error => {
  console.error('❌ 마이그레이션 중 오류 발생:', error);
  process.exit(1);
});

