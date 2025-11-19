const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const LOCAL_URL = process.env.LOCAL_URL || 'http://localhost:3000';
const GROUP_ID = 'G4V202511181317011LMZKTZGSYH56HC'; // 200명 발송된 메시지의 그룹 ID

// 내일 아침 10시 계산
function getTomorrow10AM() {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(10, 0, 0, 0);
  return tomorrow.toISOString();
}

// 전화번호 형식 변환 (하이픈 추가)
function formatPhoneNumber(phone) {
  const cleaned = phone.replace(/[-\s]/g, '');
  if (cleaned.length === 11) {
    return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 7)}-${cleaned.slice(7)}`;
  }
  return cleaned;
}

// 고객 DB에서 비구매자 목록 가져오기
async function getNonPurchasers() {
  console.log('🔍 고객 DB에서 비구매자 목록 가져오는 중...');
  
  let allNonPurchasers = [];
  let page = 1;
  const pageSize = 1000; // 한 번에 최대 1000개씩
  
  while (true) {
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    
    // 비구매자만: first_purchase_date와 last_purchase_date 모두 null
    const { data, error, count } = await supabase
      .from('customers')
      .select('phone', { count: 'exact' })
      .is('first_purchase_date', null) // 비구매자만
      .is('last_purchase_date', null) // 비구매자만
      .eq('opt_out', false) // 수신거부 아닌 고객만
      .not('phone', 'is', null) // 전화번호가 있는 고객만
      .range(from, to);
    
    if (error) {
      console.error('❌ 고객 조회 오류:', error);
      throw error;
    }
    
    if (data && data.length > 0) {
      allNonPurchasers = allNonPurchasers.concat(data.map(c => c.phone));
      console.log(`   페이지 ${page}: ${data.length}명 (총 ${allNonPurchasers.length}명)`);
      
      // 더 이상 데이터가 없으면 종료
      if (data.length < pageSize || allNonPurchasers.length >= (count || 0)) {
        break;
      }
      page++;
    } else {
      break;
    }
  }
  
  console.log(`✅ 비구매자 목록 조회 완료: 총 ${allNonPurchasers.length}명\n`);
  return allNonPurchasers;
}

async function createScheduledDraft() {
  console.log('🚀 비구매자 세그먼트 중 200명 제외한 예약 발송 초안 생성 시작...\n');

  // 1. 200명 발송된 메시지 찾기 (메시지 내용 가져오기 위해)
  console.log('🔍 200명 발송된 메시지 찾는 중...');
  const { data: sentMessage } = await supabase
    .from('channel_sms')
    .select('*')
    .eq('solapi_group_id', GROUP_ID)
    .single();

  if (!sentMessage) {
    console.error('❌ 200명 발송된 메시지를 찾을 수 없습니다.');
    process.exit(1);
  }

  console.log(`✅ 발송된 메시지 발견: ID=${sentMessage.id}`);
  console.log(`   발송된 수신자 수: ${sentMessage.recipient_numbers?.length || 0}명`);
  console.log(`   메시지 내용: ${(sentMessage.message_text || '').substring(0, 50)}...\n`);

  // 2. 발송된 번호 추출 (하이픈 제거하여 비교)
  const sentNumbers = new Set(
    (sentMessage.recipient_numbers || []).map(num => num.replace(/[-\s]/g, ''))
  );
  console.log(`📊 발송된 번호: ${sentNumbers.size}개\n`);

  // 3. 고객 DB에서 비구매자 목록 가져오기
  const allNonPurchasers = await getNonPurchasers();
  
  if (allNonPurchasers.length === 0) {
    console.error('❌ 비구매자 목록을 찾을 수 없습니다.');
    process.exit(1);
  }

  // 4. 비구매자 목록에서 발송된 번호 제외
  const allNonPurchaserNumbers = allNonPurchasers.map(num => num.replace(/[-\s]/g, ''));
  const remainingRecipients = allNonPurchaserNumbers.filter(num => !sentNumbers.has(num));

  console.log(`📊 결과:`);
  console.log(`   전체 비구매자: ${allNonPurchaserNumbers.length}명`);
  console.log(`   발송 완료: ${sentNumbers.size}명`);
  console.log(`   미발송: ${remainingRecipients.length}명\n`);

  if (remainingRecipients.length === 0) {
    console.log('✅ 모든 비구매자에게 발송이 완료되었습니다!');
    process.exit(0);
  }

  // 5. 하이픈 형식으로 변환
  const formattedRecipients = remainingRecipients.map(formatPhoneNumber);

  // 6. 내일 아침 10시 계산
  const scheduledAt = getTomorrow10AM();
  console.log(`📅 예약 발송 시간: ${new Date(scheduledAt).toLocaleString('ko-KR')}\n`);

  // 7. 새 초안 생성 (예약 발송 시간 포함)
  console.log('💾 예약 발송 초안 생성 중...');
  const response = await fetch(`${LOCAL_URL}/api/admin/sms`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: sentMessage.message_text || '',
      type: sentMessage.message_type || 'MMS',
      status: 'draft',
      calendar_id: sentMessage.calendar_id || null,
      recipientNumbers: formattedRecipients,
      imageUrl: sentMessage.image_url || null,
      shortLink: sentMessage.short_link || null,
      scheduledAt: scheduledAt // 예약 발송 시간 추가
    })
  });

  const result = await response.json();

  if (result.success) {
    console.log(`\n✅ 예약 발송 초안 생성 완료!`);
    console.log(`   새 메시지 ID: ${result.smsContent?.id || result.channelPostId}`);
    console.log(`   수신자 수: ${formattedRecipients.length}명`);
    console.log(`   예약 발송 시간: ${new Date(scheduledAt).toLocaleString('ko-KR')}`);
    console.log(`\n💡 다음 단계:`);
    console.log(`   SMS 편집 페이지: ${LOCAL_URL}/admin/sms?id=${result.smsContent?.id || result.channelPostId}`);
    console.log(`   예약 발송 확인 버튼만 클릭하시면 됩니다!`);
  } else {
    console.error('❌ 초안 생성 실패:', result.message);
    console.error('   응답:', JSON.stringify(result, null, 2));
    process.exit(1);
  }
}

createScheduledDraft();



const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const LOCAL_URL = process.env.LOCAL_URL || 'http://localhost:3000';
const GROUP_ID = 'G4V202511181317011LMZKTZGSYH56HC'; // 200명 발송된 메시지의 그룹 ID

// 내일 아침 10시 계산
function getTomorrow10AM() {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(10, 0, 0, 0);
  return tomorrow.toISOString();
}

// 전화번호 형식 변환 (하이픈 추가)
function formatPhoneNumber(phone) {
  const cleaned = phone.replace(/[-\s]/g, '');
  if (cleaned.length === 11) {
    return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 7)}-${cleaned.slice(7)}`;
  }
  return cleaned;
}

