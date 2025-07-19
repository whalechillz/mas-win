import { NextApiRequest, NextApiResponse } from 'next';

interface SEOCheckResult {
  score: number;
  grade: string;
  details: {
    title: {
      score: number;
      issues: string[];
      suggestions: string[];
    };
    content: {
      score: number;
      issues: string[];
      suggestions: string[];
    };
    keywords: {
      score: number;
      density: number;
      mainKeywords: string[];
      suggestions: string[];
    };
    images: {
      score: number;
      count: number;
      issues: string[];
    };
    tags: {
      score: number;
      count: number;
      relevance: number;
    };
  };
}

// 네이버 SEO 검증 API
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { title, content, tags, images } = req.body;

    // 키워드 추출
    const extractKeywords = (text: string): string[] => {
      const words = text.split(/\s+/).filter(word => word.length > 2);
      const wordCount: Record<string, number> = {};
      
      words.forEach(word => {
        wordCount[word] = (wordCount[word] || 0) + 1;
      });
      
      return Object.entries(wordCount)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 10)
        .map(([word]) => word);
    };

    const keywords = extractKeywords(title + ' ' + content);
    const result: SEOCheckResult = {
      score: 0,
      grade: 'C',
      details: {
        title: {
          score: 0,
          issues: [],
          suggestions: []
        },
        content: {
          score: 0,
          issues: [],
          suggestions: []
        },
        keywords: {
          score: 0,
          density: 0,
          mainKeywords: keywords.slice(0, 5),
          suggestions: []
        },
        images: {
          score: 0,
          count: images?.length || 0,
          issues: []
        },
        tags: {
          score: 0,
          count: tags?.length || 0,
          relevance: 0
        }
      }
    };

    let totalScore = 0;
    let maxScore = 0;

    // 1. 제목 검증 (25점)
    maxScore += 25;
    if (title.length >= 25 && title.length <= 40) {
      result.details.title.score += 15;
      totalScore += 15;
    } else {
      result.details.title.issues.push(`제목 길이가 ${title.length}자입니다. (권장: 25-40자)`);
      result.details.title.suggestions.push('제목을 25-40자 사이로 조정하세요');
      result.details.title.score += 5;
      totalScore += 5;
    }

    // 감성 키워드 체크
    const emotionalKeywords = ['최고', '추천', '인기', '필수', '꿀팁', '총정리', '완벽', '놀라운'];
    if (emotionalKeywords.some(keyword => title.includes(keyword))) {
      result.details.title.score += 10;
      totalScore += 10;
    } else {
      result.details.title.suggestions.push('제목에 감성 키워드를 추가하면 클릭률이 높아집니다');
    }

    // 2. 본문 검증 (35점)
    maxScore += 35;
    const contentLength = content.length;
    if (contentLength >= 1500 && contentLength <= 3000) {
      result.details.content.score += 20;
      totalScore += 20;
    } else if (contentLength >= 1000) {
      result.details.content.score += 10;
      totalScore += 10;
      result.details.content.issues.push('본문이 권장 길이보다 짧거나 깁니다');
    } else {
      result.details.content.issues.push('본문이 너무 짧습니다 (최소 1,000자 필요)');
    }

    // 키워드 밀도 계산
    const keywordCount = keywords.reduce((sum, keyword) => {
      const regex = new RegExp(keyword, 'gi');
      const matches = content.match(regex);
      return sum + (matches ? matches.length : 0);
    }, 0);
    
    result.details.keywords.density = (keywordCount / (contentLength / 100));
    
    if (result.details.keywords.density >= 2 && result.details.keywords.density <= 3) {
      result.details.content.score += 15;
      totalScore += 15;
    } else {
      result.details.keywords.suggestions.push(`키워드 밀도를 2-3%로 조정하세요 (현재: ${result.details.keywords.density.toFixed(1)}%)`);
      result.details.content.score += 5;
      totalScore += 5;
    }

    // 3. 이미지 검증 (20점)
    maxScore += 20;
    if (images && images.length >= 3 && images.length <= 7) {
      result.details.images.score += 10;
      totalScore += 10;
    } else {
      result.details.images.issues.push(`이미지 개수가 ${images?.length || 0}개입니다 (권장: 3-7개)`);
    }

    // 이미지 최적화 체크
    const optimizedImages = images?.filter((img: any) => 
      img.size < 200 * 1024 && // 200KB 이하
      keywords.some(keyword => img.name?.toLowerCase().includes(keyword.toLowerCase()))
    ) || [];
    
    if (images && optimizedImages.length === images.length) {
      result.details.images.score += 10;
      totalScore += 10;
    } else if (images && optimizedImages.length > 0) {
      result.details.images.score += 5;
      totalScore += 5;
      result.details.images.issues.push('일부 이미지가 최적화되지 않았습니다');
    }

    // 4. 태그 검증 (20점)
    maxScore += 20;
    if (tags && tags.length >= 5 && tags.length <= 10) {
      result.details.tags.score += 10;
      totalScore += 10;
    } else {
      result.details.tags.score += 5;
      totalScore += 5;
    }

    // 태그 관련성 계산
    const relevantTags = tags?.filter((tag: string) => 
      keywords.some(keyword => tag.includes(keyword) || keyword.includes(tag))
    ) || [];
    
    result.details.tags.relevance = tags?.length > 0 ? relevantTags.length / tags.length : 0;
    
    if (result.details.tags.relevance >= 0.7) {
      result.details.tags.score += 10;
      totalScore += 10;
    } else {
      result.details.tags.score += 5;
      totalScore += 5;
    }

    // 최종 점수 계산
    result.score = Math.round((totalScore / maxScore) * 100);
    
    // 등급 부여
    if (result.score >= 90) result.grade = 'A+';
    else if (result.score >= 80) result.grade = 'A';
    else if (result.score >= 70) result.grade = 'B+';
    else if (result.score >= 60) result.grade = 'B';
    else result.grade = 'C';

    // 최신 네이버 C-Rank 알고리즘 팁 추가
    const tips = [
      '첫 문단에 핵심 키워드를 자연스럽게 포함하세요',
      '이미지 사이에 충분한 텍스트(150자 이상)를 배치하세요',
      '모바일에서 읽기 편한 짧은 문단으로 구성하세요',
      '독자의 체류시간을 늘릴 수 있는 흥미로운 도입부를 작성하세요'
    ];

    return res.status(200).json({
      success: true,
      result,
      tips,
      summary: {
        score: result.score,
        grade: result.grade,
        mainIssues: [
          ...result.details.title.issues,
          ...result.details.content.issues,
          ...result.details.images.issues
        ].slice(0, 3)
      }
    });

  } catch (error) {
    console.error('SEO validation error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      details: error.message
    });
  }
}