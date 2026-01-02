/**
 * 제품 합성 관리 DB 연결 수정 스크립트
 * 1. 이미지 경로 수정 (hat-white-bucket → bucket-hat-muziik)
 * 2. product_id를 products 테이블과 slug 기반으로 매칭
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

async function fixProductCompositionDBConnection() {
  console.log('🔄 제품 합성 관리 DB 연결 수정 시작...\n');

  const results = {
    imagePathUpdated: 0,
    productIdMatched: 0,
    errors: []
  };

  try {
    // 1. 이미지 경로 수정 (hat-white-bucket → bucket-hat-muziik)
    console.log('1️⃣ 이미지 경로 수정 중...');
    
    const { data: productsToUpdate, error: fetchError } = await supabase
      .from('product_composition')
      .select('id, image_url, reference_images')
      .like('image_url', '%hat-white-bucket%');

    if (fetchError) {
      console.error('   ❌ 제품 조회 실패:', fetchError.message);
      results.errors.push({ step: 'fetch', error: fetchError.message });
    } else if (productsToUpdate && productsToUpdate.length > 0) {
      console.log(`   📋 수정할 제품: ${productsToUpdate.length}개`);

      for (const product of productsToUpdate) {
        const updatedImageUrl = product.image_url?.replace(
          'originals/goods/hat-white-bucket/composition/',
          'originals/goods/bucket-hat-muziik/composition/'
        ) || product.image_url;

        const updatedReferenceImages = (product.reference_images || []).map((img) =>
          img.replace(
            'originals/goods/hat-white-bucket/composition/',
            'originals/goods/bucket-hat-muziik/composition/'
          )
        );

        const { error: updateError } = await supabase
          .from('product_composition')
          .update({
            image_url: updatedImageUrl,
            reference_images: updatedReferenceImages,
            updated_at: new Date().toISOString()
          })
          .eq('id', product.id);

        if (updateError) {
          console.error(`   ❌ 제품 ${product.id} 업데이트 실패:`, updateError.message);
          results.errors.push({ step: 'update_image_path', productId: product.id, error: updateError.message });
        } else {
          results.imagePathUpdated++;
          console.log(`   ✅ 제품 ${product.id} 이미지 경로 수정 완료`);
        }
      }
    } else {
      console.log('   ℹ️ 수정할 이미지 경로가 없습니다.');
    }

    // 2. product_id 매칭 (slug 기반)
    console.log('\n2️⃣ product_id 매칭 중...');

    // 2-1. bucket-hat-muziik 관련 제품 매칭
    const { data: bucketHatProduct, error: bucketHatError } = await supabase
      .from('products')
      .select('id')
      .eq('slug', 'bucket-hat-muziik')
      .maybeSingle();

    if (!bucketHatError && bucketHatProduct) {
      const { data: hatProducts, error: hatProductsError } = await supabase
        .from('product_composition')
        .select('id, slug')
        .in('slug', ['hat-white-bucket', 'hat-black-bucket'])
        .is('product_id', null);

      if (!hatProductsError && hatProducts && hatProducts.length > 0) {
        const { error: updateError } = await supabase
          .from('product_composition')
          .update({
            product_id: bucketHatProduct.id,
            updated_at: new Date().toISOString()
          })
          .in('slug', ['hat-white-bucket', 'hat-black-bucket']);

        if (updateError) {
          console.error('   ❌ bucket-hat-muziik 매칭 실패:', updateError.message);
          results.errors.push({ step: 'match_bucket_hat', error: updateError.message });
        } else {
          results.productIdMatched += hatProducts.length;
          console.log(`   ✅ bucket-hat-muziik 매칭 완료: ${hatProducts.length}개`);
        }
      }
    }

    // 2-2. golf-hat-muziik 관련 제품 매칭
    const { data: golfHatProduct, error: golfHatError } = await supabase
      .from('products')
      .select('id')
      .eq('slug', 'golf-hat-muziik')
      .maybeSingle();

    if (!golfHatError && golfHatProduct) {
      const { data: hatProducts, error: hatProductsError } = await supabase
        .from('product_composition')
        .select('id, slug')
        .eq('slug', 'hat-white-golf')
        .is('product_id', null);

      if (!hatProductsError && hatProducts && hatProducts.length > 0) {
        const { error: updateError } = await supabase
          .from('product_composition')
          .update({
            product_id: golfHatProduct.id,
            updated_at: new Date().toISOString()
          })
          .eq('slug', 'hat-white-golf');

        if (updateError) {
          console.error('   ❌ golf-hat-muziik 매칭 실패:', updateError.message);
          results.errors.push({ step: 'match_golf_hat', error: updateError.message });
        } else {
          results.productIdMatched += hatProducts.length;
          console.log(`   ✅ golf-hat-muziik 매칭 완료: ${hatProducts.length}개`);
        }
      }
    }

    // 2-3. 다른 모자 제품들 매칭 (slug가 정확히 일치하는 경우)
    const { data: allHatProducts, error: allHatError } = await supabase
      .from('product_composition')
      .select('id, slug')
      .eq('category', 'hat')
      .is('product_id', null);

    if (!allHatError && allHatProducts && allHatProducts.length > 0) {
      for (const hatProduct of allHatProducts) {
        const { data: matchingProduct, error: matchError } = await supabase
          .from('products')
          .select('id')
          .eq('slug', hatProduct.slug)
          .maybeSingle();

        if (!matchError && matchingProduct) {
          const { error: updateError } = await supabase
            .from('product_composition')
            .update({
              product_id: matchingProduct.id,
              updated_at: new Date().toISOString()
            })
            .eq('id', hatProduct.id);

          if (updateError) {
            console.error(`   ❌ 제품 ${hatProduct.id} 매칭 실패:`, updateError.message);
            results.errors.push({ step: 'match_slug', productId: hatProduct.id, error: updateError.message });
          } else {
            results.productIdMatched++;
            console.log(`   ✅ 제품 ${hatProduct.slug} 매칭 완료`);
          }
        }
      }
    }

    // 최종 요약
    console.log('\n' + '='.repeat(60));
    console.log('✅ DB 연결 수정 완료!\n');
    console.log('📊 작업 요약:');
    console.log(`   - 이미지 경로 수정: ${results.imagePathUpdated}개`);
    console.log(`   - product_id 매칭: ${results.productIdMatched}개`);
    
    if (results.errors.length > 0) {
      console.log(`\n⚠️ 오류 발생: ${results.errors.length}개`);
      results.errors.forEach((err, index) => {
        console.log(`   ${index + 1}. ${err.step}: ${err.error}`);
      });
    } else {
      console.log('\n✨ 모든 작업이 성공적으로 완료되었습니다!');
    }

  } catch (error) {
    console.error('\n❌ 치명적 오류:', error);
    results.errors.push({ step: 'general', error: error.message });
    process.exit(1);
  }
}

// 실행
fixProductCompositionDBConnection();

