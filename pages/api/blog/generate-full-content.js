import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// 스토리텔링 프레임워크
const StorytellingFrameworks = {
  pixar: (persona, painPoint, conversionGoal) => ({
    once: "평범한 골퍼였던 고객",
    every_day: painPoint,
    one_day: "마쓰구프를 만남",
    because: "맞춤 피팅 받음",
    until: "비거리 증가, 자신감 회복",
    cta: conversionGoal
  }),
  
  cialdini: (brandWeight, conversionUrl) => ({
    reciprocity: "무료 시타 체험",
    social_proof: "10,000명 만족",
    authority: "KGFA 인증",
    scarcity: "이번 달 한정 특가",
    cta_url: conversionUrl
  }),
  
  donald_miller: (persona, painPoint, conversionPath) => ({
    hero: persona,
    problem: painPoint,
    guide: "마쓰구프",
    plan: "맞춤 피팅 + 초고반발",
    success: "비거리 25m 증가",
    conversion: conversionPath
  })
};

// 전환 목표에 따른 랜딩 페이지
const ConversionUrls = {
  awareness: "https://win.masgolf.co.kr/about",
  consideration: "https://win.masgolf.co.kr/booking",
  decision: "https://win.masgolf.co.kr/shop",
  funnel: "https://win.masgolf.co.kr/25-10"
};

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
      brandWeight, 
      painPoint, 
      conversionGoal,
      storyFramework = 'pixar'
    } = req.body;

    const framework = StorytellingFrameworks[storyFramework];
    const landingUrl = ConversionUrls[conversionGoal];

    const prompt = `
블로그 본문 생성 요구사항:

제목: ${title}
요약: ${summary}
콘텐츠 타입: ${contentType}
고객 페르소나: ${customerPersona}
브랜드 강도: ${brandWeight}
페인포인트: ${painPoint}
전환 목표: ${conversionGoal}
스토리 프레임워크: ${storyFramework}
랜딩 URL: ${landingUrl}

본문 생성 규칙:
1. 2000-3000자 분량
2. ${storyFramework} 스토리텔링 구조 적용
3. SEO 최적화 (키워드 자연스럽게 포함)
4. 전환 포인트 3곳에 CTA 삽입:
   - 중간: "무료 상담 신청하기"
   - 하단: "지금 체험 예약하기"
   - 마지막: "${conversionGoal === 'funnel' ? 'MUZIIK 샤프트 자세히 보기' : '지금 바로 시작하기'}"
5. 마쓰구프 브랜드 자연스럽게 언급
6. 고객 성공 사례 포함
7. 전문성과 신뢰도 강조

스토리 구조 (${storyFramework}):
${JSON.stringify(framework, null, 2)}

본문 생성:
`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 4000,
      temperature: 0.8
    });

    const content = response.choices[0].message.content.trim();

    // 전환 링크 자동 삽입
    const contentWithLinks = content
      .replace(/무료 상담 신청하기/g, `[무료 상담 신청하기](${landingUrl})`)
      .replace(/지금 체험 예약하기/g, `[지금 체험 예약하기](${landingUrl})`)
      .replace(/MUZIIK 샤프트 자세히 보기/g, `[MUZIIK 샤프트 자세히 보기](${landingUrl})`)
      .replace(/지금 바로 시작하기/g, `[지금 바로 시작하기](${landingUrl})`);

    return res.json({
      success: true,
      content: contentWithLinks,
      wordCount: contentWithLinks.length,
      conversionPoints: 3,
      landingUrl: landingUrl,
      framework: storyFramework
    });

  } catch (error) {
    console.error('AI 본문 생성 오류:', error);
    return res.status(500).json({ 
      error: 'AI 본문 생성 실패',
      details: error.message 
    });
  }
}
