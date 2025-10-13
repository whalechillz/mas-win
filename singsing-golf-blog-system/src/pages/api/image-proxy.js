import fetch from 'node-fetch';

export default async function handler(req, res) {
  // CORS 헤더 설정
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  // OPTIONS 요청 처리
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { url } = req.query;

  if (!url) {
    return res.status(400).json({ error: 'URL parameter is required' });
  }

  try {
    console.log('🖼️ 이미지 프록시 요청:', url);

    // User-Agent 헤더 추가하여 봇 차단 우회
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Referer': 'https://blog.naver.com/',
        'Accept': 'image/webp,image/apng,image/*,*/*;q=0.8',
        'Accept-Language': 'ko-KR,ko;q=0.9,en;q=0.8',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      },
      timeout: 10000 // 10초 타임아웃
    });

    if (!response.ok) {
      console.log('❌ 이미지 로드 실패:', response.status, response.statusText);
      return res.status(response.status).json({ 
        error: 'Image load failed', 
        status: response.status,
        statusText: response.statusText 
      });
    }

    // Content-Type 확인
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.startsWith('image/')) {
      console.log('❌ 이미지가 아님:', contentType);
      return res.status(400).json({ error: 'Not an image' });
    }

    // 이미지 데이터 가져오기
    const imageBuffer = await response.buffer();
    
    console.log('✅ 이미지 프록시 성공:', imageBuffer.length, 'bytes');

    // 응답 헤더 설정
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Length', imageBuffer.length);
    res.setHeader('Cache-Control', 'public, max-age=3600'); // 1시간 캐시
    
    // 이미지 데이터 전송
    res.send(imageBuffer);

  } catch (error) {
    console.error('❌ 이미지 프록시 오류:', error.message);
    return res.status(500).json({ 
      error: 'Image proxy error', 
      message: error.message 
    });
  }
}