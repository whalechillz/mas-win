import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// 고객 페르소나 정의
const CUSTOMER_PERSONAS = {
  competitive_maintainer: {
    name: '경쟁력 유지형 시니어 골퍼',
    description: '기존 실력을 유지하면서 점진적 개선을 원하는 50-70대 골퍼',
    characteristics: ['안정적', '경험적', '신중한 선택']
  },
  performance_seeker: {
    name: '성능 추구형 상급 골퍼',
    description: '최고의 성능과 기술적 우위를 추구하는 50-60대 골퍼',
    characteristics: ['기술적', '성능 중심', '프리미엄 선호']
  },
  beginner_enthusiast: {
    name: '초보 열정형 골퍼',
    description: '골프를 새롭게 시작하여 빠른 성장을 원하는 40-60대 골퍼',
    characteristics: ['학습적', '열정적', '가이드 필요']
  }
};

// 고객 채널 정의
const CUSTOMER_CHANNELS = {
  local_customers: {
    name: '지역 고객',
    description: '매장 방문 및 지역 기반 고객',
    characteristics: ['직접 방문', '피팅 서비스', '지속적 관계']
  },
  online_customers: {
    name: '온라인 고객',
    description: '온라인을 통한 구매 및 상담 고객',
    characteristics: ['디지털 네이티브', '편의성 중시', '정보 검색']
  }
};

// 구글 AI 이미지 생성 프롬프트 최적화 (Imagen/Gemini 기반)
const createGoogleImagePrompt = (title, excerpt, contentType, brandStrategy) => {
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
  
  // 구글 AI 최적화 프롬프트 (FAL AI 수준의 강력한 실사 스타일)
  basePrompt += ` Photography style: Ultra-realistic, photorealistic, professional sports photography, natural lighting, high-end DSLR camera quality, 85mm lens, shallow depth of field, detailed skin and fabric textures, full body composition, authentic Korean people, natural expressions, soft natural light, outdoor or well-lit indoor setting, professional portrait photography, marketing-quality image, documentary photography style, candid moment, real person, genuine emotion, no illustration, no cartoon, no digital art, no painting, no sketch, no drawing, no artistic effects, no filters, no post-processing effects, raw photography, authentic moment, real life, natural skin texture, realistic hair, realistic clothing, realistic environment, professional commercial photography, editorial photography style. STRICTLY AVOID: illustration, painting, cartoon, anime, watercolor, pointillism, dots, stippling, abstract, flat colors, over-saturation, exaggerated colors, posterized, low detail, text overlays, Korean text, random text, any text, any writing, any letters, any words, any symbols, watermark, artifacts. Focus on: clean composition, no text, no writing, no symbols, realistic photography only. Colors: Natural green grass, blue sky, white clouds, and subtle gold accents. Aspect ratio: 16:9. High resolution, marketing-ready, text-free image. ABSOLUTELY NO TEXT: no text, no writing, no letters, no words, no symbols, no Korean text, no English text, no promotional text, no marketing copy, no overlays, no watermarks, no captions, no subtitles, no labels, no brand names, no product names, no slogans, no quotes, no numbers, no dates, no signatures, no logos, no text elements whatsoever. Pure clean image without any textual content. Text-free image only.`;
  
  return basePrompt;
};

// Supabase에 이미지 저장
async function saveImageToSupabase(imageUrl, folder = 'blog-images') {
  try {
    const response = await fetch(imageUrl);
    if (!response.ok) {
      throw new Error(`Failed to download image: ${response.statusText}`);
    }
    
    const imageBuffer = await response.arrayBuffer();
    const fileName = `${folder}/${Date.now()}-${Math.random().toString(36).substring(2, 15)}.png`;
    
    const { data, error } = await supabase.storage
      .from('blog-images')
      .upload(fileName, imageBuffer, {
        contentType: 'image/png',
        upsert: false,
      });
    
    if (error) {
      throw error;
    }
    
    const { data: publicUrlData } = supabase.storage
      .from('blog-images')
      .getPublicUrl(fileName);
    
    return { publicUrl: publicUrlData.publicUrl, fileName: fileName };
  } catch (error) {
    console.error('Supabase 이미지 저장 오류:', error);
    throw error;
  }
}

