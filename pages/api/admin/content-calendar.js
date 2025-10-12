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
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Supabase 환경 변수가 설정되지 않았습니다');
    return res.status(500).json({ 
      success: false, 
      message: '서버 설정 오류',
      error: 'Supabase 환경 변수가 설정되지 않았습니다'
    });
  }

  try {
    console.log('🔍 콘텐츠 캘린더 API 시작');
    
    // cc_content_calendar 테이블은 사용하지 않고 blog_posts만 사용
    console.log('📅 blog_posts 테이블만 사용하여 콘텐츠 캘린더 구성...');
    const calendarData = []; // 빈 배열로 설정

    // blog_posts 테이블에서도 데이터 가져오기 (연동된 블로그 포스트)
    console.log('📝 blog_posts 테이블 조회 시작...');
    const { data: blogData, error: blogError } = await supabase
      .from('blog_posts')
      .select('*')
      .order('published_at', { ascending: false })
      .limit(100); // 최대 100개까지 가져오기
    
    console.log('📝 blog_posts 조회 결과:', {
      dataLength: blogData ? blogData.length : 0,
      error: blogError
    });

    console.log('📝 블로그 데이터:', blogData ? blogData.length : 0, '개');
    if (blogError) {
      console.error('❌ Supabase 쿼리 에러:', blogError);
      return res.status(500).json({
        success: false,
        error: '블로그 데이터 조회 실패',
        details: blogError.message
      });
    }

    // 데이터 변환 및 통합
    const contents = [];

    // cc_content_calendar 데이터는 사용하지 않음 (단순화)

    // 블로그 포스트 데이터도 포함 (모든 블로그 표시)
    if (blogData) {
      console.log('📝 블로그 데이터 처리 시작:', blogData.length, '개');
      blogData.forEach((blog, index) => {
        // 모든 블로그 포스트를 포함 (단순화)
        console.log(`📄 블로그 ${index + 1}: "${blog.title}"`);
        
        contents.push({
          id: `blog_${blog.id}`,
          title: blog.meta_title || blog.title || '제목 없음',
          content_type: 'blog',
          content_date: blog.published_at ? blog.published_at.split('T')[0] : new Date().toISOString().split('T')[0],
          status: blog.status || 'published',
          target_audience: blog.target_audience || {
            persona: '시니어 골퍼',
            stage: 'awareness'
          },
          conversion_tracking: blog.conversion_tracking || {
            landingPage: 'https://win.masgolf.co.kr',
            goal: '홈페이지 방문',
            utmParams: {
              source: 'blog',
              medium: 'organic',
              campaign: blog.category || '골프 정보'
            }
          },
          published_channels: blog.published_channels || ['blog', 'naver_blog'],
          blog_post_id: blog.id,
          seo_meta: {
            metaDescription: blog.meta_description,
            metaKeywords: blog.meta_keywords
          },
          content_body: blog.content || blog.summary || '콘텐츠 내용이 없습니다.'
        });
      });
    }

    // 날짜순으로 정렬
    contents.sort((a, b) => new Date(b.content_date) - new Date(a.content_date));

    console.log('✅ 최종 콘텐츠:', contents.length, '개');
    console.log('📊 상세 통계:', {
      calendarCount: calendarData ? calendarData.length : 0,
      blogCount: blogData ? blogData.length : 0,
      finalCount: contents.length
    });

    res.status(200).json({ 
      success: true, 
      contents,
      total: contents.length,
      calendarCount: calendarData ? calendarData.length : 0,
      blogCount: blogData ? blogData.length : 0,
      debug: {
        calendarData: calendarData ? calendarData.map(item => ({ id: item.id, title: item.title, date: item.content_date })) : [],
        blogData: blogData ? blogData.map(item => ({ id: item.id, title: item.title, date: item.published_at })) : []
      }
    });

  } catch (error) {
    console.error('❌ 콘텐츠 캘린더 API 오류:', error);
    console.error('상세 오류 정보:', {
      name: error.name,
      message: error.message,
      stack: error.stack
    });
    res.status(500).json({ 
      success: false, 
      message: '콘텐츠 캘린더 데이터 조회 실패', 
      error: error.message,
      details: error.stack
    });
  }
}