// 고객 DB에서 비구매자 목록 가져오기
async function getNonPurchasers() {
  console.log('🔍 고객 DB에서 비구매자 목록 가져오는 중...');
  
  let allNonPurchasers = [];
  let page = 1;
  const pageSize = 1000; // 한 번에 최대 1000개씩
  
  while (true) {
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    
    // 비구매자만: first_purchase_date와 last_purchase_date 모두 null
    const { data, error, count } = await supabase
      .from('customers')
      .select('phone', { count: 'exact' })
      .is('first_purchase_date', null) // 비구매자만
      .is('last_purchase_date', null) // 비구매자만
      .eq('opt_out', false) // 수신거부 아닌 고객만
      .not('phone', 'is', null) // 전화번호가 있는 고객만
      .range(from, to);
    
    if (error) {
      console.error('❌ 고객 조회 오류:', error);
      throw error;
    }
    
    if (data && data.length > 0) {
      allNonPurchasers = allNonPurchasers.concat(data.map(c => c.phone));
      console.log(`   페이지 ${page}: ${data.length}명 (총 ${allNonPurchasers.length}명)`);
      
      // 더 이상 데이터가 없으면 종료
      if (data.length < pageSize || allNonPurchasers.length >= (count || 0)) {
        break;
      }
      page++;
    } else {
      break;
    }
  }
  
  console.log(`✅ 비구매자 목록 조회 완료: 총 ${allNonPurchasers.length}명\n`);
  return allNonPurchasers;
}

