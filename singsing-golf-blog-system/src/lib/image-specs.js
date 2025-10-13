// 플랫폼별 이미지 사이즈 스펙 정의
export const IMAGE_SPECS = {
  // SMS/MMS
  sms_mms: {
    width: 750,
    height: 600,
    name: 'SMS/MMS',
    format: 'jpg',
    quality: 85,
    description: 'SMS/MMS 메시지용 이미지',
    aspect_ratio: '5:4',
    file_size_limit: '2MB',
    use_case: '개인 메시지, 알림'
  },
  
  // 카카오채널
  kakao_channel: {
    width: 750,
    height: 600,
    name: '카카오채널',
    format: 'jpg',
    quality: 90,
    description: '카카오채널 메시지용 이미지',
    aspect_ratio: '5:4',
    file_size_limit: '5MB',
    use_case: '카카오톡 채널 메시지'
  },
  
  // 구글 광고 - 정사각형
  google_square: {
    width: 1200,
    height: 1200,
    name: '구글 광고 (정사각형)',
    format: 'jpg',
    quality: 90,
    description: '구글 디스플레이 광고 정사각형',
    aspect_ratio: '1:1',
    file_size_limit: '5MB',
    use_case: '구글 디스플레이 광고, 소셜미디어'
  },
  
  // 구글 광고 - 세로형
  google_portrait: {
    width: 1080,
    height: 1350,
    name: '구글 광고 (세로)',
    format: 'jpg',
    quality: 90,
    description: '구글 디스플레이 광고 세로형',
    aspect_ratio: '4:5',
    file_size_limit: '5MB',
    use_case: '구글 디스플레이 광고, 모바일 최적화'
  },
  
  // 구글 광고 - 가로형
  google_landscape: {
    width: 1200,
    height: 628,
    name: '구글 광고 (가로)',
    format: 'jpg',
    quality: 90,
    description: '구글 디스플레이 광고 가로형',
    aspect_ratio: '1.91:1',
    file_size_limit: '5MB',
    use_case: '구글 디스플레이 광고, 데스크톱 최적화'
  },
  
  // 네이버 스마트스토어
  naver_store: {
    width: 1200,
    height: 628,
    name: '네이버 스마트스토어',
    format: 'jpg',
    quality: 90,
    description: '네이버 스마트스토어 상품 이미지',
    aspect_ratio: '1.91:1',
    file_size_limit: '10MB',
    use_case: '네이버 쇼핑 광고, 상품 소개'
  },
  
  // 인스타그램 피드
  instagram_feed: {
    width: 1080,
    height: 1080,
    name: '인스타그램 피드',
    format: 'jpg',
    quality: 90,
    description: '인스타그램 피드 포스트용',
    aspect_ratio: '1:1',
    file_size_limit: '8MB',
    use_case: '인스타그램 피드, 소셜미디어'
  },
  
  // 인스타그램 스토리
  instagram_story: {
    width: 1080,
    height: 1920,
    name: '인스타그램 스토리',
    format: 'jpg',
    quality: 90,
    description: '인스타그램 스토리용',
    aspect_ratio: '9:16',
    file_size_limit: '8MB',
    use_case: '인스타그램 스토리, 세로형 콘텐츠'
  },
  
  // 페이스북
  facebook_feed: {
    width: 1200,
    height: 630,
    name: '페이스북',
    format: 'jpg',
    quality: 90,
    description: '페이스북 피드 포스트용',
    aspect_ratio: '1.91:1',
    file_size_limit: '10MB',
    use_case: '페이스북 포스트, 소셜미디어'
  },
  
  // X (Twitter) 카드
  twitter_card: {
    width: 1200,
    height: 675,
    name: 'X (Twitter)',
    format: 'jpg',
    quality: 90,
    description: 'X (Twitter) 카드용',
    aspect_ratio: '16:9',
    file_size_limit: '5MB',
    use_case: 'X (Twitter) 포스트, 소셜미디어'
  },
  
  // 네이버 블로그 (추가 이미지용)
  naver_blog_1: {
    width: 800,
    height: 600,
    name: '네이버 블로그 (1)',
    format: 'jpg',
    quality: 90,
    description: '네이버 블로그 본문 이미지 1',
    aspect_ratio: '4:3',
    file_size_limit: '10MB',
    use_case: '네이버 블로그 본문'
  },
  
  naver_blog_2: {
    width: 600,
    height: 400,
    name: '네이버 블로그 (2)',
    format: 'jpg',
    quality: 90,
    description: '네이버 블로그 본문 이미지 2',
    aspect_ratio: '3:2',
    file_size_limit: '10MB',
    use_case: '네이버 블로그 본문'
  },
  
  naver_blog_3: {
    width: 1000,
    height: 500,
    name: '네이버 블로그 (3)',
    format: 'jpg',
    quality: 90,
    description: '네이버 블로그 본문 이미지 3',
    aspect_ratio: '2:1',
    file_size_limit: '10MB',
    use_case: '네이버 블로그 본문'
  }
};

// 플랫폼별 그룹핑
export const PLATFORM_GROUPS = {
  messaging: ['sms_mms', 'kakao_channel'],
  advertising: ['google_square', 'google_portrait', 'google_landscape', 'naver_store'],
  social_media: ['instagram_feed', 'instagram_story', 'facebook_feed', 'twitter_card'],
  blog: ['naver_blog_1', 'naver_blog_2', 'naver_blog_3']
};

