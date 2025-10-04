// MASSGOO Brand Tone and Manner Engine
// /lib/content-calendar/tone-and-manner.ts

import { ToneAndManner, VoiceAttributes, ContentType } from '@/types';

/**
 * MASSGOO 브랜드 톤앤매너 엔진
 * 브랜드 가이드라인에 따라 일관된 톤과 스타일을 유지합니다.
 */
export class MassgooToneAndManner {
  // =====================================================
  // 브랜드 개성 정의
  // =====================================================
  private static readonly brandPersonality = {
    primary: ['전문적', '신뢰감', '프리미엄'],
    secondary: ['혁신적', '친근한', '열정적'],
    values: ['품질', '기술력', '고객중심', '장인정신']
  };

  // =====================================================
  // 타겟별 보이스 가이드라인
  // =====================================================
  private static readonly voiceGuidelines = {
    시니어_타겟: {
      tone: '존중과 격려',
      language: '쉽고 명확한 설명',
      approach: '경험과 지혜 인정',
      examples: [
        '당신의 경험이 만드는 완벽한 스윙',
        '나이는 숫자, 비거리는 실력',
        '인생 2막, 골프로 더 젊게',
        '오랜 경험이 만나는 최신 기술',
        '당신의 골프 인생, 새로운 전성기를 맞이하세요'
      ],
      avoidPhrases: [
        '노후', '쇠퇴', '한계', '늙은',
        '예전만 못한', '기력이 떨어지는'
      ]
    },
    
    중장년_타겟: {
      tone: '도전과 성취',
      language: '전문적이면서 접근 가능한',
      approach: '목표 달성 지원',
      examples: [
        '프로급 스윙을 위한 선택',
        '당신의 베스트 스코어를 경신하세요',
        '주말 골퍼에서 싱글 핸디캐퍼로',
        '비즈니스 골프의 품격을 높이다'
      ]
    },
    
    기술_설명: {
      tone: '전문적이지만 이해하기 쉬운',
      language: '기술 용어와 일상어의 균형',
      approach: '과학적 근거 + 실제 효과',
      examples: [
        'JFE 티타늄이 만드는 25M의 차이',
        'NGS 샤프트, 일본 장인정신의 결정체',
        '0.1mm의 정밀도가 만드는 완벽한 타구감',
        '특허받은 무게중심 설계로 미스샷 최소화'
      ]
    }
  };

  // =====================================================
  // 콘텐츠 유형별 포뮬러
  // =====================================================
  private static readonly contentFormulas = {
    blog_post: {
      structure: ['훅', '문제인식', '솔루션', '증거', 'CTA'],
      idealLength: { min: 1500, max: 2000, unit: '자' },
      visualRatio: 0.35, // 35% 이미지/비디오
      paragraphLength: { min: 3, max: 5, unit: '문장' },
      headingFrequency: 300, // 300자마다 소제목
      components: {
        introduction: '흥미로운 질문이나 통계로 시작',
        body: '구체적 사례와 데이터 포함',
        conclusion: '행동 유도와 다음 단계 제시'
      }
    },
    
    social_post: {
      structure: ['어텐션', '메시지', '해시태그'],
      idealLength: { min: 100, max: 150, unit: '자' },
      emojiUsage: '절제된 사용 (1-2개)',
      hashtagCount: { min: 3, max: 5 },
      examples: {
        instagram: '비주얼 중심 + 짧은 캡션',
        facebook: '스토리텔링 + 커뮤니티 참여',
        youtube: '키워드 최적화 + 상세 설명'
      }
    },
    
    email: {
      structure: ['제목', '인사', '본문', 'CTA', '서명'],
      subjectLineLength: { min: 20, max: 40, unit: '자' },
      previewTextLength: { min: 40, max: 90, unit: '자' },
      personalization: ['이름', '구매이력', '관심사항'],
      ctaCount: { primary: 1, secondary: 2 }
    },
    
    funnel: {
      structure: ['히어로', '문제제시', '솔루션', '증명', '혜택', 'FAQ', 'CTA'],
      scrollDepth: 7, // 평균 7개 섹션
      ctaFrequency: 2, // 2섹션마다 CTA
      urgencyElements: ['한정수량', '기간한정', '특별혜택'],
      trustElements: ['고객후기', '인증마크', '보증정책']
    }
  };

