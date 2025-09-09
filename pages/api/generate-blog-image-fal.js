import { 
  CONTENT_STRATEGY,
  CUSTOMER_PERSONAS,
  CUSTOMER_CHANNELS,
  generateBrandMessage,
  generatePainPointMessage
} from '../../lib/masgolf-brand-data';

// FAL AI 이미지 생성 프롬프트 최적화 (hidream-i1-dev 모델용)
const createFALImagePrompt = (title, excerpt, contentType, brandStrategy) => {
  const persona = CUSTOMER_PERSONAS[brandStrategy.customerPersona] || CUSTOMER_PERSONAS.competitive_maintainer;
  const channel = CUSTOMER_CHANNELS[brandStrategy.customerChannel] || CUSTOMER_CHANNELS.local_customers;
  
  let basePrompt = `Professional golf marketing image for MASSGOO brand: "${title}"`;
  
  // 콘텐츠 유형별 프롬프트 조정 (한국 골프장 실사 스타일)
  switch (contentType) {
    case 'customer_story':
      basePrompt += `. Show a satisfied Korean senior golfer (50-70 years old, Korean ethnicity, Asian features) holding a premium MASSGOO driver on a real Korean golf course. Include authentic Korean golf course background with beautiful green fairways, Korean-style golf course architecture, and natural Korean landscape.`;
      break;
    case 'tutorial':
      basePrompt += `. Show a professional Korean golf instructor (50-60 years old, Korean ethnicity) demonstrating proper driver technique on a Korean golf course driving range. Include Korean golf course facilities and natural Korean environment.`;
      break;
    case 'testimonial':
      basePrompt += `. Show a testimonial-style image with a satisfied Korean customer (50-70 years old, Korean ethnicity) holding a MASSGOO driver on a Korean golf course. Include authentic Korean golf course setting with natural Korean landscape.`;
      break;
    case 'visual_guide':
      basePrompt += `. Show a detailed product shot of MASSGOO driver with technical specifications, premium materials (titanium), and high-quality finish. Studio lighting, clean background.`;
      break;
    case 'event':
      basePrompt += `. Show an exciting golf event or promotion scene on a Korean golf course, with multiple Korean golfers (50-70 years old, Korean ethnicity), MASSGOO branding, and an energetic atmosphere. Include authentic Korean golf course setting.`;
      break;
    default:
      basePrompt += `. Show a premium golf driver in a professional Korean golf course setting, with clean modern design and high-quality materials.`;
  }
  
  // 브랜드 강도에 따른 조정
  if (brandStrategy.brandWeight === 'high') {
    basePrompt += ` Prominently feature MASSGOO branding and logo.`;
  }
  
  // 고객 페르소나에 따른 조정
  if (persona.name.includes('시니어')) {
    basePrompt += ` Focus on Korean senior golfers (50-70 years old, Korean ethnicity, Asian features) and age-appropriate styling.`;
  } else if (persona.name.includes('상급')) {
    basePrompt += ` Show advanced Korean golfers (50-60 years old, Korean ethnicity) with premium equipment and professional appearance.`;
  }
  
  // FAL AI hidream-i1-dev 모델용 구체적이고 명확한 프롬프트 (성공 사례 참고)
  basePrompt += ` Korean senior golfer (60-65 years old Asian man) at golden hour sunset on premium golf course, wearing elegant white polo shirt and beige golf pants, confident stance with MASSGOO driver, warm golden sunlight creating long shadows, Korean facial features, silver/gray hair, luxury golf course background with pristine fairway, photorealistic, high-end commercial photography style, golden hour lighting, no text, no abstract, no artistic effects.`;
  
  return basePrompt;
};

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
    imageCount = 1, // 생성할 이미지 개수 (1-4개)
    customPrompt = null // ChatGPT로 생성한 커스텀 프롬프트
  } = req.body;

  if (!title) {
    return res.status(400).json({ message: 'Title is required' });
  }

  try {
    console.log('🎨 FAL AI 이미지 생성 시작...');
    console.log('제목:', title);
    console.log('콘텐츠 유형:', contentType);
    
    // 이미지 생성 프롬프트 생성 (ChatGPT 프롬프트 우선 사용)
    const imagePrompt = customPrompt || createFALImagePrompt(title, excerpt, contentType, brandStrategy);
    console.log('사용된 프롬프트:', customPrompt ? 'ChatGPT 생성 프롬프트' : '기본 프롬프트');
    console.log('프롬프트 내용:', imagePrompt);
    
    // 이미지 개수 제한 (1-4개)
    const validImageCount = Math.min(Math.max(imageCount, 1), 4);
    
    // FAL AI hidream-i1-dev 모델로 이미지 생성
    const falResponse = await fetch('https://fal.run/fal-ai/hidream-i1-dev', {
      method: 'POST',
      headers: {
        'Authorization': `Key ${process.env.FAL_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt: imagePrompt,
        num_images: validImageCount,
        image_size: "square", // FAL AI 지원 형식 (1024x1024와 유사)
        num_inference_steps: 28, // 성공 사례와 동일한 설정
        seed: null
      })
    });

    if (!falResponse.ok) {
      const error = await falResponse.text();
      console.error('FAL AI API 에러:', error);
      throw new Error(`FAL AI API 에러: ${error}`);
    }

    const falResult = await falResponse.json();
    console.log('FAL AI 응답:', falResult);
    
    // FAL AI 응답에서 이미지 URL 추출
    const imageUrls = falResult.images || [];
    console.log('✅ FAL AI 이미지 생성 완료:', imageUrls.length, '개');

    res.status(200).json({ 
      success: true,
      imageUrl: imageUrls[0]?.url || imageUrls[0], // 첫 번째 이미지 (기존 호환성)
      imageUrls: imageUrls.map(img => img.url || img), // 모든 이미지 URL 배열
      imageCount: imageUrls.length,
      prompt: imagePrompt,
      model: 'fal-ai/hidream-i1-dev',
      metadata: {
        title,
        contentType,
        brandStrategy,
        generatedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('❌ FAL AI 이미지 생성 에러:', error);
    res.status(500).json({ 
      message: 'Failed to generate image with FAL AI', 
      error: error.message 
    });
  }
}
