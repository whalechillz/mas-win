import { AUDIENCE_STAGES } from '../../../../lib/masgolf-brand-data';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { blogPost, trackingUrl } = req.body;
    const stage = AUDIENCE_STAGES[blogPost.conversionGoal];
    
    // SMS는 80자 제한
    const shortContent = blogPost.title.length > 50 
      ? blogPost.title.substring(0, 47) + '...'
      : blogPost.title;
    
    const content = `${shortContent}\n${stage.cta} ${trackingUrl}`;
    
    return res.json({
      success: true,
      channel: 'sms',
      content: content,
      schedule_date: getSMSScheduleDate(),
      conversion_tracking: {
        url: trackingUrl,
        goal: stage.conversionGoal
      },
      status: 'draft',
      characterCount: content.length,
      isWithinLimit: content.length <= 80
    });

  } catch (error) {
    console.error('SMS 메시지 생성 오류:', error);
    return res.status(500).json({ 
      error: 'SMS 메시지 생성 실패',
      details: error.message 
    });
  }
}

function getSMSScheduleDate() {
  const date = new Date();
  date.setHours(date.getHours() + 2); // 2시간 후
  return date.toISOString();
}
