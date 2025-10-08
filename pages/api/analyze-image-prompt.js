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

    // OpenAI Vision API를 사용하여 이미지 분석
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are an expert image analyzer for golf-related content. 
Analyze the given image and create a detailed, vivid Korean description that describes what you see in the image.

Guidelines:
- Write in Korean language
- Focus on visual elements: composition, lighting, colors, objects, people, setting
- Include specific golf-related details if present (clubs, courses, players, equipment, etc.)
- Use descriptive adjectives and natural Korean expressions
- Keep descriptions between 50-100 words
- Make it suitable for SEO and accessibility
- Consider the context: title="${title || '골프 콘텐츠'}", excerpt="${excerpt || '골프 관련 콘텐츠'}"

Generate a compelling Korean description that captures the essence of this image.`
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `이 이미지를 분석하고 이미지에 대한 자세한 한국어 설명을 작성해주세요. 시각적 요소, 구도, 골프 관련 요소에 집중해주세요.`
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
      max_tokens: 300,
      temperature: 0.3
    });

    const prompt = response.choices[0].message.content.trim();
    
    // AI 사용량 로깅
    await logOpenAIUsage(
      'analyze-image-prompt',
      'image_analysis',
      response,
      {
        imageUrl: imageUrl,
        title: title,
        excerpt: excerpt
      }
    );

    console.log('✅ 이미지 프롬프트 생성 완료:', prompt.substring(0, 100) + '...');

    res.status(200).json({
      success: true,
      prompt: prompt,
      source: 'ai_analysis'
    });

  } catch (error) {
    console.error('❌ 이미지 프롬프트 분석 에러:', error);
    res.status(500).json({
      error: '이미지 프롬프트 분석 중 오류가 발생했습니다.',
      details: error.message
    });
  }
}
