import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { 
      topic,
      contentType = '골프 정보',
      customerPersona = '중상급 골퍼',
      brandWeight = 'medium',
      painPoint = '비거리 부족',
      conversionGoal = 'consideration',
      storyFramework = 'pixar'
    } = req.body;

    // 진행상황을 실시간으로 반환하기 위한 스트리밍 설정
    res.writeHead(200, {
      'Content-Type': 'text/plain',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type'
    });

    const sendProgress = (step, message, data = null) => {
      res.write(JSON.stringify({ step, message, data, timestamp: Date.now() }) + '\n');
    };

    try {
      // 1단계: 제목 생성
      sendProgress(1, '제목 생성 중...');
      
      const titlePrompt = `
주제: ${topic}
콘텐츠 타입: ${contentType}
고객 페르소나: ${customerPersona}
페인포인트: ${painPoint}

SEO 최적화된 블로그 제목 생성:
- 60자 이내
- 핵심 키워드 포함
- 클릭 유도력 있는 제목
- 마쓰구프 브랜드 자연스럽게 언급

제목만 생성:
`;

      const titleResponse = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: titlePrompt }],
        max_tokens: 100,
        temperature: 0.8
      });

      const title = titleResponse.choices[0].message.content.trim();
      sendProgress(1, '제목 생성 완료', { title });

      // 2단계: 요약 생성
      sendProgress(2, '요약 생성 중...');
      
      const summaryResponse = await fetch(`${req.headers.origin}/api/blog/generate-summary`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          contentType,
          customerPersona,
          brandWeight,
          painPoint,
          conversionGoal
        })
      });

      const summaryData = await summaryResponse.json();
      if (!summaryData.success) throw new Error(summaryData.error);
      
      sendProgress(2, '요약 생성 완료', { summary: summaryData.summary });

      // 3단계: 본문 생성
      sendProgress(3, '본문 생성 중...');
      
      const contentResponse = await fetch(`${req.headers.origin}/api/blog/generate-full-content`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          summary: summaryData.summary,
          contentType,
          customerPersona,
          brandWeight,
          painPoint,
          conversionGoal,
          storyFramework
        })
      });

      const contentData = await contentResponse.json();
      if (!contentData.success) throw new Error(contentData.error);
      
      sendProgress(3, '본문 생성 완료', { content: contentData.content });

      // 4단계: 메타태그 생성
      sendProgress(4, '메타태그 생성 중...');
      
      const metaResponse = await fetch(`${req.headers.origin}/api/blog/generate-metatags`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          summary: summaryData.summary,
          contentType,
          customerPersona,
          conversionGoal,
          landingUrl: contentData.landingUrl
        })
      });

      const metaData = await metaResponse.json();
      if (!metaData.success) throw new Error(metaData.error);
      
      sendProgress(4, '메타태그 생성 완료', { metaTags: metaData.metaTags });

      // 5단계: 완료
      sendProgress(5, '블로그 생성 완료!', {
        blogPost: {
          title,
          summary: summaryData.summary,
          content: contentData.content,
          metaTags: metaData.metaTags,
          contentType,
          customerPersona,
          brandWeight,
          painPoint,
          conversionGoal,
          storyFramework,
          landingUrl: contentData.landingUrl,
          trackingUrl: metaData.trackingUrl,
          wordCount: contentData.wordCount,
          conversionPoints: contentData.conversionPoints,
          createdAt: new Date().toISOString()
        }
      });

      res.end();

    } catch (error) {
      sendProgress('error', '생성 중 오류 발생', { error: error.message });
      res.end();
    }

  } catch (error) {
    console.error('원클릭 생성 오류:', error);
    return res.status(500).json({ 
      error: '원클릭 생성 실패',
      details: error.message 
    });
  }
}
