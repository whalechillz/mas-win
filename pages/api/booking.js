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
    const { name, phone, date, time, club } = req.body;
    
    console.log('Booking request:', { name, phone, date, time, club });

    // 필수 필드 확인
    if (!name || !phone) {
      return res.status(400).json({ 
        success: false, 
        message: '이름과 연락처는 필수입니다.' 
      });
    }

    // 간단히 성공 응답만 반환 (DB 저장 없이)
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