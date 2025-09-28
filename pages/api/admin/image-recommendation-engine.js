import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { 
      content, 
      title, 
      category, 
      tags = [], 
      contentType = 'blog_post',
      maxImages = 5,
      imageTypes = ['featured', 'content'] 
    } = req.body;

    if (!content && !title) {
      return res.status(400).json({ error: '콘텐츠 또는 제목이 필요합니다.' });
    }

    console.log('🎯 이미지 추천 엔진 시작:', { title, category, tags });

    // 1. 콘텐츠 분석
    const contentAnalysis = analyzeContent(content, title, category, tags);
    
    // 2. 이미지 추천 로직 실행
    const recommendations = await generateImageRecommendations(contentAnalysis, {
      maxImages,
      imageTypes
    });

    // 3. 추천 결과 최적화
    const optimizedRecommendations = optimizeRecommendations(recommendations, contentAnalysis);

    console.log('✅ 이미지 추천 완료:', optimizedRecommendations.length, '개');

    return res.status(200).json({
      success: true,
      recommendations: optimizedRecommendations,
      analysis: contentAnalysis,
      totalFound: recommendations.length
    });

  } catch (error) {
    console.error('❌ 이미지 추천 엔진 오류:', error);
    return res.status(500).json({
      error: '이미지 추천 중 오류가 발생했습니다.',
      details: error.message
    });
  }
}

// 콘텐츠 분석
function analyzeContent(content, title, category, tags) {
  const analysis = {
    keywords: [],
    themes: [],
    imageTypes: [],
    priority: 'medium',
    golfRelated: false,
    productRelated: false,
    eventRelated: false
  };

  // 키워드 추출
  const allText = `${title || ''} ${content || ''} ${tags.join(' ')}`.toLowerCase();
  
  // 골프 관련 키워드
  const golfKeywords = [
    '골프', '드라이버', '클럽', '필드', '라운드', '스윙', '비거리', '타격', '퍼팅',
    'golf', 'driver', 'club', 'field', 'round', 'swing', 'distance', 'putting'
  ];
  
  // 제품 관련 키워드
  const productKeywords = [
    '제품', '상품', '구매', '가격', '리뷰', '후기', '추천', '비교',
    'product', 'buy', 'price', 'review', 'recommend', 'compare'
  ];
  
  // 이벤트 관련 키워드
  const eventKeywords = [
    '이벤트', '프로모션', '할인', '특가', '세일', '경품', '증정',
    'event', 'promotion', 'sale', 'discount', 'gift', 'prize'
  ];

  // 키워드 매칭
  golfKeywords.forEach(keyword => {
    if (allText.includes(keyword)) {
      analysis.keywords.push(keyword);
      analysis.golfRelated = true;
    }
  });

  productKeywords.forEach(keyword => {
    if (allText.includes(keyword)) {
      analysis.keywords.push(keyword);
      analysis.productRelated = true;
    }
  });

  eventKeywords.forEach(keyword => {
    if (allText.includes(keyword)) {
      analysis.keywords.push(keyword);
      analysis.eventRelated = true;
    }
  });

  // 테마 분석
  if (analysis.golfRelated) {
    analysis.themes.push('golf');
    analysis.priority = 'high';
  }
  
  if (analysis.productRelated) {
    analysis.themes.push('product');
  }
  
  if (analysis.eventRelated) {
    analysis.themes.push('event');
  }

  // 카테고리별 테마 추가
  const categoryThemes = {
    '골프 정보': ['golf', 'instruction'],
    '고객 후기': ['customer', 'review'],
    '이벤트 & 프로모션': ['event', 'promotion'],
    '제품 소개': ['product', 'golf'],
    '골프장 정보': ['golf', 'course']
  };

  if (categoryThemes[category]) {
    analysis.themes.push(...categoryThemes[category]);
  }

  // 이미지 타입 추천
  if (analysis.golfRelated) {
    analysis.imageTypes.push('golf_equipment', 'golf_course', 'golf_action');
  }
  
  if (analysis.productRelated) {
    analysis.imageTypes.push('product_shot', 'lifestyle');
  }
  
  if (analysis.eventRelated) {
    analysis.imageTypes.push('event_banner', 'promotion');
  }

  return analysis;
}

