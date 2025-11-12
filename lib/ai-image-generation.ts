/**
 * AI 이미지 생성 공통 함수
 * 골드톤 시니어 매너 / 블랙톤 젊은 매너 이미지 생성
 */

export interface ImageGenerationOptions {
  content: string;
  title: string;
  excerpt: string;
  contentType: string;
  imageCount: number;
  brandStrategy: {
    customerpersona: string;
    customerChannel: string;
    brandWeight: string;
    audienceTemperature: string;
    audienceWeight?: string;
  };
  tone: 'gold' | 'black';
  blogPostId?: number | null;
}

export interface ImagePrompt {
  prompt: string;
  paragraphIndex: number;
}

/**
 * 이미지 프롬프트 생성
 */
export async function generateImagePrompts(options: ImageGenerationOptions): Promise<ImagePrompt[]> {
  const { content, title, excerpt, contentType, imageCount, brandStrategy } = options;
  
  // content가 없거나 너무 짧으면 기본 프롬프트 사용
  if (!content || content.trim().length < 30) {
    // 이미지 프롬프트 직접 생성
    const prompt = excerpt || title || '골프 관련 이미지';
    return [{
      prompt: `${prompt}, ${brandStrategy?.customerpersona === 'senior_fitting' ? '따뜻한 골드 톤, 시니어 골퍼' : '쿨 블루 톤, 젊은 골퍼'}, 전문 사진`,
      paragraphIndex: 0
    }];
  }
  
  const res = await fetch('/api/generate-paragraph-prompts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ 
      content,
      title: title || '카카오톡 콘텐츠',
      excerpt: excerpt || content.substring(0, 200),
      contentType: contentType || '브랜드 스토리',
      imageCount: imageCount || 1,
      brandStrategy: brandStrategy || {
        customerpersona: 'senior_fitting',
        customerChannel: 'local_customers',
        brandWeight: '중간',
        audienceTemperature: 'warm'
      }
    })
  });
  
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ message: '프롬프트 생성 실패' }));
    // 오류 시에도 기본 프롬프트 반환
    const prompt = excerpt || title || content?.substring(0, 100) || '골프 관련 이미지';
    return [{
      prompt: `${prompt}, ${brandStrategy?.customerpersona === 'senior_fitting' ? '따뜻한 골드 톤' : '쿨 블루 톤'}, 전문 사진`,
      paragraphIndex: 0
    }];
  }
  
  const data = await res.json();
  return data.prompts || [];
}

/**
 * 프롬프트로 이미지 생성
 */
export async function generateImagesFromPrompts(
  prompts: ImagePrompt[],
  blogPostId?: number | null
): Promise<string[]> {
  const res = await fetch('/api/generate-paragraph-images-with-prompts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ 
      prompts,
      blogPostId
    })
  });
  
  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.message || '이미지 생성 실패');
  }
  
  const data = await res.json();
  return data.imageUrls || [];
}

/**
 * 골드톤 시니어 매너 이미지 생성
 */
export async function generateGoldToneImages(options: Omit<ImageGenerationOptions, 'tone'>): Promise<string[]> {
  const prompts = await generateImagePrompts({
    ...options,
    brandStrategy: {
      ...options.brandStrategy,
      customerpersona: 'senior_fitting', // 골드톤 고정
      brandWeight: '높음',
      audienceTemperature: 'warm',
      audienceWeight: '높음'
    },
    tone: 'gold'
  });
  
  return await generateImagesFromPrompts(prompts, options.blogPostId);
}

/**
 * 블랙톤 젊은 매너 이미지 생성
 */
export async function generateBlackToneImages(options: Omit<ImageGenerationOptions, 'tone'>): Promise<string[]> {
  const prompts = await generateImagePrompts({
    ...options,
    brandStrategy: {
      ...options.brandStrategy,
      customerpersona: 'tech_enthusiast', // 블랙톤 고정
    },
    tone: 'black'
  });
  
  return await generateImagesFromPrompts(prompts, options.blogPostId);
}

/**
 * 카카오 콘텐츠 전용 이미지 프롬프트 생성
 * 블로그 프롬프트와 분리하여 카카오 전용 요구사항만 반영
 */
export async function generateKakaoImagePrompts(options: {
  prompt: string;
  accountType: 'account1' | 'account2';
  type: 'background' | 'profile' | 'feed';
  brandStrategy?: any;
  weeklyTheme?: string;
  date: string;
}): Promise<ImagePrompt[]> {
  try {
    const res = await fetch('/api/kakao-content/generate-prompt', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt: options.prompt,
        accountType: options.accountType,
        type: options.type,
        brandStrategy: options.brandStrategy,
        weeklyTheme: options.weeklyTheme,
        date: options.date
      })
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({ message: '프롬프트 생성 실패' }));
      throw new Error(errorData.message || '카카오 프롬프트 생성 실패');
    }

    const data = await res.json();
    
    if (!data.success || !data.prompt) {
      throw new Error('프롬프트 생성 응답이 올바르지 않습니다');
    }
    
    return [{
      prompt: data.prompt,
      paragraphIndex: 0
    }];
  } catch (error: any) {
    console.error('카카오 프롬프트 생성 오류:', error);
    // 폴백: 기본 프롬프트에 한국 골퍼 명시 추가
    const koreanGolferSpec = options.accountType === 'account1'
      ? 'Korean senior golfer (50-70 years old, Korean ethnicity, Asian facial features, silver/gray hair), warm golden tone'
      : 'Korean young golfer (30-50 years old, Korean ethnicity, Asian facial features), cool blue-gray tone';
    
    return [{
      prompt: `${options.prompt}, ${koreanGolferSpec}, NO Western/Caucasian people, ONLY Korean/Asian people`,
      paragraphIndex: 0
    }];
  }
}

