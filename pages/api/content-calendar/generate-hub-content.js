// 허브 콘텐츠 전용 AI 생성 API
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { 
    campaignType,        // 퍼널/스토리텔링/계절별/혼합
    targetAudience,      // 시니어 골퍼, 중급자 등
    contentGoal,         // 인지/고려/전환
    season,              // 봄/여름/가을/겨울
    count = 12,          // 생성할 콘텐츠 개수
    uploadedMdFiles = [] // 업로드된 MD 파일 (선택적)
  } = req.body;

  try {
    console.log('🎯 허브 콘텐츠 AI 생성 시작:', { campaignType, targetAudience, contentGoal, season, count });

    // 실제 운영 블로그 카테고리 (AI 컨텍스트용)
    const realBlogCategories = [
      "고객 후기", "제품 정보", "골프 팁", "이벤트", "공지사항"
    ];

    // 계절별 테마 정의
    const seasonalThemes = {
      spring: ['봄 골프 준비', '신년 골프 목표', '봄 시즌 오픈', '봄 골프 워밍업'],
      summer: ['여름 골프 전략', '더위 속 골프', '여름 골프 장비', '여름 골프 건강관리'],
      autumn: ['가을 골프 정리', '가을 골프 피팅', '겨울 준비', '가을 골프 마무리'],
      winter: ['겨울 골프 연습', '실내 골프', '겨울 골프 장비', '겨울 골프 준비']
    };

    // 퍼널 캠페인 데이터 (기존 generate-annual.js에서 재사용)
    const funnelCampaigns = [
      {
        title: "이웃집 김선생의 비거리 비밀",
        type: "인지 단계",
        storyFramework: "pixar",
        description: "은퇴한 60대 김선생님이 갑자기 드라이버 비거리 20m를 늘린 비밀을 이야기 형태로 전달",
        hookMessage: "동년배 몰래 연습하더니 드라이버 비거리가 갑자기 20m 늘었다?!",
        cta: "무료 시타 예약하기",
        channels: ["facebook", "kakao", "blog"],
        seasonalTheme: "봄 골프 준비"
      },
      {
        title: "3초 완판 스크래치 세일",
        type: "전환/인지 혼합",
        storyFramework: "cialdini",
        description: "돌핀웨일 사례처럼 강력한 세일 이벤트로 관심과 구매를 동시에 노리는 캠페인",
        hookMessage: "※한정 50세트: 스크래치 카드를 긁고 당신의 할인율을 확인하세요!※",
        cta: "지금 바로 전화해서 할인 적용 받기",
        channels: ["kakao", "sms", "email"],
        seasonalTheme: "여름 골프 전략"
      },
      {
        title: "인스타 친구 추천 챌린지",
        type: "신뢰 단계",
        storyFramework: "donald_miller",
        description: "고객이 친구에게 추천하는 자연스러운 바이럴 마케팅 캠페인",
        hookMessage: "친구가 '어디서 샀어?'라고 물어보는 드라이버",
        cta: "친구와 함께 무료 피팅 받기",
        channels: ["instagram", "kakao", "blog"],
        seasonalTheme: "가을 골프 정리"
      }
    ];

    // 캠페인 유형별 차별화된 프롬프트 생성
    const getCampaignSpecificPrompt = (campaignType) => {
      const campaignPrompts = {
        '퍼널 캠페인': `
**퍼널 캠페인 특화 요구사항:**
- 인지 단계: 문제 인식, 관심 유발에 집중
- 고려 단계: 솔루션 비교, 신뢰도 구축에 집중  
- 전환 단계: 구매 유도, 행동 촉구에 집중
- 각 단계별 맞춤형 메시지와 CTA 생성
- 퍼널 단계에 따른 감정적 강도 조절`,
        
        '스토리텔링 캠페인': `
**스토리텔링 캠페인 특화 요구사항:**
- 감정적 스토리 구조 (도널드 밀러 7단계 스토리 공식)
- 고객 여정 중심의 서사적 접근
- 인물, 갈등, 해결의 3단 구조
- 감정적 몰입과 공감대 형성
- 스토리텔링 프레임워크 활용 (pixar, donald_miller, cialdini)`,
        
        '계절별 캠페인': `
**계절별 캠페인 특화 요구사항:**
- ${season} 계절의 특성을 반영한 콘텐츠
- 계절별 골프 상황과 고객 니즈 반영
- 시기적절한 이벤트와 프로모션 연계
- 계절별 골프 장비와 피팅 특성 강조
- 계절 전환 시점의 고객 관심사 반영`,
        
        '혼합': `
**혼합 캠페인 특화 요구사항:**
- 퍼널 + 스토리텔링 + 계절 요소를 모두 활용
- 각 콘텐츠마다 다른 접근 방식 적용
- 다양한 마케팅 전략의 조합
- 고객 여정의 다양한 단계 커버
- 창의적이고 다양한 콘텐츠 유형 생성`
      };
      return campaignPrompts[campaignType] || campaignPrompts['퍼널 캠페인'];
    };

    // 타겟 오디언스별 차별화
    const getAudienceSpecificPrompt = (targetAudience) => {
      const audiencePrompts = {
        '시니어 골퍼': `
**시니어 골퍼 특화 접근:**
- 나이와 경험을 존중하는 톤앤매너
- 건강과 안전을 고려한 메시지
- 경험과 지혜를 강조하는 스토리
- 편안하고 신뢰감 있는 브랜드 톤
- 구체적이고 실용적인 조언 중심`,
        
        '중급자 골퍼': `
**중급자 골퍼 특화 접근:**
- 기술 향상과 성과에 집중
- 도전과 성취감을 자극하는 메시지
- 구체적인 기술적 조언과 팁
- 동기부여와 성장 스토리 중심
- 실력 향상에 대한 욕구 자극`,
        
        '초보자 골퍼': `
**초보자 골퍼 특화 접근:**
- 친근하고 격려하는 톤앤매너
- 기본기와 기초에 집중한 내용
- 두려움과 부담감을 줄이는 메시지
- 단계별 학습 가이드 제공
- 성공 경험과 자신감 부여`,
        
        '전체': `
**전체 오디언스 접근:**
- 다양한 수준의 골퍼를 고려한 내용
- 포용적이고 접근하기 쉬운 메시지
- 공통 관심사와 보편적 가치 강조
- 다양한 경험과 배경을 반영
- 모든 레벨에서 공감할 수 있는 스토리`
      };
      return audiencePrompts[targetAudience] || audiencePrompts['시니어 골퍼'];
    };

    // 콘텐츠 목표별 차별화
    const getGoalSpecificPrompt = (contentGoal) => {
      const goalPrompts = {
        '인지': `
**인지 단계 특화 요구사항:**
- 브랜드와 제품에 대한 인지도 향상
- 문제 상황과 해결책 제시
- 교육적이고 정보 제공 중심
- 신뢰도와 전문성 강조
- "자세히 알아보기" CTA`,
        
        '고려': `
**고려 단계 특화 요구사항:**
- 솔루션 비교와 장점 강조
- 고객 후기와 성공 사례 중심
- 경쟁사 대비 우위점 제시
- 구체적인 혜택과 가치 제안
- "무료 상담 신청하기" CTA`,
        
        '전환': `
**전환 단계 특화 요구사항:**
- 구매 결정을 유도하는 강력한 메시지
- 한정성과 긴급성 강조
- 특별 혜택과 프로모션 중심
- 행동 촉구와 즉시 반응 유도
- "지금 바로 시작하기" CTA`
      };
      return goalPrompts[contentGoal] || goalPrompts['인지'];
    };

    // AI 프롬프트 생성 (허브 콘텐츠 중심)
    const prompt = `
마쓰구골프(MASGOLF)를 위한 허브 콘텐츠를 생성해주세요.

**캠페인 유형: ${campaignType}**
**타겟 오디언스: ${targetAudience}**
**콘텐츠 목표: ${contentGoal}**
**계절: ${season}**
**생성 개수: ${count}개**

${getCampaignSpecificPrompt(campaignType)}

${getAudienceSpecificPrompt(targetAudience)}

${getGoalSpecificPrompt(contentGoal)}

**실제 운영 블로그 카테고리 (참고):**
${realBlogCategories.map(cat => `- ${cat}`).join('\n')}

**계절별 테마:**
${seasonalThemes[season] ? seasonalThemes[season].map(theme => `- ${theme}`).join('\n') : ''}

**기존 퍼널 캠페인 (참고):**
${funnelCampaigns.map(campaign => `
- ${campaign.title} (${campaign.type})
  스토리 프레임워크: ${campaign.storyFramework}
  후킹 메시지: ${campaign.hookMessage}
  CTA: ${campaign.cta}
  채널: ${campaign.channels.join(', ')}
  계절 테마: ${campaign.seasonalTheme}
`).join('')}

${uploadedMdFiles && uploadedMdFiles.length > 0 ? `
**업로드된 파일 내용 (참고 자료):**
${uploadedMdFiles.map(file => `
파일명: ${file.name}
파일 형식: ${file.type || '알 수 없음'}
내용:
${file.content}
---`).join('')}
` : ''}

**다양성 강화 요구사항:**
- 각 콘텐츠마다 다른 접근 방식과 스타일 적용
- 다양한 제목 패턴과 톤앤매너 사용
- 서로 다른 스토리텔링 구조와 프레임워크 활용
- 각기 다른 고객 페르소나와 상황 설정
- 다양한 키워드와 메시지 포지셔닝

**생성 요구사항:**
1. **제목**: 60자 이내, SEO 최적화, 클릭 유도력, 감정적 훅 포함
   - 각 콘텐츠마다 다른 제목 패턴 사용 (질문형, 선언형, 스토리형, 숫자형 등)
2. **요약 (다른 채널 활용용)**: 150-200자, 핵심 메시지, 명확한 CTA 포함
   - 각기 다른 CTA와 메시지 구조 적용
3. **간단한 개요**: 300-400자, 상세 설명, 구체적 혜택, 다음 단계 안내
   - 서로 다른 스토리 구조와 설명 방식 사용

**인간적 톤앤매너 (다양성 포함):**
- 감정적 연결을 만드는 스토리텔링 (다양한 감정 톤)
- 고객의 실제 고민과 해결책 제시 (다양한 문제 상황)
- 자연스러운 대화체 톤앤매너 (다양한 대화 스타일)
- 구체적이고 현실적인 사례 (다양한 고객 사례)
- 전문적이지만 친근한 브랜드 톤 (다양한 전문성 수준)

**응답 형식 (정확히 ${count}개):**
반드시 유효한 JSON 배열 형태로 응답해주세요.

[
  {
    "title": "제목 (60자 이내)",
    "summary": "요약 (150-200자, 다른 채널 활용용)",
    "overview": "간단한 개요 (300-400자)",
    "keywords": ["키워드1", "키워드2", "키워드3"],
    "recommendedChannels": ["blog", "sms", "kakao"],
    "blogCategory": "고객 후기",
    "seasonalTheme": "봄 골프 준비",
    "storyFramework": "pixar",
    "targetAudience": "시니어 골퍼",
    "contentGoal": "인지"
  }
]
`;

    console.log('🤖 AI 프롬프트 생성 완료, OpenAI API 호출 중...');

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 4000,
      temperature: 0.8
    });

    const responseText = response.choices[0].message.content.trim();
    console.log('✅ AI 응답 받음, JSON 파싱 시도 중...');

    // JSON 파싱 시도
    let hubContents;
    try {
      hubContents = JSON.parse(responseText);
      console.log('✅ JSON 파싱 성공:', hubContents.length, '개 허브 콘텐츠 생성');
    } catch (parseError) {
      console.error('❌ JSON 파싱 실패:', parseError.message);
      console.log('🔍 원본 응답:', responseText);
      
      // JSON 파싱 실패 시 기본 구조로 생성
      hubContents = generateFallbackHubContent(count, campaignType, season);
      console.log('🔄 Fallback 함수 실행:', hubContents.length, '개 허브 콘텐츠 생성');
    }

    res.status(200).json({
      success: true,
      message: `${hubContents.length}개의 허브 콘텐츠가 생성되었습니다.`,
      hubContents: hubContents,
      totalCount: hubContents.length,
      campaignType: campaignType,
      season: season,
      targetAudience: targetAudience,
      contentGoal: contentGoal
    });

  } catch (error) {
    console.error('허브 콘텐츠 생성 오류:', error);
    res.status(500).json({
      success: false,
      message: '허브 콘텐츠 생성 실패',
      error: error.message
    });
  }
}

