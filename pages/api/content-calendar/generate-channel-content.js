// 채널별 파생 콘텐츠 생성 API
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { 
    hubContentId,     // 허브 콘텐츠 ID
    targetChannel,  // 대상 채널 (blog, sms, naver, kakao)
    hubContent      // 허브 콘텐츠 데이터 (제목, 요약, 개요)
  } = req.body;

  try {
    console.log('🎯 채널별 파생 콘텐츠 생성 시작:', { hubContentId, targetChannel });

    // 채널별 특화 프롬프트 생성
    const getChannelPrompt = (channel, hubContent) => {
      const channelPrompts = {
        blog: `
블로그 포스트 생성 요구사항:

**허브 콘텐츠:**
- 제목: ${hubContent.title}
- 요약: ${hubContent.summary}
- 개요: ${hubContent.overview}

**블로그 포스트 생성 규칙:**
1. 2000-3000자 분량의 상세한 블로그 포스트
2. SEO 최적화 (키워드 자연스럽게 포함)
3. 마크다운 형식으로 작성
4. 제목, 요약, 본문 구조
5. 이미지 삽입 포인트 표시 [이미지: 설명]
6. 전환 포인트 3곳에 CTA 삽입:
   - 중간: "무료 상담 신청하기"
   - 하단: "지금 체험 예약하기"  
   - 마지막: "지금 바로 시작하기"
7. 마쓰구프 브랜드 자연스럽게 언급
8. 고객 성공 사례 포함
9. 전문성과 신뢰도 강조

**응답 형식:**
{
  "title": "블로그 제목",
  "summary": "블로그 요약",
  "content": "마크다운 형식 본문",
  "seoKeywords": ["키워드1", "키워드2"],
  "imagePoints": ["이미지 설명1", "이미지 설명2"],
  "ctaPoints": ["CTA 위치1", "CTA 위치2", "CTA 위치3"]
}`,

        sms: `
SMS 메시지 생성 요구사항:

**허브 콘텐츠:**
- 제목: ${hubContent.title}
- 요약: ${hubContent.summary}
- 개요: ${hubContent.overview}

**SMS 메시지 생성 규칙:**
1. 90자 이내의 간결한 메시지
2. 강력한 CTA 포함
3. 이모지 활용 (적절히)
4. 긴급성과 한정성 강조
5. 개인화된 메시지 톤
6. 마쓰구프 브랜드 언급

**응답 형식:**
{
  "message": "SMS 메시지 내용",
  "cta": "CTA 텍스트",
  "urgency": "긴급성 메시지",
  "emoji": "사용된 이모지"
}`,

        naver: `
네이버 블로그 포스트 생성 요구사항:

**허브 콘텐츠:**
- 제목: ${hubContent.title}
- 요약: ${hubContent.summary}
- 개요: ${hubContent.overview}

**네이버 블로그 특화 규칙:**
1. 네이버 블로그 특화 포맷
2. 네이버 검색 최적화
3. 네이버 사용자 선호 스타일
4. 이미지 중심의 시각적 구성
5. 태그 최적화
6. 네이버 블로그 커뮤니티 특성 반영

**응답 형식:**
{
  "title": "네이버 블로그 제목",
  "content": "네이버 블로그 본문",
  "tags": ["태그1", "태그2", "태그3"],
  "imageDescription": "대표 이미지 설명",
  "naverKeywords": ["네이버 키워드1", "네이버 키워드2"]
}`,

        kakao: `
카카오톡 메시지 생성 요구사항:

**허브 콘텐츠:**
- 제목: ${hubContent.title}
- 요약: ${hubContent.summary}
- 개요: ${hubContent.overview}

**카카오톡 메시지 생성 규칙:**
1. 카드형 메시지 구조
2. 친근하고 대화체 톤
3. 버튼 액션 포함
4. 이모지와 이모티콘 활용
5. 개인화된 메시지
6. 카카오톡 특성 반영

**응답 형식:**
{
  "cardTitle": "카드 제목",
  "cardDescription": "카드 설명",
  "buttons": [
    {"text": "버튼1", "action": "action1"},
    {"text": "버튼2", "action": "action2"}
  ],
  "message": "메시지 내용",
  "emoji": "사용된 이모지"
}`
      };

      return channelPrompts[channel] || channelPrompts['blog'];
    };

    const prompt = getChannelPrompt(targetChannel, hubContent);

    console.log('🤖 AI 프롬프트 생성 완료, OpenAI API 호출 중...');

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 2000,
      temperature: 0.8
    });

    const responseText = response.choices[0].message.content.trim();
    console.log('✅ AI 응답 받음, JSON 파싱 시도 중...');

    // JSON 파싱 시도
    let channelContent;
    try {
      channelContent = JSON.parse(responseText);
      console.log('✅ JSON 파싱 성공:', targetChannel, '채널 콘텐츠 생성');
    } catch (parseError) {
      console.error('❌ JSON 파싱 실패:', parseError.message);
      console.log('🔍 원본 응답:', responseText);
      
      // JSON 파싱 실패 시 기본 구조로 생성
      channelContent = generateFallbackChannelContent(targetChannel, hubContent);
      console.log('🔄 Fallback 함수 실행:', targetChannel, '채널 콘텐츠 생성');
    }

    res.status(200).json({
      success: true,
      message: `${targetChannel} 채널 콘텐츠가 생성되었습니다.`,
      channelContent: channelContent,
      hubContentId: hubContentId,
      targetChannel: targetChannel,
      generatedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error('채널별 콘텐츠 생성 오류:', error);
    res.status(500).json({
      success: false,
      message: '채널별 콘텐츠 생성 실패',
      error: error.message
    });
  }
}

// JSON 파싱 실패 시 사용할 기본 채널별 콘텐츠 생성
function generateFallbackChannelContent(targetChannel, hubContent) {
  const fallbackContent = {
    blog: {
      title: hubContent.title,
      summary: hubContent.summary,
      content: `# ${hubContent.title}\n\n${hubContent.overview}\n\n## 마쓰구프 드라이버의 장점\n\n- 초고반발 기술로 비거리 향상\n- 맞춤 피팅 시스템\n- 시니어 골퍼 특화 설계\n\n## 무료 상담 신청하기\n\n지금 바로 마쓰구프 드라이버의 놀라운 성능을 경험해보세요.`,
      seoKeywords: ["마쓰구프", "드라이버", "비거리", "피팅"],
      imagePoints: ["드라이버 이미지", "피팅 과정 이미지"],
      ctaPoints: ["무료 상담 신청하기", "지금 체험 예약하기", "지금 바로 시작하기"]
    },
    sms: {
      message: `${hubContent.title} - 마쓰구프 드라이버로 비거리 향상! 무료 상담 신청하기 →`,
      cta: "무료 상담 신청하기",
      urgency: "한정 특가",
      emoji: "🏌️‍♂️"
    },
    naver: {
      title: hubContent.title,
      content: hubContent.overview,
      tags: ["마쓰구프", "드라이버", "비거리", "골프"],
      imageDescription: "마쓰구프 드라이버 이미지",
      naverKeywords: ["마쓰구프", "드라이버", "비거리"]
    },
    kakao: {
      cardTitle: hubContent.title,
      cardDescription: hubContent.summary,
      buttons: [
        { text: "자세히 보기", action: "view_detail" },
        { text: "무료 상담", action: "consultation" }
      ],
      message: "마쓰구프 드라이버로 골프 라이프를 바꿔보세요!",
      emoji: "🏌️‍♂️"
    }
  };

  return fallbackContent[targetChannel] || fallbackContent['blog'];
}
