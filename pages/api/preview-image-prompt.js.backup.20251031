import { 
  CONTENT_STRATEGY,
  CUSTOMER_PERSONAS,
  CUSTOMER_CHANNELS,
  generateBrandMessage,
  generatePainPointMessage
} from '../../lib/masgolf-brand-data';

// DALL-E 3 프롬프트 생성 함수
const createDALLE3Prompt = (title, excerpt, contentType, brandStrategy) => {
  const persona = CUSTOMER_PERSONAS[brandStrategy.customerPersona] || CUSTOMER_PERSONAS.competitive_maintainer;
  const channel = CUSTOMER_CHANNELS[brandStrategy.customerChannel] || CUSTOMER_CHANNELS.local_customers;
  
  let basePrompt = `Professional golf marketing image for MASSGOO brand: "${title}"`;
  
  // 콘텐츠 유형별 프롬프트 조정
  switch (contentType) {
    case 'customer_story':
      basePrompt += `. Show a satisfied Korean senior golfer (50-70 years old, Korean ethnicity, Asian features) holding a premium MASSGOO driver, with a confident and happy expression. Include a golf course background with beautiful green fairways.`;
      break;
    case 'tutorial':
      basePrompt += `. Show a professional Korean golf instructor (50-60 years old, Korean ethnicity) demonstrating proper driver technique. Include educational elements and clear instruction.`;
      break;
    case 'testimonial':
      basePrompt += `. Show a testimonial-style image with a satisfied Korean customer (50-70 years old, Korean ethnicity) holding a MASSGOO driver. Include a clean, trustworthy background.`;
      break;
    case 'visual_guide':
      basePrompt += `. Show a detailed product shot of MASSGOO driver with technical specifications, premium materials (titanium), and high-quality finish. Studio lighting, clean background.`;
      break;
    case 'event':
      basePrompt += `. Show an exciting golf event or promotion scene, with multiple Korean golfers (50-70 years old, Korean ethnicity), MASSGOO branding, and an energetic atmosphere.`;
      break;
    default:
      basePrompt += `. Show a premium golf driver in a professional setting, with clean modern design and high-quality materials.`;
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
  
  basePrompt += ` Photography style: Ultra-realistic, photorealistic, professional sports photography, natural lighting, high-end DSLR camera quality, 85mm lens, shallow depth of field, detailed skin and fabric textures, full body composition, authentic Korean people, natural expressions, soft natural light, outdoor or well-lit indoor setting, professional portrait photography, marketing-quality image. STRICTLY AVOID: illustration, painting, cartoon, anime, watercolor, pointillism, dots, stippling, abstract, flat colors, over-saturation, exaggerated colors, posterized, low detail, text overlays, Korean text, random text, any text, any writing, any letters, any words, any symbols, watermark, artifacts. Focus on: clean composition, no text, no writing, no symbols, realistic photography only. Colors: Natural green grass, blue sky, white clouds, and subtle gold accents. Aspect ratio: 16:9. High resolution, marketing-ready, text-free image.`;
  
  return basePrompt;
};

// FAL AI 프롬프트 생성 함수
const createFALPrompt = (title, excerpt, contentType, brandStrategy) => {
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
    model = 'dalle3' // 'dalle3' 또는 'fal'
  } = req.body;

  if (!title) {
    return res.status(400).json({ message: 'Title is required' });
  }

  try {
    let prompt;
    
    if (model === 'fal') {
      prompt = createFALPrompt(title, excerpt, contentType, brandStrategy);
    } else {
      prompt = createDALLE3Prompt(title, excerpt, contentType, brandStrategy);
    }

    res.status(200).json({ 
      success: true,
      prompt: prompt,
      model: model,
      metadata: {
        title,
        contentType,
        brandStrategy,
        generatedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('❌ 프롬프트 미리보기 에러:', error);
    res.status(500).json({ 
      message: 'Failed to generate prompt preview', 
      error: error.message 
    });
  }
}
