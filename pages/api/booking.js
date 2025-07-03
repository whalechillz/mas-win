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
    const { name, phone, date, time, club } = req.body;
    
    console.log('Booking request received:', { name, phone, date, time, club });

    // 필수 필드 확인
    if (!name || !phone || !date || !time) {
      return res.status(400).json({ 
        success: false, 
        message: '필수 정보가 누락되었습니다.' 
      });
    }

    // 슬랙 알림 전송
    const slackMessage = `🎯 새로운 시타 예약!\n이름: ${name}\n전화: ${phone}\n날짜: ${date}\n시간: ${time}\n클럽: ${club || '미선택'}`;
    await sendSlackNotification(slackMessage);

    console.log('Slack notification sent successfully');

    return res.status(200).json({ 
      success: true, 
      message: '예약이 완료되었습니다.',
      data: { name, phone, date, time, club }
    });
    
  } catch (error) {
    console.error('Booking error:', error);
    res.status(500).json({ 
      success: false,
      message: '서버 오류가 발생했습니다.',
      error: error.message
    });
  }
}
