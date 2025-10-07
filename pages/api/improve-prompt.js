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
    const { originalPrompt, userImprovements, brandStrategy } = req.body;

    if (!originalPrompt || !userImprovements) {
      return res.status(400).json({ message: 'Original prompt and user improvements are required' });
    }

    // 브랜드 전략 정보를 프롬프트에 포함
    const brandContext = brandStrategy ? `
브랜드 전략 정보:
- 브랜드 페르소나: ${brandStrategy.brandPersona}
- 콘텐츠 유형: ${brandStrategy.brandContentType}
- 브랜드 강도: ${brandStrategy.brandWeight}
- 오디언스 온도: ${brandStrategy.audienceTemperature}
- 오디언스 가중치: ${brandStrategy.audienceWeight}
` : '';

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `당신은 AI 이미지 생성 프롬프트 개선 전문가입니다.

사용자가 한글로 제공한 수정사항을 바탕으로 기존 영어 프롬프트를 개선해주세요.

개선 규칙:
1. 기존 프롬프트의 구조와 품질을 유지
2. 사용자의 한글 수정사항을 정확히 반영
3. 이미지 생성에 최적화된 영어 프롬프트로 작성
4. 구체적이고 명확한 표현 사용
5. 브랜드 전략 정보를 고려하여 일관성 유지

응답 형식:
- 개선된 프롬프트만 영어로 제공
- 설명이나 추가 텍스트 없이 프롬프트만 반환`
        },
        {
          role: "user",
          content: `기존 프롬프트: "${originalPrompt}"

사용자 수정사항: "${userImprovements}"
${brandContext}

위 수정사항을 반영하여 개선된 영어 프롬프트를 작성해주세요.`
        }
      ],
      temperature: 0.7,
      max_tokens: 400,
    });

    // ChatGPT 사용량 로깅
    await logOpenAIUsage('improve-prompt', 'prompt-improvement', response, {
      originalPrompt: originalPrompt.substring(0, 100) + '...',
      userImprovements
    });

    const improvedPrompt = response.choices[0].message.content.trim();

    res.status(200).json({ 
      success: true, 
      originalPrompt, 
      improvedPrompt, 
      userImprovements 
    });

  } catch (error) {
    console.error('프롬프트 개선 오류:', error);
    res.status(500).json({ 
      message: 'Failed to improve prompt',
      error: error.message 
    });
  }
}
