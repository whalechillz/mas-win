// 랜딩페이지 전략 설정 - 멀티채널 광고용
export const LANDING_PAGE_STRATEGY = {
  // 네이버 파워링크
  naver_powerlink: {
    primary: 'https://www.mas9golf.com/',
    fallback: 'https://win.masgolf.co.kr/',
    weight: 0.7, // 70%
    description: '네이버 파워링크 - 공홈 우선',
    target_audience: ['existing_customer', 'new_customer'],
    utm_params: {
      source: 'naver',
      medium: 'powerlink',
      campaign: 'brand_search'
    },
    tracking_goals: ['phone_call', 'sita_booking', 'store_visit']
  },
  
  // 네이버 쇼핑 광고
  naver_shopping: {
    primary: 'https://smartstore.naver.com/masgolf',
    weight: 1.0, // 100%
    description: '네이버 쇼핑 광고 - 스마트스토어 직접',
    target_audience: ['new_customer'],
    utm_params: {
      source: 'naver',
      medium: 'shopping',
      campaign: 'product_purchase'
    },
    tracking_goals: ['direct_purchase', 'cart_add', 'product_view']
  },
  
  // 구글 광고
  google_ads: {
    primary: 'https://www.mas9golf.com/',
    secondary: 'https://win.masgolf.co.kr/25-10/', // MUZIIK 퍼널
    weights: { primary: 0.7, secondary: 0.3 },
    description: '구글 광고 - 공홈 70%, 퍼널 30%',
    target_audience: ['new_customer'],
    utm_params: {
      source: 'google',
      medium: 'ads',
      campaign: 'new_customer_acquisition'
    },
    tracking_goals: ['phone_call', 'sita_booking', 'homepage_visit', 'store_visit']
  },
  
  // 카카오톡 채널
  kakao_channel: {
    primary: 'https://www.mas9golf.com/',
    fallback: 'https://win.masgolf.co.kr/',
    weight: 0.8, // 80%
    description: '카카오톡 채널 - 공홈 우선',
    target_audience: ['existing_customer', 'new_customer'],
    utm_params: {
      source: 'kakao',
      medium: 'channel',
      campaign: 'relationship_building'
    },
    tracking_goals: ['phone_call', 'sita_booking', 'consultation']
  },
  
  // SMS/MMS
  sms_mms: {
    primary: 'https://www.mas9golf.com/',
    fallback: 'https://win.masgolf.co.kr/',
    weight: 0.9, // 90%
    description: 'SMS/MMS - 공홈 우선',
    target_audience: ['existing_customer'],
    utm_params: {
      source: 'sms',
      medium: 'direct',
      campaign: 'customer_retention'
    },
    tracking_goals: ['phone_call', 'sita_booking', 'upgrade_inquiry']
  },
  
  // 인스타그램
  instagram: {
    primary: 'https://www.mas9golf.com/',
    secondary: 'https://win.masgolf.co.kr/25-10/',
    weights: { primary: 0.6, secondary: 0.4 },
    description: '인스타그램 - 공홈 60%, 퍼널 40%',
    target_audience: ['new_customer'],
    utm_params: {
      source: 'instagram',
      medium: 'social',
      campaign: 'visual_marketing'
    },
    tracking_goals: ['homepage_visit', 'sita_booking', 'social_engagement']
  },
  
  // 페이스북
  facebook: {
    primary: 'https://www.mas9golf.com/',
    secondary: 'https://win.masgolf.co.kr/25-10/',
    weights: { primary: 0.7, secondary: 0.3 },
    description: '페이스북 - 공홈 70%, 퍼널 30%',
    target_audience: ['new_customer'],
    utm_params: {
      source: 'facebook',
      medium: 'social',
      campaign: 'social_acquisition'
    },
    tracking_goals: ['homepage_visit', 'sita_booking', 'social_engagement']
  }
};

