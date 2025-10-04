// MASGOLF 후킹 메시지 시스템
// /data/hooking-messages.ts

/**
 * MASGOLF 시니어 남성 골퍼 대상 후킹 메시지 라이브러리
 * 모든 마케팅 채널에서 사용할 수 있는 검증된 메시지
 */
export const HOOKING_MESSAGES = {
  // =====================================================
  // 메시지 카테고리
  // =====================================================
  categories: {
    distance: {
      id: 'distance',
      label: '비거리 향상',
      description: '비거리 증가에 초점을 맞춘 메시지',
      emotionalTrigger: 'achievement',
      icon: '🎯'
    },
    youth: {
      id: 'youth',
      label: '젊음 회복',
      description: '젊은 시절의 파워를 강조하는 메시지',
      emotionalTrigger: 'nostalgia',
      icon: '⏰'
    },
    technology: {
      id: 'technology',
      label: '기술력',
      description: '고반발 기술을 강조하는 메시지',
      emotionalTrigger: 'trust',
      icon: '🔬'
    },
    social: {
      id: 'social',
      label: '사회적 인정',
      description: '동료들의 부러움을 자극하는 메시지',
      emotionalTrigger: 'pride',
      icon: '👑'
    },
    easy: {
      id: 'easy',
      label: '편의성',
      description: '쉽고 편한 사용을 강조하는 메시지',
      emotionalTrigger: 'relief',
      icon: '😌'
    }
  },

  // =====================================================
  // 핵심 후킹 메시지
  // =====================================================
  messages: [
    {
      id: 'hook-01',
      category: 'distance',
      headline: '힘은 그대로, 비거리는 플러스 20야드',
      subline: 'MASGOLF로 젊은 파워를 되찾으세요',
      shortVersion: '비거리 +20야드',
      longVersion: '힘은 그대로인데 비거리는 20야드 더! MASGOLF 드라이버로 젊은 파워를 되찾으세요.',
      cta: '비거리 늘리기',
      keywords: ['비거리', '20야드', '파워'],
      channels: ['sms', 'kakao', 'email', 'social'],
      performance: {
        clickRate: 0,
        conversionRate: 0,
        tested: false
      }
    },
    {
      id: 'hook-02',
      category: 'youth',
      headline: '나이는 숫자일 뿐!',
      subline: '비거리를 포기하지 않는 당신께 MASGOLF 드라이버',
      shortVersion: '나이는 숫자일 뿐',
      longVersion: '나이는 숫자일 뿐! 비거리를 포기하지 않는 당신께 MASGOLF 드라이버를 권합니다.',
      cta: '젊음 되찾기',
      keywords: ['나이', '자신감', '비거리'],
      channels: ['email', 'social', 'blog'],
      performance: {}
    },
    {
      id: 'hook-03',
      category: 'youth',
      headline: '칠수록 젊어지는 드라이버',
      subline: '시니어 골퍼의 비밀병기 MASGOLF',
      shortVersion: '칠수록 젊어지는 드라이버',
      longVersion: '칠수록 젊어지는 드라이버, 시니어 골퍼의 비밀병기 MASGOLF를 만나보세요.',
      cta: '비밀병기 확인',
      keywords: ['젊음', '비밀병기', '시니어'],
      channels: ['sms', 'kakao'],
      performance: {}
    },
    {
      id: 'hook-04',
      category: 'social',
      headline: '베테랑의 품격에 기술을 더하다',
      subline: 'MASGOLF 초고반발 드라이버',
      shortVersion: '베테랑의 품격',
      longVersion: '베테랑의 품격에 기술을 더하다 – MASGOLF 초고반발 드라이버가 당신의 게임을 바꿉니다.',
      cta: '품격 높이기',
      keywords: ['품격', '베테랑', '초고반발'],
      channels: ['email', 'blog'],
      performance: {}
    },
    {
      id: 'hook-05',
      category: 'easy',
      headline: '힘들게 휘두르지 마십시오',
      subline: 'MASGOLF가 쉬운 장타를 약속합니다',
      shortVersion: '쉬운 장타 약속',
      longVersion: '힘들게 휘두르지 마십시오. MASGOLF가 쉬운 장타를 약속합니다.',
      cta: '쉬운 장타 경험',
      keywords: ['쉬운', '장타', '편안'],
      channels: ['sms', 'kakao', 'email'],
      performance: {}
    },
    {
      id: 'hook-06',
      category: 'social',
      headline: '드라이버 바꿨을 뿐인데...',
      subline: '동료들이 놀라는 비거리 향상!',
      shortVersion: '동료들이 놀란다',
      longVersion: '드라이버 바꿨을 뿐인데... 동료들이 놀라는 비거리 향상! MASGOLF의 마법입니다.',
      cta: '동료 놀라게 하기',
      keywords: ['동료', '놀람', '향상'],
      channels: ['social', 'kakao'],
      performance: {}
    },
    {
      id: 'hook-07',
      category: 'technology',
      headline: '한 번 치면 압니다',
      subline: '규격 초월 반발력 – 반칙같은 비거리!',
      shortVersion: '반칙같은 비거리',
      longVersion: '한 번 치면 압니다. 규격 초월 반발력 – 반칙같은 비거리를 경험하세요!',
      cta: '반칙 경험하기',
      keywords: ['초월', '반발력', '반칙'],
      channels: ['sms', 'social'],
      performance: {}
    },
    {
      id: 'hook-08',
      category: 'distance',
      headline: '장타의 꿈, 이제 장비로 이루십시오',
      subline: 'MASGOLF가 함께합니다',
      shortVersion: '장타의 꿈 실현',
      longVersion: '장타의 꿈, 이제 장비로 이루십시오. MASGOLF가 함께합니다.',
      cta: '꿈 이루기',
      keywords: ['장타', '꿈', '실현'],
      channels: ['email', 'blog'],
      performance: {}
    },
    {
      id: 'hook-09',
      category: 'distance',
      headline: '비거리 부족, 더 이상 몸 탓 말고 클럽 바꾸세요',
      subline: '솔직한 해결책',
      shortVersion: '클럽 바꾸세요',
      longVersion: '비거리 부족, 더 이상 몸 탓 말고 클럽 바꾸세요. MASGOLF가 해답입니다.',
      cta: '해결책 찾기',
      keywords: ['해결', '클럽', '교체'],
      channels: ['sms', 'kakao'],
      performance: {}
    },
    {
      id: 'hook-10',
      category: 'youth',
      headline: '어젯밤보다 10년 젊게',
      subline: '오늘 드라이버 샷 10미터 더!',
      shortVersion: '10년 젊게',
      longVersion: '어젯밤보다 10년 젊게, 오늘 드라이버 샷 10미터 더! MASGOLF의 기적입니다.',
      cta: '10년 젊어지기',
      keywords: ['10년', '젊음', '10미터'],
      channels: ['social', 'email'],
      performance: {}
    },
    // 추가 메시지 (두 번째 세트)
    {
      id: 'hook-11',
      category: 'distance',
      headline: '힘 빼도 멀리 나간다',
      subline: '70대도 비거리 30m 늘린 드라이버',
      shortVersion: '70대도 30m 증가',
      longVersion: '힘 빼도 멀리 나간다 – 70대도 비거리 30m 늘린 드라이버, MASGOLF입니다.',
      cta: '30m 늘리기',
      keywords: ['70대', '30m', '증가'],
      channels: ['sms', 'kakao', 'email'],
      performance: {}
    },
    {
      id: 'hook-12',
      category: 'technology',
      headline: 'COR 0.87 초고반발 페이스',
      subline: '한계치를 넘어 드라이버 비거리 극대화',
      shortVersion: 'COR 0.87 초고반발',
      longVersion: 'COR 0.87 초고반발 페이스 – 한계치를 넘어 드라이버 비거리를 극대화합니다.',
      cta: '기술력 확인',
      keywords: ['COR', '0.87', '초고반발'],
      channels: ['email', 'blog'],
      performance: {}
    },
    {
      id: 'hook-13',
      category: 'easy',
      headline: '시니어 전용 설계 드라이버',
      subline: '가볍게 휘두르고 편하게 더 멀리',
      shortVersion: '시니어 전용 설계',
      longVersion: '시니어 전용 설계 드라이버 – 가볍게 휘두르고 편하게 더 멀리 보내세요.',
      cta: '전용 드라이버 보기',
      keywords: ['시니어 전용', '경량', '편안'],
      channels: ['sms', 'kakao'],
      performance: {}
    },
    {
      id: 'hook-14',
      category: 'youth',
      headline: '한 번 더 젊게!',
      subline: '비거리에 자신감 주는 프리미엄 드라이버',
      shortVersion: '한 번 더 젊게',
      longVersion: '한 번 더 젊게! 비거리에 자신감 주는 프리미엄 드라이버 MASGOLF.',
      cta: '자신감 찾기',
      keywords: ['젊음', '자신감', '프리미엄'],
      channels: ['email', 'social'],
      performance: {}
    },
    {
      id: 'hook-15',
      category: 'technology',
      headline: '명품 드라이버의 기술력',
      subline: '이제 시니어 골퍼가 즐길 차례입니다',
      shortVersion: '명품 기술력',
      longVersion: '명품 드라이버의 기술력 – 이제 시니어 골퍼가 즐길 차례입니다.',
      cta: '명품 경험하기',
      keywords: ['명품', '기술력', '시니어'],
      channels: ['blog', 'email'],
      performance: {}
    },
    {
      id: 'hook-16',
      category: 'easy',
      headline: '내 몸에 딱 맞춘 맞춤형 드라이버',
      subline: '50대 이상을 위해 태어났다',
      shortVersion: '맞춤형 드라이버',
      longVersion: '내 몸에 딱 맞춘 맞춤형 드라이버, 50대 이상을 위해 태어났습니다.',
      cta: '맞춤 피팅 상담',
      keywords: ['맞춤형', '50대', '피팅'],
      channels: ['sms', 'kakao', 'email'],
      performance: {}
    },
    {
      id: 'hook-17',
      category: 'easy',
      headline: '백스윙은 가볍게, 임팩트는 강하게!',
      subline: '고반발로 즐기는 장타',
      shortVersion: '가볍게 강하게',
      longVersion: '백스윙은 가볍게, 임팩트는 강하게! 고반발로 즐기는 장타의 맛.',
      cta: '장타 즐기기',
      keywords: ['백스윙', '임팩트', '고반발'],
      channels: ['social', 'kakao'],
      performance: {}
    },
    {
      id: 'hook-18',
      category: 'social',
      headline: '수천 명 시니어 골퍼의 선택',
      subline: '믿고 쓰는 마쓰구 드라이버',
      shortVersion: '수천 명이 선택',
      longVersion: '수천 명 시니어 골퍼의 선택 – 믿고 쓰는 마쓰구 드라이버입니다.',
      cta: '베스트셀러 확인',
      keywords: ['수천명', '선택', '신뢰'],
      channels: ['email', 'blog'],
      performance: {}
    },
    {
      id: 'hook-19',
      category: 'easy',
      headline: '힘에 자신 없어도 OK!',
      subline: '마쓰구로 페어웨이 한가운데 시원하게',
      shortVersion: '힘 없어도 OK',
      longVersion: '힘에 자신 없어도 OK! 마쓰구로 페어웨이 한가운데 시원하게 보내세요.',
      cta: '페어웨이 정복',
      keywords: ['페어웨이', '시원', '정확'],
      channels: ['sms', 'kakao'],
      performance: {}
    },
    {
      id: 'hook-20',
      category: 'distance',
      headline: '이제 거리는 드라이버가 책임집니다',
      subline: '스코어 향상의 비밀병기',
      shortVersion: '거리는 드라이버가',
      longVersion: '이제 거리는 드라이버가 책임집니다. 스코어 향상의 비밀병기 MASGOLF.',
      cta: '스코어 개선하기',
      keywords: ['스코어', '향상', '비밀병기'],
      channels: ['email', 'social', 'blog'],
      performance: {}
    }
  ],

  // =====================================================
  // 채널별 최적화 템플릿
  // =====================================================
  channelTemplates: {
    sms: {
      format: 'short',
      maxLength: 90,
      includeEmoji: true,
      ctaType: 'phone',
      template: (msg: any) => `
[MASGOLF] ${msg.shortVersion}
☎️ 1588-0000 지금 전화주세요!
${msg.cta} >`
    },
    
    kakao: {
      format: 'card',
      maxLength: 400,
      includeImage: true,
      ctaType: 'link',
      template: (msg: any) => `
🏌️ ${msg.headline}

${msg.longVersion}

✅ ${msg.cta}
👉 masgolf.co.kr`
    },
    
    email: {
      format: 'long',
      includeImage: true,
      ctaType: 'button',
      template: (msg: any) => ({
        subject: msg.headline,
        preview: msg.subline,
        body: `
          <h1>${msg.headline}</h1>
          <h2>${msg.subline}</h2>
          <p>${msg.longVersion}</p>
          <a href="https://masgolf.co.kr" class="cta-button">${msg.cta}</a>
        `
      })
    },
    
    social: {
      format: 'thread',
      platforms: ['facebook', 'instagram', 'naver'],
      template: (msg: any) => ({
        post1: `${msg.headline} ${msg.subline}`,
        post2: msg.longVersion,
        post3: `👉 ${msg.cta}\n\n#MASGOLF #시니어골프 #비거리향상 #${msg.keywords.join(' #')}`
      })
    }
  },

  // =====================================================
  // A/B 테스트 설정
  // =====================================================
  abTesting: {
    enabled: true,
    testGroups: [
      {
        name: 'distance_vs_youth',
        messageA: 'hook-01', // 비거리 강조
        messageB: 'hook-02', // 젊음 강조
        splitRatio: 50
      },
      {
        name: 'technical_vs_emotional',
        messageA: 'hook-12', // COR 0.87 기술
        messageB: 'hook-03', // 칠수록 젊어지는
        splitRatio: 50
      }
    ]
  },

  // =====================================================
  // 발송 스케줄 규칙
  // =====================================================
  schedulingRules: {
    sms: {
      frequency: 'bimonthly', // 월 2회
      bestDays: ['화', '목'],
      bestTime: '10:00',
      targetAudience: ['existing_customers', 'inquired_customers'],
      sequencing: {
        delay: 3, // 카카오톡과 3시간 차이
        order: 'first'
      }
    },
    
    kakao: {
      frequency: 'bimonthly',
      bestDays: ['화', '목'],
      bestTime: '13:00', // SMS 3시간 후
      targetAudience: ['channel_subscribers'],
      sequencing: {
        delay: 3,
        order: 'second'
      }
    },
    
    email: {
      frequency: 'weekly',
      bestDays: ['수'],
      bestTime: '09:00',
      targetAudience: ['email_subscribers'],
      sequencing: {
        independent: true
      }
    },
    
    social: {
      frequency: 'daily',
      bestTimes: {
        facebook: '19:00',
        instagram: '12:00',
        naver: '10:00'
      },
      automation: true
    }
  },

  // =====================================================
  // 성과 추적
  // =====================================================
  performanceTracking: {
    metrics: [
      'open_rate',
      'click_rate',
      'conversion_rate',
      'phone_calls',
      'revenue'
    ],
    
    goals: {
      sms: { clickRate: 15, conversionRate: 5 },
      kakao: { clickRate: 10, conversionRate: 3 },
      email: { openRate: 25, clickRate: 5 },
      social: { engagement: 3, reach: 1000 }
    }
  }
};

