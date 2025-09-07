import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// 마쓰구 브랜드 프로필 및 전략 정의
const MASGOLF_BRAND_PROFILE = `
MASGOLF(마쓰구) - 초고반발 드라이버 & 맞춤 피팅 전문 브랜드

## 핵심 가치
- 반발계수 0.87의 초고반발 드라이버로 비거리 +25m 증가
- 일본 JFE 티타늄 & DAIDO 티타늄, NGS 샤프트 적용
- 10,000개 이상 판매, 3,000명 이상 맞춤 피팅 상담
- 수원 갤러리아 광교에서 차로 5분 거리 위치
- 10년 샤프트 교환, 3년 헤드 교환 보증

## 기술력
- 시크리트웨폰 4.1/블랙/시크리트포스 골드2: 2.2mm 페이스, 반발계수 0.87
- 시크리트포스 PRO3: 2.3mm 페이스, 반발계수 0.86  
- 시크리트포스 V2: 2.4mm 페이스, 반발계수 0.85

## 신뢰성
- 2011년 중소기업 브랜드 대상 수상
- 2012년 대한민국 골프산업 대상 수상
- 매장 방문 고객 90% 이상 구매율
- 온라인 리뷰 평균 4.6점
`;

const CONTENT_STRATEGY = {
  event: {
    brandWeight: "high",
    keyMessages: [
      "초고반발 기술로 비거리 +25m 증가",
      "일본 JFE 티타늄의 프리미엄 품질", 
      "10,000개 이상 판매로 검증된 성능"
    ],
    cta: "지금 MASGOLF 수원본점에서 무료 시타 체험하세요"
  },
  tutorial: {
    brandWeight: "medium", 
    keyMessages: [
      "반발계수 0.87의 과학적 원리",
      "맞춤 피팅의 중요성",
      "실제 고객 성과 사례"
    ],
    cta: "나만의 맞춤 드라이버 상담받기"
  },
  testimonial: {
    brandWeight: "high",
    keyMessages: [
      "매장 방문 고객 90% 이상 구매율",
      "실제 비거리 증가 경험담", 
      "10년 샤프트 교환 보증"
    ],
    cta: "나도 같은 경험을 해보세요"
  },
  information: {
    brandWeight: "low",
    keyMessages: [
      "20년 이상의 골프 기술 연구",
      "KCA 인증 피팅 전문가",
      "초음파 측정기로 투명한 검증"
    ],
    cta: "전문가와 상담하기"
  }
};

const AUDIENCE_TEMPERATURE = {
  cold: "브랜드를 처음 접하는 고객 - 기본 정보와 신뢰성 강조",
  warm: "관심은 있지만 구매 결정을 내리지 않은 고객 - 구체적 혜택과 비교 우위 강조", 
  hot: "구매 의도가 높은 고객 - 즉시 행동을 유도하는 강력한 메시지"
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { title, type, keywords, contentType = 'information', audienceTemp = 'warm', brandWeight = 'medium' } = req.body;

  if (!title) {
    return res.status(400).json({ message: 'Title is required' });
  }

  try {
    // 콘텐츠 유형별 전략 선택
    const strategy = CONTENT_STRATEGY[contentType] || CONTENT_STRATEGY.information;
    const audienceGuide = AUDIENCE_TEMPERATURE[audienceTemp] || AUDIENCE_TEMPERATURE.warm;
    
    // 브랜드 강도에 따른 메시지 조정
    let brandIntegration = '';
    if (brandWeight === 'high') {
      brandIntegration = `\n\nMASGOLF 브랜드를 적극적으로 언급하고 다음 핵심 메시지를 포함하세요: ${strategy.keyMessages.join(', ')}`;
    } else if (brandWeight === 'medium') {
      brandIntegration = `\n\nMASGOLF 브랜드를 자연스럽게 언급하고 관련 기술력이나 서비스를 소개하세요.`;
    } else {
      brandIntegration = `\n\n필요시에만 MASGOLF 브랜드를 언급하고, 주로 유용한 정보 제공에 집중하세요.`;
    }

    let prompt = '';
    
    switch (type) {
      case 'excerpt':
        prompt = `골프 드라이버 관련 블로그 포스트의 요약을 작성해주세요. 
제목: "${title}" 
키워드: ${keywords || '고반발 드라이버, 골프'}
콘텐츠 유형: ${contentType}
오디언스: ${audienceGuide}
브랜드 강도: ${brandWeight}${brandIntegration}

요약은 2-3문장으로 핵심 내용을 간결하게 전달하되, 독자의 관심을 끌 수 있도록 작성하세요.`;
        break;
      case 'content':
        prompt = `골프 드라이버 관련 블로그 포스트의 본문을 작성해주세요.
제목: "${title}"
키워드: ${keywords || '고반발 드라이버, 골프'}  
콘텐츠 유형: ${contentType}
오디언스: ${audienceGuide}
브랜드 강도: ${brandWeight}${brandIntegration}

본문은 SEO에 최적화되면서도 독자에게 실질적인 도움이 되는 내용으로 작성하세요. 
제목과 관련된 구체적인 정보, 팁, 또는 해결책을 제공하세요.`;
        break;
      case 'meta':
        prompt = `골프 드라이버 관련 블로그 포스트의 메타 설명을 작성해주세요.
제목: "${title}"
콘텐츠 유형: ${contentType}
오디언스: ${audienceGuide}
브랜드 강도: ${brandWeight}${brandIntegration}

메타 설명은 150-160자 내외로 작성하고, 검색 결과에서 클릭을 유도할 수 있도록 매력적으로 작성하세요.`;
        break;
      default:
        return res.status(400).json({ message: 'Invalid type' });
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: `당신은 MASGOLF(마쓰구)의 전문 콘텐츠 작가입니다. 

${MASGOLF_BRAND_PROFILE}

다음 원칙을 따라 콘텐츠를 작성하세요:
1. SEO에 최적화되고 독자에게 유용한 콘텐츠 작성
2. 자연스럽게 MASGOLF 브랜드 가치 전달
3. 고객의 비거리 문제 해결에 집중
4. 구체적인 데이터와 실적 제시
5. 지역 기반 접근성 강조 (수원 갤러리아 광교 5분 거리)
6. 오디언스 온도에 맞는 메시지 강도 조정`
        },
        {
          role: "user",
          content: prompt
        }
      ],
      max_tokens: 800,
    });

    const generatedContent = completion.choices[0].message.content.trim();

    res.status(200).json({ 
      content: generatedContent,
      strategy: {
        contentType,
        audienceTemp, 
        brandWeight,
        keyMessages: strategy.keyMessages,
        cta: strategy.cta
      }
    });

  } catch (error) {
    console.error('Error generating content:', error);
    res.status(500).json({ message: 'Failed to generate content', error: error.message });
  }
}