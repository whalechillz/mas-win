import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed'
    });
  }

  try {
    const { title, content, category } = req.body;

    if (!title || !content) {
      return res.status(400).json({
        success: false,
        error: '제목과 내용이 필요합니다.'
      });
    }

    // 네이버 SEO 분석 로직
    const analysis = {
      title: {
        length: title.length,
        hasKeywords: title.includes('골프') || title.includes('드라이버') || title.includes('비거리'),
        hasNumbers: /\d/.test(title),
        hasEmojis: /[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]/u.test(title)
      },
      content: {
        length: content.length,
        wordCount: content.split(/\s+/).length,
        paragraphCount: content.split('\n').filter(p => p.trim()).length,
        hasImages: content.includes('<img') || content.includes('!['),
        hasLinks: content.includes('<a href') || content.includes('['),
        keywordDensity: calculateKeywordDensity(content, ['골프', '드라이버', '비거리', '스윙', '클럽']),
        readabilityScore: calculateReadabilityScore(content)
      },
      seo: {
        metaTitle: title.length >= 30 && title.length <= 60,
        metaDescription: content.length >= 120 && content.length <= 160,
        keywordOptimization: title.toLowerCase().includes('골프') && content.toLowerCase().includes('골프'),
        structureOptimization: content.includes('#') || content.includes('##'),
        imageOptimization: content.includes('alt=') || content.includes('![')
      }
    };

    // 종합 점수 계산
    let score = 0;
    const maxScore = 100;

    // 제목 최적화 (20점)
    if (analysis.title.length >= 20 && analysis.title.length <= 50) score += 10;
    if (analysis.title.hasKeywords) score += 5;
    if (analysis.title.hasNumbers) score += 3;
    if (analysis.title.hasEmojis) score += 2;

    // 내용 최적화 (30점)
    if (analysis.content.length >= 500) score += 10;
    if (analysis.content.wordCount >= 200) score += 10;
    if (analysis.content.hasImages) score += 5;
    if (analysis.content.hasLinks) score += 5;

    // SEO 최적화 (30점)
    if (analysis.seo.metaTitle) score += 10;
    if (analysis.seo.keywordOptimization) score += 10;
    if (analysis.seo.structureOptimization) score += 5;
    if (analysis.seo.imageOptimization) score += 5;

    // 키워드 밀도 (20점)
    const keywordDensity = analysis.content.keywordDensity;
    if (keywordDensity >= 1 && keywordDensity <= 3) score += 20;
    else if (keywordDensity > 3 && keywordDensity <= 5) score += 15;
    else if (keywordDensity > 0.5 && keywordDensity < 1) score += 10;

    // 개선 권장사항 생성
    const recommendations = [];
    
    if (analysis.title.length < 20) {
      recommendations.push('제목을 20자 이상으로 늘려주세요.');
    }
    if (analysis.title.length > 50) {
      recommendations.push('제목을 50자 이하로 줄여주세요.');
    }
    if (!analysis.title.hasKeywords) {
      recommendations.push('제목에 관련 키워드를 포함해주세요.');
    }
    if (analysis.content.length < 500) {
      recommendations.push('내용을 500자 이상으로 늘려주세요.');
    }
    if (!analysis.content.hasImages) {
      recommendations.push('이미지를 추가해주세요.');
    }
    if (keywordDensity < 1) {
      recommendations.push('키워드 밀도를 높여주세요.');
    }
    if (keywordDensity > 5) {
      recommendations.push('키워드 밀도를 낮춰주세요.');
    }
    if (!analysis.seo.structureOptimization) {
      recommendations.push('제목 구조(#, ##)를 사용해주세요.');
    }

    // 최적화 데이터
    const optimization = {
      keywordDensity: keywordDensity,
      readabilityScore: analysis.content.readabilityScore,
      engagementScore: calculateEngagementScore(content),
      trendingKeywords: ['골프', '드라이버', '비거리', '스윙', '클럽'],
      competitorAnalysis: {
        avgTitleLength: 35,
        avgContentLength: 800,
        avgKeywordDensity: 2.5
      }
    };

    return res.status(200).json({
      success: true,
      score: Math.min(score, maxScore),
      analysis: {
        ...analysis,
        recommendations
      },
      optimization
    });

  } catch (error) {
    console.error('네이버 SEO 분석 오류:', error);
    return res.status(500).json({
      success: false,
      error: 'SEO 분석 중 오류가 발생했습니다.',
      details: error.message
    });
  }
}

// 키워드 밀도 계산
function calculateKeywordDensity(content, keywords) {
  const words = content.toLowerCase().split(/\s+/);
  const totalWords = words.length;
  let keywordCount = 0;
  
  keywords.forEach(keyword => {
    keywordCount += (content.toLowerCase().match(new RegExp(keyword.toLowerCase(), 'g')) || []).length;
  });
  
  return totalWords > 0 ? (keywordCount / totalWords) * 100 : 0;
}

// 가독성 점수 계산
function calculateReadabilityScore(content) {
  const sentences = content.split(/[.!?]+/).filter(s => s.trim());
  const words = content.split(/\s+/).filter(w => w.trim());
  const syllables = words.reduce((total, word) => total + countSyllables(word), 0);
  
  if (sentences.length === 0 || words.length === 0) return 0;
  
  const avgWordsPerSentence = words.length / sentences.length;
  const avgSyllablesPerWord = syllables / words.length;
  
  // 간단한 가독성 점수 (0-100)
  const score = 206.835 - (1.015 * avgWordsPerSentence) - (84.6 * avgSyllablesPerWord);
  return Math.max(0, Math.min(100, score));
}

// 음절 수 계산
function countSyllables(word) {
  const vowels = 'aeiouy';
  let count = 0;
  let previousWasVowel = false;
  
  for (let i = 0; i < word.length; i++) {
    const isVowel = vowels.includes(word[i].toLowerCase());
    if (isVowel && !previousWasVowel) {
      count++;
    }
    previousWasVowel = isVowel;
  }
  
  return count > 0 ? count : 1;
}

// 참여도 점수 계산
function calculateEngagementScore(content) {
  let score = 0;
  
  // 질문 포함
  if (content.includes('?')) score += 20;
  
  // 감정 표현
  const emotionalWords = ['놀라운', '놀라움', '신기한', '대단한', '완벽한', '최고의', '혁신적인'];
  emotionalWords.forEach(word => {
    if (content.includes(word)) score += 5;
  });
  
  // 숫자 포함
  if (/\d+/.test(content)) score += 10;
  
  // 이모지 포함
  if (/[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]/u.test(content)) score += 15;
  
  // 구조화된 내용
  if (content.includes('#') || content.includes('##')) score += 10;
  
  // 링크 포함
  if (content.includes('http') || content.includes('www')) score += 10;
  
  return Math.min(score, 100);
}
