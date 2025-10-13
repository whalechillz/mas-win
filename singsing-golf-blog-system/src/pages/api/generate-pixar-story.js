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

    console.log('🎬 픽사 스토리 생성 요청:', { 
      title, 
      category,
      currentContentLength: currentContent?.length || 0
    });

    if (!title) {
      return res.status(400).json({ 
        error: '제목이 필요합니다.' 
      });
    }

    // 픽사 스토리텔링 프레임워크
    const pixarPrompt = `당신은 픽사 스토리텔링 전문가입니다.

**제목:** ${title}
**카테고리:** ${category || '일반'}
**키워드:** ${keywords || '없음'}
**기존 내용:** ${currentContent || '없음'}

**픽사 스토리텔링 프레임워크를 적용하여 스토리를 작성해주세요:**

**픽사 5단계 구조:**
1. **Once upon a time** (옛날 옛적에): 평범한 골퍼의 일상
2. **And every day** (그리고 매일): 비거리 부족으로 인한 반복되는 좌절
3. **Until one day** (그런데 어느 날): MASSGOO 드라이버 발견
4. **Because of that** (그래서): 맞춤 피팅과 드라이버 제작
5. **Until finally** (마침내): 비거리 +25m 증가, 완전히 다른 골프 라이프

**MASSGOO 브랜드 요소:**
- 초고반발 드라이버 (반발계수 0.87)
- 일본 JFE 티타늄
- 10년 샤프트 교환 보증
- 매장 방문 고객 90% 이상 구매율
- 수원 갤러리아 광교 위치

**작성 지침:**
- 감정적으로 몰입할 수 있는 스토리텔링
- 고객의 변화 과정을 생생하게 묘사
- Before & After의 대비를 명확히 제시
- 희망적이고 긍정적인 결말
- 마크다운 형식 사용

**픽사 스토리를 마크다운 형식으로 작성해주세요:**`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "당신은 픽사 스토리텔링 전문가입니다. 5단계 구조를 활용하여 감동적이고 몰입감 있는 스토리를 작성합니다."
        },
        {
          role: "user",
          content: pixarPrompt
        }
      ],
      max_tokens: 2500,
      temperature: 0.8
    });

    const storyContent = response.choices[0].message.content;

    console.log('✅ 픽사 스토리 생성 완료:', storyContent.length, '자');

    res.status(200).json({
      success: true,
      storyContent,
      framework: '픽사 5단계',
      usageInfo: {
        model: response.model,
        tokens: response.usage?.total_tokens || 0,
        cost: response.usage?.total_tokens ? (response.usage.total_tokens * 0.00015 / 1000).toFixed(4) : '0.0000'
      }
    });

  } catch (error) {
    console.error('❌ 픽사 스토리 생성 오류:', error);
    res.status(500).json({ 
      error: '픽사 스토리 생성 중 오류가 발생했습니다.',
      details: error.message 
    });
  }
}
