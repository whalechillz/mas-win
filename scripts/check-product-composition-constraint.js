/**
 * product_composition 테이블의 category 체크 제약 조건 확인
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

  // SQL로 체크 제약 조건 확인
  const { data, error } = await supabase.rpc('exec_sql', {
    sql: `
      SELECT 
        conname AS constraint_name,
        pg_get_constraintdef(oid) AS constraint_definition
      FROM pg_constraint
      WHERE conrelid = 'product_composition'::regclass
        AND contype = 'c'
        AND conname LIKE '%category%';
    `
  }).catch(async () => {
    // RPC가 없으면 직접 쿼리
    const { data: tableInfo } = await supabase
      .from('product_composition')
      .select('*')
      .limit(1);
    
    return { data: null, error: null };
  });

  // 대신 현재 테이블의 category 값들을 확인
  console.log('📊 현재 product_composition 테이블의 category 값들:');
  const { data: categories, error: catError } = await supabase
    .from('product_composition')
    .select('category')
    .limit(100);

  if (!catError && categories) {
    const uniqueCategories = [...new Set(categories.map(c => c.category))];
    console.log('   발견된 카테고리:', uniqueCategories);
  }

  // 각 카테고리로 테스트 삽입
  console.log('\n🧪 각 카테고리 값으로 테스트 삽입:');
  const testCategories = ['cap', 'driver', 'accessory', 'apparel', 'hat', 'goods'];
  
  for (const testCat of testCategories) {
    const testData = {
      product_id: null,
      name: `테스트 ${Date.now()}-${testCat}`,
      slug: `test-${Date.now()}-${testCat}`,
      category: testCat,
      composition_target: 'head',
      image_url: '',
      reference_images: [],
      is_active: true,
      display_order: 0,
    };

    const { error } = await supabase
      .from('product_composition')
      .insert([testData]);

    if (error) {
      console.log(`   ❌ "${testCat}": ${error.message}`);
    } else {
      console.log(`   ✅ "${testCat}": 성공`);
      // 테스트 데이터 삭제
      await supabase
        .from('product_composition')
        .delete()
        .eq('slug', testData.slug);
    }
  }

  console.log('\n✅ 확인 완료');
}

checkConstraint().catch(console.error);

