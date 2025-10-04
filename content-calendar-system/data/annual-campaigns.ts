// Annual Campaigns Data for 2026
// /data/annual-campaigns.ts

import { AnnualCampaign, Channel } from '@/types';

/**
 * MASSGOO 2026년 연간 마케팅 캠페인 계획
 */
export const ANNUAL_CAMPAIGNS_2026: { [quarter: string]: { [month: string]: AnnualCampaign } } = {
  Q1: {
    january: {
      campaignId: 'NEW_YEAR_UPGRADE_2026',
      campaignName: '새해 새 장비 업그레이드',
      year: 2026,
      quarter: 1,
      month: 1,
      startDate: new Date('2026-01-01'),
      endDate: new Date('2026-01-31'),
      theme: '새해 새 장비',
      objectives: [
        '신규 고객 유치 30% 증가',
        '기존 고객 재구매율 20% 향상',
        '브랜드 인지도 강화'
      ],
      targetMetrics: {
        reach: 100000,
        engagement: 15000,
        leads: 500,
        conversions: 50,
        revenue: 50000000
      },
      budget: 10000000,
      channels: ['blog', 'instagram', 'facebook', 'email', 'naver_blog'] as Channel[],
      keyMessages: [
        '2026년, 새로운 시작을 MASSGOO와 함께',
        '최신 기술로 완성하는 완벽한 스윙',
        '새해 특별 할인 최대 30%'
      ],
      contentPillars: [
        {
          name: '제품 소개',
          description: '2026년 신제품 라인업 소개',
          topics: ['신제품 특징', '기술 혁신', '성능 비교'],
          percentage: 40
        },
        {
          name: '고객 스토리',
          description: '성공적인 장비 교체 사례',
          topics: ['Before/After', '고객 인터뷰', '성과 공유'],
          percentage: 30
        },
        {
          name: '전문가 팁',
          description: '새해 골프 목표 설정 가이드',
          topics: ['목표 설정법', '연습 계획', '장비 선택법'],
          percentage: 30
        }
      ],
      status: 'planned',
      notes: '설날 연휴 특별 프로모션 포함'
    },
    
    february: {
      campaignId: 'BRAND_HERITAGE_2026',
      campaignName: 'MASSGOO 브랜드 스토리',
      year: 2026,
      quarter: 1,
      month: 2,
      startDate: new Date('2026-02-01'),
      endDate: new Date('2026-02-28'),
      theme: '브랜드 스토리',
      objectives: [
        '브랜드 신뢰도 구축',
        '프리미엄 이미지 강화',
        '장인정신 스토리텔링'
      ],
      targetMetrics: {
        reach: 80000,
        engagement: 12000,
        leads: 300,
        conversions: 30,
        revenue: 30000000
      },
      budget: 8000000,
      channels: ['blog', 'youtube', 'facebook', 'email'] as Channel[],
      keyMessages: [
        'MASSGOO 창업자의 철학',
        '일본 장인정신의 계승',
        '15년 기술 개발 스토리'
      ],
      contentPillars: [
        {
          name: '창업 스토리',
          description: '창업자 인터뷰 및 철학',
          topics: ['창업 배경', '브랜드 철학', '미션과 비전'],
          percentage: 35
        },
        {
          name: '기술 개발',
          description: '독자 기술 개발 과정',
          topics: ['R&D 스토리', '특허 기술', '품질 관리'],
          percentage: 35
        },
        {
          name: '파트너십',
          description: '일본 기업과의 협력',
          topics: ['JFE 스틸', 'NGS 샤프트', '품질 인증'],
          percentage: 30
        }
      ],
      status: 'planned',
      notes: '다큐멘터리 스타일 영상 제작'
    },
    
    march: {
      campaignId: 'SEASON_OPENING_2026',
      campaignName: '2026 시즌 오픈 준비',
      year: 2026,
      quarter: 1,
      month: 3,
      startDate: new Date('2026-03-01'),
      endDate: new Date('2026-03-31'),
      theme: '시즌 오픈 준비',
      objectives: [
        '시즌 준비 제품 판매 증대',
        '스프링 캠프 참여자 모집',
        '커뮤니티 활성화'
      ],
      targetMetrics: {
        reach: 120000,
        engagement: 18000,
        leads: 600,
        conversions: 60,
        revenue: 60000000
      },
      budget: 12000000,
      channels: ['blog', 'instagram', 'youtube', 'email', 'naver_blog'] as Channel[],
      keyMessages: [
        '완벽한 시즌 시작을 위한 준비',
        '봄맞이 스윙 점검 서비스',
        '시즌 오픈 특별 이벤트'
      ],
      contentPillars: [
        {
          name: '시즌 준비',
          description: '장비 점검 및 준비 가이드',
          topics: ['장비 점검', '스윙 체크', '체력 관리'],
          percentage: 40
        },
        {
          name: '스프링 캠프',
          description: 'MASSGOO 스프링 골프 캠프',
          topics: ['캠프 일정', '프로 레슨', '참가 혜택'],
          percentage: 30
        },
        {
          name: '커뮤니티',
          description: '골퍼 네트워킹 이벤트',
          topics: ['동호회 결성', '라운드 모임', '경품 이벤트'],
          percentage: 30
        }
      ],
      status: 'planned',
      notes: '골프장 파트너십 활용'
    }
  },
  
  Q2: {
    april: {
      campaignId: 'DISTANCE_CHALLENGE_2026',
      campaignName: '30일 비거리 챌린지',
      year: 2026,
      quarter: 2,
      month: 4,
      startDate: new Date('2026-04-01'),
      endDate: new Date('2026-04-30'),
      theme: '비거리 향상 프로젝트',
      objectives: [
        '제품 성능 입증',
        '고객 참여 유도',
        'UGC 콘텐츠 생성'
      ],
      targetMetrics: {
        reach: 150000,
        engagement: 25000,
        leads: 800,
        conversions: 80,
        revenue: 80000000
      },
      budget: 15000000,
      channels: ['instagram', 'youtube', 'tiktok', 'blog', 'email'] as Channel[],
      keyMessages: [
        '30일만에 비거리 25M 증가',
        'MASSGOO와 함께하는 도전',
        '참가자 전원 선물 증정'
      ],
      contentPillars: [
        {
          name: '챌린지 프로그램',
          description: '30일 트레이닝 프로그램',
          topics: ['일일 미션', '주간 목표', '최종 측정'],
          percentage: 40
        },
        {
          name: '참가자 스토리',
          description: '실시간 진행 상황 공유',
          topics: ['참가자 인터뷰', '중간 점검', '성과 발표'],
          percentage: 35
        },
        {
          name: '전문가 코칭',
          description: '프로 골퍼의 비거리 비법',
          topics: ['스윙 분석', '트레이닝 팁', 'Q&A 세션'],
          percentage: 25
        }
      ],
      status: 'planned',
      notes: '인플루언서 협업 필수'
    },
    
    may: {
      campaignId: 'FAMILY_GOLF_2026',
      campaignName: '가족의 달 골프 특집',
      year: 2026,
      quarter: 2,
      month: 5,
      startDate: new Date('2026-05-01'),
      endDate: new Date('2026-05-31'),
      theme: '가족의 달 특집',
      objectives: [
        '가족 단위 고객 확보',
        '세대 간 브랜드 인지도 확산',
        '패밀리 패키지 판매'
      ],
      targetMetrics: {
        reach: 100000,
        engagement: 15000,
        leads: 500,
        conversions: 50,
        revenue: 50000000
      },
      budget: 10000000,
      channels: ['blog', 'facebook', 'instagram', 'email', 'naver_blog'] as Channel[],
      keyMessages: [
        '3대가 함께하는 골프의 즐거움',
        '가족 맞춤 골프 솔루션',
        '어린이날 특별 이벤트'
      ],
      contentPillars: [
        {
          name: '가족 골프',
          description: '가족과 함께하는 골프',
          topics: ['세대별 장비', '가족 라운드', '에티켓 교육'],
          percentage: 40
        },
        {
          name: '세대 공감',
          description: '아버지와 아들의 골프 이야기',
          topics: ['세대 간 소통', '골프 철학', '추억 만들기'],
          percentage: 35
        },
        {
          name: '특별 혜택',
          description: '가족의 달 프로모션',
          topics: ['패밀리 세트', '할인 혜택', '경품 이벤트'],
          percentage: 25
        }
      ],
      status: 'planned',
      notes: '어린이날, 어버이날 연계 마케팅'
    },
    
    june: {
      campaignId: 'GOLDEN_TIME_2026',
      campaignName: '골든타임 - 프라임 시즌',
      year: 2026,
      quarter: 2,
      month: 6,
      startDate: new Date('2026-06-01'),
      endDate: new Date('2026-06-30'),
      theme: '골든타임',
      objectives: [
        '프리미엄 제품 라인 홍보',
        'VIP 고객 관리 강화',
        '상반기 매출 목표 달성'
      ],
      targetMetrics: {
        reach: 80000,
        engagement: 16000,
        leads: 400,
        conversions: 60,
        revenue: 90000000
      },
      budget: 12000000,
      channels: ['blog', 'youtube', 'instagram', 'email'] as Channel[],
      keyMessages: [
        '인생 최고의 골프 시즌',
        'MASSGOO 프리미엄 라인',
        'VIP 고객 특별 혜택'
      ],
      contentPillars: [
        {
          name: '프리미엄 제품',
          description: '최상급 제품 라인 소개',
          topics: ['플래그십 모델', '한정판', 'VIP 서비스'],
          percentage: 45
        },
        {
          name: '시니어 프로',
          description: '시니어 프로의 선택',
          topics: ['프로 인터뷰', '장비 리뷰', '성과 분석'],
          percentage: 30
        },
        {
          name: 'VIP 클럽',
          description: 'MASSGOO VIP 프로그램',
          topics: ['멤버십 혜택', '전용 서비스', '네트워킹'],
          percentage: 25
        }
      ],
      status: 'planned',
      notes: 'VIP 고객 대상 오프라인 이벤트 병행'
    }
  },
  
  Q3: {
    july: {
      campaignId: 'SUMMER_SPECIAL_2026',
      campaignName: '여름 특별전 - 쿨 서머 골프',
      year: 2026,
      quarter: 3,
      month: 7,
      startDate: new Date('2026-07-01'),
      endDate: new Date('2026-07-31'),
      theme: '여름 특별전',
      objectives: [
        '여름 시즌 매출 유지',
        '쿨링 제품 라인 홍보',
        '휴가철 골프 여행 패키지'
      ],
      targetMetrics: {
        reach: 90000,
        engagement: 13500,
        leads: 450,
        conversions: 45,
        revenue: 45000000
      },
      budget: 9000000,
      channels: ['instagram', 'facebook', 'blog', 'email', 'youtube'] as Channel[],
      keyMessages: [
        '무더위를 이기는 쿨 골프',
        '여름 휴가지 골프 가이드',
        '쿨링 기능성 제품'
      ],
      contentPillars: [
        {
          name: '쿨링 제품',
          description: '여름 전용 기능성 제품',
          topics: ['쿨링 웨어', '썬케어', '수분 관리'],
          percentage: 40
        },
        {
          name: '여름 골프',
          description: '더위 속 라운드 전략',
          topics: ['체력 관리', '스코어 전략', '안전 수칙'],
          percentage: 35
        },
        {
          name: '휴가 패키지',
          description: '골프 여행 특별 상품',
          topics: ['해외 골프', '리조트 패키지', '동반자 혜택'],
          percentage: 25
        }
      ],
      status: 'planned',
      notes: '여행사 및 리조트 제휴'
    },
    
    august: {
      campaignId: 'VACATION_GOLF_2026',
      campaignName: '휴가철 골프 이벤트',
      year: 2026,
      quarter: 3,
      month: 8,
      startDate: new Date('2026-08-01'),
      endDate: new Date('2026-08-31'),
      theme: '휴가철 이벤트',
      objectives: [
        '휴가철 특수 활용',
        '럭셔리 이미지 구축',
        '해외 골프 상품 판매'
      ],
      targetMetrics: {
        reach: 100000,
        engagement: 15000,
        leads: 500,
        conversions: 50,
        revenue: 75000000
      },
      budget: 11000000,
      channels: ['instagram', 'youtube', 'blog', 'email', 'facebook'] as Channel[],
      keyMessages: [
        '휴가지에서 즐기는 프리미엄 골프',
        'MASSGOO와 떠나는 골프 여행',
        '럭셔리 휴가 패키지'
      ],
      contentPillars: [
        {
          name: '골프 여행',
          description: '세계 명문 골프장 투어',
          topics: ['해외 골프장', '여행 팁', '장비 운송'],
          percentage: 40
        },
        {
          name: '럭셔리 라이프',
          description: '프리미엄 골프 라이프스타일',
          topics: ['호텔 & 리조트', 'VIP 서비스', '특별 경험'],
          percentage: 35
        },
        {
          name: '선물 패키지',
          description: '휴가철 특별 선물',
          topics: ['프리미엄 세트', '한정판', '커플 패키지'],
          percentage: 25
        }
      ],
      status: 'planned',
      notes: '럭셔리 브랜드 콜라보'
    },
    
    september: {
      campaignId: 'PEAK_SEASON_2026',
      campaignName: '시즌 절정 - 최고의 컨디션',
      year: 2026,
      quarter: 3,
      month: 9,
      startDate: new Date('2026-09-01'),
      endDate: new Date('2026-09-30'),
      theme: '시즌 절정',
      objectives: [
        '하반기 최대 매출 달성',
        '신제품 런칭',
        '고객 만족도 극대화'
      ],
      targetMetrics: {
        reach: 150000,
        engagement: 25000,
        leads: 750,
        conversions: 90,
        revenue: 120000000
      },
      budget: 18000000,
      channels: ['blog', 'instagram', 'youtube', 'email', 'naver_blog', 'facebook'] as Channel[],
      keyMessages: [
        '최적의 골프 시즌 도래',
        '2026 하반기 신제품 출시',
        '베스트 스코어 도전'
      ],
      contentPillars: [
        {
          name: '신제품 런칭',
          description: '2026 하반기 신제품',
          topics: ['제품 스펙', '성능 테스트', '사전 예약'],
          percentage: 45
        },
        {
          name: '시즌 캠페인',
          description: '가을 골프 최적화',
          topics: ['날씨별 전략', '코스 공략', '대회 준비'],
          percentage: 30
        },
        {
          name: '고객 이벤트',
          description: '고객 감사 대축제',
          topics: ['경품 이벤트', '체험 행사', '동반 라운드'],
          percentage: 25
        }
      ],
      status: 'planned',
      notes: '대규모 오프라인 런칭 이벤트'
    }
  },
  
  Q4: {
    october: {
      campaignId: 'AUTUMN_MASTER_2026',
      campaignName: '가을 마스터 클래스',
      year: 2026,
      quarter: 4,
      month: 10,
      startDate: new Date('2026-10-01'),
      endDate: new Date('2026-10-31'),
      theme: '가을 마스터',
      objectives: [
        '프로 레벨 교육 프로그램',
        '기술 향상 콘텐츠',
        '커뮤니티 강화'
      ],
      targetMetrics: {
        reach: 100000,
        engagement: 20000,
        leads: 600,
        conversions: 70,
        revenue: 85000000
      },
      budget: 13000000,
      channels: ['youtube', 'blog', 'instagram', 'email', 'facebook'] as Channel[],
      keyMessages: [
        '마스터가 되는 가을',
        'MASSGOO 아카데미',
        '프로의 비밀 노하우'
      ],
      contentPillars: [
        {
          name: '마스터 클래스',
          description: '최고 수준의 골프 교육',
          topics: ['프로 레슨', '스윙 분석', '멘탈 트레이닝'],
          percentage: 45
        },
        {
          name: '기술 콘텐츠',
          description: '심화 기술 가이드',
          topics: ['고급 기술', '코스 매니지먼트', '장비 세팅'],
          percentage: 35
        },
        {
          name: '커뮤니티',
          description: '마스터 골퍼 네트워크',
          topics: ['멤버 모임', '토너먼트', '지식 공유'],
          percentage: 20
        }
      ],
      status: 'planned',
      notes: '유명 프로 골퍼 초청 세미나'
    },
    
    november: {
      campaignId: 'YEAR_END_PREP_2026',
      campaignName: '연말 준비 & 감사 이벤트',
      year: 2026,
      quarter: 4,
      month: 11,
      startDate: new Date('2026-11-01'),
      endDate: new Date('2026-11-30'),
      theme: '연말 준비',
      objectives: [
        '연말 쇼핑 시즌 대비',
        '고객 감사 이벤트',
        '재고 정리'
      ],
      targetMetrics: {
        reach: 110000,
        engagement: 18000,
        leads: 550,
        conversions: 65,
        revenue: 70000000
      },
      budget: 11000000,
      channels: ['blog', 'email', 'instagram', 'facebook', 'naver_blog'] as Channel[],
      keyMessages: [
        '한 해를 마무리하는 특별 혜택',
        '고객 감사 대축제',
        '블랙프라이데이 특가'
      ],
      contentPillars: [
        {
          name: '감사 이벤트',
          description: '고객 감사의 달',
          topics: ['특별 할인', 'VIP 혜택', '경품 추첨'],
          percentage: 40
        },
        {
          name: '연말 특가',
          description: '블랙프라이데이 & 연말 세일',
          topics: ['최대 할인', '한정 수량', '번들 상품'],
          percentage: 35
        },
        {
          name: '선물 가이드',
          description: '골퍼를 위한 선물',
          topics: ['선물 추천', '패키지 상품', '기프트 카드'],
          percentage: 25
        }
      ],
      status: 'planned',
      notes: '블랙프라이데이 집중 마케팅'
    },
    
    december: {
      campaignId: 'YEAR_END_SPECIAL_2026',
      campaignName: '연말 특별 대전',
      year: 2026,
      quarter: 4,
      month: 12,
      startDate: new Date('2026-12-01'),
      endDate: new Date('2026-12-31'),
      theme: '연말 특가',
      objectives: [
        '연간 매출 목표 달성',
        '재고 소진',
        '내년도 고객 기반 확보'
      ],
      targetMetrics: {
        reach: 120000,
        engagement: 20000,
        leads: 600,
        conversions: 80,
        revenue: 100000000
      },
      budget: 15000000,
      channels: ['blog', 'instagram', 'facebook', 'email', 'youtube', 'naver_blog'] as Channel[],
      keyMessages: [
        '2026 마지막 기회',
        '크리스마스 특별 선물',
        '새해 준비 필수템'
      ],
      contentPillars: [
        {
          name: '연말 결산',
          description: '2026년 베스트 상품',
          topics: ['인기 상품', '고객 리뷰', '수상 내역'],
          percentage: 35
        },
        {
          name: '크리스마스',
          description: '크리스마스 특별 이벤트',
          topics: ['선물 세트', '커플 패키지', '특별 할인'],
          percentage: 35
        },
        {
          name: '새해 준비',
          description: '2027년을 위한 준비',
          topics: ['신년 계획', '목표 설정', '사전 예약'],
          percentage: 30
        }
      ],
      status: 'planned',
      notes: '크리스마스 및 연말연시 집중'
    }
  }
};

