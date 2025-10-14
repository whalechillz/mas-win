export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { title, content, category, excerpt } = req.body;

    if (!title || !content) {
      return res.status(400).json({ error: '제목과 내용이 필요합니다.' });
    }

    // SEO 최적화 로직
    const seoOptimization = await generateSEOOptimization(title, content, category, excerpt);
    
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

async function generateSEOOptimization(title, content, category, excerpt) {
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
  
  // 키워드 추출
  const keywords = extractKeywords(title, content, category);
  
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
  return title
    .toLowerCase()
    .replace(/[^a-z0-9가-힣\s-]/g, '') // 특수문자 제거
    .replace(/\s+/g, '-') // 공백을 하이픈으로
    .replace(/-+/g, '-') // 연속된 하이픈 제거
    .replace(/^-|-$/g, ''); // 앞뒤 하이픈 제거
}

function extractKeywords(title, content, category) {
  const keywords = new Set();
  
  // 카테고리 키워드 추가
  if (category) {
    keywords.add(category);
  }
  
  // 골프 관련 키워드
  const golfKeywords = ['골프', 'golf', '라운딩', '골프장', 'CC', '클럽', '티업', '스윙'];
  golfKeywords.forEach(keyword => {
    if (title.toLowerCase().includes(keyword.toLowerCase()) || 
        content.toLowerCase().includes(keyword.toLowerCase())) {
      keywords.add(keyword);
    }
  });
  
  // 제목에서 중요한 단어 추출
  const titleWords = title.split(' ').filter(word => word.length > 1);
  titleWords.slice(0, 3).forEach(word => keywords.add(word));
  
  return Array.from(keywords).slice(0, 10); // 최대 10개 키워드
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
  
  if (seoScore < 70) {
    recommendations.push('전반적인 SEO 점수를 높이기 위해 위의 권장사항을 적용해보세요.');
  }
  
  if (recommendations.length === 0) {
    recommendations.push('훌륭합니다! SEO 최적화가 잘 되어 있습니다.');
  }
  
  return recommendations;
}
