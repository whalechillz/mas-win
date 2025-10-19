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

    // AI 프롬프트 생성 (허브 콘텐츠 중심)
    const prompt = `
마쓰구골프(MASGOLF)를 위한 허브 콘텐츠를 생성해주세요.

**캠페인 유형: ${campaignType}**
**타겟 오디언스: ${targetAudience}**
**콘텐츠 목표: ${contentGoal}**
**계절: ${season}**
**생성 개수: ${count}개**

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

**생성 요구사항:**
1. **제목**: 60자 이내, SEO 최적화, 클릭 유도력, 감정적 훅 포함
2. **요약 (다른 채널 활용용)**: 150-200자, 핵심 메시지, 명확한 CTA 포함
3. **간단한 개요**: 300-400자, 상세 설명, 구체적 혜택, 다음 단계 안내

**인간적 톤앤매너:**
- 감정적 연결을 만드는 스토리텔링
- 고객의 실제 고민과 해결책 제시
- 자연스러운 대화체 톤앤매너
- 구체적이고 현실적인 사례
- 전문적이지만 친근한 브랜드 톤

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

// JSON 파싱 실패 시 사용할 기본 허브 콘텐츠 생성
function generateFallbackHubContent(count, campaignType, season) {
  const baseTitles = [
    "60대도 가능한가? 마쓰구프 드라이버로 비거리 20m 늘리기",
    "동년배들이 몰래 찾는 드라이버 피팅의 비밀",
    "은퇴 후 골프 인생을 바꾼 초고반발 드라이버 이야기",
    "시니어 골퍼를 위한 맞춤형 드라이버 선택 가이드"
  ];

  const baseSummaries = [
    "나이에 상관없이 비거리 향상이 가능한 맞춤 피팅 시스템으로 골프 라이프를 바꿔보세요. 무료 상담 신청하기 →",
    "동년배들의 성공 사례를 통해 마쓰구프 드라이버의 놀라운 효과를 확인하세요. 지금 체험 예약하기 →",
    "은퇴 후 골프에 더 집중할 수 있게 된 비거리 향상의 비밀을 공개합니다. 자세히 알아보기 →"
  ];

  const baseOverviews = [
    "60대 골퍼도 비거리 20m를 늘릴 수 있다는 것이 현실입니다. 마쓰구프의 초고반발 드라이버와 맞춤 피팅 시스템을 통해 나이에 상관없이 비거리 향상이 가능합니다. 실제 고객들의 성공 사례와 구체적인 데이터를 바탕으로 여러분의 골프 라이프를 바꿔보세요.",
    "동년배들이 몰래 찾는 드라이버 피팅의 비밀을 공개합니다. 마쓰구프의 전문 피팅 시스템을 통해 개인의 스윙 특성에 맞는 최적의 드라이버를 찾을 수 있습니다. 수원 갤러리아 광교에서 5분 거리의 편리한 위치에서 무료 상담을 받아보세요."
  ];

  const blogCategories = ["고객 후기", "제품 정보", "골프 팁", "이벤트", "공지사항"];
  const channels = ["blog", "sms", "kakao"];
  const frameworks = ["pixar", "donald_miller", "cialdini"];

  const contents = [];
  for (let i = 0; i < count; i++) {
    contents.push({
      title: baseTitles[i % baseTitles.length],
      summary: baseSummaries[i % baseSummaries.length],
      overview: baseOverviews[i % baseOverviews.length],
      keywords: ["마쓰구프", "드라이버", "비거리", "피팅", "시니어"],
      recommendedChannels: channels,
      blogCategory: blogCategories[i % blogCategories.length],
      seasonalTheme: `${season} 골프`,
      storyFramework: frameworks[i % frameworks.length],
      targetAudience: "시니어 골퍼",
      contentGoal: "인지"
    });
  }

  return contents;
}
