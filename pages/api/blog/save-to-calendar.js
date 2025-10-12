// 블로그 포스트를 콘텐츠 캘린더에 자동 등록
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { 
      blogPostId, 
      title, 
      content, 
      contentType, 
      customerPersona, 
      conversionGoal,
      landingPage,
      publishedDate = new Date().toISOString().split('T')[0]
    } = req.body;

    // 콘텐츠 캘린더에 등록
    const { data: calendarContent, error } = await supabase
      .from('cc_content_calendar')
      .insert({
        year: new Date(publishedDate).getFullYear(),
        month: new Date(publishedDate).getMonth() + 1,
        content_date: publishedDate,
        theme: title,
        content_type: 'blog',
        title: title,
        description: content.substring(0, 200),
        content_body: content,
        target_audience: {
          persona: customerPersona,
          stage: conversionGoal
        },
        conversion_tracking: {
          landingPage: landingPage,
          goal: conversionGoal,
          utmParams: {
            source: 'blog',
            medium: 'organic',
            campaign: contentType
          }
        },
        status: 'published',
        published_channels: ['blog'],
        blog_post_id: blogPostId,
        seo_meta: {
          title: title,
          description: content.substring(0, 160),
          keywords: extractKeywords(title)
        }
      })
      .select()
      .single();

    if (error) {
      console.error('콘텐츠 캘린더 등록 오류:', error);
      return res.status(500).json({ 
        error: '콘텐츠 캘린더 등록 실패',
        details: error.message 
      });
    }

    return res.json({
      success: true,
      calendarContentId: calendarContent.id,
      message: '콘텐츠 캘린더에 성공적으로 등록되었습니다.'
    });

  } catch (error) {
    console.error('블로그 → 캘린더 연동 오류:', error);
    return res.status(500).json({ 
      error: '블로그 → 캘린더 연동 실패',
      details: error.message 
    });
  }
}

function extractKeywords(title) {
  const keywords = title.split(' ').slice(0, 5);
  return keywords.map(k => k.replace(/[^\w가-힣]/g, '')).filter(k => k.length > 1);
}
