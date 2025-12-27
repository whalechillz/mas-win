/**
 * 데이터베이스의 이미지 경로를 Storage의 실제 정상 파일명으로 업데이트
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
 * 제품별 정상 파일명 매핑 (Storage에서 확인한 정상 파일명 사용)
 */
const PRODUCT_IMAGE_MAPPING = {
  'gold2': {
    // 정상 파일명 우선 사용
    images: [
      'originals/products/gold2/detail/gold2_00_01.webp',
      'originals/products/gold2/detail/gold2_01.webp',
      'originals/products/gold2/detail/gold2_02.webp',
      'originals/products/gold2/detail/gold2_03.webp',
    ]
  },
  'pro3': {
    // 정상 파일명 찾기 (Storage에서 확인 필요)
    images: [
      'originals/products/pro3/detail/massgoo-secret-force-pro-3-official-00.webp',
      'originals/products/pro3/detail/massgoo-secret-force-pro-3-official-01.webp',
      'originals/products/pro3/detail/massgoo-secret-force-pro-3-official-02.webp',
      'originals/products/pro3/detail/massgoo-secret-force-pro-3-official-03.webp',
      'originals/products/pro3/detail/massgoo-secret-force-pro-3-official-04.webp',
      'originals/products/pro3/detail/massgoo-secret-force-pro-3-official-05.webp',
      'originals/products/pro3/detail/massgoo-secret-force-pro-3-official-06.webp',
      'originals/products/pro3/detail/massgoo-secret-force-pro-3-official-07.webp',
      'originals/products/pro3/detail/massgoo-secret-force-pro-3-official-08.webp',
    ]
  },
  'v3': {
    images: [
      'originals/products/v3/detail/massgoo-secret-force-v3-05-00.webp',
      'originals/products/v3/detail/massgoo-secret-force-v3-official-01.webp',
      'originals/products/v3/detail/massgoo-secret-force-v3-official-02.webp',
      'originals/products/v3/detail/massgoo-secret-force-v3-official-03.webp',
      'originals/products/v3/detail/massgoo-secret-force-v3-official-04.webp',
      'originals/products/v3/detail/massgoo-secret-force-v3-official-05.webp',
      'originals/products/v3/detail/massgoo-secret-force-v3-official-06.webp',
      'originals/products/v3/detail/massgoo-secret-force-v3-official-07.webp',
      'originals/products/v3/detail/massgoo-secret-force-v3-official-08.webp',
    ]
  },
  'black-weapon': {
    images: [
      'originals/products/black-weapon/detail/massgoo-secret-weapon-black-official-00-01.webp',
      'originals/products/black-weapon/detail/massgoo-secret-weapon-black-official-01.webp',
      'originals/products/black-weapon/detail/massgoo-secret-weapon-black-official-02.webp',
      'originals/products/black-weapon/detail/massgoo-secret-weapon-black-official-03.webp',
      'originals/products/black-weapon/detail/massgoo-secret-weapon-black-official-04.webp',
      'originals/products/black-weapon/detail/massgoo-secret-weapon-black-official-05.webp',
      'originals/products/black-weapon/detail/massgoo-secret-weapon-black-official-06.webp',
      'originals/products/black-weapon/detail/massgoo-secret-weapon-black-official-07.webp',
      'originals/products/black-weapon/detail/massgoo-secret-weapon-black-official-08-01.webp',
    ]
  },
  'gold-weapon4': {
    images: [
      'originals/products/gold-weapon4/detail/massgoo-secret-weapon-4-1-official-00-01.webp',
      'originals/products/gold-weapon4/detail/massgoo-secret-weapon-4-1-official-01.webp',
      'originals/products/gold-weapon4/detail/massgoo-secret-weapon-4-1-official-02.webp',
      'originals/products/gold-weapon4/detail/massgoo-secret-weapon-4-1-official-03.webp',
      'originals/products/gold-weapon4/detail/massgoo-secret-weapon-4-1-official-04.webp',
      'originals/products/gold-weapon4/detail/massgoo-secret-weapon-4-1-official-05.webp',
      'originals/products/gold-weapon4/detail/massgoo-secret-weapon-4-1-official-06.webp',
      'originals/products/gold-weapon4/detail/massgoo-secret-weapon-4-1-official-07.webp',
      'originals/products/gold-weapon4/detail/massgoo-secret-weapon-4-1-official-08-01.webp',
    ]
  }
};

