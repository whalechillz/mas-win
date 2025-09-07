// 슬랙 웹훅 알림을 위한 API 엔드포인트 - 개선된 디자인
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
      // 시타 예약 알림 - 개선된 디자인
      const blocks = [
        {
          type: 'header',
          text: {
            type: 'plain_text',
            text: '🎯 새로운 시타 예약이 접수되었습니다!',
            emoji: true
          }
        },
        {
          type: 'divider'
        },
        // 고객 정보 섹션
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: '*📋 고객 정보*'
          }
        },
        {
          type: 'section',
          fields: [
            {
              type: 'mrkdwn',
              text: `*이름*\n${data.name}`
            },
            {
              type: 'mrkdwn',
              text: `*연락처*\n${data.phone}`
            }
          ]
        },
        // 예약 정보 섹션
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: '*📅 예약 정보*'
          }
        },
        {
          type: 'section',
          fields: [
            {
              type: 'mrkdwn',
              text: `*날짜*\n${data.date}`
            },
            {
              type: 'mrkdwn',
              text: `*시간*\n${data.time}`
            }
          ]
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*관심 클럽*\n${data.club || '미정'}`
          }
        }
      ];

      // 퀴즈 데이터가 있으면 추가
      if (data.swing_style || data.current_distance) {
        blocks.push(
          {
            type: 'divider'
          },
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: '*🏌️ 골프 스타일 분석*'
            }
          },
          {
            type: 'section',
            fields: [
              {
                type: 'mrkdwn',
                text: `*스윙 스타일*\n${data.swing_style || '-'}`
              },
              {
                type: 'mrkdwn',
                text: `*중요 요소*\n${data.priority || '-'}`
              }
            ]
          }
        );

        if (data.current_distance) {
          blocks.push({
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: '*📊 비거리 분석*'
            }
          });

          const distanceFields = [
            {
              type: 'mrkdwn',
              text: `*현재 비거리*\n${data.current_distance}m`
            }
          ];

          if (data.expected_distance) {
            distanceFields.push({
              type: 'mrkdwn',
              text: `*예상 비거리*\n${data.expected_distance}m (+${data.expected_distance - data.current_distance}m) 🚀`
            });
          }

          blocks.push({
            type: 'section',
            fields: distanceFields
          });

          if (data.recommended_flex) {
            blocks.push({
              type: 'section',
              text: {
                type: 'mrkdwn',
                text: `*🎯 추천 플렉스*\n${data.recommended_flex}`
              },
              accessory: {
                type: 'button',
                text: {
                  type: 'plain_text',
                  text: '✨ 최적화',
                  emoji: true
                },
                style: 'primary',
                value: 'optimized'
              }
            });
          }
        }
      }

      // 하단 정보
      blocks.push(
        {
          type: 'divider'
        },
        {
          type: 'context',
          elements: [
            {
              type: 'mrkdwn',
              text: `⏰ 접수 시간: ${new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' })}`
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
                text: '📞 전화하기',
                emoji: true
              },
              url: `tel:${data.phone}`,
              style: 'primary'
            },
            {
              type: 'button',
              text: {
                type: 'plain_text',
                text: '💼 관리자 페이지',
                emoji: true
              },
              url: 'https://win.masgolf.co.kr/admin'
            }
          ]
        }
      );

      message = {
        text: '🎯 새로운 시타 예약이 접수되었습니다!',
        blocks: blocks
      };

    } else if (type === 'contact') {
      // 상담 문의 알림 - 개선된 디자인
      const blocks = [
        {
          type: 'header',
          text: {
            type: 'plain_text',
            text: '📞 새로운 상담 문의가 접수되었습니다!',
            emoji: true
          }
        },
        {
          type: 'divider'
        },
        // 고객 정보
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: '*👤 고객 정보*'
          }
        },
        {
          type: 'section',
          fields: [
            {
              type: 'mrkdwn',
              text: `*이름*\n${data.name}`
            },
            {
              type: 'mrkdwn',
              text: `*연락처*\n${data.phone}`
            }
          ]
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*📱 통화 가능 시간*\n${data.call_times || '시간 무관'}`
          }
        }
      ];

      // 퀴즈 데이터가 있으면 추가
      if (data.swing_style || data.current_distance) {
        blocks.push(
          {
            type: 'divider'
          },
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: '*🏌️ 고객 프로필*'
            }
          }
        );

        const profileFields = [];
        
        if (data.swing_style) {
          profileFields.push({
            type: 'mrkdwn',
            text: `*스윙 스타일*\n${data.swing_style}`
          });
        }
        
        if (data.priority) {
          profileFields.push({
            type: 'mrkdwn',
            text: `*중요 요소*\n${data.priority}`
          });
        }

        if (profileFields.length > 0) {
          blocks.push({
            type: 'section',
            fields: profileFields
          });
        }

        if (data.current_distance) {
          blocks.push({
            type: 'section',
            fields: [
              {
                type: 'mrkdwn',
                text: `*현재 비거리*\n${data.current_distance}m`
              },
              {
                type: 'mrkdwn',
                text: `*추천 플렉스*\n${data.recommended_flex || '분석 필요'}`
              }
            ]
          });
        }
      }

      // 긴급도 표시
      blocks.push(
        {
          type: 'divider'
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: '⚠️ *즉시 연락 필요*\n고객이 상담을 기다리고 있습니다!'
          }
        },
        {
          type: 'context',
          elements: [
            {
              type: 'mrkdwn',
              text: `⏰ 접수 시간: ${new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' })}`
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
                text: '📞 즉시 전화',
                emoji: true
              },
              url: `tel:${data.phone}`,
              style: 'danger'
            },
            {
              type: 'button',
              text: {
                type: 'plain_text',
                text: '✅ 연락 완료',
                emoji: true
              },
              style: 'primary',
              value: 'contacted'
            },
            {
              type: 'button',
              text: {
                type: 'plain_text',
                text: '💼 관리자 페이지',
                emoji: true
              },
              url: 'https://win.masgolf.co.kr/admin'
            }
          ]
        }
      );

      message = {
        text: '📞 새로운 상담 문의가 접수되었습니다!',
        blocks: blocks
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
