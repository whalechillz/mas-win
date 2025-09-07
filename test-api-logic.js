const { 
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
} = require('./lib/masgolf-brand-data');

console.log('Testing API logic...');

const title = "70대 박회장님의 골프 인생 2막 - MASGOLF 드라이버로 되찾은 자신감";
const type = "excerpt";
const keywords = "고반발드라이버,골프드라이버,MASGOLF";
const contentType = "customer_story";
const audienceTemp = "warm";
const brandWeight = "high";
const customerChannel = "local_customers";
const painPoint = "distance";
const customerPersona = "returning_60plus";

try {
  // 고객 채널별 맞춤 메시지 생성
  const brandMessage = generateBrandMessage(contentType, audienceTemp, brandWeight, customerChannel);
  console.log('brandMessage:', brandMessage);
  
  const painMessage = painPoint ? generatePainPointMessage(painPoint) : null;
  console.log('painMessage:', painMessage);
  
  const persona = CUSTOMER_PERSONAS[customerPersona] || CUSTOMER_PERSONAS.competitive_maintainer;
  console.log('persona:', persona.name);
  
  const channel = CUSTOMER_CHANNELS[customerChannel] || CUSTOMER_CHANNELS.local_customers;
  console.log('channel:', channel.name);
  
  // 고객 채널별 SEO 키워드 조합
  const channelKeywords = [
    ...SEO_KEYWORDS.primary,
    ...channel.target_areas || [],
    ...(keywords ? keywords.split(', ') : [])
  ].join(', ');
  console.log('channelKeywords length:', channelKeywords.length);

  // 콘텐츠 유형별 템플릿 선택
  const template = CONTENT_TEMPLATES[contentType] || CONTENT_TEMPLATES.information;
  console.log('template:', template ? 'found' : 'not found');
  
  // 프롬프트 생성 시뮬레이션
  console.log('Testing prompt generation...');
  
  const prompt = `골프 드라이버 관련 블로그 포스트의 요약을 작성해주세요.

제목: "${title}"
키워드: ${channelKeywords}
콘텐츠 유형: ${contentType}
오디언스 온도: ${audienceTemp}
브랜드 강도: ${brandWeight}
고객 채널: ${channel.name}
고객 페르소나: ${persona.name}

고객 페르소나 정보:
-- 특성: ${persona.characteristics}
-- 핵심 관심사: ${persona.core_concerns?.join(', ')}
-- 동기: ${persona.motivations?.join(', ')}
-- 페인 포인트: ${persona.pain_points?.join(', ')}
-- 마쓰구 포커스: ${persona.masgolf_focus}
-- 매슬로 욕구: ${persona.maslow_needs?.join(', ')}

고객 채널 정보:
-- 위치: ${channel.location}
-- 접근성: ${channel.accessibility?.join(', ')}
-- 타겟 지역: ${channel.target_areas?.join(', ')}
-- 장점: ${channel.advantages?.join(', ')}

${painMessage ? `
페인 포인트 해결:
-- 문제: ${painMessage.problem}
-- 증상: ${painMessage.symptoms?.join(', ')}
-- 해결책: ${painMessage.solution}
-- 마쓰구 장점: ${painMessage.masgolf_advantage}
` : ''}

브랜드 메시지:
-- 핵심 메시지: ${brandMessage.core?.join(', ')}
-- CTA: ${brandMessage.cta}
-- 채널 메시지: ${brandMessage.location}
-- 신뢰 지표: ${brandMessage.trust?.join(', ')}

요약은 2-3문장으로 핵심 내용을 간결하게 전달하되, 고객 페르소나와 채널 정보, 마쓰구 브랜드 가치를 자연스럽게 포함하세요.`;

  console.log('Prompt generated successfully, length:', prompt.length);
  
} catch (error) {
  console.error('Error in API logic test:', error.message);
  console.error('Stack:', error.stack);
}
