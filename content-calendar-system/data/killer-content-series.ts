// MASGOLF 킬러 콘텐츠 시리즈 데이터
// /data/killer-content-series.ts

import { ContentTemplate, ContentSeries, LeadMagnet } from '@/types';

/**
 * 시니어 골퍼 대상 킬러 콘텐츠 시리즈
 * 4개 주제별 시리즈로 구성된 전략적 콘텐츠
 */
export const KILLER_CONTENT_SERIES = {
  // =====================================================
  // 콘텐츠 전략 원칙
  // =====================================================
  strategy: {
    tone: 'professional_friendly', // 전문가의 친근한 조언
    ratio: {
      educational: 80, // 교육적 콘텐츠 80%
      softSell: 20    // 부드러운 판매 20%
    },
    trustBuilding: [
      '데이터와 통계 활용',
      '전문가 인용',
      '실제 사례',
      '검증된 정보'
    ],
    targetAudience: {
      age: '50-70대',
      gender: '남성',
      profile: '시니어 골퍼',
      painPoints: [
        '비거리 감소',
        '체력 저하',
        '장비 손실 우려',
        '사회적 인정 욕구'
      ]
    }
  },

  // =====================================================
  // 시리즈 1: 비거리 향상
  // =====================================================
  distanceImprovement: {
    id: 'series-distance',
    title: '환갑 넘은 나도 20미터 늘렸다',
    subtitle: '비거리 +20m 시니어 골퍼 비법',
    description: '50-60대 골퍼의 가장 큰 고민인 비거리 감소를 해결하는 실전 가이드',
    totalEpisodes: 5,
    publishingSchedule: 'weekly',
    channels: ['blog', 'email', 'kakao', 'sms'],
    
    episodes: [
      {
        number: 1,
        title: '드라이버 어드레스와 스윙 교정으로 비거리 늘리기',
        subtitle: '시니어를 위한 스윙 팁',
        type: 'technical',
        content: {
          intro: '나이가 들면서 비거리가 줄어드는 것은 자연스러운 현상입니다. 하지만 올바른 기술로 충분히 극복할 수 있습니다.',
          mainPoints: [
            '시니어에 맞는 어드레스 자세',
            '파워보다 정확성 중심의 스윙',
            '체중 이동의 중요성',
            '팔로우스루 개선'
          ],
          tips: [
            '볼 위치를 약간 앞쪽으로',
            '그립 압력 줄이기',
            '백스윙 크기보다 템포 중시'
          ],
          conclusion: '작은 변화가 큰 차이를 만듭니다.'
        },
        cta: {
          type: 'soft',
          message: '개인 스윙 진단이 필요하시면 연락주세요',
          action: 'inquiry'
        },
        estimatedReadTime: 8,
        keywords: ['시니어 골프', '비거리', '드라이버', '스윙']
      },
      {
        number: 2,
        title: '내게 맞는 클럽 선택: 비거리의 숨은 50%',
        subtitle: '샤프트와 로프트의 비밀',
        type: 'equipment',
        content: {
          intro: '장비가 실력의 전부는 아니지만, 올바른 장비는 당신의 잠재력을 최대로 끌어냅니다.',
          mainPoints: [
            '시니어에 맞는 샤프트 강도 선택법',
            '로프트 각도의 중요성',
            '그립 선택이 비거리에 미치는 영향',
            'MASGOLF 드라이버의 기술적 우위'
          ],
          dataPoints: [
            '50대 평균 드라이버 비거리: 215야드',
            '60대 평균 드라이버 비거리: 205야드',
            '적절한 피팅으로 평균 15-20야드 향상'
          ]
        },
        cta: {
          type: 'soft',
          message: '무료 피팅 상담 예약하기',
          action: 'fitting_reservation'
        },
        brandMention: {
          frequency: 2,
          context: 'technology_advantage'
        }
      },
      {
        number: 3,
        title: '연습장 100% 활용법: 나이에 맞는 파워훈련법',
        subtitle: '무리 없는 파워 증진 드릴',
        type: 'practice',
        content: {
          exercises: [
            '메디신볼 회전 운동',
            '저항밴드 스윙 드릴',
            '코어 강화 운동'
          ],
          warningNotes: [
            '무리한 운동은 부상 위험',
            '점진적으로 강도 높이기',
            '충분한 휴식 필수'
          ]
        }
      },
      {
        number: 4,
        title: '비거리가 줄면 코스를 이렇게 공략하세요',
        subtitle: '스마트한 코스 매니지먼트',
        type: 'strategy',
        content: {
          strategies: [
            '티샷 위치 선정법',
            '안전한 레이업 전략',
            '파3 홀 공략법'
          ],
          expertQuote: 'MASGOLF 전문 코치의 조언 포함'
        }
      },
      {
        number: 5,
        title: '고객 사례: 70대에도 200m 치는 비결',
        subtitle: '실제 성공 스토리',
        type: 'case_study',
        content: {
          customerProfile: {
            age: 72,
            name: '김OO 고객님',
            before: '180야드',
            after: '200야드'
          },
          story: '실제 MASGOLF 고객의 변화 과정',
          keyFactors: [
            '꾸준한 연습',
            '올바른 장비 선택',
            '전문가 코칭'
          ]
        },
        cta: {
          type: 'direct',
          message: '지금 전화주시면 1:1 비거리 상담 및 시타 예약을 도와드립니다',
          action: 'phone_call',
          urgency: 'medium'
        }
      }
    ],
    
    leadMagnet: {
      title: '비거리 향상 5부작 가이드 PDF',
      description: '이메일을 남기시면 전체 가이드를 무료로 보내드립니다',
      format: 'pdf',
      pages: 25,
      value: '29,000원 상당',
      deliveryMethod: 'email'
    },
    
    distribution: {
      blog: {
        format: 'long_form',
        wordCount: 2000,
        images: 5,
        frequency: 'weekly'
      },
      email: {
        format: 'newsletter',
        length: 'medium',
        personalization: true
      },
      kakao: {
        format: 'card_news',
        slides: 8,
        summary: true
      },
      sms: {
        format: 'teaser',
        length: 'short',
        linkIncluded: true
      }
    }
  },

  // =====================================================
  // 시리즈 2: 건강/체력 관리
  // =====================================================
  healthAndFitness: {
    id: 'series-health',
    title: '100세까지 라운딩!',
    subtitle: '시니어 골퍼를 위한 골프 건강 비법',
    description: '부상 없이 오래도록 골프를 즐기기 위한 건강 관리법',
    totalEpisodes: 4,
    publishingSchedule: 'biweekly',
    channels: ['blog', 'email', 'kakao'],
    
    episodes: [
      {
        number: 1,
        title: '라운드 전후 이것만은! - 시니어를 위한 스트레칭 7선',
        type: 'exercise',
        content: {
          stretches: [
            { name: '어깨 회전 스트레칭', duration: '30초', benefit: '스윙 유연성' },
            { name: '허리 비틀기', duration: '30초', benefit: '요통 예방' },
            { name: '종아리 스트레칭', duration: '30초', benefit: '경련 예방' },
            { name: '목 스트레칭', duration: '20초', benefit: '긴장 완화' },
            { name: '손목 스트레칭', duration: '20초', benefit: '그립 안정' },
            { name: '고관절 스트레칭', duration: '30초', benefit: '하체 안정' },
            { name: '햄스트링 스트레칭', duration: '30초', benefit: '파워 증진' }
          ],
          videoLink: 'youtube_demo',
          imageGuide: true
        },
        cta: {
          type: 'minimal',
          message: '건강한 스윙을 위한 피팅 서비스도 제공합니다'
        }
      },
      {
        number: 2,
        title: '필드에서 지치지 않는 체력 키우기',
        subtitle: '걷기 운동과 코어 강화',
        type: 'fitness',
        content: {
          dailyRoutine: [
            '아침 30분 걷기',
            '계단 오르기 10분',
            '플랭크 1분 3세트'
          ],
          nutritionTips: [
            '라운드 중 수분 섭취',
            '에너지바 준비',
            '전해질 보충'
          ]
        }
      },
      {
        number: 3,
        title: '허리 통증과 무릎 보호',
        subtitle: '골퍼 필수 재활 운동',
        type: 'rehabilitation',
        content: {
          commonProblems: [
            { issue: '요통', solution: '코어 강화 운동', prevention: '올바른 자세' },
            { issue: '무릎 통증', solution: '대퇴사두근 강화', prevention: '체중 관리' },
            { issue: '어깨 통증', solution: '회전근개 운동', prevention: '충분한 워밍업' }
          ],
          expertAdvice: '물리치료사 협업 콘텐츠'
        }
      },
      {
        number: 4,
        title: '시니어 골프 영양제 가이드',
        subtitle: '관절과 근력을 위한 보충제',
        type: 'nutrition',
        content: {
          supplements: [
            '글루코사민',
            '오메가3',
            '비타민D',
            'MSM'
          ],
          warnings: '의사 상담 후 복용 권장'
        }
      }
    ],
    
    cta: {
      primary: '건강 상담 문의',
      secondary: '전문가 의견 받기',
      tone: 'caring'
    }
  },

  // =====================================================
  // 시리즈 3: 손실 회피/보험
  // =====================================================
  lossAversion: {
    id: 'series-insurance',
    title: '소중한 골프 드라이버, 오래도록 함께하세요!',
    subtitle: '사기 당하지 않고 보상받고, 파손 걱정 없이 사용하는 법',
    description: '고가 장비 보호와 경제적 손실 예방 가이드',
    totalEpisodes: 3,
    publishingSchedule: 'monthly',
    channels: ['blog', 'email', 'pdf'],
    
    episodes: [
      {
        number: 1,
        title: '골프 드라이버 파손 보험 완벽 가이드',
        type: 'insurance',
        isPremium: true,
        content: {
          sections: [
            '시중 골프용품 보험 종류',
            '가입 시 주의사항',
            '과잉 영업 피하는 법',
            '실제 보상 사례',
            '드라이버 관리 팁'
          ],
          legalNotes: '보험약관 체크포인트',
          comparison: '주요 보험사 비교표'
        },
        format: 'pdf_guide',
        leadMagnet: {
          title: '드라이버 보험 가이드 PDF (무료)',
          value: '49,000원 상당',
          pages: 30,
          requiresEmail: true,
          requiresPhone: true,
          downloadImmediate: false
        }
      },
      {
        number: 2,
        title: '중고 골프채 거래, 사기 안 당하는 법',
        type: 'fraud_prevention',
        content: {
          checkList: [
            '정품 인증 확인법',
            '적정 가격 판단법',
            '안전 거래 방법',
            '사기 사례 모음'
          ],
          resources: '신뢰할 수 있는 거래 플랫폼 목록'
        }
      },
      {
        number: 3,
        title: '라운드 중 장비 분실 예방 체크리스트',
        type: 'loss_prevention',
        content: {
          checklist: [
            '카트 이동 시 확인사항',
            '클럽 개수 체크 습관',
            '분실 시 대처법',
            '보상 청구 절차'
          ],
          downloadable: true
        }
      }
    ],
    
    cta: {
      type: 'lead_generation',
      primary: '무료 가이드 받기',
      secondary: 'DM으로 문의하기',
      noHardSell: true
    }
  },

  // =====================================================
  // 시리즈 4: 사회적 지위/명예
  // =====================================================
  socialStatus: {
    id: 'series-prestige',
    title: '골프모임에서 존경받는 시니어의 비밀',
    subtitle: '품격과 리더십으로 인정받는 법',
    description: '골프를 통한 사회적 관계와 명예 구축',
    totalEpisodes: 3,
    publishingSchedule: 'bimonthly',
    channels: ['blog', 'newsletter'],
    
    episodes: [
      {
        number: 1,
        title: '에티켓이 실력이다',
        subtitle: '존경받는 골퍼들의 5가지 습관',
        type: 'etiquette',
        content: {
          habits: [
            '빠른 플레이 진행',
            '그린 보수 철저',
            '동반자 배려',
            '복장 단정',
            '매너 있는 대화'
          ],
          examples: '실제 존경받는 시니어 골퍼 사례'
        }
      },
      {
        number: 2,
        title: '장비로 보여주는 품격',
        subtitle: '시니어 골퍼의 클럽 선택 기준',
        type: 'philosophy',
        content: {
          stories: [
            '환경을 생각하는 선택',
            '오래 쓰는 철학',
            '장인정신의 가치',
            'MASGOLF의 혁신과 전통'
          ],
          brandStory: true
        }
      },
      {
        number: 3,
        title: '후배들이 따르는 리더십',
        subtitle: '골프로 맺은 우정과 신뢰',
        type: 'leadership',
        content: {
          realStories: [
            '멘토링 사례',
            '세대간 소통',
            '골프 모임 리더의 역할'
          ],
          customerTestimonial: true
        }
      }
    ],
    
    cta: {
      type: 'brand_building',
      message: 'MASGOLF는 당신의 자부심이 될 제품과 서비스를 연구합니다',
      action: 'none', // 직접적 CTA 없음
      tone: 'aspirational'
    }
  },

  // =====================================================
  // 리드 수집 전략
  // =====================================================
  leadGeneration: {
    strategies: [
      {
        type: 'content_upgrade',
        description: '블로그 글 중간 PDF 다운로드 제안',
        conversionRate: '15-20%'
      },
      {
        type: 'email_subscription',
        description: '시리즈 구독을 위한 이메일 등록',
        conversionRate: '10-15%'
      },
      {
        type: 'kakao_response',
        description: '카카오톡 답장으로 문의 유도',
        conversionRate: '8-12%'
      },
      {
        type: 'pdf_guide',
        description: '고가치 PDF 가이드 제공',
        conversionRate: '25-30%'
      }
    ],
    
    forms: {
      minimal: ['email'],
      standard: ['name', 'email', 'phone'],
      detailed: ['name', 'email', 'phone', 'age', 'handicap']
    },
    
    nurturing: {
      sequence: [
        { day: 0, action: 'welcome_email' },
        { day: 3, action: 'value_content' },
        { day: 7, action: 'soft_offer' },
        { day: 14, action: 'testimonial' },
        { day: 21, action: 'consultation_offer' }
      ]
    }
  },

  // =====================================================
  // 자동화 규칙
  // =====================================================
  automation: {
    triggers: [
      {
        event: 'pdf_download',
        action: 'start_email_sequence'
      },
      {
        event: 'series_complete',
        action: 'send_consultation_offer'
      },
      {
        event: 'high_engagement',
        action: 'personalized_outreach'
      }
    ],
    
    scoring: {
      pdf_download: 20,
      email_open: 5,
      link_click: 10,
      dm_inquiry: 30,
      phone_inquiry: 50
    }
  }
};

