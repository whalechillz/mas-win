// Content Performance Analyzer
// /lib/analytics/content-performance.ts

import { 
  ContentPerformance,
  PerformanceMetrics,
  PerformanceAnalysis,
  PerformanceInsight,
  ContentCalendarItem
} from '@/types';

/**
 * 콘텐츠 성과 분석 클래스
 * 실시간 성과 추적 및 인사이트 도출
 */
export class ContentPerformanceAnalyzer {
  private supabaseUrl: string;
  private supabaseKey: string;
  private ga4MeasurementId: string;

  constructor(config: {
    supabaseUrl: string;
    supabaseKey: string;
    ga4MeasurementId: string;
  }) {
    this.supabaseUrl = config.supabaseUrl;
    this.supabaseKey = config.supabaseKey;
    this.ga4MeasurementId = config.ga4MeasurementId;
  }

  // =====================================================
  // 성과 분석
  // =====================================================

  /**
   * 콘텐츠 성과 종합 분석
   */
  async analyzeContent(contentId: string): Promise<PerformanceAnalysis> {
    try {
      // 1. 다양한 소스에서 메트릭 수집
      const metrics = await this.collectMetrics(contentId);
      
      // 2. 인사이트 생성
      const insights = this.generateInsights(metrics);
      
      // 3. 추천사항 도출
      const recommendations = this.generateRecommendations(insights);
      
      // 4. 성과 점수 계산
      const score = this.calculatePerformanceScore(metrics);
      
      // 5. 분석 결과 저장
      await this.saveAnalysis(contentId, {
        metrics,
        insights,
        recommendations,
        score
      });
      
      return {
        contentId,
        period: 'last_30_days',
        metrics,
        insights,
        recommendations,
        score
      };
    } catch (error) {
      console.error('콘텐츠 분석 실패:', error);
      throw error;
    }
  }

  /**
   * 메트릭 수집
   */
  private async collectMetrics(contentId: string): Promise<PerformanceMetrics> {
    const [
      ga4Data,
      socialData,
      emailData,
      conversionData
    ] = await Promise.all([
      this.fetchGA4Metrics(contentId),
      this.fetchSocialMetrics(contentId),
      this.fetchEmailMetrics(contentId),
      this.fetchConversionMetrics(contentId)
    ]);

    return {
      views: ga4Data.pageviews || 0,
      uniqueViews: ga4Data.uniquePageviews || 0,
      engagementRate: this.calculateEngagementRate({
        ...ga4Data,
        ...socialData
      }),
      clickThroughRate: (ga4Data.clicks / ga4Data.impressions) * 100 || 0,
      conversionRate: conversionData.rate || 0,
      revenue: conversionData.revenue || 0,
      roi: this.calculateROI(conversionData.revenue, conversionData.cost)
    };
  }

