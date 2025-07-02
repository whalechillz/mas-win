import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { name, phone, date, time, club } = req.body;

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

    if (error) throw error;

    // Slack 알림 전송
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

    await fetch(process.env.SLACK_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(slackMessage)
    });

    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Booking error:', error);
    res.status(500).json({ error: 'Failed to process booking' });
  }
}