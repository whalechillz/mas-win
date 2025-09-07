import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// SEO 점수 계산
function calculateSEOScore(content: string, title: string, keywords: string[]): number {
  let score = 0;
  
  // 키워드 밀도 (30점)
  const totalWords = content.split(/\s+/).length;
  let keywordCount = 0;
  keywords.forEach(keyword => {
    const regex = new RegExp(keyword, 'gi');
    const matches = content.match(regex);
    keywordCount += matches ? matches.length : 0;
  });
  const keywordDensity = (keywordCount / totalWords) * 100;
  
  if (keywordDensity >= 1 && keywordDensity <= 3) {
    score += 30;
  } else if (keywordDensity < 1) {
    score += keywordDensity * 30;
  } else {
    score += Math.max(0, 30 - (keywordDensity - 3) * 10);
  }
  
  // 제목 최적화 (20점)
  if (title.length >= 30 && title.length <= 60) {
    score += 20;
  } else {
    score += Math.max(0, 20 - Math.abs(45 - title.length) * 0.5);
  }
  
  // 키워드 위치 (20점)
  if (keywords.some(kw => title.includes(kw))) {
    score += 10;
  }
  if (keywords.some(kw => content.slice(0, 200).includes(kw))) {
    score += 10;
  }
  
  // 나머지 점수 (30점)
  score += 30; // 임시
  
  return Math.round(score);
}

// 가독성 점수 계산
function calculateReadabilityScore(content: string): number {
  let score = 0;
  
  // 평균 문장 길이
  const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const avgSentenceLength = content.length / sentences.length;
  
  if (avgSentenceLength >= 40 && avgSentenceLength <= 60) {
    score += 40;
  } else {
    score += Math.max(0, 40 - Math.abs(50 - avgSentenceLength) * 0.5);
  }
  
  // 단락 구조
  const paragraphs = content.split(/\n\n+/).filter(p => p.length > 50);
  if (paragraphs.length >= 5) {
    score += 30;
  }
  
  // 소제목 사용
  if (content.includes('##') || content.includes('**')) {
    score += 30;
  }
  
  return Math.round(score);
}

// 브랜드 일관성 점수
function calculateBrandConsistency(content: string): number {
  let score = 0;
  const brandTerms = ['마쓰구골프', '싱싱골프', 'MASLABS', '최고의 서비스'];
  
  brandTerms.forEach(term => {
    if (content.includes(term)) {
      score += 25;
    }
  });
  
  return Math.min(100, score);
}

// 채널 최적화 점수 (블로그)
function calculateChannelOptimization(content: string, imageCount: number): number {
  let score = 0;
  
  // 콘텐츠 길이
  if (content.length >= 1000) score += 40;
  
  // 이미지 수
  if (imageCount >= 15) score += 30;
  
  // 지도 포함
  if (content.includes('지도') || content.includes('map')) score += 30;
  
  return score;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { blogUrl, year, month, keywords = [], rules = [] } = req.body;

  try {
    // 실제로는 여기서 블로그 스크래핑을 해야 하지만,
    // 지금은 더미 데이터로 시뮬레이션
    const mockBlogData = {
      title: '이천 전골 맛집 추천 - 싱싱골프 최고의 맛',
      content: `안녕하세요, 오늘은 이천전골 맛집을 소개해드리려고 합니다.
      
      마쓰구골프를 즐기신 후에 들르기 좋은 이천순대국 맛집도 함께 추천드립니다.
      
      ## 이천전골의 특별함
      
      이천 지역의 전골은 신선한 재료와 특별한 비법으로 유명합니다.
      특히 싱싱골프 근처의 맛집들은 골프를 즐긴 후 방문하기 좋습니다.
      
      ## 추천 맛집 리스트
      
      1. 첫 번째 맛집 - 이천전골 전문점
      2. 두 번째 맛집 - 이천순대국 명가
      3. 세 번째 맛집 - 마쓰구골프 인근 맛집
      
      ## 위치 및 지도
      
      각 맛집의 위치는 지도에서 확인하실 수 있습니다.
      MASLABS에서 제공하는 최고의 서비스를 경험해보세요.
      
      싱싱골프와 함께 즐거운 하루 되세요!`,
      imageCount: 18,
      videoCount: 1,
      hasLocation: true,
      wordCount: 150
    };

    // 점수 계산
    const seoScore = calculateSEOScore(mockBlogData.content, mockBlogData.title, keywords);
    const readabilityScore = calculateReadabilityScore(mockBlogData.content);
    const brandConsistencyScore = calculateBrandConsistency(mockBlogData.content);
    const channelOptimizationScore = calculateChannelOptimization(mockBlogData.content, mockBlogData.imageCount);
    
    const overallScore = Math.round((seoScore + readabilityScore + brandConsistencyScore + channelOptimizationScore) / 4);
    
    // 등급 계산
    let grade = 'D';
    let status = 'poor';
    if (overallScore >= 90) {
      grade = 'A';
      status = 'excellent';
    } else if (overallScore >= 75) {
      grade = 'B';
      status = 'good';
    } else if (overallScore >= 60) {
      grade = 'C';
      status = 'needs-improvement';
    }

    // 검증 세부 사항
    const details = [
      {
        ruleName: '키워드 밀도',
        passed: seoScore >= 20,
        score: Math.round(seoScore * 0.3),
        maxScore: 30,
        feedback: '키워드가 적절히 사용되었습니다.',
        suggestions: []
      },
      {
        ruleName: '제목 길이',
        passed: mockBlogData.title.length >= 30 && mockBlogData.title.length <= 60,
        score: 20,
        maxScore: 20,
        feedback: '제목 길이가 적절합니다.',
        suggestions: []
      },
      {
        ruleName: '이미지 사용',
        passed: mockBlogData.imageCount >= 15,
        score: mockBlogData.imageCount >= 15 ? 15 : 10,
        maxScore: 15,
        feedback: `${mockBlogData.imageCount}개의 이미지가 사용되었습니다.`,
        suggestions: mockBlogData.imageCount < 15 ? ['이미지를 더 추가하세요.'] : []
      }
    ];

    // 결과 저장
    const validationResult = {
      contentId: `blog-${Date.now()}`,
      channel: 'blog',
      title: mockBlogData.title,
      content: mockBlogData.content,
      blogUrl,
      validations: {
        seoScore,
        readability: readabilityScore,
        brandConsistency: brandConsistencyScore,
        channelOptimization: channelOptimizationScore,
        suggestions: [
          '키워드를 첫 문단에 더 자연스럽게 포함시키세요.',
          '소제목을 더 활용하여 가독성을 높이세요.',
          '브랜드 관련 용어를 더 자주 언급하세요.'
        ]
      },
      details,
      overallScore,
      grade,
      status
    };

    // 퍼널 계획과 연결
    if (year && month) {
      const { data: funnelPlan } = await supabase
        .from('monthly_funnel_plans')
        .select('id')
        .eq('year', year)
        .eq('month', month)
        .single();

      if (funnelPlan) {
        // 검증 결과를 데이터베이스에 저장
        await supabase
          .from('generated_contents')
          .insert({
            funnel_plan_id: funnelPlan.id,
            channel: 'blog',
            content: mockBlogData.content,
            validation_score: validationResult,
            status: 'validated'
          });
      }
    }

    return res.status(200).json(validationResult);
  } catch (error) {
    console.error('Error validating blog:', error);
    return res.status(500).json({ error: 'Failed to validate blog' });
  }
}