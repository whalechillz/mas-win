// 제품 합성 관리의 모든 slug를 확인하고 제품 관리의 SKU 업데이트 검증
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
  console.log('🚀 제품 합성 관리 slug 확인 및 제품 관리 SKU 검증 시작...\n');

  try {
    // 1. 제품 합성 관리의 모든 slug 가져오기
    const { data: compositions, error: compError } = await supabase
      .from('product_composition')
      .select('id, name, slug, product_id, display_order')
      .not('slug', 'is', null)
      .neq('slug', '')
      .order('display_order', { ascending: true });

    if (compError) {
      throw compError;
    }

    console.log(`📋 제품 합성 관리 slug 총 ${compositions.length}개 발견\n`);

    // 2. 각 slug에 대해 제품 관리에서 매칭 확인
    const results = {
      matched: [],
      unmatched: [],
      errors: []
    };

    for (const comp of compositions) {
      const expectedSku = comp.slug.toUpperCase().replace(/-/g, '_');
      
      // product_id로 먼저 찾기
      let product = null;
      if (comp.product_id) {
        const { data, error } = await supabase
          .from('products')
          .select('id, name, sku, slug')
          .eq('id', comp.product_id)
          .single();
        
        if (!error && data) {
          product = data;
        }
      }

      // product_id로 못 찾으면 slug로 찾기
      if (!product) {
        const { data, error } = await supabase
          .from('products')
          .select('id, name, sku, slug')
          .eq('slug', comp.slug)
          .maybeSingle();
        
        if (!error && data) {
          product = data;
        }
      }

      if (product) {
        const isSkuMatch = product.sku === expectedSku;
        const isSlugMatch = product.slug === comp.slug;
        
        results.matched.push({
          composition: {
            id: comp.id,
            name: comp.name,
            slug: comp.slug,
            product_id: comp.product_id
          },
          product: {
            id: product.id,
            name: product.name,
            sku: product.sku,
            slug: product.slug,
            expected_sku: expectedSku
          },
          match: {
            sku_match: isSkuMatch,
            slug_match: isSlugMatch,
            needs_update: !isSkuMatch
          }
        });

        console.log(`${isSkuMatch ? '✅' : '⚠️'} ${comp.name}`);
        console.log(`   합성 slug: ${comp.slug}`);
        console.log(`   제품 SKU: ${product.sku || '(없음)'}`);
        console.log(`   예상 SKU: ${expectedSku}`);
        if (!isSkuMatch) {
          console.log(`   ⚠️ SKU 업데이트 필요`);
        }
        console.log('');
      } else {
        results.unmatched.push({
          composition: {
            id: comp.id,
            name: comp.name,
            slug: comp.slug,
            product_id: comp.product_id
          },
          expected_sku: expectedSku
        });

        console.log(`❌ ${comp.name}`);
        console.log(`   합성 slug: ${comp.slug}`);
        console.log(`   예상 SKU: ${expectedSku}`);
        console.log(`   ⚠️ 제품 관리에서 매칭되지 않음\n`);
      }
    }

    // 3. 결과 요약
    console.log('\n📊 결과 요약:');
    console.log(`✅ 매칭된 제품: ${results.matched.length}개`);
    console.log(`❌ 매칭 안된 제품: ${results.unmatched.length}개`);
    
    const needsUpdate = results.matched.filter(r => r.match.needs_update).length;
    if (needsUpdate > 0) {
      console.log(`⚠️ SKU 업데이트 필요: ${needsUpdate}개`);
    }

    // 4. JSON 파일로 저장
    const fs = require('fs');
    const outputPath = 'scripts/verify-products-with-composition-slugs-result.json';
    fs.writeFileSync(outputPath, JSON.stringify(results, null, 2));
    console.log(`\n💾 결과가 ${outputPath}에 저장되었습니다.`);

  } catch (error) {
    console.error('❌ 오류 발생:', error);
    process.exit(1);
  }
}

main();

