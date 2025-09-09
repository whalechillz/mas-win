import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { contentSource, contentType, customerPersona, customerChannel, brandWeight } = req.body;

    if (!contentSource || !contentSource.trim()) {
      return res.status(400).json({ message: '콘텐츠 소스가 필요합니다.' });
    }

    console.log('🤖 AI 제목 생성 시작...');
    console.log('콘텐츠 소스:', contentSource);

    // 브랜드 전략에 따른 프롬프트 구성
    const brandContext = `
브랜드 전략:
- 콘텐츠 유형: ${contentType || '골프 정보'}
- 고객 페르소나: ${customerPersona || '중상급 골퍼'}
- 고객 채널: ${customerChannel || '내방고객'}
- 브랜드 강도: ${brandWeight || '중간'}
`;

    const systemPrompt = `당신은 SEO 전문가이자 마케팅 콘텐츠 제목 작성 전문가입니다. 

주어진 콘텐츠 소스와 브랜드 전략을 바탕으로 SEO 최적화되고 후킹력 있는 블로그 제목 5개를 생성해주세요.

제목 작성 규칙:
1. SEO 최적화: 검색량이 높은 키워드 포함
2. 후킹력: 클릭하고 싶게 만드는 매력적인 제목
3. 브랜드 통합: MASSGOO 브랜드 자연스럽게 포함
4. 길이: 30-60자 내외 (모바일 친화적)
5. 감정적 어필: 호기심, 흥미, 욕구 자극
6. 구체적 수치: "25m 증가", "90% 만족" 등 구체적 데이터 포함
7. 타겟 고객: 50-70대 골퍼에게 어필
8. 지역성: "군산", "전국" 등 지역 키워드 활용

제목 스타일:
- "○○○로 비거리 25m 증가한 50대 골퍼의 성공 스토리"
- "군산에서 화제! MASSGOO 드라이버 맞춤 피팅 후기"
- "신성대 교수님이 선택한 MASSGOO 시크리트포스 PRO3의 비밀"
- "50대 골퍼도 가능한 비거리 향상! MASSGOO 드라이버 피팅 체험기"
- "전국 3,000명이 인정한 MASSGOO 맞춤 피팅의 진실"

응답 형식: JSON 배열로 제목만 반환
["제목1", "제목2", "제목3", "제목4", "제목5"]`;

    const userPrompt = `${brandContext}

콘텐츠 소스 & 글감:
${contentSource}

위 정보를 바탕으로 SEO 최적화되고 후킹력 있는 블로그 제목 5개를 생성해주세요.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      temperature: 0.8,
      max_tokens: 1000
    });

    const response = completion.choices[0].message.content;
    console.log('ChatGPT 응답:', response);

    // JSON 파싱 시도
    let titles;
    try {
      titles = JSON.parse(response);
    } catch (parseError) {
      console.error('JSON 파싱 오류:', parseError);
      // JSON 파싱 실패 시 텍스트에서 제목 추출
      const lines = response.split('\n').filter(line => line.trim());
      titles = lines
        .map(line => line.replace(/^\d+\.\s*/, '').replace(/^["']|["']$/g, '').trim())
        .filter(title => title.length > 10 && title.length < 100);
    }

    if (!Array.isArray(titles) || titles.length === 0) {
      throw new Error('제목 생성에 실패했습니다.');
    }

    console.log('✅ AI 제목 생성 완료:', titles.length, '개');
    console.log('생성된 제목들:', titles);

    res.status(200).json({
      success: true,
      titles: titles,
      metadata: {
        contentType,
        customerPersona,
        customerChannel,
        brandWeight,
        generatedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('AI 제목 생성 오류:', error);
    res.status(500).json({ 
      message: 'AI 제목 생성에 실패했습니다.',
      error: error.message 
    });
  }
}
