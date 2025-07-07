// 슬랙 웹훅 알림을 위한 API 엔드포인트
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
      // 시타 예약 알림
      message = {
        text: '🎯 새로운 시타 예약이 접수되었습니다!',
        blocks: [
          {
            type: 'header',
            text: {
              type: 'plain_text',
              text: '🎯 새로운 시타 예약',
              emoji: true
            }
          },
          {
            type: 'section',
            fields: [
              {
                type: 'mrkdwn',
                text: `*고객명:*\n${data.name}`
              },
              {
                type: 'mrkdwn',
                text: `*연락처:*\n${data.phone}`
              },
              {
                type: 'mrkdwn',
                text: `*희망날짜:*\n${data.date}`
              },
              {
                type: 'mrkdwn',
                text: `*희망시간:*\n${data.time}`
              }
            ]
          },
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: `*관심클럽:* ${data.club || '미정'}`
            }
          },
          {
            type: 'context',
            elements: [
              {
                type: 'mrkdwn',
                text: `접수시간: ${new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' })}`
              }
            ]
          },
          {
            type: 'actions',
            elements: [
              {
                type: 'button',
                text: {
                  type: 'plain_text',
                  text: '관리자 페이지에서 확인',
                  emoji: true
                },
                url: 'https://win.masgolf.co.kr/admin',
                style: 'primary'
              }
            ]
          }
        ]
      };
    } else if (type === 'contact') {
      // 상담 문의 알림
      message = {
        text: '📞 새로운 상담 문의가 접수되었습니다!',
        blocks: [
          {
            type: 'header',
            text: {
              type: 'plain_text',
              text: '📞 새로운 상담 문의',
              emoji: true
            }
          },
          {
            type: 'section',
            fields: [
              {
                type: 'mrkdwn',
                text: `*고객명:*\n${data.name}`
              },
              {
                type: 'mrkdwn',
                text: `*연락처:*\n${data.phone}`
              }
            ]
          },
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: `*통화가능시간:* ${data.call_times || '시간무관'}`
            }
          },
          {
            type: 'context',
            elements: [
              {
                type: 'mrkdwn',
                text: `접수시간: ${new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' })}`
              }
            ]
          },
          {
            type: 'divider'
          },
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: '⚠️ *빠른 연락 부탁드립니다!*'
            }
          },
          {
            type: 'actions',
            elements: [
              {
                type: 'button',
                text: {
                  type: 'plain_text',
                  text: '관리자 페이지에서 확인',
                  emoji: true
                },
                url: 'https://win.masgolf.co.kr/admin',
                style: 'primary'
              }
            ]
          }
        ]
      };
    }

    // 슬랙으로 메시지 전송
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(message),
    });

    if (!response.ok) {
      throw new Error('Slack 알림 전송 실패');
    }

    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Slack 알림 에러:', error);
    res.status(500).json({ error: 'Failed to send Slack notification' });
  }
}