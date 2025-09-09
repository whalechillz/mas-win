import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { 
    title, 
    excerpt, 
    contentType = 'information',
    brandStrategy = {
      customerPersona: 'competitive_maintainer',
      customerChannel: 'local_customers',
      brandWeight: 'medium'
    },
    model = 'dalle3' // 'dalle3' 또는 'fal'
  } = req.body;

  if (!title) {
    return res.status(400).json({ message: 'Title is required' });
  }

  try {
    console.log('🤖 ChatGPT로 스마트 프롬프트 생성 시작...');
    
    // ChatGPT에게 프롬프트 생성 요청
    const promptGenerationResponse = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `당신은 전문적인 AI 이미지 생성 프롬프트 작성자입니다. 
          
          요약 내용을 바탕으로 마케팅에 최적화된 이미지 프롬프트를 작성해주세요.
          
          ${model === 'fal' ? 
            'FAL AI hidream-i1-dev 모델용으로 간단하고 명확한 프롬프트를 생성합니다. 이 모델은 복잡한 프롬프트보다는 간단한 키워드 스타일을 선호합니다.' :
            'DALL-E 3 모델용으로 고품질 마케팅 이미지를 생성합니다.'
          }
          
          프롬프트 작성 규칙:
          1. 요약 내용의 핵심을 시각적으로 표현
          2. 한국인 50-70대 골퍼가 주인공
          3. MASSGOO 브랜드 드라이버 포함
          4. 자연스러운 골프장 환경
          5. 전문적인 마케팅 이미지 스타일
          6. 텍스트나 글자는 절대 포함하지 않음
          7. 깔끔하고 전문적인 구성
          8. 다양한 상황과 장면 생성 (항상 드라이버만 들고 있는 모습 피하기)
          9. 다양한 시간대와 환경 활용 (아침, 오후, 실내, 실외 등)
          10. 다양한 포즈와 행동 (상담, 테스트, 플레이, 만족 등)
          
          ${model === 'fal' ? 
            `FAL AI용 구체적이고 명확한 프롬프트 규칙:
            - 구체적인 인물 묘사: "Korean senior golfer (60-65 years old Asian man)"
            - 구체적인 의상: "wearing elegant white polo shirt and beige golf pants"
            - 구체적인 시간/조명: "at golden hour sunset", "warm golden sunlight"
            - 구체적인 장소: "on premium golf course", "luxury golf course background"
            - 구체적인 포즈: "confident stance with MASSGOO driver" (반드시 MASSGOO 브랜드명 사용)
            - 구체적인 외모: "Korean facial features, silver/gray hair"
            - 구체적인 스타일: "photorealistic, high-end commercial photography style"
            - 구체적인 비율: "16:9 aspect ratio"
            - 피해야 할 것: "no text, no abstract, no artistic effects"` :
            `DALL-E 3용 상세한 프롬프트 규칙:
            - Ultra-realistic, photorealistic 스타일
            - Natural lighting, professional sports photography
            - 85mm lens, shallow depth of field
            - Detailed skin and fabric textures
            - Full body composition
            - 절대 피해야 할 요소들: illustration, painting, cartoon, anime, watercolor, pointillism, dots, stippling, abstract, flat colors, over-saturation, exaggerated colors, posterized, low detail, text, watermark, artifacts`
          }
          
          응답은 영어로 된 이미지 생성 프롬프트만 제공하세요.`
        },
        {
          role: "user",
          content: `제목: "${title}"
          
          요약: "${excerpt || '요약이 없습니다.'}"
          
          콘텐츠 유형: ${contentType}
          고객 페르소나: ${brandStrategy.customerPersona}
          고객 채널: ${brandStrategy.customerChannel}
          브랜드 강도: ${brandStrategy.brandWeight}
          
          위 정보를 바탕으로 ${model === 'fal' ? 'FAL AI' : 'DALL-E 3'}용 이미지 생성 프롬프트를 작성해주세요.`
        }
      ],
      max_tokens: 500,
      temperature: 0.7
    });

    const generatedPrompt = promptGenerationResponse.choices[0].message.content;
    
    console.log('✅ ChatGPT 프롬프트 생성 완료');
    console.log('생성된 프롬프트:', generatedPrompt);

    res.status(200).json({ 
      success: true,
      prompt: generatedPrompt,
      model: model,
      metadata: {
        title,
        excerpt,
        contentType,
        brandStrategy,
        generatedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('❌ ChatGPT 프롬프트 생성 에러:', error);
    res.status(500).json({ 
      message: 'Failed to generate smart prompt with ChatGPT', 
      error: error.message 
    });
  }
}
