// scripts/send-today-kakao-to-slack.js
// 오늘 날짜의 카카오톡 메시지를 마스골프와 마스텍 슬랙으로 전송하는 스크립트
import 'dotenv-flow/config'; // .env.local, .env.development, .env 등 로드

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

async function sendTodayKakaoToSlack() {
  console.log('📤 오늘 카카오톡 메시지를 슬랙으로 전송 중...\n');

  try {
    const response = await fetch(`${BASE_URL}/api/kakao/send-today-to-slack`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });

    const result = await response.json();

    if (result.success) {
      console.log('✅ 전송 완료\n');
      console.log(`📅 날짜: ${result.date}`);
      console.log(`📱 메시지 수: ${result.messageCount}건\n`);
      console.log('📊 전송 결과:');
      console.log(`   마스골프: ${result.results.masgolf.success ? '✅ 성공' : `❌ 실패 (${result.results.masgolf.error})`}`);
      console.log(`   마스텍: ${result.results.mastech.success ? '✅ 성공' : `❌ 실패 (${result.results.mastech.error})`}`);
    } else {
      console.error('❌ 전송 실패:', result.message || result.error);
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ 오류 발생:', error);
    process.exit(1);
  }
}

sendTodayKakaoToSlack();

