// 마쓰구 브랜드 데이터베이스
// SEO 키워드, 페인 포인트, 지역별 메시지 등 브랜드 관련 모든 데이터

export const SEO_KEYWORDS = {
  primary: [
    "초고반발 드라이버",
    "비거리 증가", 
    "맞춤 피팅",
    "MASGOLF",
    "마쓰구 드라이버"
  ],
  secondary: [
    "수원 드라이버",
    "광교 골프샵", 
    "JFE 티타늄",
    "반발계수 0.87",
    "비거리 25m 증가"
  ],
  longtail: [
    "비거리 25m 증가하는 드라이버",
    "반발계수 0.87 초고반발 드라이버",
    "10년 샤프트 교환 보증 드라이버",
    "수원 갤러리아 광교 드라이버 피팅",
    "일본 JFE 티타늄 드라이버",
    "매장 방문 고객 90% 구매율 드라이버"
  ],
  competitor: [
    "타이틀리스트 드라이버 대안",
    "캘러웨이 드라이버 비교",
    "테일러메이드 드라이버 대체",
    "핑 드라이버 대안"
  ]
};

export const CONTENT_STRATEGY = {
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
  customer_story: {
    brandWeight: "high",
    keyMessages: [
      "실제 고객의 변화된 골프 라이프",
      "비거리 증가로 인한 자신감 회복",
      "동료들과의 관계 개선"
    ],
    cta: "나도 같은 변화를 경험해보세요",
    storytelling_framework: {
      structure: "픽사 스토리텔링 (Once upon a time → And every day → Until one day → Because of that → Until finally)",
      psychological_triggers: ["사회적 증명", "희귀성", "일관성", "호혜성"],
      maslow_needs: ["존재감", "인정받고 싶음", "자기실현", "자기초월"]
    }
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

export const PAIN_POINTS = {
  distance: {
    problem: "비거리가 줄어들어 고민",
    symptoms: [
      "드라이버를 바꿔도 비거리가 늘지 않음",
      "나이가 들면서 비거리가 점점 줄어듦", 
      "같은 클럽을 쓰는데 비거리가 달라짐",
      "새 클럽을 사도 효과가 없음"
    ],
    solution: "맞춤 피팅을 통한 정확한 클럽 선택",
    masgolf_advantage: "반발계수 0.87의 초고반발 기술로 비거리 +25m 증가"
  },
  accuracy: {
    problem: "방향성이 불안정",
    symptoms: [
      "드라이버 샷이 일정하지 않음",
      "오른쪽으로 많이 빠짐",
      "왼쪽으로 훅이 많이 나감",
      "타구감이 일정하지 않음"
    ],
    solution: "스윙 데이터 분석을 통한 맞춤 샤프트 선택",
    masgolf_advantage: "NGS 샤프트와 정밀한 피팅으로 방향성 개선"
  },
  comfort: {
    problem: "타구감이 좋지 않음",
    symptoms: [
      "손목이나 팔에 충격이 많이 전달됨",
      "장시간 플레이 시 피로감 증가",
      "타구음이 거슬림",
      "그립이 미끄러움"
    ],
    solution: "일본 엘라스토머 그립과 최적화된 샤프트",
    masgolf_advantage: "일본 JFE 티타늄의 청아한 타구음과 부드러운 타구감"
  },
  cost: {
    problem: "비싼 클럽을 사도 효과 없음",
    symptoms: [
      "고가 클럽을 샀는데 만족스럽지 않음",
      "여러 클럽을 바꿔봐도 효과가 미미함",
      "피팅 비용이 부담스러움",
      "클럽 교체 주기가 짧음"
    ],
    solution: "10년 샤프트 교환 보증과 3년 헤드 교환",
    masgolf_advantage: "장기 보증으로 안심하고 사용 가능한 드라이버"
  },
  service: {
    problem: "서비스 불만족과 클럽 관리 어려움",
    symptoms: [
      "클럽이 자주 깨지고 수리가 어려움",
      "샤프트 교체가 안 되거나 비용이 비쌈",
      "구매 후 서비스가 전혀 없음",
      "문제 발생 시 연락이 안 됨",
      "A/S 기간이 짧거나 보증이 제대로 안 됨"
    ],
    solution: "10년 샤프트 교환 보증과 3년 헤드 교환, 전국 서비스",
    masgolf_advantage: "10년간 무제한 샤프트 교환, 3년간 헤드 교환, 전국 배송 및 설치 서비스"
  }
};

export const CUSTOMER_CHANNELS = {
  local_customers: {
    name: "내방고객 (경기 근방)",
    location: "수원 갤러리아 광교에서 차로 5분 거리",
    target_areas: [
      "수원 영통구", "광교신도시", "상현동", "영통동",
      "용인시", "기흥구", "수지구", "처인구", 
      "분당구", "정자동", "야탑동", "서현동",
      "동탄", "인천", "안산", "화성", "오산"
    ],
    accessibility: [
      "광교중앙역에서 도보 10분",
      "상현역에서 차로 5분", 
      "수원 갤러리아 백화점 근처",
      "광교 롯데 아울렛 근처",
      "용인시청에서 차로 15분",
      "분당구청에서 차로 20분"
    ],
    message: "경기 근방에서 가장 가까운 드라이버 피팅 전문 매장",
    advantages: [
      "무료 시타 체험 가능",
      "맞춤 피팅 상담",
      "초음파 측정기로 정밀 검증",
      "직접 체험 후 구매 결정"
    ]
  },
  online_customers: {
    name: "온라인고객 (전국 단위)",
    location: "전국 배송 및 설치 서비스",
    target_areas: [
      "서울", "부산", "대구", "인천", "광주", "대전", "울산", "세종",
      "경기", "강원", "충북", "충남", "전북", "전남", "경북", "경남", "제주"
    ],
    accessibility: [
      "전화 상담 및 맞춤 피팅",
      "로젠택배 계약 배송 - 24시간 내 발송",
      "평균 1일 이내 배송 완료",
      "다마스 퀵서비스 (최대 2시간 이내)",
      "고속버스터미널 택배 (평균 4~6시간)",
      "지하철 택배 (수도권 당일 수령)"
    ],
    message: "전국 어디서나 편리한 온라인 구매와 배송 서비스",
    advantages: [
      "전화 카드 결제 시 무이자 10개월 할부",
      "두께 5mm 이상의 맞춤 하드케이스 박스",
      "서비스 이용 시 왕복 택배비 100% 무료",
      "전국 배송 및 설치 서비스"
    ]
  }
};

export const TRUST_INDICATORS = {
  awards: [
    "2011년 중소기업 브랜드 대상 수상 (한경닷컴 주관)",
    "2012년 대한민국 골프산업 대상 - 골프용품(산업) 부문 수상"
  ],
  sales_data: [
    "누적 10,000개 이상 드라이버 판매",
    "3,000명 이상 맞춤 피팅 상담",
    "매장 방문 고객 90% 이상 구매율",
    "온라인 리뷰 평균 4.6점"
  ],
  technology: [
    "일본 JFE 티타늄 & DAIDO 티타늄 적용",
    "반발계수 0.87의 초고반발 기술",
    "MASGOLF 전용 NGS 샤프트",
    "초음파 측정기를 통한 정밀 검증"
  ],
  guarantees: [
    "10년 샤프트 교환 보증",
    "3년 무제한 헤드 교환",
    "무료 피팅 상담 및 시타 체험",
    "전국 배송 및 설치 서비스"
  ]
};

export const CONTENT_TEMPLATES = {
  event: {
    headline_patterns: [
      "🔥 한정 특가! 초고반발 드라이버로 비거리 +25m 증가",
      "🎯 이번 달만! MASGOLF 드라이버 무료 시타 체험",
      "⚡ 특별 할인! 반발계수 0.87 드라이버 지금 만나보세요"
    ],
    cta_patterns: [
      "지금 MASGOLF 수원본점에서 무료 시타 체험하세요!",
      "한정 수량! 지금 바로 예약하세요",
      "이 기회를 놓치지 마세요! 무료 상담 예약하기"
    ]
  },
  tutorial: {
    headline_patterns: [
      "비거리 +25m 증가하는 드라이버 선택법",
      "반발계수 0.87의 과학적 원리와 효과",
      "맞춤 피팅으로 찾는 나만의 완벽한 드라이버"
    ],
    cta_patterns: [
      "나만의 맞춤 드라이버 상담받기",
      "전문가와 무료 피팅 상담하기",
      "내 스윙에 맞는 드라이버 찾기"
    ]
  },
  testimonial: {
    headline_patterns: [
      "실제 고객이 경험한 비거리 +25m 증가",
      "90% 구매율의 비밀, MASGOLF 드라이버 후기",
      "10년 만에 찾은 완벽한 드라이버"
    ],
    cta_patterns: [
      "나도 같은 경험을 해보세요",
      "지금 무료 시타 체험하기",
      "실제 성과를 확인해보세요"
    ]
  },
  information: {
    headline_patterns: [
      "골프 드라이버의 모든 것: 초고반발 기술 완전 가이드",
      "비거리 증가의 과학: 반발계수와 페이스 두께의 관계",
      "맞춤 피팅의 중요성: 왜 개인별 클럽이 필요한가"
    ],
    cta_patterns: [
      "전문가와 상담하기",
      "더 자세한 정보 알아보기",
      "무료 피팅 상담 예약하기"
    ]
  }
};

export const CUSTOMER_PERSONAS = {
  high_rebound_enthusiast: {
    name: "고반발 드라이버 선호 상급 골퍼",
    characteristics: "나이로 인한 비거리 감소를 보완하고 싶은 자신감 있는 골퍼",
    core_concerns: ["비거리 증가", "최신 기술", "성능 검증"],
    motivations: ["나이로 인한 비거리 감소 보완", "최신 기술에 대한 관심", "기존 저가 고반발 드라이버 실망 경험"],
    pain_points: ["기존 드라이버 성능 저하", "저가 고반발 드라이버 실망"],
    preferences: ["최신 고반발 드라이버", "온라인 골프 전문몰", "고급 장비 매장"],
    content_needs: ["최신 장비 리뷰", "고반발 드라이버 비교", "사용자 경험"],
    masgolf_focus: "반발계수 0.87의 초고반발 기술, 10,000개 이상 판매 실적",
    maslow_needs: ["존재감", "인정받고 싶음", "자기실현"]
  },
  health_conscious_senior: {
    name: "건강을 고려한 비거리 증가 시니어 골퍼",
    characteristics: "건강을 유지하며 골프 실력을 보존하고 싶은 시니어",
    core_concerns: ["비거리 회복", "건강 유지", "신체 부담 최소화"],
    motivations: ["건강 유지하며 실력 보존", "무거운 클럽으로 인한 신체 피로 해결"],
    pain_points: ["무거운 클럽 사용으로 인한 신체적 피로", "체력 감소"],
    preferences: ["척추와 관절에 부담을 덜 주는 클럽", "오프라인 매장", "건강 관련 골프 클리닉"],
    content_needs: ["비거리 증대 방법", "건강한 골프 라이프스타일 팁"],
    masgolf_focus: "일본 JFE 티타늄의 청아한 타구음, NGS 샤프트의 부드러운 타구감",
    maslow_needs: ["안전", "존재감", "자기실현"]
  },
  competitive_maintainer: {
    name: "경기력을 유지하고 싶은 중상급 골퍼",
    characteristics: "최신 기술과 장비를 통해 경쟁력을 유지하고 싶은 경쟁심 강한 골퍼",
    core_concerns: ["경기력 유지", "비거리 증가", "경쟁력 유지"],
    motivations: ["최신 기술로 경쟁력 유지", "신중한 장비 선택"],
    pain_points: ["경쟁력 저하 우려", "장비 선택의 어려움"],
    preferences: ["고성능 장비", "최신 기술 적용 제품", "온라인 및 오프라인 모두 활용"],
    content_needs: ["최신 골프 장비 리뷰", "고급 레슨 콘텐츠"],
    masgolf_focus: "일본 JFE 티타늄의 프리미엄 품질, 정밀한 맞춤 피팅",
    maslow_needs: ["존재감", "인정받고 싶음", "자기실현", "자기초월"]
  },
  returning_60plus: {
    name: "최근 골프를 다시 시작한 60대 이상 골퍼",
    characteristics: "나이에 따른 체력과 기술 보완을 원하는 꾸준한 연습 의지가 강한 골퍼",
    core_concerns: ["골프 실력 복귀", "비거리 향상", "체력 보완"],
    motivations: ["나이에 따른 체력과 기술 보완", "빠른 실력 향상"],
    pain_points: ["체력 감소", "기술 저하", "비거리 단축"],
    preferences: ["비거리 회복에 중점을 둔 클럽", "오프라인 매장"],
    content_needs: ["비거리 증가를 위한 기술 조언", "골프 복귀 가이드"],
    masgolf_focus: "초고반발 기술로 체력 보완, 10년 샤프트 교환 보증",
    maslow_needs: ["존재감", "자기실현", "자기초월"]
  },
  distance_seeking_beginner: {
    name: "골프 입문자를 위한 비거리 향상 초급 골퍼",
    characteristics: "빠른 실력 향상을 통해 골프에 대한 자신감을 회복하고 싶은 초보자",
    core_concerns: ["기본 기술 습득", "비거리 향상", "자신감 회복"],
    motivations: ["빠른 실력 향상", "골프에 대한 자신감 회복"],
    pain_points: ["기술 부족", "비거리 부족", "자신감 부족"],
    preferences: ["입문자용 장비", "사용이 간편한 클럽", "온라인 플랫폼"],
    content_needs: ["기초 레슨", "입문 장비 사용법", "비거리 늘리기 팁"],
    masgolf_focus: "초고반발 기술로 비거리 +25m 증가, 맞춤 피팅으로 방향성 개선",
    maslow_needs: ["존재감", "자기실현"]
  }
};

// 매슬로 욕구 피라미드 기반 메시지 매핑
export const MASLOW_NEEDS_MAPPING = {
  physiological: {
    needs: ["기본적인 생존", "안전한 환경"],
    golf_context: ["안전한 장비", "신체적 부담 없는 클럽"],
    masgolf_solution: "일본 JFE 티타늄의 내구성, NGS 샤프트의 부드러운 타구감"
  },
  safety: {
    needs: ["안전과 보안", "예측 가능성"],
    golf_context: ["장비 보증", "서비스 신뢰성", "투자 보호"],
    masgolf_solution: "10년 샤프트 교환 보증, 3년 헤드 교환, 전국 서비스"
  },
  belonging: {
    needs: ["소속감", "사랑과 애정"],
    golf_context: ["동료들과의 관계", "골프 커뮤니티", "인정받고 싶음"],
    masgolf_solution: "비거리 증가로 동료들에게 인정받는 경험, 골프 라운드에서 자신감"
  },
  esteem: {
    needs: ["존재감", "인정받고 싶음", "성취감"],
    golf_context: ["비거리 향상", "스코어 개선", "동료들에게 뒤떨어지기 싫음"],
    masgolf_solution: "반발계수 0.87로 비거리 +25m 증가, 동료들보다 뛰어난 성능"
  },
  self_actualization: {
    needs: ["자기실현", "잠재력 발휘"],
    golf_context: ["최고의 골프 실력", "완벽한 스윙", "자기 초월"],
    masgolf_solution: "일본 최고급 티타늄과 정밀한 맞춤 피팅으로 최고 성능 달성"
  }
};

// 브랜드 메시지 생성 헬퍼 함수
export const generateBrandMessage = (contentType, audienceTemp, brandWeight, customerChannel = 'local_customers') => {
  const strategy = CONTENT_STRATEGY[contentType] || CONTENT_STRATEGY.information;
  const channel = CUSTOMER_CHANNELS[customerChannel] || CUSTOMER_CHANNELS.local_customers;
  
  let message = {
    core: strategy.keyMessages,
    cta: strategy.cta,
    location: local.message,
    trust: TRUST_INDICATORS.sales_data.slice(0, 2)
  };
  
  if (brandWeight === 'high') {
    message.emphasis = "MASGOLF 브랜드를 적극적으로 언급하고 핵심 메시지를 강조";
  } else if (brandWeight === 'medium') {
    message.emphasis = "MASGOLF 브랜드를 자연스럽게 언급하고 관련 기술력 소개";
  } else {
    message.emphasis = "필요시에만 MASGOLF 브랜드 언급, 주로 유용한 정보 제공";
  }
  
  return message;
};

// 페인 포인트 기반 메시지 생성
export const generatePainPointMessage = (painPoint, masgolfSolution = true) => {
  const pain = PAIN_POINTS[painPoint];
  if (!pain) return null;
  
  let message = {
    problem: pain.problem,
    symptoms: pain.symptoms,
    solution: pain.solution
  };
  
  if (masgolfSolution) {
    message.masgolf_advantage = pain.masgolf_advantage;
  }
  
  return message;
};
