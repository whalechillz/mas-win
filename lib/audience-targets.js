// 타겟 오디언스 정의 - 멀티채널 콘텐츠 생성용
export const AUDIENCE_TARGETS = {
  existing_customer: {
    name: '기존 고객',
    personas: ['재구매 고객', 'VIP 고객', '시타 경험자', '기존 제품 사용자'],
    tone: '친근하고 감사의 마음',
    focus: '업그레이드, 신제품, 특별 혜택, VIP 서비스',
    pain_points: ['기존 제품의 한계', '새로운 기술에 대한 관심', '성능 향상 욕구'],
    messaging: {
      greeting: '마쓰구골프를 믿고 선택해주신 고객님께',
      value_prop: '더욱 발전된 기술로 보답하겠습니다',
      cta: '업그레이드 혜택 확인하기'
    },
    channels: ['kakao', 'sms', 'naver_blog', 'naver_powerlink'],
    landing_preference: 'https://www.mas9golf.com/'
  },
  
  new_customer: {
    name: '신규 고객',
    personas: ['타사 제품 검색자', '비거리 고민자', '시니어 골퍼', '골프 입문자'],
    tone: '신뢰감과 전문성',
    focus: '문제 해결, 차별점, 무료 시타, 신뢰성',
    pain_points: ['비거리 부족', '기존 드라이버의 한계', '어떤 제품이 좋을지 모름'],
    messaging: {
      greeting: '골프 비거리로 고민이신가요?',
      value_prop: '22년 전통의 맞춤형 드라이버 전문 브랜드',
      cta: '무료 시타로 직접 확인하기'
    },
    channels: ['kakao', 'sms', 'google_ads', 'naver_shopping', 'instagram', 'facebook'],
    landing_preference: 'https://www.mas9golf.com/'
  }
};

// 타겟별 채널 우선순위
export const CHANNEL_PRIORITY = {
  existing_customer: [
    { channel: 'kakao', priority: 1, reason: '기존 고객과의 친밀한 소통' },
    { channel: 'sms', priority: 2, reason: '즉시성과 개인화' },
    { channel: 'naver_blog', priority: 3, reason: '상세한 정보 제공' },
    { channel: 'naver_powerlink', priority: 4, reason: '재방문 유도' }
  ],
  
  new_customer: [
    { channel: 'google_ads', priority: 1, reason: '신규 고객 유입' },
    { channel: 'naver_shopping', priority: 2, reason: '구매 의도 고객' },
    { channel: 'kakao', priority: 3, reason: '상담 및 관계 형성' },
    { channel: 'instagram', priority: 4, reason: '시각적 어필' },
    { channel: 'facebook', priority: 5, reason: '광범위한 노출' }
  ]
};

// 타겟별 콘텐츠 길이 가이드라인
export const CONTENT_LENGTH_GUIDE = {
  existing_customer: {
    kakao: { max: 200, optimal: 150 },
    sms: { max: 80, optimal: 60 },
    naver_blog: { max: 2000, optimal: 1500 },
    naver_powerlink: { headline: 30, description: 45 }
  },
  
  new_customer: {
    kakao: { max: 200, optimal: 150 },
    sms: { max: 80, optimal: 60 },
    google_ads: { headline: 30, description: 90 },
    naver_shopping: { title: 50, description: 100 },
    instagram: { caption: 300, optimal: 200 },
    facebook: { post: 500, optimal: 300 }
  }
};

// 타겟별 키워드 전략
export const KEYWORD_STRATEGY = {
  existing_customer: {
    primary: ['업그레이드', '신제품', 'VIP', '특별혜택', '무료시타'],
    secondary: ['마쓰구', '고반발', '드라이버', '비거리'],
    avoid: ['입문', '처음', '기초', '초보']
  },
  
  new_customer: {
    primary: ['비거리', '드라이버', '고반발', '무료시타', '맞춤피팅'],
    secondary: ['골프', '시니어', '50대', '60대', '마쓰구'],
    avoid: ['VIP', '기존고객', '재구매']
  }
};

