export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { title, content, category, excerpt, existingKeywords, enhanceBrandKeywords } = req.body;

    if (!title || !content) {
      return res.status(400).json({ error: '제목과 내용이 필요합니다.' });
    }

    // SEO 최적화 로직
    const seoOptimization = await generateSEOOptimization(title, content, category, excerpt, existingKeywords, enhanceBrandKeywords);
    
    res.status(200).json({
      success: true,
      optimization: seoOptimization.analysis,
      suggestions: seoOptimization.suggestions
    });

  } catch (error) {
    console.error('SEO 최적화 오류:', error);
    res.status(500).json({ error: 'SEO 최적화 중 오류가 발생했습니다.' });
  }
}

async function generateSEOOptimization(title, content, category, excerpt, existingKeywords, enhanceBrandKeywords = false) {
  // 제목 분석
  const titleAnalysis = analyzeTitle(title);
  
  // 내용 분석
  const contentAnalysis = analyzeContent(content);
  
  // 메타 제목 생성
  const metaTitle = generateMetaTitle(title, category);
  
  // 메타 설명 생성
  const metaDescription = generateMetaDescription(excerpt || content, title);
  
  // 슬러그 생성
  const slug = generateSlug(title);
  
  // 키워드 추출 (기존 키워드 포함)
  const keywords = extractKeywords(title, content, category, existingKeywords, enhanceBrandKeywords);
  
  // SEO 점수 계산
  const seoScore = calculateSEOScore(titleAnalysis, contentAnalysis);
  
  return {
    analysis: {
      titleLength: title.length,
      titleScore: titleAnalysis.score,
      contentLength: content.length,
      contentScore: contentAnalysis.score,
      seoScore: seoScore,
      recommendations: generateRecommendations(titleAnalysis, contentAnalysis, seoScore)
    },
    suggestions: {
      meta_title: metaTitle,
      meta_description: metaDescription,
      slug: slug,
      keywords: keywords.join(', ')
    }
  };
}

function analyzeTitle(title) {
  const length = title.length;
  let score = 100;
  const issues = [];
  
  // 길이 체크 (30-60자 권장)
  if (length < 30) {
    score -= 20;
    issues.push('제목이 너무 짧습니다. (30자 이상 권장)');
  } else if (length > 60) {
    score -= 15;
    issues.push('제목이 너무 깁니다. (60자 이하 권장)');
  }
  
  // 키워드 밀도 체크
  const words = title.split(' ');
  const uniqueWords = new Set(words);
  if (uniqueWords.size < words.length * 0.7) {
    score -= 10;
    issues.push('제목에 중복된 단어가 많습니다.');
  }
  
  // 특수문자 체크
  if (/[!@#$%^&*(),.?":{}|<>]/.test(title)) {
    score -= 5;
    issues.push('제목에 불필요한 특수문자가 있습니다.');
  }
  
  return {
    score: Math.max(0, score),
    issues: issues,
    length: length
  };
}

function analyzeContent(content) {
  const length = content.length;
  let score = 100;
  const issues = [];
  
  // 길이 체크 (300자 이상 권장)
  if (length < 300) {
    score -= 30;
    issues.push('내용이 너무 짧습니다. (300자 이상 권장)');
  }
  
  // 문단 구조 체크
  const paragraphs = content.split('\n\n').filter(p => p.trim().length > 0);
  if (paragraphs.length < 3) {
    score -= 15;
    issues.push('문단을 더 나누어 가독성을 높이세요.');
  }
  
  // 제목 태그 체크 (마크다운에서 # 확인)
  const hasHeadings = /^#+\s/.test(content);
  if (!hasHeadings) {
    score -= 10;
    issues.push('제목 구조를 추가하여 가독성을 높이세요.');
  }
  
  return {
    score: Math.max(0, score),
    issues: issues,
    length: length,
    paragraphs: paragraphs.length
  };
}

function generateMetaTitle(title, category) {
  // 카테고리별 최적화된 메타 제목 생성
  const categoryPrefixes = {
    '고객 후기': '고객 후기',
    '제품 정보': '제품 정보',
    '골프 팁': '골프 팁',
    '이벤트': '이벤트',
    '공지사항': '공지사항'
  };
  
  const prefix = categoryPrefixes[category] || '';
  const baseTitle = title.length > 50 ? title.substring(0, 47) + '...' : title;
  
  if (prefix) {
    return `${prefix} | ${baseTitle} | MAS Golf`;
  } else {
    return `${baseTitle} | MAS Golf`;
  }
}

function generateMetaDescription(excerpt, title) {
  if (excerpt && excerpt.length > 20) {
    return excerpt.length > 155 ? excerpt.substring(0, 152) + '...' : excerpt;
  }
  
  // 제목을 기반으로 메타 설명 생성
  const baseDescription = title.length > 100 ? title.substring(0, 97) + '...' : title;
  return `${baseDescription} - MAS Golf에서 확인하세요.`;
}

function generateSlug(title) {
  // 한글을 영문으로 변환하는 간단한 매핑
  const koreanToEnglish = {
    '골프': 'golf',
    '드라이버': 'driver',
    '스윙': 'swing',
    '비거리': 'distance',
    '초고반발': 'ultra-rebound',
    '고반발': 'high-rebound',
    '피팅': 'fitting',
    '골프장': 'golf-course',
    '클럽': 'club',
    '스코어': 'score',
    '생존': 'survival',
    '선택': 'choice',
    '필요': 'need',
    '왜': 'why',
    '당신의': 'your',
    '구할': 'save',
    '에서': 'at',
    '을': '',
    '를': '',
    '는': '',
    '은': '',
    '이': '',
    '가': '',
    '의': '',
    '에': '',
    '와': '',
    '과': '',
    '도': '',
    '만': '',
    '부터': '',
    '까지': '',
    '로': '',
    '으로': ''
  };
  
  let slug = title;
  
  // 한글 키워드를 영문으로 변환
  Object.keys(koreanToEnglish).forEach(korean => {
    const regex = new RegExp(korean, 'g');
    slug = slug.replace(regex, koreanToEnglish[korean]);
  });
  
  return slug
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '') // 한글과 특수문자 제거
    .replace(/\s+/g, '-') // 공백을 하이픈으로
    .replace(/-+/g, '-') // 연속된 하이픈 제거
    .replace(/^-|-$/g, ''); // 앞뒤 하이픈 제거
}

