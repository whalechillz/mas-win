// 연간 마케팅 운영 일정 관리
// /data/annual-marketing-calendar.ts

import { MASGOLF_CAMPAIGNS } from './masgolf-campaigns';

/**
 * MASGOLF 연간 마케팅 운영 일정
 * 시즌별 테마와 캠페인 배치, 콘텐츠 발행 주기 관리
 */
export const ANNUAL_MARKETING_CALENDAR = {
  // =====================================================
  // 시즌별 마케팅 테마
  // =====================================================
  seasons: {
    spring: {
      period: '3월-5월',
      theme: '새 시즌, 비거리 향상 및 신규 장비',
      focus: '비거리 향상',
      description: '골프 시즌 시작, 겨울 동안 줄어든 비거리 회복 및 장비 교체 관심',
      targetEmotions: ['희망', '도전', '설렘'],
      weatherConsideration: '날씨 좋아짐, 라운드 증가',
      campaigns: ['campaign-1', 'campaign-6', 'campaign-2'],
      contentFocus: ['비거리 향상 시리즈', '신제품 소개', '시타 이벤트']
    },
    summer: {
      period: '6월-8월',
      theme: '한여름 골프 지속 & 건강 관리',
      focus: '건강/체력 관리',
      description: '무더위 대비, 실내 연습, 체력 관리, 장마철 장비 관리',
      targetEmotions: ['인내', '관리', '준비'],
      weatherConsideration: '더위와 장마, 실내 활동 증가',
      campaigns: ['campaign-8', 'campaign-4'],
      contentFocus: ['건강/체력 시리즈', '장비 관리 팁', '다음 시즌 예고']
    },
    autumn: {
      period: '9월-11월',
      theme: '골프 성수기, 성과와 명예',
      focus: '성과 달성과 커뮤니티',
      description: '최적의 날씨, 활발한 라운드, 대회 시즌, 경쟁심과 명예욕',
      targetEmotions: ['성취', '자부심', '경쟁'],
      weatherConsideration: '최적의 골프 날씨',
      campaigns: ['campaign-7', 'campaign-9', 'campaign-10'],
      contentFocus: ['사회적 지위/명예 시리즈', '성과 공유', '프리미엄 제품']
    },
    winter: {
      period: '12월-2월',
      theme: '비수기 대비: 회고와 준비',
      focus: '한 해 정리와 새해 준비',
      description: '스크린골프, 실내연습, 한 해 회고, 다음 시즌 준비',
      targetEmotions: ['감사', '계획', '기대'],
      weatherConsideration: '필드 라운드 감소',
      campaigns: ['연말 감사 이벤트', '새해 목표 설정'],
      contentFocus: ['연간 모음집', '트렌드 리포트', '새해 계획']
    }
  },

  // =====================================================
  // 월별 상세 일정
  // =====================================================
  monthlySchedule: {
    1: {
      month: '1월',
      season: 'winter',
      campaigns: [],
      contentThemes: ['새해 목표 설정', '겨울 연습법'],
      channels: {
        blog: { frequency: 'biweekly', topics: ['새해 계획', '실내 연습'] },
        email: { frequency: 'monthly', type: '새해 인사 + 목표 설정 가이드' },
        kakao: { frequency: 'monthly', type: '새해 응원 메시지' },
        social: { frequency: 'weekly', type: '동기부여 콘텐츠' }
      }
    },
    2: {
      month: '2월',
      season: 'winter',
      campaigns: [],
      contentThemes: ['시즌 준비', '장비 점검'],
      channels: {
        blog: { frequency: 'biweekly', topics: ['봄 시즌 준비', '장비 체크리스트'] },
        email: { frequency: 'bimonthly', type: '시즌 준비 팁 + 신제품 예고' },
        kakao: { frequency: 'bimonthly', type: '봄 시즌 카운트다운' },
        social: { frequency: 'weekly', type: '준비 운동 영상' }
      }
    },
    3: {
      month: '3월',
      season: 'spring',
      campaigns: ['campaign-1'], // 이웃집 김선생의 비거리 비밀
      contentThemes: ['비거리 향상', '시즌 오픈'],
      channels: {
        blog: { frequency: 'weekly', topics: ['비거리 향상 시리즈 1-2편'] },
        email: { frequency: 'bimonthly', type: '시즌 오픈 특집' },
        kakao: { frequency: 'weekly', type: '비거리 팁 + 이벤트' },
        social: { frequency: 'twice-weekly', type: '스토리 캠페인' }
      }
    },
    4: {
      month: '4월',
      season: 'spring',
      campaigns: ['campaign-6'], // 비거리 250클럽 도전
      contentThemes: ['도전과 성장', '커뮤니티'],
      channels: {
        blog: { frequency: 'weekly', topics: ['비거리 향상 시리즈 3-4편', '도전기'] },
        email: { frequency: 'bimonthly', type: '챌린지 참여 안내' },
        kakao: { frequency: 'tri-monthly', type: '주간 미션 안내' },
        social: { frequency: 'twice-weekly', type: '참가자 인증샷' }
      }
    },
    5: {
      month: '5월',
      season: 'spring',
      campaigns: ['campaign-2'], // 스크래치 세일 (시즌 특별)
      contentThemes: ['신제품', '스페셜 이벤트'],
      channels: {
        blog: { frequency: 'weekly', topics: ['비거리 향상 시리즈 완결', '제품 리뷰'] },
        email: { frequency: 'weekly', type: '스크래치 세일 안내' },
        kakao: { frequency: 'weekly', type: '실시간 당첨 알림' },
        social: { frequency: 'daily', type: '세일 카운트다운' }
      }
    },
    6: {
      month: '6월',
      season: 'summer',
      campaigns: ['campaign-8'], // 골프 건강 5일 챌린지
      contentThemes: ['건강 관리', '여름 준비'],
      channels: {
        blog: { frequency: 'biweekly', topics: ['건강/체력 시리즈 1-2편'] },
        email: { frequency: 'bimonthly', type: '건강 챌린지 가이드' },
        kakao: { frequency: 'daily-during-challenge', type: '일일 미션' },
        social: { frequency: 'weekly', type: '건강 팁 영상' }
      }
    },
    7: {
      month: '7월',
      season: 'summer',
      campaigns: ['campaign-4'], // 댓글 고민 상담소
      contentThemes: ['소통과 상담', '장마철 관리'],
      channels: {
        blog: { frequency: 'biweekly', topics: ['건강/체력 시리즈 3편', '장마철 팁'] },
        email: { frequency: 'bimonthly', type: '고민 상담 Q&A' },
        kakao: { frequency: 'bimonthly', type: '전문가 답변' },
        social: { frequency: 'twice-weekly', type: '고민 접수 + 답변' }
      }
    },
    8: {
      month: '8월',
      season: 'summer',
      campaigns: ['campaign-3'], // 인스타 친구 추천 챌린지
      contentThemes: ['커뮤니티 확장', '늦여름 이벤트'],
      channels: {
        blog: { frequency: 'biweekly', topics: ['건강 시리즈 완결', '가을 예고'] },
        email: { frequency: 'bimonthly', type: '친구 추천 이벤트' },
        kakao: { frequency: 'weekly', type: '추천 보상 안내' },
        social: { frequency: 'daily', type: '태그 이벤트' }
      }
    },
    9: {
      month: '9월',
      season: 'autumn',
      campaigns: ['campaign-7'], // VIP 멤버십 혜택
      contentThemes: ['프리미엄', '멤버십'],
      channels: {
        blog: { frequency: 'weekly', topics: ['사회적 지위 시리즈 1편'] },
        email: { frequency: 'weekly', type: 'VIP 혜택 안내' },
        kakao: { frequency: 'weekly', type: '멤버 전용 혜택' },
        social: { frequency: 'twice-weekly', type: 'VIP 스토리' }
      }
    },
    10: {
      month: '10월',
      season: 'autumn',
      campaigns: ['campaign-9'], // 명예의 전당 콘테스트
      contentThemes: ['성과와 명예', '커뮤니티'],
      channels: {
        blog: { frequency: 'twice-weekly', topics: ['사회적 지위 시리즈 2-3편', '우승자 인터뷰'] },
        email: { frequency: 'weekly', type: '콘테스트 참여 안내' },
        kakao: { frequency: 'tri-monthly', type: '실시간 투표' },
        social: { frequency: 'daily', type: '참가작 소개' }
      }
    },
    11: {
      month: '11월',
      season: 'autumn',
      campaigns: ['campaign-10', 'campaign-2'], // VIP 프리뷰 + 블랙프라이데이
      contentThemes: ['한정판', '연말 특별'],
      channels: {
        blog: { frequency: 'weekly', topics: ['프리미엄 제품 소개', '연말 특집'] },
        email: { frequency: 'weekly', type: 'VIP 초청 + 세일 안내' },
        kakao: { frequency: 'tri-monthly', type: '한정 수량 알림' },
        social: { frequency: 'daily', type: '카운트다운 + 프리뷰' }
      }
    },
    12: {
      month: '12월',
      season: 'winter',
      campaigns: ['연말 감사 이벤트'],
      contentThemes: ['한 해 정리', '감사'],
      channels: {
        blog: { frequency: 'weekly', topics: ['올해의 MASGOLF', '베스트 콘텐츠'] },
        email: { frequency: 'weekly', type: '연말 감사 + 연간 리포트' },
        kakao: { frequency: 'bimonthly', type: '감사 메시지 + 선물' },
        social: { frequency: 'twice-weekly', type: '한 해 회고' }
      }
    }
  },

  // =====================================================
  // 콘텐츠 발행 주기
  // =====================================================
  publishingCadence: {
    blog: {
      annual: 50,
      peak: { spring: 'weekly', autumn: 'weekly' },
      normal: { summer: 'biweekly', winter: 'biweekly' },
      bestDays: ['화', '목'],
      bestTime: '10:00'
    },
    email: {
      annual: 24,
      regular: 'bimonthly',
      special: 'event-based',
      bestDays: ['수'],
      bestTime: '09:00',
      segments: ['전체', 'VIP', '미구매자', '신규']
    },
    kakao: {
      annual: 36,
      regular: 'tri-monthly',
      campaign: 'daily-during-events',
      bestDays: ['월', '수', '금'],
      bestTime: '11:00'
    },
    sms: {
      annual: 12,
      regular: 'monthly',
      urgent: 'event-only',
      bestDays: ['금'],
      bestTime: '14:00'
    },
    social: {
      facebook: {
        annual: 100,
        regular: 'twice-weekly',
        campaign: 'daily',
        bestDays: ['화', '목', '토'],
        bestTime: '19:00'
      },
      instagram: {
        annual: 150,
        regular: 'tri-weekly',
        stories: 'daily-during-campaigns',
        bestDays: ['월', '수', '금'],
        bestTime: '12:00, 18:00'
      }
    }
  },

  // =====================================================
  // 반복 및 업데이트 전략
  // =====================================================
  yearlyStrategy: {
    framework: {
      Q1: {
        theme: '준비와 시작',
        focus: '새해 목표, 시즌 준비',
        campaigns: ['목표 설정', 'campaign-1'],
        kpi: ['신규 리드 확보', '브랜드 인지도']
      },
      Q2: {
        theme: '도전과 성장',
        focus: '비거리 향상, 커뮤니티',
        campaigns: ['campaign-6', 'campaign-8', 'campaign-3'],
        kpi: ['참여율', '커뮤니티 성장']
      },
      Q3: {
        theme: '성과와 명예',
        focus: '성수기 활용, 프리미엄',
        campaigns: ['campaign-7', 'campaign-9'],
        kpi: ['전환율', 'LTV 증가']
      },
      Q4: {
        theme: '완성과 감사',
        focus: '한정판, 연말 정리',
        campaigns: ['campaign-10', 'campaign-2', '감사 이벤트'],
        kpi: ['매출', '재구매율']
      }
    },
    
    updateCycle: {
      monthly: ['성과 리뷰', 'A/B 테스트 결과 반영'],
      quarterly: ['캠페인 효과 분석', '콘텐츠 업데이트'],
      yearly: [
        '전체 전략 리뷰',
        '신규 캠페인 추가',
        '저성과 캠페인 교체',
        '트렌드 반영'
      ]
    },
    
    contentRefresh: {
      maintain: ['핵심 메시지', '브랜드 톤', '시즌별 테마'],
      update: [
        '구체적 사례와 수치',
        '고객 후기',
        '제품 정보',
        '트렌드 키워드'
      ],
      experiment: [
        '새로운 형식 (영상, 인터랙티브)',
        '새로운 채널 (유튜브, 틱톡)',
        '새로운 파트너십'
      ]
    }
  },

  // =====================================================
  // 자동화 규칙
  // =====================================================
  automationRules: {
    triggers: {
      seasonal: [
        { condition: 'month === 3', action: 'activate_spring_campaigns' },
        { condition: 'month === 6', action: 'activate_summer_campaigns' },
        { condition: 'month === 9', action: 'activate_autumn_campaigns' },
        { condition: 'month === 12', action: 'activate_winter_campaigns' }
      ],
      performance: [
        { condition: 'engagement < 10%', action: 'boost_content' },
        { condition: 'conversion > 5%', action: 'scale_campaign' }
      ],
      inventory: [
        { condition: 'stock < 20', action: 'urgency_messaging' },
        { condition: 'new_product', action: 'launch_campaign' }
      ]
    },
    
    workflows: {
      contentSeries: {
        '비거리 향상': { months: [3, 4, 5], frequency: 'weekly' },
        '건강/체력': { months: [6, 7, 8], frequency: 'biweekly' },
        '사회적 지위': { months: [9, 10], frequency: 'weekly' },
        '손실 회피': { months: [10, 11], frequency: 'monthly' }
      },
      
      campaignSequence: {
        awareness: ['campaign-1', 'campaign-3'],
        interest: ['campaign-4', 'campaign-6', 'campaign-8'],
        trust: ['campaign-5', 'campaign-9'],
        conversion: ['campaign-2', 'campaign-10', 'campaign-7']
      }
    }
  },

  // =====================================================
  // KPI 및 목표
  // =====================================================
  yearlyTargets: {
    growth: {
      revenue: '50% YoY',
      customers: '40% YoY',
      retention: '60% repeat rate',
      community: '10,000 members'
    },
    
    metrics: {
      blog: {
        traffic: '100,000 annual visitors',
        subscribers: '5,000 email list',
        engagement: '5% CTR'
      },
      campaigns: {
        participation: '20% of database',
        conversion: '5% average',
        roi: '400%'
      },
      social: {
        followers: '20,000 combined',
        engagement: '10% average',
        shares: '1,000 monthly'
      }
    }
  }
};

