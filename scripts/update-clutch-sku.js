// 클러치백 제품들의 SKU 업데이트
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
  console.log('🚀 클러치백 제품 SKU 업데이트 시작...\n');

  const updates = [
    { productId: 7, currentSku: 'MZ_CLUTCH_BEIGE', newSku: 'MASSGOO_MUZIIK_CLUTCH_BEIGE', name: 'MASSGOO × MUZIIK 프리미엄 클러치백 (베이지)' },
    { productId: 9, currentSku: 'MZ_CLUTCH_GRAY', newSku: 'MASSGOO_MUZIIK_CLUTCH_GRAY', name: 'MASSGOO × MUZIIK 프리미엄 클러치백 (그레이)' },
  ];

  for (const update of updates) {
    console.log(`📝 ${update.name} SKU 업데이트...`);
    console.log(`   현재: ${update.currentSku} → 새 SKU: ${update.newSku}`);
    
    // 중복 SKU 확인
    const { data: existing, error: checkError } = await supabase
      .from('products')
      .select('id, name')
      .eq('sku', update.newSku)
      .limit(1)
      .maybeSingle();
    
    if (checkError && checkError.code !== 'PGRST116') {
      console.log(`   ❌ 중복 확인 오류: ${checkError.message}`);
      continue;
    }
    
    if (existing && existing.id !== update.productId) {
      console.log(`   ⚠️ SKU가 이미 사용 중입니다: ${update.newSku} (${existing.name})`);
      continue;
    }
    
    // SKU 업데이트
    const { error: updateError } = await supabase
      .from('products')
      .update({ 
        sku: update.newSku,
        updated_at: new Date().toISOString()
      })
      .eq('id', update.productId);
    
    if (updateError) {
      console.log(`   ❌ 업데이트 실패: ${updateError.message}`);
    } else {
      console.log(`   ✅ 업데이트 완료!`);
    }
    
    await new Promise(resolve => setTimeout(resolve, 200));
  }

  // 최종 확인
  console.log('\n📋 최종 결과 확인...');
  const { data: compositions, error: finalError } = await supabase
    .from('product_composition')
    .select(`
      id,
      name,
      slug,
      product_id,
      products (
        id,
        name,
        sku,
        slug
      )
    `)
    .in('slug', ['massgoo-muziik-clutch-beige', 'massgoo-muziik-clutch-gray'])
    .order('display_order', { ascending: true });

  if (!finalError && compositions) {
    for (const comp of compositions) {
      const product = comp.products;
      const expectedSku = comp.slug.toUpperCase().replace(/-/g, '_');
      
      if (product) {
        const status = product.sku === expectedSku ? '✅' : '⚠️';
        console.log(`   ${status} ${comp.name}: SKU ${product.sku === expectedSku ? '일치' : `불일치 (${product.sku} vs ${expectedSku})`}`);
      }
    }
  }

  console.log('\n✅ 작업 완료!');
}

main().catch(console.error);

