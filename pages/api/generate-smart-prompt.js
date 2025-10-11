import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// 콘텐츠 유형 자동 감지 함수
function detectContentType(title, excerpt) {
  const content = `${title} ${excerpt || ''}`.toLowerCase();
  
  // 식당/음식 관련 키워드
  const restaurantKeywords = ['식당', '맛집', '음식', '요리', '레스토랑', '카페', '샤브', '뷔페', '한식', '중식', '일식', '양식', '후기', '리뷰'];
  const restaurantMatches = restaurantKeywords.filter(keyword => content.includes(keyword));
  
  // 골프 관련 키워드
  const golfKeywords = ['골프', '드라이버', '아이언', '퍼터', '골프장', '골프클럽', '비거리', '핸디캡', '골퍼', '라운드'];
  const golfMatches = golfKeywords.filter(keyword => content.includes(keyword));
  
  // 여행/휴양 관련 키워드
  const travelKeywords = ['여행', '휴양', '관광', '호텔', '펜션', '리조트', '해변', '산', '계곡', '온천'];
  const travelMatches = travelKeywords.filter(keyword => content.includes(keyword));
  
  // 쇼핑/제품 관련 키워드
  const shoppingKeywords = ['구매', '제품', '상품', '할인', '특가', '리뷰', '사용후기', '성능', '가격'];
  const shoppingMatches = shoppingKeywords.filter(keyword => content.includes(keyword));
  
  // 매칭 점수 계산
  const scores = {
    restaurant: restaurantMatches.length,
    golf: golfMatches.length,
    travel: travelMatches.length,
    shopping: shoppingMatches.length
  };
  
  // 가장 높은 점수의 카테고리 반환
  const maxScore = Math.max(...Object.values(scores));
  if (maxScore === 0) return 'general'; // 매칭되는 키워드가 없으면 일반
  
  const detectedType = Object.keys(scores).find(key => scores[key] === maxScore);
  
  console.log(`🔍 콘텐츠 분석 결과:`, {
    restaurant: restaurantMatches,
    golf: golfMatches,
    travel: travelMatches,
    shopping: shoppingMatches,
    detectedType
  });
  
  return detectedType;
}

