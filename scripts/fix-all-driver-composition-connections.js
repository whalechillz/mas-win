const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function main() {
  console.log('🔍 모든 드라이버 제품의 product_composition 연결 확인 및 수정...\n');

  // 모든 드라이버 제품 가져오기
  const { data: products, error: pError } = await supabase
    .from('products')
    .select('id, name, sku, slug, product_type')
    .eq('product_type', 'driver')
    .order('name', { ascending: true });
  
  if (pError) {
    console.error('❌ products 조회 오류:', pError);
    return;
  }
  
  if (!products || products.length === 0) {
    console.log('⚠️ 드라이버 제품을 찾을 수 없습니다.');
    return;
  }
  
  console.log(`📋 총 ${products.length}개 드라이버 제품 확인 중...\n`);
  
  let fixedCount = 0;
  let alreadyConnectedCount = 0;
  let notFoundCount = 0;
  
  for (const product of products) {
    console.log(`\n제품: ${product.name} (ID: ${product.id}, Slug: ${product.slug || '(없음)'})`);
    
    // product_composition에서 찾기
    let compositionQuery = supabase
      .from('product_composition')
      .select('id, name, slug, product_id, category')
      .eq('category', 'driver');
    
    // slug가 있으면 slug로 우선 검색, 없으면 이름으로
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
      console.log('  ⚠️ product_composition에 없음');
      notFoundCount++;
      continue;
    }
    
    // 가장 일치하는 composition 찾기 (slug 우선, 그 다음 이름)
    let matchedComp = null;
    for (const comp of compositions) {
      if (comp.slug === product.slug) {
        matchedComp = comp;
        break;
      }
      if (comp.name === product.name) {
        matchedComp = comp;
        break;
      }
    }
    
    if (!matchedComp && compositions.length > 0) {
      matchedComp = compositions[0]; // 첫 번째 항목 사용
    }
    
    if (matchedComp) {
      if (matchedComp.product_id === product.id) {
        console.log(`  ✅ 이미 연결됨 (합성 ID: ${matchedComp.id})`);
        alreadyConnectedCount++;
      } else {
        console.log(`  🔄 연결 수정 필요 (현재 product_id: ${matchedComp.product_id || 'NULL'})`);
        
        // 다른 제품과 연결되어 있는지 확인
        if (matchedComp.product_id) {
          const { data: otherProduct } = await supabase
            .from('products')
            .select('id, name')
            .eq('id', matchedComp.product_id)
            .single();
          
          if (otherProduct) {
            console.log(`  ⚠️ 다른 제품과 연결됨: ${otherProduct.name} (ID: ${otherProduct.id})`);
          }
        }
        
        // 업데이트
        const { error: updateError } = await supabase
          .from('product_composition')
          .update({ product_id: product.id })
          .eq('id', matchedComp.id);
        
        if (updateError) {
          console.error('  ❌ 업데이트 실패:', updateError);
        } else {
          console.log('  ✅ product_id 연결 완료!');
          fixedCount++;
        }
      }
    }
  }
  
  console.log('\n' + '='.repeat(50));
  console.log('📊 수정 결과:');
  console.log(`  ✅ 이미 연결됨: ${alreadyConnectedCount}개`);
  console.log(`  🔄 수정 완료: ${fixedCount}개`);
  console.log(`  ⚠️ product_composition에 없음: ${notFoundCount}개`);
  console.log('='.repeat(50));
}

main().catch(console.error);

