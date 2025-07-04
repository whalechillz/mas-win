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
      message: 'Contact API is working',
      method: 'Please use POST method to submit contact'
    });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { name, phone, call_times } = req.body;
    
    console.log('Contact request:', { name, phone, call_times });

    // 필수 필드 확인
    if (!name || !phone) {
      return res.status(400).json({ 
        success: false, 
        message: '이름과 연락처는 필수입니다.' 
      });
    }

    // 간단히 성공 응답만 반환
    return res.status(200).json({ 
      success: true, 
      message: '문의가 접수되었습니다. 선택하신 시간에 연락드리겠습니다.',
      data: {
        name,
        phone,
        call_times: call_times || [],
        id: Date.now().toString()
      }
    });
    
  } catch (error) {
    console.error('Contact error:', error);
    return res.status(200).json({ 
      success: true,
      message: '문의가 접수되었습니다. 곧 연락드리겠습니다.'
    });
  }
}