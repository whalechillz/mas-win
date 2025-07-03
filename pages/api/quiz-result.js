import { sendSlackNotification } from '../../lib/slackNotify';

export default async function handler(req, res) {
  // CORS 설정
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { style, priority, current_distance, recommended_product } = req.body;
    
    console.log('Quiz result received:', { style, priority, current_distance, recommended_product });

    // 슬랙 알림 전송
    const slackMessage = `🏌️ 새로운 퀴즈 결과!\n스타일: ${style}\n우선순위: ${priority}\n현재 거리: ${current_distance}\n추천 제품: ${recommended_product}`;
    await sendSlackNotification(slackMessage);

    console.log('Slack notification sent successfully');

    return res.status(200).json({ 
      success: true, 
      message: '퀴즈 결과가 저장되었습니다.',
      data: { style, priority, current_distance, recommended_product }
    });
    
  } catch (error) {
    console.error('Quiz result error:', error);
    res.status(500).json({ 
      error: 'Failed to save quiz result',
      message: error.message
    });
  }
}
