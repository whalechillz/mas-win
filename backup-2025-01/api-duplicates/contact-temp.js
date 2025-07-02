export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { name, phone, call_times } = req.body;

    // Slack 알림만 전송 (Supabase 없이)
    const slackWebhookUrl = process.env.SLACK_WEBHOOK_URL;
    
    if (slackWebhookUrl) {
      const slackMessage = {
        text: `📞 새로운 문의가 접수되었습니다!`,
        blocks: [
          {
            type: 'header',
            text: {
              type: 'plain_text',
              text: '📞 문의 접수 알림'
            }
          },
          {
            type: 'section',
            fields: [
              { type: 'mrkdwn', text: `*이름:* ${name}` },
              { type: 'mrkdwn', text: `*연락처:* ${phone}` },
              { type: 'mrkdwn', text: `*통화 가능 시간:* ${call_times}` }
            ]
          },
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: `_${new Date().toLocaleString('ko-KR')}에 접수됨_`
            }
          }
        ]
      };

      await fetch(slackWebhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(slackMessage)
      });
    }

    // 성공 응답
    res.status(200).json({ 
      success: true, 
      message: '문의가 접수되었습니다.' 
    });
    
  } catch (error) {
    console.error('Contact error:', error);
    res.status(500).json({ 
      error: 'Failed to process contact',
      message: error.message 
    });
  }
}