// pages/api/slack/kakao-regenerate.js
// 슬랙에서 "다시" 명령을 받아 자동 생성 API를 호출하는 엔드포인트
// Slack Workflow Builder나 간단한 웹훅에서 호출 가능

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // 슬랙 웹훅에서 오는 경우 text 필드 확인
    const { text, event } = req.body;
    
    // Slack Events API 형식인 경우
    if (event && event.text) {
      const messageText = event.text.toLowerCase();
      if (!messageText.includes('다시') && !messageText.includes('재생성')) {
        return res.status(200).json({ ok: true, message: 'Not a regenerate command' });
      }
    }
    
    // 일반 웹훅 형식인 경우
    if (text) {
      const messageText = text.toLowerCase();
      if (!messageText.includes('다시') && !messageText.includes('재생성')) {
        return res.status(200).json({ ok: true, message: 'Not a regenerate command' });
      }
    }

    // 오늘 날짜
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    
    console.log(`🔄 슬랙에서 재생성 요청 받음: ${todayStr}`);
    
    // 자동 생성 API 호출
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 
      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');
    
    const generateResponse = await fetch(`${baseUrl}/api/kakao-content/auto-generate-today`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': process.env.INTERNAL_API_SECRET ? `Bearer ${process.env.INTERNAL_API_SECRET}` : ''
      },
      body: JSON.stringify({})
    });

    if (!generateResponse.ok) {
      const errorData = await generateResponse.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP ${generateResponse.status}`);
    }

    const generateResult = await generateResponse.json();
    
    res.status(200).json({
      ok: true,
      message: '자동 생성 요청이 시작되었습니다. 완료되면 슬랙으로 알림이 전송됩니다.',
      date: todayStr,
      result: generateResult
    });

  } catch (error) {
    console.error('슬랙 재생성 에러:', error);
    res.status(500).json({
      ok: false,
      error: error.message
    });
  }
}

