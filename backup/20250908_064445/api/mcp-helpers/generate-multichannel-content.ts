import { NextApiRequest, NextApiResponse } from 'next';

interface ChannelContent {
  channel: string;
  title?: string;
  content: string;
  hashtags?: string[];
  subject?: string;
  preheader?: string;
  status: 'draft';
  metadata?: any;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { 
      year, 
      month, 
      theme, 
      funnelPlan, 
      mainImagePath, 
      channels, 
      tone, 
      keywords,
      channelRequirements 
    } = req.body;

    // Claude MCP를 통한 멀티채널 콘텐츠 생성
    const basePrompt = `
      ${year}년 ${month}월 골프장 마케팅 콘텐츠를 생성해주세요.
      
      캠페인 정보:
      - 월별 테마: ${theme || '프리미엄 골프 경험'}
      - 타겟 고객: ${funnelPlan?.targetAudience || '30-50대 골프 애호가'}
      - 톤앤매너: ${tone}
      - 핵심 키워드: ${keywords.join(', ')}
      - 메인 이미지: ${mainImagePath}
      
      각 채널별로 최적화된 콘텐츠를 생성해주세요.
    `;

    const generatedContents: ChannelContent[] = [];

    // 각 채널별 콘텐츠 생성
    for (const channel of channels) {
      let content: ChannelContent = {
        channel,
        content: '',
        status: 'draft'
      };

      switch (channel) {
        case 'blog':
          content = {
            channel: 'blog',
            title: `${month}월의 특별한 골프 여행 - ${theme}`,
            content: `
안녕하세요, 골프를 사랑하는 여러분! 

${year}년 ${month}월, 특별한 골프 경험을 준비했습니다. ${theme}를 주제로 한 이번 달의 프로모션을 소개합니다.

## 왜 ${month}월인가?

${month}월은 골프를 즐기기에 최적의 시기입니다. 쾌적한 날씨와 함께 프리미엄 골프장에서의 라운딩은 잊지 못할 추억을 선사할 것입니다.

## 특별 혜택

1. **조기 예약 할인**: 15일 이전 예약 시 20% 할인
2. **그린피 포함 패키지**: 카트비, 캐디피 모두 포함
3. **프리미엄 식사권**: 클럽하우스 레스토랑 이용권 제공

## 예약 방법

지금 바로 홈페이지에서 예약하시고, ${month}월의 특별한 혜택을 놓치지 마세요!

${keywords.map(k => `#${k}`).join(' ')}
            `.trim(),
            hashtags: keywords,
            status: 'draft'
          };
          break;

        case 'kakao':
          content = {
            channel: 'kakao',
            content: `🏌️ ${month}월 특별 이벤트! 🏌️

안녕하세요! ${theme} 시즌을 맞아 특별한 혜택을 준비했어요 😊

✨ 이달의 혜택
✅ 그린피 20% 할인
✅ 2인 이상 예약 시 카트비 무료
✅ 클럽하우스 식사권 증정

📅 기간: ${year}년 ${month}월 한정
📍 예약: 홈페이지 또는 전화

놓치면 후회할 기회! 지금 바로 예약하세요 💚

#${keywords.join(' #')}`,
            status: 'draft'
          };
          break;

        case 'sms':
          content = {
            channel: 'sms',
            content: `[WIN골프] ${month}월 특별혜택! 그린피 20%할인+식사권. 예약:win.masgolf.co.kr`,
            status: 'draft'
          };
          break;

        case 'email':
          content = {
            channel: 'email',
            subject: `${month}월 골프 시즌, 특별한 혜택과 함께하세요`,
            preheader: `지금 예약하고 최대 20% 할인 받으세요`,
            content: `
<p>안녕하세요, {{고객명}} 님</p>

<p>${year}년 ${month}월, 완벽한 골프 시즌이 돌아왔습니다.</p>

<h2>${theme}</h2>

<p>이번 달 저희 골프장에서는 특별한 혜택을 준비했습니다:</p>

<ul>
  <li>그린피 20% 할인 (조기예약 시)</li>
  <li>2인 이상 예약 시 카트비 무료</li>
  <li>프리미엄 클럽하우스 식사권 제공</li>
</ul>

<p><strong>예약 기간:</strong> ${year}년 ${month}월 1일 - 말일</p>

<p><a href="https://win.masgolf.co.kr?utm_source=email&utm_medium=newsletter&utm_campaign=${year}${month}">지금 예약하기</a></p>

<p>감사합니다.</p>
            `.trim(),
            status: 'draft'
          };
          break;

        case 'instagram':
          content = {
            channel: 'instagram',
            content: `🏌️‍♂️ ${month}월의 완벽한 스윙 🏌️‍♀️

${theme}의 계절이 돌아왔습니다!

프리미엄 골프장에서 특별한 하루를 만들어보세요 ⛳

✨ 이달의 스페셜
• 그린피 최대 20% OFF
• 카트비 무료 (2인 이상)
• 클럽하우스 식사권 증정

"골프는 인생과 같다. 매 샷이 새로운 기회다." 

지금 바로 예약하고 ${month}월의 특별함을 경험하세요!

📍 예약: 프로필 링크
📞 문의: 1577-0000

${keywords.map(k => `#${k}`).join(' ')} #골프스타그램 #골프장 #골프라운딩 #${month}월이벤트 #프리미엄골프 #골프할인 #주말골프 #골프예약 #골프패키지 #골프프로모션`,
            hashtags: [...keywords, '골프스타그램', '골프장', '골프라운딩', `${month}월이벤트`, '프리미엄골프'],
            status: 'draft'
          };
          break;
      }

      generatedContents.push(content);
    }

    return res.status(200).json({
      success: true,
      contents: generatedContents,
      metadata: {
        year,
        month,
        theme,
        channelsGenerated: channels,
        generatedAt: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error generating multichannel content:', error);
    return res.status(500).json({ error: 'Failed to generate content' });
  }
}
