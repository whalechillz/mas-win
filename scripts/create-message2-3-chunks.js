/**
 * 메시지 2 (50km 이상) 및 메시지 3 (주소 없음) 200명씩 청크 생성 스크립트
 * 
 * 작업:
 * 1. 메시지 2: 50km 이상 고객 조회 및 200명씩 청크 생성
 * 2. 메시지 3: 주소 없음 고객 조회 및 200명씩 청크 생성
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

// 이미지 경로 (이미지 2)
const IMAGE_PATH = 'originals/daily-branding/kakao/2026-01-12/account1/profile/nanobanana-variation-1768840431601-5l9vdx.webp';

// 메시지 템플릿
const MESSAGE_2_TEMPLATE = `마쓰구 티타늄 샤프트 신제품 온라인 구매 가능합니다! 🎯

▶ 온라인 구매: https://smartstore.naver.com/mas9golf
☎ 무료 상담: 080-028-8888`;

const MESSAGE_3_TEMPLATE = `마쓰구 티타늄 샤프트 신제품 시타 예약이 가능합니다! 🎯

▶ 시타 예약: https://www.masgolf.co.kr/try-a-massgoo
▶ 온라인 구매: https://smartstore.naver.com/mas9golf
☎ 무료 상담: 080-028-8888`;

async function getCustomers50kmPlus() {
  console.log('🔍 50km 이상 고객 조회 중...');
  
  // customer_address_cache에서 50km 이상 고객 조회
  const { data: cacheData, error: cacheError } = await supabase
    .from('customer_address_cache')
    .select(`
      customer_id,
      distance_km,
      province,
      customers!inner (
        id,
        name,
        phone,
        address,
        opt_out
      )
    `)
    .eq('geocoding_status', 'success')
    .not('distance_km', 'is', null)
    .gt('distance_km', 50)
    .eq('customers.opt_out', false)
    .not('customers.phone', 'is', null)
    .order('distance_km', { ascending: true });

  if (cacheError) {
    console.error('❌ 거리 정보 조회 오류:', cacheError);
    throw cacheError;
  }

  // 중복 제거 (같은 고객이 여러 주소로 등록된 경우)
  const customerMap = new Map();
  
  for (const cache of cacheData || []) {
    const customerId = cache.customer_id;
    if (!customerMap.has(customerId)) {
      customerMap.set(customerId, {
        id: cache.customers.id,
        name: cache.customers.name,
        phone: cache.customers.phone,
        distance_km: cache.distance_km,
        province: cache.province
      });
    }
  }
  
  const customers = Array.from(customerMap.values());
  console.log(`✅ 50km 이상 고객: ${customers.length}명\n`);
  
  return customers;
}

async function getCustomersNoAddress() {
  console.log('🔍 주소 없음 고객 조회 중...');
  
  // 주소가 없거나 거리 정보가 없는 고객 조회
  // 방법 1: customer_address_cache에 없는 고객
  // 방법 2: 주소가 null이거나 빈 문자열인 고객
  
  // 먼저 모든 활성 고객 조회
  const { data: allCustomers, error: allError } = await supabase
    .from('customers')
    .select('id, name, phone, address, opt_out')
    .eq('opt_out', false)
    .not('phone', 'is', null);

  if (allError) {
    console.error('❌ 고객 조회 오류:', allError);
    throw allError;
  }

  // customer_address_cache에 거리 정보가 있는 고객 ID 조회
  const { data: customersWithDistance, error: distanceError } = await supabase
    .from('customer_address_cache')
    .select('customer_id')
    .eq('geocoding_status', 'success')
    .not('distance_km', 'is', null);

  if (distanceError) {
    console.error('❌ 거리 정보 조회 오류:', distanceError);
    throw distanceError;
  }

  const customersWithDistanceIds = new Set(
    (customersWithDistance || []).map(c => c.customer_id)
  );

  // 주소가 없거나 거리 정보가 없는 고객 필터링
  const customersNoAddress = (allCustomers || []).filter(customer => {
    // 주소가 없거나 빈 문자열
    const hasNoAddress = !customer.address || customer.address.trim() === '';
    // 거리 정보가 없음
    const hasNoDistance = !customersWithDistanceIds.has(customer.id);
    
    return hasNoAddress || hasNoDistance;
  });

  console.log(`✅ 주소 없음 고객: ${customersNoAddress.length}명\n`);
  
  return customersNoAddress.map(c => ({
    id: c.id,
    name: c.name,
    phone: c.phone,
    distance_km: null,
    province: null
  }));
}

async function createMessageChunks(customers, messageText, messageCategory, messageSubcategory, imagePath) {
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
      note: `${messageCategory} - ${messageSubcategory} (200명씩 청크: ${i + 1}/${chunks.length})`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    // 이미지 URL 설정 (나중에 업로드할 수 있도록 경로만 저장)
    if (imagePath) {
      // 이미지 URL은 나중에 업로드 후 설정
      // newMessage.image_url = imagePath;
    }

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
  console.log('🚀 메시지 2, 3 청크 생성 시작...\n');
  console.log('='.repeat(60));

  try {
    // 1. 메시지 2: 50km 이상 고객
    console.log('📋 1단계: 메시지 2 (50km 이상) 청크 생성');
    console.log('-'.repeat(60));
    const customers50kmPlus = await getCustomers50kmPlus();

    if (customers50kmPlus.length === 0) {
      console.log('⚠️ 50km 이상 고객이 없습니다.\n');
    } else {
      const message2Chunks = await createMessageChunks(
        customers50kmPlus,
        MESSAGE_2_TEMPLATE,
        'titanium-shaft-sita',
        'far-customers-50km-plus',
        IMAGE_PATH
      );

      console.log(`✅ 메시지 2 청크 생성 완료: ${message2Chunks.length}개`);
      message2Chunks.forEach(chunk => {
        console.log(`   - 메시지 ID ${chunk.messageId}: ${chunk.recipientCount}명`);
      });
      console.log('');
    }

    // 2. 메시지 3: 주소 없음 고객
    console.log('📋 2단계: 메시지 3 (주소 없음) 청크 생성');
    console.log('-'.repeat(60));
    const customersNoAddress = await getCustomersNoAddress();

    if (customersNoAddress.length === 0) {
      console.log('⚠️ 주소 없음 고객이 없습니다.\n');
    } else {
      const message3Chunks = await createMessageChunks(
        customersNoAddress,
        MESSAGE_3_TEMPLATE,
        'titanium-shaft-sita',
        'no-address-customers',
        IMAGE_PATH
      );

      console.log(`✅ 메시지 3 청크 생성 완료: ${message3Chunks.length}개`);
      message3Chunks.forEach(chunk => {
        console.log(`   - 메시지 ID ${chunk.messageId}: ${chunk.recipientCount}명`);
      });
      console.log('');
    }

    // 3. 최종 요약
    console.log('='.repeat(60));
    console.log('🎉 모든 청크 생성 완료!');
    console.log('='.repeat(60));
    console.log(`\n📊 생성 요약:`);
    console.log(`   메시지 2 (50km 이상): ${customers50kmPlus.length}명`);
    console.log(`   메시지 3 (주소 없음): ${customersNoAddress.length}명`);
    console.log(`   총 고객: ${customers50kmPlus.length + customersNoAddress.length}명\n`);

    console.log('💡 다음 단계:');
    console.log('   1. 관리자 페이지에서 각 메시지 확인: /admin/sms-list');
    console.log('   2. 각 메시지에 이미지 연결 (이미지 2)');
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
