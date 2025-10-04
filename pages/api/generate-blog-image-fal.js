import { 
  CONTENT_STRATEGY,
  CUSTOMER_PERSONAS,
  CUSTOMER_CHANNELS,
  generateBrandMessage,
  generatePainPointMessage
} from '../../lib/masgolf-brand-data';

// 동적 다양성을 위한 요소 생성 함수
const generateDynamicElements = (title, excerpt, contentType, brandStrategy) => {
  // 1. 제목에서 키워드 추출
  const extractKeywords = (title) => {
    const keywords = {
      '여름': ['summer day', 'bright sunlight', 'green grass', 'warm weather'],
      '티샷': ['tee shot', 'driving range', 'golf course', 'powerful swing'],
      '드라이버': ['MASSGOO driver', 'golf club', 'premium equipment'],
      '터뜨려라': ['powerful swing', 'dynamic action', 'energy', 'explosive shot'],
      '마쓰구': ['MASSGOO brand', 'premium driver', 'high-quality equipment'],
      '골프': ['golf course', 'golfing', 'golf equipment', 'golfing experience'],
      '정보': ['informative', 'educational', 'instructional', 'helpful']
    };
    
    const foundKeywords = [];
    Object.keys(keywords).forEach(key => {
      if (title.includes(key)) {
        foundKeywords.push(...keywords[key]);
      }
    });
    return foundKeywords;
  };

  // 2. 요약에서 시각적 요소 추출 (확장된 키워드)
  const extractVisualElements = (excerpt) => {
    if (!excerpt) return [];
    
    const visualMap = {
      '만족': ['satisfied expression', 'happy face', 'confident smile'],
      '성능': ['testing equipment', 'performance focus', 'technical demonstration'],
      '기술': ['proper technique', 'instruction', 'coaching'],
      '경험': ['experienced golfer', 'professional stance', 'expert form'],
      '추천': ['recommendation', 'testimonial', 'endorsement'],
      '좋다': ['positive expression', 'pleased look', 'satisfied appearance'],
      '효과': ['effective use', 'successful shot', 'positive result'],
      '비거리': ['long drive', 'powerful swing', 'distance shot'],
      '정확도': ['precise shot', 'target practice', 'accuracy focus'],
      '컨트롤': ['controlled swing', 'steady form', 'balance'],
      '피팅': ['club fitting', 'equipment adjustment', 'professional consultation'],
      '레슨': ['golf lesson', 'instruction', 'coaching session'],
      '연습': ['practice session', 'driving range', 'training'],
      '경기': ['golf tournament', 'competition', 'match play'],
      '친구': ['golfing with friends', 'social golf', 'group play'],
      '가족': ['family golf', 'leisure golf', 'recreational play']
    };
    
    const visualElements = [];
    Object.keys(visualMap).forEach(key => {
      if (excerpt.includes(key)) {
        visualElements.push(...visualMap[key]);
      }
    });
    return visualElements;
  };

  // 3. 동적 요소 배열
  const timeOfDay = ['morning', 'afternoon', 'golden hour sunset', 'blue hour', 'bright midday'];
  const clothing = ['white polo shirt', 'navy polo shirt', 'gray polo shirt', 'golf vest', 'elegant attire'];
  const poses = ['confident stance', 'mid-swing', 'holding driver', 'checking grip', 'preparing shot', 'follow-through'];
  const lighting = ['natural sunlight', 'soft morning light', 'warm afternoon light', 'golden hour lighting', 'bright daylight'];
  const backgrounds = ['premium golf course', 'driving range', 'practice area', 'golf course fairway', 'luxury golf resort'];

  // 4. 랜덤 선택
  const randomTime = timeOfDay[Math.floor(Math.random() * timeOfDay.length)];
  const randomClothing = clothing[Math.floor(Math.random() * clothing.length)];
  const randomPose = poses[Math.floor(Math.random() * poses.length)];
  const randomLighting = lighting[Math.floor(Math.random() * lighting.length)];
  const randomBackground = backgrounds[Math.floor(Math.random() * backgrounds.length)];

  // 5. 키워드와 시각적 요소 결합
  const titleKeywords = extractKeywords(title);
  const visualElements = extractVisualElements(excerpt);

  // 6. 동적 프롬프트 생성 (간단하고 자연스럽게)
  let dynamicPrompt = `Korean senior golfer (60-65 years old Asian man) wearing ${randomClothing}, ${randomPose} with golf driver, ${randomTime} on ${randomBackground}, ${randomLighting}, Korean facial features, silver/gray hair, photorealistic, high-end commercial photography style, no text, no abstract, no artistic effects`;
  
  // 7. 키워드 추가
  if (titleKeywords.length > 0) {
    dynamicPrompt += `, ${titleKeywords.slice(0, 3).join(', ')}`;
  }
  
  // 8. 시각적 요소 추가
  if (visualElements.length > 0) {
    dynamicPrompt += `, ${visualElements.slice(0, 2).join(', ')}`;
  }

  return dynamicPrompt;
};

