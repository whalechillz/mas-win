/**
 * 실제 DB의 카테고리 값 확인
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Supabase 환경 변수가 설정되지 않았습니다.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkCategories() {
  console.log('🔍 실제 DB 카테고리 값 확인\n');

  // 1. product_composition 테이블의 category 값 확인
  console.log('📊 product_composition 테이블의 category 값:');
  const { data: compCategories, error: compError } = await supabase
    .from('product_composition')
    .select('category')
    .limit(100);

  if (!compError && compCategories) {
    const uniqueCategories = [...new Set(compCategories.map(c => c.category).filter(Boolean))];
    console.log('   발견된 카테고리:', uniqueCategories.sort());
    console.log('   각 카테고리별 개수:');
    const categoryCounts = {};
    compCategories.forEach(c => {
      if (c.category) {
        categoryCounts[c.category] = (categoryCounts[c.category] || 0) + 1;
      }
    });
    Object.entries(categoryCounts).sort().forEach(([cat, count]) => {
      console.log(`     ${cat}: ${count}개`);
    });
  }

  // 2. products 테이블의 category 값 확인
  console.log('\n📊 products 테이블의 category 값:');
  const { data: prodCategories, error: prodError } = await supabase
    .from('products')
    .select('category')
    .limit(100);

  if (!prodError && prodCategories) {
    const uniqueCategories = [...new Set(prodCategories.map(c => c.category).filter(Boolean))];
    console.log('   발견된 카테고리:', uniqueCategories.sort());
    console.log('   각 카테고리별 개수:');
    const categoryCounts = {};
    prodCategories.forEach(c => {
      if (c.category) {
        categoryCounts[c.category] = (categoryCounts[c.category] || 0) + 1;
      }
    });
    Object.entries(categoryCounts).sort().forEach(([cat, count]) => {
      console.log(`     ${cat}: ${count}개`);
    });
  }

  // 3. 모자 관련 제품 상세 확인
  console.log('\n📊 모자 관련 제품 상세:');
  const { data: hatProducts, error: hatError } = await supabase
    .from('product_composition')
    .select('id, name, category, composition_target, slug')
    .or('category.eq.hat,category.eq.cap')
    .limit(20);

  if (!hatError && hatProducts) {
    console.log(`   모자 관련 제품: ${hatProducts.length}개`);
    hatProducts.forEach(p => {
      console.log(`     - ${p.name} (category: ${p.category}, target: ${p.composition_target}, slug: ${p.slug})`);
    });
  }

  // 4. products 테이블의 모자 관련 제품 확인
  console.log('\n📊 products 테이블의 모자 관련 제품:');
  const { data: hatProducts2, error: hatError2 } = await supabase
    .from('products')
    .select('id, name, category, sku, slug')
    .or('category.eq.cap,category.eq.hat,category.eq.bucket_hat')
    .limit(20);

  if (!hatError2 && hatProducts2) {
    console.log(`   모자 관련 제품: ${hatProducts2.length}개`);
    hatProducts2.forEach(p => {
      console.log(`     - ${p.name} (category: ${p.category}, sku: ${p.sku}, slug: ${p.slug})`);
    });
  }

  console.log('\n✅ 확인 완료');
}

checkCategories().catch(console.error);



