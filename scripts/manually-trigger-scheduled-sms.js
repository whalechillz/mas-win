/**
 * 예약 발송 API를 수동으로 트리거하는 스크립트
 * 
 * 사용법:
 * node scripts/manually-trigger-scheduled-sms.js
 */

import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://win.masgolf.co.kr';
const CRON_SECRET = process.env.CRON_SECRET || '';

async function triggerScheduledSMS() {
  console.log('='.repeat(80));
  console.log('📨 예약 발송 API 수동 트리거');
  console.log('='.repeat(80));
  console.log('');

  const url = `${BASE_URL}/api/admin/send-scheduled-sms`;
  const headers = {
    'Content-Type': 'application/json'
  };

  // CRON_SECRET이 있으면 Authorization 헤더 추가
  if (CRON_SECRET) {
    headers['Authorization'] = `Bearer ${CRON_SECRET}`;
    console.log('✅ CRON_SECRET 사용');
  } else {
    console.log('⚠️  CRON_SECRET이 설정되지 않았습니다.');
  }

  console.log(`\n📡 API 호출: ${url}`);
  console.log('');

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: headers
    });

    const result = await response.json();

    console.log(`응답 상태: ${response.status}`);
    console.log('응답 내용:');
    console.log(JSON.stringify(result, null, 2));

    if (response.ok && result.success) {
      console.log('\n✅ 예약 발송 처리 완료!');
      if (result.sent > 0) {
        console.log(`   발송된 메시지: ${result.sent}개`);
        result.messages?.forEach(msg => {
          console.log(`   - 메시지 ID ${msg.id}: 성공 ${msg.sentCount || 0}건, 실패 ${msg.failCount || 0}건`);
        });
      } else {
        console.log('   발송할 예약 메시지가 없습니다.');
      }
    } else {
      console.log('\n❌ 예약 발송 처리 실패');
      console.log(`   오류: ${result.message || result.error || '알 수 없는 오류'}`);
    }
  } catch (error) {
    console.error('\n❌ API 호출 오류:', error.message);
  }

  console.log('\n' + '='.repeat(80));
}

triggerScheduledSMS().catch(console.error);











