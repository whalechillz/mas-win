/**
 * product_composition 테이블의 category 체크 제약 조건 확인 (간단 버전)
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

async function checkConstraint() {
  console.log('🔍 product_composition 테이블의 category 체크 제약 조건 확인\n');

  // 현재 테이블의 category 값들 확인
  console.log('📊 현재 product_composition 테이블의 category 값들:');
  const { data: compositions, error: catError } = await supabase
    .from('product_composition')
    .select('category')
    .limit(100);

  if (!catError && compositions) {
    const uniqueCategories = [...new Set(compositions.map(c => c.category).filter(Boolean))];
    console.log('   발견된 카테고리:', uniqueCategories.sort());
  }

  // 각 카테고리로 테스트 삽입
  console.log('\n🧪 각 카테고리 값으로 테스트 삽입:');
  const testCategories = ['cap', 'driver', 'accessory', 'apparel'];
  
  for (const testCat of testCategories) {
    const testSlug = `test-${Date.now()}-${testCat}-${Math.random().toString(36).substring(7)}`;
    const testData = {
      product_id: null,
      name: `테스트 ${testCat}`,
      slug: testSlug,
      category: testCat,
      composition_target: testCat === 'cap' ? 'head' : (testCat === 'driver' ? 'hands' : (testCat === 'apparel' ? 'body' : 'hands')),
      image_url: '',
      reference_images: [],
      is_active: true,
      display_order: 0,
    };

    const { error, data } = await supabase
      .from('product_composition')
      .insert([testData])
      .select();

    if (error) {
      console.log(`   ❌ "${testCat}": ${error.message}`);
      if (error.message.includes('category_check')) {
        console.log(`      ⚠️ 카테고리 체크 제약 조건 위반!`);
      }
    } else {
      console.log(`   ✅ "${testCat}": 성공 (ID: ${data?.[0]?.id})`);
      // 테스트 데이터 삭제
      if (data && data[0]) {
        await supabase
          .from('product_composition')
          .delete()
          .eq('id', data[0].id);
      }
    }
  }

  console.log('\n✅ 확인 완료');
}

checkConstraint().catch(console.error);

