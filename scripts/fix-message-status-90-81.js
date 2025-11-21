const { createClient } = require('@supabase/supabase-js');
const { createSolapiSignature } = require('../utils/solapiSignature.js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const SOLAPI_API_KEY = process.env.SOLAPI_API_KEY || "";
const SOLAPI_API_SECRET = process.env.SOLAPI_API_SECRET || "";

// 수정할 메시지 ID
const MESSAGE_IDS = [90, 81];

async function fixMessageStatus() {
  console.log('🔄 메시지 상태 수정 시작...\n');
  console.log(`📋 수정할 메시지: ${MESSAGE_IDS.join(', ')}\n`);

  if (!SOLAPI_API_KEY || !SOLAPI_API_SECRET) {
    console.error('❌ 솔라피 API 키가 설정되지 않았습니다.');
    process.exit(1);
  }

  const authHeaders = createSolapiSignature(SOLAPI_API_KEY, SOLAPI_API_SECRET);

  for (const messageId of MESSAGE_IDS) {
    console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`📝 메시지 #${messageId} 처리 중...`);

    try {
      // 1. 메시지 정보 조회
      const { data: message, error: fetchError } = await supabase
        .from('channel_sms')
        .select('*')
        .eq('id', messageId)
        .single();

      if (fetchError || !message) {
        console.error(`   ❌ 메시지를 찾을 수 없습니다:`, fetchError?.message);
        continue;
      }

      console.log(`   ✅ 메시지 조회 완료`);
      console.log(`      - 현재 상태: ${message.status}`);
      console.log(`      - 솔라피 그룹 ID: ${message.solapi_group_id || '없음'}`);
      console.log(`      - 수신자: ${message.recipient_numbers?.length || 0}명`);

      if (!message.solapi_group_id) {
        console.warn(`   ⚠️ 솔라피 그룹 ID가 없습니다. 건너뜁니다.`);
        continue;
      }

      // 2. 솔라피에서 실제 상태 조회
      console.log(`   🔍 솔라피에서 상태 조회 중...`);
      const solapiResponse = await fetch(
        `https://api.solapi.com/messages/v4/groups/${message.solapi_group_id}`,
        { 
          method: 'GET',
          headers: authHeaders 
        }
      );

      if (!solapiResponse.ok) {
        const errorText = await solapiResponse.text();
        console.error(`   ❌ 솔라피 API 오류: ${solapiResponse.status}`, errorText.substring(0, 200));
        continue;
      }

      const solapiData = await solapiResponse.json();
      console.log(`   ✅ 솔라피 조회 완료`);

      // 3. 솔라피 응답에서 카운트 추출
      let groupInfo = solapiData.groupInfo || solapiData;
      let count = {};
      
      if (groupInfo && groupInfo.count) {
        count = groupInfo.count;
      } else if (solapiData.count) {
        count = solapiData.count;
      } else if (groupInfo && typeof groupInfo === 'object') {
        count = groupInfo;
      }
      
      const totalCount = count.total || count.totalCount || groupInfo?.totalCount || groupInfo?.total || solapiData.total || solapiData.totalCount || 0;
      const successCount = count.successful || count.success || count.successCount || groupInfo?.successCount || groupInfo?.successful || groupInfo?.success || solapiData.successful || solapiData.successCount || 0;
      const failCount = count.failed || count.fail || count.failCount || groupInfo?.failCount || groupInfo?.failed || groupInfo?.fail || solapiData.failed || solapiData.failCount || 0;
      const sendingCount = count.sending || count.sendingCount || groupInfo?.sendingCount || groupInfo?.sending || solapiData.sending || solapiData.sendingCount || (totalCount - successCount - failCount);

      console.log(`   📊 솔라피 발송 결과:`);
      console.log(`      - 총: ${totalCount}건`);
      console.log(`      - 성공: ${successCount}건`);
      console.log(`      - 실패: ${failCount}건`);
      console.log(`      - 발송중: ${sendingCount}건`);

      // 4. 상태 결정
      let finalStatus = message.status;
      if (sendingCount > 0) {
        finalStatus = 'partial';
      } else if (failCount === 0 && successCount > 0) {
        finalStatus = 'sent';
      } else if (successCount === 0 && failCount > 0) {
        finalStatus = 'failed';
      } else if (successCount > 0 && failCount > 0) {
        finalStatus = 'partial';
      }

      console.log(`   📝 상태 결정: ${message.status} → ${finalStatus}`);

      // 5. DB 업데이트
      const updateData = {
        status: finalStatus,
        success_count: successCount,
        fail_count: failCount,
        sent_count: totalCount,
        updated_at: new Date().toISOString()
      };

      // sent_at이 없으면 현재 시간으로 설정
      if (!message.sent_at && (finalStatus === 'sent' || finalStatus === 'partial')) {
        updateData.sent_at = new Date().toISOString();
      }

      const { data: updatedMessage, error: updateError } = await supabase
        .from('channel_sms')
        .update(updateData)
        .eq('id', messageId)
        .select()
        .single();

      if (updateError) {
        console.error(`   ❌ DB 업데이트 실패:`, updateError);
        continue;
      }

      console.log(`   ✅ DB 업데이트 완료!`);
      console.log(`      - 상태: ${updatedMessage.status}`);
      console.log(`      - 성공: ${updatedMessage.success_count}건`);
      console.log(`      - 실패: ${updatedMessage.fail_count}건`);
      console.log(`      - 총: ${updatedMessage.sent_count}건`);

    } catch (error) {
      console.error(`   ❌ 메시지 #${messageId} 처리 중 오류:`, error.message);
      console.error(`   스택:`, error.stack);
    }
  }

  console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`✅ 메시지 상태 수정 완료!`);
  console.log(`\n💡 확인 사항:`);
  console.log(`   1. SMS 리스트에서 메시지 #90, #81 확인`);
  console.log(`   2. 상태가 올바르게 업데이트되었는지 확인`);
  console.log(`   3. 동기화 버튼이 표시되는지 확인`);
}

fixMessageStatus();