// 이미지 추천 생성
async function generateImageRecommendations(contentAnalysis, options) {
  const { maxImages, imageTypes } = options;
  const recommendations = [];

  try {
    // 1. 키워드 기반 검색
    const keywordResults = await searchByKeywords(contentAnalysis.keywords, maxImages);
    recommendations.push(...keywordResults);

    // 2. 테마 기반 검색
    const themeResults = await searchByThemes(contentAnalysis.themes, maxImages);
    recommendations.push(...themeResults);

    // 3. 이미지 타입별 검색
    const typeResults = await searchByImageTypes(contentAnalysis.imageTypes, maxImages);
    recommendations.push(...typeResults);

    // 4. 인기 이미지 (fallback)
    if (recommendations.length < maxImages) {
      const popularResults = await searchPopularImages(maxImages - recommendations.length);
      recommendations.push(...popularResults);
    }

    // 5. 중복 제거 및 점수 계산
    const uniqueRecommendations = deduplicateAndScore(recommendations, contentAnalysis);

    return uniqueRecommendations.slice(0, maxImages);

  } catch (error) {
    console.error('이미지 추천 생성 오류:', error);
    return [];
  }
}

// 키워드 기반 검색
async function searchByKeywords(keywords, limit) {
  if (keywords.length === 0) return [];

  try {
    const { data: images, error } = await supabase
      .from('image_assets')
      .select(`
        *,
        image_tags(tag_name, tag_type, confidence_score)
      `)
      .eq('status', 'active')
      .in('image_tags.tag_name', keywords)
      .order('usage_count', { ascending: false })
      .limit(limit);

    if (error) throw error;

    return images.map(image => ({
      ...image,
      matchType: 'keyword',
      matchScore: calculateKeywordScore(image, keywords),
      recommendationReason: `키워드 "${keywords.join(', ')}"와 매칭`
    }));

  } catch (error) {
    console.error('키워드 검색 오류:', error);
    return [];
  }
}

// 테마 기반 검색
async function searchByThemes(themes, limit) {
  if (themes.length === 0) return [];

  try {
    const { data: images, error } = await supabase
      .from('image_assets')
      .select(`
        *,
        image_tags(tag_name, tag_type, confidence_score)
      `)
      .eq('status', 'active')
      .or(themes.map(theme => `ai_tags.cs.${theme}`).join(','))
      .order('ai_confidence_score', { ascending: false })
      .limit(limit);

    if (error) throw error;

    return images.map(image => ({
      ...image,
      matchType: 'theme',
      matchScore: calculateThemeScore(image, themes),
      recommendationReason: `테마 "${themes.join(', ')}"와 매칭`
    }));

  } catch (error) {
    console.error('테마 검색 오류:', error);
    return [];
  }
}

// 이미지 타입별 검색
async function searchByImageTypes(imageTypes, limit) {
  if (imageTypes.length === 0) return [];

  try {
    const { data: images, error } = await supabase
      .from('image_assets')
      .select(`
        *,
        image_tags(tag_name, tag_type, confidence_score)
      `)
      .eq('status', 'active')
      .gte('width', 600) // 최소 크기 보장
      .gte('height', 400)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;

    return images.map(image => ({
      ...image,
      matchType: 'type',
      matchScore: calculateTypeScore(image, imageTypes),
      recommendationReason: `이미지 타입 "${imageTypes.join(', ')}"에 적합`
    }));

  } catch (error) {
    console.error('타입 검색 오류:', error);
    return [];
  }
}

// 인기 이미지 검색
async function searchPopularImages(limit) {
  try {
    const { data: images, error } = await supabase
      .from('image_assets')
      .select(`
        *,
        image_tags(tag_name, tag_type, confidence_score)
      `)
      .eq('status', 'active')
      .gte('usage_count', 1)
      .order('usage_count', { ascending: false })
      .limit(limit);

    if (error) throw error;

    return images.map(image => ({
      ...image,
      matchType: 'popular',
      matchScore: 0.5, // 기본 점수
      recommendationReason: '인기 이미지'
    }));

  } catch (error) {
    console.error('인기 이미지 검색 오류:', error);
    return [];
  }
}

// 점수 계산 함수들
function calculateKeywordScore(image, keywords) {
  let score = 0;
  const imageTags = image.image_tags || [];
  
  keywords.forEach(keyword => {
    const matchingTag = imageTags.find(tag => 
      tag.tag_name.toLowerCase().includes(keyword.toLowerCase())
    );
    
    if (matchingTag) {
      score += matchingTag.confidence_score || 0.5;
    }
  });
  
  return Math.min(score / keywords.length, 1.0);
}

function calculateThemeScore(image, themes) {
  let score = 0;
  const aiTags = image.ai_tags || [];
  
  themes.forEach(theme => {
    const matchingTag = aiTags.find(tag => 
      tag.name && tag.name.toLowerCase().includes(theme.toLowerCase())
    );
    
    if (matchingTag) {
      score += matchingTag.confidence || 0.5;
    }
  });
  
  return Math.min(score / themes.length, 1.0);
}

