import OpenAI from 'openai';
import { 
  SEO_KEYWORDS, 
  PAIN_POINTS, 
  CUSTOMER_CHANNELS, 
  TRUST_INDICATORS,
  CONTENT_TEMPLATES,
  CUSTOMER_PERSONAS,
  MASLOW_NEEDS_MAPPING,
  CONTENT_STRATEGY,
  generateBrandMessage,
  generatePainPointMessage
} from '../../lib/masgolf-brand-data';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// GPT-4o-mini를 통한 브랜드 정보 검색
const searchBrandInfo = async (title) => {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `당신은 골프 브랜드 전문가입니다. 다음 브랜드들에 대한 정확한 정보를 제공하세요:

1. 마루망(Marumang) - 한국 골프 브랜드
2. MASSGOO(마쓰구) - 초고반발 드라이버 전문 브랜드
3. 기타 골프 브랜드들

제목에서 언급된 브랜드에 대한 정확한 정보, 특징, 기술력, 시장 포지션 등을 제공하세요.`
        },
        {
          role: "user",
          content: `다음 제목에서 언급된 골프 브랜드에 대한 정보를 제공해주세요: "${title}"`
        }
      ],
      max_tokens: 300,
      temperature: 0.3,
    });

    return response.choices[0].message.content;
  } catch (error) {
    console.error('Brand search error:', error);
    return null;
  }
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { 
      title, 
      type, 
      contentType, 
      audienceTemp, 
      brandWeight, 
      customerChannel, 
      customerPersona, 
      painPoint, 
      keywords,
      excerpt 
    } = req.body;

    console.log('🔍 요청 데이터:', { title, type, contentType, audienceTemp, brandWeight, customerChannel, customerPersona, painPoint });

    // 브랜드 강도에 따른 브랜드 정보 검색
    let brandSearchResults = null;
    if (brandWeight === 'high' || brandWeight === 'medium') {
      console.log('🔍 브랜드 정보 검색 중...');
      brandSearchResults = await searchBrandInfo(title);
      console.log('✅ 브랜드 정보 검색 완료:', brandSearchResults ? `${brandSearchResults.length} 자` : '0 자');
    } else {
      console.log('ℹ️ 브랜드 강도가 낮아 브랜드 정보 검색을 건너뜁니다.');
    }

    // 고객 페르소나와 채널 정보 가져오기
    const persona = CUSTOMER_PERSONAS[customerPersona] || CUSTOMER_PERSONAS['performance_maintainer'];
    const channel = CUSTOMER_CHANNELS[customerChannel] || CUSTOMER_CHANNELS.local_customers;
    const painMessage = painPoint ? generatePainPointMessage(painPoint) : null;
    const brandMessage = generateBrandMessage(contentType, audienceTemp, brandWeight, customerChannel);

    // 키워드 구성
    const channelKeywords = [
      ...SEO_KEYWORDS.primary,
      ...channel.target_areas || [],
      ...(keywords ? keywords.split(', ') : [])
    ].join(', ');

    let prompt = '';
    
    switch (type) {
      case 'excerpt':
        prompt = `골프 관련 블로그 포스트의 요약을 작성해주세요.

제목: "${title}"
키워드: ${channelKeywords}
콘텐츠 유형: ${contentType}
오디언스 온도: ${audienceTemp}
브랜드 강도: ${brandWeight}
고객 채널: ${channel.name}
고객 페르소나: ${persona.name}`;

        if (brandSearchResults) {
          prompt += `

브랜드 정보:
${brandSearchResults}`;
        }

        if (brandWeight === 'high' || brandWeight === 'medium') {
          prompt += `

고객 페르소나 정보:
- 특성: ${persona.characteristics}
- 핵심 관심사: ${persona.core_concerns?.join(', ')}
- 동기: ${persona.motivations?.join(', ')}
- 페인 포인트: ${persona.pain_points?.join(', ')}
- 마쓰구 포커스: ${persona.masgolf_focus}
- 매슬로 욕구: ${persona.maslow_needs?.join(', ')}

고객 채널 정보:
- 위치: ${channel.location}
- 접근성: ${channel.accessibility?.join(', ')}
- 타겟 지역: ${channel.target_areas?.join(', ')}
- 장점: ${channel.advantages?.join(', ')}`;

          if (painMessage) {
            prompt += `

페인 포인트 해결:
- 문제: ${painMessage.problem}
- 증상: ${painMessage.symptoms?.join(', ')}
- 해결책: ${painMessage.solution}
- 마쓰구 장점: ${painMessage.masgolf_advantage}`;
          }

          prompt += `

브랜드 메시지:
- 핵심 메시지: ${brandMessage.core?.join(', ')}
- CTA: ${brandMessage.cta}
- 채널 메시지: ${brandMessage.location}
- 신뢰 지표: ${brandMessage.trust?.join(', ')}
- 강조 방향: ${brandMessage.emphasis}`;
        } else {
          prompt += `

고객 페르소나 정보:
- 특성: ${persona.characteristics}
- 핵심 관심사: ${persona.core_concerns?.join(', ')}
- 동기: ${persona.motivations?.join(', ')}
- 페인 포인트: ${persona.pain_points?.join(', ')}
- 매슬로 욕구: ${persona.maslow_needs?.join(', ')}

브랜드 메시지:
- 강조 방향: ${brandMessage.emphasis}`;
        }

        prompt += `

요약은 2-3문장으로 핵심 내용을 간결하게 전달하되, 브랜드 정보와 고객 페르소나, 마쓰구 브랜드 가치를 자연스럽게 포함하세요.`;
        break;
        
      case 'content':
        prompt = `골프 관련 블로그 포스트의 본문을 작성해주세요.

제목: "${title}"
키워드: ${channelKeywords}
콘텐츠 유형: ${contentType}
오디언스 온도: ${audienceTemp}
브랜드 강도: ${brandWeight}
고객 채널: ${channel.name}
고객 페르소나: ${persona.name}`;

        // 고객 스토리인 경우 특별한 프롬프트 추가
        if (contentType === 'customer_story') {
          prompt += `

고객 스토리 전용 본문 작성 가이드:
다음 스토리텔링 프레임워크를 활용하여 작성하세요:

1. 도널드 밀러의 StoryBrand 프레임워크:
   - 영웅: 고객 (골퍼)
   - 문제: 비거리 감소, 나이로 인한 체력 저하
   - 가이드: MASSGOO (전문 피팅사)
   - 계획: 맞춤 피팅 + 초고반발 드라이버
   - 행동 유도: 무료 시타 체험 예약
   - 실패: 기존 드라이버로는 한계
   - 성공: 비거리 25m 증가, 자신감 회복

2. 픽사 스토리텔링:
   - 한때는: 평범한 골퍼였던 고객
   - 매일: 비거리가 줄어드는 고민
   - 어느 날: MASGSGOO 드라이버를 만남
   - 그 때문에: 맞춤 피팅을 받게 됨
   - 그 때문에: 비거리가 25m 증가
   - 마침내: 골프의 재미를 다시 찾음

3. 로버트 치알디니의 설득의 심리학:
   - 상호성: 무료 피팅 상담과 시타 체험
   - 일관성: 고객의 골프 실력 향상 목표
   - 사회적 증명: 10,000명 이상의 만족한 고객
   - 권위: KCA 인증 피팅 전문가
   - 호감: 친근하고 전문적인 서비스
   - 희소성: 한정 수량의 프리미엄 드라이버

4. 매슬로의 욕구 단계:
   - 생리적 욕구: 체력 저하로 인한 골프 어려움
   - 안전 욕구: 안정적인 비거리 확보
   - 소속 욕구: 골프 동호회에서의 인정
   - 존경 욕구: 동료들보다 뛰어난 실력
   - 자아실현: 골프를 통한 자기 실현

5. 감정적 연결고리:
   - 공감: "나도 그런 고민이 있었어요"
   - 희망: "이제는 해결되었어요"
   - 신뢰: "전문가의 도움을 받았어요"
   - 성취: "목표를 달성했어요"

이 프레임워크들을 활용하여 감동적이고 설득력 있는 고객 스토리를 작성하세요.`;
        }

        if (excerpt) {
          prompt += `

기존 요약 내용 (이 내용을 바탕으로 본문을 작성하세요):
${excerpt}`;
        }

        if (brandWeight === 'high' || brandWeight === 'medium') {
          prompt += `

고객 페르소나 정보:
- 특성: ${persona.characteristics}
- 핵심 관심사: ${persona.core_concerns?.join(', ')}
- 동기: ${persona.motivations?.join(', ')}
- 페인 포인트: ${persona.pain_points?.join(', ')}
- 마쓰구 포커스: ${persona.masgolf_focus}
- 매슬로 욕구: ${persona.maslow_needs?.join(', ')}

고객 채널 정보:
- 위치: ${channel.location}
- 접근성: ${channel.accessibility?.join(', ')}
- 타겟 지역: ${channel.target_areas?.join(', ')}
- 장점: ${channel.advantages?.join(', ')}`;

          if (painMessage) {
            prompt += `

페인 포인트 해결:
- 문제: ${painMessage.problem}
- 증상: ${painMessage.symptoms?.join(', ')}
- 해결책: ${painMessage.solution}
- 마쓰구 장점: ${painMessage.masgolf_advantage}`;
          }

          prompt += `

브랜드 메시지:
- 핵심 메시지: ${brandMessage.core?.join(', ')}
- CTA: ${brandMessage.cta}
- 채널 메시지: ${brandMessage.location}
- 신뢰 지표: ${brandMessage.trust?.join(', ')}
- 강조 방향: ${brandMessage.emphasis}

본문은 SEO에 최적화되면서도 독자에게 실질적인 도움이 되는 내용으로 작성하세요. 
${excerpt ? '기존 요약 내용을 바탕으로 더 자세하고 구체적인 내용으로 확장하여 작성하세요. 요약의 핵심 내용을 본문에서 더 풍부하게 설명하세요.' : ''}
브랜드 정보를 활용하여 정확한 정보를 포함하고, 고객 페르소나와 마쓰구 브랜드의 구체적인 장점을 자연스럽게 포함하세요.`;
        } else {
          prompt += `

고객 페르소나 정보:
- 특성: ${persona.characteristics}
- 핵심 관심사: ${persona.core_concerns?.join(', ')}
- 동기: ${persona.motivations?.join(', ')}
- 페인 포인트: ${persona.pain_points?.join(', ')}
- 매슬로 욕구: ${persona.maslow_needs?.join(', ')}

브랜드 메시지:
- 강조 방향: ${brandMessage.emphasis}

본문은 SEO에 최적화되면서도 독자에게 실질적인 도움이 되는 내용으로 작성하세요. 
${excerpt ? '기존 요약 내용을 바탕으로 더 자세하고 구체적인 내용으로 확장하여 작성하세요. 요약의 핵심 내용을 본문에서 더 풍부하게 설명하세요.' : ''}
순수한 정보 제공에 집중하고, 브랜드 언급은 최소화하세요. 독자에게 실질적인 도움이 되는 유용한 정보를 중심으로 작성하세요.`;
        }
        break;
        
      case 'meta':
        prompt = `골프 관련 블로그 포스트의 메타 설명을 작성해주세요.

제목: "${title}"
키워드: ${channelKeywords}
콘텐츠 유형: ${contentType}
오디언스 온도: ${audienceTemp}
브랜드 강도: ${brandWeight}
고객 채널: ${channel.name}
고객 페르소나: ${persona.name}`;

        // 고객 스토리인 경우 특별한 프롬프트 추가
        if (contentType === 'customer_story') {
          prompt += `

고객 스토리 전용 메타 설명 작성 가이드:
- 실제 고객의 성공 경험을 강조
- 구체적인 수치와 결과 포함 (예: 비거리 25m 증가)
- 감정적 연결고리와 공감대 형성
- "나도 할 수 있다"는 희망 메시지 포함
- 150자 이내로 간결하게 작성`;
        }

        if (brandSearchResults) {
          prompt += `

브랜드 정보:
${brandSearchResults}`;
        }

        if (brandWeight === 'high' || brandWeight === 'medium') {
          prompt += `

고객 채널 정보:
- 위치: ${channel.location}
- 타겟 지역: ${channel.target_areas?.join(', ')}

브랜드 메시지:
- 핵심 메시지: ${brandMessage.core?.join(', ')}
- 채널 메시지: ${brandMessage.location}
- 강조 방향: ${brandMessage.emphasis}

메타 설명은 150-160자 내외로 작성하고, 검색 결과에서 클릭을 유도할 수 있도록 매력적으로 작성하세요.
브랜드 정보와 고객 채널 정보, 마쓰구 브랜드의 핵심 가치를 포함하세요.`;
        } else {
          prompt += `

브랜드 메시지:
- 강조 방향: ${brandMessage.emphasis}

메타 설명은 150-160자 내외로 작성하고, 검색 결과에서 클릭을 유도할 수 있도록 매력적으로 작성하세요.
순수한 정보 제공에 집중하고, 브랜드 언급은 최소화하세요. 독자에게 실질적인 도움이 되는 유용한 정보를 중심으로 작성하세요.`;
        }
        break;
        
      default:
        return res.status(400).json({ message: 'Invalid type' });
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini", // 더 정교한 모델 사용
      messages: [
        {
          role: "system",
          content: `당신은 MASSGOO(마쓰구)의 전문 콘텐츠 작가입니다.

MASSGOO(마쓰구) - 초고반발 드라이버 & 맞춤 피팅 전문 브랜드

## 핵심 가치
- 반발계수 0.87의 초고반발 드라이버로 비거리 +25m 증가
- 일본 JFE 티타늄 & DAIDO 티타늄, NGS 샤프트 적용
- 10,000개 이상 판매, 3,000명 이상 맞춤 피팅 상담
- 수원 갤러리아 광교에서 차로 5분 거리 위치
- 10년 샤프트 교환, 3년 헤드 교환 보증

## 기술력
- 시크리트웨폰 4.1/블랙/시크리트포스 골드2: 2.2mm 페이스, 반발계수 0.87
- 시크리트포스 PRO3: 2.3mm 페이스, 반발계수 0.86  
- 시크리트포스 V3: 2.4mm 페이스, 반발계수 0.85

## 신뢰성
- 2011년 중소기업 브랜드 대상 수상
- 2012년 대한민국 골프산업 대상 수상
- 매장 방문 고객 90% 이상 구매율
- KFGA/KCA 인증 피팅 전문가 상담

## 고객 성공 사례
- 50대 골퍼: 비거리 25m 증가, 핸디캡 5타 개선
- 60대 골퍼: 체력 저하 극복, 골프 재미 재발견
- 70대 골퍼: 안정적인 비거리 확보, 자신감 회복

당신의 임무는 이 정보를 바탕으로 고품질의 콘텐츠를 작성하는 것입니다.`
        },
        {
          role: "user",
          content: prompt
        }
      ],
      max_tokens: 2000,
      temperature: 0.7,
    });

    const result = completion.choices[0].message.content;
    
    console.log(`✅ ${type} 생성 완료:`, result ? `${result.length} 자` : '0 자');
    
    res.status(200).json({ 
      content: result,
      type: type,
      brandWeight: brandWeight,
      brandSearchResults: brandSearchResults
    });

  } catch (error) {
    console.error('Content generation error:', error);
    res.status(500).json({ 
      message: 'AI 콘텐츠 생성에 실패했습니다.',
      error: error.message 
    });
  }
}