// 미쓰구 블랙캡 제품의 slug 추가 및 product_composition 연결
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Supabase 환경 변수가 설정되지 않았습니다.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  console.log('🔧 미쓰구 블랙캡 제품 slug 추가 및 연결 시작...\n');

  // 1. products 테이블에서 제품 찾기
  const { data: product, error: productError } = await supabase
    .from('products')
    .select('id, name, sku, slug')
    .eq('id', 21)
    .single();

  if (productError || !product) {
    console.error('❌ 제품을 찾을 수 없습니다:', productError);
    return;
  }

  console.log('📋 현재 제품 정보:');
  console.log(`   ID: ${product.id}`);
  console.log(`   이름: ${product.name}`);
  console.log(`   SKU: ${product.sku}`);
  console.log(`   slug: ${product.slug || '(없음)'}`);
  console.log('');

  // 2. product_composition에서 slug 확인
  const { data: composition, error: compError } = await supabase
    .from('product_composition')
    .select('id, name, slug, product_id')
    .eq('slug', 'massgoo-black-cap')
    .maybeSingle();

  if (compError) {
    console.error('❌ product_composition 조회 오류:', compError);
    return;
  }

  if (!composition) {
    console.log('⚠️ product_composition에서 slug를 찾을 수 없습니다.');
    return;
  }

  console.log('📋 product_composition 정보:');
  console.log(`   ID: ${composition.id}`);
  console.log(`   이름: ${composition.name}`);
  console.log(`   slug: ${composition.slug}`);
  console.log(`   product_id: ${composition.product_id || '(없음)'}`);
  console.log('');

  // 3. products 테이블에 slug 추가
  if (!product.slug) {
    console.log('📝 products 테이블에 slug 추가 중...');
    const { error: updateError } = await supabase
      .from('products')
      .update({ 
        slug: 'massgoo-black-cap',
        updated_at: new Date().toISOString()
      })
      .eq('id', product.id);

    if (updateError) {
      console.error('❌ slug 업데이트 실패:', updateError);
      return;
    }
    console.log('✅ slug 추가 완료: massgoo-black-cap');
  } else {
    console.log('ℹ️ slug가 이미 있습니다.');
  }

  // 4. product_composition의 product_id 연결
  if (!composition.product_id) {
    console.log('📝 product_composition의 product_id 연결 중...');
    const { error: linkError } = await supabase
      .from('product_composition')
      .update({ product_id: product.id })
      .eq('id', composition.id);

    if (linkError) {
      console.error('❌ product_id 연결 실패:', linkError);
      return;
    }
    console.log(`✅ product_id 연결 완료: ${product.id}`);
  } else {
    console.log('ℹ️ product_id가 이미 연결되어 있습니다.');
  }

  // 5. 최종 확인
  console.log('\n📋 최종 확인...');
  const { data: finalProduct, error: finalError } = await supabase
    .from('products')
    .select(`
      id,
      name,
      sku,
      slug,
      product_composition!product_composition_product_id_fkey (
        id,
        name,
        slug
      )
    `)
    .eq('id', product.id)
    .single();

  if (!finalError && finalProduct) {
    console.log('✅ 최종 제품 정보:');
    console.log(`   이름: ${finalProduct.name}`);
    console.log(`   SKU: ${finalProduct.sku}`);
    console.log(`   slug: ${finalProduct.slug || '(없음)'}`);
    if (finalProduct.product_composition) {
      const comp = Array.isArray(finalProduct.product_composition) 
        ? finalProduct.product_composition[0] 
        : finalProduct.product_composition;
      console.log(`   합성 slug: ${comp?.slug || '(없음)'}`);
    }
  }

  console.log('\n✅ 작업 완료!');
}

main().catch(console.error);

