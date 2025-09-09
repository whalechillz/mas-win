export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { url } = req.body;
    
    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }

    console.log(`🧪 테스트 마이그레이션 시작: ${url}`);

    // 간단한 응답만 반환
    return res.status(200).json({
      success: true,
      message: '테스트 마이그레이션 성공',
      data: {
        url: url,
        timestamp: new Date().toISOString(),
        status: 'test-success'
      }
    });

  } catch (error) {
    console.error('테스트 마이그레이션 오류:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
}