// 타겟별 이모지 사용 가이드
export const EMOJI_GUIDE = {
  existing_customer: {
    recommended: ['🎁', '⭐', '💎', '🏆', '🎯'],
    tone: '감사와 특별함을 강조',
    frequency: '적당히 (2-3개)'
  },
  
  new_customer: {
    recommended: ['🏌️', '📈', '💪', '🎉', '✨'],
    tone: '친근하고 희망적',
    frequency: '적극적으로 (3-5개)'
  }
};

// 타겟별 CTA (Call to Action) 전략
export const CTA_STRATEGY = {
  existing_customer: {
    primary: '업그레이드 혜택 확인하기',
    secondary: 'VIP 전용 상담 받기',
    tertiary: '신제품 무료 시타 예약',
    urgency: '한정 기간 특별 혜택'
  },
  
  new_customer: {
    primary: '무료 시타로 직접 확인하기',
    secondary: '비거리 상담 받기',
    tertiary: '맞춤 피팅 예약하기',
    urgency: '지금 바로 시작하기'
  }
};

// 타겟별 랜딩페이지 전략
export const LANDING_STRATEGY = {
  existing_customer: {
    primary: 'https://www.mas9golf.com/',
    fallback: 'https://win.masgolf.co.kr/',
    utm_params: {
      source: 'existing_customer',
      medium: 'retention',
      campaign: 'upgrade'
    }
  },
  
  new_customer: {
    primary: 'https://www.mas9golf.com/',
    secondary: 'https://win.masgolf.co.kr/25-10/', // MUZIIK 퍼널
    utm_params: {
      source: 'new_customer',
      medium: 'acquisition',
      campaign: 'first_contact'
    }
  }
};

// 타겟 감지 함수
export function detectTargetAudience(content, userData = {}) {
  const contentLower = content.toLowerCase();
  
  // 기존 고객 지표
  const existingCustomerIndicators = [
    '기존', '재구매', '업그레이드', 'VIP', '특별혜택',
    '마쓰구', '시타', '피팅', '경험'
  ];
  
  // 신규 고객 지표
  const newCustomerIndicators = [
    '비거리', '드라이버', '고반발', '처음', '입문',
    '어떤', '추천', '비교', '고민'
  ];
  
  const existingScore = existingCustomerIndicators.reduce((score, indicator) => {
    return score + (contentLower.includes(indicator) ? 1 : 0);
  }, 0);
  
  const newScore = newCustomerIndicators.reduce((score, indicator) => {
    return score + (contentLower.includes(indicator) ? 1 : 0);
  }, 0);
  
  // 사용자 데이터 기반 판단
  if (userData.isExistingCustomer) {
    return 'existing_customer';
  }
  
  if (userData.isNewCustomer) {
    return 'new_customer';
  }
  
  // 콘텐츠 기반 판단
  if (existingScore > newScore) {
    return 'existing_customer';
  } else if (newScore > existingScore) {
    return 'new_customer';
  }
  
  // 기본값: 신규 고객
  return 'new_customer';
}

// 타겟별 메시지 생성 헬퍼
export function generateTargetedMessage(targetType, channel, baseContent) {
  const target = AUDIENCE_TARGETS[targetType];
  const lengthGuide = CONTENT_LENGTH_GUIDE[targetType][channel];
  const cta = CTA_STRATEGY[targetType];
  
  if (!target || !lengthGuide) {
    return baseContent;
  }
  
  return {
    greeting: target.messaging.greeting,
    content: baseContent,
    cta: cta.primary,
    tone: target.tone,
    maxLength: lengthGuide.max,
    optimalLength: lengthGuide.optimal
  };
}

export default {
  AUDIENCE_TARGETS,
  CHANNEL_PRIORITY,
  CONTENT_LENGTH_GUIDE,
  KEYWORD_STRATEGY,
  EMOJI_GUIDE,
  CTA_STRATEGY,
  LANDING_STRATEGY,
  detectTargetAudience,
  generateTargetedMessage
};
