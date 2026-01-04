// 제품 합성 관리 slug 기준으로 제품 관리 SKU 업데이트 실행
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Supabase 환경 변수가 설정되지 않았습니다.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function executeQuery(queryText, description) {
  console.log(`\n📝 ${description}...`);
  try {
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: queryText });
    
    if (error) {
      // RPC가 없으면 직접 쿼리 실행 시도
      console.log(`   ⚠️ RPC 방식 실패, 직접 쿼리 실행 시도...`);
      // Supabase JS 클라이언트는 직접 SQL 실행을 지원하지 않으므로
      // 각 UPDATE를 개별적으로 실행
      return { success: false, error, needsManualExecution: true };
    }
    
    return { success: true, data };
  } catch (err) {
    return { success: false, error: err, needsManualExecution: true };
  }
}

async function updateProductSku(productName, sku, slug) {
  console.log(`   🔄 ${productName} → SKU: ${sku}`);
  
  // 제품명으로 제품 찾기
  const { data: products, error: findError } = await supabase
    .from('products')
    .select('id, name, sku, slug')
    .or(`name.ilike.%${productName}%,name.ilike.%${productName.replace(/\s/g, '%')}%`);
  
  if (findError) {
    console.log(`   ❌ 조회 오류: ${findError.message}`);
    return false;
  }
  
  if (!products || products.length === 0) {
    console.log(`   ⚠️ 제품을 찾을 수 없습니다: ${productName}`);
    return false;
  }
  
  // 중복 SKU 확인
  const { data: existingSku, error: skuError } = await supabase
    .from('products')
    .select('id, name')
    .eq('sku', sku)
    .limit(1)
    .single();
  
  if (skuError && skuError.code !== 'PGRST116') { // PGRST116 = no rows returned
    console.log(`   ❌ SKU 확인 오류: ${skuError.message}`);
    return false;
  }
  
  if (existingSku && existingSku.id !== products[0].id) {
    console.log(`   ⚠️ SKU가 이미 사용 중입니다: ${sku} (${existingSku.name})`);
    return false;
  }
  
  // SKU 업데이트
  const { error: updateError } = await supabase
    .from('products')
    .update({
      sku: sku,
      slug: slug || products[0].slug,
      updated_at: new Date().toISOString()
    })
    .eq('id', products[0].id);
  
  if (updateError) {
    console.log(`   ❌ 업데이트 오류: ${updateError.message}`);
    return false;
  }
  
  console.log(`   ✅ 업데이트 완료: ${products[0].name} → ${sku}`);
  return true;
}

async function updateProductCompositionProductId() {
  console.log(`\n📝 product_composition의 product_id 업데이트...`);
  
  // 모든 product_composition 가져오기
  const { data: compositions, error: compError } = await supabase
    .from('product_composition')
    .select('id, slug, product_id')
    .not('slug', 'is', null)
    .neq('slug', '');
  
  if (compError) {
    console.log(`   ❌ 조회 오류: ${compError.message}`);
    return;
  }
  
  let updated = 0;
  for (const comp of compositions) {
    if (comp.product_id) continue; // 이미 연결됨
    
    // slug로 제품 찾기
    const { data: products, error: findError } = await supabase
      .from('products')
      .select('id')
      .eq('slug', comp.slug)
      .limit(1)
      .maybeSingle();
    
    if (findError || !products) continue;
    
    // product_id 업데이트
    const { error: updateError } = await supabase
      .from('product_composition')
      .update({ product_id: products.id })
      .eq('id', comp.id);
    
    if (!updateError) {
      updated++;
      console.log(`   ✅ ${comp.slug} → product_id: ${products.id}`);
    }
  }
  
  console.log(`   ✅ 총 ${updated}개 product_id 업데이트 완료`);
}

async function main() {
  console.log('🚀 제품 합성 관리 slug 기준 SKU 업데이트 시작...\n');

  // 매칭되지 않은 제품들의 SKU 업데이트
  const updates = [
    { name: '시크리트포스 PRO 3', sku: 'SECRET_FORCE_PRO_3', slug: 'secret-force-pro-3' },
    { name: '시크리트포스 V3', sku: 'SECRET_FORCE_V3', slug: 'secret-force-v3' },
    { name: '시크리트웨폰 블랙', sku: 'SECRET_WEAPON_BLACK', slug: 'secret-weapon-black' },
    { name: '시크리트웨폰 골드 4.1', sku: 'SECRET_WEAPON_GOLD_4_1', slug: 'secret-weapon-gold-4-1' },
    { name: '마쓰구 화이트캡', sku: 'MASSGOO_WHITE_CAP', slug: 'massgoo-white-cap' },
    { name: '마쓰구 블랙캡', sku: 'MASSGOO_BLACK_CAP', slug: 'massgoo-black-cap' },
    { name: 'MAS 한정판 모자(그레이)', sku: 'MAS_LIMITED_CAP_GRAY', slug: 'mas-limited-cap-gray' },
    { name: 'MAS 한정판 모자(블랙)', sku: 'MAS_LIMITED_CAP_BLACK', slug: 'mas-limited-cap-black' },
    { name: '클러치백 베이지', sku: 'MASSGOO_MUZIIK_CLUTCH_BEIGE', slug: 'massgoo-muziik-clutch-beige' },
    { name: '클러치백 그레이', sku: 'MASSGOO_MUZIIK_CLUTCH_GRAY', slug: 'massgoo-muziik-clutch-gray' },
  ];

  let successCount = 0;
  for (const update of updates) {
    const success = await updateProductSku(update.name, update.sku, update.slug);
    if (success) successCount++;
    await new Promise(resolve => setTimeout(resolve, 200)); // API rate limit 방지
  }

  console.log(`\n📊 SKU 업데이트 결과: ${successCount}/${updates.length}개 성공`);

  // product_composition의 product_id 업데이트
  await updateProductCompositionProductId();

  // 최종 결과 확인
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
    
    for (const comp of compositions) {
      const product = comp.products;
      const expectedSku = comp.slug.toUpperCase().replace(/-/g, '_');
      
      if (product) {
        matched++;
        if (product.sku === expectedSku) {
          skuMatched++;
          console.log(`   ✅ ${comp.name}: SKU 일치 (${product.sku})`);
        } else {
          console.log(`   ⚠️ ${comp.name}: SKU 불일치 (현재: ${product.sku || '(없음)'}, 예상: ${expectedSku})`);
        }
      } else {
        console.log(`   ❌ ${comp.name}: 제품 매칭 안됨`);
      }
    }
    
    console.log(`\n📊 최종 통계:`);
    console.log(`   - 제품 매칭: ${matched}/${compositions.length}개`);
    console.log(`   - SKU 일치: ${skuMatched}/${compositions.length}개`);
  }

  console.log('\n✅ 작업 완료!');
}

main().catch(console.error);

