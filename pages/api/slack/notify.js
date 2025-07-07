// 슬랙 웹훅 알림 - 심플하고 고급스러운 디자인
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
      // 시타 예약 - 심플한 디자인
      let text = `*🎯 시타 예약 접수*\n\n`;
      text += `👤 *${data.name}*\n`;
      text += `📞 ${data.phone}\n\n`;
      text += `📅 ${data.date} ${data.time}\n`;
      text += `🏌️ ${data.club || '미정'}`;
      
      // 퀴즈 데이터가 있으면 추가
      if (data.swing_style || data.priority || data.current_distance) {
        text += '\n\n━━━━━━━━━━━━━━━━━━━';
        if (data.swing_style) text += `\n• 스윙: ${data.swing_style}`;
        if (data.priority) text += `\n• 중요: ${data.priority}`;
        if (data.current_distance) {
          text += `\n• 비거리: ${data.current_distance}m`;
          if (data.recommended_flex) {
            text += ` → ${data.recommended_flex} 추천`;
          }
        }
      }

      message = {
        text: text,
        attachments: [{
          color: '#FF0000',
          footer: 'MASGOLF 시타 예약',
          ts: Math.floor(Date.now() / 1000)
        }]
      };

    } else if (type === 'contact') {
      // 상담 문의 - 심플한 디자인
      let text = `*📞 상담 문의 접수*\n\n`;
      text += `👤 *${data.name}*\n`;
      text += `📞 ${data.phone}\n\n`;
      text += `⏰ ${data.call_times || '시간 무관'}`;
      
      // 퀴즈 데이터가 있으면 추가
      if (data.swing_style || data.priority || data.current_distance) {
        text += '\n\n━━━━━━━━━━━━━━━━━━━';
        if (data.swing_style) text += `\n• 스윙: ${data.swing_style}`;
        if (data.priority) text += `\n• 중요: ${data.priority}`;
        if (data.current_distance) {
          text += `\n• 비거리: ${data.current_distance}m`;
          if (data.recommended_flex) {
            text += ` → ${data.recommended_flex} 추천`;
          }
        }
      }
      
      text += '\n\n⚠️ *즉시 연락 필요!*';

      message = {
        text: text,
        attachments: [{
          color: '#FFA500',
          footer: 'MASGOLF 상담 문의',
          ts: Math.floor(Date.now() / 1000)
        }]
      };
    }

    // 디버깅 로그
    console.log('Slack 메시지 전송 시도:', webhookUrl);
    console.log('메시지 내용:', JSON.stringify(message, null, 2));

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

    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Slack 알림 에러:', error);
    res.status(500).json({ error: 'Failed to send Slack notification', details: error.message });
  }
}
