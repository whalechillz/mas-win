// 드라이버 제품들의 slug를 실제 폴더명(product_composition.slug)으로 업데이트
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
  console.log('🔧 드라이버 제품 slug를 실제 폴더명으로 업데이트 시작...\n');

  // 모든 드라이버 제품과 product_composition 조인
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

  console.log(`📋 총 ${products.length}개 드라이버 제품 확인:\n`);
  
  const updates = [];
  
  for (const product of products) {
    const comp = product.product_composition 
      ? (Array.isArray(product.product_composition) 
          ? product.product_composition[0] 
          : product.product_composition)
      : null;
    
    const actualSlug = comp?.slug || product.slug;
    
    if (!actualSlug) {
      console.log(`⚠️ ${product.name}: slug 없음 (건너뜀)`);
      continue;
    }
    
    if (product.slug === actualSlug) {
      console.log(`✅ ${product.name}: slug 일치 (${actualSlug})`);
      continue;
    }
    
    console.log(`📝 ${product.name}:`);
    console.log(`   현재: ${product.slug || '(없음)'}`);
    console.log(`   변경: ${actualSlug}`);
    
    updates.push({
      id: product.id,
      name: product.name,
      currentSlug: product.slug,
      newSlug: actualSlug
    });
  }

  if (updates.length === 0) {
    console.log('\n✅ 모든 slug가 일치합니다. 업데이트할 항목이 없습니다.');
    return;
  }

  console.log(`\n📝 ${updates.length}개 제품 slug 업데이트 중...\n`);
  
  for (const update of updates) {
    const { error: updateError } = await supabase
      .from('products')
      .update({ 
        slug: update.newSlug,
        updated_at: new Date().toISOString()
      })
      .eq('id', update.id);

    if (updateError) {
      console.log(`   ❌ ${update.name} 업데이트 실패: ${updateError.message}`);
    } else {
      console.log(`   ✅ ${update.name}: ${update.currentSlug || '(없음)'} → ${update.newSlug}`);
    }
    
    await new Promise(resolve => setTimeout(resolve, 200));
  }

  console.log('\n✅ 작업 완료!');
}

main().catch(console.error);

