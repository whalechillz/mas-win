/**
 * 한글 파일명 처리 및 중복 파일 정리 스크립트
 * 1. 한글 파일명을 영문으로 변환하여 새 구조로 마이그레이션
 * 2. 중복 파일 찾아서 정리
 * 3. goods 폴더에서 잘못된 이미지 제거
 */

require('dotenv').config({ path: '.env.local' });

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const crypto = require('crypto');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Supabase 환경 변수가 설정되지 않았습니다.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

/**
 * 한글 파일명을 영문으로 변환하는 매핑
 */
const koreanToEnglishMap = {
  // black-beryl
  '마쓰구_시크릿웨폰_블랙_500.png': 'massgoo-secret-weapon-black-500.png',
  '마쓰구_시크릿웨폰_블랙_500_long.png': 'massgoo-secret-weapon-black-500-long.png',
  '마쓰구_시크릿웨폰_블랙_공홈_01.png': 'massgoo-secret-weapon-black-official-01.png',
  
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
  
  // gold2
  '마쓰구_시크릿포스_골드_2_350_long.png': 'massgoo-secret-force-gold-2-350-long.png',
  '마쓰구_시크릿포스_골드_2_500.png': 'massgoo-secret-force-gold-2-500.png',
  '마쓰구_시크릿포스_골드_2_공홈_01.png': 'massgoo-secret-force-gold-2-official-01.png',
  
  // gold2-sapphire
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
};

/**
 * 한글 파일명을 영문으로 변환
 */
function convertKoreanToEnglish(fileName) {
  // 매핑이 있으면 사용
  if (koreanToEnglishMap[fileName]) {
    return koreanToEnglishMap[fileName];
  }
  
  // 확장자 분리
  const ext = path.extname(fileName);
  const nameWithoutExt = fileName.replace(/\.[^.]+$/, '');
  
  // 한글 단어 매핑
  const koreanWordMap = {
    '마쓰구': 'massgoo',
    '시크릿웨폰': 'secret-weapon',
    '시크릿포스': 'secret-force',
    '블랙': 'black',
    '골드': 'gold',
    '공홈': 'official',
    'PRO': 'pro',
    'V3': 'v3',
    '롱': 'long',
    '백': 'bg',
    '베릴': 'beryl',
    '사파이어': 'sapphire',
  };
  
  let english = nameWithoutExt;
  
  // 한글 단어를 영문으로 치환
  const sortedKeys = Object.keys(koreanWordMap).sort((a, b) => b.length - a.length);
  for (const korean of sortedKeys) {
    const englishWord = koreanWordMap[korean];
    const escapedKorean = korean.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    english = english.replace(new RegExp(escapedKorean, 'g'), englishWord);
  }
  
  // 언더스코어를 하이픈으로 변환
  english = english.replace(/_/g, '-');
  
  // 남은 한글 완전 제거
  english = english.replace(/[\uAC00-\uD7A3\u3131-\u318E\u1100-\u11FF]/g, '');
  
  // 숫자와 점(.)은 유지하되, 연속된 점은 하이픈으로 변환
  english = english.replace(/\.+/g, '-');
  
  // 정리: 연속된 하이픈 제거, 소문자 변환
  english = english
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase();
  
  // 빈 문자열이면 기본값 사용
  if (!english) {
    english = 'image';
  }
  
  // 확장자 추가
  return english + ext;
}

/**
 * 파일명을 기반으로 이미지 타입 결정
 */
function determineImageType(fileName) {
  const lowerName = fileName.toLowerCase();
  
  if (
    lowerName.includes('-sole-') ||
    lowerName.includes('-500') ||
    lowerName.includes('-500-long') ||
    lowerName.includes('composition') ||
    lowerName.includes('composed')
  ) {
    return 'composition';
  }
  
  if (lowerName.includes('gallery-')) {
    return 'gallery';
  }
  
  return 'detail';
}

/**
 * 제품 slug를 기반으로 Storage 경로 결정
 */
