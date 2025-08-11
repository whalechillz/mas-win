const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('환경변수 확인:');
console.log('URL:', supabaseUrl);
console.log('Key exists:', !!supabaseKey);

if (!supabaseUrl || !supabaseKey) {
  console.error('환경변수가 없습니다!');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
  try {
    console.log('Supabase 연결 테스트 중...');
    
    // campaign_metrics 테이블 확인
    const { data, error } = await supabase
      .from('campaign_metrics')
      .select('*')
      .limit(5);
    
    if (error) {
      console.error('데이터베이스 오류:', error);
      return;
    }
    
    console.log('연결 성공!');
    console.log('캠페인 데이터:', data);
    
    // page_views 테이블 확인
    const { count } = await supabase
      .from('page_views')
      .select('*', { count: 'exact', head: true });
    
    console.log('페이지뷰 수:', count);
    
  } catch (error) {
    console.error('연결 실패:', error);
  }
}

testConnection();