/**
 * 월별 콘텐츠 주제 매핑
 */
export const MONTHLY_CONTENT_THEMES = {
  1: ['새해 목표', '장비 업그레이드', '겨울 연습'],
  2: ['브랜드 스토리', '기술 혁신', '품질 관리'],
  3: ['시즌 준비', '스윙 점검', '체력 관리'],
  4: ['비거리 향상', '스윙 스피드', '파워 트레이닝'],
  5: ['가족 골프', '세대 공감', '함께하는 즐거움'],
  6: ['프라임 타임', '최고 컨디션', '프리미엄 경험'],
  7: ['여름 골프', '쿨링 전략', '체력 관리'],
  8: ['휴가 골프', '럭셔리 여행', '특별한 경험'],
  9: ['시즌 절정', '베스트 스코어', '신제품'],
  10: ['마스터 클래스', '고급 기술', '프로 노하우'],
  11: ['연말 준비', '감사 이벤트', '특별 할인'],
  12: ['연말 결산', '크리스마스', '새해 준비']
};

/**
 * 콘텐츠 타입별 발행 주기
 */
export const CONTENT_PUBLISHING_SCHEDULE = {
  blog: {
    frequency: 'weekly',
    count: 2,
    bestDays: ['화요일', '목요일'],
    bestTime: '10:00'
  },
  social: {
    instagram: {
      frequency: 'daily',
      count: 1,
      bestTimes: ['12:00', '19:00']
    },
    facebook: {
      frequency: 'daily',
      count: 1,
      bestTimes: ['14:00', '20:00']
    },
    youtube: {
      frequency: 'weekly',
      count: 1,
      bestDay: '금요일',
      bestTime: '18:00'
    }
  },
  email: {
    frequency: 'weekly',
    count: 1,
    bestDay: '수요일',
    bestTime: '09:00'
  },
  funnel: {
    frequency: 'monthly',
    count: 1,
    launchDay: 1
  }
};