// 타겟 단계별 분리 옵션 (선택적 활성화)
export const STAGE_BASED_LANDING = {
  awareness: {
    url: 'https://www.mas9golf.com/',
    description: '인지 단계 - 공홈으로 브랜드 인지도 향상',
    focus: 'brand_awareness',
    content_type: 'brand_introduction'
  },
  
  consideration: {
    url: 'https://win.masgolf.co.kr/25-10/',
    description: '고려 단계 - 퍼널 페이지로 상세 정보 제공',
    focus: 'product_comparison',
    content_type: 'detailed_information'
  },
  
  decision: {
    url: 'https://smartstore.naver.com/masgolf',
    description: '결정 단계 - 스마트스토어로 직접 구매',
    focus: 'purchase_conversion',
    content_type: 'purchase_flow'
  }
};

// 랜딩페이지 성과 추적 설정
export const LANDING_PAGE_TRACKING = {
  // 전환 목표 정의
  conversion_goals: {
    phone_call: {
      name: '전화 상담',
      value: 100,
      description: '고객센터 전화 연결'
    },
    
    sita_booking: {
      name: '시타 예약',
      value: 200,
      description: '무료 시타 예약 완료'
    },
    
    homepage_visit: {
      name: '홈페이지 방문',
      value: 10,
      description: '공홈 방문'
    },
    
    store_visit: {
      name: '매장 방문',
      value: 500,
      description: '실제 매장 방문'
    },
    
    direct_purchase: {
      name: '직접 구매',
      value: 1000,
      description: '온라인 직접 구매'
    },
    
    cart_add: {
      name: '장바구니 추가',
      value: 50,
      description: '상품 장바구니 추가'
    },
    
    product_view: {
      name: '상품 조회',
      value: 5,
      description: '상품 상세 페이지 조회'
    },
    
    consultation: {
      name: '상담 문의',
      value: 150,
      description: '온라인 상담 문의'
    },
    
    upgrade_inquiry: {
      name: '업그레이드 문의',
      value: 300,
      description: '기존 고객 업그레이드 문의'
    },
    
    social_engagement: {
      name: '소셜 참여',
      value: 20,
      description: '소셜미디어 참여 (좋아요, 댓글, 공유)'
    }
  },
  
  // UTM 파라미터 템플릿
  utm_templates: {
    default: {
      utm_source: '{source}',
      utm_medium: '{medium}',
      utm_campaign: '{campaign}',
      utm_content: '{content}',
      utm_term: '{term}'
    },
    
    multichannel: {
      utm_source: '{source}',
      utm_medium: '{medium}',
      utm_campaign: '{campaign}',
      utm_content: '{channel}_{target}',
      utm_term: '{keyword}'
    }
  }
};

// 랜딩페이지 A/B 테스트 설정
export const LANDING_PAGE_AB_TEST = {
  // 테스트 시나리오
  test_scenarios: {
    homepage_vs_funnel: {
      name: '공홈 vs 퍼널 페이지',
      variants: [
        { name: 'A', url: 'https://www.mas9golf.com/', weight: 0.5 },
        { name: 'B', url: 'https://win.masgolf.co.kr/25-10/', weight: 0.5 }
      ],
      metric: 'conversion_rate',
      duration_days: 30
    },
    
    target_audience_split: {
      name: '타겟 오디언스별 분리',
      variants: [
        { name: 'existing', url: 'https://www.mas9golf.com/', weight: 0.7 },
        { name: 'new', url: 'https://win.masgolf.co.kr/25-10/', weight: 0.3 }
      ],
      metric: 'engagement_rate',
      duration_days: 14
    }
  },
  
  // 성과 지표
  performance_metrics: {
    conversion_rate: {
      name: '전환율',
      formula: 'conversions / visits * 100',
      target: 3.0 // 3%
    },
    
    engagement_rate: {
      name: '참여율',
      formula: 'engaged_users / total_users * 100',
      target: 15.0 // 15%
    },
    
    bounce_rate: {
      name: '이탈률',
      formula: 'single_page_visits / total_visits * 100',
      target: 40.0 // 40% 이하
    },
    
    time_on_page: {
      name: '페이지 체류 시간',
      formula: 'total_time / total_visits',
      target: 120 // 2분
    }
  }
};

