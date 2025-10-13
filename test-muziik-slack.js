async function testMuziikSlackWebhook() {
  const fetch = (await import('node-fetch')).default;
  
  // 기존 Slack 웹훅 URL 사용 (Vercel 환경 변수에서 확인)
  const SLACK_WEBHOOK_URL = process.env.SLACK_WEBHOOK_URL || 'https://hooks.slack.com/services/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';
  
  const testMessage = {
    username: 'MUZIIK 문의봇',
    icon_emoji: ':golf:',
    text: '🧪 MUZIIK Slack Webhook 테스트 메시지',
    attachments: [
      {
        color: '#36a64f',
        title: '📋 일반 문의',
        title_link: 'https://muziik.masgolf.co.kr/contact',
        fields: [
          {
            title: '문의 유형',
            value: '일반 문의',
            short: true
          },
          {
            title: '이름',
            value: '테스트 사용자',
            short: true
          },
          {
            title: '이메일',
            value: 'test@example.com',
            short: true
          },
          {
            title: '전화번호',
            value: '010-1234-5678',
            short: true
          },
          {
            title: '문의 분류',
            value: '제품 문의',
            short: true
          },
          {
            title: '회사명',
            value: '테스트 회사',
            short: true
          },
          {
            title: '문의 내용',
            value: '이것은 MUZIIK Contact 폼 Slack 알림 테스트를 위한 문의입니다. DOGATTI GENERATION 샤프트에 대한 문의를 포함합니다.',
            short: false
          }
        ],
        footer: 'MUZIIK DOGATTI GENERATION 샤프트 문의 시스템',
        ts: Math.floor(Date.now() / 1000)
      }
    ]
  };

  try {
    console.log('🧪 MUZIIK Slack Webhook 테스트 시작...');
    console.log('📤 메시지 전송 중...');
    console.log('🎯 대상 채널: #01-ma-op');
    
    const response = await fetch(SLACK_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testMessage),
    });

    console.log(`📊 응답 상태: ${response.status} ${response.statusText}`);
    
    if (response.ok) {
      console.log('✅ MUZIIK Slack 메시지 전송 성공!');
      const responseText = await response.text();
      console.log('📝 응답 내용:', responseText);
      console.log('🎉 #01-ma-op 채널에서 메시지를 확인하세요!');
    } else {
      console.log('❌ MUZIIK Slack 메시지 전송 실패');
      const errorText = await response.text();
      console.log('📝 에러 내용:', errorText);
    }
    
  } catch (error) {
    console.error('❌ 테스트 중 오류 발생:', error);
  }
}

testMuziikSlackWebhook();