async function createScheduledDraft() {
  console.log('🚀 비구매자 세그먼트 중 200명 제외한 예약 발송 초안 생성 시작...\n');

  // 1. 200명 발송된 메시지 찾기 (메시지 내용 가져오기 위해)
  console.log('🔍 200명 발송된 메시지 찾는 중...');
  const { data: sentMessage } = await supabase
    .from('channel_sms')
    .select('*')
    .eq('solapi_group_id', GROUP_ID)
    .single();

  if (!sentMessage) {
    console.error('❌ 200명 발송된 메시지를 찾을 수 없습니다.');
    process.exit(1);
  }

  console.log(`✅ 발송된 메시지 발견: ID=${sentMessage.id}`);
  console.log(`   발송된 수신자 수: ${sentMessage.recipient_numbers?.length || 0}명`);
  console.log(`   메시지 내용: ${(sentMessage.message_text || '').substring(0, 50)}...\n`);

  // 2. 발송된 번호 추출 (하이픈 제거하여 비교)
  const sentNumbers = new Set(
    (sentMessage.recipient_numbers || []).map(num => num.replace(/[-\s]/g, ''))
  );
  console.log(`📊 발송된 번호: ${sentNumbers.size}개\n`);

  // 3. 고객 DB에서 비구매자 목록 가져오기
  const allNonPurchasers = await getNonPurchasers();
  
  if (allNonPurchasers.length === 0) {
    console.error('❌ 비구매자 목록을 찾을 수 없습니다.');
    process.exit(1);
  }

  // 4. 비구매자 목록에서 발송된 번호 제외
  const allNonPurchaserNumbers = allNonPurchasers.map(num => num.replace(/[-\s]/g, ''));
  const remainingRecipients = allNonPurchaserNumbers.filter(num => !sentNumbers.has(num));

  console.log(`📊 결과:`);
  console.log(`   전체 비구매자: ${allNonPurchaserNumbers.length}명`);
  console.log(`   발송 완료: ${sentNumbers.size}명`);
  console.log(`   미발송: ${remainingRecipients.length}명\n`);

  if (remainingRecipients.length === 0) {
    console.log('✅ 모든 비구매자에게 발송이 완료되었습니다!');
    process.exit(0);
  }

  // 5. 하이픈 형식으로 변환
  const formattedRecipients = remainingRecipients.map(formatPhoneNumber);

  // 6. 내일 아침 10시 계산
  const scheduledAt = getTomorrow10AM();
  console.log(`📅 예약 발송 시간: ${new Date(scheduledAt).toLocaleString('ko-KR')}\n`);

  // 7. 새 초안 생성 (예약 발송 시간 포함)
  console.log('💾 예약 발송 초안 생성 중...');
  const response = await fetch(`${LOCAL_URL}/api/admin/sms`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: sentMessage.message_text || '',
      type: sentMessage.message_type || 'MMS',
      status: 'draft',
      calendar_id: sentMessage.calendar_id || null,
      recipientNumbers: formattedRecipients,
      imageUrl: sentMessage.image_url || null,
      shortLink: sentMessage.short_link || null,
      scheduledAt: scheduledAt // 예약 발송 시간 추가
    })
  });

  const result = await response.json();

  if (result.success) {
    console.log(`\n✅ 예약 발송 초안 생성 완료!`);
    console.log(`   새 메시지 ID: ${result.smsContent?.id || result.channelPostId}`);
    console.log(`   수신자 수: ${formattedRecipients.length}명`);
    console.log(`   예약 발송 시간: ${new Date(scheduledAt).toLocaleString('ko-KR')}`);
    console.log(`\n💡 다음 단계:`);
    console.log(`   SMS 편집 페이지: ${LOCAL_URL}/admin/sms?id=${result.smsContent?.id || result.channelPostId}`);
    console.log(`   예약 발송 확인 버튼만 클릭하시면 됩니다!`);
  } else {
    console.error('❌ 초안 생성 실패:', result.message);
    console.error('   응답:', JSON.stringify(result, null, 2));
    process.exit(1);
  }
}