function extractKeywords(title, content, category, existingKeywords = '', enhanceBrandKeywords = false) {
  const keywords = new Set();
  
  // 기존 키워드가 있으면 우선 사용
  if (existingKeywords && existingKeywords.trim()) {
    const existing = existingKeywords.split(',').map(k => k.trim()).filter(k => k.length > 0);
    existing.forEach(keyword => keywords.add(keyword));
  }
  
  // 카테고리 키워드 추가
  if (category) {
    keywords.add(category);
  }
  
  // 골프 관련 핵심 키워드만 추가
  const golfKeywords = ['골프', 'golf', '라운딩', '골프장', 'CC', '클럽', '티업', '스윙', '드라이버', '비거리'];
  golfKeywords.forEach(keyword => {
    if (title.toLowerCase().includes(keyword.toLowerCase()) || 
        content.toLowerCase().includes(keyword.toLowerCase())) {
      keywords.add(keyword);
    }
  });

  // 마쓰구프 브랜드 핵심 키워드 추가
  const brandKeywords = [
    '초고반발 드라이버', '비거리 증가', '맞춤 피팅', 'MASSGOO', '마쓰구 드라이버',
    '고반발드라이버', '골프드라이버', '남성드라이버추천', '비거리드라이버',
    '반발계수 0.87', '비거리 25m 증가', 'JFE 티타늄', 'NGS 샤프트',
    '수원 드라이버', '광교 골프샵', '10년 샤프트 교환 보증'
  ];
  
  if (enhanceBrandKeywords) {
    // 브랜드 키워드 강화 모드: 관련 키워드들을 적극적으로 추가
    brandKeywords.forEach(keyword => {
      keywords.add(keyword);
    });
  } else {
    // 일반 모드: 제목이나 내용에 포함된 키워드만 추가
    brandKeywords.forEach(keyword => {
      if (title.toLowerCase().includes(keyword.toLowerCase()) || 
          content.toLowerCase().includes(keyword.toLowerCase())) {
        keywords.add(keyword);
      }
    });
  }
  
  // 지역 키워드 최적화 (핵심 지역만 선별)
  const regionKeywords = {
    '수원': ['수원', '영통구', '광교신도시', '광교'],
    '용인': ['용인', '기흥구', '수지구', '처인구'],
    '분당': ['분당', '정자동', '야탑동', '서현동'],
    '기타': ['동탄', '인천', '안산', '화성', '오산', '안성골프']
  };
  
  // 지역별로 대표 키워드만 추가 (중복 방지)
  Object.keys(regionKeywords).forEach(region => {
    const hasRegionKeyword = regionKeywords[region].some(keyword => 
      title.toLowerCase().includes(keyword.toLowerCase()) || 
      content.toLowerCase().includes(keyword.toLowerCase())
    );
    
    if (hasRegionKeyword) {
      // 대표 지역명만 추가
      if (region === '수원') keywords.add('수원 골프샵');
      else if (region === '용인') keywords.add('용인 골프샵');
      else if (region === '분당') keywords.add('분당 골프샵');
      else keywords.add(region);
    }
  });
  
  // 여행/투어 관련 키워드 추가
  const travelKeywords = ['투어', '여행', '코타키나발루', '북경', '일본', '삿포로', '9월', '10월'];
  travelKeywords.forEach(keyword => {
    if (title.toLowerCase().includes(keyword.toLowerCase()) || 
        content.toLowerCase().includes(keyword.toLowerCase())) {
      keywords.add(keyword);
    }
  });
  
  // 제목에서 의미있는 단어만 추출 (불필요한 단어 제외)
  const excludeWords = ['combined', '글', '포함', '등의', '주제', '다룹니다', '여러', '포스트', '합친', '종합', '소중한', '순간들', '여행자가', '추천하는', '이유', '로', '을', '를', '이', '가', '은', '는', '의', '에', '에서', '와', '과', '도', '만', '부터', '까지'];
  const titleWords = title.split(' ')
    .filter(word => word.length > 1)
    .filter(word => !excludeWords.includes(word.toLowerCase()))
    .filter(word => /[가-힣a-zA-Z]/.test(word)) // 한글 또는 영문만
    .filter(word => !/^\d+[세살]/.test(word)) // 나이 관련 단어 제외 (75세, 60살 등)
    .filter(word => !/^\d+$/.test(word)); // 숫자만 있는 단어 제외
    
  titleWords.slice(0, 3).forEach(word => keywords.add(word));
  
  // 지역 키워드 과다 사용 방지 (최대 2개 지역만)
  const finalKeywords = Array.from(keywords);
  const regionCount = finalKeywords.filter(k => 
    k.includes('골프샵') || k.includes('수원') || k.includes('용인') || k.includes('분당')
  ).length;
  
  if (regionCount > 2) {
    // 지역 키워드가 너무 많으면 핵심 지역만 유지
    const nonRegionKeywords = finalKeywords.filter(k => 
      !k.includes('골프샵') && !k.includes('수원') && !k.includes('용인') && !k.includes('분당')
    );
    const topRegionKeywords = finalKeywords.filter(k => 
      k.includes('골프샵') || k.includes('수원') || k.includes('용인') || k.includes('분당')
    ).slice(0, 2);
    
    return [...nonRegionKeywords, ...topRegionKeywords].slice(0, 8);
  }
  
  return finalKeywords.slice(0, 8); // 최대 8개 키워드
}

function calculateSEOScore(titleAnalysis, contentAnalysis) {
  const titleWeight = 0.4;
  const contentWeight = 0.6;
  
  return Math.round(
    (titleAnalysis.score * titleWeight) + 
    (contentAnalysis.score * contentWeight)
  );
}

function generateRecommendations(titleAnalysis, contentAnalysis, seoScore) {
  const recommendations = [];
  
  if (titleAnalysis.score < 80) {
    recommendations.push(...titleAnalysis.issues);
  }
  
  if (contentAnalysis.score < 80) {
    recommendations.push(...contentAnalysis.issues);
  }
  
  // 지역 키워드 최적화 권장사항
  recommendations.push('지역 키워드는 핵심 지역 2-3개만 사용하여 가독성을 높이세요');
  recommendations.push('지역명은 자연스럽게 문맥에 녹여서 사용하는 것이 좋습니다');
  
  if (seoScore < 70) {
    recommendations.push('전반적인 SEO 점수를 높이기 위해 위의 권장사항을 적용해보세요.');
  }
  
  if (recommendations.length === 0) {
    recommendations.push('훌륭합니다! SEO 최적화가 잘 되어 있습니다.');
  }
  
  return recommendations;
}
