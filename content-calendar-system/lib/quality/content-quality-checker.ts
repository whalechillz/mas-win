// Content Quality Checker
// /lib/quality/content-quality-checker.ts

import { 
  ContentCalendarItem,
  ContentType,
  ValidationError 
} from '@/types';
import { MassgooToneAndManner } from '@/lib/content-calendar/tone-and-manner';

export interface QualityCheckResult {
  score: number;
  issues: QualityIssue[];
  suggestions: string[];
  passed: boolean;
  details: QualityCheckDetails;
}

export interface QualityIssue {
  severity: 'high' | 'medium' | 'low';
  category: string;
  message: string;
  location?: string;
}

export interface QualityCheckDetails {
  brandCompliance: CheckDetail;
  toneConsistency: CheckDetail;
  seoOptimization: CheckDetail;
  readability: CheckDetail;
  factAccuracy: CheckDetail;
  legalCompliance: CheckDetail;
}

export interface CheckDetail {
  score: number;
  passed: boolean;
  issues: string[];
  suggestions: string[];
}

/**
 * 콘텐츠 품질 관리 시스템
 * 자동 품질 검증 및 개선 제안
 */
export class ContentQualityChecker {
  private readonly minimumPassScore = 70;
  private readonly brandGuidelines: any;

  constructor() {
    this.brandGuidelines = this.loadBrandGuidelines();
  }

  // =====================================================
  // 종합 품질 검사
  // =====================================================

  /**
   * 콘텐츠 종합 품질 검사
   */
  async checkContent(content: ContentCalendarItem): Promise<QualityCheckResult> {
    console.log(`🔍 콘텐츠 품질 검사 시작: ${content.title}`);

    // 각 항목별 검사 실행
    const [
      brandCompliance,
      toneConsistency,
      seoOptimization,
      readability,
      factAccuracy,
      legalCompliance
    ] = await Promise.all([
      this.checkBrandGuidelines(content),
      this.checkToneAndManner(content),
      this.checkSEO(content),
      this.checkReadability(content),
      this.checkFactAccuracy(content),
      this.checkLegalCompliance(content)
    ]);

    // 종합 결과 집계
    const details: QualityCheckDetails = {
      brandCompliance,
      toneConsistency,
      seoOptimization,
      readability,
      factAccuracy,
      legalCompliance
    };

    // 종합 점수 계산
    const totalScore = this.calculateTotalScore(details);
    
    // 이슈 집계
    const allIssues = this.aggregateIssues(details);
    
    // 제안사항 생성
    const suggestions = this.generateSuggestions(details, content.contentType);

    const result: QualityCheckResult = {
      score: totalScore,
      issues: allIssues,
      suggestions,
      passed: totalScore >= this.minimumPassScore,
      details
    };

    console.log(`✅ 품질 검사 완료 - 점수: ${totalScore}`);
    
    return result;
  }

  // =====================================================
  // 개별 품질 검사 메서드
  // =====================================================

  /**
   * 브랜드 가이드라인 준수 검사
   */
  private async checkBrandGuidelines(content: ContentCalendarItem): Promise<CheckDetail> {
    const issues: string[] = [];
    const suggestions: string[] = [];
    let score = 100;

    const contentText = content.contentBody || content.title + ' ' + (content.subtitle || '');

    // 금지 표현 검사
    const forbiddenWords = [
      '노인', '늙은', '쇠퇴', '한계',
      '싸구려', '저렴한', '복제품'
    ];

    forbiddenWords.forEach(word => {
      if (contentText.includes(word)) {
        issues.push(`금지된 표현 발견: "${word}"`);
        score -= 15;
      }
    });

    // 파워 워드 사용 검사
    const powerWords = [
      '프리미엄', '혁신', '비거리', '파워',
      '장인정신', '일본산', '특허', '검증된'
    ];

    const powerWordCount = powerWords.filter(word => 
      contentText.includes(word)
    ).length;

    if (powerWordCount < 2) {
      suggestions.push('브랜드 파워 워드를 더 많이 사용하세요');
      score -= 10;
    }

    // 브랜드 일관성 검사
    if (!contentText.includes('MASSGOO') && !contentText.includes('마스구')) {
      issues.push('브랜드명이 언급되지 않았습니다');
      score -= 10;
    }

    // 타겟 오디언스 적합성
    const seniorKeywords = ['시니어', '경험', '프리미엄', '품격'];
    const seniorKeywordCount = seniorKeywords.filter(word => 
      contentText.includes(word)
    ).length;

    if (seniorKeywordCount < 1) {
      suggestions.push('시니어 타겟에 맞는 키워드를 추가하세요');
      score -= 5;
    }

    return {
      score: Math.max(0, score),
      passed: score >= 70,
      issues,
      suggestions
    };
  }