createScheduledDraft();


const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const LOCAL_URL = process.env.LOCAL_URL || 'http://localhost:3000';
const GROUP_ID = 'G4V202511181317011LMZKTZGSYH56HC'; // 200명 발송된 메시지의 그룹 ID

// 내일 아침 10시 계산
function getTomorrow10AM() {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(10, 0, 0, 0);
  return tomorrow.toISOString();
}

// 전화번호 형식 변환 (하이픈 추가)
function formatPhoneNumber(phone) {
  const cleaned = phone.replace(/[-\s]/g, '');
  if (cleaned.length === 11) {
    return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 7)}-${cleaned.slice(7)}`;
  }
  return cleaned;
}

// 고객 DB에서 비구매자 목록 가져오기
async function getNonPurchasers() {
  console.log('🔍 고객 DB에서 비구매자 목록 가져오는 중...');
  
  let allNonPurchasers = [];
  let page = 1;
  const pageSize = 1000; // 한 번에 최대 1000개씩
  
  while (true) {
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    
    // 비구매자만: first_purchase_date와 last_purchase_date 모두 null
    const { data, error, count } = await supabase
      .from('customers')
      .select('phone', { count: 'exact' })
      .is('first_purchase_date', null) // 비구매자만
      .is('last_purchase_date', null) // 비구매자만
      .eq('opt_out', false) // 수신거부 아닌 고객만
      .not('phone', 'is', null) // 전화번호가 있는 고객만
      .range(from, to);
    
    if (error) {
      console.error('❌ 고객 조회 오류:', error);
      throw error;
    }
    
    if (data && data.length > 0) {
      allNonPurchasers = allNonPurchasers.concat(data.map(c => c.phone));
      console.log(`   페이지 ${page}: ${data.length}명 (총 ${allNonPurchasers.length}명)`);
      
      // 더 이상 데이터가 없으면 종료
      if (data.length < pageSize || allNonPurchasers.length >= (count || 0)) {
        break;
      }
      page++;
    } else {
      break;
    }
  }
  
  console.log(`✅ 비구매자 목록 조회 완료: 총 ${allNonPurchasers.length}명\n`);
  return allNonPurchasers;
}

async function createScheduledDraft() {
  console.log('🚀 비구매자 세그먼트 중 200명 제외한 예약 발송 초안 생성 시작...\n');

  // 1. 200명 발송된 메시지 찾기 (메시지 내용 가져오기 위해)
  console.log('🔍 200명 발송된 메시지 찾는 중...');
  const { data: sentMessage } = await supabase
    .from('channel_sms')
    .select('*')
    .eq('solapi_group_id', GROUP_ID)
    .single();

  if (!sentMessage) {
    console.error('❌ 200명 발송된 메시지를 찾을 수 없습니다.');
    process.exit(1);
  }

  console.log(`✅ 발송된 메시지 발견: ID=${sentMessage.id}`);
  console.log(`   발송된 수신자 수: ${sentMessage.recipient_numbers?.length || 0}명`);
  console.log(`   메시지 내용: ${(sentMessage.message_text || '').substring(0, 50)}...\n`);

  // 2. 발송된 번호 추출 (하이픈 제거하여 비교)
  const sentNumbers = new Set(
    (sentMessage.recipient_numbers || []).map(num => num.replace(/[-\s]/g, ''))
  );
  console.log(`📊 발송된 번호: ${sentNumbers.size}개\n`);

  // 3. 고객 DB에서 비구매자 목록 가져오기
  const allNonPurchasers = await getNonPurchasers();
  
  if (allNonPurchasers.length === 0) {
    console.error('❌ 비구매자 목록을 찾을 수 없습니다.');
    process.exit(1);
  }

  // 4. 비구매자 목록에서 발송된 번호 제외
  const allNonPurchaserNumbers = allNonPurchasers.map(num => num.replace(/[-\s]/g, ''));
  const remainingRecipients = allNonPurchaserNumbers.filter(num => !sentNumbers.has(num));

  console.log(`📊 결과:`);
  console.log(`   전체 비구매자: ${allNonPurchaserNumbers.length}명`);
  console.log(`   발송 완료: ${sentNumbers.size}명`);
  console.log(`   미발송: ${remainingRecipients.length}명\n`);

  if (remainingRecipients.length === 0) {
    console.log('✅ 모든 비구매자에게 발송이 완료되었습니다!');
    process.exit(0);
  }

  // 5. 하이픈 형식으로 변환
  const formattedRecipients = remainingRecipients.map(formatPhoneNumber);

  // 6. 내일 아침 10시 계산
  const scheduledAt = getTomorrow10AM();
  console.log(`📅 예약 발송 시간: ${new Date(scheduledAt).toLocaleString('ko-KR')}\n`);

  // 7. 새 초안 생성 (예약 발송 시간 포함)
  console.log('💾 예약 발송 초안 생성 중...');
  const response = await fetch(`${LOCAL_URL}/api/admin/sms`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: sentMessage.message_text || '',
      type: sentMessage.message_type || 'MMS',
      status: 'draft',
      calendar_id: sentMessage.calendar_id || null,
      recipientNumbers: formattedRecipients,
      imageUrl: sentMessage.image_url || null,
      shortLink: sentMessage.short_link || null,
      scheduledAt: scheduledAt // 예약 발송 시간 추가
    })
  });

  const result = await response.json();

  if (result.success) {
    console.log(`\n✅ 예약 발송 초안 생성 완료!`);
    console.log(`   새 메시지 ID: ${result.smsContent?.id || result.channelPostId}`);
    console.log(`   수신자 수: ${formattedRecipients.length}명`);
    console.log(`   예약 발송 시간: ${new Date(scheduledAt).toLocaleString('ko-KR')}`);
    console.log(`\n💡 다음 단계:`);
    console.log(`   SMS 편집 페이지: ${LOCAL_URL}/admin/sms?id=${result.smsContent?.id || result.channelPostId}`);
    console.log(`   예약 발송 확인 버튼만 클릭하시면 됩니다!`);
  } else {
    console.error('❌ 초안 생성 실패:', result.message);
    console.error('   응답:', JSON.stringify(result, null, 2));
    process.exit(1);
  }
}

createScheduledDraft();



const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const LOCAL_URL = process.env.LOCAL_URL || 'http://localhost:3000';
const GROUP_ID = 'G4V202511181317011LMZKTZGSYH56HC'; // 200명 발송된 메시지의 그룹 ID

// 내일 아침 10시 계산
function getTomorrow10AM() {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(10, 0, 0, 0);
  return tomorrow.toISOString();
}

// 전화번호 형식 변환 (하이픈 추가)
function formatPhoneNumber(phone) {
  const cleaned = phone.replace(/[-\s]/g, '');
  if (cleaned.length === 11) {
    return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 7)}-${cleaned.slice(7)}`;
  }
  return cleaned;
}

