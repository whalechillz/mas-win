import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // OpenAI API 키 확인
    if (!process.env.OPENAI_API_KEY) {
      console.error('❌ OpenAI API 키가 설정되지 않았습니다.');
      return res.status(500).json({ 
        message: 'OpenAI API 키가 설정되지 않았습니다.',
        error: 'OPENAI_API_KEY environment variable is missing'
      });
    }

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

    const systemPrompt = `당신은 창의적인 SEO 전문가이자 마케팅 심리학 기반 콘텐츠 제목 작성 전문가입니다. 

로버트 치알디니의 6가지 영향력 원칙과 뇌과학 기반 후킹 기법을 적용하여 **완전히 다른 스타일과 접근법**으로 SEO 최적화되고 후킹력 있는 블로그 제목 5개를 생성해주세요.

**🧠 뇌과학 기반 후킹 기법:**
1. **본능적 생존 관련**: "위험", "위협", "생존", "안전", "보호" 등 생존 본능 자극
2. **사회적 증명**: "90%가 선택", "전문가 추천", "실제 고객 후기", "인기 1위"
3. **호기심 격차**: "아무도 모르는", "숨겨진", "비밀", "놀라운 진실"
4. **구체적 숫자**: "25m 증가", "3배 빠른", "90% 만족", "7일 만에"
5. **감정적 트리거**: "놀라움", "두려움", "욕구", "신뢰", "호기심"

**🎯 치알디니 6가지 원칙 적용:**
1. **상호성**: "무료", "특별 혜택", "감사", "선물"
2. **일관성**: "약속", "보장", "확실한", "검증된"
3. **사회적 증명**: "많은 사람들이", "인기", "추천", "후기"
4. **호감**: "친근한", "신뢰할 수 있는", "전문적인"
5. **권위**: "전문가", "교수", "연구", "데이터"
6. **희소성**: "한정", "마감", "특별", "독점"

**다양성 요구사항:**
- 각 제목은 서로 다른 심리학 원리 적용
- 다양한 감정적 어필 (호기심, 놀라움, 신뢰, 욕구, 두려움, 희소성 등)
- 다양한 문체 (질문형, 감탄형, 서술형, 비교형, 경험형, 비밀형)
- 다양한 키워드 조합과 표현 방식

제목 작성 규칙:
1. SEO 최적화: 검색량이 높은 키워드 포함
2. 후킹력: 클릭하고 싶게 만드는 매력적인 제목
3. 브랜드 통합: MASSGOO 브랜드 자연스럽게 포함 (모든 제목에 강제로 넣지 말고 필요시에만)
4. 길이: 25-70자 내외 (모바일 친화적)
5. 감정적 어필: 호기심, 흥미, 욕구, 놀라움, 신뢰 등 다양한 감정 자극
6. 구체적 수치: "25m 증가", "90% 만족" 등 구체적 데이터 포함 (일부 제목에만)
7. 타겟 고객: 50-70대 골퍼에게 어필 (다양한 연령대 표현)
8. 지역성: "군산", "전국" 등 지역 키워드 활용 (일부 제목에만)

**제목 스타일 다양성 (심리학 기반):**
- 호기심 격차형: "아무도 모르는 드라이버 비거리 향상 비법"
- 사회적 증명형: "90%의 50대 골퍼가 선택한 MASSGOO 드라이버"
- 본능적 생존형: "골프장에서 당신을 구할 드라이버가 있다"
- 희소성/특별함형: "한정판 초고반발 드라이버의 놀라운 실력"
- 권위/전문성형: "골프 전문가가 추천하는 드라이버 선택법"
- 상호성/혜택형: "무료 맞춤 피팅으로 찾은 완벽한 드라이버"
- 감정적 경험형: "3개월 사용 후기: MASSGOO 드라이버의 진짜 실력"
- 비교/대조형: "기존 드라이버 vs MASSGOO, 25m 차이의 비밀"

**중요:** 각 제목은 완전히 다른 심리학 원리와 접근법을 사용하여 다양성을 극대화하세요.

응답 형식: JSON 배열로 제목만 반환
["제목1", "제목2", "제목3", "제목4", "제목5"]`;

    // 심리학 기반 랜덤 요소 추가
    const psychologicalElements = [
      '호기심 격차', '사회적 증명', '본능적 생존', '희소성/특별함', '권위/전문성',
      '상호성/혜택', '감정적 경험', '비교/대조', '놀라운 결과', '숨겨진 비밀',
      '전문가 추천', '실제 고객 후기', '구체적 수치', '감정적 트리거', '완벽한 솔루션'
    ];
    const randomElement = psychologicalElements[Math.floor(Math.random() * psychologicalElements.length)];
    
    const userPrompt = `${brandContext}

콘텐츠 소스 & 글감:
${contentSource}

**심리학 기반 다양성 요구사항:**
- ${randomElement} 원리를 우선 적용
- 각 제목은 완전히 다른 심리학 원리와 접근법 사용
- 치알디니 6가지 원칙과 뇌과학 후킹 기법 활용
- 다양한 감정적 어필과 문체 활용
- 브랜드명을 모든 제목에 강제로 넣지 말고 자연스럽게 포함

위 정보를 바탕으로 **완전히 다른 심리학 원리**를 적용한 SEO 최적화되고 후킹력 있는 블로그 제목 5개를 생성해주세요.`;

    console.log('🔑 OpenAI API 키 확인:', process.env.OPENAI_API_KEY ? '설정됨' : '설정되지 않음');
    console.log('📝 프롬프트 길이:', systemPrompt.length + userPrompt.length);

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      temperature: 1.2, // 창의성과 다양성을 위해 증가
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
    console.error('❌ AI 제목 생성 오류:', error);
    console.error('❌ 오류 스택:', error.stack);
    
    // OpenAI API 오류인 경우 더 자세한 정보 제공
    if (error.message.includes('API key') || error.message.includes('authentication')) {
      return res.status(500).json({ 
        message: 'OpenAI API 인증 오류입니다. API 키를 확인해주세요.',
        error: error.message,
        type: 'authentication_error'
      });
    }
    
    // 네트워크 오류인 경우
    if (error.message.includes('fetch') || error.message.includes('network')) {
      return res.status(500).json({ 
        message: '네트워크 오류입니다. 잠시 후 다시 시도해주세요.',
        error: error.message,
        type: 'network_error'
      });
    }
    
    res.status(500).json({ 
      message: 'AI 제목 생성에 실패했습니다.',
      error: error.message,
      type: 'unknown_error'
    });
  }
}