/**
 * 타겟 오디언스 세그먼트
 */
export const TARGET_AUDIENCE_SEGMENTS = {
  primary: {
    name: '시니어 골퍼',
    ageRange: '50-70',
    characteristics: [
      '경제력 보유',
      '골프 경력 10년 이상',
      '주 2회 이상 라운드',
      '장비 투자 의향 높음'
    ],
    painPoints: [
      '비거리 감소',
      '체력 저하',
      '부상 우려',
      '정확도 문제'
    ],
    interests: [
      '건강한 골프',
      '사교 활동',
      '기술 향상',
      '프리미엄 제품'
    ]
  },
  secondary: {
    name: '중장년 골퍼',
    ageRange: '40-50',
    characteristics: [
      '비즈니스 골프',
      '주말 골퍼',
      '브랜드 중시',
      '성과 지향적'
    ],
    painPoints: [
      '시간 부족',
      '일관성 부족',
      '스코어 정체',
      '장비 선택 고민'
    ],
    interests: [
      '효율적 연습',
      '최신 기술',
      '네트워킹',
      '성과 개선'
    ]
  }
};

export default {
  ANNUAL_CAMPAIGNS_2026,
  MONTHLY_CONTENT_THEMES,
  CONTENT_PUBLISHING_SCHEDULE,
  TARGET_AUDIENCE_SEGMENTS
};
