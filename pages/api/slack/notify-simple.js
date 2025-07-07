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
      const fields = [
        {
          type: 'mrkdwn',
          text: `*🎯 시타 예약*\n\n*${data.name}*\n${data.phone}\n\n📅 ${data.date} ${data.time}\n🏌️ ${data.club || '미정'}`
        }
      ];

      // 퀴즈 데이터가 있으면 간단히 추가
      if (data.swing_style || data.priority || data.current_distance) {
        let quizInfo = '\n\n━━━━━━━━━━━━━━━━━━━\n';
        
        if (data.swing_style) quizInfo += `스윙: ${data.swing_style}`;
        if (data.priority) quizInfo += ` | 중요: ${data.priority}`;
        if (data.current_distance) {
          quizInfo += `\n비거리: ${data.current_distance}m`;
          if (data.recommended_flex) {
            quizInfo += ` → 추천: ${data.recommended_flex}`;
          }
        }
        
        fields[0].text += quizInfo;
      }

      message = {
        attachments: [{
          color: '#FF0000',
          fields: fields,
          footer: 'MASGOLF',
          footer_icon: 'https://win.masgolf.co.kr/favicon.ico',
          ts: Math.floor(Date.now() / 1000)
        }]
      };

    } else if (type === 'contact') {
      // 상담 문의 - 심플한 디자인
      const fields = [
        {
          type: 'mrkdwn',
          text: `*📞 상담 문의*\n\n*${data.name}*\n${data.phone}\n\n⏰ ${data.call_times || '시간 무관'}`
        }
      ];

      // 퀴즈 데이터가 있으면 간단히 추가
      if (data.swing_style || data.priority || data.current_distance) {
        let quizInfo = '\n\n━━━━━━━━━━━━━━━━━━━\n';
        
        if (data.swing_style) quizInfo += `스윙: ${data.swing_style}`;
        if (data.priority) quizInfo += ` | 중요: ${data.priority}`;
        if (data.current_distance) {
          quizInfo += `\n비거리: ${data.current_distance}m`;
          if (data.recommended_flex) {
            quizInfo += ` → 추천: ${data.recommended_flex}`;
          }
        }
        
        fields[0].text += quizInfo;
      }

      message = {
        attachments: [{
          color: '#FFA500',
          fields: fields,
          footer: 'MASGOLF - 즉시 연락 필요',
          footer_icon: 'https://win.masgolf.co.kr/favicon.ico',
          ts: Math.floor(Date.now() / 1000)
        }]
      };
    }

    // 디버깅을 위한 로그
    console.log('Slack 메시지 전송:', JSON.stringify(message, null, 2));

    // 슬랙으로 메시지 전송
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(message),
    });

    const responseText = await response.text();
    
    if (!response.ok) {
      console.error('Slack 응답 에러:', response.status, responseText);
      throw new Error(`Slack 알림 전송 실패: ${response.status}`);
    }

    console.log('Slack 알림 전송 성공');
    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Slack 알림 에러:', error);
    res.status(500).json({ error: error.message });
  }
}
