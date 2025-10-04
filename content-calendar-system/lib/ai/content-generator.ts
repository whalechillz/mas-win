// AI Content Generator
// /lib/ai/content-generator.ts

import { 
  ContentType,
  ContentCalendarItem,
  ToneAndManner,
  AIGenerationRequest 
} from '@/types';

interface GeneratedContent {
  title: string;
  body: string;
  html: string;
  excerpt: string;
  keywords: string[];
  hashtags: string[];
  metadata: {
    tokensUsed: number;
    model: string;
    generatedAt: Date;
  };
}

/**
 * AI 기반 콘텐츠 생성 모듈
 * OpenAI GPT-4와 Fal.ai를 활용한 텍스트 및 이미지 생성
 */
export class AIContentGenerator {
  private openaiApiKey: string;
  private falApiKey: string;
  private model: string = 'gpt-4';

  constructor(config: {
    openaiApiKey: string;
    falApiKey: string;
  }) {
    this.openaiApiKey = config.openaiApiKey;
    this.falApiKey = config.falApiKey;
  }

  // =====================================================
  // 메인 생성 함수
  // =====================================================

  /**
   * AI를 활용한 콘텐츠 생성
   */
  async generateContent(
    request: AIGenerationRequest
  ): Promise<GeneratedContent> {
    console.log(`🤖 AI 콘텐츠 생성 시작: ${request.topic}`);

    try {
      // 콘텐츠 타입별 생성 전략 선택
      let content: GeneratedContent;
      
      switch (request.contentType) {
        case 'blog':
          content = await this.generateBlogPost(request);
          break;
        case 'social':
          content = await this.generateSocialPost(request);
          break;
        case 'email':
          content = await this.generateEmail(request);
          break;
        case 'funnel':
          content = await this.generateFunnelContent(request);
          break;
        case 'video':
          content = await this.generateVideoScript(request);
          break;
        default:
          content = await this.generateGenericContent(request);
      }

      // 이미지 생성 (필요한 경우)
      if (this.needsImage(request.contentType)) {
        const imageUrl = await this.generateImage(request.topic);
        content.metadata = {
          ...content.metadata,
          imageUrl
        };
      }

      console.log(`✅ 콘텐츠 생성 완료 - ${content.metadata.tokensUsed} 토큰 사용`);
      
      return content;
    } catch (error) {
      console.error('AI 콘텐츠 생성 실패:', error);
      throw error;
    }
  }

  // =====================================================
  // 콘텐츠 타입별 생성 메서드
  // =====================================================

  /**
   * 블로그 포스트 생성
   */
  private async generateBlogPost(
    request: AIGenerationRequest
  ): Promise<GeneratedContent> {
    const systemPrompt = `
당신은 MASSGOO 브랜드의 전문 블로그 작가입니다.
시니어 골퍼를 위한 프리미엄 골프 장비 브랜드의 콘텐츠를 작성합니다.

브랜드 톤앤매너:
- 전문적이면서 친근한 톤
- 시니어 골퍼에 대한 존중과 격려
- 기술적 설명은 쉽고 명확하게
- 경험과 지혜를 인정하는 접근

글 구조:
1. 흥미로운 도입부 (질문이나 통계)
2. 문제 인식
3. 솔루션 제시 (MASSGOO 제품/서비스)
4. 구체적 증거/사례
5. 명확한 CTA

길이: 1500-2000자
    `.trim();

    const userPrompt = this.buildBlogPrompt(request);
    
    const response = await this.callOpenAI(systemPrompt, userPrompt);
    
    return this.parseBlogResponse(response);
  }

  /**
   * 소셜 미디어 포스트 생성
   */
  private async generateSocialPost(
    request: AIGenerationRequest
  ): Promise<GeneratedContent> {
    const systemPrompt = `
당신은 MASSGOO의 소셜 미디어 매니저입니다.
시니어 골퍼들과 소통하는 매력적인 소셜 콘텐츠를 작성합니다.

포스트 특징:
- 짧고 임팩트 있는 메시지
- 감정적 연결 중시
- 적절한 이모지 사용 (1-2개)
- 명확한 CTA
- 해시태그 5-7개

글자 수: 100-150자
    `.trim();

    const userPrompt = this.buildSocialPrompt(request);
    
    const response = await this.callOpenAI(systemPrompt, userPrompt);
    
    return this.parseSocialResponse(response);
  }

