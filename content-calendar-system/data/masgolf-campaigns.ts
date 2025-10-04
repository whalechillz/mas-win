// MASGOLF 10대 캠페인 데이터
// /data/masgolf-campaigns.ts

import { Campaign, ContentTemplate, ContentCalendarItem } from '@/types';

/**
 * MASGOLF 브랜드 연간 10대 스토리텔링 캠페인
 * 도널드 밀러, 러셀 브런슨, 세스 고딘, 로버트 치알디니의 전략 적용
 */
export const MASGOLF_CAMPAIGNS = {
  // =====================================================
  // 캠페인 메타 정보
  // =====================================================
  metadata: {
    brand: 'MASGOLF',
    targetAudience: {
      primary: '시니어 남성 골퍼',
      ageRange: '50-60대',
      interests: ['골프', '건강', '자기계발'],
      painPoints: ['비거리 감소', '체력 저하', '정확도 문제'],
      goals: ['비거리 향상', '골프 실력 개선', '건강한 골프 라이프']
    },
    yearlyGoals: {
      awareness: '브랜드 인지도 30% 향상',
      engagement: '커뮤니티 회원 1만명 달성',
      conversion: '연간 매출 50% 성장',
      retention: '기존 고객 재구매율 40%'
    }
  },

  // =====================================================
  // 10대 캠페인 상세 정의
  // =====================================================
  campaigns: [
    {
      id: 'campaign-1',
      name: '이웃집 김선생의 비거리 비밀',
      stage: 'awareness', // 인지 단계
      duration: 30, // 30일
      objectives: [
        '호기심 자극',
        '브랜드 인지도 상승',
        '무료 시타 예약 유도'
      ],
      story: {
        hero: '비거리가 줄어든 60대 골퍼',
        problem: '나이로 인한 비거리 감소',
        guide: 'MASGOLF',
        solution: '초고반발 드라이버',
        success: '20m 비거리 증가',
        transformation: '자신감 회복'
      },
      hook: '동년배 몰래 연습하더니 드라이버 비거리가 갑자기 20m 늘었다?!',
      channels: ['facebook', 'blog', 'youtube'],
      contentTypes: [
        {
          type: 'video',
          title: '김선생님의 비밀 인터뷰',
          duration: '3분',
          script: '실제 고객 인터뷰 형식의 스토리텔링'
        },
        {
          type: 'blog',
          title: '60대에도 비거리는 늘 수 있다',
          wordCount: 1500,
          keywords: ['시니어 골프', '비거리 향상', '드라이버']
        },
        {
          type: 'social',
          format: '카드뉴스',
          slides: 8,
          engagementTactic: '댓글로 본인 비거리 공유'
        }
      ],
      cta: {
        primary: '무료 시타 예약하기',
        secondary: '비거리 비법 자료 받기'
      },
      metrics: {
        targetReach: 50000,
        targetEngagement: 5000,
        targetConversion: 500
      },
      psychologyPrinciples: [
        'social_proof', // 사회적 증거
        'story_telling', // 스토리텔링
        'curiosity_gap' // 호기심 격차
      ]
    },

    {
      id: 'campaign-2',
      name: '3초 완판 스크래치 세일',
      stage: 'conversion', // 전환 단계
      duration: 7, // 7일
      objectives: [
        '즉각적인 구매 유도',
        '희소성 마케팅',
        '바이럴 효과'
      ],
      hook: '※한정 50세트: 스크래치 카드를 긁고 당신의 할인율을 확인하세요!※',
      channels: ['kakao', 'email', 'sms'],
      gamification: {
        type: 'scratch_card',
        rewards: [
          { probability: 0.5, discount: '10%' },
          { probability: 0.3, discount: '20%' },
          { probability: 0.15, discount: '30%' },
          { probability: 0.04, discount: '40%' },
          { probability: 0.01, discount: '50%' }
        ],
        shareBonus: '공유 시 추가 5% 할인'
      },
      cta: {
        primary: '지금 바로 전화해서 할인 적용 받기',
        secondary: '온라인으로 시타 예약하고 할인받기'
      },
      urgency: {
        type: 'countdown',
        duration: '48시간',
        scarcity: '선착순 50명'
      },
      psychologyPrinciples: [
        'scarcity', // 희소성
        'urgency', // 긴급성
        'gamification' // 게임화
      ]
    },

    {
      id: 'campaign-3',
      name: '인스타 친구 추천 챌린지',
      stage: 'awareness',
      duration: 14,
      objectives: [
        '바이럴 확산',
        '신규 고객 유입',
        '커뮤니티 확장'
      ],
      hook: '골프친구와 함께 도전하세요 – 둘 다 선물 받는 찬스!',
      channels: ['instagram', 'facebook'],
      viralMechanism: {
        action: '친구 태그 + 목표 비거리 댓글',
        reward: '둘 다 무료 스크린골프 이용권',
        bonusReward: '3명 이상 태그 시 사은품 추가'
      },
      hashtags: ['#MASGOLF챌린지', '#비거리목표', '#시니어골프'],
      cta: {
        primary: '시타 이벤트 신청',
        secondary: '전화 문의하기'
      },
      psychologyPrinciples: [
        'reciprocity', // 상호성
        'social_proof',
        'commitment' // 일관성
      ]
    },

    {
      id: 'campaign-4',
      name: '댓글 고민 상담소',
      stage: 'interest',
      duration: 'ongoing', // 상시 운영
      objectives: [
        '전문성 구축',
        '고객 니즈 파악',
        '신뢰 관계 형성'
      ],
      topics: [
        '드라이버 비거리 늘리기, 무엇이 가장 어려우신가요?',
        '어프로치 yips, 혼자 극복 가능할까요?',
        '나이 들수록 슬라이스가 심해지는 이유는?',
        '겨울철 골프, 부상 없이 즐기는 방법'
      ],
      expertResponse: {
        responseTime: '24시간 이내',
        expertCredentials: 'KPGA 프로 / 피팅 전문가',
        format: '개인 맞춤 조언'
      },
      rewards: {
        participation: '월간 추첨 - 골프공 세트',
        bestQuestion: '베스트 질문상 - 무료 피팅 서비스'
      },
      cta: {
        primary: '개인 맞춤 시타 세션 예약하기',
        secondary: '전문가 상담 전화 예약'
      },
      psychologyPrinciples: [
        'authority', // 권위
        'liking', // 호감
        'reciprocity'
      ]
    },

    {
      id: 'campaign-5',
      name: '시니어 골퍼 비거리 부활 스토리',
      stage: 'trust',
      duration: 'monthly', // 월간 시리즈
      objectives: [
        '실제 사례 공유',
        '공감대 형성',
        '구매 동기 부여'
      ],
      storyStructure: {
        act1: '문제 인식 (나이로 인한 한계)',
        act2: '좌절과 시도 (여러 방법 실패)',
        act3: 'MASGOLF 만남 (전문가 상담)',
        act4: '솔루션 적용 (맞춤 클럽)',
        act5: '극적인 변화 (20m 비거리 증가)',
        act6: '새로운 골프 인생',
        act7: '다른 골퍼들에게 전하는 메시지'
      },
      contentFormat: {
        longForm: '블로그 포스트 (2000자)',
        video: '5분 다큐멘터리',
        social: '인스타그램 릴스 시리즈'
      },
      cta: {
        primary: '나도 변화를 경험하고 싶다면? 무료 피팅 상담 예약',
        secondary: '성공 사례 더 보기'
      },
      psychologyPrinciples: [
        'social_proof',
        'identification', // 동일시
        'hope' // 희망
      ]
    },

    {
      id: 'campaign-6',
      name: '비거리 250클럽 도전',
      stage: 'interest',
      duration: 56, // 8주 프로그램
      objectives: [
        '커뮤니티 구축',
        '브랜드 충성도 향상',
        '지속적 관계 유지'
      ],
      programStructure: {
        week1_2: '기초 체력 및 유연성 향상',
        week3_4: '스윙 메커니즘 개선',
        week5_6: '클럽 피팅 및 조정',
        week7_8: '실전 적용 및 측정'
      },
      communityFeatures: {
        platform: '카카오톡 오픈채팅',
        weeklyMission: '주간 미션 수행 및 인증',
        coaching: '전문 코치 피드백',
        leaderboard: '실시간 순위표',
        badge: '달성 배지 시스템'
      },
      rewards: {
        completion: '250클럽 공식 패치',
        top3: '프리미엄 골프볼 1더즌',
        winner: 'MASGOLF 드라이버 50% 할인권'
      },
      cta: {
        initial: '카카오톡 채널 추가하고 도전 신청하기',
        midway: '중간 점검 - 무료 스윙 분석 받기',
        final: '성과 유지하려면? 전문 장비 시타 예약'
      },
      psychologyPrinciples: [
        'commitment',
        'social_proof',
        'gamification',
        'community' // 소속감
      ]
    },

    {
      id: 'campaign-7',
      name: 'MASGOLF 멤버 한정 VIP혜택',
      stage: 'retention',
      duration: 'ongoing',
      objectives: [
        '기존 고객 유지',
        '멤버십 가치 향상',
        '추가 구매 유도'
      ],
      membershipTiers: {
        bronze: {
          requirement: '1회 구매',
          benefits: ['연 2회 무료 피팅', '10% 상시 할인']
        },
        silver: {
          requirement: '누적 100만원',
          benefits: ['분기별 스윙 점검', '15% 상시 할인', '신제품 우선 구매권']
        },
        gold: {
          requirement: '누적 300만원',
          benefits: ['평생 보증', '20% 상시 할인', 'VIP 라운지 이용']
        }
      },
      exclusiveEvents: [
        '멤버 전용 월간 세일',
        'VIP 골프 투어',
        '프로와 함께하는 라운드'
      ],
      referralProgram: {
        reward: '추천인/피추천인 모두 5만원 상품권',
        bonusAt3: '3명 추천 시 골프웨어 세트'
      },
      cta: {
        nonMember: '멤버십 가입하기 - 전화 문의',
        member: '친구 추천하고 혜택 받기'
      },
      psychologyPrinciples: [
        'exclusivity', // 독점성
        'scarcity',
        'reciprocity',
        'social_proof'
      ]
    },

    {
      id: 'campaign-8',
      name: '골프 건강 5일 챌린지',
      stage: 'interest',
      duration: 5,
      objectives: [
        '가치 제공',
        '습관 형성',
        '브랜드 신뢰 구축'
      ],
      dailyContent: [
        {
          day: 1,
          title: '라운드 전 필수 스트레칭 3가지',
          format: 'video',
          duration: '1분'
        },
        {
          day: 2,
          title: '무릎 관절 보호 걷기 요령',
          format: 'infographic',
          action: '실천 인증샷'
        },
        {
          day: 3,
          title: '코어 근력 강화 운동',
          format: 'video',
          challenge: '30초 플랭크'
        },
        {
          day: 4,
          title: '스윙 파워를 위한 하체 운동',
          format: 'guide',
          equipment: '밴드 활용법'
        },
        {
          day: 5,
          title: '라운드 후 회복 루틴',
          format: 'video',
          bonus: '영양 관리 팁'
        }
      ],
      deliveryMethod: {
        primary: '카카오톡 메시지',
        secondary: '이메일',
        reminder: '오전 7시 알림'
      },
      communitySupport: {
        platform: '단톡방',
        dailyCheckIn: '오늘의 미션 인증',
        peerSupport: '서로 격려 댓글'
      },
      cta: {
        daily: '오늘의 팁 실천하기',
        final: '더 전문적인 가이드 - 맞춤 상담 신청',
        bonus: '완주자 한정 오프라인 세미나 초대'
      },
      psychologyPrinciples: [
        'commitment',
        'authority',
        'reciprocity',
        'habit_formation' // 습관 형성
      ]
    },

    {
      id: 'campaign-9',
      name: '명예의 전당 고객 콘테스트',
      stage: 'trust',
      duration: 30,
      objectives: [
        'UGC 생성',
        '브랜드 애착 강화',
        '사회적 증거 확보'
      ],
      contestTheme: 'MASGOLF와 함께한 나의 최고 순간',
      submissionCategories: [
        '최장 비거리 기록',
        '홀인원/이글 스토리',
        '골프 실력 향상기',
        '베스트 샷 사진',
        '감동 에피소드'
      ],
      submissionFormat: {
        story: '500자 이내 스토리',
        photo: '현장 사진 필수',
        video: '30초 영상 (선택)',
        hashtag: '#MASGOLF레전드'
      },
      prizes: {
        grandPrize: '최신 풀세트 (300만원 상당)',
        category: '각 부문 우승 - 드라이버/퍼터',
        participation: '참가자 전원 골프공 세트'
      },
      hallOfFame: {
        display: '매장 명예의 전당 전시',
        online: '공식 블로그 인터뷰',
        social: 'SNS 스타 골퍼 선정'
      },
      cta: {
        submit: '나의 이야기 응모하기',
        vote: '베스트 스토리 투표하기',
        share: 'SNS에 공유하고 응원하기'
      },
      psychologyPrinciples: [
        'social_proof',
        'recognition', // 인정 욕구
        'reciprocity',
        'community'
      ]
    },

    {
      id: 'campaign-10',
      name: '한정판 드라이버 VIP 프리뷰',
      stage: 'conversion',
      duration: 3,
      objectives: [
        '고가 제품 판매',
        'VIP 고객 관리',
        '프리미엄 이미지 구축'
      ],
      eventDetails: {
        product: '30개 한정 티타늄 드라이버',
        price: '250만원',
        specialFeatures: [
          '개인 각인 서비스',
          '평생 A/S',
          '전문 피팅 포함'
        ]
      },
      vipInvitation: {
        criteria: 'Gold 멤버 + 누적 구매 500만원 이상',
        inviteMethod: '개인화된 초청장 (우편+문자)',
        rsvp: '전화 확인 필수',
        plusOne: 'VIP 1인당 지인 1명 동반 가능'
      },
      eventProgram: {
        welcome: '웰컴 드링크 & 네트워킹',
        presentation: 'CEO 제품 개발 스토리',
        experience: '1:1 전문 피팅 & 시타',
        exclusive: '당일 구매자 특별 혜택'
      },
      incentives: {
        earlyBird: '현장 계약 시 10% 추가 할인',
        bundle: '풀세트 구매 시 20% 할인',
        referral: '지인 소개 구매 시 사은품'
      },
      followUp: {
        day1: '참석 감사 메시지',
        day3: '3일 한정 특별가 제안',
        day7: '마지막 기회 알림'
      },
      cta: {
        rsvp: 'VIP 이벤트 참석 확정',
        onsite: '한정판 예약구매 신청',
        followup: '특별가 구매 - 전화주문'
      },
      psychologyPrinciples: [
        'scarcity',
        'exclusivity',
        'authority',
        'social_proof',
        'reciprocity'
      ]
    }
  ],

  // =====================================================
  // 캠페인 실행 캘린더
  // =====================================================
  calendar: {
    Q1: ['campaign-1', 'campaign-4', 'campaign-8'],
    Q2: ['campaign-3', 'campaign-5', 'campaign-6'],
    Q3: ['campaign-2', 'campaign-7', 'campaign-9'],
    Q4: ['campaign-10', 'campaign-5', 'campaign-2']
  },

  // =====================================================
  // 콘텐츠 템플릿
  // =====================================================
  templates: {
    storyBlog: {
      structure: [
        '후킹 타이틀',
        '문제 제시',
        '공감 형성',
        '해결책 소개',
        '변화 과정',
        '성공 결과',
        'CTA'
      ],
      wordCount: 1500,
      tone: 'inspirational'
    },
    socialPost: {
      structure: [
        '후킹 질문',
        '핵심 메시지',
        '사회적 증거',
        '행동 유도'
      ],
      characterLimit: 200,
      hashtags: 5
    },
    emailNewsletter: {
      structure: [
        '개인화 인사',
        '가치 제공',
        '제품 연결',
        '특별 제안',
        'CTA 버튼'
      ],
      subject: {
        maxLength: 50,
        urgency: true
      }
    }
  },

  // =====================================================
  // 성과 측정 지표
  // =====================================================
  kpis: {
    awareness: {
      reach: 'monthly_unique_visitors',
      impressions: 'total_content_views',
      brandSearch: 'brand_keyword_searches'
    },
    interest: {
      engagement: 'likes_comments_shares',
      timeOnSite: 'average_session_duration',
      contentConsumption: 'pages_per_session'
    },
    trust: {
      newsletterSignups: 'email_subscribers',
      communityMembers: 'active_community_users',
      ugcSubmissions: 'customer_content_created'
    },
    conversion: {
      leads: 'inquiry_form_submissions',
      trials: 'fitting_session_bookings',
      sales: 'product_purchases',
      revenue: 'total_revenue'
    }
  }
};

