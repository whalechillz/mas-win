// 네이버 블로그 AI 콘텐츠 생성 API
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { 
    roughContent, 
    contentType = '골프 정보',
    persona = 'tech_enthusiast',
    framework = 'PAS',
    channel = 'local',
    brandStrength = '낮음',
    audienceTemperature = 'warm',
    conversionGoal = 'consideration',
    platform = 'naver'
  } = req.body;

  if (!roughContent || !roughContent.trim()) {
    return res.status(400).json({ error: '러프 콘텐츠가 필요합니다.' });
  }

  try {
    console.log('🤖 네이버 블로그 AI 콘텐츠 생성 시작...');
    console.log('📝 입력 콘텐츠:', roughContent.substring(0, 100) + '...');
    
    // 브랜드 전략 기반 프롬프트 생성
    const getFrameworkPrompt = (framework) => {
      const frameworkPrompts = {
        'PAS': 'PAS (Problem-Agitate-Solution) 구조: 문제 제시 → 자극 → 해결책',
        'STDC': 'STDC (Star-Trouble-Discovery-Change) 구조: 영웅 → 문제 → 발견 → 변화',
        'FAB': 'FAB (Feature-Advantage-Benefit) 구조: 기능 → 장점 → 혜택',
        'AIDA': 'AIDA (Attention-Interest-Desire-Action) 구조: 주목 → 관심 → 욕구 → 행동',
        'ACCA': 'ACCA (Awareness-Comprehension-Conviction-Action) 구조: 인식 → 이해 → 확신 → 행동',
        'QUEST': 'QUEST (Qualify-Understand-Educate-Stimulate-Transition) 구조: 자격 → 이해 → 교육 → 자극 → 전환',
        'pixar': '픽사 스토리 구조: 옛날 옛적에... 매일매일... 그러던 어느 날...',
        'heros_journey': 'Hero\'s Journey 구조: 평범한 세계 → 모험의 부름 → 시련 → 보상 → 귀환',
        'storybrand': '스토리브랜드 7단계: 영웅 → 문제 → 가이드 → 계획 → 행동 요청 → 실패 회피 → 성공',
        'cialdini': '치알디니 설득의 6가지 원칙: 상호성, 일관성, 사회적 증거, 호감, 권위, 희소성',
        'customer_journey': '고객 여정 스토리: 인지 → 관심 → 고려 → 구매 → 옹호'
      };
      return frameworkPrompts[framework] || frameworkPrompts['PAS'];
    };

    const getPersonaPrompt = (persona) => {
      const personaPrompts = {
        'tech_enthusiast': '장비 선호 고객 (Tech 얼리어답터): 최신 기술 관심, 고성능 장비 선호, 온라인 정보 탐색',
        'senior_fitting': '시니어 피팅 고객: 건강 고려, 편안한 타구감, 오프라인 매장 선호',
        'high_rebound_enthusiast': '고반발 드라이버 선호 상급 골퍼: 나이로 인한 비거리 감소를 보완하고 싶은 자신감 있는 골퍼',
        'competitive_maintainer': '경기력을 유지하고 싶은 중상급 골퍼: 최신 기술과 장비를 통해 경쟁력을 유지하고 싶은 경쟁심 강한 골퍼',
        'health_conscious_senior': '건강을 고려한 비거리 증가 시니어 골퍼: 건강을 유지하며 골프 실력을 보존하고 싶은 시니어',
        'returning_60plus': '최근 골프를 다시 시작한 60대 이상 골퍼: 나이에 따른 체력과 기술 보완을 원하는 꾸준한 연습 의지가 강한 골퍼',
        'distance_seeking_beginner': '골프 입문자를 위한 비거리 향상 초급 골퍼: 빠른 실력 향상을 통해 골프에 대한 자신감을 회복하고 싶은 초보자'
      };
      return personaPrompts[persona] || personaPrompts['tech_enthusiast'];
    };

    const getBrandStrengthPrompt = (brandStrength) => {
      const strengthPrompts = {
        '낮음': '브랜드 언급 최소화, 순수한 정보 제공에 집중',
        '중간': '자연스러운 브랜드 언급, 교육적 콘텐츠 중심',
        '높음': '강력한 브랜드 스토리텔링, 적극적 브랜드 홍보'
      };
      return strengthPrompts[brandStrength] || strengthPrompts['낮음'];
    };

    // 네이버 블로그에 최적화된 프롬프트 생성 (강력한 스토리텔링 강화)
    const prompt = `
당신은 네이버 블로그에 최적화된 골프 콘텐츠를 작성하는 전문가입니다. 강력한 스토리텔링과 감정적 연결을 통해 독자의 마음을 움직이는 콘텐츠를 작성합니다.

**입력된 러프 콘텐츠:**
${roughContent}

**브랜드 전략 설정:**
- 콘텐츠 유형: ${contentType}
- 페르소나: ${getPersonaPrompt(persona)}
- 스토리텔링 프레임워크: ${getFrameworkPrompt(framework)}
- 고객 채널: ${channel}
- 브랜드 강도: ${getBrandStrengthPrompt(brandStrength)}
- 오디언스 온도: ${audienceTemperature}
- 전환 목표: ${conversionGoal}

**강력한 스토리텔링 요구사항:**
1. **감정적 연결**: 독자의 고민과 꿈에 공감하는 스토리
2. **구체적 사례**: 실제 고객의 경험담이나 구체적인 상황 제시
3. **변화의 여정**: 문제 → 시련 → 해결 → 성과의 스토리 구조
4. **감정적 언어**: "아쉬움", "기대", "성취감", "자신감" 등 감정 표현
5. **시각적 묘사**: 구체적인 장면과 상황 묘사
6. **대화체 활용**: 독자와의 직접적인 소통 느낌

**작성 요구사항:**
1. 네이버 블로그에 최적화된 형식으로 작성
2. SEO 친화적인 제목과 본문
3. 마쓰구골프(MASGOLF) 브랜드 자연스럽게 언급
4. ${getPersonaPrompt(persona)}가 깊이 공감할 수 있는 내용
5. ${getFrameworkPrompt(framework)} 구조를 따라 강력한 스토리 작성
6. ${getBrandStrengthPrompt(brandStrength)}
7. 1500-2000자 분량의 상세하고 감동적인 본문
8. 네이버 블로그 태그에 적합한 키워드 포함
9. **스토리 중심**: 정보 전달보다는 스토리와 감정에 집중

**응답 형식:**
{
  "title": "감정적이고 매력적인 네이버 블로그 제목",
  "content": "마크다운 형식의 강력한 스토리가 담긴 본문 내용",
  "excerpt": "독자의 마음을 움직이는 블로그 요약 (100-150자)",
  "keywords": ["키워드1", "키워드2", "키워드3"],
  "naverTags": ["네이버태그1", "네이버태그2", "네이버태그3"]
}

위 형식으로 JSON 응답해주세요.
`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "당신은 네이버 블로그에 최적화된 골프 콘텐츠를 작성하는 전문가입니다. 강력한 스토리텔링과 감정적 연결을 통해 독자의 마음을 움직이는 콘텐츠를 작성합니다. 마쓰구골프(MASGOLF) 브랜드의 장점을 자연스럽게 녹여내면서도 독자의 고민과 꿈에 공감하는 감동적인 스토리를 만들어냅니다. 구체적인 사례와 변화의 여정을 통해 독자가 깊이 공감할 수 있는 내용을 작성합니다."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      max_tokens: 3000,
      temperature: 0.7
    });

    const aiResponse = response.choices[0].message.content.trim();
    console.log('✅ AI 응답 받음:', aiResponse.substring(0, 200) + '...');

    // JSON 파싱 시도
    let result;
    try {
      result = JSON.parse(aiResponse);
    } catch (parseError) {
      console.error('❌ JSON 파싱 오류:', parseError);
      // JSON 파싱 실패 시 기본 구조로 응답
      result = {
        title: "AI가 생성한 제목",
        content: aiResponse,
        excerpt: aiResponse.substring(0, 150) + "...",
        keywords: ["골프", "드라이버", "비거리"],
        naverTags: ["골프", "드라이버", "마쓰구프"]
      };
    }

    console.log('✅ 네이버 블로그 콘텐츠 생성 완료');
    
    res.status(200).json({
      success: true,
      title: result.title || "AI가 생성한 제목",
      content: result.content || aiResponse,
      excerpt: result.excerpt || aiResponse.substring(0, 150) + "...",
      keywords: result.keywords || ["골프", "드라이버", "비거리"],
      naverTags: result.naverTags || ["골프", "드라이버", "마쓰구프"],
      generatedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ AI 콘텐츠 생성 오류:', error);
    res.status(500).json({ 
      error: 'AI 콘텐츠 생성 중 오류가 발생했습니다.',
      details: error.message 
    });
  }
}
