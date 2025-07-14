// pages/api/generate-multichannel-content.js
// JavaScript 버전으로 단순화 (TypeScript 컴파일 문제 회피)

export default async function handler(req, res) {
  // CORS 헤더 추가
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { year, month } = req.body;
    
    // 더미 응답 반환 (테스트용)
    return res.status(200).json({
      success: true,
      contentCount: 10,
      message: `${year}년 ${month}월 콘텐츠가 생성되었습니다. (테스트 모드)`,
      contents: []
    });
    
  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
}