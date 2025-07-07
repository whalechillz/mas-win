// 슬랙 웹훅 알림 - 가장 심플한 버전
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { type, data } = req.body;

  // 슬랙 웹훅 URL (환경변수로 관리)
  const webhookUrl = process.env.SLACK_WEBHOOK_URL;
  
  if (!webhookUrl) {
    console.error('SLACK_WEBHOOK_URL이 설정되지 않았습니다');
    return res.status(500).json({ error: 'Slack webhook URL not configured' });
  }

  try {
    let message = {};

    if (type === 'booking') {
      // 시타 예약 - 가장 심플한 텍스트
      let text = `🎯 *시타 예약*\n\n`;
      text += `이름: ${data.name}\n`;
      text += `전화: ${data.phone}\n`;
      text += `날짜: ${data.date} ${data.time}\n`;
      text += `클럽: ${data.club || '미정'}`;
      
      // 퀴즈 데이터 추가
      if (data.swing_style || data.priority || data.current_distance) {
        text += '\n\n---';
        if (data.swing_style) text += `\n스윙: ${data.swing_style}`;
        if (data.priority) text += ` | 중요: ${data.priority}`;
        if (data.current_distance) text += `\n비거리: ${data.current_distance}m`;
        if (data.recommended_flex) text += ` (추천: ${data.recommended_flex})`;
      }

      message = { text };

    } else if (type === 'contact') {
      // 상담 문의 - 가장 심플한 텍스트
      let text = `📞 *상담 문의*\n\n`;
      text += `이름: ${data.name}\n`;
      text += `전화: ${data.phone}\n`;
      text += `통화시간: ${data.call_times || '시간 무관'}`;
      
      // 퀴즈 데이터 추가
      if (data.swing_style || data.priority || data.current_distance) {
        text += '\n\n---';
        if (data.swing_style) text += `\n스윙: ${data.swing_style}`;
        if (data.priority) text += ` | 중요: ${data.priority}`;
        if (data.current_distance) text += `\n비거리: ${data.current_distance}m`;
        if (data.recommended_flex) text += ` (추천: ${data.recommended_flex})`;
      }
      
      text += '\n\n⚠️ *즉시 연락 필요*';

      message = { text };
    }

    // 디버깅을 위한 로그
    console.log('Slack 웹훅 URL:', webhookUrl);
    console.log('전송할 메시지:', message);

    // 슬랙으로 메시지 전송
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(message),
    });

    const responseText = await response.text();
    console.log('Slack 응답:', response.status, responseText);
    
    if (!response.ok) {
      throw new Error(`Slack 전송 실패: ${response.status} - ${responseText}`);
    }

    res.status(200).json({ success: true, message: 'Slack 알림 전송 완료' });
  } catch (error) {
    console.error('Slack 알림 에러:', error);
    res.status(500).json({ 
      error: 'Failed to send Slack notification',
      details: error.message 
    });
  }
}
