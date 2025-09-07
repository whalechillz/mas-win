const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Supabase 환경 변수가 설정되지 않았습니다.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function addSchedulingFields() {
  try {
    console.log('🚀 스케줄링 필드를 추가합니다...');
    
    // 먼저 테이블 구조 확인
    const { data: posts, error: testError } = await supabase
      .from('blog_posts')
      .select('*')
      .limit(1);
    
    if (testError) {
      console.error('❌ 테이블 접근 오류:', testError);
      return;
    }
    
    console.log('✅ 테이블 접근 성공');
    
    // 기존 포스트에 is_scheduled 필드 추가 (이미 있다면 무시)
    const { error: updateError } = await supabase
      .from('blog_posts')
      .update({ is_scheduled: false })
      .is('is_scheduled', null);
    
    if (updateError && !updateError.message.includes('column "is_scheduled" does not exist')) {
      console.log('⚠️ is_scheduled 필드 업데이트 오류 (무시 가능):', updateError.message);
    } else {
      console.log('✅ is_scheduled 필드 업데이트 완료');
    }
    
    console.log('\n📝 Supabase 대시보드에서 다음 SQL을 실행해주세요:');
    console.log(`
-- 스케줄링 필드 추가
ALTER TABLE blog_posts 
ADD COLUMN IF NOT EXISTS scheduled_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS is_scheduled BOOLEAN DEFAULT FALSE;

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_blog_posts_scheduled_at ON blog_posts(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_blog_posts_is_scheduled ON blog_posts(is_scheduled);

-- 기존 포스트 업데이트
UPDATE blog_posts SET is_scheduled = FALSE WHERE is_scheduled IS NULL;
    `);
    
  } catch (error) {
    console.error('❌ 스케줄링 필드 추가 중 오류:', error);
  }
}

// 실행
addSchedulingFields();
