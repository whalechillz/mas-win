// 스토리텔링 프레임워크 라이브러리
// 픽사, 치알디니, 도널드 밀러 스토리 구조 적용

export const StorytellingFrameworks = {
  // 픽사 스토리 구조 (Once upon a time...)
  pixar: (persona, painPoint, conversionGoal) => ({
    once: `${persona}였던 고객`,
    every_day: painPoint.description,
    one_day: "마쓰구프를 만남",
    because: "맞춤 피팅 받음",
    until: "비거리 증가, 자신감 회복",
    cta: getCTAForGoal(conversionGoal),
    structure: [
      "Once upon a time... (평범한 골퍼)",
      "Every day... (비거리 부족 고민)",
      "One day... (마쓰구프 발견)",
      "Because of that... (맞춤 피팅)",
      "Until finally... (성공과 만족)"
    ]
  }),
  
  // 치알디니 설득 심리학 원칙
  cialdini: (brandWeight, conversionUrl) => ({
    reciprocity: "무료 시타 체험 제공",
    social_proof: "10,000명 이상 만족",
    authority: "KGFA 인증 전문가",
    scarcity: "이번 달 한정 특가",
    consistency: "일관된 품질 보장",
    liking: "친근한 상담 서비스",
    cta_url: conversionUrl,
    principles: [
      "상호성: 무료 혜택 제공",
      "사회적 증거: 고객 성공 사례",
      "권위: 전문가 인증",
      "희귀성: 한정 혜택",
      "일관성: 품질 보장",
      "호감: 친근한 서비스"
    ]
  }),
  
  // 도널드 밀러 StoryBrand 구조
  donald_miller: (persona, painPoint, conversionPath) => ({
    hero: persona.name,
    problem: painPoint.description,
    guide: "마쓰구프",
    plan: "맞춤 피팅 + 초고반발 드라이버",
    success: "비거리 25m 증가, 자신감 회복",
    failure: "기존 클럽으로는 한계",
    conversion: conversionPath,
    story: [
      "주인공: 고객 (영웅)",
      "문제: 비거리 부족 (외적/내적/철학적)",
      "가이드: 마쓰구프 (신뢰할 수 있는 안내자)",
      "계획: 3단계 솔루션",
      "성공: 구체적인 결과",
      "실패: 행동하지 않을 때의 결과",
      "행동: 명확한 CTA"
    ]
  })
};

// 전환 목표별 CTA 매핑
function getCTAForGoal(conversionGoal) {
  const ctaMap = {
    awareness: "더 알아보기",
    consideration: "무료 상담 신청하기",
    decision: "지금 구매하기",
    funnel: "MUZIIK 샤프트 자세히 보기"
  };
  return ctaMap[conversionGoal] || "자세히 알아보기";
}

// 페인포인트별 스토리 템플릿
export const PainPointStories = {
  "비거리 부족": {
    problem: "나이가 들면서 드라이버 비거리가 점점 줄어들고 있습니다",
    emotion: "좌절감과 자신감 상실",
    solution: "초고반발 드라이버 + 맞춤 피팅",
    success: "비거리 20m 증가, 동료들의 부러움"
  },
  "정확도 부족": {
    problem: "드라이버 샷이 자꾸 오른쪽으로 빠집니다",
    emotion: "스트레스와 불안감",
    solution: "안정성 높은 드라이버 + 스윙 분석",
    success: "정확도 향상, 스코어 개선"
  },
  "시니어 골퍼": {
    problem: "60대가 되니 체력이 떨어져 비거리가 줄었습니다",
    emotion: "포기하고 싶은 마음",
    solution: "시니어 맞춤 드라이버 + 체력 보완",
    success: "나이보다 젊은 비거리, 자신감 회복"
  },
  "초보 골퍼": {
    problem: "골프를 시작했지만 드라이버가 너무 어렵습니다",
    emotion: "두려움과 좌절감",
    solution: "초보자용 쉬운 드라이버 + 기초 레슨",
    success: "쉬운 드라이버로 재미 발견"
  }
};

// 고객 페르소나별 스토리 커스터마이징
export const PersonaStories = {
  "중상급 골퍼": {
    focus: "성능 향상과 스코어 개선",
    language: "전문적이고 기술적인 용어",
    motivation: "더 나은 골프 실력",
    pain: "현재 수준에서 벗어나지 못함"
  },
  "시니어 골퍼": {
    focus: "나이에 맞는 솔루션과 편안함",
    language: "친근하고 이해하기 쉬운 표현",
    motivation: "건강한 골프 라이프",
    pain: "체력 저하로 인한 한계"
  },
  "초보 골퍼": {
    focus: "쉬운 시작과 재미",
    language: "간단하고 명확한 설명",
    motivation: "골프의 재미 발견",
    pain: "어려움과 두려움"
  },
  "비즈니스 골퍼": {
    focus: "시간 효율성과 비즈니스 네트워킹",
    language: "비즈니스 친화적 표현",
    motivation: "비즈니스 성공",
    pain: "시간 부족과 스트레스"
  }
};

// 스토리 생성 헬퍼 함수
export function generateStory(blogPost) {
  const { persona, painPoint, conversionGoal, storyFramework = 'pixar' } = blogPost;
  
  const framework = StorytellingFrameworks[storyFramework];
  const painStory = PainPointStories[painPoint] || PainPointStories["비거리 부족"];
  const personaStory = PersonaStories[persona] || PersonaStories["중상급 골퍼"];
  
  return {
    framework: framework,
    painStory: painStory,
    personaStory: personaStory,
    customStory: {
      ...framework,
      problem: painStory.problem,
      emotion: painStory.emotion,
      solution: painStory.solution,
      success: painStory.success,
      focus: personaStory.focus,
      language: personaStory.language
    }
  };
}

// 스토리 검증 함수
export function validateStory(story) {
  const required = ['hero', 'problem', 'solution', 'success', 'cta'];
  const missing = required.filter(field => !story[field]);
  
  return {
    isValid: missing.length === 0,
    missing: missing,
    score: Math.max(0, 100 - (missing.length * 20))
  };
}

// 스토리 최적화 함수
export function optimizeStory(story, targetAudience) {
  const optimizations = {
    awareness: {
      focus: "문제 인식과 관심 유발",
      cta: "더 알아보기",
      tone: "정보 제공 중심"
    },
    consideration: {
      focus: "솔루션 비교와 신뢰 구축",
      cta: "무료 상담 신청",
      tone: "전문성과 신뢰성"
    },
    decision: {
      focus: "구매 유도와 긴급성",
      cta: "지금 구매하기",
      tone: "행동 촉구"
    }
  };
  
  const optimization = optimizations[targetAudience] || optimizations.awareness;
  
  return {
    ...story,
    ...optimization,
    optimized: true
  };
}
