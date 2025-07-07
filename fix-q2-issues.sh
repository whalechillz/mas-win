#!/bin/bash

echo "Q2 문제 수정 시작..."

# 1. 슬랙 알림에 priority 필드 추가
echo "슬랙 알림 파일 수정..."
cat > /Users/m2/MASLABS/win.masgolf.co.kr/pages/api/slack/notify.js << 'EOF'
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
      const fields = [
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
        },
        {
          type: 'mrkdwn',
          text: `*관심클럽:* ${data.club || '미정'}`
        }
      ];

      // 퀴즈 데이터가 있으면 추가
      if (data.swing_style || data.current_distance) {
        fields.push({
          type: 'mrkdwn',
          text: `*스윙스타일:* ${data.swing_style || '-'}`
        });
        // Q2 priority 추가
        if (data.priority) {
          fields.push({
            type: 'mrkdwn',
            text: `*중요요소:* ${data.priority || '-'}`
          });
        }
        fields.push({
          type: 'mrkdwn',
          text: `*현재거리:* ${data.current_distance ? data.current_distance + 'm' : '-'}`
        });
        if (data.recommended_flex) {
          fields.push({
            type: 'mrkdwn',
            text: `*추천플렉스:* ${data.recommended_flex}`
          });
        }
        if (data.expected_distance) {
          fields.push({
            type: 'mrkdwn',
            text: `*예상거리:* ${data.expected_distance}m (+${data.expected_distance - data.current_distance}m)`
          });
        }
      }

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
            fields: fields
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
      const fields = [
        {
          type: 'mrkdwn',
          text: `*고객명:*\n${data.name}`
        },
        {
          type: 'mrkdwn',
          text: `*연락처:*\n${data.phone}`
        }
      ];

      // 퀴즈 데이터가 있으면 추가
      if (data.swing_style || data.current_distance) {
        fields.push({
          type: 'mrkdwn',
          text: `*스윙스타일:* ${data.swing_style || '-'}`
        });
        // Q2 priority 추가
        if (data.priority) {
          fields.push({
            type: 'mrkdwn',
            text: `*중요요소:* ${data.priority || '-'}`
          });
        }
        fields.push({
          type: 'mrkdwn',
          text: `*현재거리:* ${data.current_distance ? data.current_distance + 'm' : '-'}`
        });
        if (data.recommended_flex) {
          fields.push({
            type: 'mrkdwn',
            text: `*추천플렉스:* ${data.recommended_flex}`
          });
        }
      }

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
            fields: fields
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
EOF

# 2. HTML 파일에서 한글 텍스트 저장 로직 수정
echo "HTML 파일 수정 - quizData에 한글 텍스트 저장..."

# selectAnswer 함수 부분만 찾아서 수정
sed -i '' '/<div class="quiz-option bg-gray-800 p-6 rounded-xl text-center" onclick="selectAnswer(1, '\''stability'\'')">/,/<\/div>/ s/onclick="selectAnswer(1, '\''stability'\'')"/onclick="selectAnswer(1, '\''stability'\'', '\''안정형'\'')"/g' /Users/m2/MASLABS/win.masgolf.co.kr/public/versions/funnel-2025-07-complete.html
sed -i '' '/<div class="quiz-option bg-gray-800 p-6 rounded-xl text-center" onclick="selectAnswer(1, '\''power'\'')">/,/<\/div>/ s/onclick="selectAnswer(1, '\''power'\'')"/onclick="selectAnswer(1, '\''power'\'', '\''파워형'\'')"/g' /Users/m2/MASLABS/win.masgolf.co.kr/public/versions/funnel-2025-07-complete.html
sed -i '' '/<div class="quiz-option bg-gray-800 p-6 rounded-xl text-center" onclick="selectAnswer(1, '\''hybrid'\'')">/,/<\/div>/ s/onclick="selectAnswer(1, '\''hybrid'\'')"/onclick="selectAnswer(1, '\''hybrid'\'', '\''복합형'\'')"/g' /Users/m2/MASLABS/win.masgolf.co.kr/public/versions/funnel-2025-07-complete.html

sed -i '' '/<div class="quiz-option bg-gray-800 p-6 rounded-xl text-center" onclick="selectAnswer(2, '\''distance'\'')">/,/<\/div>/ s/onclick="selectAnswer(2, '\''distance'\'')"/onclick="selectAnswer(2, '\''distance'\'', '\''비거리'\'')"/g' /Users/m2/MASLABS/win.masgolf.co.kr/public/versions/funnel-2025-07-complete.html
sed -i '' '/<div class="quiz-option bg-gray-800 p-6 rounded-xl text-center" onclick="selectAnswer(2, '\''direction'\'')">/,/<\/div>/ s/onclick="selectAnswer(2, '\''direction'\'')"/onclick="selectAnswer(2, '\''direction'\'', '\''방향성'\'')"/g' /Users/m2/MASLABS/win.masgolf.co.kr/public/versions/funnel-2025-07-complete.html
sed -i '' '/<div class="quiz-option bg-gray-800 p-6 rounded-xl text-center" onclick="selectAnswer(2, '\''comfort'\'')">/,/<\/div>/ s/onclick="selectAnswer(2, '\''comfort'\'')"/onclick="selectAnswer(2, '\''comfort'\'', '\''편안함'\'')"/g' /Users/m2/MASLABS/win.masgolf.co.kr/public/versions/funnel-2025-07-complete.html

# selectAnswer 함수 수정 - 한글 텍스트를 받도록
sed -i '' '/function selectAnswer(step, value) {/,/setTimeout(() => {/ {
  s/function selectAnswer(step, value) {/function selectAnswer(step, value, koreanText) {/
  /if (step === 1) {/,/}/ {
    /quizData.style = value;/a\
                quizData.styleText = koreanText || value;
  }
  /if (step === 2) {/,/}/ {
    /quizData.priority = value;/a\
                quizData.priorityText = koreanText || value;
  }
}' /Users/m2/MASLABS/win.masgolf.co.kr/public/versions/funnel-2025-07-complete.html

echo "수정 완료!"
echo "다음 단계:"
echo "1. 변경사항 확인"
echo "2. Vercel 재배포"
echo "3. 브라우저 캐시 삭제 후 테스트"
