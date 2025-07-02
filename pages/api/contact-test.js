export default async function handler(req, res) {
  // CORS 헤더 추가
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { name, phone, call_times } = req.body;
    
    console.log('Contact received:', { name, phone, call_times });
    
    // 임시로 성공 응답만 반환 (DB 저장 없이)
    res.status(200).json({ 
      success: true, 
      message: '문의가 접수되었습니다.',
      data: { name, phone, call_times }
    });
    
  } catch (error) {
    console.error('Contact error:', error);
    res.status(500).json({ 
      error: 'Failed to process contact',
      message: error.message 
    });
  }
}