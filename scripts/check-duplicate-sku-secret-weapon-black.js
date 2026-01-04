// SECRET_WEAPON_BLACK SKU 중복 확인
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
  console.log('🔍 SECRET_WEAPON_BLACK SKU 중복 확인...\n');

  // SECRET_WEAPON_BLACK SKU를 가진 모든 제품 찾기
  const { data: products, error } = await supabase
    .from('products')
    .select('id, name, sku, slug, product_type, category')
    .eq('sku', 'SECRET_WEAPON_BLACK');

  if (error) {
    console.error('❌ 오류:', error);
    return;
  }

  if (!products || products.length === 0) {
    console.log('⚠️ SECRET_WEAPON_BLACK SKU를 가진 제품이 없습니다.');
    return;
  }

  console.log(`📋 SECRET_WEAPON_BLACK SKU를 가진 제품 ${products.length}개 발견:\n`);
  
  products.forEach((p, index) => {
    console.log(`${index + 1}. ID: ${p.id}`);
    console.log(`   이름: ${p.name}`);
    console.log(`   SKU: ${p.sku}`);
    console.log(`   slug: ${p.slug || '(없음)'}`);
    console.log(`   product_type: ${p.product_type || '(없음)'}`);
    console.log(`   category: ${p.category || '(없음)'}`);
    console.log('');
  });

  // 시크리트웨폰 관련 제품 모두 확인
  console.log('\n📋 "시크리트웨폰" 관련 제품 확인...\n');
  const { data: allWeapons, error: allError } = await supabase
    .from('products')
    .select('id, name, sku, slug')
    .or('name.ilike.%시크리트웨폰%,name.ilike.%secret%weapon%')
    .order('name', { ascending: true });

  if (!allError && allWeapons) {
    allWeapons.forEach(p => {
      console.log(`   - ${p.name}`);
      console.log(`     SKU: ${p.sku || '(없음)'}`);
      console.log(`     slug: ${p.slug || '(없음)'}`);
      console.log('');
    });
  }

  // product_composition에서도 확인
  console.log('\n📋 product_composition에서 "시크리트웨폰" 확인...\n');
  const { data: compositions, error: compError } = await supabase
    .from('product_composition')
    .select('id, name, slug, product_id')
    .or('name.ilike.%시크리트웨폰%,slug.ilike.%secret%weapon%')
    .order('name', { ascending: true });

  if (!compError && compositions) {
    compositions.forEach(comp => {
      console.log(`   - ${comp.name}`);
      console.log(`     slug: ${comp.slug}`);
      console.log(`     product_id: ${comp.product_id || '(없음)'}`);
      console.log('');
    });
  }
}

main().catch(console.error);

