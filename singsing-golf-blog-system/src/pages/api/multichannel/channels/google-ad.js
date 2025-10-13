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
      channel: 'google_ad',
      headline1: blogPost.title.substring(0, 30),
      headline2: stage.cta,
      description: blogPost.summary.substring(0, 80),
      landing_page: trackingUrl,
      target_keywords: extractKeywords(blogPost.title),
      schedule_date: getGoogleAdScheduleDate(),
      conversion_tracking: {
        url: trackingUrl,
        goal: stage.conversionGoal
      },
      status: 'draft',
      budget: 'daily_20000', // 일일 2만원
      bid_strategy: 'target_cpa'
    });

  } catch (error) {
    console.error('구글 광고 생성 오류:', error);
    return res.status(500).json({ 
      error: '구글 광고 생성 실패',
      details: error.message 
    });
  }
}

function getGoogleAdScheduleDate() {
  const date = new Date();
  date.setHours(date.getHours() + 4); // 4시간 후
  return date.toISOString();
}

function extractKeywords(title) {
  const keywords = title.split(' ').slice(0, 5);
  return keywords.map(k => k.replace(/[^\w가-힣]/g, '')).filter(k => k.length > 1);
}
