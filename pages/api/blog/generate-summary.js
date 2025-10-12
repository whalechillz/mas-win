import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { title, contentType, customerPersona, brandWeight, painPoint, conversionGoal } = req.body;

    // 페인포인트와 전환 목표에 따른 CTA 생성
    const ctaMap = {
      awareness: "자세히 알아보기 →",
      consideration: "무료 상담 신청하기 →",
      decision: "지금 구매하기 →",
      funnel: "MUZIIK 샤프트 자세히 보기 →"
    };

    const prompt = `
블로그 요약 생성 요구사항:

제목: ${title}
콘텐츠 타입: ${contentType}
고객 페르소나: ${customerPersona}
브랜드 강도: ${brandWeight}
페인포인트: ${painPoint}
전환 목표: ${conversionGoal}

요약 생성 규칙:
1. 150-200자 이내
2. SEO 최적화 (핵심 키워드 포함)
3. 후킹력 있는 첫 문장
4. 핵심 혜택/솔루션 강조
5. CTA 포함: "${ctaMap[conversionGoal] || '자세히 알아보기 →'}"
6. 마쓰구프 브랜드 자연스럽게 언급

예시:
"60대 골퍼도 비거리 20m 늘릴 수 있다? 마쓰구프 초고반발 드라이버의 비밀을 공개합니다. 나이에 상관없이 비거리 향상이 가능한 맞춤 피팅 시스템으로 골프 라이프를 바꿔보세요. 무료 상담 신청하기 →"

요약 생성:
`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 300,
      temperature: 0.7
    });

    const summary = response.choices[0].message.content.trim();

    return res.json({
      success: true,
      summary: summary,
      wordCount: summary.length,
      cta: ctaMap[conversionGoal] || '자세히 알아보기 →'
    });

  } catch (error) {
    console.error('AI 요약 생성 오류:', error);
    return res.status(500).json({ 
      error: 'AI 요약 생성 실패',
      details: error.message 
    });
  }
}
