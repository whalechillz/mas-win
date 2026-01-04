// 버킷햇 제품들의 카테고리 확인
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
  console.log('🔍 버킷햇 제품들의 카테고리 확인...\n');

  const { data: products, error } = await supabase
    .from('products')
    .select('id, name, sku, category, product_type')
    .or('name.ilike.%버킷햇%,name.ilike.%bucket%')
    .order('name', { ascending: true });

  if (error) {
    console.error('❌ 오류:', error);
    return;
  }

  if (!products || products.length === 0) {
    console.log('⚠️ 버킷햇 제품을 찾을 수 없습니다.');
    return;
  }

  console.log(`📋 총 ${products.length}개 버킷햇 제품 발견:\n`);
  
  for (const product of products) {
    console.log(`제품명: ${product.name}`);
    console.log(`  ID: ${product.id}`);
    console.log(`  SKU: ${product.sku || '(없음)'}`);
    console.log(`  카테고리: ${product.category || '(없음)'}`);
    console.log(`  product_type: ${product.product_type || '(없음)'}`);
    console.log('');
  }

  // bucket_hat 카테고리를 cap으로 업데이트
  console.log('\n📝 bucket_hat 카테고리를 cap으로 업데이트...');
  const { data: updated, error: updateError } = await supabase
    .from('products')
    .update({ category: 'cap', updated_at: new Date().toISOString() })
    .eq('category', 'bucket_hat')
    .select('id, name, category');

  if (updateError) {
    console.error('❌ 업데이트 오류:', updateError);
  } else {
    console.log(`✅ ${updated?.length || 0}개 제품 업데이트 완료`);
    if (updated && updated.length > 0) {
      updated.forEach(p => {
        console.log(`   - ${p.name}: ${p.category}`);
      });
    }
  }
}

main().catch(console.error);

