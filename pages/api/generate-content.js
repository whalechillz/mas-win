import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// 마쓰구 브랜드 프로필 및 전략 정의
const MASSGOO_BRAND_PROFILE = `
MASSGOO(마쓰구) - 초고반발 드라이버 & 맞춤 피팅 전문 브랜드

## 핵심 가치
- 반발계수 0.87의 초고반발 드라이버로 비거리 +25m 증가
- 일본 JFE 티타늄 & DAIDO 티타늄, NGS 샤프트 적용
- 10,000개 이상 판매, 3,000명 이상 맞춤 피팅 상담
- 수원 갤러리아 광교에서 차로 5분 거리 위치
- 10년 샤프트 교환, 3년 헤드 교환 보증

## 기술력
- 시크리트웨폰 4.1/블랙/시크리트포스 골드2: 2.2mm 페이스, 반발계수 0.87
- 시크리트포스 PRO3: 2.3mm 페이스, 반발계수 0.86  
- 시크리트포스 V3: 2.4mm 페이스, 반발계수 0.85

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
    cta: "지금 MASSGOO 수원본점에서 무료 시타 체험하세요"
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
      brandIntegration = `\n\nMASSGOO 브랜드를 적극적으로 언급하고 다음 핵심 메시지를 포함하세요: ${strategy.keyMessages.join(', ')}`;
    } else if (brandWeight === 'medium') {
      brandIntegration = `\n\nMASSGOO 브랜드를 자연스럽게 언급하고 관련 기술력이나 서비스를 소개하세요.`;
    } else {
      brandIntegration = `\n\n필요시에만 MASSGOO 브랜드를 언급하고, 주로 유용한 정보 제공에 집중하세요.`;
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
        prompt = `골프 드라이버 관련 블로그 포스트의 본문을 마크다운 형식으로 작성해주세요.
제목: "${title}"
키워드: ${keywords || '고반발 드라이버, 골프'}  
콘텐츠 유형: ${contentType}
오디언스: ${audienceGuide}
브랜드 강도: ${brandWeight}${brandIntegration}

**중요한 작성 규칙:**
1. 마크다운 형식으로 작성하세요 (# ## ### 제목, **볼드**, - 목록 등)
2. 각 단락 사이에는 빈 줄을 넣어 가독성을 높이세요
3. 중요한 키워드는 **볼드체**로 강조하세요:
   - MASSGOO, 마쓰구, 초고반발, 비거리, 반발계수, JFE 티타늄, 맞춤 피팅, 수원본점
   - 구체적인 수치: +25m, 0.87, 10,000개, 3,000명, 90% 등
   - 모델명: 시크리트웨폰, 시크리트포스 PRO3, 시크리트포스 V3
4. 제목 구조: # 메인제목, ## 부제목, ### 소제목
5. 목록은 - 기호로 시작하고 **볼드** 키워드 포함
6. SEO에 최적화되면서도 독자에게 실질적인 도움이 되는 내용으로 작성하세요.

**이미지 배치 가이드:**
- 이미지가 여러 장 들어갈 경우, 다음과 같은 구조로 작성하세요:
  * [이미지 플레이스홀더] - 문제 상황이나 Before 이미지
  * 텍스트 - 문제 설명 및 배경
  * [이미지 플레이스홀더] - 해결 과정이나 During 이미지  
  * 텍스트 - 해결 방법 및 과정 설명
  * [이미지 플레이스홀더] - 결과나 After 이미지
  * 텍스트 - 성과 및 결론
- 각 이미지 플레이스홀더는 "![이미지 설명](이미지URL)" 형식으로 작성하세요
- 이미지 설명은 SEO에 도움이 되도록 구체적으로 작성하세요

**콘텐츠 유형별 특별 가이드:**
${contentType === 'visual_guide' ? `
**이미지 가이드 구조:**
1. ![개요 이미지](이미지URL) - 전체적인 개요나 목차
2. 텍스트 - 가이드 소개 및 목적
3. ![1단계 이미지](이미지URL) - 첫 번째 단계 시각화
4. 텍스트 - 1단계 상세 설명
5. ![2단계 이미지](이미지URL) - 두 번째 단계 시각화
6. 텍스트 - 2단계 상세 설명
7. ![결과 이미지](이미지URL) - 최종 결과
8. 텍스트 - 요약 및 추가 팁` : ''}

${contentType === 'before_after' ? `
**Before/After 비교 구조:**
1. ![Before 이미지](이미지URL) - 기존 상황이나 문제점
2. 텍스트 - 기존 문제점 분석
3. ![개선 과정 이미지](이미지URL) - 개선 과정이나 솔루션
4. 텍스트 - 개선 방법 및 과정
5. ![After 이미지](이미지URL) - 개선된 결과
6. 텍스트 - 개선 효과 및 성과
7. ![데이터/그래프 이미지](이미지URL) - 수치적 증명
8. 텍스트 - 구체적 수치 및 결론` : ''}

${contentType === 'step_by_step' ? `
**단계별 가이드 구조:**
1. ![전체 개요 이미지](이미지URL) - 전체 과정 개요
2. 텍스트 - 가이드 소개 및 준비사항
3. ![1단계 이미지](이미지URL) - 첫 번째 단계
4. 텍스트 - 1단계 상세 설명
5. ![2단계 이미지](이미지URL) - 두 번째 단계
6. 텍스트 - 2단계 상세 설명
7. ![3단계 이미지](이미지URL) - 세 번째 단계
8. 텍스트 - 3단계 상세 설명
9. ![최종 결과 이미지](이미지URL) - 최종 결과
10. 텍스트 - 요약 및 주의사항` : ''}`;
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
          content: `당신은 MASSGOO(마쓰구)의 전문 콘텐츠 작가입니다. 
          
${MASSGOO_BRAND_PROFILE}

다음 원칙을 따라 콘텐츠를 작성하세요:
1. SEO에 최적화되고 독자에게 유용한 콘텐츠 작성
2. 자연스럽게 MASSGOO 브랜드 가치 전달
3. 고객의 비거리 문제 해결에 집중
4. 구체적인 데이터와 실적 제시
5. 지역 기반 접근성 강조 (수원 갤러리아 광교 5분 거리)
6. 오디언스 온도에 맞는 메시지 강도 조정

**마크다운 작성 규칙:**
- 제목: # ## ### 사용
- 볼드체: **텍스트** 사용
- 목록: - 기호 사용
- 단락 구분: 빈 줄로 구분
- 중요한 키워드 자동 볼드체 적용:
  * MASSGOO, 마쓰구, 초고반발, 비거리, 반발계수, JFE 티타늄, DAIDO 티타늄, NGS 샤프트
  * 맞춤 피팅, 수원본점, 갤러리아 광교
  * 구체적 수치: +25m, 0.87, 0.86, 0.85, 10,000개, 3,000명, 90%, 2.2mm, 2.3mm, 2.4mm
  * 모델명: 시크리트웨폰, 시크리트포스, PRO3, V3`
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