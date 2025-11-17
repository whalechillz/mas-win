// CORS 프록시를 통해 이미지를 제공하는 API
// Photopea 등 외부 서비스에서 Supabase Storage 이미지를 로드할 때 CORS 문제를 해결
export default async function handler(req, res) {
  // CORS preflight 요청 처리
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { url } = req.query;

    if (!url) {
      return res.status(400).json({ error: 'url parameter is required' });
    }

    // URL 검증: Supabase Storage URL만 허용
    const supabaseUrlPattern = /^https:\/\/[^/]+\.supabase\.co\/storage\/v1\/object\/public\//;
    if (!supabaseUrlPattern.test(url)) {
      return res.status(400).json({ 
        error: 'Invalid URL. Only Supabase Storage URLs are allowed.' 
      });
    }

    // 타임아웃을 위한 AbortController 생성
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10초 타임아웃

    // 이미지 다운로드
    let imageResponse;
    try {
      imageResponse = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; ImageProxy/1.0)',
          'Accept': 'image/*',
        },
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timeoutId);
    }

    if (!imageResponse.ok) {
      console.error('❌ 이미지 다운로드 실패:', {
        status: imageResponse.status,
        statusText: imageResponse.statusText,
        url: url.substring(0, 100) + '...'
      });
      return res.status(imageResponse.status).json({ 
        error: `Failed to fetch image: ${imageResponse.statusText}` 
      });
    }

    const imageBuffer = await imageResponse.arrayBuffer();
    const contentType = imageResponse.headers.get('content-type') || 'image/jpeg';
    const contentLength = imageResponse.headers.get('content-length');

    // 이미지 크기 제한 (10MB)
    const maxSize = 10 * 1024 * 1024;
    if (imageBuffer.byteLength > maxSize) {
      return res.status(413).json({ 
        error: 'Image too large. Maximum size is 10MB.' 
      });
    }

    // CORS 헤더 설정 (모든 도메인 허용)
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Length', contentLength || imageBuffer.byteLength);
    
    // 캐싱 설정 (1시간)
    res.setHeader('Cache-Control', 'public, max-age=3600, s-maxage=3600');
    
    // 원본 URL을 참조하는 헤더 추가
    res.setHeader('X-Original-URL', url);

    res.status(200).send(Buffer.from(imageBuffer));
  } catch (error) {
    console.error('❌ Image proxy error:', error);
    
    // 타임아웃 에러 처리
    if (error.name === 'AbortError' || error.message?.includes('aborted')) {
      return res.status(504).json({ 
        error: 'Request timeout. The image server did not respond in time.' 
      });
    }

    res.status(500).json({ 
      error: 'Internal server error',
      message: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

