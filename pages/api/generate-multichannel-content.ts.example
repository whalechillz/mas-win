// 개선된 멀티채널 생성 API - 채널 선택 가능
import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { 
    year, 
    month, 
    theme, 
    aiSettings,
    selectedChannels = {
      blog: true,
      kakao: true,
      sms: true,
      instagram: true,
      youtube: true
    }
  } = req.body;

  try {
    // 선택된 채널만 필터링
    const activeChannels = Object.entries(selectedChannels)
      .filter(([_, isActive]) => isActive)
      .map(([channel]) => channel);

    if (activeChannels.length === 0) {
      return res.status(400).json({ 
        error: '최소 1개 이상의 채널을 선택해주세요.' 
      });
    }

    let result;
    
    if (aiSettings?.useAI) {
      // AI 모드 - 선택된 채널만 생성
      result = await generateAIContent(
        year, 
        month, 
        theme, 
        aiSettings, 
        activeChannels
      );
    } else {
      // 템플릿 모드 - SQL 함수 호출
      const { data, error } = await supabase.rpc(
        'generate_monthly_content_selective',
        {
          p_year: year,
          p_month: month,
          p_channels: selectedChannels
        }
      );

      if (error) throw error;
      result = data;
    }

    return res.status(200).json(result);

  } catch (error) {
    console.error('콘텐츠 생성 오류:', error);
    return res.status(500).json({ 
      error: '콘텐츠 생성 중 오류가 발생했습니다.' 
    });
  }
}

// AI 콘텐츠 생성 (선택된 채널만)
async function generateAIContent(
  year: number,
  month: number,
  theme: any,
  aiSettings: any,
  activeChannels: string[]
) {
  const contentCounts = {
    blog: aiSettings.plan === 'premium' ? 5 : aiSettings.plan === 'standard' ? 3 : 2,
    kakao: aiSettings.plan === 'premium' ? 6 : aiSettings.plan === 'standard' ? 4 : 3,
    sms: aiSettings.plan === 'premium' ? 4 : aiSettings.plan === 'standard' ? 3 : 2,
    instagram: aiSettings.plan === 'premium' ? 5 : aiSettings.plan === 'standard' ? 3 : 2,
    youtube: aiSettings.plan === 'premium' ? 2 : 1
  };

  const generatedContents = [];
  let totalCost = 0;

  // 선택된 채널에 대해서만 콘텐츠 생성
  for (const channel of activeChannels) {
    const count = contentCounts[channel] || 1;
    
    for (let i = 0; i < count; i++) {
      // 실제 AI API 호출 로직
      // 여기서는 시뮬레이션
      const content = {
        title: `[AI 생성] ${theme.theme} - ${channel} 콘텐츠 ${i + 1}`,
        content: `AI가 생성한 ${channel} 콘텐츠입니다.`,
        platform: channel,
        status: 'idea',
        scheduled_date: new Date(year, month - 1, (i + 1) * 5),
        ai_generated: true,
        ai_model: aiSettings.settings.contentModel
      };
      
      generatedContents.push(content);
      
      // 채널별 비용 계산
      const channelCosts = {
        blog: 3,
        kakao: 1,
        sms: 0.5,
        instagram: 2,
        youtube: 5
      };
      totalCost += channelCosts[channel] || 1;
    }
  }

  // DB에 저장
  const { error } = await supabase
    .from('content_ideas')
    .insert(generatedContents);

  if (error) throw error;

  return {
    success: true,
    contentCount: generatedContents.length,
    totalCost: Math.round(totalCost * 100) / 100,
    channelsUsed: activeChannels,
    message: `${generatedContents.length}개의 AI 콘텐츠가 생성되었습니다.`
  };
}
