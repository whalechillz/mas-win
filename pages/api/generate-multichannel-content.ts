import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function generate-multichannel-content(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { 
      year, 
      month, 
      aiSettings = { useAI: false },
      selectedChannels = {}
    } = req.body;

    console.log('AI 콘텐츠 생성 시작:', { year, month, aiSettings, selectedChannels });

    const generatedContents = [];
    
    if (selectedChannels.blog) {
      generatedContents.push({
        platform: 'blog',
        title: `${year}년 ${month}월 골프 특별 혜택`,
        content: `## ${year}년 ${month}월 골프 특별 혜택\n\n안녕하세요, 골프 애호가 여러분!\n\n이번 달 특별한 혜택을 준비했습니다.\n\n### 주요 혜택\n- 혜택 1: 특별 할인\n- 혜택 2: 무료 체험\n- 혜택 3: 전문 상담\n\n지금 바로 신청하세요!`,
        status: 'generated',
        ai_generated: aiSettings.useAI
      });
    }

    if (selectedChannels.kakao) {
      generatedContents.push({
        platform: 'kakao',
        title: ` ${year}년 ${month}월 특별 혜택`,
        content: `안녕하세요! 😊\n\n${year}년 ${month}월 특별한 혜택 소식을 전해드립니다.\n\n✨ 혜택 1\n✨ 혜택 2\n✨ 혜택 3\n\n자세한 내용은 링크를 확인해주세요!\n\n[바로가기]`,
        status: 'generated',
        ai_generated: aiSettings.useAI
      });
    }

    if (selectedChannels.sms) {
      generatedContents.push({
        platform: 'sms',
        title: `[마스골프] ${month}월 특별 혜택`,
        content: `안녕하세요! ${month}월 특별 혜택 안내드립니다.\n\n- 혜택 1\n- 혜택 2\n\n신청: 1588-XXXX`,
        status: 'generated',
        ai_generated: aiSettings.useAI
      });
    }

    if (generatedContents.length > 0) {
      const { data, error } = await supabase
        .from('content_ideas')
        .insert(generatedContents);

      if (error) {
        console.error('DB 저장 오류:', error);
        return res.status(500).json({ error: '콘텐츠 저장 실패' });
      }
    }

    return res.status(200).json({
      success: true,
      message: `${generatedContents.length}개의 콘텐츠가 생성되었습니다.`,
      contents: generatedContents
    });

  } catch (error) {
    console.error('AI 콘텐츠 생성 오류:', error);
    return res.status(500).json({ error: '콘텐츠 생성 중 오류가 발생했습니다.' });
  }
}
