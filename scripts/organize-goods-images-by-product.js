/**
 * products/goods 폴더의 이미지를 제품별로 분리하고 재구성
 * 파일명 패턴을 분석하여 제품별 폴더로 이동
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

/**
 * 파일명을 분석하여 제품 slug 추출
 */
function extractProductSlug(fileName) {
  const lowerName = fileName.toLowerCase();
  
  // 버킷햇 패턴
  if (lowerName.includes('bucket-hat-muziik') || lowerName.includes('bucket-hat')) {
    return 'bucket-hat-muziik';
  }
  
  // 골프모자 패턴
  if (lowerName.includes('golf-hat-muziik') || lowerName.includes('golf-cap') || lowerName.includes('golf-hat')) {
    return 'golf-hat-muziik';
  }
  
  // 클러치백 패턴
  if (lowerName.includes('clutch')) {
    if (lowerName.includes('beige') || lowerName.includes('베이지')) {
      return 'massgoo-muziik-clutch-beige';
    }
    if (lowerName.includes('gray') || lowerName.includes('grey') || lowerName.includes('그레이')) {
      return 'massgoo-muziik-clutch-gray';
    }
    return 'massgoo-muziik-clutch-beige'; // 기본값
  }
  
  // 마쓰구 캡 패턴
  if (lowerName.includes('massgoo-white-cap') || lowerName.includes('massgoo-white')) {
    return 'massgoo-white-cap';
  }
  if (lowerName.includes('massgoo-black-cap') || lowerName.includes('massgoo-black')) {
    return 'massgoo-black-cap';
  }
  
  // MAS 한정판 모자
  if (lowerName.includes('mas-limited-cap')) {
    if (lowerName.includes('gray') || lowerName.includes('grey')) {
      return 'mas-limited-cap-gray';
    }
    if (lowerName.includes('black')) {
      return 'mas-limited-cap-black';
    }
  }
  
  // 색상별 골프모자
  if (lowerName.includes('white-golf-cap') || lowerName.includes('white-golf')) {
    return 'white-golf-cap';
  }
  if (lowerName.includes('black-golf-cap') || lowerName.includes('black-golf')) {
    return 'black-golf-cap';
  }
  if (lowerName.includes('navy-golf-cap') || lowerName.includes('navy-golf')) {
    return 'navy-golf-cap';
  }
  if (lowerName.includes('beige-golf-cap') || lowerName.includes('beige-golf')) {
    return 'beige-golf-cap';
  }
  
  // 색상별 버킷햇
  if (lowerName.includes('white-bucket-hat') || lowerName.includes('white-bucket')) {
    return 'white-bucket-hat';
  }
  if (lowerName.includes('black-bucket-hat') || lowerName.includes('black-bucket')) {
    return 'black-bucket-hat';
  }
  
  return null; // 매칭되지 않음
}

/**
 * 이미지 타입 결정 (detail, composition, gallery)
 */
function determineImageType(fileName) {
  const lowerName = fileName.toLowerCase();
  
  // 합성용 이미지
  if (lowerName.includes('-sole-') || lowerName.includes('-500') || lowerName.includes('composition')) {
    return 'composition';
  }
  
  // 갤러리 이미지 (착용 이미지, 여러 각도 등)
  if (lowerName.includes('gallery') || lowerName.includes('wear') || lowerName.includes('착용')) {
    return 'gallery';
  }
  
  // 기본값: 상세페이지용
  return 'gallery'; // 설문 페이지용이므로 gallery로 분류
}

/**
 * products/goods 폴더의 모든 파일 조회
 */
async function listGoodsFiles() {
  console.log('🔍 products/goods 폴더의 파일 조회 중...\n');
  
  const goodsPath = 'originals/products/goods';
  let allFiles = [];
  let offset = 0;
  const batchSize = 1000;
  
  while (true) {
    const { data: files, error } = await supabase.storage
      .from('blog-images')
      .list(goodsPath, {
        limit: batchSize,
        offset: offset,
        sortBy: { column: 'name', order: 'asc' }
      });
    
    if (error) {
      console.error('❌ 파일 조회 오류:', error.message);
      break;
    }
    
    if (!files || files.length === 0) {
      break;
    }
    
    // 파일만 필터링 (폴더 제외)
    const imageFiles = files.filter(f => f.id && /\.(webp|jpg|jpeg|png)$/i.test(f.name));
    allFiles = allFiles.concat(imageFiles.map(f => ({
      name: f.name,
      path: `${goodsPath}/${f.name}`,
      size: f.metadata?.size || f.size,
      created: f.created_at
    })));
    
    offset += batchSize;
    if (files.length < batchSize) {
      break;
    }
  }
  
  console.log(`📊 발견된 이미지 파일: ${allFiles.length}개\n`);
  return allFiles;
}

/**
 * 제품별로 이미지 분류
 */
function categorizeImages(files) {
  const categorized = {};
  const uncategorized = [];
  
  for (const file of files) {
    const productSlug = extractProductSlug(file.name);
    
    if (productSlug) {
      if (!categorized[productSlug]) {
        categorized[productSlug] = [];
      }
      categorized[productSlug].push(file);
    } else {
      uncategorized.push(file);
    }
  }
  
  return { categorized, uncategorized };
}

