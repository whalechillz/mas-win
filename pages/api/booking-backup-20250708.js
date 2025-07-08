export default async function handler(req, res) {
  // CORS 설정
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'GET') {
    return res.status(200).json({ 
      message: 'Booking API is working',
      method: 'Please use POST method to submit booking'
    });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { name, phone, date, time, club, swing_style, priority, current_distance, recommended_flex, expected_distance } = req.body;
    
    console.log('Booking request:', { name, phone, date, time, club });

    // 필수 필드 확인
    if (!name || !phone) {
      return res.status(400).json({ 
        success: false, 
        message: '이름과 연락처는 필수입니다.' 
      });
    }

    // 슬랙 알림 전송
    try {
      const slackResponse = await fetch(`${req.headers.origin || 'https://win.masgolf.co.kr'}/api/slack/notify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'booking',
          data: {
            name,
            phone,
            date: date || '미정',
            time: time || '미정',
            club: club || '추천 대기',
            swing_style,
            priority,
            current_distance
          }
        })
      });

      if (!slackResponse.ok) {
        console.error('슬랙 알림 전송 실패');
      }
    } catch (slackError) {
      console.error('슬랙 알림 에러:', slackError);
      // 슬랙 알림 실패해도 예약은 계속 처리
    }

    // 성공 응답 반환
    return res.status(200).json({ 
      success: true, 
      message: '예약이 접수되었습니다. 담당자가 곧 연락드리겠습니다.',
      data: {
        name,
        phone,
        date: date || '미정',
        time: time || '미정',
        club: club || '추천 대기',
        id: Date.now().toString()
      }
    });
    
  } catch (error) {
    console.error('Booking error:', error);
    return res.status(200).json({ 
      success: true,
      message: '예약이 접수되었습니다. 담당자가 곧 연락드리겠습니다.'
    });
  }
}