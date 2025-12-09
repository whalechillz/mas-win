/**
 * 158번 메시지 발송 상태 확인
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Supabase 환경 변수가 설정되지 않았습니다.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkMessage158() {
  try {
    console.log('🔍 158번 메시지 상태 확인 중...\n');

    // 1. 메시지 기본 정보 확인
    const { data: message, error: messageError } = await supabase
      .from('channel_sms')
      .select('*')
      .eq('id', 158)
      .single();

    if (messageError) {
      console.error('❌ 메시지 조회 오류:', messageError);
      return;
    }

    if (!message) {
      console.error('❌ 158번 메시지를 찾을 수 없습니다.');
      return;
    }

    console.log('📋 메시지 기본 정보:');
    console.log(`   ID: ${message.id}`);
    console.log(`   상태: ${message.status}`);
    console.log(`   타입: ${message.message_type}`);
    console.log(`   이미지 URL: ${message.image_url || '(없음)'}`);
    console.log(`   수신자 수: ${message.recipient_numbers?.length || 0}명`);
    console.log(`   솔라피 그룹 ID: ${message.solapi_group_id || '(없음)'}`);
    console.log(`   생성일: ${message.created_at}`);
    console.log(`   업데이트일: ${message.updated_at}`);
    console.log(`   메모: ${message.note || '(없음)'}`);
    console.log('');

    // 2. 메시지 로그 확인
    const { data: logs, error: logsError } = await supabase
      .from('message_logs')
      .select('*')
      .eq('content_id', '158')
      .order('sent_at', { ascending: false })
      .limit(10);

    if (logsError) {
      console.error('❌ 메시지 로그 조회 오류:', logsError);
    } else {
      console.log(`📊 메시지 로그 (최근 ${logs.length}건):`);
      if (logs.length === 0) {
        console.log('   (로그가 없습니다)');
      } else {
        const statusCounts = {};
        logs.forEach(log => {
          const status = log.status || 'unknown';
          statusCounts[status] = (statusCounts[status] || 0) + 1;
        });
        console.log('   상태별 집계:', statusCounts);
        console.log('');
        console.log('   최근 로그 5건:');
        logs.slice(0, 5).forEach((log, idx) => {
          console.log(`   ${idx + 1}. ${log.status} - ${log.recipient_number} (${log.created_at})`);
        });
      }
      console.log('');
    }

    // 3. 발송 결과 분석
    if (message.solapi_group_id) {
      const groupIds = Array.isArray(message.solapi_group_id) 
        ? message.solapi_group_id 
        : [message.solapi_group_id];

      console.log(`📤 솔라피 그룹 ID (${groupIds.length}개):`);
      groupIds.forEach((groupId, idx) => {
        console.log(`   ${idx + 1}. ${groupId}`);
      });
      console.log('');

      // 로그에서 성공/실패 집계
      if (logs && logs.length > 0) {
        const successCount = logs.filter(l => l.status === 'success' || l.status === 'sent').length;
        const failCount = logs.filter(l => l.status === 'failed' || l.status === 'fail').length;
        const pendingCount = logs.filter(l => l.status === 'pending' || l.status === 'waiting').length;
        const totalCount = logs.length;

        console.log('📈 발송 결과 집계:');
        console.log(`   성공: ${successCount}건`);
        console.log(`   실패: ${failCount}건`);
        console.log(`   대기: ${pendingCount}건`);
        console.log(`   총: ${totalCount}건`);
        console.log('');

        if (failCount > 0) {
          console.log('❌ 실패한 로그:');
          logs
            .filter(l => l.status === 'failed' || l.status === 'fail')
            .slice(0, 5)
            .forEach((log, idx) => {
              console.log(`   ${idx + 1}. ${log.recipient_number} - ${log.error_message || log.status}`);
            });
        }
      }
    }

    // 4. 이미지 URL 분석
    if (message.image_url) {
      const isHttpUrl = /^https?:\/\//i.test(message.image_url);
      const isSolapiId = /^[A-Z0-9]+$/i.test(message.image_url) && message.image_url.length > 10;
      
      console.log('🖼️ 이미지 정보:');
      console.log(`   URL/ID: ${message.image_url}`);
      console.log(`   타입: ${isHttpUrl ? 'HTTP URL (Supabase)' : isSolapiId ? 'Solapi imageId' : '알 수 없음'}`);
      
      if (isHttpUrl) {
        console.log('   ⚠️ HTTP URL입니다. 발송 시 자동으로 Solapi에 재업로드됩니다.');
      } else if (isSolapiId) {
        console.log('   ✅ Solapi imageId입니다. 바로 사용 가능합니다.');
      }
      console.log('');
    }

    // 5. 상태 요약
    console.log('📌 상태 요약:');
    if (message.status === 'sent') {
      console.log('   ✅ 메시지가 발송 완료 상태입니다.');
    } else if (message.status === 'partial') {
      console.log('   ⚠️ 메시지가 부분 발송 상태입니다.');
    } else if (message.status === 'failed') {
      console.log('   ❌ 메시지가 실패 상태입니다.');
    } else if (message.status === 'draft') {
      console.log('   📝 메시지가 초안 상태입니다. 아직 발송되지 않았습니다.');
    } else {
      console.log(`   ❓ 알 수 없는 상태: ${message.status}`);
    }

  } catch (error) {
    console.error('❌ 오류 발생:', error);
  }
}

checkMessage158();

