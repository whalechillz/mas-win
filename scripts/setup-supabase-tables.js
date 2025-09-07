const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Supabase 환경 변수가 설정되지 않았습니다.');
  console.error('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✅ 설정됨' : '❌ 없음');
  console.error('SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? '✅ 설정됨' : '❌ 없음');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function setupTables() {
  try {
    console.log('🚀 Supabase 테이블 설정을 시작합니다...');
    
    // SQL 파일 읽기
    const sqlPath = path.join(__dirname, '..', 'supabase', 'create-blog-tables.sql');
    const sqlContent = fs.readFileSync(sqlPath, 'utf8');
    
    console.log('📄 SQL 스크립트를 실행합니다...');
    
    // SQL 실행
    const { data, error } = await supabase.rpc('exec_sql', { sql: sqlContent });
    
    if (error) {
      console.error('❌ SQL 실행 오류:', error);
      
      // RPC 함수가 없는 경우 직접 테이블 생성 시도
      console.log('🔄 RPC 함수가 없습니다. 직접 테이블을 생성합니다...');
      await createTablesDirectly();
    } else {
      console.log('✅ SQL 스크립트가 성공적으로 실행되었습니다.');
    }
    
    // 테이블 존재 확인
    await verifyTables();
    
  } catch (error) {
    console.error('❌ 테이블 설정 중 오류 발생:', error);
  }
}

async function createTablesDirectly() {
  try {
    console.log('📊 테이블을 직접 생성합니다...');
    
    // 1. blog_categories 테이블 생성
    const { error: categoriesError } = await supabase
      .from('blog_categories')
      .select('*')
      .limit(1);
    
    if (categoriesError && categoriesError.code === 'PGRST116') {
      console.log('Creating blog_categories table...');
      // 테이블이 없으면 생성 (실제로는 SQL로 생성해야 함)
    }
    
    // 2. 기본 카테고리 삽입
    const categories = [
      { name: '골프', slug: 'golf', description: '골프 관련 일반 정보' },
      { name: '고반발 드라이버', slug: 'high-rebound-driver', description: '고반발 드라이버 관련 정보' },
      { name: '시니어 드라이버', slug: 'senior-driver', description: '시니어 골퍼를 위한 드라이버 정보' },
      { name: '고객 후기', slug: 'customer-review', description: '고객 후기 및 성공 사례' },
      { name: '이벤트', slug: 'event', description: '이벤트 및 프로모션 정보' },
      { name: '튜토리얼', slug: 'tutorial', description: '골프 기술 및 장비 사용법' },
      { name: '고객스토리', slug: 'customer-story', description: '고객의 실제 경험담' }
    ];
    
    const { data: categoryData, error: categoryInsertError } = await supabase
      .from('blog_categories')
      .upsert(categories, { onConflict: 'slug' });
    
    if (categoryInsertError) {
      console.log('⚠️ 카테고리 삽입 오류 (테이블이 없을 수 있음):', categoryInsertError.message);
    } else {
      console.log('✅ 카테고리가 성공적으로 삽입되었습니다.');
    }
    
  } catch (error) {
    console.error('❌ 직접 테이블 생성 중 오류:', error);
  }
}

async function verifyTables() {
  try {
    console.log('🔍 테이블 존재를 확인합니다...');
    
    const tables = ['blog_categories', 'blog_tags', 'blog_posts', 'blog_post_tags'];
    
    for (const table of tables) {
      try {
        const { data, error } = await supabase
          .from(table)
          .select('*')
          .limit(1);
        
        if (error) {
          console.log(`❌ ${table} 테이블: ${error.message}`);
        } else {
          console.log(`✅ ${table} 테이블: 존재함`);
        }
      } catch (err) {
        console.log(`❌ ${table} 테이블: ${err.message}`);
      }
    }
    
  } catch (error) {
    console.error('❌ 테이블 확인 중 오류:', error);
  }
}

// 실행
setupTables();
