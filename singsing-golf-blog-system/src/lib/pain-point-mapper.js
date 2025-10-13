// 페인포인트 매퍼 라이브러리
// 페르소나별 페인포인트 + 최적 전환 경로 매핑

export const PainPointMapper = {
  // 페르소나별 주요 페인포인트
  "중상급 골퍼": {
    painPoints: [
      {
        id: "distance_plateau",
        name: "비거리 정체",
        description: "현재 수준에서 더 이상 비거리가 늘어나지 않음",
        emotion: "좌절감, 한계 인식",
        solution: "초고반발 드라이버 + 정밀 피팅",
        conversionGoal: "consideration",
        landingPage: "https://win.masgolf.co.kr/booking"
      },
      {
        id: "accuracy_issues",
        name: "정확도 부족",
        description: "드라이버 샷이 자꾸 오른쪽으로 빠짐",
        emotion: "스트레스, 불안감",
        solution: "안정성 높은 드라이버 + 스윙 분석",
        conversionGoal: "consideration",
        landingPage: "https://win.masgolf.co.kr/booking"
      },
      {
        id: "consistency_problem",
        name: "일관성 부족",
        description: "좋은 날과 나쁜 날의 편차가 큼",
        emotion: "불안정감, 자신감 부족",
        solution: "안정성 중심 드라이버 + 맞춤 피팅",
        conversionGoal: "consideration",
        landingPage: "https://win.masgolf.co.kr/booking"
      }
    ],
    preferredChannels: ['blog', 'kakao', 'naver_blog'],
    conversionPath: "/blog → /booking → /shop"
  },

  "시니어 골퍼": {
    painPoints: [
      {
        id: "age_related_distance",
        name: "나이로 인한 비거리 감소",
        description: "60대가 되니 체력이 떨어져 비거리가 줄었음",
        emotion: "포기하고 싶은 마음, 좌절감",
        solution: "시니어 맞춤 드라이버 + 체력 보완",
        conversionGoal: "decision",
        landingPage: "https://win.masgolf.co.kr/shop"
      },
      {
        id: "joint_pain",
        name: "관절 통증",
        description: "무릎, 허리 통증으로 스윙이 어려움",
        emotion: "고통, 불편함",
        solution: "부드러운 임팩트 드라이버 + 스트레칭 가이드",
        conversionGoal: "consideration",
        landingPage: "https://win.masgolf.co.kr/booking"
      },
      {
        id: "confidence_loss",
        name: "자신감 상실",
        description: "나이가 들면서 골프에 대한 자신감이 떨어짐",
        emotion: "자괴감, 위축감",
        solution: "성공 경험 제공 + 맞춤 피팅",
        conversionGoal: "awareness",
        landingPage: "https://win.masgolf.co.kr/about"
      }
    ],
    preferredChannels: ['blog', 'kakao', 'sms'],
    conversionPath: "/blog → /about → /booking → /shop"
  },

  "초보 골퍼": {
    painPoints: [
      {
        id: "difficulty_learning",
        name: "배우기 어려움",
        description: "골프를 시작했지만 드라이버가 너무 어려움",
        emotion: "두려움, 좌절감",
        solution: "초보자용 쉬운 드라이버 + 기초 레슨",
        conversionGoal: "awareness",
        landingPage: "https://win.masgolf.co.kr/about"
      },
      {
        id: "equipment_confusion",
        name: "장비 선택 어려움",
        description: "어떤 드라이버를 선택해야 할지 모르겠음",
        emotion: "혼란, 불안감",
        solution: "전문가 상담 + 맞춤 추천",
        conversionGoal: "consideration",
        landingPage: "https://win.masgolf.co.kr/booking"
      },
      {
        id: "fear_of_embarrassment",
        name: "부끄러움",
        description: "다른 사람들 앞에서 실수하는 것이 두려움",
        emotion: "부끄러움, 위축감",
        solution: "안전한 연습 환경 + 친근한 상담",
        conversionGoal: "awareness",
        landingPage: "https://win.masgolf.co.kr/about"
      }
    ],
    preferredChannels: ['blog', 'naver_blog', 'youtube'],
    conversionPath: "/blog → /about → /booking"
  },

  "비즈니스 골퍼": {
    painPoints: [
      {
        id: "time_constraint",
        name: "시간 부족",
        description: "업무가 바빠서 골프 연습 시간이 부족함",
        emotion: "스트레스, 아쉬움",
        solution: "효율적인 연습법 + 시간 절약 장비",
        conversionGoal: "consideration",
        landingPage: "https://win.masgolf.co.kr/booking"
      },
      {
        id: "business_pressure",
        name: "비즈니스 압박",
        description: "골프가 비즈니스에 영향을 미칠까 걱정",
        emotion: "압박감, 부담감",
        solution: "신뢰할 수 있는 장비 + 성과 보장",
        conversionGoal: "decision",
        landingPage: "https://win.masgolf.co.kr/shop"
      },
      {
        id: "image_concern",
        name: "이미지 걱정",
        description: "비즈니스 파트너 앞에서 실수하는 것이 걱정",
        emotion: "불안감, 부담감",
        solution: "안정성 높은 장비 + 자신감 향상",
        conversionGoal: "decision",
        landingPage: "https://win.masgolf.co.kr/shop"
      }
    ],
    preferredChannels: ['blog', 'kakao', 'google_ad'],
    conversionPath: "/blog → /shop"
  }
};

