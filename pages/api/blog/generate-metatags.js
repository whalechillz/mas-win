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
      title, 
      summary, 
      contentType, 
      customerPersona, 
      conversionGoal,
      landingUrl
    } = req.body;

    // UTM 파라미터 생성
    const utmParams = new URLSearchParams({
      utm_source: 'blog',
      utm_medium: 'organic',
      utm_campaign: contentType.toLowerCase().replace(/\s+/g, '-'),
      utm_content: Date.now().toString()
    });

    const trackingUrl = `${landingUrl}?${utmParams.toString()}`;

    const prompt = `
메타태그 생성 요구사항:

제목: ${title}
요약: ${summary}
콘텐츠 타입: ${contentType}
고객 페르소나: ${customerPersona}
전환 목표: ${conversionGoal}
랜딩 URL: ${trackingUrl}

메타태그 생성 규칙:
1. meta_description: 150-160자, CTA 포함
2. og:title: 60자 이내, 후킹력 있는 제목
3. og:description: 150자 이내, 핵심 혜택 강조
4. keywords: 10개 이내, SEO 최적화
5. canonical: 추적 URL 사용

예시:
{
  "meta_description": "60대 골퍼도 비거리 20m 늘릴 수 있다? 마쓰구프 초고반발 드라이버의 비밀을 공개합니다. 무료 상담 신청하기 →",
  "og_title": "60대 골퍼 비거리 20m 증가 비결 | 마쓰구프",
  "og_description": "나이에 상관없이 비거리 향상이 가능한 맞춤 피팅 시스템으로 골프 라이프를 바꿔보세요.",
  "keywords": "골프드라이버,비거리향상,시니어골퍼,맞춤피팅,마쓰구프",
  "canonical": "${trackingUrl}"
}

메타태그 생성:
`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 500,
      temperature: 0.6
    });

    const metaContent = response.choices[0].message.content.trim();
    
    // JSON 파싱 시도
    let metaTags;
    try {
      metaTags = JSON.parse(metaContent);
    } catch (parseError) {
      // JSON 파싱 실패 시 기본값 사용
      metaTags = {
        meta_description: summary.substring(0, 160),
        og_title: title.substring(0, 60),
        og_description: summary.substring(0, 150),
        keywords: "골프드라이버,비거리향상,맞춤피팅,마쓰구프",
        canonical: trackingUrl
      };
    }

    return res.json({
      success: true,
      metaTags: {
        ...metaTags,
        canonical: trackingUrl,
        utm_params: Object.fromEntries(utmParams)
      },
      trackingUrl: trackingUrl
    });

  } catch (error) {
    console.error('AI 메타태그 생성 오류:', error);
    return res.status(500).json({ 
      error: 'AI 메타태그 생성 실패',
      details: error.message 
    });
  }
}