// 사용자 설정 조회 함수
async function getUserSettings() {
  try {
    const response = await fetch(`${process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000'}/api/user-settings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'get' })
    });
    
    if (!response.ok) {
      console.warn('사용자 설정 조회 실패, 기본값 사용');
      return getDefaultSettings();
    }
    
    const result = await response.json();
    return result.settings || getDefaultSettings();
    
  } catch (error) {
    console.warn('사용자 설정 조회 오류:', error);
    return getDefaultSettings();
  }
}

// 기본 설정 반환
function getDefaultSettings() {
  return {
    autoDetectContentType: true,
    defaultContentType: 'golf',
    brandStrategy: {
      customerPersona: 'competitive_maintainer',
      customerChannel: 'local_customers',
      brandWeight: 'medium',
      audienceTemperature: 'warm'
    },
    contentTypeOverrides: {
      restaurant: {
        customerPersona: 'food_lover',
        brandWeight: 'low',
        audienceTemperature: 'neutral'
      },
      travel: {
        customerPersona: 'leisure_seeker',
        brandWeight: 'low',
        audienceTemperature: 'warm'
      },
      shopping: {
        customerPersona: 'value_seeker',
        brandWeight: 'high',
        audienceTemperature: 'neutral'
      }
    }
  };
}

// 브랜드 전략 적용 함수
function applyBrandStrategy(contentType, originalBrandStrategy, userSettings) {
  const override = userSettings.contentTypeOverrides?.[contentType];
  
  if (override) {
    return {
      ...originalBrandStrategy,
      ...override
    };
  }
  
  return originalBrandStrategy;
}

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
    model = 'dalle3', // 'dalle3', 'fal', 'kie', 'fal-variation', 'replicate-flux', 'stability-ai'
    preset = 'creative' // 'creative', 'balanced', 'precise', 'ultra_precise'
  } = req.body;

  if (!title) {
    return res.status(400).json({ message: 'Title is required' });
  }

  try {
    console.log('🤖 ChatGPT로 스마트 프롬프트 생성 시작...');
    
    // 사용자 설정 조회
    const userSettings = await getUserSettings();
    console.log('⚙️ 사용자 설정:', userSettings);
    
    // 콘텐츠 유형 결정 (자동 감지 또는 수동 설정)
    let finalContentType = contentType;
    if (userSettings.autoDetectContentType) {
      const detectedContentType = detectContentType(title, excerpt);
      finalContentType = detectedContentType;
      console.log(`📝 자동 감지된 콘텐츠 유형: ${detectedContentType}`);
    } else {
      finalContentType = userSettings.defaultContentType || contentType;
      console.log(`📝 사용자 설정 콘텐츠 유형: ${finalContentType}`);
    }
    
    // 브랜드 전략 적용
    const appliedBrandStrategy = applyBrandStrategy(finalContentType, brandStrategy, userSettings);
    console.log('🎯 적용된 브랜드 전략:', appliedBrandStrategy);
    
    // 프리셋별 프롬프트 생성 전략 설정
    const presetInstructions = {
      creative: "창의적이고 다양한 이미지를 생성합니다. 새로운 구도, 색감, 배경을 자유롭게 활용하여 독창적인 이미지를 만듭니다.",
      balanced: "창의성과 정확성의 균형을 맞춘 이미지를 생성합니다. 적절한 변화를 주면서도 콘텐츠의 핵심을 유지합니다.",
      precise: "원본 콘텐츠에 충실한 정확한 이미지를 생성합니다. 제품 사진이나 정확한 표현이 필요한 경우에 적합합니다.",
      ultra_precise: "매우 정밀하고 세밀한 이미지를 생성합니다. 배경, 구도, 색감, 인물 특성을 최대한 유지하면서 최소한의 변화만 줍니다."
    };
    
    console.log(`🎨 프리셋 적용: ${preset} - ${presetInstructions[preset]}`);
    
    // ChatGPT에게 프롬프트 생성 요청
    const promptGenerationResponse = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `당신은 전문적인 AI 이미지 생성 프롬프트 작성자입니다. 
          
          요약 내용을 바탕으로 마케팅에 최적화된 이미지 프롬프트를 작성해주세요.
          
          **현재 프리셋: ${preset}**
          ${presetInstructions[preset]}
          
          ${model === 'fal' ? 
            'FAL AI hidream-i1-dev 모델용으로 간단하고 명확한 프롬프트를 생성합니다. 이 모델은 복잡한 프롬프트보다는 간단한 키워드 스타일을 선호합니다.' :
            model === 'kie' ?
            'Kie AI GPT-4O 모델용으로 고품질 이미지 프롬프트를 생성합니다.' :
            model === 'fal-variation' ?
            'FAL AI Image-to-Image 변형용으로 기존 이미지를 변형할 수 있는 프롬프트를 생성합니다.' :
            model === 'replicate-flux' ?
            'Replicate Flux 모델용으로 고품질 변형 프롬프트를 생성합니다.' :
            model === 'stability-ai' ?
            'Stability AI 모델용으로 안정적인 변형 프롬프트를 생성합니다.' :
            'DALL-E 3 모델용으로 고품질 마케팅 이미지를 생성합니다.'
          }
          
          프롬프트 작성 규칙:
          1. 요약 내용의 핵심을 시각적으로 표현
          2. ${finalContentType === 'restaurant' ? 
            '한국인 50-70대가 식당에서 식사하는 모습' :
            finalContentType === 'travel' ?
            '한국인 50-70대가 여행지에서 휴식을 취하는 모습' :
            finalContentType === 'shopping' ?
            '한국인 50-70대가 제품을 사용하거나 구매하는 모습' :
            '한국인 50-70대 골퍼가 주인공'
          }
          3. ${finalContentType === 'golf' ? 'MASSGOO 브랜드 드라이버 포함' : '해당 콘텐츠에 맞는 브랜드 요소 포함'}
          4. ${finalContentType === 'restaurant' ? '자연스러운 식당 환경' :
            finalContentType === 'travel' ? '자연스러운 여행지 환경' :
            finalContentType === 'shopping' ? '자연스러운 사용 환경' :
            '자연스러운 골프장 환경'
          }
          5. 전문적인 마케팅 이미지 스타일
          6. 텍스트나 글자는 절대 포함하지 않음
          7. 깔끔하고 전문적인 구성
          8. 다양한 상황과 장면 생성
          9. 다양한 시간대와 환경 활용 (아침, 오후, 실내, 실외 등)
          10. 다양한 포즈와 행동 (${finalContentType === 'restaurant' ? '식사, 만족, 후기' :
            finalContentType === 'travel' ? '휴식, 관광, 만족' :
            finalContentType === 'shopping' ? '사용, 테스트, 만족' :
            '상담, 테스트, 플레이, 만족'
          })
          
          **프리셋별 특별 지시사항:**
          ${preset === 'creative' ? 
            '- 창의적이고 독창적인 구도와 색감 사용\n- 새로운 배경과 환경 시도\n- 다양한 조명과 분위기 활용\n- 예술적이고 감성적인 표현' :
            preset === 'balanced' ?
            '- 적절한 창의성과 정확성의 균형\n- 안정적인 구도와 색감\n- 일반적으로 인정받는 스타일\n- 마케팅에 적합한 균형잡힌 표현' :
            preset === 'precise' ?
            '- 정확하고 세밀한 표현\n- 제품이나 서비스의 핵심 특징 강조\n- 명확하고 구체적인 묘사\n- 전문적이고 신뢰할 수 있는 이미지' :
            '- 매우 정밀하고 세밀한 표현\n- 모든 세부사항을 정확히 유지\n- 최소한의 변화만 허용\n- 완벽한 정확성을 추구하는 이미지'
          }
          
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