// 고객 DB에서 비구매자 목록 가져오기
async function getNonPurchasers() {
  console.log('🔍 고객 DB에서 비구매자 목록 가져오는 중...');
  
  let allNonPurchasers = [];
  let page = 1;
  const pageSize = 1000; // 한 번에 최대 1000개씩
  
  while (true) {
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    
    // 비구매자만: first_purchase_date와 last_purchase_date 모두 null
    const { data, error, count } = await supabase
      .from('customers')
      .select('phone', { count: 'exact' })
      .is('first_purchase_date', null) // 비구매자만
      .is('last_purchase_date', null) // 비구매자만
      .eq('opt_out', false) // 수신거부 아닌 고객만
      .not('phone', 'is', null) // 전화번호가 있는 고객만
      .range(from, to);
    
    if (error) {
      console.error('❌ 고객 조회 오류:', error);
      throw error;
    }
    
    if (data && data.length > 0) {
      allNonPurchasers = allNonPurchasers.concat(data.map(c => c.phone));
      console.log(`   페이지 ${page}: ${data.length}명 (총 ${allNonPurchasers.length}명)`);
      
      // 더 이상 데이터가 없으면 종료
      if (data.length < pageSize || allNonPurchasers.length >= (count || 0)) {
        break;
      }
      page++;
    } else {
      break;
    }
  }
  
  console.log(`✅ 비구매자 목록 조회 완료: 총 ${allNonPurchasers.length}명\n`);
  return allNonPurchasers;
}

