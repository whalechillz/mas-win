// 퍼널 캠페인 기반 연간 콘텐츠 자동생성 API
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { period, category, frequency, includeFunnelCampaigns, uploadedMdFiles } = req.body;

  try {
    // 기간별 콘텐츠 개수 계산
    const contentCounts = {
      '1month': 4,
      '3months': 12,
      '6months': 24,
      '1year': 52
    };

    const frequencyMultiplier = {
      'weekly': 1,
      'biweekly': 2,
      'daily': 7
    };

    const totalContentCount = contentCounts[period] * frequencyMultiplier[frequency];

    // 마케팅 캠페인 퍼널 기반 콘텐츠 생성
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
        type: "인지/관심 단계",
        storyFramework: "donald_miller",
        description: "인스타그램에서 친구와 함께 참여하는 바이럴 이벤트",
        hookMessage: "골프친구와 함께 도전하세요 – 둘 다 선물 받는 찬스!",
        cta: "시타 이벤트 신청",
        channels: ["instagram", "kakao", "blog"],
        seasonalTheme: "가을 골프 정리"
      },
      {
        title: "댓글 고민 상담소",
        type: "관심 단계",
        storyFramework: "pixar",
        description: "페이스북/블로그 콘텐츠로 고객 참여를 유도하는 캠페인",
        hookMessage: "여러분의 골프 고민, MASGOLF가 해결해드립니다!",
        cta: "개인 맞춤 시타 세션 예약하기",
        channels: ["facebook", "blog", "kakao"],
        seasonalTheme: "겨울 골프 연습"
      },
      {
        title: "시니어 골퍼 비거리 부활 스토리",
        type: "신뢰 단계",
        storyFramework: "pixar",
        description: "실제 고객 성공 사례를 스토리텔링하는 캠페인",
        hookMessage: "[고객후기] 59세에 드라이버 20미터 늘린 비결 – OO씨의 이야기",
        cta: "나도 OO씨처럼 변화를 경험하고 싶다면? 지금 무료 피팅 상담 예약하기",
        channels: ["blog", "email", "kakao"],
        seasonalTheme: "봄 시즌 오픈"
      },
      {
        title: "비거리 250클럽 도전",
        type: "관심/신뢰 단계",
        storyFramework: "donald_miller",
        description: "시니어 골퍼들의 도전심과 커뮤니티 참여를 동시에 유발하는 캠페인",
        hookMessage: "도전! 50대에도 250야드 날린다 – 성공 시 명예의 패치 증정",
        cta: "카카오톡 채널 추가하고 도전 신청하기",
        channels: ["kakao", "blog", "instagram"],
        seasonalTheme: "여름 골프 건강관리"
      },
      {
        title: "MASGOLF 멤버 한정 VIP혜택",
        type: "신뢰/전환 단계",
        storyFramework: "cialdini",
        description: "기존 고객과 온·오프라인 팔로워를 멤버로 격상시켜 충성도를 높이는 캠페인",
        hookMessage: "회원 전용 XXX 혜택 공개 – 시니어 골퍼들의 특권에 합류하세요!",
        cta: "멤버십 가입하려면? 전화 문의하기",
        channels: ["kakao", "sms", "blog"],
        seasonalTheme: "가을 골프 피팅"
      },
      {
        title: "골프 건강 5일 챌린지",
        type: "관심 단계",
        storyFramework: "pixar",
        description: "시니어 골퍼의 건강/체력 증진을 도와주는 마이크로 러닝 캠페인",
        hookMessage: "5일 후, 더 젊어진 스윙을 느껴보세요 – 무료 건강 골프 챌린지 참가하기",
        cta: "더 전문적인 피트니스 가이드와 맞춤 클럽 피팅 – 지금 상담 신청",
        channels: ["kakao", "sms", "blog"],
        seasonalTheme: "겨울 골프 준비"
      },
      {
        title: "명예의 전당 고객 콘테스트",
        type: "신뢰 단계",
        storyFramework: "donald_miller",
        description: "기존 고객의 참여를 끌어내고 사회적 지위 욕구를 만족시키는 UGC 캠페인",
        hookMessage: "MASGOLF 명예의 전당에 이름을 남기세요! 당신의 이야기를 들려주시고 상도 받아가세요.",
        cta: "나도 도전하기 – 응모는 여기를 클릭",
        channels: ["instagram", "facebook", "blog"],
        seasonalTheme: "봄 골프 워밍업"
      },
      {
        title: "한정판 드라이버 VIP 프리뷰",
        type: "전환 단계",
        storyFramework: "cialdini",
        description: "구매 전환을 극대화하기 위한 한정판 제품 사전 공개 이벤트",
        hookMessage: "[VIP초청] 국내 30개 한정 XXX 드라이버 – 가장 먼저 만나보세요",
        cta: "한정판 드라이버 예약구매 신청",
        channels: ["kakao", "sms", "email"],
        seasonalTheme: "여름 골프 장비"
      }
    ];

    // 블로그 카테고리 정의
    const blogCategories = {
      'funnel_campaigns': '퍼널 캠페인',
      'storytelling_campaigns': '스토리텔링 캠페인', 
      'seasonal_campaigns': '계절별 캠페인',
      'mixed': '혼합 캠페인'
    };

    // 현재 날짜와 계절 정보
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1; // 1-12
    const currentDate = now.toISOString().split('T')[0];
    
    // 현재 계절 결정
    let currentSeason = '';
    let seasonDescription = '';
    if (currentMonth >= 3 && currentMonth <= 5) {
      currentSeason = '봄';
      seasonDescription = '봄 시즌 골프 준비와 워밍업';
    } else if (currentMonth >= 6 && currentMonth <= 8) {
      currentSeason = '여름';
      seasonDescription = '여름 골프 건강관리와 더위 대비';
    } else if (currentMonth >= 9 && currentMonth <= 11) {
      currentSeason = '가을';
      seasonDescription = '가을 골프 정리와 겨울 준비';
    } else {
      currentSeason = '겨울';
      seasonDescription = '겨울 골프 연습과 실내 골프';
    }

    // AI 프롬프트 생성 (퍼널 캠페인 + 블로그 카테고리 기반)
    const prompt = `
마쓰구골프(MASGOLF)를 위한 ${period} 연간 콘텐츠 계획을 생성해주세요.

**현재 날짜 정보 (중요!):**
- 현재 날짜: ${currentDate} (${currentYear}년 ${currentMonth}월)
- 현재 계절: ${currentSeason}
- 계절 설명: ${seasonDescription}

**핵심 요구사항:**
- 총 ${totalContentCount}개의 블로그 주제 생성 (정확히 ${totalContentCount}개)
- 블로그 카테고리: ${blogCategories[category]}
- 발행 빈도: ${frequency}
- **현재 계절(${currentSeason})에 맞는 콘텐츠만 생성하세요**
- 기존 퍼널 캠페인을 최대한 활용하여 현재 계절에 맞게 변형

**기존 퍼널 캠페인 10개 (최대한 활용):**
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

**생성 가이드라인:**
1. 위의 10개 퍼널 캠페인을 기반으로 계절별 변형
2. 마쓰구골프 브랜드와 초고반발 드라이버 중심
3. 시니어 골퍼(50-60대) 타겟
4. 비거리 향상, 맞춤 피팅, 고객 성공 스토리 중심
5. 도널드 밀러의 7단계 스토리 공식, 러셀 브런슨의 퍼널 전략, 세스 고딘의 보랏빛 소 전략, 로버트 치알디니의 설득 심리학 원칙 활용
6. 각 콘텐츠마다 고유한 제목과 후킹 메시지 생성

**응답 형식 (정확히 ${totalContentCount}개):**
반드시 유효한 JSON 배열 형태로 응답해주세요. 다른 텍스트는 포함하지 마세요.

[
  {
    "title": "제목",
    "contentType": "${blogCategories[category]}",
    "campaignType": "캠페인 유형",
    "storyFramework": "스토리 프레임워크",
    "seasonalTheme": "계절 테마",
    "targetAudience": "시니어 골퍼 (50-60대)",
    "conversionGoal": "전환 목표",
    "hookMessage": "후킹 메시지",
    "cta": "CTA",
    "channels": ["채널1", "채널2"],
    "keywords": ["키워드1", "키워드2"],
    "estimatedPublishDate": "2025-01-15",
    "description": "콘텐츠 설명",
    "storyStructure": "스토리 구조 설명"
  }
]

**중요:** 
1. 정확히 ${totalContentCount}개의 콘텐츠를 생성해주세요
2. 유효한 JSON 배열 형태로만 응답해주세요
3. 다른 설명이나 텍스트는 포함하지 마세요
4. 각 콘텐츠마다 고유한 제목과 내용을 만들어주세요
`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "당신은 마쓰구골프의 전문 마케팅 전략가입니다. 도널드 밀러, 러셀 브런슨, 세스 고딘, 로버트 치알디니의 마케팅 이론을 바탕으로 시니어 골퍼를 위한 초고반발 드라이버와 맞춤 피팅 서비스를 중심으로 한 퍼널 캠페인을 수립합니다."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 4000
    });

    const responseText = completion.choices[0].message.content;
    
    // 디버깅: AI 응답 로그
    console.log('🤖 AI 응답:', responseText.substring(0, 500) + '...');
    
    // JSON 파싱 시도
    let contentPlan;
    try {
      contentPlan = JSON.parse(responseText);
      console.log('✅ JSON 파싱 성공:', contentPlan.length, '개 콘텐츠 생성');
    } catch (parseError) {
      console.error('❌ JSON 파싱 실패:', parseError.message);
      console.log('🔍 원본 응답:', responseText);
      
      // JSON 파싱 실패 시 기본 구조로 생성
      contentPlan = generateFallbackContentPlan(totalContentCount, funnelCampaigns);
      console.log('🔄 Fallback 함수 실행:', contentPlan.length, '개 콘텐츠 생성');
    }

    res.status(200).json({
      success: true,
      message: `${totalContentCount}개의 퍼널 캠페인 기반 연간 콘텐츠 계획이 생성되었습니다.`,
      contentPlan: contentPlan,
      totalCount: totalContentCount,
      period: period,
      frequency: frequency,
      category: category,
      funnelCampaigns: funnelCampaigns
    });

  } catch (error) {
    console.error('퍼널 캠페인 기반 연간 콘텐츠 생성 오류:', error);
    res.status(500).json({
      success: false,
      message: '퍼널 캠페인 기반 연간 콘텐츠 생성 실패',
      error: error.message
    });
  }
}