// JSON 파싱 실패 시 사용할 기본 허브 콘텐츠 생성 (다양성 강화)
function generateFallbackHubContent(count, campaignType, season) {
  // 캠페인 유형별 다양한 제목 패턴
  const titlePatterns = {
    '퍼널 캠페인': [
      "60대도 가능한가? 마쓰구프 드라이버로 비거리 20m 늘리기",
      "동년배들이 몰래 찾는 드라이버 피팅의 비밀",
      "은퇴 후 골프 인생을 바꾼 초고반발 드라이버 이야기",
      "시니어 골퍼를 위한 맞춤형 드라이버 선택 가이드",
      "3개월 만에 비거리 30m 늘린 65세 김씨의 비밀",
      "동년배들 사이에서 화제인 드라이버가 있다?"
    ],
    '스토리텔링 캠페인': [
      "은퇴 후 첫 골프, 마쓰구프 드라이버와의 만남",
      "30년 골프 인생의 전환점이 된 한 번의 피팅",
      "동년배들의 부러움을 사는 비거리의 비밀",
      "골프장에서 들려오는 성공 스토리",
      "은퇴 후 새로운 도전, 마쓰구프와 함께",
      "골프 인생의 두 번째 기회"
    ],
    '계절별 캠페인': [
      `${season} 골프 준비, 마쓰구프 드라이버로 시작하세요`,
      `${season} 시즌 맞춤 드라이버 피팅 이벤트`,
      `${season} 골프를 위한 특별한 드라이버 선택법`,
      `${season} 골프장에서 빛나는 마쓰구프 드라이버`,
      `${season} 골프 라이프를 바꾸는 한 번의 선택`,
      `${season} 골프의 새로운 시작`
    ],
    '혼합': [
      "마쓰구프 드라이버로 시작하는 골프 인생의 두 번째 장",
      "동년배들이 인정하는 드라이버의 진짜 가치",
      "은퇴 후 골프, 마쓰구프와 함께하는 새로운 도전",
      "30년 골프 경험담, 마쓰구프 드라이버 이야기",
      "골프장에서 만난 인생의 전환점",
      "시니어 골퍼를 위한 특별한 드라이버 가이드"
    ]
  };

  const summaryPatterns = {
    '퍼널 캠페인': [
      "나이에 상관없이 비거리 향상이 가능한 맞춤 피팅 시스템으로 골프 라이프를 바꿔보세요. 무료 상담 신청하기 →",
      "동년배들의 성공 사례를 통해 마쓰구프 드라이버의 놀라운 효과를 확인하세요. 지금 체험 예약하기 →",
      "은퇴 후 골프에 더 집중할 수 있게 된 비거리 향상의 비밀을 공개합니다. 자세히 알아보기 →"
    ],
    '스토리텔링 캠페인': [
      "은퇴 후 골프 인생의 새로운 시작, 마쓰구프 드라이버와 함께하세요. 성공 스토리 확인하기 →",
      "30년 골프 경험담을 바탕으로 한 드라이버 선택의 지혜를 공유합니다. 스토리 더 보기 →",
      "동년배들의 부러움을 사는 비거리 향상의 감동적인 이야기를 들어보세요. 전체 스토리 보기 →"
    ],
    '계절별 캠페인': [
      `${season} 골프를 위한 특별한 드라이버 피팅으로 새로운 시즌을 준비하세요. ${season} 특가 확인하기 →`,
      `${season} 골프장에서 빛나는 마쓰구프 드라이버의 성능을 경험해보세요. ${season} 이벤트 참여하기 →`,
      `${season} 골프 라이프를 바꾸는 한 번의 선택, 마쓰구프와 함께 시작하세요. ${season} 프로모션 보기 →`
    ],
    '혼합': [
      "마쓰구프 드라이버로 시작하는 골프 인생의 두 번째 장을 함께 써내려가세요. 지금 시작하기 →",
      "동년배들이 인정하는 드라이버의 진짜 가치를 경험해보세요. 무료 체험 신청하기 →",
      "은퇴 후 골프, 마쓰구프와 함께하는 새로운 도전의 시작입니다. 도전하기 →"
    ]
  };

  const blogCategories = ["고객 후기", "제품 정보", "골프 팁", "이벤트", "공지사항"];
  const channels = ["blog", "sms", "kakao"];
  const frameworks = ["pixar", "donald_miller", "cialdini"];
  const contentGoals = ["인지", "고려", "전환"];
  const targetAudiences = ["시니어 골퍼", "중급자 골퍼", "초보자 골퍼"];

  const contents = [];
  const titles = titlePatterns[campaignType] || titlePatterns['퍼널 캠페인'];
  const summaries = summaryPatterns[campaignType] || summaryPatterns['퍼널 캠페인'];

  for (let i = 0; i < count; i++) {
    contents.push({
      title: titles[i % titles.length],
      summary: summaries[i % summaries.length],
      overview: `마쓰구프 드라이버의 놀라운 성능과 맞춤 피팅 시스템을 통해 골프 라이프를 바꿔보세요. ${season} 시즌에 특화된 전문적인 피팅 서비스와 함께 여러분의 골프 실력을 한 단계 업그레이드할 수 있는 기회를 제공합니다.`,
      keywords: ["마쓰구프", "드라이버", "비거리", "피팅", "시니어", season],
      recommendedChannels: channels,
      blogCategory: blogCategories[i % blogCategories.length],
      seasonalTheme: `${season} 골프`,
      storyFramework: frameworks[i % frameworks.length],
      targetAudience: targetAudiences[i % targetAudiences.length],
      contentGoal: contentGoals[i % contentGoals.length]
    });
  }

  return contents;
}
