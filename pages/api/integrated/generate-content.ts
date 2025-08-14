import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method, body } = req;

  try {
    if (method !== 'POST') {
      res.setHeader('Allow', ['POST']);
      return res.status(405).json({ error: `Method ${method} Not Allowed` });
    }

    const { funnel_plan_id, channels, tone, keywords } = body;

    if (!funnel_plan_id || !channels || !Array.isArray(channels)) {
      return res.status(400).json({ error: 'funnel_plan_id와 channels는 필수입니다.' });
    }

    // 퍼널 계획 데이터 조회
    const { data: funnelPlan, error: funnelError } = await supabase
      .from('monthly_funnel_plans')
      .select('*')
      .eq('id', funnel_plan_id)
      .single();

    if (funnelError || !funnelPlan) {
      return res.status(404).json({ error: '퍼널 계획을 찾을 수 없습니다.' });
    }

    // 퍼널 페이지 데이터 조회
    const { data: funnelPage, error: pageError } = await supabase
      .from('funnel_pages')
      .select('*')
      .eq('funnel_plan_id', funnel_plan_id)
      .single();

    // 채널별 콘텐츠 생성
    const generatedContents = [];

    for (const channel of channels) {
      let content = '';

      // 채널별 기본 템플릿
      switch (channel) {
        case 'blog':
          content = generateBlogContent(funnelPlan, funnelPage, tone, keywords);
          break;
        case 'kakao':
          content = generateKakaoContent(funnelPlan, funnelPage, tone, keywords);
          break;
        case 'sms':
          content = generateSMSContent(funnelPlan, funnelPage, tone, keywords);
          break;
        case 'email':
          content = generateEmailContent(funnelPlan, funnelPage, tone, keywords);
          break;
        case 'instagram':
          content = generateInstagramContent(funnelPlan, funnelPage, tone, keywords);
          break;
        default:
          content = generateDefaultContent(funnelPlan, funnelPage, tone, keywords);
      }

      // 콘텐츠 저장
      const { data: savedContent, error: saveError } = await supabase
        .from('generated_contents')
        .insert({
          funnel_plan_id,
          channel,
          content,
          status: 'draft'
        })
        .select()
        .single();

      if (saveError) {
        console.error(`Failed to save ${channel} content:`, saveError);
        continue;
      }

      generatedContents.push(savedContent);
    }

    return res.status(200).json({
      message: '콘텐츠가 성공적으로 생성되었습니다.',
      data: generatedContents
    });

  } catch (error) {
    console.error('Content Generation Error:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}

// 채널별 콘텐츠 생성 함수들
function generateBlogContent(funnelPlan: any, funnelPage: any, tone: string, keywords: string[]) {
  const theme = funnelPlan.theme || '골프 특별 캠페인';
  const keywordStr = keywords.join(', ');
  
  return `
# ${theme}

안녕하세요! MASGOLF입니다.

${tone === '친근한' ? '오늘은 여러분과 함께' : '이번 기회에'} ${theme}에 대해 소개드리려고 합니다.

## 주요 키워드
${keywordStr}

## 혜택 안내
- 특별 할인 혜택
- 전문 상담 서비스
- 맞춤형 골프 클럽 피팅

더 자세한 내용은 아래 링크를 통해 확인해보세요!

#MASGOLF #골프 #${keywords[0] || '골프클럽'}
  `.trim();
}

function generateKakaoContent(funnelPlan: any, funnelPage: any, tone: string, keywords: string[]) {
  const theme = funnelPlan.theme || '골프 특별 캠페인';
  
  return `[MASGOLF] ${theme}

${tone === '친근한' ? '안녕하세요! 😊' : '안녕하세요!'}

${theme}가 시작되었습니다!

🎯 주요 혜택:
• 특별 할인
• 전문 상담
• 맞춤 피팅

📞 문의: 010-1234-5678
🌐 자세히 보기: https://win.masgolf.co.kr

#골프 #${keywords[0] || '골프클럽'}`;
}

function generateSMSContent(funnelPlan: any, funnelPage: any, tone: string, keywords: string[]) {
  const theme = funnelPlan.theme || '골프 특별 캠페인';
  
  return `[MASGOLF] ${theme} 안내

${theme}가 시작되었습니다.

특별 할인 혜택과 전문 상담 서비스를 제공합니다.

문의: 010-1234-5678
자세히: https://win.masgolf.co.kr

수신거부: 080-1234-5678`;
}

function generateEmailContent(funnelPlan: any, funnelPage: any, tone: string, keywords: string[]) {
  const theme = funnelPlan.theme || '골프 특별 캠페인';
  
  return `제목: [MASGOLF] ${theme} 안내

안녕하세요, MASGOLF입니다.

${theme}가 시작되었습니다.

${tone === '친근한' ? '여러분의 골프 라이프를 더욱 즐겁게 만들어드리겠습니다!' : '최고의 골프 경험을 제공해드리겠습니다.'}

📋 주요 혜택
• 특별 할인 혜택
• 전문 상담 서비스
• 맞춤형 골프 클럽 피팅

📞 문의: 010-1234-5678
🌐 자세히 보기: https://win.masgolf.co.kr

감사합니다.
MASGOLF 팀`;
}

function generateInstagramContent(funnelPlan: any, funnelPage: any, tone: string, keywords: string[]) {
  const theme = funnelPlan.theme || '골프 특별 캠페인';
  
  return `${theme} 🏌️‍♂️

${tone === '친근한' ? '골프러버 여러분 안녕하세요! 😊' : '골프러버 여러분 안녕하세요!'}

${theme}가 시작되었습니다! 🎉

✨ 주요 혜택
• 특별 할인 혜택 💰
• 전문 상담 서비스 📞
• 맞춤형 골프 클럽 피팅 🎯

지금 바로 문의해보세요! 👇

#MASGOLF #골프 #${keywords[0] || '골프클럽'} #골프러버 #골프스타일`;
}

function generateDefaultContent(funnelPlan: any, funnelPage: any, tone: string, keywords: string[]) {
  const theme = funnelPlan.theme || '골프 특별 캠페인';
  
  return `${theme}

안녕하세요! MASGOLF입니다.

${theme}가 시작되었습니다.

${tone === '친근한' ? '여러분과 함께하는 즐거운 골프 라이프!' : '최고의 골프 경험을 제공합니다.'}

문의: 010-1234-5678
자세히: https://win.masgolf.co.kr`;
}
