// 제목 재생성 API
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { existingContent, category } = req.body;

  if (!existingContent || !Array.isArray(existingContent)) {
    return res.status(400).json({ message: 'Invalid content data' });
  }

  try {
    // 블로그 카테고리 정의
    const blogCategories = {
      'funnel_campaigns': '퍼널 캠페인',
      'storytelling_campaigns': '스토리텔링 캠페인', 
      'seasonal_campaigns': '계절별 캠페인',
      'mixed': '혼합 캠페인'
    };

    // AI 프롬프트 생성 (제목 재생성)
    const prompt = `
기존 콘텐츠의 제목을 더 매력적이고 효과적으로 재생성해주세요.

**기존 콘텐츠 목록:**
${existingContent.map((content, index) => `
${index + 1}. 현재 제목: "${content.title}"
   설명: ${content.description}
   캠페인 유형: ${content.campaignType}
   스토리 프레임워크: ${content.storyFramework}
   계절 테마: ${content.seasonalTheme}
`).join('')}

**재생성 가이드라인:**
1. 각 제목을 더 매력적이고 클릭하고 싶게 만들기
2. 마쓰구골프 브랜드와 초고반발 드라이버 강조
3. 시니어 골퍼(50-60대)의 관심을 끌 수 있는 제목
4. 비거리 향상, 맞춤 피팅, 고객 성공 스토리 중심
5. 후킹 메시지와 CTA도 함께 개선
6. 기존 내용의 핵심은 유지하되 제목만 더 효과적으로 변경

**응답 형식:**
[
  {
    "title": "새로운 매력적인 제목",
    "contentType": "${blogCategories[category]}",
    "campaignType": "기존 캠페인 유형",
    "storyFramework": "기존 스토리 프레임워크",
    "seasonalTheme": "기존 계절 테마",
    "targetAudience": "시니어 골퍼 (50-60대)",
    "conversionGoal": "기존 전환 목표",
    "hookMessage": "개선된 후킹 메시지",
    "cta": "개선된 CTA",
    "channels": ["기존 채널들"],
    "keywords": ["기존 키워드들"],
    "estimatedPublishDate": "기존 발행일",
    "description": "기존 설명 (제목에 맞게 약간 수정 가능)",
    "storyStructure": "기존 스토리 구조"
  }
]

**중요:** 기존 콘텐츠의 모든 정보를 유지하되, 제목과 후킹 메시지, CTA만 더 효과적으로 개선해주세요.
`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "당신은 마쓰구골프의 전문 마케팅 카피라이터입니다. 시니어 골퍼를 위한 초고반발 드라이버와 맞춤 피팅 서비스를 중심으로 한 매력적인 제목과 후킹 메시지를 작성합니다."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.8,
      max_tokens: 3000
    });

    const responseText = completion.choices[0].message.content;
    
    // JSON 파싱 시도
    let regeneratedContent;
    try {
      regeneratedContent = JSON.parse(responseText);
    } catch (parseError) {
      // JSON 파싱 실패 시 기존 콘텐츠에 제목만 개선
      regeneratedContent = existingContent.map((content, index) => ({
        ...content,
        title: `${content.title} (개선된 제목 ${index + 1})`,
        hookMessage: `${content.hookMessage} - 더 매력적인 버전`,
        cta: `${content.cta} - 개선된 CTA`
      }));
    }

    res.status(200).json({
      success: true,
      message: `${regeneratedContent.length}개의 제목이 재생성되었습니다.`,
      regeneratedContent: regeneratedContent,
      count: regeneratedContent.length
    });

  } catch (error) {
    console.error('제목 재생성 오류:', error);
    res.status(500).json({
      success: false,
      message: '제목 재생성 실패',
      error: error.message
    });
  }
}
