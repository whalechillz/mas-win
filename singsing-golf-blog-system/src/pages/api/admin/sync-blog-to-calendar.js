// 기존 블로그 포스트들을 콘텐츠 캘린더에 동기화하는 API
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Supabase 환경 변수가 설정되지 않았습니다');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('🔄 블로그 포스트를 콘텐츠 캘린더에 동기화 시작...');

    // 1. 기존 cc_content_calendar 데이터 삭제 (blog_post_id가 있는 것만)
    console.log('🗑️ 기존 콘텐츠 캘린더 데이터 삭제 중...');
    const { error: deleteError } = await supabase
      .from('cc_content_calendar')
      .delete()
      .not('blog_post_id', 'is', null); // blog_post_id가 있는 데이터만 삭제

    if (deleteError) {
      console.error('❌ 기존 데이터 삭제 오류:', deleteError);
      throw deleteError;
    }

    // 2. blog_posts 테이블에서 데이터 조회
    console.log('📝 블로그 포스트 데이터 조회 중...');
    const { data: blogPosts, error: blogError } = await supabase
      .from('blog_posts')
      .select('*')
      .order('created_at', { ascending: false });

    if (blogError) {
      console.error('❌ 블로그 포스트 조회 오류:', blogError);
      throw blogError;
    }

    console.log(`📊 조회된 블로그 포스트: ${blogPosts.length}개`);

    if (blogPosts.length === 0) {
      return res.status(200).json({
        success: true,
        message: '동기화할 블로그 포스트가 없습니다.',
        syncedCount: 0
      });
    }

    // 3. cc_content_calendar에 삽입할 데이터 준비
    const calendarData = blogPosts.map(post => {
      const publishedDate = post.published_at || post.created_at;
      const date = new Date(publishedDate);
      
      return {
        id: crypto.randomUUID(),
        year: date.getFullYear(),
        month: date.getMonth() + 1,
        content_date: date.toISOString().split('T')[0],
        content_type: 'blog',
        title: post.meta_title || post.title || '제목 없음',
        description: post.meta_description || post.excerpt || post.summary || post.content || '설명 없음',
        target_audience: post.target_audience || {
          type: 'new_customer',
          persona: '시니어 골퍼',
          pain_point: '비거리 감소',
          tone: '전문적, 친근함',
          focus: '제품 기능, 성공 사례',
          channels: ['blog', 'naver_blog', 'kakao', 'sms'],
          messaging: '문제 해결, 가치 제안'
        },
        conversion_tracking: post.conversion_tracking || {
          enabled: false,
          goal: 'engagement',
          url: 'https://www.mas9golf.com/',
          utmParams: {
            source: 'blog',
            medium: 'organic',
            campaign: post.category || '일반'
          }
        },
        published_channels: post.published_channels || ['blog', 'naver_blog'],
        seo_meta: post.seo_meta || {
          title: post.meta_title || '',
          description: post.meta_description || '',
          keywords: post.meta_keywords || ''
        },
        status: post.status || 'published',
        blog_post_id: post.id, // 핵심: blog_posts.id를 blog_post_id로 연결
        content_body: post.content || post.summary || '콘텐츠 내용이 없습니다.',
        is_root_content: true,
        created_at: post.created_at,
        updated_at: post.updated_at
      };
    });

    // 4. cc_content_calendar에 일괄 삽입
    console.log('💾 콘텐츠 캘린더에 데이터 삽입 중...');
    const { data: insertedData, error: insertError } = await supabase
      .from('cc_content_calendar')
      .insert(calendarData)
      .select();

    if (insertError) {
      console.error('❌ 콘텐츠 캘린더 삽입 오류:', insertError);
      throw insertError;
    }

    console.log(`✅ 동기화 완료: ${insertedData.length}개 항목`);

    // 5. 결과 확인
    const { data: verifyData, error: verifyError } = await supabase
      .from('cc_content_calendar')
      .select('id, title, blog_post_id')
      .not('blog_post_id', 'is', null);

    if (verifyError) {
      console.error('❌ 검증 오류:', verifyError);
    }

    return res.status(200).json({
      success: true,
      message: `블로그 포스트 ${blogPosts.length}개를 콘텐츠 캘린더에 성공적으로 동기화했습니다.`,
      syncedCount: insertedData.length,
      verifiedCount: verifyData?.length || 0,
      data: insertedData
    });

  } catch (error) {
    console.error('❌ 동기화 오류:', error);
    return res.status(500).json({
      success: false,
      error: '블로그 포스트 동기화 중 오류가 발생했습니다.',
      details: error.message
    });
  }
}