/**
 * 현재 시즌 가져오기
 */
export function getCurrentSeason(): string {
  const month = new Date().getMonth() + 1;
  if (month >= 3 && month <= 5) return 'spring';
  if (month >= 6 && month <= 8) return 'summer';
  if (month >= 9 && month <= 11) return 'autumn';
  return 'winter';
}

/**
 * 현재 월의 캠페인 가져오기
 */
export function getCurrentMonthCampaigns(): string[] {
  const month = new Date().getMonth() + 1;
  return ANNUAL_MARKETING_CALENDAR.monthlySchedule[month as keyof typeof ANNUAL_MARKETING_CALENDAR.monthlySchedule].campaigns;
}

/**
 * 발행 일정 생성
 */
export function generatePublishingSchedule(
  year: number,
  month: number,
  channel: 'blog' | 'email' | 'kakao' | 'social'
): Date[] {
  const schedule: Date[] = [];
  const monthData = ANNUAL_MARKETING_CALENDAR.monthlySchedule[month as keyof typeof ANNUAL_MARKETING_CALENDAR.monthlySchedule];
  
  if (!monthData) return schedule;
  
  const channelData = monthData.channels[channel as keyof typeof monthData.channels];
  if (!channelData) return schedule;
  
  // frequency에 따라 날짜 생성
  const frequency = channelData.frequency;
  
  switch (frequency) {
    case 'daily':
      for (let day = 1; day <= 30; day++) {
        schedule.push(new Date(year, month - 1, day));
      }
      break;
    case 'twice-weekly':
      schedule.push(new Date(year, month - 1, 5));
      schedule.push(new Date(year, month - 1, 12));
      schedule.push(new Date(year, month - 1, 19));
      schedule.push(new Date(year, month - 1, 26));
      break;
    case 'weekly':
      schedule.push(new Date(year, month - 1, 7));
      schedule.push(new Date(year, month - 1, 14));
      schedule.push(new Date(year, month - 1, 21));
      schedule.push(new Date(year, month - 1, 28));
      break;
    case 'biweekly':
      schedule.push(new Date(year, month - 1, 14));
      schedule.push(new Date(year, month - 1, 28));
      break;
    case 'monthly':
      schedule.push(new Date(year, month - 1, 15));
      break;
    case 'bimonthly':
      schedule.push(new Date(year, month - 1, 10));
      schedule.push(new Date(year, month - 1, 25));
      break;
    case 'tri-monthly':
      schedule.push(new Date(year, month - 1, 7));
      schedule.push(new Date(year, month - 1, 14));
      schedule.push(new Date(year, month - 1, 21));
      break;
  }
  
  return schedule;
}

export default ANNUAL_MARKETING_CALENDAR;
