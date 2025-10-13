import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { 
      koreanPrompt,
      originalEnglishPrompt,
      model = 'fal' // 'fal', 'replicate', 'stability'
    } = req.body;

    console.log('🔄 한글 프롬프트 영문 번역 요청:', { 
      koreanPrompt,
      model
    });

    if (!koreanPrompt) {
      return res.status(400).json({ 
        error: '한글 프롬프트가 필요합니다.' 
      });
    }

    // ChatGPT를 사용하여 한글 프롬프트를 영문으로 번역
    const translationResponse = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `당신은 전문적인 이미지 생성 프롬프트 번역가입니다. 

각 AI 모델의 특성을 이해하고 최적화된 영문 프롬프트를 생성합니다:

1. **FAL AI (Flux 모델)**: 빠르고 저비용, 실사 스타일, 간결한 프롬프트 선호
2. **Replicate (Stable Diffusion)**: 안정적, 중간 비용, 상세한 기술적 프롬프트 선호  
3. **Stability AI (SDXL)**: 고품질, 고해상도, 전문적 용어와 구체적 스펙 선호

⚠️ 중요 지침:
1. 원본 영문 프롬프트의 스타일과 구조를 참고하여 일관성을 유지하세요
2. 한글 프롬프트의 의미를 정확히 파악하고 영문으로 자연스럽게 번역하세요
3. 각 모델의 특성에 맞는 전문 용어와 스타일을 사용하세요
4. 이미지 생성에 필요한 구체적인 시각적 요소들을 포함하세요
5. 품질 관련 키워드 (high quality, professional, photorealistic 등)를 적절히 포함하세요
6. 원본 프롬프트의 핵심 요소들을 유지하면서 새로운 요청사항을 반영하세요

번역 시 다음 형식으로 응답하세요:
{
  "translatedPrompt": "번역된 영문 프롬프트",
  "translationNotes": "번역 시 주요 변경사항이나 고려사항"
}`
        },
        {
          role: "user",
          content: `원본 영문 프롬프트: ${originalEnglishPrompt}

수정된 한글 프롬프트: ${koreanPrompt}

위 한글 프롬프트를 ${model.toUpperCase()} 모델에 최적화된 영문 프롬프트로 번역해주세요.

⚠️ 중요:
1. 원본 영문 프롬프트의 스타일과 구조를 참고하세요
2. 한글 프롬프트의 새로운 요청사항을 정확히 반영하세요
3. ${model.toUpperCase()} 모델의 특성에 맞는 전문 용어를 사용하세요
4. 이미지 생성에 필요한 구체적인 시각적 요소들을 포함하세요
5. 품질과 스타일 관련 키워드를 적절히 포함하세요

번역된 영문 프롬프트를 JSON 형식으로 제공해주세요.`
        }
      ],
      max_tokens: 500,
      temperature: 0.3
    });

    const translationResult = JSON.parse(translationResponse.choices[0].message.content);
    
    console.log('✅ 한글 프롬프트 영문 번역 완료:', translationResult);

    res.status(200).json({
      success: true,
      translatedPrompt: translationResult.translatedPrompt,
      translationNotes: translationResult.translationNotes,
      originalKoreanPrompt: koreanPrompt,
      originalEnglishPrompt: originalEnglishPrompt,
      model: model.toUpperCase(),
      usageInfo: {
        model: 'GPT-4o-mini',
        tokens: translationResponse.usage?.total_tokens || 0,
        cost: translationResponse.usage?.total_tokens ? (translationResponse.usage.total_tokens * 0.00015 / 1000).toFixed(4) : '0.0000'
      }
    });

  } catch (error) {
    console.error('❌ 한글 프롬프트 번역 오류:', error);
    const errorMessage = error?.message || error?.toString() || '알 수 없는 오류가 발생했습니다.';
    res.status(500).json({ 
      error: '한글 프롬프트 번역 중 오류가 발생했습니다.',
      details: errorMessage 
    });
  }
}