  /**
   * 톤앤매너 일관성 검사
   */
  private async checkToneAndManner(content: ContentCalendarItem): Promise<CheckDetail> {
    const issues: string[] = [];
    const suggestions: string[] = [];
    
    // MassgooToneAndManner 클래스 활용
    const toneEvaluation = MassgooToneAndManner.evaluateToneScore(
      content.contentBody || content.title
    );

    let score = toneEvaluation.score;

    // 톤 일관성 체크
    if (content.toneAndManner) {
      const expectedTone = content.toneAndManner.tone;
      const contentTone = this.detectContentTone(content.contentBody || '');

      if (expectedTone !== contentTone) {
        issues.push(`톤 불일치: 기대(${expectedTone}) vs 실제(${contentTone})`);
        score -= 10;
      }
    }

    // 감정적 연결 검사
    const emotionalWords = ['자신감', '성취', '즐거움', '만족', '도전'];
    const emotionalCount = emotionalWords.filter(word => 
      (content.contentBody || '').includes(word)
    ).length;

    if (emotionalCount < 2) {
      suggestions.push('감정적 연결을 강화하는 표현을 추가하세요');
      score -= 5;
    }

    // 전문성 검사
    if (content.contentType === 'blog' || content.contentType === 'email') {
      const technicalTerms = this.countTechnicalTerms(content.contentBody || '');
      if (technicalTerms < 3) {
        suggestions.push('전문적인 기술 용어를 적절히 사용하세요');
        score -= 5;
      }
    }

    return {
      score: Math.max(0, score),
      passed: score >= 70,
      issues: [...issues, ...toneEvaluation.issues],
      suggestions: [...suggestions, ...toneEvaluation.suggestions]
    };
  }

  /**
   * SEO 최적화 검사
   */
  private async checkSEO(content: ContentCalendarItem): Promise<CheckDetail> {
    const issues: string[] = [];
    const suggestions: string[] = [];
    let score = 100;

    // 제목 길이 검사
    if (content.title.length > 60) {
      issues.push('제목이 너무 깁니다 (60자 초과)');
      score -= 10;
    } else if (content.title.length < 30) {
      suggestions.push('더 상세한 제목을 사용하세요 (30자 이상 권장)');
      score -= 5;
    }

    // 메타 설명 검사
    if (content.seoMeta?.description) {
      const descLength = content.seoMeta.description.length;
      if (descLength > 160) {
        issues.push('메타 설명이 너무 깁니다 (160자 초과)');
        score -= 10;
      } else if (descLength < 120) {
        suggestions.push('메타 설명을 더 상세하게 작성하세요');
        score -= 5;
      }
    } else {
      issues.push('메타 설명이 없습니다');
      score -= 15;
    }

    // 키워드 밀도 검사
    if (content.keywords && content.contentBody) {
      const keywordDensity = this.calculateKeywordDensity(
        content.contentBody,
        content.keywords
      );

      if (keywordDensity < 1) {
        suggestions.push('키워드 밀도가 너무 낮습니다 (1% 이상 권장)');
        score -= 10;
      } else if (keywordDensity > 3) {
        issues.push('키워드 밀도가 너무 높습니다 (3% 이하 권장)');
        score -= 10;
      }
    }

    // 내부 링크 검사
    const internalLinks = this.countInternalLinks(content.contentBody || '');
    if (internalLinks === 0 && content.contentType === 'blog') {
      suggestions.push('내부 링크를 추가하여 사이트 내 체류시간을 늘리세요');
      score -= 5;
    }

    // 이미지 alt 텍스트 검사
    if (content.contentHtml) {
      const missingAltCount = this.checkImageAltTexts(content.contentHtml);
      if (missingAltCount > 0) {
        issues.push(`${missingAltCount}개 이미지에 alt 텍스트가 없습니다`);
        score -= missingAltCount * 5;
      }
    }

    return {
      score: Math.max(0, score),
      passed: score >= 70,
      issues,
      suggestions
    };
  }