// 구글 AI 이미지 생성 (올바른 Imagen API 사용)
async function generateImageWithGoogle(prompt, count = 1) {
  if (!process.env.GOOGLE_AI_API_KEY) {
    throw new Error('Google AI API 키가 설정되지 않았습니다.');
  }

  try {
    console.log('🔄 Google AI Imagen API 시도 중...');
    
    // 올바른 Google AI Imagen API 엔드포인트 사용
    const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/imagen-4.0-generate-001:predict', {
      method: 'POST',
      headers: {
        'x-goog-api-key': process.env.GOOGLE_AI_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        instances: [
          {
            prompt: prompt
          }
        ],
        parameters: {
          sampleCount: Math.min(count, 4) // 최대 4개
        }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.log('⚠️ Google AI API 실패, DALL-E 3 fallback 사용:', errorText);
      
      // DALL-E 3 fallback 사용
      return await generateImageWithDALLE3(prompt, count);
    }

    const result = await response.json();
    console.log('✅ Google AI API 응답:', result);
    
    if (!result.predictions || result.predictions.length === 0) {
      console.log('⚠️ Google AI 결과 없음, DALL-E 3 fallback 사용');
      return await generateImageWithDALLE3(prompt, count);
    }

    // Google AI 응답에서 base64 이미지 추출
    const base64Images = result.predictions.map(prediction => prediction.bytesBase64Encoded);
    
    if (base64Images.length === 0) {
      console.log('⚠️ Google AI 이미지 없음, DALL-E 3 fallback 사용');
      return await generateImageWithDALLE3(prompt, count);
    }

    // base64 이미지를 Supabase에 저장하고 URL 반환
    const imageUrls = [];
    for (const base64Image of base64Images) {
      try {
        const imageBuffer = Buffer.from(base64Image, 'base64');
        const fileName = `google-ai-${Date.now()}-${Math.random().toString(36).substring(2, 15)}.png`;
        
        const { data, error } = await supabase.storage
          .from('blog-images')
          .upload(fileName, imageBuffer, {
            contentType: 'image/png',
            upsert: false,
          });

        if (error) {
          console.error('Supabase 업로드 오류:', error);
          continue;
        }

        const { data: publicUrlData } = supabase.storage
          .from('blog-images')
          .getPublicUrl(fileName);

        imageUrls.push(publicUrlData.publicUrl);
      } catch (error) {
        console.error('이미지 처리 오류:', error);
        continue;
      }
    }

    if (imageUrls.length === 0) {
      console.log('⚠️ Google AI 이미지 저장 실패, DALL-E 3 fallback 사용');
      return await generateImageWithDALLE3(prompt, count);
    }

    return imageUrls;
  } catch (error) {
    console.error('⚠️ Google AI 오류, DALL-E 3 fallback 사용:', error);
    return await generateImageWithDALLE3(prompt, count);
  }
}

// DALL-E 3 fallback 함수
async function generateImageWithDALLE3(prompt, count = 1) {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OpenAI API 키가 설정되지 않았습니다.');
  }

  try {
    console.log('🔄 DALL-E 3 fallback 사용 중...');
    
    const dalleResponse = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: "dall-e-3",
        prompt: prompt,
        n: Math.min(count, 1), // DALL-E 3는 한 번에 1개만 생성 가능
        size: "1024x1024",
        quality: "standard",
      })
    });

    if (!dalleResponse.ok) {
      const errorText = await dalleResponse.text();
      throw new Error(`DALL-E 3 API 오류: ${dalleResponse.status} - ${errorText}`);
    }

    const dalleResult = await dalleResponse.json();
    
    if (!dalleResult.data || dalleResult.data.length === 0) {
      throw new Error('DALL-E 3에서 이미지를 생성하지 못했습니다.');
    }

    return dalleResult.data.map(item => item.url);
  } catch (error) {
    console.error('DALL-E 3 fallback 오류:', error);
    throw error;
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { 
    title, 
    excerpt, 
    content,
    contentType = 'information',
    brandStrategy = {
      customerPersona: 'competitive_maintainer',
      customerChannel: 'local_customers',
      brandWeight: 'medium'
    },
    imageCount = 1,
    customPrompt = null
  } = req.body;

  if (!title) {
    return res.status(400).json({ message: 'Title is required' });
  }

  try {
    console.log('🎨 Google AI 이미지 생성 시작...');
    console.log('제목:', title);
    console.log('콘텐츠 유형:', contentType);
    
    // 이미지 생성 프롬프트 생성
    const imagePrompt = customPrompt || createGoogleImagePrompt(title, excerpt || content, contentType, brandStrategy);
    console.log('사용된 프롬프트:', customPrompt ? 'ChatGPT 생성 프롬프트' : '동적 프롬프트');
    console.log('프롬프트 내용:', imagePrompt);
    
    // 이미지 개수 제한 (1-4개)
    const validImageCount = Math.min(Math.max(imageCount, 1), 4);
    
    // 구글 AI로 이미지 생성
    const imageUrls = await generateImageWithGoogle(imagePrompt, validImageCount);
    console.log('✅ Google AI 이미지 생성 완료:', imageUrls.length, '개');

    // 생성된 이미지들을 Supabase에 저장
    const savedImages = [];
    for (let i = 0; i < imageUrls.length; i++) {
      try {
        const savedImage = await saveImageToSupabase(imageUrls[i], 'google-generated-images');
        savedImages.push(savedImage.publicUrl);
        console.log(`✅ 이미지 ${i + 1} 저장 완료:`, savedImage.publicUrl);
      } catch (error) {
        console.error(`❌ 이미지 ${i + 1} 저장 실패:`, error);
        // 저장 실패해도 원본 URL 사용
        savedImages.push(imageUrls[i]);
      }
    }

    res.status(200).json({ 
      success: true,
      imageUrl: savedImages[0], // 첫 번째 이미지 (기존 호환성)
      imageUrls: savedImages, // 모든 이미지 URL 배열
      imageCount: savedImages.length,
      prompt: imagePrompt,
      model: 'google-ai/imagen-4.0',
      metadata: {
        title,
        contentType,
        brandStrategy,
        generatedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('❌ Google AI 이미지 생성 에러:', error);
    res.status(500).json({ 
      message: 'Failed to generate Google AI images',
      error: error.message 
    });
  }
}
