async function testSlackWebhook() {
  const fetch = (await import('node-fetch')).default;
  const SLACK_WEBHOOK_URL = 'https://hooks.slack.com/services/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';
  
  const testMessage = {
    channel: 'C04DEABHEM8',
    username: 'MASLABS 업무봇',
    icon_emoji: ':memo:',
    text: '🧪 Slack Webhook 테스트 메시지',
    attachments: [
      {
        color: '#36a64f',
        title: '📋 새로운 업무 등록',
        title_link: 'https://maslabs.kr/shared-tasks',
        fields: [
          {
            title: '업무 유형',
            value: 'OP10 - 내부전달, 택배, 환경개선',
            short: true
          },
          {
            title: '작성자',
            value: '테스트 사용자 (TEST001)',
            short: true
          },
          {
            title: '업무명',
            value: '테스트 OP10 업무 - Slack 알림 확인',
            short: false
          },
          {
            title: '업무 내용',
            value: '이것은 Slack 알림 테스트를 위한 OP10 업무입니다. 투어 관련 내용을 포함합니다.',
            short: false
          },
          {
            title: '고객명',
            value: '테스트 고객',
            short: true
          },
          {
            title: '포인트',
            value: '5점',
            short: true
          }
        ],
        footer: 'MASLABS 업무 관리 시스템',
        ts: Math.floor(Date.now() / 1000)
      }
    ]
  };

  try {
    console.log('🧪 Slack Webhook 테스트 시작...');
    console.log('📤 메시지 전송 중...');
    
    const response = await fetch(SLACK_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testMessage),
    });

    console.log(`📊 응답 상태: ${response.status} ${response.statusText}`);
    
    if (response.ok) {
      console.log('✅ Slack 메시지 전송 성공!');
      const responseText = await response.text();
      console.log('📝 응답 내용:', responseText);
    } else {
      console.log('❌ Slack 메시지 전송 실패');
      const errorText = await response.text();
      console.log('📝 에러 내용:', errorText);
    }
    
  } catch (error) {
    console.error('❌ 테스트 중 오류 발생:', error);
  }
}

testSlackWebhook();
