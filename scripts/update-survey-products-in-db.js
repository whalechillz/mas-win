/**
 * 설문 페이지 제품을 데이터베이스에 등록/업데이트
 * 마이그레이션된 이미지 경로를 gallery_images에 저장
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
 * 설문 페이지 제품을 데이터베이스에 등록/업데이트
 */
async function updateSurveyProducts(bucketHatImages, golfCapImages) {
  console.log('🔄 설문 페이지 제품 데이터베이스 업데이트 시작...\n');

  // 1. 버킷햇 제품 등록/업데이트
  console.log('📦 버킷햇 제품 처리 중...');
  
  // 기존 제품 확인
  const { data: existingBucketHat } = await supabase
    .from('products')
    .select('id')
    .eq('slug', 'bucket-hat-muziik')
    .single();

  const bucketHatData = {
    name: 'MASSGOO X MUZIIK 버킷햇',
    slug: 'bucket-hat-muziik',
    sku: 'BUCKET_HAT_MUZIIK',
    category: 'bucket_hat',
    product_type: 'goods',
    is_gift: true,
    is_sellable: false,
    is_active: true,
    gallery_images: bucketHatImages,
    updated_at: new Date().toISOString()
  };

  let bucketHatProduct;
  if (existingBucketHat) {
    // 업데이트
    const { data, error } = await supabase
      .from('products')
      .update(bucketHatData)
      .eq('id', existingBucketHat.id)
      .select()
      .single();
    
    if (error) {
      console.error('❌ 버킷햇 제품 업데이트 실패:', error.message);
      bucketHatProduct = null;
    } else {
      console.log('✅ 버킷햇 제품 업데이트 완료:', data.id);
      console.log(`   이미지 개수: ${bucketHatImages.length}개`);
      bucketHatProduct = data;
    }
  } else {
    // 신규 등록
    const { data, error } = await supabase
      .from('products')
      .insert(bucketHatData)
      .select()
      .single();
    
    if (error) {
      console.error('❌ 버킷햇 제품 등록 실패:', error.message);
      console.error('상세:', error);
      bucketHatProduct = null;
    } else {
      console.log('✅ 버킷햇 제품 등록 완료:', data.id);
      console.log(`   이미지 개수: ${bucketHatImages.length}개`);
      bucketHatProduct = data;
    }
  }

  // 2. 골프모자 제품 등록/업데이트
  console.log('\n📦 골프모자 제품 처리 중...');
  
  // 기존 제품 확인
  const { data: existingGolfCap } = await supabase
    .from('products')
    .select('id')
    .eq('slug', 'golf-hat-muziik')
    .single();

  const golfCapData = {
    name: 'MASSGOO X MUZIIK 골프모자',
    slug: 'golf-hat-muziik',
    sku: 'GOLF_HAT_MUZIIK',
    category: 'cap',
    product_type: 'goods',
    is_gift: true,
    is_sellable: false,
    is_active: true,
    gallery_images: golfCapImages,
    updated_at: new Date().toISOString()
  };

  let golfCapProduct;
  if (existingGolfCap) {
    // 업데이트
    const { data, error } = await supabase
      .from('products')
      .update(golfCapData)
      .eq('id', existingGolfCap.id)
      .select()
      .single();
    
    if (error) {
      console.error('❌ 골프모자 제품 업데이트 실패:', error.message);
      golfCapProduct = null;
    } else {
      console.log('✅ 골프모자 제품 업데이트 완료:', data.id);
      console.log(`   이미지 개수: ${golfCapImages.length}개`);
      golfCapProduct = data;
    }
  } else {
    // 신규 등록
    const { data, error } = await supabase
      .from('products')
      .insert(golfCapData)
      .select()
      .single();
    
    if (error) {
      console.error('❌ 골프모자 제품 등록 실패:', error.message);
      console.error('상세:', error);
      golfCapProduct = null;
    } else {
      console.log('✅ 골프모자 제품 등록 완료:', data.id);
      console.log(`   이미지 개수: ${golfCapImages.length}개`);
      golfCapProduct = data;
    }
  }

  console.log('\n🎉 데이터베이스 업데이트 완료!');
  console.log('\n📋 확인 사항:');
  console.log('1. /admin/products 페이지에서 제품 확인');
  console.log('2. /survey 페이지에서 이미지 표시 확인');
}

// 마이그레이션 결과 파일에서 이미지 경로 읽기
const resultFile = path.join(process.cwd(), 'scripts/survey-images-migration-result.json');

if (!fs.existsSync(resultFile)) {
  console.error('❌ 마이그레이션 결과 파일을 찾을 수 없습니다.');
  console.log('먼저 scripts/migrate-survey-images-to-supabase.js를 실행하세요.');
  process.exit(1);
}

const migrationResult = JSON.parse(fs.readFileSync(resultFile, 'utf8'));

// 실행
updateSurveyProducts(migrationResult.bucketHatImages, migrationResult.golfCapImages)
  .then(() => {
    console.log('\n✅ 모든 작업 완료!');
  })
  .catch((error) => {
    console.error('❌ 오류 발생:', error);
    process.exit(1);
  });

