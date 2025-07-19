import { NextApiRequest, NextApiResponse } from 'next';

// AI 콘텐츠 생성 API
export default async function handler(
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
      aiSettings,
      selectedChannels 
    } = req.body;

    // AI 설정 확인
    const useAI = aiSettings?.useAI || false;
    const model = aiSettings?.model || 'gpt-3.5-turbo';
    
    // 여기서 실제 AI API 호출 또는 템플릿 기반 콘텐츠 생성
    // 예시 응답
    const generatedContents = [];
    let contentCount = 0;

    // 각 채널별로 콘텐츠 생성
    const channels = [
      { id: 'blog', name: '네이버블로그', enabled: selectedChannels?.blog },
      { id: 'kakao', name: '카카오톡', enabled: selectedChannels?.kakao },
      { id: 'sms', name: '문자', enabled: selectedChannels?.sms },
      { id: 'instagram', name: '인스타그램', enabled: selectedChannels?.instagram },
      { id: 'youtube', name: '유튜브', enabled: selectedChannels?.youtube }
    ];

    for (const channel of channels) {
      if (!channel.enabled) continue;

      // 월별 콘텐츠 개수 설정 (채널별로 다르게)
      const contentPerMonth = channel.id === 'blog' ? 8 : 
                            channel.id === 'kakao' ? 4 : 
                            channel.id === 'sms' ? 4 : 2;

      for (let i = 0; i < contentPerMonth; i++) {
        const content = {
          platform: channel.name,
          title: `${year}년 ${month}월 ${channel.name} 콘텐츠 ${i + 1}`,
          content: useAI ? 
            `[${model}로 생성된 콘텐츠]\n\n${channel.name}에 최적화된 내용...` :
            `[템플릿 기반 콘텐츠]\n\n${channel.name} 기본 템플릿...`,
          scheduled_date: `${year}-${String(month).padStart(2, '0')}-${String(Math.floor(Math.random() * 28) + 1).padStart(2, '0')}`,
          status: 'idea',
          tags: ['자동생성', channel.id, `${month}월`]
        };
        
        generatedContents.push(content);
        contentCount++;
      }
    }

    // 실제로는 여기서 Supabase에 저장
    // const { data, error } = await supabase.from('content_ideas').insert(generatedContents);

    return res.status(200).json({
      success: true,
      contentCount,
      message: `${contentCount}개의 콘텐츠가 생성되었습니다.`,
      contents: generatedContents,
      aiModel: useAI ? model : 'template'
    });

  } catch (error) {
    console.error('Content generation error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      details: error.message
    });
  }
}