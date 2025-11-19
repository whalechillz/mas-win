const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const LOCAL_URL = process.env.LOCAL_URL || 'http://localhost:3000';

// 줄바꿈이 포함된 비구매자 메시지 내용 (마지막에 공백 줄 추가)
const MESSAGE_TEXT = `[마쓰구 골드2] 첫 구매 특별 혜택! "마제스티보다 20m 더 멀리" 시니어 비거리 +30m 보장 2년 헤드보증 + 무료 피팅

☆ https://www.masgolf.co.kr/products/gold2-sapphire

`;

// 업데이트할 메시지 ID 목록 (비구매자 6개 그룹)
const MESSAGE_IDS = [90, 91, 92, 93, 94, 95];

async function updateMessages() {
  console.log('🚀 비구매자 메시지 포맷 업데이트 시작...\n');
  console.log(`📝 업데이트할 메시지: ${MESSAGE_IDS.join(', ')}\n`);

  const results = [];

  for (const messageId of MESSAGE_IDS) {
    console.log(`\n📝 메시지 ID ${messageId} 업데이트 중...`);

    try {
      // API 호출
      const response = await fetch(`${LOCAL_URL}/api/admin/sms`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: messageId,
          message: MESSAGE_TEXT,
          type: 'MMS',
          status: 'draft'
          // 다른 필드는 유지 (recipientNumbers, imageUrl, note 등은 undefined로 전달하지 않음)
        })
      });

      const result = await response.json();

      if (result.success) {
        results.push({
          id: messageId,
          status: 'success'
        });
        console.log(`   ✅ 메시지 ID ${messageId} 업데이트 완료!`);
      } else {
        results.push({
          id: messageId,
          status: 'error',
          error: result.message
        });
        console.error(`   ❌ 메시지 ID ${messageId} 업데이트 실패: ${result.message}`);
      }
    } catch (error) {
      results.push({
        id: messageId,
        status: 'error',
        error: error.message
      });
      console.error(`   ❌ API 호출 오류:`, error.message);
    }
  }

  // 결과 요약
  console.log(`\n\n📊 업데이트 결과 요약:`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  const successCount = results.filter(r => r.status === 'success').length;
  const failCount = results.filter(r => r.status === 'error').length;
  
  console.log(`✅ 성공: ${successCount}개`);
  console.log(`❌ 실패: ${failCount}개`);
  
  if (successCount > 0) {
    console.log(`\n✅ 업데이트된 메시지:`);
    results.filter(r => r.status === 'success').forEach(r => {
      console.log(`   - ID: ${r.id} (${LOCAL_URL}/admin/sms?id=${r.id})`);
    });
  }
  
  if (failCount > 0) {
    console.log(`\n❌ 실패한 메시지:`);
    results.filter(r => r.status === 'error').forEach(r => {
      console.log(`   - ID: ${r.id}: ${r.error}`);
    });
  }
  
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`\n💡 변경 사항:`);
  console.log(`   - 메시지에 줄바꿈 추가`);
  console.log(`   - 마지막에 공백 줄 추가`);
  console.log(`   - 총 ${MESSAGE_TEXT.length}자 (줄바꿈 포함)`);
}

updateMessages();