  /**
   * 이메일 콘텐츠 생성
   */
  private async generateEmail(
    request: AIGenerationRequest
  ): Promise<GeneratedContent> {
    const systemPrompt = `
당신은 MASSGOO의 이메일 마케팅 전문가입니다.
시니어 골퍼를 위한 개인화된 이메일을 작성합니다.

이메일 구조:
1. 주목을 끄는 제목
2. 개인화된 인사말
3. 핵심 메시지
4. 혜택 강조
5. 명확한 CTA
6. 추신 (추가 혜택)

톤: 전문적이면서 따뜻한
길이: 300-500자
    `.trim();

    const userPrompt = this.buildEmailPrompt(request);
    
    const response = await this.callOpenAI(systemPrompt, userPrompt);
    
    return this.parseEmailResponse(response);
  }

  /**
   * 퍼널 페이지 콘텐츠 생성
   */
  private async generateFunnelContent(
    request: AIGenerationRequest
  ): Promise<GeneratedContent> {
    const systemPrompt = `
당신은 MASSGOO의 전환율 최적화 전문가입니다.
높은 전환율의 퍼널 페이지 콘텐츠를 작성합니다.

퍼널 구조:
1. 강력한 헤드라인
2. 문제 공감
3. 솔루션 제시
4. 사회적 증거
5. 혜택 목록
6. 긴급성 생성
7. 강력한 CTA

특징:
- 설득력 있는 카피
- 감정적 트리거 활용
- 구체적인 숫자와 데이터
- 신뢰 요소 포함
    `.trim();

    const userPrompt = this.buildFunnelPrompt(request);
    
    const response = await this.callOpenAI(systemPrompt, userPrompt);
    
    return this.parseFunnelResponse(response);
  }

  /**
   * 비디오 스크립트 생성
   */
  private async generateVideoScript(
    request: AIGenerationRequest
  ): Promise<GeneratedContent> {
    const systemPrompt = `
당신은 MASSGOO의 비디오 콘텐츠 제작자입니다.
시니어 골퍼를 위한 교육적이고 재미있는 비디오 스크립트를 작성합니다.

스크립트 구조:
1. 훅 (0-5초)
2. 소개 (5-15초)
3. 메인 콘텐츠 (본문)
4. 요약
5. CTA

특징:
- 시각적 설명 포함
- 대화체 사용
- 실연 가능한 내용
- 3-5분 분량
    `.trim();

    const userPrompt = this.buildVideoPrompt(request);
    
    const response = await this.callOpenAI(systemPrompt, userPrompt);
    
    return this.parseVideoResponse(response);
  }

  /**
   * 일반 콘텐츠 생성
   */
  private async generateGenericContent(
    request: AIGenerationRequest
  ): Promise<GeneratedContent> {
    const systemPrompt = `
당신은 MASSGOO 브랜드의 콘텐츠 작성자입니다.
브랜드 가이드라인에 맞는 콘텐츠를 작성합니다.
    `.trim();

    const userPrompt = `
주제: ${request.topic}
키워드: ${request.keywords?.join(', ')}
길이: ${request.length || 1000}자
추가 요구사항: ${request.additionalContext || '없음'}
    `.trim();
    
    const response = await this.callOpenAI(systemPrompt, userPrompt);
    
    return this.parseGenericResponse(response);
  }

  // =====================================================
  // OpenAI API 호출
  // =====================================================

