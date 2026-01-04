/**
 * 제품 추가 API 직접 테스트
 * 카테고리 체크 제약 조건 오류 확인
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

async function testProductCompositionInsert() {
  console.log('🧪 제품 합성 데이터 삽입 테스트\n');

  // 테스트 데이터
  const testCases = [
    { category: 'cap', expected: 'hat' }, // cap은 hat으로 변환됨
    { category: 'CAP', expected: 'hat' },
    { category: 'Cap', expected: 'hat' },
    { category: 'driver', expected: 'driver' },
    { category: 'accessory', expected: 'accessory' },
    { category: 'apparel', expected: 'apparel' },
    { category: null, expected: 'accessory' },
    { category: '', expected: 'accessory' },
    { category: 'goods', expected: 'accessory' }, // 허용되지 않는 값
  ];

  for (const testCase of testCases) {
    console.log(`\n📋 테스트 케이스: category = "${testCase.category}"`);
    console.log(`   예상 결과: "${testCase.expected}"`);

    // 카테고리 매핑 로직 (코드와 동일)
    const normalizedCategory = testCase.category ? testCase.category.toLowerCase().trim() : null;
    let compCategory = 'accessory';
    let compTarget = 'hands';

    if (normalizedCategory === 'driver') {
      compCategory = 'driver';
      compTarget = 'hands';
    } else if (normalizedCategory === 'cap' || normalizedCategory === 'bucket_hat' || normalizedCategory === 'bucket-hat') {
      compCategory = 'hat'; // DB 체크 제약 조건에 맞춰 'hat' 사용
      compTarget = 'head';
    } else if (normalizedCategory === 'clutch' || normalizedCategory === 'bag') {
      compCategory = 'accessory';
      compTarget = 'hands';
    } else if (normalizedCategory === 'apparel' || normalizedCategory === 'tshirt') {
      compCategory = 'apparel';
      compTarget = 'body';
    }

    // 카테고리 검증 및 변환: cap -> hat
    const allowedCategories = ['hat', 'driver', 'accessory', 'apparel'];
    
    // cap을 hat으로 변환 (DB 스키마에 맞춤)
    if (compCategory === 'cap') {
      compCategory = 'hat';
      console.log(`   ✅ 카테고리 변환: cap -> hat`);
    }
    
    if (!allowedCategories.includes(compCategory)) {
      console.log(`   ⚠️ 허용되지 않은 카테고리 감지: "${compCategory}"`);
      compCategory = 'accessory';
      console.log(`   ✅ 기본값으로 변경: "${compCategory}"`);
    }

    console.log(`   최종 compCategory: "${compCategory}"`);

    // 실제 DB에 삽입 테스트 (테스트용 임시 데이터)
    const testData = {
      product_id: null, // 실제 제품 ID 없이 테스트
      name: `테스트 제품 ${Date.now()}`,
      slug: `test-${Date.now()}`,
      category: compCategory,
      composition_target: compTarget,
      image_url: '',
      reference_images: [],
      is_active: true,
      display_order: 0,
    };

    try {
      const { error } = await supabase
        .from('product_composition')
        .insert([testData]);

      if (error) {
        console.log(`   ❌ 삽입 실패: ${error.message}`);
        if (error.message.includes('category_check')) {
          console.log(`   ⚠️ 카테고리 체크 제약 조건 위반!`);
          console.log(`   전달된 category: "${compCategory}"`);
        }
      } else {
        console.log(`   ✅ 삽입 성공`);
        // 테스트 데이터 삭제
        await supabase
          .from('product_composition')
          .delete()
          .eq('slug', testData.slug);
      }
    } catch (err) {
      console.log(`   ❌ 예외 발생: ${err.message}`);
    }
  }

  console.log('\n✅ 테스트 완료');
}

testProductCompositionInsert().catch(console.error);

