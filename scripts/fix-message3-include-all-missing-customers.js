/**
 * 메시지 3에 제외된 모든 고객 포함하도록 수정
 * 
 * 기존 메시지 3 청크 (466, 467, 468, 469) 삭제
 * * 모든 제외된 고객을 포함한 새로운 메시지 3 청크 생성
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Supabase 환경 변수가 설정되지 않았습니다.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// 메시지 템플릿
const MESSAGE_3_TEMPLATE = `마쓰구 티타늄 샤프트 신제품 시타 예약이 가능합니다! 🎯

▶ 시타 예약: https://www.masgolf.co.kr/try-a-massgoo
▶ 온라인 구매: https://smartstore.naver.com/mas9golf
☎ 무료 상담: 080-028-8888`;

async function getAllExcludedCustomers() {
  console.log('🔍 제외된 모든 고객 조회 중...\n');
  
  // 1. 전체 발송 가능 고객 (opt_out=false, phone 있음)
  const { data: allCustomers, error: allError } = await supabase
    .from('customers')
    .select('id, name, phone, address')
    .eq('opt_out', false)
    .not('phone', 'is', null);

  if (allError) {
    console.error('❌ 전체 고객 조회 오류:', allError);
    throw allError;
  }

  console.log(`✅ 전체 발송 가능 고객: ${allCustomers.length}명`);

  // 2. 거리 정보가 있는 고객 ID (메시지 1, 2 대상)
  const { data: withDistance, error: distanceError } = await supabase
    .from('customer_address_cache')
    .select('customer_id')
    .eq('geocoding_status', 'success')
    .not('distance_km', 'is', null);

  if (distanceError) {
    console.error('❌ 거리 정보 조회 오류:', distanceError);
    throw distanceError;
  }

  const withDistanceIds = new Set((withDistance || []).map(c => c.customer_id));
  console.log(`✅ 거리 정보 있는 고객: ${withDistanceIds.size}명`);

  // 3. 제외된 고객 = 전체 발송 가능 고객 중 거리 정보가 없는 고객
  const excludedCustomers = (allCustomers || []).filter(customer => {
    return !withDistanceIds.has(customer.id);
  });

  console.log(`✅ 제외된 고객: ${excludedCustomers.length}명\n`);

  return excludedCustomers.map(c => ({
    id: c.id,
    name: c.name,
    phone: c.phone,
    distance_km: null,
    province: null
  }));
}

async function deleteExistingMessage3Chunks() {
  console.log('🗑️ 기존 메시지 3 청크 삭제 중...');
  
  const messageIds = [466, 467, 468, 469];
  let deletedCount = 0;

  for (const messageId of messageIds) {
    const { error: deleteError } = await supabase
      .from('channel_sms')
      .delete()
      .eq('id', messageId);

    if (deleteError) {
      console.warn(`⚠️ 메시지 ${messageId} 삭제 실패: ${deleteError.message}`);
    } else {
      console.log(`✅ 메시지 ${messageId} 삭제 완료`);
      deletedCount++;
    }
  }

  console.log(`✅ 총 ${deletedCount}개 메시지 삭제 완료\n`);
}

async function createMessageChunks(customers, messageText, messageCategory, messageSubcategory) {
  const CHUNK_SIZE = 200;
  const chunks = [];
  
  for (let i = 0; i < customers.length; i += CHUNK_SIZE) {
    chunks.push(customers.slice(i, i + CHUNK_SIZE));
  }

  console.log(`📊 청크 분할: ${chunks.length}개 청크 (각 ${CHUNK_SIZE}명씩)`);
  chunks.forEach((chunk, idx) => {
    console.log(`   청크 ${idx + 1}: ${chunk.length}명`);
  });
  console.log('');

  const createdMessages = [];

  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    const phoneNumbers = chunk
      .map(c => c.phone)
      .filter(phone => phone && phone.trim().length > 0);

    if (phoneNumbers.length === 0) {
      console.log(`⚠️ 청크 ${i + 1}: 전화번호가 없어 건너뜁니다.`);
      continue;
    }

    console.log(`📝 청크 ${i + 1}/${chunks.length} 메시지 생성 중... (${phoneNumbers.length}명)`);

    const newMessage = {
      message_text: messageText,
      message_type: 'MMS',
      status: 'draft',
      recipient_numbers: phoneNumbers,
      sent_count: phoneNumbers.length,
      message_category: messageCategory,
      message_subcategory: messageSubcategory,
      note: `${messageCategory} - ${messageSubcategory} (200명씩 청크: ${i + 1}/${chunks.length}, 모든 제외 고객 포함)`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data: createdMessage, error: createError } = await supabase
      .from('channel_sms')
      .insert(newMessage)
      .select()
      .single();

    if (createError) {
      console.error(`❌ 청크 ${i + 1} 메시지 생성 실패:`, createError.message);
      continue;
    }

    console.log(`✅ 청크 ${i + 1} 메시지 생성 완료 (ID: ${createdMessage.id}, ${phoneNumbers.length}명)`);
    createdMessages.push({
      chunk: i + 1,
      messageId: createdMessage.id,
      recipientCount: phoneNumbers.length
    });
  }

  return createdMessages;
}

async function main() {
  console.log('🚀 메시지 3 재생성 (모든 제외 고객 포함) 시작...\n');
  console.log('='.repeat(60));

  try {
    // 1. 기존 메시지 3 청크 삭제
    console.log('📋 1단계: 기존 메시지 3 청크 삭제');
    console.log('-'.repeat(60));
    await deleteExistingMessage3Chunks();

    // 2. 제외된 모든 고객 조회
    console.log('📋 2단계: 제외된 모든 고객 조회');
    console.log('-'.repeat(60));
    const excludedCustomers = await getAllExcludedCustomers();

    if (excludedCustomers.length === 0) {
      console.log('⚠️ 제외된 고객이 없습니다.');
      return;
    }

    // 3. 새로운 메시지 3 청크 생성
    console.log('📋 3단계: 새로운 메시지 3 청크 생성');
    console.log('-'.repeat(60));
    const message3Chunks = await createMessageChunks(
      excludedCustomers,
      MESSAGE_3_TEMPLATE,
      'titanium-shaft-sita',
      'no-address-customers-all'
    );

    // 4. 최종 요약
    console.log('='.repeat(60));
    console.log('🎉 메시지 3 재생성 완료!');
    console.log('='.repeat(60));
    console.log(`\n📊 생성 요약:`);
    console.log(`   제외된 고객: ${excludedCustomers.length}명`);
    console.log(`   생성된 청크: ${message3Chunks.length}개`);
    message3Chunks.forEach(chunk => {
      console.log(`   - 메시지 ID ${chunk.messageId}: ${chunk.recipientCount}명`);
    });
    console.log('');

    // 5. 전체 메시지 발송 대상 요약
    console.log('📋 전체 메시지 발송 대상 요약:');
    console.log(`   메시지 1 (50km 이내): 477명 → 3개 청크 (457, 459, 460)`);
    console.log(`   메시지 2 (50km 이상): 493명 → 3개 청크 (463, 464, 465)`);
    console.log(`   메시지 3 (주소 없음): ${excludedCustomers.length}명 → ${message3Chunks.length}개 청크`);
    const totalTargets = 477 + 493 + excludedCustomers.length;
    console.log(`   ─────────────────────────────`);
    console.log(`   총 발송 대상: ${totalTargets}명\n`);

    console.log('💡 다음 단계:');
    console.log('   1. 관리자 페이지에서 각 메시지 확인: /admin/sms-list');
    console.log('   2. 각 메시지에 이미지 연결');
    console.log('   3. 순차적으로 발송 실행\n');

  } catch (error) {
    console.error('❌ 오류:', error);
    process.exit(1);
  }
}

main()
  .then(() => {
    console.log('✅ 모든 작업 완료!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ 오류:', error);
    process.exit(1);
  });
