/**
 * secret-weapon-black-muziik 제품의 detail_images를 hero_images로 마이그레이션
 * 
 * 실행 방법:
 * node scripts/migrate-detail-to-hero-secret-weapon-black-muziik.js
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Supabase 환경 변수가 설정되지 않았습니다.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const PRODUCT_SLUG = 'secret-weapon-black-muziik';

async function migrateDetailToHero() {
  console.log('🚀 detail_images → hero_images 마이그레이션 시작\n');
  console.log(`제품: ${PRODUCT_SLUG}\n`);

  try {
    // 1. 제품 정보 조회
    console.log('1️⃣ 제품 정보 조회 중...');
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('id, name, slug, detail_images, hero_images')
      .eq('slug', PRODUCT_SLUG)
      .single();

    if (productError) {
      console.error('❌ 제품 조회 실패:', productError);
      return;
    }

    if (!product) {
      console.error(`❌ 제품을 찾을 수 없습니다: ${PRODUCT_SLUG}`);
      return;
    }

    console.log(`✅ 제품 찾음: ${product.name} (ID: ${product.id})\n`);

    // 2. 현재 detail_images 확인
    const currentDetailImages = Array.isArray(product.detail_images) 
      ? product.detail_images 
      : [];
    const currentHeroImages = Array.isArray(product.hero_images) 
      ? product.hero_images 
      : [];

    console.log('2️⃣ 현재 이미지 상태:');
    console.log(`   - detail_images: ${currentDetailImages.length}개`);
    console.log(`   - hero_images: ${currentHeroImages.length}개\n`);

    if (currentDetailImages.length === 0) {
      console.log('⚠️  detail_images가 비어있습니다. 마이그레이션할 이미지가 없습니다.');
      return;
    }

    // 3. detail_images를 hero_images로 복사
    console.log('3️⃣ detail_images → hero_images 마이그레이션 중...');
    
    // 기존 hero_images와 병합 (중복 제거)
    const mergedHeroImages = [...new Set([...currentHeroImages, ...currentDetailImages])];
    
    console.log(`   - 마이그레이션할 이미지: ${currentDetailImages.length}개`);
    console.log(`   - 기존 hero_images: ${currentHeroImages.length}개`);
    console.log(`   - 최종 hero_images: ${mergedHeroImages.length}개\n`);

    // 4. 데이터베이스 업데이트
    console.log('4️⃣ 데이터베이스 업데이트 중...');
    const { error: updateError } = await supabase
      .from('products')
      .update({
        hero_images: mergedHeroImages,
        updated_at: new Date().toISOString()
      })
      .eq('id', product.id);

    if (updateError) {
      console.error('❌ 업데이트 실패:', updateError);
      return;
    }

    console.log('✅ hero_images 업데이트 완료\n');

    // 5. 결과 출력
    console.log('📊 마이그레이션 결과:');
    console.log(`   - detail_images: ${currentDetailImages.length}개 → hero_images로 이동`);
    console.log(`   - hero_images: ${mergedHeroImages.length}개`);
    console.log('\n✅ 마이그레이션 완료!');
    console.log('\n⚠️  참고:');
    console.log('   - detail_images는 그대로 유지됩니다 (기존 호환성)');
    console.log('   - 제품 페이지는 hero_images를 우선 사용합니다');
    console.log('   - detail_images는 detail_content와 함께 사용됩니다');

  } catch (error) {
    console.error('❌ 오류 발생:', error);
    process.exit(1);
  }
}

// 실행
migrateDetailToHero()
  .then(() => {
    console.log('\n✨ 스크립트 실행 완료');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ 스크립트 실행 실패:', error);
    process.exit(1);
  });