  // =====================================================
  // 금지 표현 및 파워 워드
  // =====================================================
  private static readonly vocabulary = {
    forbiddenExpressions: [
      '노인', '늙은', '쇠퇴', '한계',
      '싸구려', '저렴한', '복제품', '카피',
      '대충', '그냥', '아무거나', '별로',
      '실패', '포기', '불가능', '어려운'
    ],
    
    powerWords: [
      '프리미엄', '혁신', '비거리', '파워',
      '장인정신', '일본산', '특허', '검증된',
      '전문가', '마스터', '프로급', '최상급',
      '독점', '한정판', '맞춤형', '과학적',
      '획기적', '압도적', '완벽한', '최적화'
    ],
    
    emotionalTriggers: [
      '자신감', '성취감', '자부심', '만족',
      '즐거움', '행복', '도전', '열정',
      '젊음', '활력', '에너지', '성공'
    ],
    
    technicalTerms: {
      acceptable: [
        '티타늄 페이스', '무게중심', '스윗스팟',
        '탄성계수', '반발력', '토크', '플렉스'
      ],
      needsExplanation: [
        'MOI (관성모멘트)',
        'COR (반발계수)',
        'CG (무게중심)',
        'Gear Effect (기어효과)'
      ]
    }
  };

  // =====================================================
  // 시즌별 테마 매핑
  // =====================================================
  private static readonly seasonalThemes = {
    spring: {
      keywords: ['새시즌', '시작', '도전', '준비', '활력'],
      emotions: ['기대', '희망', '설렘', '의욕'],
      campaigns: ['장비 업그레이드', '스윙 점검', '시즌 목표']
    },
    summer: {
      keywords: ['더위', '체력', '지구력', '쿨링', '휴가'],
      emotions: ['열정', '활기', '여유', '즐거움'],
      campaigns: ['여름 특별전', '휴가철 이벤트', '쿨링 제품']
    },
    autumn: {
      keywords: ['최적', '절정', '수확', '성과', '마스터'],
      emotions: ['성취', '만족', '자부심', '감사'],
      campaigns: ['시즌 결산', '베스트 상품', '고객 감사']
    },
    winter: {
      keywords: ['준비', '연습', '분석', '계획', '업그레이드'],
      emotions: ['집중', '성찰', '계획', '기대'],
      campaigns: ['연말 특가', '새해 준비', '실내 연습']
    }
  };

  // =====================================================
  // 공개 메서드
  // =====================================================
  
  /**
   * 콘텐츠에 브랜드 톤앤매너 적용
   */
  public static applyToneAndManner(
    content: string,
    contentType: ContentType,
    targetAudience: string = '시니어_타겟'
  ): string {
    let processed = content;
    
    // 1. 금지 표현 체크 및 대체
    processed = this.replaceForbiddenWords(processed);
    
    // 2. 파워 워드 강조
    processed = this.emphasizePowerWords(processed);
    
    // 3. 타겟별 톤 조정
    processed = this.adjustToneForTarget(processed, targetAudience);
    
    // 4. 콘텐츠 타입별 구조 최적화
    processed = this.optimizeStructure(processed, contentType);
    
    return processed;
  }

  /**
   * 콘텐츠 톤앤매너 점수 평가
   */
  public static evaluateToneScore(content: string): {
    score: number;
    issues: string[];
    suggestions: string[];
  } {
    const issues: string[] = [];
    const suggestions: string[] = [];
    let score = 100;
    
    // 금지 표현 체크
    this.vocabulary.forbiddenExpressions.forEach(word => {
      if (content.includes(word)) {
        issues.push(`금지 표현 발견: "${word}"`);
        score -= 10;
      }
    });
    
    // 파워 워드 사용 체크
    const powerWordCount = this.vocabulary.powerWords.filter(
      word => content.includes(word)
    ).length;
    
    if (powerWordCount < 3) {
      suggestions.push('파워 워드를 더 많이 사용하세요');
      score -= 5;
    }
    
    // 감정 트리거 체크
    const emotionalCount = this.vocabulary.emotionalTriggers.filter(
      word => content.includes(word)
    ).length;
    
    if (emotionalCount < 2) {
      suggestions.push('감정적 연결을 강화하세요');
      score -= 5;
    }
    
    return {
      score: Math.max(0, score),
      issues,
      suggestions
    };
  }

