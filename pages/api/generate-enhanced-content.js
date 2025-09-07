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
2. MASGOLF(마쓰구) - 초고반발 드라이버 전문 브랜드
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
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { 
    title, 
    type, 
    keywords, 
    contentType = 'information', 
    audienceTemp = 'warm', 
    brandWeight = 'medium',
    customerChannel = 'local_customers',
    painPoint = null,
    customerPersona = 'competitive_maintainer',
    enableWebSearch = true
  } = req.body;

  if (!title) {
    return res.status(400).json({ message: 'Title is required' });
  }

  try {
    // 브랜드 정보 검색
    let brandSearchResults = '';
    if (enableWebSearch) {
      console.log('🔍 브랜드 정보 검색 중...');
      
      brandSearchResults = await searchBrandInfo(title);
      
      if (brandSearchResults) {
        console.log('✅ 브랜드 정보 검색 완료:', brandSearchResults.length, '자');
      } else {
        console.log('⚠️ 브랜드 정보 검색 실패');
      }
    }

    // 고객 채널별 맞춤 메시지 생성
    const brandMessage = generateBrandMessage(contentType, audienceTemp, brandWeight, customerChannel);
    const painMessage = painPoint ? generatePainPointMessage(painPoint) : null;
    const persona = CUSTOMER_PERSONAS[customerPersona] || CUSTOMER_PERSONAS.competitive_maintainer;
    const channel = CUSTOMER_CHANNELS[customerChannel] || CUSTOMER_CHANNELS.local_customers;
    
    // 고객 채널별 SEO 키워드 조합
    const channelKeywords = [
      ...SEO_KEYWORDS.primary,
      ...channel.target_areas || [],
      ...(keywords ? keywords.split(', ') : [])
    ].join(', ');

    let prompt = '';
    
    switch (type) {
      case 'excerpt':
        prompt = `골프 드라이버 관련 블로그 포스트의 요약을 작성해주세요.

제목: "${title}"
키워드: ${channelKeywords}
콘텐츠 유형: ${contentType}
오디언스 온도: ${audienceTemp}
브랜드 강도: ${brandWeight}
고객 채널: ${channel.name}
고객 페르소나: ${persona.name}

${brandSearchResults ? `
브랜드 정보:
${brandSearchResults}
` : ''}

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
- 장점: ${channel.advantages?.join(', ')}

${painMessage ? `
페인 포인트 해결:
- 문제: ${painMessage.problem}
- 증상: ${painMessage.symptoms?.join(', ')}
- 해결책: ${painMessage.solution}
- 마쓰구 장점: ${painMessage.masgolf_advantage}
` : ''}

브랜드 메시지:
- 핵심 메시지: ${brandMessage.core?.join(', ')}
- CTA: ${brandMessage.cta}
- 채널 메시지: ${brandMessage.location}
- 신뢰 지표: ${brandMessage.trust?.join(', ')}

요약은 2-3문장으로 핵심 내용을 간결하게 전달하되, 브랜드 정보와 고객 페르소나, 마쓰구 브랜드 가치를 자연스럽게 포함하세요.`;
        break;
        
      case 'content':
        prompt = `골프 드라이버 관련 블로그 포스트의 본문을 작성해주세요.

제목: "${title}"
키워드: ${channelKeywords}
콘텐츠 유형: ${contentType}
오디언스 온도: ${audienceTemp}
브랜드 강도: ${brandWeight}
고객 채널: ${channel.name}
고객 페르소나: ${persona.name}

${brandSearchResults ? `
브랜드 정보:
${brandSearchResults}
` : ''}

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
- 장점: ${channel.advantages?.join(', ')}

${painMessage ? `
페인 포인트 해결:
- 문제: ${painMessage.problem}
- 증상: ${painMessage.symptoms?.join(', ')}
- 해결책: ${painMessage.solution}
- 마쓰구 장점: ${painMessage.masgolf_advantage}
` : ''}

브랜드 메시지:
- 핵심 메시지: ${brandMessage.core?.join(', ')}
- CTA: ${brandMessage.cta}
- 채널 메시지: ${brandMessage.location}
- 신뢰 지표: ${brandMessage.trust?.join(', ')}

본문은 SEO에 최적화되면서도 독자에게 실질적인 도움이 되는 내용으로 작성하세요. 
브랜드 정보를 활용하여 정확한 정보를 포함하고, 고객 페르소나와 마쓰구 브랜드의 구체적인 장점을 자연스럽게 포함하세요.`;
        break;
        
      case 'meta':
        prompt = `골프 드라이버 관련 블로그 포스트의 메타 설명을 작성해주세요.

제목: "${title}"
콘텐츠 유형: ${contentType}
오디언스 온도: ${audienceTemp}
브랜드 강도: ${brandWeight}
고객 채널: ${channel.name}
고객 페르소나: ${persona.name}

${brandSearchResults ? `
브랜드 정보:
${brandSearchResults}
` : ''}

고객 채널 정보:
- 위치: ${channel.location}
- 타겟 지역: ${channel.target_areas?.join(', ')}

브랜드 메시지:
- 핵심 메시지: ${brandMessage.core?.join(', ')}
- 채널 메시지: ${brandMessage.location}

메타 설명은 150-160자 내외로 작성하고, 검색 결과에서 클릭을 유도할 수 있도록 매력적으로 작성하세요.
브랜드 정보와 고객 채널 정보, 마쓰구 브랜드의 핵심 가치를 포함하세요.`;
        break;
        
      default:
        return res.status(400).json({ message: 'Invalid type' });
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini", // 더 정교한 모델 사용
      messages: [
        {
          role: "system",
          content: `당신은 MASGOLF(마쓰구)의 전문 콘텐츠 작가입니다.

MASGOLF(마쓰구) - 초고반발 드라이버 & 맞춤 피팅 전문 브랜드

## 핵심 가치
- 반발계수 0.87의 초고반발 드라이버로 비거리 +25m 증가
- 일본 JFE 티타늄 & DAIDO 티타늄, NGS 샤프트 적용
- 10,000개 이상 판매, 3,000명 이상 맞춤 피팅 상담
- 수원 갤러리아 광교에서 차로 5분 거리 위치
- 10년 샤프트 교환, 3년 헤드 교환 보증

## 기술력
- 시크리트웨폰 4.1/블랙/시크리트포스 골드2: 2.2mm 페이스, 반발계수 0.87
- 시크리트포스 PRO3: 2.3mm 페이스, 반발계수 0.86  
- 시크리트포스 V2: 2.4mm 페이스, 반발계수 0.85

## 신뢰성
- 2011년 중소기업 브랜드 대상 수상
- 2012년 대한민국 골프산업 대상 수상
- 매장 방문 고객 90% 이상 구매율
- 온라인 리뷰 평균 4.6점

다음 원칙을 따라 콘텐츠를 작성하세요:
1. SEO에 최적화되고 독자에게 유용한 콘텐츠 작성
2. 자연스럽게 MASGOLF 브랜드 가치 전달
3. 고객의 비거리 문제 해결에 집중
4. 구체적인 데이터와 실적 제시
5. 지역 기반 접근성 강조
6. 오디언스 온도에 맞는 메시지 강도 조정
7. 브랜드 정보를 활용한 정확한 정보 포함
8. 골프 브랜드(마루망 등)에 대한 정확한 정보 제공`
        },
        {
          role: "user",
          content: prompt
        }
      ],
      max_tokens: 1500,
    });

    const generatedContent = completion.choices[0].message.content.trim();

    res.status(200).json({ 
      content: generatedContent,
      strategy: {
        contentType,
        audienceTemp, 
        brandWeight,
        customerChannel,
        painPoint,
        customerPersona,
        keyMessages: brandMessage.core,
        cta: brandMessage.cta,
        channelInfo: channel
      },
      webSearchEnabled: enableWebSearch,
      webSearchResults: brandSearchResults ? '브랜드 정보가 포함되었습니다' : '브랜드 정보 검색을 사용하지 않았습니다'
    });

  } catch (error) {
    console.error('Error generating enhanced content:', error);
    res.status(500).json({ message: 'Failed to generate enhanced content', error: error.message });
  }
}