function getProductStoragePath(productSlug, category, imageType) {
  if (category === 'hat' || category === 'accessory') {
    return `originals/products/goods/${productSlug}/${imageType}`;
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
 * 한글이 포함된 파일명인지 확인
 */
function hasKoreanCharacters(fileName) {
  return /[가-힣ㄱ-ㅎㅏ-ㅣ]/.test(fileName);
}

/**
 * Storage에서 중복 파일 찾기
 */
async function findDuplicatesInStorage() {
  console.log('🔍 Storage에서 중복 파일 검색 중...\n');
  
  const productFolders = [
    'originals/products/black-beryl',
    'originals/products/black-weapon',
    'originals/products/gold-weapon4',
    'originals/products/gold2',
    'originals/products/gold2-sapphire',
    'originals/products/pro3',
    'originals/products/pro3-muziik',
    'originals/products/v3',
    'originals/products/goods'
  ];

  const allFiles = new Map(); // fileName -> [{path, folder, ...}]
  
  // 모든 제품 폴더에서 파일명 수집
  for (const folder of productFolders) {
    const getAllFilesRecursive = async (currentFolder) => {
      const { data: files, error } = await supabase.storage
        .from('blog-images')
        .list(currentFolder, {
          limit: 1000
        });
      
      if (error) {
        console.log(`  ⚠️  ${currentFolder} 조회 실패: ${error.message}`);
        return;
      }
      
      if (!files || files.length === 0) return;
      
      for (const file of files) {
        if (!file.id) {
          // 폴더인 경우 재귀
          await getAllFilesRecursive(`${currentFolder}/${file.name}`);
        } else {
          // 파일인 경우
          const fileName = file.name.toLowerCase();
          const fullPath = `${currentFolder}/${file.name}`;
          
          if (!allFiles.has(fileName)) {
            allFiles.set(fileName, []);
          }
          allFiles.get(fileName).push({
            path: fullPath,
            folder: currentFolder,
            name: file.name,
            size: file.metadata?.size || 0,
            created_at: file.created_at
          });
        }
      }
    };
    
    await getAllFilesRecursive(folder);
  }
  
  // 중복 파일 찾기 (같은 파일명이 여러 경로에 있는 경우)
  const duplicates = [];
  allFiles.forEach((paths, fileName) => {
    if (paths.length > 1) {
      // goods 폴더에 있는 파일들
      const goodsPaths = paths.filter(p => p.folder.includes('goods/'));
      // 다른 제품 폴더에 있는 파일들
      const otherPaths = paths.filter(p => !p.folder.includes('goods/'));
      
      // goods 폴더 내에서 중복 (루트와 제품별 폴더)
      const goodsRootPaths = goodsPaths.filter(p => 
        p.path.match(/^originals\/products\/goods\/[^/]+\.(webp|jpg|jpeg|png)$/)
      );
      const goodsProductPaths = goodsPaths.filter(p => 
        p.path.match(/^originals\/products\/goods\/[^/]+\/(detail|composition|gallery)\//)
      );
      
      if (goodsRootPaths.length > 0 && goodsProductPaths.length > 0) {
        // goods 루트와 제품별 폴더에 모두 있는 경우
        duplicates.push({
          fileName,
          goodsPaths: goodsRootPaths,
          otherPaths: goodsProductPaths,
          issue: 'goods 루트와 제품별 폴더에 중복'
        });
      } else if (goodsPaths.length > 0 && otherPaths.length > 0) {
        // goods 폴더에 있으면서 다른 제품 폴더(black-weapon, black-beryl 등)에도 있는 경우
        const driverPaths = otherPaths.filter(p => 
          p.folder.includes('black-weapon') || 
          p.folder.includes('black-beryl') ||
          p.folder.includes('gold-weapon4') ||
          p.folder.includes('gold2') ||
          p.folder.includes('pro3') ||
          p.folder.includes('v3')
        );
        
        if (driverPaths.length > 0) {
          // 드라이버 제품 이미지가 goods 폴더에도 있는 경우
          duplicates.push({
            fileName,
            goodsPaths,
            otherPaths: driverPaths,
            issue: 'goods 폴더에 드라이버 제품 이미지가 잘못 배치됨'
          });
        }
      } else if (paths.length > 1) {
        // 일반 중복 (같은 제품 폴더 내에서)
        duplicates.push({
          fileName,
          paths,
          issue: '같은 파일명이 여러 경로에 있음'
        });
      }
    }
  });
  
  return duplicates;
}

/**
 * 마이그레이션 실행
 */
async function migrateKoreanFilesAndFixDuplicates() {
  console.log('🔄 한글 파일명 처리 및 중복 파일 정리 시작...\n');

  const productsDir = path.join(process.cwd(), 'public/main/products');
  
  if (!fs.existsSync(productsDir)) {
    console.error(`❌ 제품 폴더를 찾을 수 없습니다: ${productsDir}`);
    process.exit(1);
  }

  const migrationLog = {
    success: [],
    failed: [],
    duplicates: [],
    removedFromGoods: [],
    summary: {
      detail: 0,
      composition: 0,
      gallery: 0,
      total: 0,
      koreanFiles: 0,
      duplicateFiles: 0
    }
  };

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

  // 백업 폴더에서 한글 파일명 찾기
  const backupDir = path.join(process.cwd(), 'backup/product-images');
  const backupFolders = fs.existsSync(backupDir) 
    ? fs.readdirSync(backupDir).filter(f => {
        const fullPath = path.join(backupDir, f);
        return fs.statSync(fullPath).isDirectory();
      })
    : [];
  
  if (backupFolders.length > 0) {
    console.log('📦 백업 폴더에서 한글 파일명 검색 중...\n');
    const latestBackup = backupFolders.sort().reverse()[0];
    const backupProductsDir = path.join(backupDir, latestBackup);
    
    // 드라이버 제품 폴더 처리 (백업에서)
    for (const folderName of driverFolders) {
      const folderPath = path.join(backupProductsDir, folderName);
      if (!fs.existsSync(folderPath)) {
        continue;
      }

      const productSlug = folderToSlug[folderName] || folderName;
      console.log(`📁 백업: ${folderName} 폴더 처리 중... (slug: ${productSlug})`);
      
      const files = getAllImageFiles(folderPath);
      const koreanFiles = files.filter(filePath => {
        const fileName = path.basename(filePath);
        return hasKoreanCharacters(fileName);
      });
      
      if (koreanFiles.length === 0) {
        console.log(`  ℹ️  한글 파일명 없음\n`);
        continue;
      }
      
      console.log(`  🔍 한글 파일명 발견: ${koreanFiles.length}개`);
      
      for (const filePath of koreanFiles) {
        const fileName = path.basename(filePath);
        const englishFileName = convertKoreanToEnglish(fileName);
        
        // 변환 결과 검증
        if (hasKoreanCharacters(englishFileName)) {
          console.error(`  ❌ 변환 실패: ${fileName} → ${englishFileName}`);
          migrationLog.failed.push({
            original: filePath,
            reason: '한글 변환 실패'
          });
          continue;
        }
        
        const imageType = determineImageType(englishFileName);
        const storageFolder = getProductStoragePath(productSlug, 'driver', imageType);
        const storagePath = `${storageFolder}/${englishFileName}`;
        
        console.log(`  📤 ${fileName} → ${englishFileName} [${imageType}]`);
        const result = await uploadImageToStorage(filePath, storagePath);
        
        if (result) {
          migrationLog.success.push({
            original: filePath,
            new: result,
            type: imageType,
            product: productSlug
          });
          migrationLog.summary[imageType]++;
          migrationLog.summary.total++;
          migrationLog.summary.koreanFiles++;
        } else {
          migrationLog.failed.push({
            original: filePath,
            reason: '업로드 실패'
          });
        }
      }
      
      console.log(`\n✅ ${folderName} 폴더 완료\n`);
    }
  } else {
    console.log('📦 백업 폴더 없음, 원본 폴더에서 검색...\n');
    
    // 드라이버 제품 폴더 처리 (원본에서)
    for (const folderName of driverFolders) {
      const folderPath = path.join(productsDir, folderName);
      if (!fs.existsSync(folderPath)) {
        continue;
      }

      const productSlug = folderToSlug[folderName] || folderName;
      console.log(`📁 ${folderName} 폴더 처리 중... (slug: ${productSlug})`);
      
      const files = getAllImageFiles(folderPath);
      const koreanFiles = files.filter(filePath => {
        const fileName = path.basename(filePath);
        return hasKoreanCharacters(fileName);
      });
      
      if (koreanFiles.length === 0) {
        console.log(`  ℹ️  한글 파일명 없음\n`);
        continue;
      }
      
      console.log(`  🔍 한글 파일명 발견: ${koreanFiles.length}개`);
      
      for (const filePath of koreanFiles) {
        const fileName = path.basename(filePath);
        const englishFileName = convertKoreanToEnglish(fileName);
        
        // 변환 결과 검증
        if (hasKoreanCharacters(englishFileName)) {
          console.error(`  ❌ 변환 실패: ${fileName} → ${englishFileName}`);
          migrationLog.failed.push({
            original: filePath,
            reason: '한글 변환 실패'
          });
          continue;
        }
        
        const imageType = determineImageType(englishFileName);
        const storageFolder = getProductStoragePath(productSlug, 'driver', imageType);
        const storagePath = `${storageFolder}/${englishFileName}`;
        
        console.log(`  📤 ${fileName} → ${englishFileName} [${imageType}]`);
        const result = await uploadImageToStorage(filePath, storagePath);
        
        if (result) {
          migrationLog.success.push({
            original: filePath,
            new: result,
            type: imageType,
            product: productSlug
          });
          migrationLog.summary[imageType]++;
          migrationLog.summary.total++;
          migrationLog.summary.koreanFiles++;
        } else {
          migrationLog.failed.push({
            original: filePath,
            reason: '업로드 실패'
          });
        }
      }
      
      console.log(`\n✅ ${folderName} 폴더 완료\n`);
    }
  }

  // Storage에서 중복 파일 찾기 및 정리
  console.log('🔍 Storage에서 중복 파일 검색 중...\n');
  const duplicates = await findDuplicatesInStorage();
  
  console.log(`📊 중복 파일 그룹: ${duplicates.length}개\n`);
  
  // goods 폴더에서 잘못된 파일 제거
  for (const dup of duplicates) {
    if (dup.goodsPaths && dup.goodsPaths.length > 0) {
      console.log(`⚠️  goods 폴더에서 중복 파일 발견: ${dup.fileName}`);
      console.log(`   goods 경로들: ${dup.goodsPaths.map(p => p.path).join(', ')}`);
      console.log(`   다른 경로들: ${dup.otherPaths.map(p => p.path).join(', ')}`);
      
      // goods 루트 폴더의 파일 삭제 (제품별 폴더의 파일은 유지)
      for (const goodsPath of dup.goodsPaths) {
        // goods 루트에 있는 파일만 삭제 (예: originals/products/goods/file.webp)
        // 제품별 폴더의 파일은 유지 (예: originals/products/goods/{product}/detail/file.webp)
        if (goodsPath.path.match(/^originals\/products\/goods\/[^/]+\.(webp|jpg|jpeg|png)$/)) {
          console.log(`   🗑️  삭제 (goods 루트): ${goodsPath.path}`);
          const { error } = await supabase.storage
            .from('blog-images')
            .remove([goodsPath.path]);
          
          if (!error) {
            migrationLog.removedFromGoods.push({
              fileName: dup.fileName,
              path: goodsPath.path,
              reason: 'goods 루트 폴더의 중복 파일'
            });
          } else {
            console.error(`   ❌ 삭제 실패: ${error.message}`);
          }
        } else {
          console.log(`   ✅ 유지 (제품별 폴더): ${goodsPath.path}`);
        }
      }
      
      // 다른 제품 폴더(black-weapon, black-beryl 등)에 있는 파일이 goods 폴더에도 있는 경우
      for (const otherPath of dup.otherPaths) {
        if (otherPath.folder.includes('goods/')) {
          // goods 폴더에 있지만 제품별 폴더가 아닌 경우 (잘못된 위치)
          if (!otherPath.path.match(/^originals\/products\/goods\/[^/]+\/(detail|composition|gallery)\//)) {
            console.log(`   🗑️  삭제 (잘못된 위치): ${otherPath.path}`);
            const { error } = await supabase.storage
              .from('blog-images')
              .remove([otherPath.path]);
            
            if (!error) {
              migrationLog.removedFromGoods.push({
                fileName: dup.fileName,
                path: otherPath.path,
                reason: 'goods 폴더의 잘못된 위치에 있는 파일'
              });
            }
          }
        } else if (otherPath.folder.includes('black-weapon') || otherPath.folder.includes('black-beryl')) {
          // black-weapon이나 black-beryl 폴더의 파일이 goods에도 있는 경우
          const goodsDuplicate = dup.goodsPaths.find(gp => 
            gp.path.includes('goods/') && 
            !gp.path.match(/^originals\/products\/goods\/[^/]+\/(detail|composition|gallery)\//)
          );
          if (goodsDuplicate) {
            console.log(`   🗑️  삭제 (goods에 잘못 배치된 드라이버 이미지): ${goodsDuplicate.path}`);
            const { error } = await supabase.storage
              .from('blog-images')
              .remove([goodsDuplicate.path]);
            
            if (!error) {
              migrationLog.removedFromGoods.push({
                fileName: dup.fileName,
                path: goodsDuplicate.path,
                reason: 'goods 폴더에 잘못 배치된 드라이버 제품 이미지'
              });
            }
          }
        }
      }
      console.log('');
    }
  }

  // 마이그레이션 로그 저장
  const logPath = path.join(process.cwd(), 'migration-log-korean-files.json');
  fs.writeFileSync(logPath, JSON.stringify(migrationLog, null, 2));
  
  console.log('\n📊 마이그레이션 요약:');
  console.log(`  ✅ 성공: ${migrationLog.success.length}개`);
  console.log(`  ❌ 실패: ${migrationLog.failed.length}개`);
  console.log(`  🗑️  goods 폴더에서 제거: ${migrationLog.removedFromGoods.length}개`);
  console.log(`  📁 detail: ${migrationLog.summary.detail}개`);
  console.log(`  🔧 composition: ${migrationLog.summary.composition}개`);
  console.log(`  🖼️  gallery: ${migrationLog.summary.gallery}개`);
  console.log(`\n📝 로그 저장: ${logPath}`);
  console.log('\n🎉 한글 파일명 처리 및 중복 파일 정리 완료!');
  
  return migrationLog;
}

// 실행
migrateKoreanFilesAndFixDuplicates().catch(error => {
  console.error('❌ 마이그레이션 중 오류 발생:', error);
  process.exit(1);
});

