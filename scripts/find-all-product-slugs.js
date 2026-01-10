/**
 * 모든 제품 slug 확인 스크립트
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

async function findAllSlugs() {
  console.log('🔍 모든 제품 slug 확인\n');

  // products 테이블의 모든 slug
  console.log('📊 products 테이블의 모든 slug:');
  const { data: products, error: productsError } = await supabase
    .from('products')
    .select('id, name, slug, product_type')
    .order('slug');

  if (productsError) {
    console.error('❌ products 조회 오류:', productsError);
  } else {
    console.log(`   총 ${products?.length || 0}개 제품:`);
    products?.forEach(p => {
      const type = p.product_type || 'unknown';
      console.log(`   - ${p.slug}: ${p.name} (${type})`);
    });
  }

  // product_composition 테이블의 모든 slug
  console.log('\n📊 product_composition 테이블의 모든 slug:');
  const { data: compositions, error: compError } = await supabase
    .from('product_composition')
    .select('id, name, slug, category')
    .order('slug');

  if (compError) {
    console.error('❌ product_composition 조회 오류:', compError);
  } else {
    console.log(`   총 ${compositions?.length || 0}개:`);
    compositions?.forEach(c => {
      const category = c.category || 'unknown';
      console.log(`   - ${c.slug}: ${c.name} (${category})`);
    });
  }

  // 시크리트웨폰 골드 관련 제품 찾기
  console.log('\n🔍 시크리트웨폰 골드 4.1 관련 제품 검색:');
  
  const { data: goldProducts, error: goldError } = await supabase
    .from('products')
    .select('id, name, slug')
    .or('name.ilike.%시크리트웨폰%골드%4%,name.ilike.%시크리트웨폰%4%,name.ilike.%골드%웨폰%4%');

  if (goldError) {
    console.error('❌ 검색 오류:', goldError);
  } else {
    console.log(`   ${goldProducts?.length || 0}개 발견:`);
    goldProducts?.forEach(p => {
      console.log(`   - ${p.slug}: ${p.name}`);
    });
  }

  const { data: goldComps, error: goldCompError } = await supabase
    .from('product_composition')
    .select('id, name, slug')
    .or('name.ilike.%시크리트웨폰%골드%4%,name.ilike.%시크리트웨폰%4%,name.ilike.%골드%웨폰%4%');

  if (!goldCompError && goldComps) {
    console.log(`   product_composition: ${goldComps.length}개 발견:`);
    goldComps?.forEach(c => {
      console.log(`   - ${c.slug}: ${c.name}`);
    });
  }

  console.log('\n✅ 확인 완료');
}

findAllSlugs().catch(console.error);