function calculateTypeScore(image, imageTypes) {
  // 이미지 크기와 비율 기반 점수 계산
  const aspectRatio = image.width / image.height;
  let score = 0.3; // 기본 점수
  
  // 가로형 이미지 (16:9, 4:3 등)
  if (aspectRatio > 1.3 && aspectRatio < 2.0) {
    score += 0.3;
  }
  
  // 적절한 해상도
  if (image.width >= 600 && image.height >= 400) {
    score += 0.2;
  }
  
  // 고해상도
  if (image.width >= 1200 && image.height >= 800) {
    score += 0.2;
  }
  
  return Math.min(score, 1.0);
}

// 중복 제거 및 점수 계산
function deduplicateAndScore(recommendations, contentAnalysis) {
  const uniqueImages = new Map();
  
  recommendations.forEach(rec => {
    const existing = uniqueImages.get(rec.id);
    
    if (!existing) {
      // 새로운 이미지
      uniqueImages.set(rec.id, {
        ...rec,
        finalScore: rec.matchScore
      });
    } else {
      // 기존 이미지 - 더 높은 점수로 업데이트
      if (rec.matchScore > existing.finalScore) {
        uniqueImages.set(rec.id, {
          ...rec,
          finalScore: rec.matchScore
        });
      }
    }
  });
  
  // 최종 점수 조정
  Array.from(uniqueImages.values()).forEach(image => {
    // 골프 관련 콘텐츠에 골프 이미지 보너스
    if (contentAnalysis.golfRelated && image.matchType === 'keyword') {
      image.finalScore += 0.2;
    }
    
    // 사용 빈도 보너스
    if (image.usage_count > 5) {
      image.finalScore += 0.1;
    }
    
    // 최근 업로드 보너스
    const daysSinceUpload = (Date.now() - new Date(image.created_at).getTime()) / (1000 * 60 * 60 * 24);
    if (daysSinceUpload < 30) {
      image.finalScore += 0.1;
    }
    
    image.finalScore = Math.min(image.finalScore, 1.0);
  });
  
  return Array.from(uniqueImages.values())
    .sort((a, b) => b.finalScore - a.finalScore);
}

// 추천 결과 최적화
function optimizeRecommendations(recommendations, contentAnalysis) {
  return recommendations.map(rec => ({
    id: rec.id,
    filename: rec.filename,
    altText: rec.alt_text || generateAltText(rec, contentAnalysis),
    title: rec.title || rec.filename,
    caption: rec.caption,
    description: rec.description,
    // 원본 URL
    cdnUrl: rec.cdn_url,
    // 최적화된 URL들 (실제 데이터베이스에서 가져온 것)
    thumbnail: rec.thumbnail_url || getOptimizedUrl(rec.cdn_url, 'thumbnail'),
    medium: rec.medium_url || getOptimizedUrl(rec.cdn_url, 'medium'),
    webp: rec.webp_url || getOptimizedUrl(rec.cdn_url, 'webp'),
    webpThumbnail: rec.webp_thumbnail_url || getOptimizedUrl(rec.cdn_url, 'webp_thumbnail'),
    // 크기 정보
    thumbnailSize: rec.thumbnail_size,
    mediumSize: rec.medium_size,
    webpSize: rec.webp_size,
    webpThumbnailSize: rec.webp_thumbnail_size,
    width: rec.width,
    height: rec.height,
    format: rec.format,
    matchType: rec.matchType,
    matchScore: rec.finalScore,
    recommendationReason: rec.recommendationReason,
    tags: rec.image_tags?.map(tag => tag.tag_name) || [],
    usageCount: rec.usage_count,
    lastUsed: rec.last_used_at,
    isRecommended: true
  }));
}

// Alt 텍스트 자동 생성
function generateAltText(image, contentAnalysis) {
  const tags = image.image_tags?.map(tag => tag.tag_name) || [];
  const mainTag = tags[0] || '이미지';
  
  if (contentAnalysis.golfRelated) {
    return `${mainTag} - 골프 관련 이미지`;
  } else if (contentAnalysis.productRelated) {
    return `${mainTag} - 제품 이미지`;
  } else {
    return `${mainTag} - 관련 이미지`;
  }
}

// 최적화된 URL 생성
function getOptimizedUrl(originalUrl, size) {
  if (!originalUrl) return null;
  
  const baseUrl = originalUrl.split('?')[0];
  const sizes = {
    thumbnail: 'width=150&height=150',
    medium: 'width=600&height=600',
    large: 'width=1200&height=1200'
  };
  
  return `${baseUrl}?${sizes[size]}&quality=85&format=webp`;
}
