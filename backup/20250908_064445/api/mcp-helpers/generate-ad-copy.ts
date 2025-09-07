import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { year, month, theme, funnelPlan, channel, requirements } = req.body;

    // Claude MCP를 통한 광고 카피 생성
    const prompt = `
      골프장 구글 광고 카피를 생성해주세요.
      
      캠페인 정보:
      - 연도/월: ${year}년 ${month}월
      - 월별 테마: ${theme || '프리미엄 골프 경험'}
      - 타겟: ${funnelPlan?.targetAudience || '30-50대 골프 애호가'}
      
      요구사항:
      - 헤드라인: 최대 ${requirements.headline.maxLength}자, ${requirements.headline.count}개
      - 설명: 최대 ${requirements.description.maxLength}자, ${requirements.description.count}개
      
      톤앤매너:
      - 전문적이면서 친근한
      - 혜택 중심의 메시지
      - 행동 유도가 명확한
      
      반드시 포함할 키워드:
      - 프리미엄 골프
      - 특별 혜택
      - 예약
    `;

    // Claude API 호출 시뮬레이션
    // 실제 구현에서는 Claude API를 직접 호출
    const headlines = [
      `${month}월 특별! 프리미엄 골프 예약 혜택`,
      `지금 예약하고 특별 할인 받으세요`,
      `${theme} - 최고의 골프 경험`
    ];

    const descriptions = [
      `${year}년 ${month}월 한정 특별 혜택. 프리미엄 골프장에서 잊지 못할 라운딩을 경험하세요. 조기 예약 시 추가 할인!`,
      `최고급 시설과 서비스로 완벽한 골프 라운딩. 지금 예약하고 ${month}월 특별 혜택을 받으세요.`
    ];

    // 생성된 광고 카피 반환
    return res.status(200).json({
      success: true,
      headlines: headlines.slice(0, requirements.headline.count),
      descriptions: descriptions.slice(0, requirements.description.count),
      metadata: {
        year,
        month,
        theme,
        channel,
        generatedAt: new Date().toISOString()
      },
      tips: [
        'UTM 태그를 정확히 설정하세요',
        '랜딩 페이지와 메시지 일관성 유지',
        'A/B 테스트로 최적의 카피 찾기'
      ]
    });
  } catch (error) {
    console.error('Error generating ad copy:', error);
    return res.status(500).json({ error: 'Failed to generate ad copy' });
  }
}