/**
 * 메시지 선택 함수
 */
export function selectMessage(
  channel: 'sms' | 'kakao' | 'email' | 'social',
  category?: string
): any {
  const eligibleMessages = HOOKING_MESSAGES.messages.filter(msg => 
    msg.channels.includes(channel) &&
    (!category || msg.category === category)
  );
  
  // 가장 적게 사용된 메시지 우선 선택
  return eligibleMessages.sort((a, b) => 
    (a.performance.clickRate || 0) - (b.performance.clickRate || 0)
  )[0];
}

/**
 * 채널별 메시지 포맷팅
 */
export function formatMessageForChannel(
  messageId: string,
  channel: 'sms' | 'kakao' | 'email' | 'social'
): any {
  const message = HOOKING_MESSAGES.messages.find(m => m.id === messageId);
  if (!message) return null;
  
  const template = HOOKING_MESSAGES.channelTemplates[channel];
  return template.template(message);
}

/**
 * A/B 테스트 메시지 선택
 */
export function getABTestMessage(userId: string, testGroup: string): string {
  const test = HOOKING_MESSAGES.abTesting.testGroups.find(g => g.name === testGroup);
  if (!test) return 'hook-01'; // 기본값
  
  // 유저 ID 기반 일관된 그룹 할당
  const hash = userId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return hash % 100 < test.splitRatio ? test.messageA : test.messageB;
}

export default HOOKING_MESSAGES;
