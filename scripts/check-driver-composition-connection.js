const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function main() {
  console.log('🔍 드라이버 제품의 product_composition 연결 확인...\n');

  // 문제가 있는 제품들 확인
  const productNames = ['시크리트웨폰 블랙', '시크리트포스 PRO 3 MUZIIK'];
  
  for (const productName of productNames) {
    console.log(`\n📋 "${productName}" 확인:`);
    
    // products 테이블에서 제품 찾기
    const { data: products, error: pError } = await supabase
      .from('products')
      .select('id, name, sku, slug, product_type')
      .or(`name.ilike.%${productName}%`)
      .eq('product_type', 'driver');
    
    if (pError) {
      console.error('❌ products 조회 오류:', pError);
      continue;
    }
    
    if (!products || products.length === 0) {
      console.log('  ⚠️ products 테이블에 없음');
      continue;
    }
    
    for (const product of products) {
      console.log(`\n  제품 ID: ${product.id}`);
      console.log(`  제품명: ${product.name}`);
      console.log(`  SKU: ${product.sku || '(없음)'}`);
      console.log(`  Slug: ${product.slug || '(없음)'}`);
      
      // product_composition에서 찾기 (slug 또는 이름으로)
      let compositionQuery = supabase
        .from('product_composition')
        .select('id, name, slug, product_id, category');
      
      // slug가 있으면 slug로, 없으면 이름으로 검색
      if (product.slug) {
        compositionQuery = compositionQuery.or(`slug.eq.${product.slug},name.ilike.%${product.name}%`);
      } else {
        compositionQuery = compositionQuery.ilike('name', `%${product.name}%`);
      }
      
      const { data: compositions, error: cError } = await compositionQuery;
      
      if (cError) {
        console.error('  ❌ product_composition 조회 오류:', cError);
        continue;
      }
      
      if (!compositions || compositions.length === 0) {
        console.log('  ⚠️ product_composition 테이블에 없음');
        continue;
      }
      
      for (const comp of compositions) {
        console.log(`\n  합성 ID: ${comp.id}`);
        console.log(`  합성명: ${comp.name}`);
        console.log(`  합성 Slug: ${comp.slug}`);
        console.log(`  product_id: ${comp.product_id || '(NULL)'}`);
        
        if (comp.product_id === product.id) {
          console.log('  ✅ 연결됨');
        } else if (comp.product_id === null) {
          console.log('  ❌ product_id가 NULL - 연결 필요');
          
          // 자동으로 연결 시도
          const { error: updateError } = await supabase
            .from('product_composition')
            .update({ product_id: product.id })
            .eq('id', comp.id);
          
          if (updateError) {
            console.error('  ❌ 업데이트 실패:', updateError);
          } else {
            console.log('  ✅ product_id 연결 완료!');
          }
        } else {
          console.log(`  ❌ product_id 불일치 (${comp.product_id} != ${product.id})`);
          
          // 다른 제품과 연결되어 있는지 확인
          const { data: otherProduct } = await supabase
            .from('products')
            .select('id, name')
            .eq('id', comp.product_id)
            .single();
          
          if (otherProduct) {
            console.log(`  ⚠️ 다른 제품과 연결됨: ${otherProduct.name} (ID: ${otherProduct.id})`);
          }
          
          // slug나 이름이 일치하면 업데이트
          if (comp.slug === product.slug || comp.name === product.name) {
            console.log('  🔄 product_id 업데이트 시도...');
            const { error: updateError } = await supabase
              .from('product_composition')
              .update({ product_id: product.id })
              .eq('id', comp.id);
            
            if (updateError) {
              console.error('  ❌ 업데이트 실패:', updateError);
            } else {
              console.log('  ✅ product_id 업데이트 완료!');
            }
          }
        }
      }
    }
  }
  
  console.log('\n✅ 확인 완료!');
}

main().catch(console.error);

