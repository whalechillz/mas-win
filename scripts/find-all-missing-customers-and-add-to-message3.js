/**
 * 모든 누락된 고객을 찾아서 메시지 3에 추가
 * 
 * 문제:
 * - 전체 고객: 2,990명
 * - 수신거부: 3명
 * - 전화번호 없음: 0명
 * - 예상 발송 가능: 2,987명
 * - 현재 메시지 발송 대상: 1,593명
 * - 누락: 약 1,394명
 * 
 * 해결:
 * - 모든 발송 가능 고객을 조회 (제한 없이)
 * - 메시지 1, 2에 포함되지 않은 모든 고객을 메시지 3에 추가
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

async function getAllSendableCustomers() {
  console.log('🔍 전체 발송 가능 고객 조회 중 (제한 없이)...\n');
  
  let allCustomers = [];
  let offset = 0;
  const limit = 1000;
  let hasMore = true;

  while (hasMore) {
    const { data: batch, error } = await supabase
      .from('customers')
      .select('id, name, phone, address')
      .eq('opt_out', false)
      .not('phone', 'is', null)
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('❌ 고객 조회 오류:', error);
      throw error;
    }

    if (batch && batch.length > 0) {
      allCustomers = allCustomers.concat(batch);
      offset += limit;
      hasMore = batch.length === limit;
      console.log(`   조회 중... ${allCustomers.length}명`);
    } else {
      hasMore = false;
    }
  }

  console.log(`✅ 전체 발송 가능 고객: ${allCustomers.length}명\n`);
  return allCustomers;
}

async function getMessage12CustomerIds() {
  console.log('🔍 메시지 1, 2 대상 고객 ID 수집 중...\n');
  
  let allWithDistance = [];
  let offset = 0;
  const limit = 1000;
  let hasMore = true;

  while (hasMore) {
    const { data: batch, error } = await supabase
      .from('customer_address_cache')
      .select('customer_id')
      .eq('geocoding_status', 'success')
      .not('distance_km', 'is', null)
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('❌ 거리 정보 조회 오류:', error);
      throw error;
    }

    if (batch && batch.length > 0) {
      allWithDistance = allWithDistance.concat(batch);
      offset += limit;
      hasMore = batch.length === limit;
    } else {
      hasMore = false;
    }
  }

  const withDistanceIds = new Set(allWithDistance.map(c => c.customer_id));
  console.log(`✅ 거리 정보 있는 고객: ${withDistanceIds.size}명\n`);
  
  return withDistanceIds;
}

async function getExistingMessage3Recipients() {
  console.log('🔍 기존 메시지 3 수신자 수집 중...\n');
  
  const messageIds = [472, 473, 474, 475];
  const allRecipients = new Set();

  for (const messageId of messageIds) {
    const { data: message, error } = await supabase
      .from('channel_sms')
      .select('recipient_numbers')
      .eq('id', messageId)
      .single();

    if (!error && message && message.recipient_numbers) {
      message.recipient_numbers.forEach(phone => {
        // 전화번호 정규화 (하이픈 제거)
        const normalized = phone.replace(/[^0-9]/g, '');
        if (normalized.length >= 10) {
          allRecipients.add(normalized);
        }
      });
    }
  }

  console.log(`✅ 기존 메시지 3 수신자: ${allRecipients.size}명\n`);
  return allRecipients;
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
      note: `${messageCategory} - ${messageSubcategory} (200명씩 청크: ${i + 1}/${chunks.length}, 누락 고객 포함)`,
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
  console.log('🚀 누락된 모든 고객 찾기 및 메시지 3에 추가\n');
  console.log('='.repeat(60));

  try {
    // 1. 전체 발송 가능 고객 조회 (제한 없이)
    console.log('📋 1단계: 전체 발송 가능 고객 조회');
    console.log('-'.repeat(60));
    const allCustomers = await getAllSendableCustomers();

    // 2. 메시지 1, 2 대상 고객 ID 수집
    console.log('📋 2단계: 메시지 1, 2 대상 고객 ID 수집');
    console.log('-'.repeat(60));
    const message12Ids = await getMessage12CustomerIds();

    // 3. 기존 메시지 3 수신자 수집
    console.log('📋 3단계: 기존 메시지 3 수신자 수집');
    console.log('-'.repeat(60));
    const existingMessage3Recipients = await getExistingMessage3Recipients();

    // 4. 누락된 고객 찾기
    console.log('📋 4단계: 누락된 고객 찾기');
    console.log('-'.repeat(60));
    
    // 전화번호 정규화 함수
    const normalizePhone = (phone) => {
      if (!phone) return null;
      return phone.replace(/[^0-9]/g, '');
    };

    // 메시지 1, 2에 포함되지 않은 고객
    const missingCustomers = allCustomers.filter(customer => {
      // 메시지 1, 2에 포함되지 않음
      const notInMessage12 = !message12Ids.has(customer.id);
      
      // 기존 메시지 3에도 포함되지 않음
      const normalizedPhone = normalizePhone(customer.phone);
      const notInMessage3 = !existingMessage3Recipients.has(normalizedPhone);
      
      return notInMessage12 && notInMessage3;
    });

    console.log(`✅ 누락된 고객: ${missingCustomers.length}명\n`);

    if (missingCustomers.length === 0) {
      console.log('✅ 모든 고객이 이미 메시지에 포함되어 있습니다!\n');
      return;
    }

    // 5. 새로운 메시지 3 청크 생성
    console.log('📋 5단계: 누락된 고객을 위한 새로운 메시지 3 청크 생성');
    console.log('-'.repeat(60));
    const newChunks = await createMessageChunks(
      missingCustomers,
      MESSAGE_3_TEMPLATE,
      'titanium-shaft-sita',
      'no-address-customers-missing'
    );

    // 6. 최종 요약
    console.log('='.repeat(60));
    console.log('🎉 누락 고객 추가 완료!');
    console.log('='.repeat(60));
    console.log(`\n📊 최종 요약:`);
    console.log(`   전체 발송 가능 고객: ${allCustomers.length}명`);
    console.log(`   메시지 1, 2 대상: ${message12Ids.size}명`);
    console.log(`   기존 메시지 3 수신자: ${existingMessage3Recipients.size}명`);
    console.log(`   누락된 고객: ${missingCustomers.length}명`);
    console.log(`   새로 생성된 청크: ${newChunks.length}개`);
    
    if (newChunks.length > 0) {
      console.log(`\n📋 새로 생성된 메시지:`);
      newChunks.forEach(chunk => {
        console.log(`   - 메시지 ID ${chunk.messageId}: ${chunk.recipientCount}명`);
      });
    }

    const totalInMessages = message12Ids.size + existingMessage3Recipients.size + missingCustomers.length;
    console.log(`\n📊 전체 메시지 발송 대상:`);
    console.log(`   메시지 1, 2: ${message12Ids.size}명`);
    console.log(`   메시지 3 (기존 + 신규): ${existingMessage3Recipients.size + missingCustomers.length}명`);
    console.log(`   ─────────────────────────────`);
    console.log(`   총 발송 대상: ${totalInMessages}명\n`);

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
