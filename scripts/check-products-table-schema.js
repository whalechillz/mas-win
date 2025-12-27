/**
 * products 테이블 스키마 확인
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Supabase 환경 변수가 설정되지 않았습니다.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkSchema() {
  console.log('🔍 products 테이블 스키마 확인 중...\n');

  try {
    // 기존 제품 하나 조회하여 스키마 확인
    const { data: sample, error } = await supabase
      .from('products')
      .select('*')
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error('❌ 제품 조회 실패:', error.message);
      return;
    }

    if (!sample) {
      console.log('⚠️  products 테이블에 데이터가 없습니다.');
      console.log('   스키마 확인을 위해 빈 객체로 테스트합니다.\n');
    }

    // 필요한 컬럼 목록
    const requiredColumns = [
      'product_type',
      'slug',
      'subtitle',
      'badge_left',
      'badge_right',
      'badge_left_color',
      'badge_right_color',
      'border_color',
      'features',
      'specifications',
      'display_order',
      'detail_images',
      'composition_images',
      'gallery_images',
      'pg_product_id',
      'pg_price_id',
      'payment_enabled',
      'min_stock_level',
      'max_stock_level',
      'auto_reorder'
    ];

    console.log('📋 필요한 컬럼 확인:\n');
    
    const missingColumns = [];
    const existingColumns = [];

    // 각 컬럼이 존재하는지 확인 (샘플 데이터로 확인)
    for (const col of requiredColumns) {
      if (sample && col in sample) {
        existingColumns.push(col);
        console.log(`  ✅ ${col}`);
      } else {
        missingColumns.push(col);
        console.log(`  ❌ ${col} (없음)`);
      }
    }

    console.log(`\n📊 요약:`);
    console.log(`  ✅ 존재하는 컬럼: ${existingColumns.length}개`);
    console.log(`  ❌ 없는 컬럼: ${missingColumns.length}개`);

    if (missingColumns.length > 0) {
      console.log(`\n⚠️  다음 컬럼들이 없습니다:`);
      missingColumns.forEach(col => console.log(`  - ${col}`));
      console.log(`\n📋 다음 SQL을 Supabase 대시보드에서 실행하세요:`);
      console.log(`   database/extend-products-table-for-drivers.sql`);
    } else {
      console.log(`\n✅ 모든 필요한 컬럼이 존재합니다!`);
      console.log(`   드라이버 제품 마이그레이션을 진행할 수 있습니다.`);
    }

  } catch (error) {
    console.error('❌ 스키마 확인 중 오류:', error.message);
  }
}

checkSchema().catch(error => {
  console.error('❌ 오류 발생:', error);
  process.exit(1);
});

