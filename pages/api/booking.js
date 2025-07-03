const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export default async function handler(req, res) {
  // CORS 설정
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { name, phone, date, time, club } = req.body;
    
    console.log('Booking received:', { name, phone, date, time, club });

    // Supabase 연결 확인
    if (!supabaseUrl || !supabaseAnonKey) {
      console.error('Supabase credentials not configured');
      throw new Error('Database configuration error');
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    // Supabase에 저장
    const { data, error } = await supabase
      .from('bookings')
      .insert({
        name,
        phone,
        date,
        time,
        club,
        status: 'pending'
      });

    if (error) {
      console.error('Supabase error:', error);
      throw error;
    }

    // Slack 알림 전송
    const slackWebhookUrl = process.env.SLACK_WEBHOOK_URL;
    
    if (slackWebhookUrl) {
      const slackMessage = {
        text: `🎯 새로운 시타 예약이 접수되었습니다!`,
        blocks: [
          {
            type: 'header',
            text: {
              type: 'plain_text',
              text: '🎯 시타 예약 알림'
            }
          },
          {
            type: 'section',
            fields: [
              { type: 'mrkdwn', text: `*이름:* ${name}` },
              { type: 'mrkdwn', text: `*연락처:* ${phone}` },
              { type: 'mrkdwn', text: `*날짜:* ${date}` },
              { type: 'mrkdwn', text: `*시간:* ${time}` },
              { type: 'mrkdwn', text: `*추천 클럽:* ${club || '미선택'}` }
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

      try {
        await fetch(slackWebhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(slackMessage)
        });
      } catch (slackError) {
        console.error('Slack notification error:', slackError);
        // Slack 에러는 무시하고 계속 진행
      }
    }

    res.status(200).json({ 
      success: true, 
      message: '예약이 완료되었습니다.',
      data 
    });
    
  } catch (error) {
    console.error('Booking error:', error);
    res.status(500).json({ 
      error: 'Failed to process booking',
      message: error.message 
    });
  }
}