// 타겟 오디언스별 권장 이미지 사이즈
export const TARGET_IMAGE_SPECS = {
  existing_customer: {
    primary: ['kakao_channel', 'sms_mms', 'naver_blog_1', 'naver_blog_2'],
    secondary: ['google_square', 'facebook_feed'],
    description: '기존 고객용 - 친밀한 소통 채널 중심'
  },
  
  new_customer: {
    primary: ['google_square', 'google_landscape', 'naver_store', 'instagram_feed'],
    secondary: ['facebook_feed', 'twitter_card', 'instagram_story'],
    description: '신규 고객용 - 광고 및 소셜미디어 중심'
  }
};

// 이미지 생성 옵션
export const IMAGE_GENERATION_OPTIONS = {
  // 기본 옵션
  default: {
    style: 'professional',
    color_scheme: 'brand_colors',
    text_overlay: true,
    logo_inclusion: true
  },
  
  // 플랫폼별 특화 옵션
  platform_specific: {
    sms_mms: {
      style: 'simple',
      text_overlay: false,
      logo_inclusion: false,
      focus: 'product_highlight'
    },
    
    kakao_channel: {
      style: 'friendly',
      text_overlay: true,
      logo_inclusion: true,
      focus: 'personal_connection'
    },
    
    google_ads: {
      style: 'professional',
      text_overlay: true,
      logo_inclusion: true,
      focus: 'conversion'
    },
    
    naver_store: {
      style: 'commercial',
      text_overlay: true,
      logo_inclusion: true,
      focus: 'product_showcase'
    },
    
    instagram_feed: {
      style: 'lifestyle',
      text_overlay: false,
      logo_inclusion: false,
      focus: 'visual_appeal'
    },
    
    naver_blog: {
      style: 'informative',
      text_overlay: true,
      logo_inclusion: true,
      focus: 'educational'
    }
  }
};

// 이미지 품질 설정
export const IMAGE_QUALITY_SETTINGS = {
  high: {
    quality: 95,
    compression: 'minimal',
    use_case: '프리미엄 콘텐츠, 인쇄물'
  },
  
  standard: {
    quality: 85,
    compression: 'balanced',
    use_case: '일반 웹 콘텐츠'
  },
  
  optimized: {
    quality: 75,
    compression: 'aggressive',
    use_case: '빠른 로딩이 중요한 모바일'
  }
};

// 이미지 생성 프롬프트 템플릿
export const IMAGE_PROMPT_TEMPLATES = {
  product_showcase: {
    template: 'Professional product photography of {product_name}, {style_description}, {background_setting}, high quality, commercial photography',
    variables: ['product_name', 'style_description', 'background_setting']
  },
  
  lifestyle: {
    template: 'Lifestyle photography of {target_audience} playing golf with {product_name}, {mood_description}, natural lighting, authentic moment',
    variables: ['target_audience', 'product_name', 'mood_description']
  },
  
  technical: {
    template: 'Technical diagram or infographic showing {technical_concept}, clean design, professional presentation, {color_scheme}',
    variables: ['technical_concept', 'color_scheme']
  },
  
  testimonial: {
    template: 'Portrait of satisfied customer with {product_name}, genuine smile, professional lighting, {background_setting}',
    variables: ['product_name', 'background_setting']
  }
};

// 이미지 메타데이터 템플릿
export const IMAGE_METADATA_TEMPLATES = {
  alt_text: {
    template: '{product_name} - {description} - 마쓰구골프',
    variables: ['product_name', 'description']
  },
  
  caption: {
    template: '{product_name}로 {benefit_description}. {cta_message}',
    variables: ['product_name', 'benefit_description', 'cta_message']
  },
  
  hashtags: {
    template: '#마쓰구골프 #고반발드라이버 #비거리향상 #골프 #드라이버',
    variables: []
  }
};

// 이미지 생성 함수
export function getImageSpec(platform) {
  return IMAGE_SPECS[platform] || null;
}

export function getPlatformGroup(platform) {
  for (const [group, platforms] of Object.entries(PLATFORM_GROUPS)) {
    if (platforms.includes(platform)) {
      return group;
    }
  }
  return 'other';
}

export function getRecommendedSpecs(targetAudience) {
  return TARGET_IMAGE_SPECS[targetAudience] || TARGET_IMAGE_SPECS.new_customer;
}

export function generateImagePrompt(templateType, variables) {
  const template = IMAGE_PROMPT_TEMPLATES[templateType];
  if (!template) return '';
  
  let prompt = template.template;
  template.variables.forEach(variable => {
    const value = variables[variable] || '';
    prompt = prompt.replace(`{${variable}}`, value);
  });
  
  return prompt;
}

export function generateImageMetadata(type, variables) {
  const template = IMAGE_METADATA_TEMPLATES[type];
  if (!template) return '';
  
  let metadata = template.template;
  template.variables.forEach(variable => {
    const value = variables[variable] || '';
    metadata = metadata.replace(`{${variable}}`, value);
  });
  
  return metadata;
}

export default {
  IMAGE_SPECS,
  PLATFORM_GROUPS,
  TARGET_IMAGE_SPECS,
  IMAGE_GENERATION_OPTIONS,
  IMAGE_QUALITY_SETTINGS,
  IMAGE_PROMPT_TEMPLATES,
  IMAGE_METADATA_TEMPLATES,
  getImageSpec,
  getPlatformGroup,
  getRecommendedSpecs,
  generateImagePrompt,
  generateImageMetadata
};
