// 이미지 프록시 API - CORS 문제 해결
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { url } = req.query;

  if (!url) {
    return res.status(400).json({ error: 'URL parameter is required' });
  }

  try {
    console.log('🖼️ 이미지 프록시 요청:', url);

    // 허용된 이미지 도메인 검증
    const allowedDomains = [
      'postfiles.pstatic.net',
      'blogpfthumb-phinf.pstatic.net',
      'dthumb-phinf.pstatic.net',
      'blogimgs.pstatic.net',
      'yyytjudftvpmcnppaymw.supabase.co', // Supabase Storage 도메인
      'images.unsplash.com', // Unsplash 이미지 도메인
      'unsplash.com' // Unsplash 도메인
    ];

    const imageUrl = new URL(url);
    if (!allowedDomains.includes(imageUrl.hostname)) {
      return res.status(403).json({ error: 'Domain not allowed' });
    }

    // 이미지 다운로드
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Referer': 'https://blog.naver.com/',
        'Accept': 'image/webp,image/apng,image/*,*/*;q=0.8'
      }
    });

    if (!response.ok) {
      console.error('❌ 이미지 다운로드 실패:', response.status, response.statusText);
      return res.status(response.status).json({ 
        error: `Failed to fetch image: ${response.statusText}` 
      });
    }

    // 이미지 데이터 가져오기
    const imageBuffer = await response.arrayBuffer();
    const contentType = response.headers.get('content-type') || 'image/jpeg';

    // CORS 헤더 설정
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'public, max-age=86400'); // 24시간 캐시

    console.log('✅ 이미지 프록시 성공:', url);
    res.status(200).send(Buffer.from(imageBuffer));

  } catch (error) {
    console.error('❌ 이미지 프록시 오류:', error.message);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
}
