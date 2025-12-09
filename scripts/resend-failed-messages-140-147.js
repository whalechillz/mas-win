/**
 * 실패한 메시지 140-147을 직접 재발송
 * /api/channels/sms/send API를 사용하여 이미지 URL을 자동으로 Solapi imageId로 변환
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://win.masgolf.co.kr';
const messageIds = [140, 141, 142, 143, 144, 145, 146, 147];

async function resendMessages() {
  console.log('='.repeat(80));
  console.log('📨 실패한 메시지 140-147 재발송');
  console.log('='.repeat(80));
  console.log('');

  // 메시지 조회
  const { data: messages } = await supabase
    .from('channel_sms')
    .select('*')
    .in('id', messageIds)
    .order('id', { ascending: true });

  if (!messages || messages.length === 0) {
    console.log('❌ 메시지를 찾을 수 없습니다.');
    return;
  }

  for (const msg of messages) {
    console.log(`\n🔄 메시지 ${msg.id} 재발송 중...`);
    console.log(`   타입: ${msg.message_type}, 수신자: ${msg.recipient_numbers?.length || 0}명`);

    // 수신자 번호 파싱
    let recipientNumbers = [];
    if (msg.recipient_numbers) {
      if (Array.isArray(msg.recipient_numbers)) {
        recipientNumbers = msg.recipient_numbers;
      } else if (typeof msg.recipient_numbers === 'string') {
        try {
          recipientNumbers = JSON.parse(msg.recipient_numbers);
        } catch {
          recipientNumbers = [msg.recipient_numbers];
        }
      }
    }

    if (recipientNumbers.length === 0) {
      console.log(`   ⚠️  수신자가 없어 건너뜁니다.`);
      continue;
    }

    try {
      // /api/channels/sms/send API 호출
      const sendResponse = await fetch(`${BASE_URL}/api/channels/sms/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          channelPostId: msg.id,
          messageType: msg.message_type || 'MMS',
          messageText: msg.message_text,
          content: msg.message_text,
          imageUrl: msg.image_url,
          recipientNumbers: recipientNumbers,
          shortLink: msg.short_link || null
        })
      });

      if (!sendResponse.ok) {
        const errorData = await sendResponse.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP ${sendResponse.status}`);
      }

      const result = await sendResponse.json();
      
      if (!result.success) {
        throw new Error(result.message || '발송 실패');
      }

      console.log(`✅ 메시지 ${msg.id}: 재발송 성공`);
      if (result.result) {
        console.log(`   그룹 ID: ${result.result.groupIds?.join(', ') || '없음'}`);
        console.log(`   성공: ${result.result.successCount || 0}건, 실패: ${result.result.failCount || 0}건`);
      }
    } catch (error) {
      console.error(`❌ 메시지 ${msg.id}: 재발송 실패 - ${error.message}`);
    }
  }

  console.log('\n' + '='.repeat(80));
  console.log('✅ 재발송 완료!');
}

resendMessages().catch(console.error);





