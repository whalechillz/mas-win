import OpenAI from 'openai';
import { logOpenAIUsage } from '../../lib/ai-usage-logger';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { imageUrl, title, excerpt } = req.body;

    if (!imageUrl) {
      return res.status(400).json({ message: 'Image URL is required' });
    }

    console.log('🔍 이미지 프롬프트 분석 시작:', imageUrl);
    console.log('🔧 OpenAI API 키 확인:', process.env.OPENAI_API_KEY ? '설정됨' : '누락');

    // OpenAI Vision API를 사용하여 골프 특화 이미지 분석 (모든 메타데이터 한 번에 생성)
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are an expert image analyzer for golf-related content. 
Analyze the given image and generate all metadata in JSON format.

Guidelines:
- Write in Korean language
- Generate all metadata fields: alt_text, title, description, keywords, age_estimation
- Focus on visual elements: composition, lighting, colors, objects, people, setting
- Include specific golf-related details if present (clubs, courses, players, equipment, etc.)
- Use descriptive adjectives and natural Korean expressions
- Be rich, detailed, and vivid in your descriptions
- ALT text: 80-150 words, detailed and vivid description suitable for accessibility
- Title: 25-60 characters, SEO-friendly and engaging
- Description: 100-200 words, rich and detailed description with atmosphere and context
- Keywords: 8-12 golf-related keywords separated by commas
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
              text: `이 골프 이미지를 분석하고 모든 메타데이터를 JSON 형식으로 생성해주세요. ALT 텍스트, 제목, 설명, 키워드, 연령대 판별을 포함해주세요.`
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
    console.error('❌ 이미지 프롬프트 분석 에러:', error);
    
    // OpenAI 크레딧 부족 오류 감지
    const errorCode = error.code || '';
    const errorMessage = error.message || '';
    
    // 크레딧 부족 관련 오류 코드/메시지 확인
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
        type: 'insufficient_credit',
        code: errorCode
      });
    }
    
    res.status(500).json({
      error: '이미지 프롬프트 분석 중 오류가 발생했습니다.',
      details: error.message
    });
  }
}
