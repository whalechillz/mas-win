// 마쓰구 블랙캡 제품 정보 확인
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
  console.log('🔍 마쓰구 블랙캡 제품 정보 확인...\n');

  // 여러 이름으로 검색
  const searchTerms = ['마쓰구 블랙캡', '미쓰구 블랙캡', 'MASSGOO', 'BLACK_CAP', 'MS_CAP_BLACK'];

  for (const term of searchTerms) {
    const { data: products, error } = await supabase
      .from('products')
      .select('id, name, sku, slug, category')
      .or(`name.ilike.%${term}%,sku.ilike.%${term}%,slug.ilike.%${term}%`)
      .limit(5);

    if (error) {
      console.log(`   ❌ 오류: ${error.message}`);
      continue;
    }

    if (products && products.length > 0) {
      console.log(`✅ "${term}" 검색 결과:`);
      products.forEach(p => {
        console.log(`   - ID: ${p.id}`);
        console.log(`     이름: ${p.name}`);
        console.log(`     SKU: ${p.sku || '(없음)'}`);
        console.log(`     slug: ${p.slug || '(없음)'}`);
        console.log(`     카테고리: ${p.category || '(없음)'}`);
        console.log('');
      });
    }
  }

  // product_composition에서도 확인
  console.log('\n📋 product_composition에서 확인...');
  const { data: compositions, error: compError } = await supabase
    .from('product_composition')
    .select('id, name, slug, product_id')
    .or('name.ilike.%블랙캡%,name.ilike.%black%,slug.ilike.%black%')
    .limit(5);

  if (!compError && compositions) {
    compositions.forEach(comp => {
      console.log(`   - 이름: ${comp.name}`);
      console.log(`     slug: ${comp.slug}`);
      console.log(`     product_id: ${comp.product_id || '(없음)'}`);
      console.log('');
    });
  }
}

main().catch(console.error);

