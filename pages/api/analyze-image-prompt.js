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
          content: `You are an expert image prompt generator for golf-related content. 
Analyze the given image and create a detailed, vivid English prompt that could be used to generate a similar image.

Guidelines:
- Focus on visual elements: composition, lighting, colors, objects, people, setting
- Include specific golf-related details if present (clubs, courses, players, equipment, etc.)
- Use descriptive adjectives and technical photography terms
- Keep prompts between 50-100 words
- Make it suitable for high-quality AI image generation
- Consider the context: title="${title || 'golf content'}", excerpt="${excerpt || 'golf-related content'}"

Generate a compelling visual prompt that captures the essence of this image.`
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Analyze this image and create a detailed prompt for generating a similar image. Focus on the visual elements, composition, and golf-related aspects if present.`
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
    await logOpenAIUsage({
      model: 'gpt-4o-mini',
      prompt_tokens: response.usage?.prompt_tokens || 0,
      completion_tokens: response.usage?.completion_tokens || 0,
      total_tokens: response.usage?.total_tokens || 0,
      cost: (response.usage?.total_tokens || 0) * 0.00015 / 1000, // gpt-4o-mini pricing
      duration: 0, // Vision API는 시간 측정이 어려움
      endpoint: 'analyze-image-prompt',
      user_id: 'admin',
      metadata: {
        imageUrl: imageUrl,
        title: title,
        excerpt: excerpt
      }
    });

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