  /**
   * 가독성 검사
   */
  private async checkReadability(content: ContentCalendarItem): Promise<CheckDetail> {
    const issues: string[] = [];
    const suggestions: string[] = [];
    let score = 100;

    if (!content.contentBody) {
      return {
        score: 100,
        passed: true,
        issues: [],
        suggestions: []
      };
    }

    // 문장 길이 검사
    const sentences = content.contentBody.split(/[.!?]+/);
    const avgSentenceLength = sentences.reduce((sum, s) => sum + s.length, 0) / sentences.length;

    if (avgSentenceLength > 100) {
      issues.push('문장이 너무 깁니다');
      score -= 15;
    }

    // 단락 길이 검사
    const paragraphs = content.contentBody.split('\n\n');
    const longParagraphs = paragraphs.filter(p => p.length > 500).length;

    if (longParagraphs > 0) {
      suggestions.push(`${longParagraphs}개 단락이 너무 깁니다 (500자 이하 권장)`);
      score -= longParagraphs * 5;
    }

    // 부제목 사용 검사
    if (content.contentType === 'blog' && content.contentBody.length > 1000) {
      const headingCount = (content.contentBody.match(/#{1,3}\s/g) || []).length;
      if (headingCount < 3) {
        suggestions.push('더 많은 부제목을 사용하여 구조를 개선하세요');
        score -= 10;
      }
    }

    // 복잡한 단어 사용 검사
    const complexWords = this.countComplexWords(content.contentBody);
    if (complexWords > 10) {
      suggestions.push('더 쉬운 단어를 사용하여 가독성을 높이세요');
      score -= 10;
    }

    // 능동태 vs 수동태 검사
    const passiveVoiceRatio = this.calculatePassiveVoiceRatio(content.contentBody);
    if (passiveVoiceRatio > 30) {
      suggestions.push('능동태를 더 많이 사용하세요');
      score -= 5;
    }

    return {
      score: Math.max(0, score),
      passed: score >= 70,
      issues,
      suggestions
    };
  }

  /**
   * 사실 정확성 검사
   */
  private async checkFactAccuracy(content: ContentCalendarItem): Promise<CheckDetail> {
    const issues: string[] = [];
    const suggestions: string[] = [];
    let score = 100;

    // 숫자 데이터 검증
    const numbers = this.extractNumbers(content.contentBody || '');
    for (const num of numbers) {
      if (num.value > 1000000 && !num.hasSource) {
        suggestions.push(`큰 숫자(${num.value})에 대한 출처를 명시하세요`);
        score -= 5;
      }
    }

    // 날짜 유효성 검사
    const dates = this.extractDates(content.contentBody || '');
    for (const date of dates) {
      if (!this.isValidDate(date)) {
        issues.push(`유효하지 않은 날짜: ${date}`);
        score -= 10;
      }
    }

    // 제품 사양 정확성
    const productSpecs = this.extractProductSpecs(content.contentBody || '');
    for (const spec of productSpecs) {
      if (!this.validateProductSpec(spec)) {
        issues.push(`검증되지 않은 제품 사양: ${spec.name}`);
        score -= 10;
      }
    }

    // 인용문 검증
    const quotes = this.extractQuotes(content.contentBody || '');
    for (const quote of quotes) {
      if (!quote.hasAttribution) {
        suggestions.push('인용문에 출처를 명시하세요');
        score -= 5;
      }
    }

    return {
      score: Math.max(0, score),
      passed: score >= 70,
      issues,
      suggestions
    };
  }

  /**
   * 법적 준수사항 검사
   */
  private async checkLegalCompliance(content: ContentCalendarItem): Promise<CheckDetail> {
    const issues: string[] = [];
    const suggestions: string[] = [];
    let score = 100;

    // 의료/건강 관련 주장 검사
    const healthClaims = [
      '치료', '완치', '의학적', '처방', '진단'
    ];

    healthClaims.forEach(claim => {
      if ((content.contentBody || '').includes(claim)) {
        issues.push(`의료 관련 주장 발견: "${claim}" - 법적 검토 필요`);
        score -= 20;
      }
    });

    // 과장 광고 검사
    const exaggerations = [
      '최고', '유일한', '1등', '독점', '완벽한'
    ];

    let exaggerationCount = 0;
    exaggerations.forEach(word => {
      if ((content.contentBody || '').includes(word)) {
        exaggerationCount++;
      }
    });

    if (exaggerationCount > 2) {
      issues.push('과장 광고 표현이 너무 많습니다');
      score -= 15;
    }

    // 저작권 검사
    if (content.contentHtml) {
      const externalImages = this.checkExternalImages(content.contentHtml);
      if (externalImages.length > 0) {
        suggestions.push('외부 이미지 사용 시 저작권을 확인하세요');
        score -= 10;
      }
    }

    // 개인정보 보호
    const personalInfoPatterns = [
      /\d{6}-\d{7}/, // 주민등록번호
      /\d{3}-\d{3,4}-\d{4}/, // 전화번호
      /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/ // 이메일
    ];

    personalInfoPatterns.forEach(pattern => {
      if (pattern.test(content.contentBody || '')) {
        issues.push('개인정보가 포함되어 있을 수 있습니다');
        score -= 20;
      }
    });

    // 면책 조항 검사
    if (content.contentType === 'funnel' || content.contentType === 'email') {
      if (!(content.contentBody || '').includes('면책') && 
          !(content.contentBody || '').includes('약관')) {
        suggestions.push('면책 조항 또는 이용약관 링크를 추가하세요');
        score -= 5;
      }
    }

    return {
      score: Math.max(0, score),
      passed: score >= 70,
      issues,
      suggestions
    };
  }

  // =====================================================
  // 헬퍼 메서드
  // =====================================================

  /**
   * 브랜드 가이드라인 로드
   */
  private loadBrandGuidelines(): any {
    // 실제 구현에서는 데이터베이스에서 로드
    return {
      forbiddenWords: ['노인', '늙은', '쇠퇴'],
      powerWords: ['프리미엄', '혁신', '비거리'],
      requiredElements: ['브랜드명', 'CTA', '연락처']
    };
  }

  /**
   * 종합 점수 계산
   */
  private calculateTotalScore(details: QualityCheckDetails): number {
    const weights = {
      brandCompliance: 0.25,
      toneConsistency: 0.20,
      seoOptimization: 0.20,
      readability: 0.15,
      factAccuracy: 0.10,
      legalCompliance: 0.10
    };

    let totalScore = 0;
    
    totalScore += details.brandCompliance.score * weights.brandCompliance;
    totalScore += details.toneConsistency.score * weights.toneConsistency;
    totalScore += details.seoOptimization.score * weights.seoOptimization;
    totalScore += details.readability.score * weights.readability;
    totalScore += details.factAccuracy.score * weights.factAccuracy;
    totalScore += details.legalCompliance.score * weights.legalCompliance;

    return Math.round(totalScore);
  }

  /**
   * 이슈 집계
   */
  private aggregateIssues(details: QualityCheckDetails): QualityIssue[] {
    const issues: QualityIssue[] = [];

    const categories = [
      { name: 'brandCompliance', label: '브랜드 준수' },
      { name: 'toneConsistency', label: '톤 일관성' },
      { name: 'seoOptimization', label: 'SEO' },
      { name: 'readability', label: '가독성' },
      { name: 'factAccuracy', label: '정확성' },
      { name: 'legalCompliance', label: '법적 준수' }
    ];

    categories.forEach(({ name, label }) => {
      const detail = details[name as keyof QualityCheckDetails];
      detail.issues.forEach(issue => {
        issues.push({
          severity: detail.score < 50 ? 'high' : detail.score < 70 ? 'medium' : 'low',
          category: label,
          message: issue
        });
      });
    });

    return issues;
  }

  /**
   * 제안사항 생성
   */
  private generateSuggestions(
    details: QualityCheckDetails, 
    contentType: ContentType
  ): string[] {
    const suggestions: string[] = [];

    // 각 카테고리별 제안사항 수집
    Object.values(details).forEach(detail => {
      suggestions.push(...detail.suggestions);
    });

    // 콘텐츠 타입별 추가 제안
    switch (contentType) {
      case 'blog':
        suggestions.push('블로그 포스트는 1500-2000자가 적절합니다');
        break;
      case 'social':
        suggestions.push('소셜 미디어는 시각적 요소를 포함하세요');
        break;
      case 'email':
        suggestions.push('이메일 제목은 호기심을 자극해야 합니다');
        break;
      case 'funnel':
        suggestions.push('퍼널 페이지는 명확한 CTA가 필요합니다');
        break;
    }

    // 중복 제거 및 정렬
    return [...new Set(suggestions)].slice(0, 10);
  }

  /**
   * 콘텐츠 톤 감지
   */
  private detectContentTone(content: string): string {
    // 간단한 톤 감지 로직
    if (content.includes('전문') || content.includes('기술')) {
      return 'professional';
    }
    if (content.includes('친구') || content.includes('편안')) {
      return 'casual';
    }
    if (content.includes('격려') || content.includes('응원')) {
      return 'encouraging';
    }
    return 'neutral';
  }

  /**
   * 기술 용어 카운트
   */
  private countTechnicalTerms(content: string): number {
    const technicalTerms = [
      '티타늄', '탄성계수', '무게중심', '스윗스팟',
      '토크', '플렉스', 'MOI', 'COR', '반발력'
    ];
    
    return technicalTerms.filter(term => content.includes(term)).length;
  }

  /**
   * 키워드 밀도 계산
   */
  private calculateKeywordDensity(content: string, keywords: string[]): number {
    const totalWords = content.split(/\s+/).length;
    let keywordCount = 0;
    
    keywords.forEach(keyword => {
      const regex = new RegExp(keyword, 'gi');
      const matches = content.match(regex);
      keywordCount += matches ? matches.length : 0;
    });
    
    return (keywordCount / totalWords) * 100;
  }

  /**
   * 내부 링크 카운트
   */
  private countInternalLinks(content: string): number {
    const internalLinkPattern = /href=["'](\/[^"']*|https?:\/\/massgoo\.com[^"']*)/gi;
    const matches = content.match(internalLinkPattern);
    return matches ? matches.length : 0;
  }

  /**
   * 이미지 alt 텍스트 검사
   */
  private checkImageAltTexts(html: string): number {
    const imgPattern = /<img[^>]*>/gi;
    const images = html.match(imgPattern) || [];
    let missingAlt = 0;
    
    images.forEach(img => {
      if (!img.includes('alt=')) {
        missingAlt++;
      }
    });
    
    return missingAlt;
  }

  /**
   * 복잡한 단어 카운트
   */
  private countComplexWords(content: string): number {
    const words = content.split(/\s+/);
    const complexWords = words.filter(word => word.length > 10);
    return complexWords.length;
  }

  /**
   * 수동태 비율 계산
   */
  private calculatePassiveVoiceRatio(content: string): number {
    // 간단한 한국어 수동태 감지
    const passivePatterns = ['되다', '되어', '되는', '받다', '당하다'];
    const sentences = content.split(/[.!?]+/);
    let passiveCount = 0;
    
    sentences.forEach(sentence => {
      passivePatterns.forEach(pattern => {
        if (sentence.includes(pattern)) {
          passiveCount++;
          return;
        }
      });
    });
    
    return (passiveCount / sentences.length) * 100;
  }

  /**
   * 숫자 추출
   */
  private extractNumbers(content: string): Array<{ value: number; hasSource: boolean }> {
    const numberPattern = /\d+/g;
    const matches = content.match(numberPattern) || [];
    
    return matches.map(match => ({
      value: parseInt(match),
      hasSource: content.includes(`출처`) || content.includes(`*`)
    }));
  }

  /**
   * 날짜 추출
   */
  private extractDates(content: string): string[] {
    const datePattern = /\d{4}년\s*\d{1,2}월\s*\d{1,2}일/g;
    return content.match(datePattern) || [];
  }

  /**
   * 날짜 유효성 검사
   */
  private isValidDate(dateStr: string): boolean {
    // 간단한 날짜 유효성 검사
    const parts = dateStr.match(/\d+/g);
    if (!parts || parts.length !== 3) return false;
    
    const year = parseInt(parts[0]);
    const month = parseInt(parts[1]);
    const day = parseInt(parts[2]);
    
    if (month < 1 || month > 12) return false;
    if (day < 1 || day > 31) return false;
    
    return true;
  }

  /**
   * 제품 사양 추출
   */
  private extractProductSpecs(content: string): Array<{ name: string; value: string }> {
    // 간단한 제품 사양 패턴 매칭
    const specs: Array<{ name: string; value: string }> = [];
    const specPatterns = [
      /로프트각:\s*(\d+)/,
      /샤프트:\s*([^\s]+)/,
      /무게:\s*(\d+g)/
    ];
    
    specPatterns.forEach(pattern => {
      const match = content.match(pattern);
      if (match) {
        specs.push({
          name: match[0].split(':')[0],
          value: match[1]
        });
      }
    });
    
    return specs;
  }

  /**
   * 제품 사양 검증
   */
  private validateProductSpec(spec: { name: string; value: string }): boolean {
    // 실제 구현에서는 데이터베이스와 대조
    return true;
  }

  /**
   * 인용문 추출
   */
  private extractQuotes(content: string): Array<{ text: string; hasAttribution: boolean }> {
    const quotePattern = /"([^"]+)"/g;
    const quotes: Array<{ text: string; hasAttribution: boolean }> = [];
    
    let match;
    while ((match = quotePattern.exec(content)) !== null) {
      quotes.push({
        text: match[1],
        hasAttribution: content.includes('말했다') || content.includes('전했다')
      });
    }
    
    return quotes;
  }

  /**
   * 외부 이미지 검사
   */
  private checkExternalImages(html: string): string[] {
    const imgPattern = /<img[^>]+src=["']([^"']+)/gi;
    const externalImages: string[] = [];
    
    let match;
    while ((match = imgPattern.exec(html)) !== null) {
      const src = match[1];
      if (!src.startsWith('/') && !src.includes('massgoo.com')) {
        externalImages.push(src);
      }
    }
    
    return externalImages;
  }
}

export default ContentQualityChecker;
