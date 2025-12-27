/**
 * Supabase REST API를 통해 products 테이블 확장
 * ALTER TABLE 문을 개별적으로 실행
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

// SQL 문장들 (COMMENT 제외)
const sqlStatements = [
  // 제품 타입 구분
  "ALTER TABLE products ADD COLUMN IF NOT EXISTS product_type VARCHAR(50) DEFAULT 'goods'",
  
  // 드라이버 제품 필드
  "ALTER TABLE products ADD COLUMN IF NOT EXISTS slug VARCHAR(255)",
  "ALTER TABLE products ADD COLUMN IF NOT EXISTS subtitle VARCHAR(255)",
  "ALTER TABLE products ADD COLUMN IF NOT EXISTS badge_left VARCHAR(50)",
  "ALTER TABLE products ADD COLUMN IF NOT EXISTS badge_right VARCHAR(50)",
  "ALTER TABLE products ADD COLUMN IF NOT EXISTS badge_left_color VARCHAR(50)",
  "ALTER TABLE products ADD COLUMN IF NOT EXISTS badge_right_color VARCHAR(50)",
  "ALTER TABLE products ADD COLUMN IF NOT EXISTS border_color VARCHAR(50)",
  "ALTER TABLE products ADD COLUMN IF NOT EXISTS features JSONB DEFAULT '[]'",
  "ALTER TABLE products ADD COLUMN IF NOT EXISTS specifications JSONB",
  "ALTER TABLE products ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 0",
  
  // 이미지 관리 (타입별 분리)
  "ALTER TABLE products ADD COLUMN IF NOT EXISTS detail_images JSONB DEFAULT '[]'",
  "ALTER TABLE products ADD COLUMN IF NOT EXISTS composition_images JSONB DEFAULT '[]'",
  "ALTER TABLE products ADD COLUMN IF NOT EXISTS gallery_images JSONB DEFAULT '[]'",
  
  // PG 연동 필드
  "ALTER TABLE products ADD COLUMN IF NOT EXISTS pg_product_id VARCHAR(255)",
  "ALTER TABLE products ADD COLUMN IF NOT EXISTS pg_price_id VARCHAR(255)",
  "ALTER TABLE products ADD COLUMN IF NOT EXISTS payment_enabled BOOLEAN DEFAULT false",
  
  // 재고 관리 확장
  "ALTER TABLE products ADD COLUMN IF NOT EXISTS min_stock_level INTEGER DEFAULT 0",
  "ALTER TABLE products ADD COLUMN IF NOT EXISTS max_stock_level INTEGER",
  "ALTER TABLE products ADD COLUMN IF NOT EXISTS auto_reorder BOOLEAN DEFAULT false",
];

async function executeSQL(statement) {
  try {
    // Supabase는 직접 SQL 실행을 지원하지 않으므로
    // REST API를 통해 실행 시도
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseServiceKey,
        'Authorization': `Bearer ${supabaseServiceKey}`
      },
      body: JSON.stringify({ sql_query: statement })
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${await response.text()}`);
    }

    return { success: true };
  } catch (error) {
    // exec_sql 함수가 없을 수 있음
    throw error;
  }
}

async function extendProductsTable() {
  console.log('🔄 products 테이블 확장 시작...\n');
  console.log('⚠️  참고: Supabase는 직접 SQL 실행을 지원하지 않습니다.');
  console.log('   Supabase 대시보드 → SQL Editor에서 수동 실행이 필요합니다.\n');
  console.log('📝 실행할 SQL 문장:\n');

  sqlStatements.forEach((stmt, idx) => {
    console.log(`${idx + 1}. ${stmt};`);
  });

  console.log('\n📋 다음 단계:');
  console.log('1. Supabase 대시보드 접속: https://supabase.com/dashboard');
  console.log('2. 프로젝트 선택');
  console.log('3. SQL Editor 메뉴 클릭');
  console.log('4. 위의 SQL 문장들을 복사하여 실행');
  console.log('5. 또는 database/extend-products-table-for-drivers.sql 파일 내용을 복사하여 실행\n');

  // 인덱스 생성은 별도로 안내
  console.log('📌 인덱스 생성 (선택사항):');
  console.log('CREATE UNIQUE INDEX IF NOT EXISTS idx_products_slug_unique ON products(slug) WHERE slug IS NOT NULL;');
  console.log('CREATE INDEX IF NOT EXISTS idx_products_product_type ON products(product_type);');
  console.log('CREATE INDEX IF NOT EXISTS idx_products_display_order ON products(display_order);\n');
}

extendProductsTable().catch(error => {
  console.error('❌ 오류 발생:', error);
  process.exit(1);
});

