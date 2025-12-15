/**
 * 148번 메시지의 Solapi 그룹별 실제 메시지 수 확인
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

async function checkSolapiGroups148() {
  try {
    console.log('🔍 148번 메시지의 Solapi 그룹별 실제 메시지 수 확인\n');
    console.log('='.repeat(100));

    // 1. 148번 메시지 조회
    const { data: message, error: messageError } = await supabase
      .from('channel_sms')
      .select('id, solapi_group_id, recipient_numbers')
      .eq('id', 148)
      .single();

    if (messageError || !message) {
      console.error('❌ 148번 메시지를 찾을 수 없습니다:', messageError);
      return;
    }

    console.log(`📋 메시지 ID: 148`);
    console.log(`   수신자 수: ${message.recipient_numbers?.length || 0}명`);
    console.log(`   솔라피 그룹 ID: ${message.solapi_group_id}\n`);

    // 2. 그룹 ID 파싱
    const groupIds = message.solapi_group_id
      ? message.solapi_group_id.split(',').map(g => g.trim()).filter(Boolean)
      : [];

    if (groupIds.length === 0) {
      console.error('❌ 솔라피 그룹 ID가 없습니다.');
      return;
    }

    console.log(`📤 솔라피 그룹 ID (${groupIds.length}개):`);
    groupIds.forEach((groupId, idx) => {
      console.log(`   ${idx + 1}. ${groupId}`);
    });
    console.log('');

    // 3. 각 그룹의 실제 메시지 수 확인
    const authHeaders = createSolapiSignature(SOLAPI_API_KEY, SOLAPI_API_SECRET);
    let totalFromGroups = 0;
    let totalSuccess = 0;
    let totalFail = 0;

    for (let i = 0; i < groupIds.length; i++) {
      const groupId = groupIds[i];
      console.log(`📊 그룹 ${i + 1}/${groupIds.length} (${groupId}):`);
      console.log('-'.repeat(100));

      try {
        // 그룹 정보 조회
        const groupResponse = await fetch(
          `https://api.solapi.com/messages/v4/groups/${groupId}`,
          { method: 'GET', headers: authHeaders }
        );

        if (!groupResponse.ok) {
          console.error(`   ❌ 그룹 정보 조회 실패: ${groupResponse.status}`);
          continue;
        }

        const groupData = await groupResponse.json();
        const groupInfo = groupData.groupInfo || groupData;
        const count = groupInfo.count || {};

        const groupTotal = count.total || count.sentTotal || count.totalCount || groupInfo?.totalCount || 0;
        const groupSuccess = count.sentSuccess || count.successful || count.success || count.successCount || groupInfo?.successCount || 0;
        const groupFail = count.sentFailed || count.failed || count.fail || count.failCount || groupInfo?.failCount || 0;

        console.log(`   그룹 정보에서:`);
        console.log(`      총: ${groupTotal}건`);
        console.log(`      성공: ${groupSuccess}건`);
        console.log(`      실패: ${groupFail}건`);

        // 메시지 목록 조회
        const messageListResponse = await fetch(
          `https://api.solapi.com/messages/v4/list?groupId=${groupId}&limit=1000`,
          { method: 'GET', headers: authHeaders }
        );

        if (messageListResponse.ok) {
          const messageListData = await messageListResponse.json();
          const messages = messageListData.messages || [];
          
          console.log(`   메시지 목록에서:`);
          console.log(`      총 메시지 수: ${messages.length}건`);
          
          // 중복 전화번호 확인
          const phoneSet = new Set();
          const duplicatePhones = [];
          
          messages.forEach(msg => {
            const phone = msg.to || msg.recipientNumber;
            if (phone) {
              if (phoneSet.has(phone)) {
                duplicatePhones.push(phone);
              } else {
                phoneSet.add(phone);
              }
            }
          });

          if (duplicatePhones.length > 0) {
            console.log(`      ⚠️ 중복된 전화번호: ${duplicatePhones.length}개`);
            duplicatePhones.slice(0, 5).forEach(phone => {
              console.log(`         ${phone}`);
            });
          } else {
            console.log(`      ✅ 중복된 전화번호 없음`);
          }

          console.log(`      고유 전화번호 수: ${phoneSet.size}개`);

          totalFromGroups += messages.length;
          totalSuccess += groupSuccess;
          totalFail += groupFail;
        } else {
          console.error(`   ❌ 메시지 목록 조회 실패: ${messageListResponse.status}`);
          totalFromGroups += groupTotal;
          totalSuccess += groupSuccess;
          totalFail += groupFail;
        }

      } catch (error) {
        console.error(`   ❌ 오류: ${error.message}`);
      }

      console.log('');
    }

    // 4. 결과 요약
    console.log('='.repeat(100));
    console.log('\n📊 집계 결과:');
    console.log(`   수신자 수 (DB): ${message.recipient_numbers?.length || 0}명`);
    console.log(`   그룹별 메시지 총합: ${totalFromGroups}건`);
    console.log(`   그룹별 성공 총합: ${totalSuccess}건`);
    console.log(`   그룹별 실패 총합: ${totalFail}건`);
    console.log(`   비율: ${message.recipient_numbers?.length ? (totalFromGroups / message.recipient_numbers.length).toFixed(2) : 0}배`);

    if (totalFromGroups === message.recipient_numbers?.length * 2) {
      console.log('\n⚠️ 그룹별 메시지 총합이 수신자 수의 정확히 2배입니다!');
      console.log('   원인: 각 수신자마다 2개의 메시지가 기록되어 있을 가능성');
      console.log('   - 같은 메시지가 2개의 그룹으로 나뉘어 발송되었고');
      console.log('   - 각 그룹의 메시지 목록에 모두 포함되어 있을 수 있습니다.');
    } else if (totalFromGroups > message.recipient_numbers?.length) {
      console.log(`\n⚠️ 그룹별 메시지 총합이 수신자 수보다 ${totalFromGroups - message.recipient_numbers.length}건 더 많습니다!`);
    } else {
      console.log('\n✅ 그룹별 메시지 총합이 정상 범위입니다.');
    }

  } catch (error) {
    console.error('❌ 오류 발생:', error);
  }
}

checkSolapiGroups148();












