import OpenAI from 'openai';
import { 
  CONTENT_STRATEGY,
  CUSTOMER_PERSONAS,
  CUSTOMER_CHANNELS,
  generateBrandMessage,
  generatePainPointMessage
} from '../../lib/masgolf-brand-data';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// 이미지 생성 프롬프트 최적화
const createImagePrompt = (title, excerpt, contentType, brandStrategy) => {
  const persona = CUSTOMER_PERSONAS[brandStrategy.customerPersona] || CUSTOMER_PERSONAS.competitive_maintainer;
  const channel = CUSTOMER_CHANNELS[brandStrategy.customerChannel] || CUSTOMER_CHANNELS.local_customers;
  
  let basePrompt = `Professional golf marketing image for MASSGOO brand: "${title}"`;
  
  // 콘텐츠 유형별 프롬프트 조정
  switch (contentType) {
    case 'customer_story':
      basePrompt += `. Show a satisfied Korean senior golfer (50-70 years old, Korean ethnicity, Asian features) holding a premium MASSGOO driver, with a confident and happy expression. Include a golf course background with beautiful green fairways.`;
      break;
    case 'tutorial':
      basePrompt += `. Show a professional Korean golf instructor (50-60 years old, Korean ethnicity) demonstrating proper driver technique, with technical diagrams or measurements visible. Clean, educational atmosphere.`;
      break;
    case 'testimonial':
      basePrompt += `. Show a testimonial-style image with a satisfied Korean customer (50-70 years old, Korean ethnicity) holding a MASSGOO driver, with a subtle testimonial quote overlay. Professional and trustworthy.`;
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
  
  // 사진 촬영 스타일 가이드 (negative_prompt 개념 적용)
  basePrompt += ` Photography style: Ultra-realistic, photorealistic, professional sports photography, natural lighting, high-end DSLR camera quality, 85mm lens, shallow depth of field, detailed skin and fabric textures, full body composition, authentic Korean people, natural expressions, soft natural light, outdoor or well-lit indoor setting, professional portrait photography, marketing-quality image. STRICTLY AVOID: illustration, painting, cartoon, anime, watercolor, pointillism, dots, stippling, abstract, flat colors, over-saturation, exaggerated colors, posterized, low detail, text overlays, Korean text, random text, any text, any writing, any letters, any words, any symbols, watermark, artifacts. Focus on: clean composition, no text, no writing, no symbols, realistic photography only. Colors: Natural green grass, blue sky, white clouds, and subtle gold accents. Aspect ratio: 16:9. High resolution, marketing-ready, text-free image.`;
  
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
    console.log('🎨 AI 이미지 생성 시작...');
    console.log('제목:', title);
    console.log('콘텐츠 유형:', contentType);
    
    // 이미지 생성 프롬프트 생성 (ChatGPT 프롬프트 우선 사용)
    const imagePrompt = customPrompt || createImagePrompt(title, excerpt, contentType, brandStrategy);
    console.log('사용된 프롬프트:', customPrompt ? 'ChatGPT 생성 프롬프트' : '기본 프롬프트');
    console.log('프롬프트 내용:', imagePrompt);
    
    // 이미지 개수 제한 (1-4개)
    const validImageCount = Math.min(Math.max(imageCount, 1), 4);
    
    // OpenAI DALL-E 3로 이미지 생성
    const response = await openai.images.generate({
      model: "dall-e-3",
      prompt: imagePrompt,
      size: "1024x1024",
      quality: "standard",
      n: validImageCount,
    });

    const imageUrls = response.data.map(item => item.url);
    console.log('✅ 이미지 생성 완료:', imageUrls.length, '개');

    res.status(200).json({ 
      success: true,
      imageUrl: imageUrls[0], // 첫 번째 이미지 (기존 호환성)
      imageUrls: imageUrls, // 모든 이미지 URL 배열
      imageCount: imageUrls.length,
      prompt: imagePrompt,
      metadata: {
        title,
        contentType,
        brandStrategy,
        generatedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('❌ 이미지 생성 에러:', error);
    res.status(500).json({ 
      message: 'Failed to generate image', 
      error: error.message 
    });
  }
}
