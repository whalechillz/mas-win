// 마쓰구/마스골프 SEO 최적화 키워드 데이터베이스
// 웹 조사 결과를 바탕으로 고객 니즈에 맞는 키워드 구성

const MASGOO_SEO_KEYWORDS = {
  // 브랜드 키워드
  brand: [
    'masgoo', 'massgoo', '마쓰구', '마스골프', 'masgolf',
    'korean-golf', 'korea-golf-brand', 'golf-brand-korea'
  ],

  // 제품 키워드
  products: [
    'golf-driver', 'golf-club', 'golf-equipment', 'golf-clubs',
    'driver-club', 'golf-wood', 'golf-iron', 'golf-wedge',
    'putter', 'golf-bag', 'golf-accessories'
  ],

  // 기술/성능 키워드
  technology: [
    'high-rebound', 'low-rebound', 'distance-driver', 'accuracy-driver',
    'forgiveness', 'golf-technology', 'titanium-head', 'carbon-shaft',
    'golf-fitting', 'custom-fitting', 'golf-lesson', 'golf-instruction'
  ],

  // 타겟 고객 키워드
  targetCustomers: [
    'senior-golfer', 'beginner-golfer', 'intermediate-golfer', 'advanced-golfer',
    '50s-golfer', '60s-golfer', 'senior-golf', 'mature-golfer',
    'golf-distance', 'golf-accuracy', 'golf-improvement'
  ],

  // 지역 키워드
  location: [
    'korea', 'seoul', 'suwon', 'golf-shop-korea', 'golf-store-korea',
    'korean-golf-shop', 'golf-fitting-korea', 'golf-lesson-korea'
  ],

  // 감정/니즈 키워드
  emotions: [
    'golf-distance-increase', 'golf-accuracy-improvement', 'golf-confidence',
    'golf-enjoyment', 'golf-satisfaction', 'golf-performance',
    'golf-progress', 'golf-achievement', 'golf-success'
  ],

  // 경쟁사 대비 키워드
  competitive: [
    'affordable-golf', 'value-golf', 'quality-golf', 'reliable-golf',
    'trusted-golf-brand', 'proven-golf-technology', 'golf-warranty',
    'golf-service', 'golf-support', 'golf-maintenance'
  ]
};

// SEO 최적화된 파일명 생성 함수
function generateMasgooSEOFileName(imageData, originalFileName = '') {
  try {
    // 1. 이미지 타입 분석
    const imageType = analyzeImageType(imageData, originalFileName);
    
    // 2. 관련 키워드 선택
    const selectedKeywords = selectRelevantKeywords(imageType);
    
    // 3. 브랜드 키워드 추가
    const brandKeyword = selectBrandKeyword();
    
    // 4. 파일명 생성
    const seoFileName = createSEOFileName(brandKeyword, selectedKeywords, imageType);
    
    console.log('🎯 마쓰구 SEO 파일명 생성:', {
      originalFileName,
      imageType,
      selectedKeywords,
      brandKeyword,
      seoFileName
    });
    
    return seoFileName;
  } catch (error) {
    console.error('❌ SEO 파일명 생성 오류:', error);
    return generateFallbackFileName(originalFileName);
  }
}

// 이미지 타입 분석
function analyzeImageType(imageData, originalFileName) {
  const fileName = originalFileName.toLowerCase();
  const content = (imageData.content || '').toLowerCase();
  
  // 골프 장면 분석
  if (fileName.includes('golf') || content.includes('golf') || content.includes('골프')) {
    if (fileName.includes('driver') || content.includes('driver') || content.includes('드라이버')) {
      return 'golf-driver';
    }
    if (fileName.includes('putt') || content.includes('putt') || content.includes('퍼팅')) {
      return 'golf-putting';
    }
    if (fileName.includes('swing') || content.includes('swing') || content.includes('스윙')) {
      return 'golf-swing';
    }
    return 'golf-general';
  }
  
  // 매장/피팅 관련
  if (fileName.includes('store') || fileName.includes('shop') || content.includes('매장') || content.includes('피팅')) {
    return 'golf-store';
  }
  
  // 제품 이미지
  if (fileName.includes('product') || fileName.includes('equipment') || content.includes('제품')) {
    return 'golf-product';
  }
  
  // 기본값
  return 'golf-general';
}