// 페인포인트별 키워드 매핑
export const PainPointKeywords = {
  "비거리 정체": ["비거리", "정체", "한계", "늘어나지 않음", "개선"],
  "정확도 부족": ["정확도", "오른쪽", "빠짐", "일관성", "안정성"],
  "나이로 인한 비거리 감소": ["나이", "체력", "감소", "시니어", "60대"],
  "관절 통증": ["무릎", "허리", "통증", "관절", "불편함"],
  "배우기 어려움": ["초보", "어려움", "배우기", "시작", "기초"],
  "시간 부족": ["시간", "바쁨", "업무", "효율", "절약"]
};

// 페인포인트별 솔루션 매핑
export const PainPointSolutions = {
  "비거리 정체": {
    primary: "초고반발 드라이버",
    secondary: "정밀 피팅",
    tertiary: "스윙 분석",
    product: "시크릿포스 시리즈",
    service: "전문 피팅 상담"
  },
  "정확도 부족": {
    primary: "안정성 높은 드라이버",
    secondary: "스윙 분석",
    tertiary: "맞춤 피팅",
    product: "웨폰 시리즈",
    service: "스윙 분석 서비스"
  },
  "나이로 인한 비거리 감소": {
    primary: "시니어 맞춤 드라이버",
    secondary: "체력 보완",
    tertiary: "부드러운 임팩트",
    product: "시니어 전용 모델",
    service: "체력 분석 + 맞춤 솔루션"
  },
  "관절 통증": {
    primary: "부드러운 임팩트 드라이버",
    secondary: "스트레칭 가이드",
    tertiary: "관절 보호",
    product: "부드러운 임팩트 모델",
    service: "관절 친화적 피팅"
  },
  "배우기 어려움": {
    primary: "초보자용 쉬운 드라이버",
    secondary: "기초 레슨",
    tertiary: "친근한 상담",
    product: "초보자 전용 모델",
    service: "기초 레슨 + 상담"
  },
  "시간 부족": {
    primary: "효율적인 연습법",
    secondary: "시간 절약 장비",
    tertiary: "빠른 피팅",
    product: "효율성 중심 모델",
    service: "빠른 피팅 서비스"
  }
};

// 페인포인트 분석 함수
export function analyzePainPoint(persona, painPoint) {
  const personaData = PainPointMapper[persona];
  if (!personaData) return null;

  const pain = personaData.painPoints.find(p => p.name === painPoint);
  if (!pain) return null;

  return {
    ...pain,
    keywords: PainPointKeywords[painPoint] || [],
    solution: PainPointSolutions[painPoint] || {},
    preferredChannels: personaData.preferredChannels,
    conversionPath: personaData.conversionPath
  };
}

// 최적 전환 경로 생성
export function generateOptimalConversionPath(persona, painPoint, currentStage = 'awareness') {
  const analysis = analyzePainPoint(persona, painPoint);
  if (!analysis) return null;

  const stages = ['awareness', 'consideration', 'decision'];
  const currentIndex = stages.indexOf(currentStage);
  
  if (currentIndex === -1) return null;

  const path = stages.slice(currentIndex).map(stage => ({
    stage,
    goal: getGoalForStage(stage),
    landingPage: getLandingPageForStage(stage),
    cta: getCTAForStage(stage)
  }));

  return {
    currentStage,
    path,
    estimatedTime: path.length * 7, // 주 단위
    successRate: calculateSuccessRate(persona, painPoint, currentStage)
  };
}

// 단계별 목표 매핑
function getGoalForStage(stage) {
  const goals = {
    awareness: "브랜드 인지도 향상",
    consideration: "상담 신청 증가",
    decision: "구매 전환 증가"
  };
  return goals[stage] || "알 수 없음";
}

// 단계별 랜딩 페이지 매핑
function getLandingPageForStage(stage) {
  const pages = {
    awareness: "https://win.masgolf.co.kr/about",
    consideration: "https://win.masgolf.co.kr/booking",
    decision: "https://win.masgolf.co.kr/shop"
  };
  return pages[stage] || "https://win.masgolf.co.kr";
}

// 단계별 CTA 매핑
function getCTAForStage(stage) {
  const ctas = {
    awareness: "더 알아보기",
    consideration: "무료 상담 신청",
    decision: "지금 구매하기"
  };
  return ctas[stage] || "자세히 보기";
}

// 성공률 계산 (간단한 휴리스틱)
function calculateSuccessRate(persona, painPoint, stage) {
  const baseRates = {
    awareness: 0.8,
    consideration: 0.6,
    decision: 0.4
  };

  const personaMultipliers = {
    "중상급 골퍼": 1.2,
    "시니어 골퍼": 1.0,
    "초보 골퍼": 0.8,
    "비즈니스 골퍼": 1.1
  };

  const painMultipliers = {
    "비거리 정체": 1.1,
    "정확도 부족": 1.0,
    "나이로 인한 비거리 감소": 0.9,
    "관절 통증": 0.8,
    "배우기 어려움": 0.7,
    "시간 부족": 1.0
  };

  const baseRate = baseRates[stage] || 0.5;
  const personaMultiplier = personaMultipliers[persona] || 1.0;
  const painMultiplier = painMultipliers[painPoint] || 1.0;

  return Math.min(0.95, baseRate * personaMultiplier * painMultiplier);
}
