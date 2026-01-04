// 찾을 수 없는 제품들을 더 정확하게 찾기
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Supabase 환경 변수가 설정되지 않았습니다.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function findProduct(searchTerms) {
  console.log(`\n🔍 "${searchTerms.join('", "')}" 검색 중...`);
  
  // 여러 검색어로 시도
  for (const term of searchTerms) {
    const { data: products, error } = await supabase
      .from('products')
      .select('id, name, sku, slug, category, product_type')
      .or(`name.ilike.%${term}%,sku.ilike.%${term}%,slug.ilike.%${term}%`)
      .limit(10);
    
    if (error) {
      console.log(`   ❌ 오류: ${error.message}`);
      continue;
    }
    
    if (products && products.length > 0) {
      console.log(`   ✅ ${products.length}개 제품 발견:`);
      products.forEach(p => {
        console.log(`      - ID: ${p.id}, 이름: ${p.name}, SKU: ${p.sku || '(없음)'}, slug: ${p.slug || '(없음)'}`);
      });
      return products;
    }
  }
  
  console.log(`   ❌ 제품을 찾을 수 없습니다.`);
  return null;
}

async function main() {
  console.log('🔍 찾을 수 없는 제품 검색 시작...\n');

  const searches = [
    { name: '마쓰구 블랙캡', terms: ['마쓰구', '블랙', '캡', 'BLACK', 'CAP', 'massgoo', 'black', 'cap'] },
    { name: 'MAS 한정판 모자(그레이)', terms: ['MAS', '한정판', '그레이', 'GRAY', 'LIMITED', 'mas-limited', 'gray'] },
    { name: 'MAS 한정판 모자(블랙)', terms: ['MAS', '한정판', '블랙', 'BLACK', 'LIMITED', 'mas-limited', 'black'] },
    { name: 'MASSGOO × MUZIIK 프리미엄 클러치백 (베이지)', terms: ['클러치백', '베이지', 'CLUTCH', 'BEIGE', 'clutch', 'beige'] },
    { name: 'MASSGOO × MUZIIK 프리미엄 클러치백 (그레이)', terms: ['클러치백', '그레이', 'CLUTCH', 'GRAY', 'clutch', 'gray'] },
  ];

  for (const search of searches) {
    await findProduct(search.terms);
    await new Promise(resolve => setTimeout(resolve, 300));
  }

  console.log('\n✅ 검색 완료!');
}

main().catch(console.error);

