import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { 
      title,
      currentContent,
      category,
      keywords
    } = req.body;

    console.log('🛤️ 고객 여정 스토리 생성 요청:', { 
      title, 
      category,
      currentContentLength: currentContent?.length || 0
    });

    if (!title) {
      return res.status(400).json({ 
        error: '제목이 필요합니다.' 
      });
    }

    // 고객 여정 스토리 프레임워크
    const journeyPrompt = `당신은 고객 여정 스토리텔링 전문가입니다.

**제목:** ${title}
**카테고리:** ${category || '일반'}
**키워드:** ${keywords || '없음'}
**기존 내용:** ${currentContent || '없음'}

**고객 여정 스토리 프레임워크를 적용하여 스토리를 작성해주세요:**

**고객 여정 5단계:**
1. **인식 (Awareness)**: 비거리 문제 인식, 동료들과의 차이 느낌
2. **고려 (Consideration)**: 다양한 해결책 탐색, MASSGOO 발견
3. **의사결정 (Decision)**: 무료 시타 체험, 피팅 상담
4. **구매 (Purchase)**: 맞춤 드라이버 주문, 제작 과정
5. **경험 (Experience)**: 비거리 +25m 증가, 동료들에게 인정받는 경험

**MASSGOO 브랜드 요소:**
- 초고반발 드라이버 (반발계수 0.87)
- 일본 JFE 티타늄
- 10년 샤프트 교환 보증
- 매장 방문 고객 90% 이상 구매율
- 수원 갤러리아 광교 위치

**작성 지침:**
- 고객의 심리적 변화 과정을 단계별로 묘사
- 각 단계에서의 감정과 생각을 생생하게 표현
- MASSGOO와의 만남이 고객에게 미치는 영향 강조
- 최종 결과의 긍정적 변화를 명확히 제시
- 마크다운 형식 사용

**고객 여정 스토리를 마크다운 형식으로 작성해주세요:**`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "당신은 고객 여정 스토리텔링 전문가입니다. 5단계 여정을 통해 고객의 변화 과정을 생생하게 묘사합니다."
        },
        {
          role: "user",
          content: journeyPrompt
        }
      ],
      max_tokens: 2500,
      temperature: 0.8
    });

    const storyContent = response.choices[0].message.content;

    console.log('✅ 고객 여정 스토리 생성 완료:', storyContent.length, '자');

    res.status(200).json({
      success: true,
      storyContent,
      framework: '고객 여정 5단계',
      usageInfo: {
        model: response.model,
        tokens: response.usage?.total_tokens || 0,
        cost: response.usage?.total_tokens ? (response.usage.total_tokens * 0.00015 / 1000).toFixed(4) : '0.0000'
      }
    });

  } catch (error) {
    console.error('❌ 고객 여정 스토리 생성 오류:', error);
    res.status(500).json({ 
      error: '고객 여정 스토리 생성 중 오류가 발생했습니다.',
      details: error.message 
    });
  }
}
