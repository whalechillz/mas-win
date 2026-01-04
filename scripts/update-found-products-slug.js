// 찾은 제품들의 slug와 product_composition product_id 업데이트
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
  console.log('🚀 찾은 제품들의 slug 및 product_id 업데이트 시작...\n');

  const updates = [
    { productId: 20, name: 'MAS 한정판 모자(그레이)', slug: 'mas-limited-cap-gray', compositionSlug: 'mas-limited-cap-gray' },
    { productId: 19, name: 'MAS 한정판 모자(블랙)', slug: 'mas-limited-cap-black', compositionSlug: 'mas-limited-cap-black' },
    { productId: 7, name: 'MASSGOO × MUZIIK 프리미엄 클러치백 (베이지)', slug: 'massgoo-muziik-clutch-beige', compositionSlug: 'massgoo-muziik-clutch-beige' },
    { productId: 9, name: 'MASSGOO × MUZIIK 프리미엄 클러치백 (그레이)', slug: 'massgoo-muziik-clutch-gray', compositionSlug: 'massgoo-muziik-clutch-gray' },
  ];

  // 1. 제품 slug 업데이트
  console.log('📝 제품 slug 업데이트...');
  for (const update of updates) {
    const { error } = await supabase
      .from('products')
      .update({ slug: update.slug, updated_at: new Date().toISOString() })
      .eq('id', update.productId);
    
    if (error) {
      console.log(`   ❌ ${update.name} slug 업데이트 실패: ${error.message}`);
    } else {
      console.log(`   ✅ ${update.name} → slug: ${update.slug}`);
    }
    await new Promise(resolve => setTimeout(resolve, 200));
  }

  // 2. product_composition의 product_id 업데이트
  console.log('\n📝 product_composition의 product_id 업데이트...');
  for (const update of updates) {
    // composition slug로 찾기
    const { data: compositions, error: findError } = await supabase
      .from('product_composition')
      .select('id, slug, product_id')
      .eq('slug', update.compositionSlug)
      .limit(1)
      .maybeSingle();
    
    if (findError || !compositions) {
      console.log(`   ⚠️ ${update.compositionSlug} composition을 찾을 수 없습니다.`);
      continue;
    }
    
    if (compositions.product_id === update.productId) {
      console.log(`   ✅ ${update.compositionSlug} 이미 연결됨 (product_id: ${update.productId})`);
      continue;
    }
    
    const { error: updateError } = await supabase
      .from('product_composition')
      .update({ product_id: update.productId })
      .eq('id', compositions.id);
    
    if (updateError) {
      console.log(`   ❌ ${update.compositionSlug} product_id 업데이트 실패: ${updateError.message}`);
    } else {
      console.log(`   ✅ ${update.compositionSlug} → product_id: ${update.productId}`);
    }
    await new Promise(resolve => setTimeout(resolve, 200));
  }

  // 3. 최종 결과 확인
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
    .not('slug', 'is', null)
    .neq('slug', '')
    .order('display_order', { ascending: true });

  if (!finalError && compositions) {
    console.log(`\n✅ 총 ${compositions.length}개 제품 합성 관리 항목 확인:`);
    let matched = 0;
    let skuMatched = 0;
    let slugMatched = 0;
    
    for (const comp of compositions) {
      const product = comp.products;
      const expectedSku = comp.slug.toUpperCase().replace(/-/g, '_');
      
      if (product) {
        matched++;
        if (product.sku === expectedSku) {
          skuMatched++;
        }
        if (product.slug === comp.slug) {
          slugMatched++;
        }
        
        const status = [];
        if (product.sku === expectedSku) status.push('SKU 일치');
        else status.push(`SKU 불일치 (${product.sku || '(없음)'} vs ${expectedSku})`);
        if (product.slug === comp.slug) status.push('slug 일치');
        else status.push(`slug 불일치 (${product.slug || '(없음)'} vs ${comp.slug})`);
        
        console.log(`   ${product.sku === expectedSku && product.slug === comp.slug ? '✅' : '⚠️'} ${comp.name}: ${status.join(', ')}`);
      } else {
        console.log(`   ❌ ${comp.name}: 제품 매칭 안됨`);
      }
    }
    
    console.log(`\n📊 최종 통계:`);
    console.log(`   - 제품 매칭: ${matched}/${compositions.length}개`);
    console.log(`   - SKU 일치: ${skuMatched}/${compositions.length}개`);
    console.log(`   - slug 일치: ${slugMatched}/${compositions.length}개`);
  }

  console.log('\n✅ 작업 완료!');
}

main().catch(console.error);

