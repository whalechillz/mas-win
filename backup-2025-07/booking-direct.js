export default async function handler(req, res) {
  // CORS 설정
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { name, phone, date, time, club, swing_style, priority, current_distance, recommended_flex, expected_distance } = req.body;
    
    // 필수 필드 확인
    if (!name || !phone || !date || !time) {
      return res.status(400).json({ 
        success: false, 
        message: '필수 정보가 누락되었습니다.' 
      });
    }

    // 직접 fetch로 Supabase API 호출
    const SUPABASE_URL = 'https://yyytjudftrvpmcnppaymw.supabase.co';
    const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl5eXRqdWRmdHZwbWNucHBheW13Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE0NDcxMTksImV4cCI6MjA2NzAyMzExOX0.TxT-vnDjFip_CCL7Ag8mR7G59dMdQAKfPLY1S3TJqRE';
    
    const response = await fetch(`${SUPABASE_URL}/rest/v1/bookings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Prefer': 'return=representation'
      },
      body: JSON.stringify({
        name,
        phone,
        date,
        time,
        club: club || null,
        swing_style: swing_style || null,
        priority: priority || null,
        current_distance: current_distance || null,
        recommended_flex: recommended_flex || null,
        expected_distance: expected_distance || null,
        status: 'pending'
      })
    });

    const data = await response.json();
    
    if (response.ok) {
      // Slack 알림 (선택사항)
      try {
        const slackMessage = `🎯 새로운 시타 예약!
이름: ${name}
전화: ${phone}
날짜: ${date}
시간: ${time}
클럽: ${club || '미선택'}`;
        
        // Slack 알림은 실패해도 무시
        await fetch(process.env.SLACK_WEBHOOK_URL || '', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: slackMessage })
        }).catch(() => {});
      } catch (e) {
        // Slack 에러 무시
      }

      return res.status(200).json({ 
        success: true, 
        message: '예약이 완료되었습니다.',
        data: data[0] || { name, phone, date, time, club }
      });
    } else {
      throw new Error('Database save failed');
    }
    
  } catch (error) {
    console.error('Booking error:', error);
    res.status(500).json({ 
      success: false,
      message: '서버 오류가 발생했습니다.',
      error: error.message
    });
  }
}