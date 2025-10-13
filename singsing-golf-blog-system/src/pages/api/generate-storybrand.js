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

    console.log('⚔️ StoryBrand 무기가 되는 스토리 생성 요청:', { 
      title, 
      category,
      currentContentLength: currentContent?.length || 0
    });

    if (!title) {
      return res.status(400).json({ 
        error: '제목이 필요합니다.' 
      });
    }

    // 도널드 밀러 StoryBrand 7단계 프레임워크
    const storyBrandPrompt = `당신은 도널드 밀러의 StoryBrand 프레임워크 전문가입니다.

**제목:** ${title}
**카테고리:** ${category || '일반'}
**키워드:** ${keywords || '없음'}
**기존 내용:** ${currentContent || '없음'}

**StoryBrand 7단계 프레임워크를 적용하여 "무기가 되는 스토리"를 작성해주세요:**

1. **주인공 (고객)**: 비거리가 부족한 골퍼, 동료들에게 뒤떨어지는 골퍼
2. **문제**: 
   - 외부 문제: 비거리 부족, 스코어 개선 안됨
   - 내부 문제: 좌절감, 자신감 상실
   - 철학적 문제: 공정하지 않은 장비의 차이
3. **가이드 (MASSGOO)**: 20년 경험의 피팅 전문가, KGFA/KCA 인증
4. **계획**: 
   - 1단계: 무료 시타 체험
   - 2단계: 초음파 측정기로 정확한 피팅
   - 3단계: 맞춤 드라이버 제작
5. **행동 촉구**: "지금 MASSGOO 수원본점에서 무료 시타 체험하세요"
6. **실패의 대가**: 계속 뒤떨어지는 골프 라이프, 동료들에게 뒤처지는 좌절
7. **성공의 결과**: 비거리 +25m 증가, 동료들에게 인정받는 자신감, 완전히 다른 골프 라이프

**MASSGOO 브랜드 요소:**
- 초고반발 드라이버 (반발계수 0.87)
- 일본 JFE 티타늄
- 10년 샤프트 교환 보증
- 매장 방문 고객 90% 이상 구매율
- 수원 갤러리아 광교 위치

**작성 지침:**
- 감정적으로 몰입할 수 있는 스토리텔링
- 고객의 문제를 명확히 제시
- MASSGOO를 신뢰할 수 있는 가이드로 포지셔닝
- 명확한 행동 촉구 포함
- 마크다운 형식 사용

**무기가 되는 스토리를 마크다운 형식으로 작성해주세요:**`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "당신은 도널드 밀러의 StoryBrand 프레임워크 전문가입니다. 7단계 구조를 활용하여 고객의 문제를 해결하는 '무기가 되는 스토리'를 작성합니다."
        },
        {
          role: "user",
          content: storyBrandPrompt
        }
      ],
      max_tokens: 2500,
      temperature: 0.8
    });

    const storyContent = response.choices[0].message.content;

    console.log('✅ StoryBrand 무기가 되는 스토리 생성 완료:', storyContent.length, '자');

    res.status(200).json({
      success: true,
      storyContent,
      framework: 'StoryBrand 7단계',
      usageInfo: {
        model: response.model,
        tokens: response.usage?.total_tokens || 0,
        cost: response.usage?.total_tokens ? (response.usage.total_tokens * 0.00015 / 1000).toFixed(4) : '0.0000'
      }
    });

  } catch (error) {
    console.error('❌ StoryBrand 스토리 생성 오류:', error);
    res.status(500).json({ 
      error: 'StoryBrand 스토리 생성 중 오류가 발생했습니다.',
      details: error.message 
    });
  }
}
