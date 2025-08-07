// 슬랙 웹훅 알림 - 중복 방지 추가
const recentRequests = new Map(); // 최근 요청 추적

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { type, data } = req.body;
  
  // 중복 요청 체크 (전화번호 + 타입 기준, 30초 이내)
  const requestKey = `${data.phone}-${type}`;
  const now = Date.now();
  const lastRequest = recentRequests.get(requestKey);
  
  if (lastRequest && (now - lastRequest) < 30000) { // 30초 이내 중복 요청
    console.log('중복 요청 감지:', requestKey);
    return res.status(200).json({ 
      success: true, 
      message: 'Already processed',
      duplicate: true 
    });
  }
  
  // 요청 시간 기록
  recentRequests.set(requestKey, now);
  
  // 오래된 요청 정리 (1시간 이상)
  for (const [key, time] of recentRequests.entries()) {
    if (now - time > 3600000) {
      recentRequests.delete(key);
    }
  }

  // 슬랙 웹훅 URL (환경변수로 관리)
  const webhookUrl = process.env.SLACK_WEBHOOK_URL;
  
  console.log('슬랙 웹훅 URL 확인:', webhookUrl ? '설정됨' : '설정되지 않음');
  console.log('환경변수 전체:', Object.keys(process.env).filter(key => key.includes('SLACK')));
  
  if (!webhookUrl) {
    console.error('SLACK_WEBHOOK_URL이 설정되지 않았습니다');
    console.log('슬랙 알림을 건너뛰고 성공 응답을 반환합니다');
    return res.status(200).json({ 
      success: true, 
      message: 'Slack webhook not configured, but request processed',
      skipped: true 
    });
  }

  // 전화번호 포맷팅 함수
  const formatPhoneNumber = (phone) => {
    const numbers = phone.replace(/[^0-9]/g, '');
    if (numbers.length === 11) {
      return numbers.replace(/(\d{3})(\d{4})(\d{4})/, '$1-$2-$3');
    } else if (numbers.length === 10) {
      if (numbers.startsWith('02')) {
        return numbers.replace(/(\d{2})(\d{4})(\d{4})/, '$1-$2-$3');
      } else {
        return numbers.replace(/(\d{3})(\d{3})(\d{4})/, '$1-$2-$3');
      }
    }
    return phone;
  };

  try {
    let message = {};

    if (type === 'booking') {
      // 시타 예약 - 심플한 디자인
      let text = `*🎯 시타 예약 접수*\n\n`;
      text += `👤 *${data.name}*\n`;
      text += `📞 ${formatPhoneNumber(data.phone)}\n\n`;
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
      text += `📞 ${formatPhoneNumber(data.phone)}\n\n`;
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