  /**
   * GA4 메트릭 조회
   */
  private async fetchGA4Metrics(contentId: string): Promise<any> {
    // Google Analytics Data API v1 사용
    try {
      const response = await fetch('/api/analytics/ga4-metrics', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          contentId,
          measurementId: this.ga4MeasurementId,
          metrics: [
            'screenPageViews',
            'activeUsers',
            'engagementRate',
            'averageSessionDuration',
            'bounceRate'
          ],
          dimensions: ['pagePath', 'deviceCategory'],
          dateRange: {
            startDate: '30daysAgo',
            endDate: 'today'
          }
        })
      });

      return await response.json();
    } catch (error) {
      console.error('GA4 메트릭 조회 실패:', error);
      return {};
    }
  }

  /**
   * 소셜 미디어 메트릭 조회
   */
  private async fetchSocialMetrics(contentId: string): Promise<any> {
    const platforms = ['instagram', 'facebook', 'youtube', 'tiktok'];
    const metrics: any = {};

    for (const platform of platforms) {
      try {
        const data = await this.fetchPlatformMetrics(platform, contentId);
        metrics[platform] = data;
      } catch (error) {
        console.error(`${platform} 메트릭 조회 실패:`, error);
      }
    }

    return this.aggregateSocialMetrics(metrics);
  }

  /**
   * 플랫폼별 메트릭 조회
   */
  private async fetchPlatformMetrics(platform: string, contentId: string): Promise<any> {
    // 각 플랫폼 API 연동
    const apiEndpoints: { [key: string]: string } = {
      instagram: '/api/social/instagram/insights',
      facebook: '/api/social/facebook/insights',
      youtube: '/api/social/youtube/analytics',
      tiktok: '/api/social/tiktok/analytics'
    };

    const response = await fetch(apiEndpoints[platform], {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ contentId })
    });

    return response.json();
  }

  /**
   * 이메일 메트릭 조회
   */
  private async fetchEmailMetrics(contentId: string): Promise<any> {
    // SendGrid 또는 Mailchimp API
    try {
      const response = await fetch('/api/email/metrics', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ contentId })
      });

      return response.json();
    } catch (error) {
      console.error('이메일 메트릭 조회 실패:', error);
      return {};
    }
  }

  /**
   * 전환 메트릭 조회
   */
  private async fetchConversionMetrics(contentId: string): Promise<any> {
    // Supabase에서 전환 데이터 조회
    const response = await fetch(
      `${this.supabaseUrl}/rest/v1/conversions?content_id=eq.${contentId}`,
      {
        headers: {
          'apikey': this.supabaseKey,
          'Authorization': `Bearer ${this.supabaseKey}`
        }
      }
    );

    const data = await response.json();
    
    return {
      conversions: data.length,
      rate: this.calculateConversionRate(data),
      revenue: this.sumRevenue(data),
      cost: this.getCampaignCost(contentId)
    };
  }

  // =====================================================
  // 인사이트 생성
  // =====================================================

  /**
   * 성과 인사이트 생성
   */
  private generateInsights(metrics: PerformanceMetrics): PerformanceInsight[] {
    const insights: PerformanceInsight[] = [];

    // 조회수 인사이트
    if (metrics.views && metrics.views > 10000) {
      insights.push({
        type: 'positive',
        category: 'reach',
        message: '높은 조회수를 기록했습니다. 콘텐츠가 많은 관심을 받고 있습니다.',
        impact: 'high',
        actionable: false
      });
    } else if (metrics.views && metrics.views < 1000) {
      insights.push({
        type: 'negative',
        category: 'reach',
        message: '조회수가 목표치에 미달합니다. 배포 채널 확대를 고려하세요.',
        impact: 'high',
        actionable: true
      });
    }

    // 참여율 인사이트
    if (metrics.engagementRate && metrics.engagementRate > 5) {
      insights.push({
        type: 'positive',
        category: 'engagement',
        message: '우수한 참여율을 보이고 있습니다. 타겟 오디언스와 잘 소통하고 있습니다.',
        impact: 'high',
        actionable: false
      });
    } else if (metrics.engagementRate && metrics.engagementRate < 2) {
      insights.push({
        type: 'negative',
        category: 'engagement',
        message: '참여율이 낮습니다. 콘텐츠 품질이나 타겟팅을 개선하세요.',
        impact: 'medium',
        actionable: true
      });
    }

    // 전환율 인사이트
    if (metrics.conversionRate && metrics.conversionRate > 3) {
      insights.push({
        type: 'positive',
        category: 'conversion',
        message: '높은 전환율을 달성했습니다. CTA가 효과적으로 작동하고 있습니다.',
        impact: 'high',
        actionable: false
      });
    } else if (metrics.conversionRate && metrics.conversionRate < 1) {
      insights.push({
        type: 'negative',
        category: 'conversion',
        message: '전환율 개선이 필요합니다. CTA 메시지나 위치를 조정하세요.',
        impact: 'high',
        actionable: true
      });
    }

    // ROI 인사이트
    if (metrics.roi && metrics.roi > 200) {
      insights.push({
        type: 'positive',
        category: 'roi',
        message: '탁월한 투자 수익률을 보이고 있습니다.',
        impact: 'high',
        actionable: false
      });
    } else if (metrics.roi && metrics.roi < 100) {
      insights.push({
        type: 'negative',
        category: 'roi',
        message: 'ROI가 목표치 이하입니다. 비용 효율성을 검토하세요.',
        impact: 'medium',
        actionable: true
      });
    }

    return insights;
  }

  /**
   * 개선 추천사항 생성
   */
  private generateRecommendations(insights: PerformanceInsight[]): string[] {
    const recommendations: string[] = [];
    const negativeInsights = insights.filter(i => i.type === 'negative' && i.actionable);

    negativeInsights.forEach(insight => {
      switch (insight.category) {
        case 'reach':
          recommendations.push(
            '🎯 더 많은 채널에 콘텐츠를 배포하세요',
            '📢 인플루언서 협업을 고려해보세요',
            '🔍 SEO 최적화를 강화하세요'
          );
          break;
        
        case 'engagement':
          recommendations.push(
            '💬 더 많은 질문과 CTA를 포함시키세요',
            '🎨 비주얼 콘텐츠를 추가하세요',
            '📊 타겟 오디언스를 재검토하세요'
          );
          break;
        
        case 'conversion':
          recommendations.push(
            '🎯 CTA 버튼을 더 눈에 띄게 만드세요',
            '💝 더 매력적인 혜택을 제공하세요',
            '⏰ 긴급성을 강조하는 메시지를 추가하세요'
          );
          break;
        
        case 'roi':
          recommendations.push(
            '💰 광고 비용을 최적화하세요',
            '🎯 더 정확한 타겟팅을 적용하세요',
            '📈 고성과 채널에 예산을 집중하세요'
          );
          break;
      }
    });

    // 중복 제거
    return [...new Set(recommendations)];
  }

  // =====================================================
  // 최적화 전략
  // =====================================================

  /**
   * 콘텐츠 전략 최적화
   */
  async optimizeContentStrategy(): Promise<{
    topPerformers: ContentCalendarItem[];
    patterns: string[];
    optimizations: string[];
  }> {
    // 1. 상위 성과 콘텐츠 식별
    const topPerformers = await this.getTopPerformingContent();
    
    // 2. 성공 패턴 분석
    const patterns = this.identifySuccessPatterns(topPerformers);
    
    // 3. 최적화 방안 도출
    const optimizations = this.generateOptimizations(patterns);
    
    return {
      topPerformers,
      patterns,
      optimizations
    };
  }

  /**
   * 상위 성과 콘텐츠 조회
   */
  private async getTopPerformingContent(): Promise<ContentCalendarItem[]> {
    const response = await fetch(
      `${this.supabaseUrl}/rest/v1/rpc/get_top_performing_content`,
      {
        method: 'POST',
        headers: {
          'apikey': this.supabaseKey,
          'Authorization': `Bearer ${this.supabaseKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          limit: 10,
          period: 'last_30_days'
        })
      }
    );

    return response.json();
  }

  /**
   * 성공 패턴 식별
   */
  private identifySuccessPatterns(topContent: ContentCalendarItem[]): string[] {
    const patterns: string[] = [];
    
    // 콘텐츠 타입 분석
    const typeFrequency = this.analyzeTypeFrequency(topContent);
    if (typeFrequency.mostCommon) {
      patterns.push(`${typeFrequency.mostCommon} 타입 콘텐츠가 가장 높은 성과`);
    }
    
    // 주제 분석
    const topicPatterns = this.analyzeTopics(topContent);
    topicPatterns.forEach(pattern => patterns.push(pattern));
    
    // 발행 시간 분석
    const timePatterns = this.analyzePublishingTime(topContent);
    timePatterns.forEach(pattern => patterns.push(pattern));
    
    // 길이 분석
    const lengthPattern = this.analyzeContentLength(topContent);
    if (lengthPattern) patterns.push(lengthPattern);
    
    // 키워드 분석
    const keywordPatterns = this.analyzeKeywords(topContent);
    keywordPatterns.forEach(pattern => patterns.push(pattern));
    
    return patterns;
  }

  /**
   * 최적화 방안 생성
   */
  private generateOptimizations(patterns: string[]): string[] {
    const optimizations: string[] = [];
    
    patterns.forEach(pattern => {
      if (pattern.includes('blog')) {
        optimizations.push('블로그 콘텐츠 비중을 늘리세요');
      }
      if (pattern.includes('비거리')) {
        optimizations.push('비거리 관련 콘텐츠를 더 많이 제작하세요');
      }
      if (pattern.includes('오전')) {
        optimizations.push('오전 시간대 발행을 유지하세요');
      }
      if (pattern.includes('1500자')) {
        optimizations.push('1500자 내외의 콘텐츠 길이를 유지하세요');
      }
    });
    
    return optimizations;
  }

  // =====================================================
  // 헬퍼 메서드
  // =====================================================

  /**
   * 참여율 계산
   */
  private calculateEngagementRate(data: any): number {
    const totalEngagements = (data.likes || 0) + 
                            (data.comments || 0) + 
                            (data.shares || 0) +
                            (data.clicks || 0);
    const totalReach = data.impressions || data.views || 1;
    
    return (totalEngagements / totalReach) * 100;
  }

  /**
   * ROI 계산
   */
  private calculateROI(revenue: number = 0, cost: number = 1): number {
    if (cost === 0) return 0;
    return ((revenue - cost) / cost) * 100;
  }

  /**
   * 전환율 계산
   */
  private calculateConversionRate(conversions: any[]): number {
    if (!conversions.length) return 0;
    
    const totalVisitors = conversions.reduce((sum, c) => sum + (c.visitors || 0), 0);
    const totalConversions = conversions.length;
    
    return totalVisitors > 0 ? (totalConversions / totalVisitors) * 100 : 0;
  }

  /**
   * 매출 합계
   */
  private sumRevenue(data: any[]): number {
    return data.reduce((sum, item) => sum + (item.revenue || 0), 0);
  }

  /**
   * 캠페인 비용 조회
   */
  private async getCampaignCost(contentId: string): Promise<number> {
    // 실제 구현에서는 데이터베이스에서 조회
    return 100000; // 임시 값
  }

  /**
   * 성과 점수 계산
   */
  private calculatePerformanceScore(metrics: PerformanceMetrics): number {
    const weights = {
      views: 0.2,
      engagementRate: 0.25,
      conversionRate: 0.35,
      roi: 0.2
    };
    
    let score = 0;
    
    // 각 메트릭 정규화 및 가중치 적용
    if (metrics.views) {
      score += Math.min(metrics.views / 10000, 1) * weights.views * 100;
    }
    if (metrics.engagementRate) {
      score += Math.min(metrics.engagementRate / 10, 1) * weights.engagementRate * 100;
    }
    if (metrics.conversionRate) {
      score += Math.min(metrics.conversionRate / 5, 1) * weights.conversionRate * 100;
    }
    if (metrics.roi) {
      score += Math.min(metrics.roi / 300, 1) * weights.roi * 100;
    }
    
    return Math.round(score);
  }

  /**
   * 분석 결과 저장
   */
  private async saveAnalysis(
    contentId: string, 
    analysis: PerformanceAnalysis
  ): Promise<void> {
    await fetch(`${this.supabaseUrl}/rest/v1/content_analysis`, {
      method: 'POST',
      headers: {
        'apikey': this.supabaseKey,
        'Authorization': `Bearer ${this.supabaseKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        content_id: contentId,
        analysis_data: analysis,
        analyzed_at: new Date().toISOString()
      })
    });
  }

  /**
   * 타입별 빈도 분석
   */
  private analyzeTypeFrequency(content: ContentCalendarItem[]): {
    mostCommon: string;
    frequency: { [key: string]: number };
  } {
    const frequency: { [key: string]: number } = {};
    
    content.forEach(item => {
      frequency[item.contentType] = (frequency[item.contentType] || 0) + 1;
    });
    
    const mostCommon = Object.keys(frequency).reduce((a, b) => 
      frequency[a] > frequency[b] ? a : b
    );
    
    return { mostCommon, frequency };
  }

  /**
   * 주제 분석
   */
  private analyzeTopics(content: ContentCalendarItem[]): string[] {
    const patterns: string[] = [];
    const themes = content.map(c => c.theme);
    const uniqueThemes = [...new Set(themes)];
    
    if (uniqueThemes.length < themes.length / 2) {
      patterns.push(`일관된 주제가 높은 성과를 보임`);
    }
    
    return patterns;
  }

  /**
   * 발행 시간 분석
   */
  private analyzePublishingTime(content: ContentCalendarItem[]): string[] {
    const patterns: string[] = [];
    const hours = content
      .filter(c => c.publishedAt)
      .map(c => new Date(c.publishedAt!).getHours());
    
    const avgHour = hours.reduce((a, b) => a + b, 0) / hours.length;
    
    if (avgHour < 12) {
      patterns.push('오전 발행이 더 높은 성과를 보임');
    } else {
      patterns.push('오후 발행이 더 높은 성과를 보임');
    }
    
    return patterns;
  }

  /**
   * 콘텐츠 길이 분석
   */
  private analyzeContentLength(content: ContentCalendarItem[]): string | null {
    const lengths = content
      .filter(c => c.contentBody)
      .map(c => c.contentBody!.length);
    
    if (lengths.length === 0) return null;
    
    const avgLength = lengths.reduce((a, b) => a + b, 0) / lengths.length;
    
    if (avgLength < 1000) {
      return '짧은 콘텐츠가 더 높은 성과';
    } else if (avgLength > 2000) {
      return '긴 콘텐츠가 더 높은 성과';
    } else {
      return '중간 길이(1000-2000자) 콘텐츠가 최적';
    }
  }

  /**
   * 키워드 분석
   */
  private analyzeKeywords(content: ContentCalendarItem[]): string[] {
    const patterns: string[] = [];
    const allKeywords = content.flatMap(c => c.keywords);
    
    const keywordFrequency: { [key: string]: number } = {};
    allKeywords.forEach(keyword => {
      keywordFrequency[keyword] = (keywordFrequency[keyword] || 0) + 1;
    });
    
    const topKeywords = Object.keys(keywordFrequency)
      .sort((a, b) => keywordFrequency[b] - keywordFrequency[a])
      .slice(0, 5);
    
    if (topKeywords.length > 0) {
      patterns.push(`고성과 키워드: ${topKeywords.join(', ')}`);
    }
    
    return patterns;
  }

  /**
   * 소셜 메트릭 집계
   */
  private aggregateSocialMetrics(metrics: any): any {
    const aggregated = {
      totalLikes: 0,
      totalComments: 0,
      totalShares: 0,
      totalReach: 0,
      totalEngagement: 0
    };
    
    Object.values(metrics).forEach((platform: any) => {
      aggregated.totalLikes += platform.likes || 0;
      aggregated.totalComments += platform.comments || 0;
      aggregated.totalShares += platform.shares || 0;
      aggregated.totalReach += platform.reach || 0;
      aggregated.totalEngagement += platform.engagement || 0;
    });
    
    return aggregated;
  }
}

export default ContentPerformanceAnalyzer;
