/**
 * 158번 메시지의 솔라피 그룹 상태 확인
 */

const { createClient } = require('@supabase/supabase-js');
const { createSolapiSignature } = require('../utils/solapiSignature.js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SOLAPI_API_KEY = process.env.SOLAPI_API_KEY;
const SOLAPI_API_SECRET = process.env.SOLAPI_API_SECRET;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Supabase 환경 변수가 설정되지 않았습니다.');
  process.exit(1);
}

if (!SOLAPI_API_KEY || !SOLAPI_API_SECRET) {
  console.error('❌ Solapi 환경 변수가 설정되지 않았습니다.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSolapiGroup() {
  try {
    console.log('🔍 158번 메시지 솔라피 그룹 상태 확인 중...\n');

    // 1. 메시지 정보 가져오기
    const { data: message, error: messageError } = await supabase
      .from('channel_sms')
      .select('*')
      .eq('id', 158)
      .single();

    if (messageError || !message) {
      console.error('❌ 메시지를 찾을 수 없습니다:', messageError);
      return;
    }

    const groupId = message.solapi_group_id;
    if (!groupId) {
      console.error('❌ 솔라피 그룹 ID가 없습니다.');
      return;
    }

    console.log(`📋 솔라피 그룹 ID: ${groupId}\n`);

    // 2. 솔라피 API로 그룹 상태 조회
    const authHeaders = createSolapiSignature(SOLAPI_API_KEY, SOLAPI_API_SECRET);
    
    console.log('📡 솔라피 API 호출 중...');
    const solapiResponse = await fetch(
      `https://api.solapi.com/messages/v4/groups/${groupId}`,
      { 
        method: 'GET',
        headers: authHeaders 
      }
    );

    if (!solapiResponse.ok) {
      const errorText = await solapiResponse.text();
      console.error('❌ 솔라피 API 오류:', solapiResponse.status);
      console.error('오류 내용:', errorText);
      return;
    }

    const solapiData = await solapiResponse.json();
    console.log('\n📊 솔라피 그룹 정보:');
    console.log(JSON.stringify(solapiData, null, 2));

    // 3. 상태 추출
    const groupInfo = solapiData.groupInfo || solapiData;
    const count = groupInfo.count || {};
    
    const totalCount = count.total || count.sentTotal || count.totalCount || groupInfo?.totalCount || 0;
    const successCount = count.sentSuccess || count.successful || count.success || count.successCount || groupInfo?.successCount || 0;
    const failCount = count.sentFailed || count.failed || count.fail || count.failCount || groupInfo?.failCount || 0;
    const sendingCount = count.sentPending || count.sending || count.sendingCount || groupInfo?.sendingCount || (totalCount - successCount - failCount);

    console.log('\n📈 발송 결과 요약:');
    console.log(`   총 발송: ${totalCount}건`);
    console.log(`   성공: ${successCount}건`);
    console.log(`   실패: ${failCount}건`);
    console.log(`   발송 중: ${sendingCount}건`);

    // 4. 메시지 목록으로 상세 확인 (필요시)
    if (totalCount > 0 && (successCount === 0 && failCount === 0)) {
      console.log('\n📋 메시지 목록 상세 조회 중...');
      const messageListResponse = await fetch(
        `https://api.solapi.com/messages/v4/list?groupId=${groupId}&limit=1000`,
        { 
          method: 'GET',
          headers: authHeaders 
        }
      );
      
      if (messageListResponse.ok) {
        const messageListData = await messageListResponse.json();
        if (messageListData.messages && Array.isArray(messageListData.messages)) {
          console.log(`\n📨 메시지 상세 (${messageListData.messages.length}건):`);
          messageListData.messages.forEach((msg, idx) => {
            console.log(`   ${idx + 1}. ${msg.to} - 상태: ${msg.status || 'N/A'} (코드: ${msg.statusCode || 'N/A'})`);
          });
        }
      }
    }

    // 5. 결론
    console.log('\n📌 결론:');
    if (successCount > 0) {
      console.log(`   ✅ 실제로 ${successCount}건이 성공적으로 발송되었습니다.`);
      console.log(`   ⚠️ DB 상태가 "failed"로 잘못 표시되어 있습니다.`);
    } else if (failCount > 0) {
      console.log(`   ❌ ${failCount}건이 실패했습니다.`);
    } else if (sendingCount > 0) {
      console.log(`   ⏳ ${sendingCount}건이 아직 발송 중입니다.`);
    } else {
      console.log(`   ❓ 발송 상태를 확인할 수 없습니다.`);
    }

  } catch (error) {
    console.error('❌ 오류 발생:', error);
  }
}

checkSolapiGroup();


