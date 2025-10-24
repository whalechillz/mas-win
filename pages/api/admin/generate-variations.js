// 브랜드 전략 베리에이션 생성 API
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req, res) {
  // API 타임아웃 설정 (60초)
  res.setTimeout(60000);
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { 
    variations,
    originalContent = '',
    contentType = '골프 정보'
  } = req.body;

  if (!variations || !Array.isArray(variations)) {
    return res.status(400).json({ error: '베리에이션 데이터가 필요합니다.' });
  }

  try {
    console.log('🎯 브랜드 전략 베리에이션 생성 시작...');
    console.log('📝 베리에이션 개수:', variations.length);
    
    const results = [];
    
    for (const variation of variations) {
      console.log(`🔄 베리에이션 생성 중: ${variation.variationName}`);
      
      try {
        // 베리에이션별 프롬프트 생성
      const getVariationPrompt = (variation) => {
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
        return frameworkPrompts[variation.framework] || frameworkPrompts['PAS'];
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

      const prompt = `
당신은 네이버 블로그에 최적화된 골프 콘텐츠를 작성하는 전문가입니다.

**베리에이션 설정:**
- 콘텐츠 유형: ${variation.contentType}
- 페르소나: ${getPersonaPrompt(variation.persona)}
- 스토리텔링 프레임워크: ${getVariationPrompt(variation)}
- 고객 채널: ${variation.channel}
- 브랜드 강도: ${getBrandStrengthPrompt(variation.brandStrength)}
- 오디언스 온도: ${variation.audienceTemperature}
- 전환 목표: ${variation.conversionGoal}
- 베리에이션 유형: ${variation.variationType}
- 베리에이션 이름: ${variation.variationName}

${originalContent ? `**원본 콘텐츠:**\n${originalContent}\n` : ''}

**작성 요구사항:**
1. 네이버 블로그에 최적화된 형식으로 작성
2. SEO 친화적인 제목과 본문
3. 마쓰구골프(MASGOLF) 브랜드 자연스럽게 언급
4. ${getPersonaPrompt(variation.persona)}가 관심을 가질 만한 내용
5. ${getVariationPrompt(variation)} 구조를 따라 작성
6. ${getBrandStrengthPrompt(variation.brandStrength)}
7. 1500-2000자 분량의 상세한 본문
8. 네이버 블로그 태그에 적합한 키워드 포함
9. 오토플렉스샤프트, 티타늄그라파이트샤프트 등 롱테일 키워드 포함

**응답 형식:**
{
  "title": "네이버 블로그 제목",
  "content": "마크다운 형식의 본문 내용",
  "excerpt": "블로그 요약 (100-150자)",
  "keywords": ["키워드1", "키워드2", "키워드3"],
  "naverTags": ["네이버태그1", "네이버태그2", "네이버태그3"],
  "variationInfo": {
    "type": "${variation.variationType}",
    "name": "${variation.variationName}",
    "brandStrength": "${variation.brandStrength}",
    "persona": "${variation.persona}"
  }
}

위 형식으로 JSON 응답해주세요.
`;

      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7,
        max_tokens: 2000,
        response_format: { type: "json_object" }
      });

      const result = JSON.parse(response.choices[0].message.content);
        results.push({
          ...result,
          variationInfo: {
            type: variation.variationType,
            name: variation.variationName,
            brandStrength: variation.brandStrength,
            persona: variation.persona
          }
        });
        
        console.log(`✅ 베리에이션 생성 완료: ${variation.variationName}`);
        
      } catch (variationError) {
        console.error(`❌ 베리에이션 생성 실패 (${variation.variationName}):`, variationError);
        results.push({
          error: `베리에이션 생성 실패: ${variationError.message}`,
          variationInfo: {
            type: variation.variationType,
            name: variation.variationName,
            brandStrength: variation.brandStrength,
            persona: variation.persona
          }
        });
      }
    }

    res.status(200).json({
      success: true,
      variations: results,
      totalCount: results.length,
      generatedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ 베리에이션 생성 오류:', error);
    res.status(500).json({ 
      success: false,
      error: '베리에이션 생성 실패',
      details: error.message
    });
  }
}