async function createScheduledDraft() {
  console.log('🚀 비구매자 세그먼트 중 200명 제외한 예약 발송 초안 생성 시작...\n');

  // 1. 200명 발송된 메시지 찾기 (메시지 내용 가져오기 위해)
  console.log('🔍 200명 발송된 메시지 찾는 중...');
  const { data: sentMessage } = await supabase
    .from('channel_sms')
    .select('*')
    .eq('solapi_group_id', GROUP_ID)
    .single();

  if (!sentMessage) {
    console.error('❌ 200명 발송된 메시지를 찾을 수 없습니다.');
    process.exit(1);
  }

  console.log(`✅ 발송된 메시지 발견: ID=${sentMessage.id}`);
  console.log(`   발송된 수신자 수: ${sentMessage.recipient_numbers?.length || 0}명`);
  console.log(`   메시지 내용: ${(sentMessage.message_text || '').substring(0, 50)}...\n`);

  // 2. 발송된 번호 추출 (하이픈 제거하여 비교)
  const sentNumbers = new Set(
    (sentMessage.recipient_numbers || []).map(num => num.replace(/[-\s]/g, ''))
  );
  console.log(`📊 발송된 번호: ${sentNumbers.size}개\n`);

  // 3. 고객 DB에서 비구매자 목록 가져오기
  const allNonPurchasers = await getNonPurchasers();
  
  if (allNonPurchasers.length === 0) {
    console.error('❌ 비구매자 목록을 찾을 수 없습니다.');
    process.exit(1);
  }

  // 4. 비구매자 목록에서 발송된 번호 제외
  const allNonPurchaserNumbers = allNonPurchasers.map(num => num.replace(/[-\s]/g, ''));
  const remainingRecipients = allNonPurchaserNumbers.filter(num => !sentNumbers.has(num));

  console.log(`📊 결과:`);
  console.log(`   전체 비구매자: ${allNonPurchaserNumbers.length}명`);
  console.log(`   발송 완료: ${sentNumbers.size}명`);
  console.log(`   미발송: ${remainingRecipients.length}명\n`);

  if (remainingRecipients.length === 0) {
    console.log('✅ 모든 비구매자에게 발송이 완료되었습니다!');
    process.exit(0);
  }

  // 5. 하이픈 형식으로 변환
  const formattedRecipients = remainingRecipients.map(formatPhoneNumber);

  // 6. 내일 아침 10시 계산
  const scheduledAt = getTomorrow10AM();
  console.log(`📅 예약 발송 시간: ${new Date(scheduledAt).toLocaleString('ko-KR')}\n`);

  // 7. 새 초안 생성 (예약 발송 시간 포함)
  console.log('💾 예약 발송 초안 생성 중...');
  const response = await fetch(`${LOCAL_URL}/api/admin/sms`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: sentMessage.message_text || '',
      type: sentMessage.message_type || 'MMS',
      status: 'draft',
      calendar_id: sentMessage.calendar_id || null,
      recipientNumbers: formattedRecipients,
      imageUrl: sentMessage.image_url || null,
      shortLink: sentMessage.short_link || null,
      scheduledAt: scheduledAt // 예약 발송 시간 추가
    })
  });

  const result = await response.json();

  if (result.success) {
    console.log(`\n✅ 예약 발송 초안 생성 완료!`);
    console.log(`   새 메시지 ID: ${result.smsContent?.id || result.channelPostId}`);
    console.log(`   수신자 수: ${formattedRecipients.length}명`);
    console.log(`   예약 발송 시간: ${new Date(scheduledAt).toLocaleString('ko-KR')}`);
    console.log(`\n💡 다음 단계:`);
    console.log(`   SMS 편집 페이지: ${LOCAL_URL}/admin/sms?id=${result.smsContent?.id || result.channelPostId}`);
    console.log(`   예약 발송 확인 버튼만 클릭하시면 됩니다!`);
  } else {
    console.error('❌ 초안 생성 실패:', result.message);
    console.error('   응답:', JSON.stringify(result, null, 2));
    process.exit(1);
  }
}

createScheduledDraft();

