import OpenAI from 'openai';
import { 
  SEO_KEYWORDS, 
  PAIN_POINTS, 
  CUSTOMER_CHANNELS, 
  TRUST_INDICATORS,
  CONTENT_TEMPLATES,
  CUSTOMER_PERSONAS,
  MASLOW_NEEDS_MAPPING,
  CONTENT_STRATEGY,
  generateBrandMessage,
  generatePainPointMessage
} from '../../lib/masgolf-brand-data';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { 
      title,
      currentContent,
      currentImages,
      improvementType = 'all', // 'content', 'images', 'all'
      contentType,
      audienceTemp,
      brandWeight,
      customerChannel,
      customerPersona,
      painPoint,
      keywords
    } = req.body;

    console.log('🔧 AI 콘텐츠 개선 요청:', { 
      title, 
      improvementType, 
      contentType,
      currentContentLength: currentContent?.length || 0,
      currentImagesCount: currentImages?.length || 0
    });

    // 고객 페르소나와 채널 정보 가져오기
    const persona = CUSTOMER_PERSONAS[customerPersona] || CUSTOMER_PERSONAS['performance_maintainer'];
    const channel = CUSTOMER_CHANNELS[customerChannel] || CUSTOMER_CHANNELS.local_customers;
    const painMessage = painPoint ? generatePainPointMessage(painPoint) : null;
    const brandMessage = generateBrandMessage(contentType, audienceTemp, brandWeight, customerChannel);

    let prompt = '';
    let systemMessage = '';

    // 개선 타입에 따른 프롬프트 생성
    switch (improvementType) {
      case 'content':
        prompt = `다음 블로그 포스트의 내용을 분석하고 개선해주세요:

**제목**: ${title}
**현재 내용**:
${currentContent}

**개선 요청사항**:
1. 문법 및 맞춤법 교정
2. 내용에 살을 붙여서 더 풍부하고 유익하게 만들기
3. SEO 키워드 최적화 (${keywords || '골프, 드라이버, 비거리'})
4. 브랜드 메시지 자연스럽게 통합
5. 독자의 관심을 끌 수 있는 스토리텔링 요소 추가
6. 구체적인 수치나 사례 추가

**브랜드 정보**: ${brandMessage}
**고객 페르소나**: ${persona.description}
**고객 채널**: ${channel.description}

개선된 내용을 마크다운 형식으로 작성해주세요. 기존 내용의 핵심은 유지하되, 더 전문적이고 매력적으로 만들어주세요.`;
        break;

      case 'images':
        prompt = `다음 블로그 포스트의 이미지 배치를 분석하고 최적화해주세요:

**제목**: ${title}
**현재 내용**: ${currentContent}
**현재 이미지들**: ${currentImages?.map(img => img.name || img).join(', ') || '없음'}

**이미지 최적화 요청사항**:
1. 텍스트와 이미지의 조화 분석
2. 시각적 흐름 개선 제안
3. 이미지 순서 재배치 제안
4. 추가 이미지가 필요한 부분 제안
5. 이미지 캡션 개선 제안

**브랜드 정보**: ${brandMessage}
**고객 페르소나**: ${persona.description}

이미지 배치 최적화 방안을 구체적으로 제안해주세요.`;
        break;

      case 'all':
      default:
        prompt = `다음 블로그 포스트를 종합적으로 분석하고 개선해주세요:

**제목**: ${title}
**현재 내용**:
${currentContent}
**현재 이미지들**: ${currentImages?.map(img => img.name || img).join(', ') || '없음'}

**종합 개선 요청사항**:
1. **내용 개선**:
   - 문법 및 맞춤법 교정
   - 내용에 살을 붙여서 더 풍부하고 유익하게 만들기
   - SEO 키워드 최적화 (${keywords || '골프, 드라이버, 비거리'})
   - 브랜드 메시지 자연스럽게 통합
   - 독자의 관심을 끌 수 있는 스토리텔링 요소 추가

2. **이미지 최적화**:
   - 텍스트와 이미지의 조화 분석
   - 시각적 흐름 개선 제안
   - 이미지 순서 재배치 제안
   - 추가 이미지가 필요한 부분 제안

3. **전체적인 개선**:
   - 독자 경험 향상
   - 전환율 최적화
   - 전문성과 신뢰도 향상

**브랜드 정보**: ${brandMessage}
**고객 페르소나**: ${persona.description}
**고객 채널**: ${channel.description}
${painMessage ? `**고객 페인포인트**: ${painMessage}` : ''}

개선된 내용을 마크다운 형식으로 작성하고, 이미지 배치 개선사항도 함께 제안해주세요.`;
        break;
    }

    systemMessage = `당신은 MASSGOO(마쓰구)의 전문 콘텐츠 개선 전문가입니다.

**MASSGOO 브랜드 프로필**:
- 초고반발 드라이버 전문 브랜드
- 반발계수 0.87의 과학적 기술력
- 20년 이상의 골프 기술 연구
- KGFA/KCA 인증 피팅 전문가
- 초음파 측정기로 투명한 검증
- 10,000개 이상 판매로 검증된 성능
- 10년 샤프트 교환 보증

**개선 원칙**:
1. 기존 내용의 핵심 가치 유지
2. 브랜드 메시지를 자연스럽게 통합
3. 독자에게 실질적인 도움 제공
4. SEO 최적화와 가독성 균형
5. 고객 페르소나에 맞는 톤앤매너
6. 전환율을 높이는 구조적 개선

당신의 임무는 기존 콘텐츠를 분석하고 더욱 전문적이고 매력적으로 개선하는 것입니다.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: systemMessage
        },
        {
          role: "user",
          content: prompt
        }
      ],
      max_tokens: 3000,
      temperature: 0.7,
    });

    const improvedContent = completion.choices[0].message.content;
    
    // API 사용 정보 추출
    const usage = completion.usage;
    const model = completion.model;
    
    // 비용 계산 (gpt-4o-mini 기준)
    const inputTokens = usage?.prompt_tokens || 0;
    const outputTokens = usage?.completion_tokens || 0;
    const totalTokens = usage?.total_tokens || 0;
    
    // gpt-4o-mini 가격 (2024년 기준)
    const inputCostPer1K = 0.00015; // $0.15 per 1K tokens
    const outputCostPer1K = 0.0006;  // $0.60 per 1K tokens
    
    const inputCost = (inputTokens / 1000) * inputCostPer1K;
    const outputCost = (outputTokens / 1000) * outputCostPer1K;
    const totalCost = inputCost + outputCost;
    
    const usageInfo = {
      model: model,
      inputTokens: inputTokens,
      outputTokens: outputTokens,
      totalTokens: totalTokens,
      cost: totalCost.toFixed(6),
      timestamp: new Date().toISOString()
    };
    
    console.log(`✅ AI 콘텐츠 개선 완료:`, improvedContent ? `${improvedContent.length} 자` : '0 자');
    console.log(`📊 API 사용 정보:`, usageInfo);
    
    // 사용 정보를 Supabase에 저장 (선택사항)
    try {
      const { createClient } = await import('@supabase/supabase-js');
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
      );
      
      await supabase.from('ai_usage_logs').insert({
        api_endpoint: 'improve-blog-content',
        model: model,
        input_tokens: inputTokens,
        output_tokens: outputTokens,
        total_tokens: totalTokens,
        cost: totalCost,
        improvement_type: improvementType,
        content_type: contentType,
        created_at: new Date().toISOString()
      });
      
      console.log('✅ API 사용 정보가 데이터베이스에 저장되었습니다.');
    } catch (dbError) {
      console.log('⚠️ API 사용 정보 저장 실패 (데이터베이스 테이블이 없을 수 있음):', dbError.message);
    }
    
    res.status(200).json({ 
      improvedContent,
      improvementType,
      originalLength: currentContent?.length || 0,
      improvedLength: improvedContent?.length || 0,
      brandWeight: brandWeight,
      customerPersona: customerPersona,
      usageInfo: usageInfo
    });

  } catch (error) {
    console.error('AI 콘텐츠 개선 에러:', error);
    res.status(500).json({ 
      message: 'AI 콘텐츠 개선에 실패했습니다.',
      error: error.message 
    });
  }
}
