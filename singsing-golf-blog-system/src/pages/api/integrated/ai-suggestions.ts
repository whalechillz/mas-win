import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { content, scores, channel, details } = req.body;

  try {
    // AI 개선 제안 생성 (실제로는 Claude API를 사용하지만, 여기서는 규칙 기반 제안)
    const suggestions = [];

    // SEO 점수 기반 제안
    if (scores.seoScore < 80) {
      suggestions.push('SEO 최적화: 타겟 키워드를 제목과 첫 문단에 자연스럽게 포함시키세요.');
      suggestions.push('메타 설명을 150-160자로 작성하고 주요 키워드를 포함시키세요.');
      if (scores.seoScore < 60) {
        suggestions.push('내부 링크를 3-5개 추가하여 사이트 내 다른 관련 콘텐츠와 연결하세요.');
      }
    }

    // 가독성 점수 기반 제안
    if (scores.readability < 80) {
      suggestions.push('가독성 개선: 문장을 더 짧고 명확하게 작성하세요. (권장: 40-60자)');
      suggestions.push('단락을 더 짧게 나누고, 각 단락은 하나의 주제에 집중하세요.');
      if (scores.readability < 60) {
        suggestions.push('소제목을 더 많이 사용하여 콘텐츠 구조를 명확히 하세요.');
      }
    }

    // 브랜드 일관성 기반 제안
    if (scores.brandConsistency < 80) {
      suggestions.push('브랜드 강화: 브랜드명과 핵심 메시지를 더 자주 언급하세요.');
      suggestions.push('브랜드의 톤앤매너를 일관되게 유지하세요.');
    }

    // 채널별 최적화 제안
    switch (channel) {
      case 'blog':
        if (scores.channelOptimization < 80) {
          suggestions.push('블로그 최적화: 이미지를 20개 이상 사용하여 시각적 흥미를 높이세요.');
          suggestions.push('위치 정보와 지도를 포함하여 로컬 SEO를 강화하세요.');
          suggestions.push('관련 동영상을 1-2개 포함하여 체류 시간을 늘리세요.');
        }
        break;
        
      case 'email':
        if (scores.channelOptimization < 80) {
          suggestions.push('이메일 최적화: 제목을 50자 이내로 줄이고 긴급성을 부여하세요.');
          suggestions.push('프리헤더 텍스트를 활용하여 오픈율을 높이세요.');
          suggestions.push('CTA 버튼을 상단에 배치하고 명확한 행동 유도 문구를 사용하세요.');
        }
        break;
        
      case 'kakao':
      case 'sms':
        if (scores.channelOptimization < 80) {
          suggestions.push('메시지 최적화: 핵심 메시지를 첫 20자 이내에 배치하세요.');
          suggestions.push('이모지를 적절히 사용하여 주목도를 높이세요.');
          suggestions.push('단축 URL을 사용하여 클릭률을 측정하세요.');
        }
        break;
        
      case 'instagram':
        if (scores.channelOptimization < 80) {
          suggestions.push('인스타그램 최적화: 해시태그를 10-15개 사용하세요.');
          suggestions.push('첫 문장에 핵심 메시지를 담아 "더보기" 전에 관심을 끌어보세요.');
          suggestions.push('위치 태그를 추가하여 로컬 노출을 늘리세요.');
        }
        break;
    }

    // 전체 점수가 낮은 경우 추가 제안
    const overallScore = (scores.seoScore + scores.readability + scores.brandConsistency + scores.channelOptimization) / 4;
    if (overallScore < 70) {
      suggestions.push('전체적인 콘텐츠 품질 향상을 위해 전문 에디터의 검토를 받는 것을 고려하세요.');
      suggestions.push('경쟁사의 우수 콘텐츠를 벤치마킹하여 개선점을 찾아보세요.');
    }

    // 중복 제거 및 우선순위 정렬
    const uniqueSuggestions = [...new Set(suggestions)];

    return res.status(200).json(uniqueSuggestions.slice(0, 10)); // 최대 10개 제안
  } catch (error) {
    console.error('Error generating AI suggestions:', error);
    return res.status(500).json({ error: 'Failed to generate AI suggestions' });
  }
}