/**
 * 캠페인을 콘텐츠 캘린더 아이템으로 변환
 */
export function convertCampaignToCalendarItems(
  campaignId: string,
  startDate: Date
): ContentCalendarItem[] {
  const campaign = MASGOLF_CAMPAIGNS.campaigns.find(c => c.id === campaignId);
  if (!campaign) return [];

  const items: ContentCalendarItem[] = [];
  
  // 캠페인의 각 콘텐츠 타입별로 캘린더 아이템 생성
  campaign.contentTypes?.forEach((content, index) => {
    items.push({
      id: `${campaignId}-${index}`,
      title: content.title || campaign.name,
      contentType: content.type as any,
      contentDate: new Date(startDate.getTime() + (index * 7 * 24 * 60 * 60 * 1000)), // 주간 배포
      status: 'planned',
      campaignId: campaign.id,
      theme: campaign.name,
      keywords: campaign.hook.split(' ').slice(0, 5),
      targetAudience: MASGOLF_CAMPAIGNS.metadata.targetAudience,
      priority: campaign.stage === 'conversion' ? 1 : 2,
      year: startDate.getFullYear(),
      month: startDate.getMonth() + 1,
      season: getSeason(startDate)
    } as ContentCalendarItem);
  });

  return items;
}

function getSeason(date: Date): 'spring' | 'summer' | 'autumn' | 'winter' {
  const month = date.getMonth() + 1;
  if (month >= 3 && month <= 5) return 'spring';
  if (month >= 6 && month <= 8) return 'summer';
  if (month >= 9 && month <= 11) return 'autumn';
  return 'winter';
}

export default MASGOLF_CAMPAIGNS;
