import { AUDIENCE_STAGES } from '../../../../lib/masgolf-brand-data';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { blogPost, trackingUrl } = req.body;
    const stage = AUDIENCE_STAGES[blogPost.conversionGoal];
    
    return res.json({
      success: true,
      channel: 'naver_blog',
      title: blogPost.title,
      content: blogPost.content,
      excerpt: blogPost.summary,
      cta_banner: {
        text: stage.cta,
        url: trackingUrl,
        button_text: '지금 확인하기'
      },
      schedule_date: getNaverBlogScheduleDate(),
      conversion_tracking: {
        url: trackingUrl,
        goal: stage.conversionGoal
      },
      status: 'draft',
      seo_optimized: true
    });

  } catch (error) {
    console.error('네이버 블로그 포스트 생성 오류:', error);
    return res.status(500).json({ 
      error: '네이버 블로그 포스트 생성 실패',
      details: error.message 
    });
  }
}

function getNaverBlogScheduleDate() {
  const date = new Date();
  date.setDate(date.getDate() + 1); // 1일 후
  return date.toISOString();
}
