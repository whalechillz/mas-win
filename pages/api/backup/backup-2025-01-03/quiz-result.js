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
    const { style, priority, current_distance, recommended_product } = req.body;
    
    console.log('Quiz result received:', { style, priority, current_distance, recommended_product });
    
    // 임시로 성공 응답만 반환 (DB 저장 없이)
    res.status(200).json({ 
      success: true, 
      message: '퀴즈 결과가 저장되었습니다.',
      data: { style, priority, current_distance, recommended_product }
    });
    
  } catch (error) {
    console.error('Quiz result error:', error);
    res.status(500).json({ 
      error: 'Failed to save quiz result',
      message: error.message 
    });
  }
}