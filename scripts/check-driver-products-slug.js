// 드라이버 제품들의 slug 확인
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
  console.log('🔍 드라이버 제품들의 slug 확인...\n');

  // 모든 드라이버 제품 가져오기
  const { data: products, error } = await supabase
    .from('products')
    .select(`
      id,
      name,
      sku,
      slug,
      product_type,
      product_composition!product_composition_product_id_fkey (
        id,
        name,
        slug
      )
    `)
    .eq('product_type', 'driver')
    .order('name', { ascending: true });

  if (error) {
    console.error('❌ 오류:', error);
    return;
  }

  if (!products || products.length === 0) {
    console.log('⚠️ 드라이버 제품을 찾을 수 없습니다.');
    return;
  }

  console.log(`📋 총 ${products.length}개 드라이버 제품:\n`);
  
  for (const product of products) {
    console.log(`제품명: ${product.name}`);
    console.log(`  ID: ${product.id}`);
    console.log(`  SKU: ${product.sku || '(없음)'}`);
    console.log(`  products.slug: ${product.slug || '(없음)'}`);
    
    if (product.product_composition) {
      const comp = Array.isArray(product.product_composition) 
        ? product.product_composition[0] 
        : product.product_composition;
      console.log(`  product_composition.slug: ${comp?.slug || '(없음)'}`);
      
      if (product.slug !== comp?.slug) {
        console.log(`  ⚠️ slug 불일치!`);
      }
    } else {
      console.log(`  product_composition.slug: (없음)`);
    }
    
    console.log('');
  }
}

main().catch(console.error);