  /**
   * 시즌별 콘텐츠 테마 제안
   */
  public static getSeasonalContentSuggestions(
    month: number
  ): {
    season: string;
    themes: string[];
    keywords: string[];
    campaigns: string[];
  } {
    const seasonMap: { [key: number]: keyof typeof this.seasonalThemes } = {
      3: 'spring', 4: 'spring', 5: 'spring',
      6: 'summer', 7: 'summer', 8: 'summer',
      9: 'autumn', 10: 'autumn', 11: 'autumn',
      12: 'winter', 1: 'winter', 2: 'winter'
    };
    
    const season = seasonMap[month];
    const themeData = this.seasonalThemes[season];
    
    return {
      season,
      themes: this.generateThemes(season),
      keywords: themeData.keywords,
      campaigns: themeData.campaigns
    };
  }

  /**
   * AI 프롬프트 생성을 위한 가이드라인
   */
  public static generateAIPromptGuidelines(
    contentType: ContentType,
    topic: string,
    targetAudience: string = '시니어_타겟'
  ): string {
    const guidelines = this.voiceGuidelines[targetAudience as keyof typeof this.voiceGuidelines];
    const formula = this.contentFormulas[contentType === 'blog' ? 'blog_post' : contentType as keyof typeof this.contentFormulas];
    
    return `
MASSGOO 브랜드 콘텐츠 작성 가이드라인:

[브랜드 톤]
- 톤: ${guidelines?.tone || '전문적이고 신뢰감 있는'}
- 언어: ${guidelines?.language || '쉽고 명확한'}
- 접근법: ${guidelines?.approach || '고객 중심적'}

[구조]
${formula?.structure.join(' → ') || '도입 → 본문 → 결론'}

[필수 포함 요소]
- 파워 워드: ${this.vocabulary.powerWords.slice(0, 5).join(', ')}
- 감정 트리거: ${this.vocabulary.emotionalTriggers.slice(0, 3).join(', ')}

[금지 표현]
절대 사용하지 마세요: ${this.vocabulary.forbiddenExpressions.slice(0, 5).join(', ')}

[주제]
${topic}

[타겟 오디언스]
${targetAudience}

위 가이드라인에 따라 MASSGOO 브랜드에 적합한 콘텐츠를 작성해주세요.
    `.trim();
  }

  // =====================================================
  // 비공개 헬퍼 메서드
  // =====================================================
  
  private static replaceForbiddenWords(content: string): string {
    const replacements: { [key: string]: string } = {
      '노인': '시니어 골퍼',
      '늙은': '경험 많은',
      '쇠퇴': '변화',
      '한계': '도전',
      '싸구려': '가성비',
      '저렴한': '합리적인',
      '복제품': '대안 제품',
      '실패': '학습 기회',
      '포기': '재도전',
      '불가능': '도전적인',
      '어려운': '흥미로운'
    };
    
    let processed = content;
    Object.entries(replacements).forEach(([forbidden, replacement]) => {
      const regex = new RegExp(forbidden, 'gi');
      processed = processed.replace(regex, replacement);
    });
    
    return processed;
  }

  private static emphasizePowerWords(content: string): string {
    // 실제 구현에서는 더 정교한 강조 로직 필요
    return content;
  }

  private static adjustToneForTarget(
    content: string,
    targetAudience: string
  ): string {
    // 타겟별 톤 조정 로직
    return content;
  }

  private static optimizeStructure(
    content: string,
    contentType: ContentType
  ): string {
    // 콘텐츠 타입별 구조 최적화
    return content;
  }

  private static generateThemes(season: string): string[] {
    const themes: { [key: string]: string[] } = {
      spring: [
        '새 시즌을 위한 완벽한 준비',
        '봄맞이 스윙 체크리스트',
        '올해의 골프 목표 세우기'
      ],
      summer: [
        '무더위를 이기는 골프 전략',
        '여름철 체력 관리법',
        '휴가지에서 즐기는 골프'
      ],
      autumn: [
        '시즌 최고의 스코어 도전',
        '가을 골프의 매력',
        '연말 대회 준비 가이드'
      ],
      winter: [
        '겨울철 실내 연습법',
        '다음 시즌 준비 전략',
        '장비 점검과 업그레이드'
      ]
    };
    
    return themes[season] || [];
  }
}

export default MassgooToneAndManner;