// 랜딩페이지 최적화 규칙
export const LANDING_PAGE_OPTIMIZATION = {
  // 자동 최적화 규칙
  auto_optimization_rules: [
    {
      condition: 'conversion_rate < 2.0',
      action: 'switch_to_funnel',
      description: '전환율이 2% 미만이면 퍼널 페이지로 전환'
    },
    
    {
      condition: 'bounce_rate > 60.0',
      action: 'improve_content',
      description: '이탈률이 60% 초과면 콘텐츠 개선'
    },
    
    {
      condition: 'time_on_page < 60',
      action: 'add_engagement_elements',
      description: '체류 시간이 1분 미만이면 참여 요소 추가'
    }
  ],
  
  // 성과 기반 가중치 조정
  weight_adjustment: {
    high_performance: {
      threshold: 5.0, // 전환율 5% 이상
      adjustment: 0.1, // 가중치 10% 증가
      max_weight: 0.9 // 최대 90%
    },
    
    low_performance: {
      threshold: 1.0, // 전환율 1% 미만
      adjustment: -0.1, // 가중치 10% 감소
      min_weight: 0.1 // 최소 10%
    }
  }
};

// 랜딩페이지 URL 생성 함수
export function generateLandingUrl(channel, targetAudience, options = {}) {
  const strategy = LANDING_PAGE_STRATEGY[channel];
  if (!strategy) {
    return 'https://www.mas9golf.com/';
  }
  
  // 가중치 기반 URL 선택
  let selectedUrl;
  if (strategy.weights) {
    const random = Math.random();
    if (random < strategy.weights.primary) {
      selectedUrl = strategy.primary;
    } else {
      selectedUrl = strategy.secondary;
    }
  } else {
    selectedUrl = strategy.primary;
  }
  
  // UTM 파라미터 추가
  const utmParams = new URLSearchParams();
  Object.entries(strategy.utm_params).forEach(([key, value]) => {
    utmParams.append(key, value);
  });
  
  // 추가 파라미터
  if (options.content) {
    utmParams.append('utm_content', options.content);
  }
  
  if (options.term) {
    utmParams.append('utm_term', options.term);
  }
  
  // URL 조합
  const separator = selectedUrl.includes('?') ? '&' : '?';
  return `${selectedUrl}${separator}${utmParams.toString()}`;
}

// 타겟 단계별 URL 생성
export function generateStageBasedUrl(stage, options = {}) {
  const stageConfig = STAGE_BASED_LANDING[stage];
  if (!stageConfig) {
    return 'https://www.mas9golf.com/';
  }
  
  // UTM 파라미터 추가
  const utmParams = new URLSearchParams({
    utm_source: options.source || 'multichannel',
    utm_medium: 'stage_based',
    utm_campaign: stage,
    utm_content: stageConfig.focus
  });
  
  const separator = stageConfig.url.includes('?') ? '&' : '?';
  return `${stageConfig.url}${separator}${utmParams.toString()}`;
}

// 랜딩페이지 성과 분석
export function analyzeLandingPerformance(data) {
  const analysis = {
    overall_conversion_rate: (data.conversions / data.visits) * 100,
    channel_performance: {},
    recommendations: []
  };
  
  // 채널별 성과 분석
  Object.entries(data.channels || {}).forEach(([channel, channelData]) => {
    const conversionRate = (channelData.conversions / channelData.visits) * 100;
    analysis.channel_performance[channel] = {
      conversion_rate: conversionRate,
      performance_level: conversionRate >= 3.0 ? 'high' : conversionRate >= 1.5 ? 'medium' : 'low'
    };
  });
  
  // 최적화 권장사항 생성
  if (analysis.overall_conversion_rate < 2.0) {
    analysis.recommendations.push('전체 전환율이 낮습니다. 퍼널 페이지 활용을 고려하세요.');
  }
  
  Object.entries(analysis.channel_performance).forEach(([channel, performance]) => {
    if (performance.performance_level === 'low') {
      analysis.recommendations.push(`${channel} 채널의 전환율이 낮습니다. 랜딩페이지 개선이 필요합니다.`);
    }
  });
  
  return analysis;
}

export default {
  LANDING_PAGE_STRATEGY,
  STAGE_BASED_LANDING,
  LANDING_PAGE_TRACKING,
  LANDING_PAGE_AB_TEST,
  LANDING_PAGE_OPTIMIZATION,
  generateLandingUrl,
  generateStageBasedUrl,
  analyzeLandingPerformance
};
