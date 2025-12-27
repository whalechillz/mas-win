/**
 * 굿즈 제품의 gallery_images를 업데이트
 * organize-goods-images-by-product.js 실행 후 사용
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
 * 제품 slug와 이름 매핑
 */
const PRODUCT_MAPPING = {
  'bucket-hat-muziik': {
    name: 'MASSGOO X MUZIIK 버킷햇',
    sku: 'BUCKET_HAT_MUZIIK',
    category: 'bucket_hat'
  },
  'golf-hat-muziik': {
    name: 'MASSGOO X MUZIIK 골프모자',
    sku: 'GOLF_HAT_MUZIIK',
    category: 'cap'
  },
  'massgoo-muziik-clutch-beige': {
    name: 'MASSGOO × MUZIIK 프리미엄 클러치백 (베이지)',
    sku: 'CLUTCH_BEIGE_MUZIIK',
    category: 'accessory'
  },
  'massgoo-muziik-clutch-gray': {
    name: 'MASSGOO × MUZIIK 프리미엄 클러치백 (그레이)',
    sku: 'CLUTCH_GRAY_MUZIIK',
    category: 'accessory'
  },
  'massgoo-white-cap': {
    name: 'MASSGOO 화이트캡',
    sku: 'MASSGOO_WHITE_CAP',
    category: 'cap'
  },
  'massgoo-black-cap': {
    name: 'MASSGOO 블랙캡',
    sku: 'MASSGOO_BLACK_CAP',
    category: 'cap'
  },
  'mas-limited-cap-gray': {
    name: 'MAS 한정판 모자(그레이)',
    sku: 'MAS_LIMITED_CAP_GRAY',
    category: 'cap'
  },
  'mas-limited-cap-black': {
    name: 'MAS 한정판 모자(블랙)',
    sku: 'MAS_LIMITED_CAP_BLACK',
    category: 'cap'
  },
  'white-golf-cap': {
    name: '화이트 골프모자',
    sku: 'WHITE_GOLF_CAP',
    category: 'cap'
  },
  'black-golf-cap': {
    name: '블랙 골프모자',
    sku: 'BLACK_GOLF_CAP',
    category: 'cap'
  },
  'navy-golf-cap': {
    name: '네이비 골프모자',
    sku: 'NAVY_GOLF_CAP',
    category: 'cap'
  },
  'beige-golf-cap': {
    name: '베이지 골프모자',
    sku: 'BEIGE_GOLF_CAP',
    category: 'cap'
  },
  'white-bucket-hat': {
    name: '화이트 버킷햇',
    sku: 'WHITE_BUCKET_HAT',
    category: 'bucket_hat'
  },
  'black-bucket-hat': {
    name: '블랙 버킷햇',
    sku: 'BLACK_BUCKET_HAT',
    category: 'bucket_hat'
  }
};

/**
 * 제품별 이미지 경로를 데이터베이스에 업데이트
 */
async function updateProductsWithImages() {
  console.log('🔄 굿즈 제품 이미지 경로 업데이트 시작...\n');
  
  // 조직화 결과 파일 읽기
  const resultFile = path.join(process.cwd(), 'scripts/goods-images-organization-result.json');
  
  if (!fs.existsSync(resultFile)) {
    console.error('❌ 조직화 결과 파일을 찾을 수 없습니다.');
    console.log('먼저 scripts/organize-goods-images-by-product.js를 실행하세요.');
    process.exit(1);
  }
  
  const result = JSON.parse(fs.readFileSync(resultFile, 'utf8'));
  const { productImages } = result;
  
  console.log(`📦 처리할 제품: ${Object.keys(productImages).length}개\n`);
  
  const updateResults = {
    success: [],
    failed: []
  };
  
  // 각 제품별로 처리
  for (const [productSlug, imagePaths] of Object.entries(productImages)) {
    const productInfo = PRODUCT_MAPPING[productSlug];
    
    if (!productInfo) {
      console.log(`⚠️  ${productSlug}: 매핑 정보 없음, 건너뜀`);
      continue;
    }
    
    console.log(`📦 ${productInfo.name} 처리 중...`);
    console.log(`   이미지 개수: ${imagePaths.length}개`);
    
    // 기존 제품 확인
    const { data: existingProduct } = await supabase
      .from('products')
      .select('id')
      .eq('slug', productSlug)
      .single();
    
    const productData = {
      name: productInfo.name,
      slug: productSlug,
      sku: productInfo.sku,
      category: productInfo.category,
      product_type: 'goods',
      is_gift: true,
      is_sellable: false,
      is_active: true,
      gallery_images: imagePaths.sort(),
      updated_at: new Date().toISOString()
    };
    
    if (existingProduct) {
      // 업데이트
      const { data, error } = await supabase
        .from('products')
        .update(productData)
        .eq('id', existingProduct.id)
        .select()
        .single();
      
      if (error) {
        console.error(`  ❌ 업데이트 실패: ${error.message}`);
        updateResults.failed.push({ slug: productSlug, error: error.message });
      } else {
        console.log(`  ✅ 업데이트 완료: ${data.id}`);
        updateResults.success.push({ slug: productSlug, id: data.id });
      }
    } else {
      // 신규 등록
      const { data, error } = await supabase
        .from('products')
        .insert(productData)
        .select()
        .single();
      
      if (error) {
        console.error(`  ❌ 등록 실패: ${error.message}`);
        updateResults.failed.push({ slug: productSlug, error: error.message });
      } else {
        console.log(`  ✅ 등록 완료: ${data.id}`);
        updateResults.success.push({ slug: productSlug, id: data.id });
      }
    }
    
    console.log('');
  }
  
  console.log('\n📊 업데이트 완료 요약:');
  console.log(`  ✅ 성공: ${updateResults.success.length}개`);
  console.log(`  ❌ 실패: ${updateResults.failed.length}개`);
  
  if (updateResults.failed.length > 0) {
    console.log('\n❌ 실패한 제품:');
    updateResults.failed.forEach(item => {
      console.log(`  - ${item.slug}: ${item.error}`);
    });
  }
  
  console.log('\n✅ 모든 작업 완료!');
}

// 실행
updateProductsWithImages()
  .then(() => {
    console.log('\n📋 확인 사항:');
    console.log('1. /admin/products 페이지에서 제품 확인');
    console.log('2. /survey 페이지에서 이미지 표시 확인');
  })
  .catch((error) => {
    console.error('❌ 오류 발생:', error);
    process.exit(1);
  });