/**
 * 이미지를 제품별 폴더로 이동
 */
async function moveImageToProductFolder(file, productSlug, imageType) {
  const fileName = path.basename(file.path);
  const newPath = `originals/products/goods/${productSlug}/${imageType}/${fileName}`;
  
  // 이미 올바른 위치에 있으면 스킵
  if (file.path === newPath) {
    return { moved: false, path: newPath };
  }
  
  try {
    // 파일 복사 (이동)
    const { data: downloadData, error: downloadError } = await supabase.storage
      .from('blog-images')
      .download(file.path);
    
    if (downloadError) {
      console.error(`  ❌ 다운로드 실패: ${file.path}`, downloadError.message);
      return { moved: false, error: downloadError.message };
    }
    
    // 새 위치에 업로드
    const { error: uploadError } = await supabase.storage
      .from('blog-images')
      .upload(newPath, downloadData, {
        contentType: 'image/webp',
        cacheControl: '3600',
        upsert: true
      });
    
    if (uploadError) {
      console.error(`  ❌ 업로드 실패: ${newPath}`, uploadError.message);
      return { moved: false, error: uploadError.message };
    }
    
    // 원본 파일 삭제
    const { error: deleteError } = await supabase.storage
      .from('blog-images')
      .remove([file.path]);
    
    if (deleteError) {
      console.warn(`  ⚠️  원본 삭제 실패 (복사는 완료): ${file.path}`, deleteError.message);
    }
    
    return { moved: true, path: newPath };
  } catch (error) {
    console.error(`  ❌ 이동 실패: ${file.path}`, error.message);
    return { moved: false, error: error.message };
  }
}

/**
 * 메인 실행 함수
 */
async function organizeGoodsImages() {
  console.log('🔄 products/goods 이미지 제품별 분리 시작...\n');
  
  // 1. 모든 파일 조회
  const files = await listGoodsFiles();
  
  if (files.length === 0) {
    console.log('⚠️  이동할 파일이 없습니다.');
    return;
  }
  
  // 2. 제품별로 분류
  const { categorized, uncategorized } = categorizeImages(files);
  
  console.log('📦 제품별 분류 결과:\n');
  Object.entries(categorized).forEach(([slug, images]) => {
    console.log(`  ${slug}: ${images.length}개`);
  });
  
  if (uncategorized.length > 0) {
    console.log(`\n⚠️  분류되지 않은 파일: ${uncategorized.length}개`);
    uncategorized.forEach(file => {
      console.log(`  - ${file.name}`);
    });
  }
  
  console.log('\n📤 이미지 이동 시작...\n');
  
  const results = {
    success: [],
    failed: [],
    skipped: []
  };
  
  // 3. 각 제품별로 이미지 이동
  for (const [productSlug, images] of Object.entries(categorized)) {
    console.log(`📦 ${productSlug} 처리 중...`);
    
    for (const file of images) {
      const imageType = determineImageType(file.name);
      const result = await moveImageToProductFolder(file, productSlug, imageType);
      
      if (result.moved) {
        results.success.push({
          original: file.path,
          new: result.path,
          product: productSlug,
          type: imageType
        });
        console.log(`  ✅ ${file.name} → ${result.path}`);
      } else if (result.error) {
        results.failed.push({
          file: file.path,
          error: result.error
        });
        console.log(`  ❌ ${file.name}: ${result.error}`);
      } else {
        results.skipped.push({
          file: file.path,
          reason: '이미 올바른 위치에 있음'
        });
        console.log(`  ⏭️  ${file.name}: 이미 올바른 위치`);
      }
    }
    
    console.log('');
  }
  
  // 4. 결과 요약
  console.log('\n📊 작업 완료 요약:');
  console.log(`  ✅ 성공: ${results.success.length}개`);
  console.log(`  ⏭️  스킵: ${results.skipped.length}개`);
  console.log(`  ❌ 실패: ${results.failed.length}개`);
  
  // 5. 제품별 이미지 경로 정리
  const productImages = {};
  Object.entries(categorized).forEach(([slug, images]) => {
    productImages[slug] = images.map(img => {
      const imageType = determineImageType(img.name);
      return `originals/products/goods/${slug}/${imageType}/${path.basename(img.path)}`;
    });
  });
  
  // 결과 저장
  fs.writeFileSync(
    path.join(process.cwd(), 'scripts/goods-images-organization-result.json'),
    JSON.stringify({
      summary: {
        total: files.length,
        categorized: Object.keys(categorized).length,
        uncategorized: uncategorized.length,
        success: results.success.length,
        failed: results.failed.length,
        skipped: results.skipped.length
      },
      categorized: Object.keys(categorized).map(slug => ({
        slug,
        count: categorized[slug].length
      })),
      productImages,
      uncategorized: uncategorized.map(f => f.name),
      results
    }, null, 2)
  );
  
  console.log('\n💾 결과가 scripts/goods-images-organization-result.json에 저장되었습니다.');
  console.log('\n📝 다음 단계: 데이터베이스 제품에 이미지 경로 연결');
}

// 실행
organizeGoodsImages()
  .then(() => {
    console.log('\n✅ 이미지 분리 완료!');
  })
  .catch((error) => {
    console.error('❌ 오류 발생:', error);
    process.exit(1);
  });