/**
 * Storage에서 실제 파일명 확인하고 정상 파일명만 필터링
 */
async function getValidImageFiles(productSlug) {
  const { data, error } = await supabase.storage
    .from('blog-images')
    .list(`originals/products/${productSlug}/detail`, {
      limit: 100,
      sortBy: { column: 'name', order: 'asc' }
    });
  
  if (error || !data) {
    return [];
  }
  
  // 이상한 파일명 제외 (_-_로 시작하는 파일 제외)
  const validFiles = data
    .map(f => f.name)
    .filter(name => !name.startsWith('_-_') && !name.startsWith('2_') && name.includes('.'))
    .map(name => `originals/products/${productSlug}/detail/${name}`);
  
  return validFiles;
}

/**
 * 제품의 detail_images 업데이트
 */
async function updateProductImages(productSlug, imagePaths) {
  if (imagePaths.length === 0) {
    console.log(`  ⚠️  업데이트할 이미지 없음`);
    return false;
  }
  
  console.log(`\n📝 데이터베이스 업데이트: ${productSlug}`);
  console.log(`  이미지 경로 (${imagePaths.length}개):`);
  imagePaths.slice(0, 3).forEach(path => {
    console.log(`    - ${path}`);
  });
  if (imagePaths.length > 3) {
    console.log(`    ... 외 ${imagePaths.length - 3}개`);
  }
  
  const { data: product } = await supabase
    .from('products')
    .select('id, name')
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
  
  console.log(`  ✅ 업데이트 완료: ${product.name}`);
  return true;
}

/**
 * 메인 실행 함수
 */
async function fixImagePaths() {
  console.log('🔄 제품 이미지 경로 수정 시작...\n');
  
  const products = ['gold2', 'pro3', 'v3', 'black-weapon', 'gold-weapon4'];
  const results = {};
  
  for (const productSlug of products) {
    console.log(`\n📦 ${productSlug} 처리 중...`);
    
    // Storage에서 정상 파일명 가져오기
    const validFiles = await getValidImageFiles(productSlug);
    
    if (validFiles.length === 0) {
      console.log(`  ⚠️  정상 파일명을 찾을 수 없음`);
      results[productSlug] = { success: false, reason: '정상 파일명 없음' };
      continue;
    }
    
    console.log(`  ✅ ${validFiles.length}개 정상 파일명 발견`);
    
    // 데이터베이스 업데이트
    const success = await updateProductImages(productSlug, validFiles);
    results[productSlug] = {
      success,
      imageCount: validFiles.length,
      images: validFiles
    };
  }
  
  console.log('\n📊 수정 완료 요약:');
  Object.entries(results).forEach(([slug, result]) => {
    if (result.success) {
      console.log(`  ✅ ${slug}: ${result.imageCount}개 이미지`);
    } else {
      console.log(`  ❌ ${slug}: ${result.reason || '실패'}`);
    }
  });
  
  // 결과 저장
  const fs = require('fs');
  const path = require('path');
  fs.writeFileSync(
    path.join(process.cwd(), 'scripts/image-paths-fix-result.json'),
    JSON.stringify(results, null, 2)
  );
  
  console.log('\n💾 결과가 scripts/image-paths-fix-result.json에 저장되었습니다.');
}

// 실행
fixImagePaths()
  .then(() => {
    console.log('\n✅ 작업 완료!');
    console.log('\n📋 확인 사항:');
    console.log('1. 메인 페이지에서 이미지 표시 확인');
    console.log('2. 브라우저 콘솔에서 이미지 로드 오류 확인');
  })
  .catch((error) => {
    console.error('❌ 오류 발생:', error);
    process.exit(1);
  });