  /**
   * OpenAI API 호출
   */
  private async callOpenAI(
    systemPrompt: string,
    userPrompt: string
  ): Promise<any> {
    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.openaiApiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: this.model,
          messages: [
            {
              role: 'system',
              content: systemPrompt
            },
            {
              role: 'user',
              content: userPrompt
            }
          ],
          temperature: 0.7,
          max_tokens: 2000,
          top_p: 0.9,
          frequency_penalty: 0.3,
          presence_penalty: 0.3
        })
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.statusText}`);
      }

      const data = await response.json();
      
      return {
        content: data.choices[0].message.content,
        tokensUsed: data.usage.total_tokens
      };
    } catch (error) {
      console.error('OpenAI API 호출 실패:', error);
      throw error;
    }
  }

  // =====================================================
  // 이미지 생성 (Fal.ai)
  // =====================================================

  /**
   * Fal.ai를 사용한 이미지 생성
   */
  private async generateImage(topic: string): Promise<string> {
    try {
      const prompt = this.buildImagePrompt(topic);
      
      const response = await fetch('https://fal.run/fal-ai/flux/schnell', {
        method: 'POST',
        headers: {
          'Authorization': `Key ${this.falApiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          prompt,
          image_size: 'landscape_16_9',
          num_inference_steps: 4,
          num_images: 1
        })
      });

      if (!response.ok) {
        throw new Error(`Fal.ai API error: ${response.statusText}`);
      }

      const data = await response.json();
      
      return data.images[0].url;
    } catch (error) {
      console.error('이미지 생성 실패:', error);
      // 실패 시 기본 이미지 반환
      return '/images/default-golf.jpg';
    }
  }

  // =====================================================
  // 프롬프트 빌더
  // =====================================================

  /**
   * 블로그 프롬프트 생성
   */
  private buildBlogPrompt(request: AIGenerationRequest): string {
    return `
블로그 포스트를 작성해주세요.

주제: ${request.topic}
키워드: ${request.keywords?.join(', ') || ''}
타겟: 50-70대 시니어 골퍼
목적: 정보 제공 및 제품 인지도 향상
길이: ${request.length || 1500}자

다음을 포함해주세요:
- 흥미로운 통계나 사실로 시작
- MASSGOO 제품의 자연스러운 언급
- 실제 사용 사례나 고객 후기
- 명확한 다음 단계 제시

금지 표현: 노인, 늙은, 쇠퇴, 한계
필수 포함: 프리미엄, 혁신, 비거리, 경험

${request.additionalContext ? `추가 요구사항: ${request.additionalContext}` : ''}
    `.trim();
  }

  /**
   * 소셜 프롬프트 생성
   */
  private buildSocialPrompt(request: AIGenerationRequest): string {
    return `
소셜 미디어 포스트를 작성해주세요.

주제: ${request.topic}
플랫폼: Instagram/Facebook
타겟: 시니어 골퍼 및 가족
길이: 100-150자

포함 요소:
- 감정적 연결 메시지
- 1-2개 이모지
- 명확한 CTA
- 5-7개 해시태그

해시태그 필수: #MASSGOO #마스구 #골프 #시니어골프

${request.additionalContext ? `추가 요구사항: ${request.additionalContext}` : ''}
    `.trim();
  }

  /**
   * 이메일 프롬프트 생성
   */
  private buildEmailPrompt(request: AIGenerationRequest): string {
    return `
이메일 마케팅 콘텐츠를 작성해주세요.

주제: ${request.topic}
목적: ${request.additionalContext || '제품 홍보 및 전환'}
타겟: VIP 고객 / 기존 고객

구성:
1. 제목 (30자 이내, 호기심 유발)
2. 프리뷰 텍스트 (50자)
3. 본문 (300-500자)
4. CTA 버튼 텍스트

톤: 존중과 감사, 특별함 강조

${request.additionalContext ? `추가 컨텍스트: ${request.additionalContext}` : ''}
    `.trim();
  }

  /**
   * 퍼널 프롬프트 생성
   */
  private buildFunnelPrompt(request: AIGenerationRequest): string {
    return `
고전환율 퍼널 페이지 콘텐츠를 작성해주세요.

주제: ${request.topic}
목표: 시타 예약 / 구매 전환
타겟: 비거리 고민 시니어 골퍼

섹션별 콘텐츠:
1. 헤드라인 (강력한 혜택 약속)
2. 서브 헤드라인 (구체적 수치)
3. 문제 공감 (3-4문장)
4. 솔루션 제시 (MASSGOO)
5. 혜택 목록 (5개)
6. 고객 후기 (2-3개)
7. 긴급성 메시지
8. CTA 버튼 텍스트 (3가지)

설득 요소: 희소성, 권위, 사회적 증거

${request.additionalContext ? `추가 요구사항: ${request.additionalContext}` : ''}
    `.trim();
  }

  /**
   * 비디오 프롬프트 생성
   */
  private buildVideoPrompt(request: AIGenerationRequest): string {
    return `
YouTube 비디오 스크립트를 작성해주세요.

주제: ${request.topic}
길이: 3-5분 (약 500-800자)
형식: 교육/정보 제공

구성:
1. 훅 (5초): 시청자 주목
2. 인트로 (10초): 자기소개 및 주제
3. 메인 (2-3분): 핵심 내용
4. 실연/시연 설명
5. 요약 (20초)
6. CTA (10초): 구독/좋아요/댓글

톤: 친근하고 교육적
시각 지시: [화면 설명] 포함

${request.additionalContext ? `추가 요구사항: ${request.additionalContext}` : ''}
    `.trim();
  }

  /**
   * 이미지 프롬프트 생성
   */
  private buildImagePrompt(topic: string): string {
    return `
Professional golf equipment photography for MASSGOO brand.
${topic}.
Premium, luxury golf club, titanium driver, senior golfer.
High quality product shot, studio lighting, elegant composition.
Brand colors: navy blue and gold accents.
Clean background, professional sports equipment photography style.
    `.trim();
  }

  // =====================================================
  // 응답 파싱
  // =====================================================

  /**
   * 블로그 응답 파싱
   */
  private parseBlogResponse(response: any): GeneratedContent {
    const content = response.content;
    
    // 제목 추출
    const titleMatch = content.match(/^#\s+(.+)$/m);
    const title = titleMatch ? titleMatch[1] : '제목 없음';
    
    // 본문 정리
    const body = content.replace(/^#\s+.+$/m, '').trim();
    
    // 키워드 추출
    const keywords = this.extractKeywords(body);
    
    // 해시태그 생성
    const hashtags = this.generateHashtags(keywords);
    
    // 요약 생성
    const excerpt = this.generateExcerpt(body, 150);
    
    // HTML 변환
    const html = this.convertToHTML(body);
    
    return {
      title,
      body,
      html,
      excerpt,
      keywords,
      hashtags,
      metadata: {
        tokensUsed: response.tokensUsed,
        model: this.model,
        generatedAt: new Date()
      }
    };
  }

  /**
   * 소셜 응답 파싱
   */
  private parseSocialResponse(response: any): GeneratedContent {
    const content = response.content;
    
    // 본문과 해시태그 분리
    const parts = content.split('\n\n');
    const body = parts[0] || content;
    const hashtagLine = parts.find(p => p.startsWith('#'));
    
    const hashtags = hashtagLine 
      ? hashtagLine.split(/\s+/).filter(h => h.startsWith('#'))
      : ['#MASSGOO', '#골프'];
    
    return {
      title: body.substring(0, 50),
      body,
      html: `<p>${body}</p><p>${hashtags.join(' ')}</p>`,
      excerpt: body,
      keywords: this.extractKeywords(body),
      hashtags,
      metadata: {
        tokensUsed: response.tokensUsed,
        model: this.model,
        generatedAt: new Date()
      }
    };
  }

  /**
   * 이메일 응답 파싱
   */
  private parseEmailResponse(response: any): GeneratedContent {
    const content = response.content;
    
    // 이메일 구성 요소 추출
    const lines = content.split('\n').filter(l => l.trim());
    const title = lines[0].replace(/^제목:\s*/, '');
    const preview = lines[1]?.replace(/^프리뷰:\s*/, '') || '';
    const body = lines.slice(2).join('\n');
    
    return {
      title,
      body,
      html: this.convertEmailToHTML(title, body),
      excerpt: preview,
      keywords: this.extractKeywords(body),
      hashtags: [],
      metadata: {
        tokensUsed: response.tokensUsed,
        model: this.model,
        generatedAt: new Date()
      }
    };
  }

  /**
   * 퍼널 응답 파싱
   */
  private parseFunnelResponse(response: any): GeneratedContent {
    const content = response.content;
    
    // 섹션별 파싱
    const sections = content.split(/\n\d+\.\s+/);
    const headline = sections[1]?.trim() || '제목';
    
    return {
      title: headline,
      body: content,
      html: this.convertFunnelToHTML(content),
      excerpt: headline,
      keywords: this.extractKeywords(content),
      hashtags: [],
      metadata: {
        tokensUsed: response.tokensUsed,
        model: this.model,
        generatedAt: new Date()
      }
    };
  }

  /**
   * 비디오 응답 파싱
   */
  private parseVideoResponse(response: any): GeneratedContent {
    const content = response.content;
    
    // 스크립트 섹션 파싱
    const lines = content.split('\n');
    const title = lines[0] || '비디오 스크립트';
    
    return {
      title,
      body: content,
      html: this.convertScriptToHTML(content),
      excerpt: lines.slice(1, 3).join(' '),
      keywords: this.extractKeywords(content),
      hashtags: ['#MASSGOO', '#골프레슨'],
      metadata: {
        tokensUsed: response.tokensUsed,
        model: this.model,
        generatedAt: new Date()
      }
    };
  }

  /**
   * 일반 응답 파싱
   */
  private parseGenericResponse(response: any): GeneratedContent {
    const content = response.content;
    
    return {
      title: content.split('\n')[0].substring(0, 100),
      body: content,
      html: this.convertToHTML(content),
      excerpt: this.generateExcerpt(content, 150),
      keywords: this.extractKeywords(content),
      hashtags: ['#MASSGOO'],
      metadata: {
        tokensUsed: response.tokensUsed,
        model: this.model,
        generatedAt: new Date()
      }
    };
  }

  // =====================================================
  // 헬퍼 메서드
  // =====================================================

  /**
   * 이미지 필요 여부 판단
   */
  private needsImage(contentType: ContentType): boolean {
    return ['blog', 'social', 'funnel'].includes(contentType);
  }

  /**
   * 키워드 추출
   */
  private extractKeywords(text: string): string[] {
    // 간단한 키워드 추출 로직
    const importantWords = [
      '골프', '드라이버', '비거리', '시니어', '프리미엄',
      'MASSGOO', '티타늄', '샤프트', '스윙', '클럽'
    ];
    
    return importantWords.filter(word => text.includes(word));
  }

  /**
   * 해시태그 생성
   */
  private generateHashtags(keywords: string[]): string[] {
    const baseHashtags = ['#MASSGOO', '#마스구', '#골프'];
    const keywordHashtags = keywords
      .slice(0, 4)
      .map(k => `#${k.replace(/\s/g, '')}`);
    
    return [...baseHashtags, ...keywordHashtags];
  }

  /**
   * 요약 생성
   */
  private generateExcerpt(text: string, maxLength: number): string {
    const cleanText = text.replace(/[#*\n]/g, ' ').trim();
    if (cleanText.length <= maxLength) return cleanText;
    
    return cleanText.substring(0, maxLength - 3) + '...';
  }

  /**
   * HTML 변환
   */
  private convertToHTML(text: string): string {
    let html = text;
    
    // 헤딩 변환
    html = html.replace(/^### (.+)$/gm, '<h3>$1</h3>');
    html = html.replace(/^## (.+)$/gm, '<h2>$1</h2>');
    html = html.replace(/^# (.+)$/gm, '<h1>$1</h1>');
    
    // 볼드 변환
    html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    
    // 이탤릭 변환
    html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');
    
    // 리스트 변환
    html = html.replace(/^- (.+)$/gm, '<li>$1</li>');
    html = html.replace(/(<li>.*<\/li>\n?)+/g, '<ul>$&</ul>');
    
    // 단락 변환
    html = html.replace(/\n\n/g, '</p><p>');
    html = `<p>${html}</p>`;
    
    return html;
  }

  /**
   * 이메일 HTML 변환
   */
  private convertEmailToHTML(subject: string, body: string): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${subject}</title>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #1e3a8a; color: white; padding: 20px; text-align: center; }
    .content { padding: 20px; }
    .cta { background: #f59e0b; color: white; padding: 15px 30px; text-decoration: none; display: inline-block; margin: 20px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>MASSGOO</h1>
    </div>
    <div class="content">
      ${body.replace(/\n/g, '<br>')}
    </div>
  </div>
</body>
</html>
    `.trim();
  }

  /**
   * 퍼널 HTML 변환
   */
  private convertFunnelToHTML(content: string): string {
    // 퍼널 페이지용 HTML 구조
    const sections = content.split(/\n\d+\.\s+/);
    
    let html = '<div class="funnel-container">';
    sections.forEach((section, index) => {
      if (section.trim()) {
        html += `<section class="funnel-section-${index}">${section}</section>`;
      }
    });
    html += '</div>';
    
    return html;
  }

  /**
   * 스크립트 HTML 변환
   */
  private convertScriptToHTML(script: string): string {
    // 비디오 스크립트용 HTML
    const lines = script.split('\n');
    let html = '<div class="video-script">';
    
    lines.forEach(line => {
      if (line.startsWith('[')) {
        // 화면 지시
        html += `<div class="direction">${line}</div>`;
      } else if (line.trim()) {
        // 대사
        html += `<div class="dialogue">${line}</div>`;
      }
    });
    
    html += '</div>';
    return html;
  }
}

// 메인 생성 함수 (외부에서 사용)
export async function generateAIContent(
  request: AIGenerationRequest
): Promise<GeneratedContent> {
  const generator = new AIContentGenerator({
    openaiApiKey: process.env.OPENAI_API_KEY!,
    falApiKey: process.env.FAL_AI_KEY!
  });
  
  return generator.generateContent(request);
}

export default AIContentGenerator;