// JSON 파싱 실패 시 사용할 기본 콘텐츠 계획 생성
function generateFallbackContentPlan(count, funnelCampaigns) {
  const plan = [];
  
  // 현재 날짜 기반 계절 및 월별 테마
  const now = new Date();
  const currentMonth = now.getMonth() + 1; // 1-12
  const currentYear = now.getFullYear();
  
  // 현재 계절에 맞는 테마
  let currentSeason = '';
  let seasonalThemes = [];
  
  if (currentMonth >= 3 && currentMonth <= 5) {
    currentSeason = '봄';
    seasonalThemes = ['봄 골프 준비', '신년 골프 목표', '봄 시즌 오픈', '봄 골프 워밍업'];
  } else if (currentMonth >= 6 && currentMonth <= 8) {
    currentSeason = '여름';
    seasonalThemes = ['여름 골프 전략', '더위 속 골프', '여름 골프 장비', '여름 골프 건강관리'];
  } else if (currentMonth >= 9 && currentMonth <= 11) {
    currentSeason = '가을';
    seasonalThemes = ['가을 골프 정리', '가을 골프 피팅', '겨울 준비', '가을 골프 마무리'];
  } else {
    currentSeason = '겨울';
    seasonalThemes = ['겨울 골프 연습', '실내 골프', '겨울 골프 장비', '겨울 골프 준비'];
  }
  
  // 월별 테마
  const monthlyThemes = [
    '신년 골프 목표', '봄 골프 준비', '봄 시즌 오픈', '봄 골프 워밍업',
    '여름 골프 전략', '여름 골프 건강관리', '여름 골프 장비', '더위 속 골프',
    '가을 골프 정리', '가을 골프 피팅', '겨울 준비', '연말 골프 정리'
  ];
  
  for (let i = 0; i < count; i++) {
    const campaign = funnelCampaigns[i % funnelCampaigns.length];
    const seasonalTheme = seasonalThemes[i % seasonalThemes.length];
    const monthlyTheme = monthlyThemes[currentMonth - 1]; // 현재 월에 맞는 테마
    
    // 제목에 다양성 추가 (현재 계절 중심)
    const titleVariations = [
      `${campaign.title} - ${currentSeason} ${seasonalTheme} 특화`,
      `${campaign.title} - ${monthlyTheme} 캠페인`,
      `${currentSeason} ${seasonalTheme}에 맞춘 ${campaign.title}`,
      `${monthlyTheme} ${campaign.title} 특별판`
    ];
    
    // 현재 날짜부터 시작하는 발행일 계산
    const publishDate = new Date(now.getTime() + i * 7 * 24 * 60 * 60 * 1000);
    
    plan.push({
      title: titleVariations[i % titleVariations.length],
      contentType: '퍼널 캠페인',
      campaignType: campaign.type,
      storyFramework: campaign.storyFramework,
      seasonalTheme: `${currentSeason} ${seasonalTheme}`,
      targetAudience: '시니어 골퍼 (50-60대)',
      conversionGoal: campaign.type.includes('전환') ? 'decision' : 'consideration',
      hookMessage: campaign.hookMessage,
      cta: campaign.cta,
      channels: campaign.channels,
      keywords: ['마쓰구골프', '초고반발 드라이버', '비거리 향상', '맞춤 피팅', currentSeason, seasonalTheme],
      estimatedPublishDate: publishDate.toISOString().split('T')[0],
      description: `${campaign.description} - ${currentSeason} ${seasonalTheme}에 맞게 변형된 캠페인입니다. ${monthlyTheme} 테마를 반영하여 시니어 골퍼들에게 더욱 매력적인 콘텐츠로 구성되었습니다.`,
      storyStructure: `${campaign.storyFramework} 프레임워크를 활용한 ${campaign.type} 캠페인으로, ${currentSeason} ${seasonalTheme} 시즌에 최적화된 스토리텔링을 제공합니다.`
    });
  }
  
  return plan;
}