// 관련 키워드 선택
function selectRelevantKeywords(imageType) {
  const keywords = [];
  
  switch (imageType) {
    case 'golf-driver':
      keywords.push(
        ...MASGOO_SEO_KEYWORDS.products.filter(k => k.includes('driver')),
        ...MASGOO_SEO_KEYWORDS.technology.filter(k => k.includes('distance') || k.includes('rebound')),
        ...MASGOO_SEO_KEYWORDS.targetCustomers.filter(k => k.includes('senior') || k.includes('distance'))
      );
      break;
      
    case 'golf-putting':
      keywords.push(
        ...MASGOO_SEO_KEYWORDS.products.filter(k => k.includes('putter')),
        ...MASGOO_SEO_KEYWORDS.technology.filter(k => k.includes('accuracy')),
        ...MASGOO_SEO_KEYWORDS.emotions.filter(k => k.includes('accuracy'))
      );
      break;
      
    case 'golf-swing':
      keywords.push(
        ...MASGOO_SEO_KEYWORDS.technology.filter(k => k.includes('fitting') || k.includes('lesson')),
        ...MASGOO_SEO_KEYWORDS.targetCustomers.filter(k => k.includes('beginner') || k.includes('improvement')),
        ...MASGOO_SEO_KEYWORDS.emotions.filter(k => k.includes('improvement'))
      );
      break;
      
    case 'golf-store':
      keywords.push(
        ...MASGOO_SEO_KEYWORDS.location,
        ...MASGOO_SEO_KEYWORDS.technology.filter(k => k.includes('fitting')),
        ...MASGOO_SEO_KEYWORDS.competitive.filter(k => k.includes('service'))
      );
      break;
      
    case 'golf-product':
      keywords.push(
        ...MASGOO_SEO_KEYWORDS.products,
        ...MASGOO_SEO_KEYWORDS.technology,
        ...MASGOO_SEO_KEYWORDS.competitive.filter(k => k.includes('quality'))
      );
      break;
      
    default:
      keywords.push(
        ...MASGOO_SEO_KEYWORDS.products.slice(0, 2),
        ...MASGOO_SEO_KEYWORDS.targetCustomers.slice(0, 1),
        ...MASGOO_SEO_KEYWORDS.emotions.slice(0, 1)
      );
  }
  
  // 중복 제거 및 최대 3개 선택
  return [...new Set(keywords)].slice(0, 3);
}

// 브랜드 키워드 선택
function selectBrandKeyword() {
  // 브랜드명을 massgoo로 통일
  return 'massgoo';
}

// SEO 파일명 생성
function createSEOFileName(brandKeyword, keywords, imageType) {
  const timestamp = Date.now();
  const year = new Date().getFullYear();
  
  // 키워드 조합
  const keywordString = keywords.join('-');
  
  // 파일명 구조: brand-keywords-type-year-timestamp
  const fileName = `${brandKeyword}-${keywordString}-${imageType}-${year}-${timestamp}`;
  
  // 파일명 길이 제한 (최대 100자)
  return fileName.length > 100 ? fileName.substring(0, 100) : fileName;
}

// 폴백 파일명 생성
function generateFallbackFileName(originalFileName) {
  const timestamp = Date.now();
  const brandKeyword = 'massgoo';
  
  if (originalFileName) {
    const cleanName = originalFileName.replace(/[^a-zA-Z0-9가-힣]/g, '-').toLowerCase();
    return `${brandKeyword}-${cleanName}-${timestamp}`;
  }
  
  return `${brandKeyword}-golf-image-${timestamp}`;
}

// 골프 관련 키워드 추출 (원본 파일명에서)
function extractGolfKeywordsFromFileName(fileName) {
  const golfKeywords = [
    'golf', '골프', 'driver', '드라이버', 'club', '클럽',
    'swing', '스윙', 'putt', '퍼팅', 'iron', '아이언',
    'wood', '우드', 'wedge', '웨지', 'putter', '퍼터'
  ];
  
  const foundKeywords = golfKeywords.filter(keyword => 
    fileName.toLowerCase().includes(keyword.toLowerCase())
  );
  
  return foundKeywords;
}

// 마쓰구 특화 키워드 매칭
function isMasgooRelevantKeyword(keyword) {
  const masgooKeywords = [
    'masgoo', 'massgoo', 'masgolf', '마쓰구', '마스골프',
    'golf', '골프', 'driver', '드라이버', 'fitting', '피팅',
    'distance', '비거리', 'accuracy', '정확도', 'senior', '시니어'
  ];
  
  return masgooKeywords.some(masgooKeyword => 
    keyword.toLowerCase().includes(masgooKeyword.toLowerCase())
  );
}

module.exports = {
  MASGOO_SEO_KEYWORDS,
  generateMasgooSEOFileName,
  extractGolfKeywordsFromFileName,
  isMasgooRelevantKeyword,
  analyzeImageType,
  selectRelevantKeywords,
  selectBrandKeyword
};