/**
 * 콘텐츠 생성 템플릿
 */
export function getContentTemplate(
  seriesId: string,
  episodeNumber: number
): any {
  const seriesMap: { [key: string]: any } = {
    'series-distance': KILLER_CONTENT_SERIES.distanceImprovement,
    'series-health': KILLER_CONTENT_SERIES.healthAndFitness,
    'series-insurance': KILLER_CONTENT_SERIES.lossAversion,
    'series-prestige': KILLER_CONTENT_SERIES.socialStatus
  };
  
  const series = seriesMap[seriesId];
  if (!series) return null;
  
  const episode = series.episodes.find((e: any) => e.number === episodeNumber);
  if (!episode) return null;
  
  return {
    title: episode.title,
    subtitle: episode.subtitle,
    content: episode.content,
    cta: episode.cta || series.cta,
    keywords: episode.keywords || [],
    estimatedReadTime: episode.estimatedReadTime || 10
  };
}

/**
 * 리드 매그넷 생성
 */
export function generateLeadMagnet(seriesId: string): any {
  const seriesMap: { [key: string]: any } = {
    'series-distance': KILLER_CONTENT_SERIES.distanceImprovement.leadMagnet,
    'series-insurance': KILLER_CONTENT_SERIES.lossAversion.episodes[0].leadMagnet
  };
  
  return seriesMap[seriesId] || null;
}

export default KILLER_CONTENT_SERIES;
