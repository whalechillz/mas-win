import OpenAI from 'openai';
import { logOpenAIUsage } from '../../lib/ai-usage-logger';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  // OpenAI API 키 없으면 즉시 반환 (원인 명확화)
  if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY.trim() === '') {
    console.error('❌ [analyze-image-prompt] OPENAI_API_KEY가 설정되지 않았습니다.');
    return res.status(500).json({
      error: '이미지 프롬프트 분석 중 오류가 발생했습니다.',
      details: 'OPENAI_API_KEY가 환경 변수에 설정되지 않았습니다. .env에 OPENAI_API_KEY를 추가해주세요.',
      type: 'golf-ai',
      code: 'MISSING_OPENAI_API_KEY'
    });
  }

  try {
    const { imageUrl, title, excerpt, sceneContext } = req.body;

    if (!imageUrl) {
      return res.status(400).json({ message: 'Image URL is required' });
    }

    console.log('🔍 이미지 프롬프트 분석 시작:', imageUrl);
    console.log('🔧 OpenAI API 키 확인:', process.env.OPENAI_API_KEY ? '설정됨' : '누락');
    if (sceneContext) {
      console.log('📋 장면 컨텍스트:', sceneContext);
    }

    // 스토리 기반 장면 분류 프롬프트 추가
    const sceneDetectionPrompt = sceneContext ? `
**스토리 장면 분류 컨텍스트:**
- 감지된 장면: ${sceneContext.scene} (S${sceneContext.scene})
- 감지된 타입: ${sceneContext.type}
- 주요 키워드: ${sceneContext.keywords?.join(', ') || ''}

이 컨텍스트를 참고하여 더 정확한 메타데이터를 생성하세요.
` : '';

    // OpenAI Vision API를 사용하여 골프 특화 이미지 분석 (모든 메타데이터 한 번에 생성)
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are an expert image analyzer for golf-related content. 
Analyze the given image and generate all metadata in JSON format.

**스토리 기반 장면 분류 규칙 (S1-S7):**

장면1 (S1): 행복한 주인공 - 골프장 단독샷
- 고객 단독샷, 골프장 사진
- 여유롭고 평화로운 골프 순간, 고급스러운 골프
- 웃는 모습 또는 밝은 표정
- 키워드: golf-course, solo-shot, happy, luxurious-golf, peaceful

장면2 (S2): 여러 사람 등장
- 골프장에서 여러 사람이 함께 등장
- 그룹 사진, 친구들과 함께
- 키워드: golf-course, multiple-people, group, together

장면3 (S3): 문제 발생
- 표정이 어둡거나, 골프 공이 러프에 빠졌거나
- 클럽 오류, 부상 발생
- 부정적인 상황
- 키워드: problem, trouble, negative-expression, worry

장면4 (S4): 가이드 만남
- 상담원과 피팅 상담, 전화 상담
- MASGOO 매장, 스크린 골프
- 키워드: consultation, fitting, guide, sita

장면5 (S5): 피팅 매장 / 스크린 골프
- 피팅 매장, 스크린 골프 연습장
- 실내 스크린 골프
- 키워드: fitting-shop, screen-golf, indoor, sita, masgoo

장면6 (S6): 골프장 고객 단독사진 (여러명 등장, 웃는 모습)
- 골프장 고객 단독사진
- 코스에서 여러명 등장
- 웃는 모습
- 키워드: golf-course, solo-with-others, smiling, happy

장면7 (S7): 제품 클로즈업
- 10-15M 이상 제품에 클로즈업
- 골프장비, MASGOO 로고
- 키워드: product, close-up, equipment, masgoo-logo

Guidelines:
- Write in Korean language
- Generate all metadata fields: alt_text, title, description, keywords, age_estimation
- Focus on visual elements: composition, lighting, colors, objects, people, setting
- Include specific golf-related details if present (clubs, courses, players, equipment, etc.)
- Use descriptive adjectives and natural Korean expressions
- Be rich, detailed, and vivid in your descriptions
- **특히 사람의 표정(웃는 모습, 어두운 표정), 장소(골프장, 매장, 실내), 사람 수(단독, 여러명)를 정확히 파악하세요**
- **문서/서류 감지: 흰색 배경에 텍스트, 양식, 표, 체크박스, 입력란 등이 있으면 반드시 "문서", "서류", "양식", "form", "document" 키워드를 포함하세요**
- ALT text: 80-150 words, detailed and vivid description suitable for accessibility
- Title: 25-60 characters, SEO-friendly and engaging
- Description: 100-200 words, rich and detailed description with atmosphere and context
- Keywords: 8-12 golf-related keywords separated by commas (스토리 장면에 맞는 키워드 포함)
- Age estimation: "젊은" (appears 20-40), "시니어" (appears 50+), or "없음" (no people)
- Return ONLY valid JSON format, no additional text

Return format:
{
  "alt_text": "이미지를 설명하는 대체 텍스트 (80-150 words, 상세하고 생생한 설명)",
  "title": "이미지 제목 (25-60자)",
  "description": "이미지 상세 설명 (100-200 words, 풍부하고 맥락이 있는 설명)",
  "keywords": "키워드1, 키워드2, 키워드3, 키워드4, 키워드5, 키워드6, 키워드7, 키워드8",
  "age_estimation": "젊은" | "시니어" | "없음"
}`
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `${sceneDetectionPrompt}이 이미지를 분석하고 모든 메타데이터를 JSON 형식으로 생성해주세요. 

**중요: 문서/서류 감지 우선순위**
- 흰색 배경에 텍스트, 표, 양식, 체크박스가 있으면 반드시 "문서", "서류", "양식", "form", "document" 키워드를 포함하세요
- "고객 기본정보", "피팅 데이터", "Check-point", "사양서" 같은 내용이 보이면 문서로 분류하세요
- 골프 사진이 아닌 문서 이미지인 경우, 골프 관련 키워드를 사용하지 마세요

이미지가 골프 관련이면 골프 이미지를 분석하고, 문서/서류면 문서로 분석하세요. ALT 텍스트, 제목, 설명, 키워드, 연령대 판별을 포함해주세요.

**중요:** 이미지의 다음 요소를 정확히 파악하세요:
- 사람의 표정: 웃는 모습, 행복한 표정, 어두운 표정, 고민하는 표정
- 장소: 골프장(야외), 매장(실내), 스크린 골프, 피팅 스튜디오
- 사람 수: 단독샷, 여러 사람 등장
- 분위기: 여유롭고 평화로운, 고급스러운, 문제 상황, 긍정적인`
            },
            {
              type: "image_url",
              image_url: {
                url: imageUrl
              }
            }
          ]
        }
      ],
      response_format: { type: "json_object" },
      max_tokens: 800,
      temperature: 0.3
    });

    const content = response.choices[0].message.content.trim();
    let metadata;
    
    try {
      metadata = JSON.parse(content);
    } catch (error) {
      console.error('JSON 파싱 오류:', error);
      // JSON 파싱 실패 시 기본값 반환
      metadata = {
        alt_text: content.substring(0, 125),
        title: content.substring(0, 60),
        description: content,
        keywords: '',
        age_estimation: '없음'
      };
    }
    
    // AI 사용량 로깅
    await logOpenAIUsage(
      'analyze-image-prompt',
      'golf_image_analysis',
      response,
      {
        imageUrl: imageUrl,
        title: title,
        excerpt: excerpt
      }
    );

    console.log('✅ 골프 이미지 메타데이터 생성 완료:', metadata);

    res.status(200).json({
      success: true,
      ...metadata,
      source: 'ai_analysis'
    });

  } catch (error) {
    const errorCode = error.code || '';
    const errorMessage = error.message || '';
    console.error('❌ [analyze-image-prompt] 이미지 프롬프트 분석 에러:', { message: errorMessage, code: errorCode, stack: error.stack });
    
    // OpenAI 크레딧 부족 오류 감지
    const isCreditError = 
      errorCode === 'insufficient_quota' ||
      errorCode === 'billing_not_active' ||
      errorMessage.includes('insufficient_quota') ||
      errorMessage.includes('billing') ||
      errorMessage.includes('credit') ||
      errorMessage.includes('payment') ||
      errorMessage.includes('quota');
    
    if (isCreditError) {
      console.error('💰 OpenAI 크레딧 부족 감지:', errorCode, errorMessage);
      return res.status(402).json({
        error: '💰 OpenAI 계정에 크레딧이 부족합니다',
        details: 'OpenAI 계정에 크레딧을 충전해주세요. https://platform.openai.com/settings/organization/billing/overview',
        type: 'golf-ai',
        code: errorCode
      });
    }
    
    res.status(500).json({
      error: '이미지 프롬프트 분석 중 오류가 발생했습니다.',
      details: errorMessage,
      type: 'golf-ai',
      code: errorCode || 'OPENAI_ERROR'
    });
  }
}
