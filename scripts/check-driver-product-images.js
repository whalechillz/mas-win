/**
 * 드라이버 제품의 detail_images 상태 확인 및 누락된 이미지 식별
 */

require('dotenv').config({ path: '.env.local' });

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Supabase 환경 변수가 설정되지 않았습니다.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

/**
 * Supabase Storage에 파일이 존재하는지 확인
 */
async function checkFileExists(storagePath) {
  try {
    const { data, error } = await supabase.storage
      .from('blog-images')
      .list(storagePath.split('/').slice(0, -1).join('/'), {
        search: storagePath.split('/').pop()
      });
    
    if (error) {
      return false;
    }
    
    return data && data.length > 0;
  } catch (error) {
    return false;
  }
}

/**
 * 드라이버 제품 이미지 상태 확인
 */
async function checkDriverProductImages() {
  console.log('🔍 드라이버 제품 이미지 상태 확인 중...\n');
  
  // 1. 데이터베이스에서 드라이버 제품 조회
  const { data: products, error } = await supabase
    .from('products')
    .select('id, slug, name, detail_images')
    .eq('product_type', 'driver')
    .eq('is_active', true)
    .order('display_order', { ascending: true });
  
  if (error) {
    console.error('❌ 제품 조회 오류:', error.message);
    process.exit(1);
  }
  
  console.log(`📦 총 ${products.length}개 드라이버 제품 발견\n`);
  
  const results = {
    hasImages: [],
    missingImages: [],
    invalidPaths: []
  };
  
  // 2. 각 제품의 이미지 상태 확인
  for (const product of products) {
    const detailImages = Array.isArray(product.detail_images) 
      ? product.detail_images 
      : (product.detail_images ? JSON.parse(product.detail_images) : []);
    
    if (!detailImages || detailImages.length === 0) {
      results.missingImages.push({
        id: product.id,
        slug: product.slug,
        name: product.name,
        reason: 'detail_images가 비어있음'
      });
      console.log(`❌ ${product.name} (${product.slug}): 이미지 없음`);
      continue;
    }
    
    // 첫 번째 이미지 파일 존재 여부 확인
    const firstImage = detailImages[0];
    if (!firstImage) {
      results.missingImages.push({
        id: product.id,
        slug: product.slug,
        name: product.name,
        reason: '이미지 경로가 비어있음'
      });
      console.log(`❌ ${product.name} (${product.slug}): 이미지 경로 없음`);
      continue;
    }
    
    // Storage에 파일 존재 확인
    const exists = await checkFileExists(firstImage);
    
    if (exists) {
      results.hasImages.push({
        id: product.id,
        slug: product.slug,
        name: product.name,
        imageCount: detailImages.length,
        firstImage: firstImage
      });
      console.log(`✅ ${product.name} (${product.slug}): ${detailImages.length}개 이미지 있음`);
      console.log(`   첫 이미지: ${firstImage}`);
    } else {
      results.invalidPaths.push({
        id: product.id,
        slug: product.slug,
        name: product.name,
        imageCount: detailImages.length,
        firstImage: firstImage,
        reason: 'Storage에 파일이 없음'
      });
      console.log(`⚠️  ${product.name} (${product.slug}): 경로는 있지만 파일 없음`);
      console.log(`   경로: ${firstImage}`);
    }
  }
  
  // 3. 결과 요약
  console.log('\n📊 확인 결과 요약:');
  console.log(`  ✅ 이미지 있음: ${results.hasImages.length}개`);
  console.log(`  ❌ 이미지 없음: ${results.missingImages.length}개`);
  console.log(`  ⚠️  경로는 있지만 파일 없음: ${results.invalidPaths.length}개`);
  
  if (results.missingImages.length > 0) {
    console.log('\n❌ 이미지가 없는 제품:');
    results.missingImages.forEach(p => {
      console.log(`  - ${p.name} (${p.slug}): ${p.reason}`);
    });
  }
  
  if (results.invalidPaths.length > 0) {
    console.log('\n⚠️  경로는 있지만 파일이 없는 제품:');
    results.invalidPaths.forEach(p => {
      console.log(`  - ${p.name} (${p.slug})`);
      console.log(`    경로: ${p.firstImage}`);
    });
  }
  
  // 결과를 JSON 파일로 저장
  const fs = require('fs');
  const path = require('path');
  fs.writeFileSync(
    path.join(process.cwd(), 'scripts/driver-images-check-result.json'),
    JSON.stringify(results, null, 2)
  );
  
  console.log('\n💾 결과가 scripts/driver-images-check-result.json에 저장되었습니다.');
  
  return results;
}

// 실행
checkDriverProductImages()
  .then((results) => {
    if (results.missingImages.length > 0 || results.invalidPaths.length > 0) {
      console.log('\n📝 다음 단계:');
      console.log('1. 마이그레이션 스크립트 실행: node scripts/migrate-driver-products-to-db.js');
      console.log('2. 또는 /admin/products 페이지에서 각 제품의 이미지 업로드');
    } else {
      console.log('\n✅ 모든 제품에 이미지가 있습니다!');
    }
  })
  .catch((error) => {
    console.error('❌ 오류 발생:', error);
    process.exit(1);
  });