// FAL AI 이미지 생성 프롬프트 최적화 (hidream-i1-dev 모델용)
const createFALImagePrompt = (title, excerpt, contentType, brandStrategy, includeAdCopy = false) => {
  const persona = CUSTOMER_PERSONAS[brandStrategy.customerPersona] || CUSTOMER_PERSONAS.competitive_maintainer;
  const channel = CUSTOMER_CHANNELS[brandStrategy.customerChannel] || CUSTOMER_CHANNELS.local_customers;
  
  let basePrompt = `Professional golf marketing image: "${title}"`;
  
  // 콘텐츠 유형별 프롬프트 조정 (한국 골프장 실사 스타일)
  switch (contentType) {
    case 'customer_story':
      basePrompt += `. Show a satisfied Korean senior golfer (50-70 years old, Korean ethnicity, Asian features) holding a premium golf driver on a real Korean golf course. Include authentic Korean golf course background with beautiful green fairways, Korean-style golf course architecture, and natural Korean landscape.`;
      break;
    case 'tutorial':
      basePrompt += `. Show a professional Korean golf instructor (50-60 years old, Korean ethnicity) demonstrating proper driver technique on a Korean golf course driving range. Include Korean golf course facilities and natural Korean environment.`;
      break;
    case 'testimonial':
      basePrompt += `. Show a testimonial-style image with a satisfied Korean customer (50-70 years old, Korean ethnicity) holding a golf driver on a Korean golf course. Include authentic Korean golf course setting with natural Korean landscape.`;
      break;
    case 'visual_guide':
      basePrompt += `. Show a detailed product shot of golf driver with technical specifications, premium materials (titanium), and high-quality finish. Studio lighting, clean background.`;
      break;
    case 'event':
      basePrompt += `. Show an exciting golf event or promotion scene on a Korean golf course, with multiple Korean golfers (50-70 years old, Korean ethnicity), and an energetic atmosphere. Include authentic Korean golf course setting.`;
      break;
    default:
      basePrompt += `. Show a premium golf driver in a professional Korean golf course setting, with clean modern design and high-quality materials.`;
  }
  
  // 브랜드 강도에 따른 조정 (MASSGOO 브랜드 제거)
  // if (brandStrategy.brandWeight === 'high') {
  //   basePrompt += ` Prominently feature MASSGOO branding and logo.`;
  // }
  
  // 고객 페르소나에 따른 조정
  if (persona.name.includes('시니어')) {
    basePrompt += ` Focus on Korean senior golfers (50-70 years old, Korean ethnicity, Asian features) and age-appropriate styling.`;
  } else if (persona.name.includes('상급')) {
    basePrompt += ` Show advanced Korean golfers (50-60 years old, Korean ethnicity) with premium equipment and professional appearance.`;
  }
  
  // 광고 카피 옵션에 따른 조정
  if (includeAdCopy) {
    basePrompt += ` Include subtle marketing text overlay with golf-related Korean phrases like "MASSGOO DRIVER", "골프의 새로운 시작", "프리미엄 골프", or similar promotional text. Make the text look natural and integrated with the image.`;
  } else {
    basePrompt += ` ABSOLUTELY NO TEXT: no text, no writing, no letters, no words, no symbols, no Korean text, no English text, no promotional text, no marketing copy, no overlays, no watermarks, no captions, no subtitles, no labels, no brand names, no product names, no slogans, no quotes, no numbers, no dates, no signatures, no logos, no text elements whatsoever. Pure clean image without any textual content. Text-free image only.`;
  }
  
  // 동적 다양성을 위한 추가 요소들 (고정 프롬프트 제거됨)
  const dynamicElements = generateDynamicElements(title, excerpt, contentType, brandStrategy);
  basePrompt += ` ${dynamicElements}`;
  
  return basePrompt;
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { 
    title, 
    excerpt, 
    content, // 블로그 본문 내용 추가
    contentType = 'information',
    brandStrategy = {
      customerPersona: 'competitive_maintainer',
      customerChannel: 'local_customers',
      brandWeight: 'medium'
    },
    imageCount = 1, // 생성할 이미지 개수 (1-4개)
    customPrompt = null, // ChatGPT로 생성한 커스텀 프롬프트
    includeAdCopy = false // 광고 카피 포함 여부
  } = req.body;

  if (!title) {
    return res.status(400).json({ message: 'Title is required' });
  }

  try {
    console.log('🎨 FAL AI 이미지 생성 시작...');
    console.log('제목:', title);
    console.log('콘텐츠 유형:', contentType);
    
    // 이미지 생성 프롬프트 생성 (ChatGPT 프롬프트 우선 사용)
    const imagePrompt = customPrompt || createFALImagePrompt(title, excerpt || content, contentType, brandStrategy, includeAdCopy);
    console.log('사용된 프롬프트:', customPrompt ? 'ChatGPT 생성 프롬프트' : '동적 프롬프트');
    console.log('프롬프트 내용:', imagePrompt);
    
    // 동적 요소 디버깅 로그
    if (!customPrompt) {
      console.log('🎲 동적 프롬프트 사용 중...');
      console.log('📝 제목:', title);
      console.log('📄 요약:', excerpt ? excerpt.substring(0, 100) + '...' : '요약 없음');
      console.log('📖 본문:', content ? content.substring(0, 200) + '...' : '본문 없음');
    }
    
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
