import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Supabase 환경 변수가 설정되지 않았습니다');
  console.error('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '설정됨' : '없음');
  console.error('SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? '설정됨' : '없음');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export default async function handler(req, res) {
  try {
    console.log('🔍 데이터베이스 연결 테스트 시작...');
    
    // blog_posts 테이블에서 모든 데이터 조회
    const { data: blogPosts, error: blogError } = await supabase
      .from('blog_posts')
      .select('id, title, status, content_type, conversion_goal')
      .limit(10);
    
    console.log('📊 blog_posts 조회 결과:', { blogPosts, blogError });
    
    // cc_content_calendar 테이블에서 모든 데이터 조회
    const { data: calendarContent, error: calendarError } = await supabase
      .from('cc_content_calendar')
      .select('id, title, blog_post_id')
      .limit(5);
    
    console.log('📊 cc_content_calendar 조회 결과:', { calendarContent, calendarError });
    
    return res.json({
      success: true,
      blogPosts: blogPosts || [],
      calendarContent: calendarContent || [],
      blogError: blogError?.message,
      calendarError: calendarError?.message,
      environment: {
        supabaseUrl: supabaseUrl ? '설정됨' : '없음',
        supabaseServiceKey: supabaseServiceKey ? '설정됨' : '없음'
      }
    });
    
  } catch (error) {
    console.error('❌ 데이터베이스 연결 테스트 실패:', error);
    return res.status(500).json({
      success: false,
      error: error.message,
      stack: error.stack
    });
  }
}
