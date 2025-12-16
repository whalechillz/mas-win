/**
 * 예약-고객 일괄 연결 스크립트
 *
 * 목표:
 * - customer_profile_id가 null인 예약들을 phone 기준으로 고객과 자동 연결
 * - 고객 정보가 있는 예약만 연결 (고객이 없으면 스킵)
 *
 * 사용법:
 *   node scripts/link-all-bookings-to-customers.js --dry-run   // 변경 없이 리포트만
 *   node scripts/link-all-bookings-to-customers.js --apply     // 실제 DB 반영
 */

const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Supabase 환경 변수가 설정되지 않았습니다.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// 전화번호 정규화 (sync-bookings-and-customers.js와 동일)
function normalizePhone(phone) {
  if (!phone) return null;
  let cleaned = phone.toString().replace(/[\s\-+(),]/g, '');

  if (cleaned.startsWith('82')) {
    cleaned = '0' + cleaned.substring(2);
  }

  if (cleaned.startsWith('01') && cleaned.length === 10) {
    cleaned = '010' + cleaned.substring(2);
  }

  if (cleaned.startsWith('10') && cleaned.length === 10) {
    cleaned = '0' + cleaned;
  }

  if (!/^010\d{8}$/.test(cleaned)) {
    return null;
  }

  return cleaned;
}

async function loadAll(table) {
  const pageSize = 1000;
  let from = 0;
  let hasMore = true;
  const all = [];

  while (hasMore) {
    const { data, error } = await supabase
      .from(table)
      .select('*')
      .range(from, from + pageSize - 1);

    if (error) {
      console.error(`❌ ${table} 로드 오류:`, error);
      break;
    }

    if (data && data.length > 0) {
      all.push(...data);
      from += pageSize;
      hasMore = data.length === pageSize;
    } else {
      hasMore = false;
    }
  }

  return all;
}

async function linkAllBookingsToCustomers() {
  const apply = process.argv.includes('--apply');

  console.log('🔗 예약-고객 일괄 연결 시작...');
  console.log(apply ? '⚠️  실제 DB 반영 모드입니다.\n' : '⚠️  DRY RUN 모드: 변경 없이 리포트만 생성합니다.\n');

  console.log('📥 고객 데이터 로드 중...');
  const allCustomers = await loadAll('customers');
  console.log(`✅ customers: ${allCustomers.length}건 로드`);

  console.log('📥 예약 데이터 로드 중...');
  const allBookings = await loadAll('bookings');
  console.log(`✅ bookings: ${allBookings.length}건 로드\n`);

  // phone 기준으로 고객 인덱스 생성
  const customerByPhone = new Map();
  for (const c of allCustomers) {
    if (!c.phone) continue;
    const normalized = normalizePhone(c.phone);
    if (!normalized) continue;
    
    // 동일 phone에 여러 고객이 있으면 첫 번째 것만 사용
    if (!customerByPhone.has(normalized)) {
      customerByPhone.set(normalized, c);
    }
  }

  // customer_profile_id가 null인 예약 찾기
  const unlinkedBookings = allBookings.filter(b => 
    !b.customer_profile_id || b.customer_profile_id === null
  );

  console.log(`📊 customer_profile_id가 null인 예약: ${unlinkedBookings.length}건\n`);

  const toLink = [];
  const skipped = {
    noPhone: [],
    invalidPhone: [],
    noCustomer: [],
  };

  for (const booking of unlinkedBookings) {
    if (!booking.phone || !booking.phone.toString().trim()) {
      skipped.noPhone.push({
        id: booking.id,
        name: booking.name,
        date: booking.date,
        reason: '전화번호 없음',
      });
      continue;
    }

    const normalized = normalizePhone(booking.phone);
    if (!normalized) {
      skipped.invalidPhone.push({
        id: booking.id,
        name: booking.name,
        rawPhone: booking.phone,
        date: booking.date,
        reason: '유효하지 않은 전화번호',
      });
      continue;
    }

    const customer = customerByPhone.get(normalized);
    if (!customer) {
      skipped.noCustomer.push({
        id: booking.id,
        name: booking.name,
        phone: normalized,
        date: booking.date,
        reason: '고객 정보 없음',
      });
      continue;
    }

    toLink.push({
      bookingId: booking.id,
      bookingName: booking.name,
      phone: normalized,
      customerId: customer.id,
      customerName: customer.name,
      date: booking.date,
    });
  }

  console.log('📊 연결 가능한 예약 요약:\n');
  console.log(`✅ 연결 가능: ${toLink.length}건`);
  console.log(`⚠️  전화번호 없음: ${skipped.noPhone.length}건`);
  console.log(`⚠️  유효하지 않은 전화번호: ${skipped.invalidPhone.length}건`);
  console.log(`⚠️  고객 정보 없음: ${skipped.noCustomer.length}건\n`);

  if (toLink.length > 0) {
    console.log('🔍 연결 가능한 예약 샘플 (최대 10건):');
    toLink.slice(0, 10).forEach((item, i) => {
      console.log(`   ${i + 1}. 예약 ID: ${item.bookingId} (${item.bookingName}) → 고객 ID: ${item.customerId} (${item.customerName})`);
    });
    console.log('');
  }

  if (skipped.noCustomer.length > 0) {
    console.log('⚠️  고객 정보 없는 예약 샘플 (최대 5건):');
    skipped.noCustomer.slice(0, 5).forEach((item, i) => {
      console.log(`   ${i + 1}. 예약 ID: ${item.id} (${item.name}), 전화: ${item.phone}, 날짜: ${item.date}`);
    });
    console.log('');
  }

  if (!apply) {
    console.log('💡 --apply 옵션 없이 실행했으므로, 여기까지는 리포트만 생성했습니다.');
    console.log('   내용이 기대와 일치하면 다음 명령으로 실제 반영을 수행하세요:');
    console.log('   node scripts/link-all-bookings-to-customers.js --apply\n');
    return;
  }

  console.log('⚠️  실제 DB 반영을 시작합니다...\n');

  if (toLink.length === 0) {
    console.log('✅ 연결할 예약이 없습니다.\n');
    return;
  }

  console.log(`🔗 예약 ${toLink.length}건 연결 중...`);
  let successCount = 0;
  let failCount = 0;

  const chunkSize = 100;
  for (let i = 0; i < toLink.length; i += chunkSize) {
    const chunk = toLink.slice(i, i + chunkSize);
    
    for (const item of chunk) {
      const bookingId = typeof item.bookingId === 'number' ? item.bookingId : parseInt(String(item.bookingId));
      const { error } = await supabase
        .from('bookings')
        .update({ customer_profile_id: item.customerId })
        .eq('id', bookingId);

      if (error) {
        console.error(`❌ 예약 ${item.bookingId} 연결 실패:`, error.message);
        failCount++;
      } else {
        successCount++;
      }
    }

    if ((i + chunkSize) % 500 === 0 || i + chunkSize >= toLink.length) {
      console.log(`   진행 중: ${Math.min(i + chunkSize, toLink.length)}/${toLink.length}건`);
    }
  }

  console.log('\n✅ 예약-고객 일괄 연결 완료!');
  console.log(`   성공: ${successCount}건`);
  console.log(`   실패: ${failCount}건\n`);
}

linkAllBookingsToCustomers().catch((err) => {
  console.error('❌ 스크립트 실행 중 오류:', err);
  process.exit(1);
});







 * 예약-고객 일괄 연결 스크립트
 *
 * 목표:
 * - customer_profile_id가 null인 예약들을 phone 기준으로 고객과 자동 연결
 * - 고객 정보가 있는 예약만 연결 (고객이 없으면 스킵)
 *
 * 사용법:
 *   node scripts/link-all-bookings-to-customers.js --dry-run   // 변경 없이 리포트만
 *   node scripts/link-all-bookings-to-customers.js --apply     // 실제 DB 반영
 */

const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Supabase 환경 변수가 설정되지 않았습니다.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// 전화번호 정규화 (sync-bookings-and-customers.js와 동일)
function normalizePhone(phone) {
  if (!phone) return null;
  let cleaned = phone.toString().replace(/[\s\-+(),]/g, '');

  if (cleaned.startsWith('82')) {
    cleaned = '0' + cleaned.substring(2);
  }

  if (cleaned.startsWith('01') && cleaned.length === 10) {
    cleaned = '010' + cleaned.substring(2);
  }

  if (cleaned.startsWith('10') && cleaned.length === 10) {
    cleaned = '0' + cleaned;
  }

  if (!/^010\d{8}$/.test(cleaned)) {
    return null;
  }

  return cleaned;
}

async function loadAll(table) {
  const pageSize = 1000;
  let from = 0;
  let hasMore = true;
  const all = [];

  while (hasMore) {
    const { data, error } = await supabase
      .from(table)
      .select('*')
      .range(from, from + pageSize - 1);

    if (error) {
      console.error(`❌ ${table} 로드 오류:`, error);
      break;
    }

    if (data && data.length > 0) {
      all.push(...data);
      from += pageSize;
      hasMore = data.length === pageSize;
    } else {
      hasMore = false;
    }
  }

  return all;
}

async function linkAllBookingsToCustomers() {
  const apply = process.argv.includes('--apply');

  console.log('🔗 예약-고객 일괄 연결 시작...');
  console.log(apply ? '⚠️  실제 DB 반영 모드입니다.\n' : '⚠️  DRY RUN 모드: 변경 없이 리포트만 생성합니다.\n');

  console.log('📥 고객 데이터 로드 중...');
  const allCustomers = await loadAll('customers');
  console.log(`✅ customers: ${allCustomers.length}건 로드`);

  console.log('📥 예약 데이터 로드 중...');
  const allBookings = await loadAll('bookings');
  console.log(`✅ bookings: ${allBookings.length}건 로드\n`);

  // phone 기준으로 고객 인덱스 생성
  const customerByPhone = new Map();
  for (const c of allCustomers) {
    if (!c.phone) continue;
    const normalized = normalizePhone(c.phone);
    if (!normalized) continue;
    
    // 동일 phone에 여러 고객이 있으면 첫 번째 것만 사용
    if (!customerByPhone.has(normalized)) {
      customerByPhone.set(normalized, c);
    }
  }

  // customer_profile_id가 null인 예약 찾기
  const unlinkedBookings = allBookings.filter(b => 
    !b.customer_profile_id || b.customer_profile_id === null
  );

  console.log(`📊 customer_profile_id가 null인 예약: ${unlinkedBookings.length}건\n`);

  const toLink = [];
  const skipped = {
    noPhone: [],
    invalidPhone: [],
    noCustomer: [],
  };

  for (const booking of unlinkedBookings) {
    if (!booking.phone || !booking.phone.toString().trim()) {
      skipped.noPhone.push({
        id: booking.id,
        name: booking.name,
        date: booking.date,
        reason: '전화번호 없음',
      });
      continue;
    }

    const normalized = normalizePhone(booking.phone);
    if (!normalized) {
      skipped.invalidPhone.push({
        id: booking.id,
        name: booking.name,
        rawPhone: booking.phone,
        date: booking.date,
        reason: '유효하지 않은 전화번호',
      });
      continue;
    }

    const customer = customerByPhone.get(normalized);
    if (!customer) {
      skipped.noCustomer.push({
        id: booking.id,
        name: booking.name,
        phone: normalized,
        date: booking.date,
        reason: '고객 정보 없음',
      });
      continue;
    }

    toLink.push({
      bookingId: booking.id,
      bookingName: booking.name,
      phone: normalized,
      customerId: customer.id,
      customerName: customer.name,
      date: booking.date,
    });
  }

  console.log('📊 연결 가능한 예약 요약:\n');
  console.log(`✅ 연결 가능: ${toLink.length}건`);
  console.log(`⚠️  전화번호 없음: ${skipped.noPhone.length}건`);
  console.log(`⚠️  유효하지 않은 전화번호: ${skipped.invalidPhone.length}건`);
  console.log(`⚠️  고객 정보 없음: ${skipped.noCustomer.length}건\n`);

  if (toLink.length > 0) {
    console.log('🔍 연결 가능한 예약 샘플 (최대 10건):');
    toLink.slice(0, 10).forEach((item, i) => {
      console.log(`   ${i + 1}. 예약 ID: ${item.bookingId} (${item.bookingName}) → 고객 ID: ${item.customerId} (${item.customerName})`);
    });
    console.log('');
  }

  if (skipped.noCustomer.length > 0) {
    console.log('⚠️  고객 정보 없는 예약 샘플 (최대 5건):');
    skipped.noCustomer.slice(0, 5).forEach((item, i) => {
      console.log(`   ${i + 1}. 예약 ID: ${item.id} (${item.name}), 전화: ${item.phone}, 날짜: ${item.date}`);
    });
    console.log('');
  }

  if (!apply) {
    console.log('💡 --apply 옵션 없이 실행했으므로, 여기까지는 리포트만 생성했습니다.');
    console.log('   내용이 기대와 일치하면 다음 명령으로 실제 반영을 수행하세요:');
    console.log('   node scripts/link-all-bookings-to-customers.js --apply\n');
    return;
  }

  console.log('⚠️  실제 DB 반영을 시작합니다...\n');

  if (toLink.length === 0) {
    console.log('✅ 연결할 예약이 없습니다.\n');
    return;
  }

  console.log(`🔗 예약 ${toLink.length}건 연결 중...`);
  let successCount = 0;
  let failCount = 0;

  const chunkSize = 100;
  for (let i = 0; i < toLink.length; i += chunkSize) {
    const chunk = toLink.slice(i, i + chunkSize);
    
    for (const item of chunk) {
      const bookingId = typeof item.bookingId === 'number' ? item.bookingId : parseInt(String(item.bookingId));
      const { error } = await supabase
        .from('bookings')
        .update({ customer_profile_id: item.customerId })
        .eq('id', bookingId);

      if (error) {
        console.error(`❌ 예약 ${item.bookingId} 연결 실패:`, error.message);
        failCount++;
      } else {
        successCount++;
      }
    }

    if ((i + chunkSize) % 500 === 0 || i + chunkSize >= toLink.length) {
      console.log(`   진행 중: ${Math.min(i + chunkSize, toLink.length)}/${toLink.length}건`);
    }
  }

  console.log('\n✅ 예약-고객 일괄 연결 완료!');
  console.log(`   성공: ${successCount}건`);
  console.log(`   실패: ${failCount}건\n`);
}

linkAllBookingsToCustomers().catch((err) => {
  console.error('❌ 스크립트 실행 중 오류:', err);
  process.exit(1);
});







 * 예약-고객 일괄 연결 스크립트
 *
 * 목표:
 * - customer_profile_id가 null인 예약들을 phone 기준으로 고객과 자동 연결
 * - 고객 정보가 있는 예약만 연결 (고객이 없으면 스킵)
 *
 * 사용법:
 *   node scripts/link-all-bookings-to-customers.js --dry-run   // 변경 없이 리포트만
 *   node scripts/link-all-bookings-to-customers.js --apply     // 실제 DB 반영
 */

const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Supabase 환경 변수가 설정되지 않았습니다.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// 전화번호 정규화 (sync-bookings-and-customers.js와 동일)
function normalizePhone(phone) {
  if (!phone) return null;
  let cleaned = phone.toString().replace(/[\s\-+(),]/g, '');

  if (cleaned.startsWith('82')) {
    cleaned = '0' + cleaned.substring(2);
  }

  if (cleaned.startsWith('01') && cleaned.length === 10) {
    cleaned = '010' + cleaned.substring(2);
  }

  if (cleaned.startsWith('10') && cleaned.length === 10) {
    cleaned = '0' + cleaned;
  }

  if (!/^010\d{8}$/.test(cleaned)) {
    return null;
  }

  return cleaned;
}

async function loadAll(table) {
  const pageSize = 1000;
  let from = 0;
  let hasMore = true;
  const all = [];

  while (hasMore) {
    const { data, error } = await supabase
      .from(table)
      .select('*')
      .range(from, from + pageSize - 1);

    if (error) {
      console.error(`❌ ${table} 로드 오류:`, error);
      break;
    }

    if (data && data.length > 0) {
      all.push(...data);
      from += pageSize;
      hasMore = data.length === pageSize;
    } else {
      hasMore = false;
    }
  }

  return all;
}

async function linkAllBookingsToCustomers() {
  const apply = process.argv.includes('--apply');

  console.log('🔗 예약-고객 일괄 연결 시작...');
  console.log(apply ? '⚠️  실제 DB 반영 모드입니다.\n' : '⚠️  DRY RUN 모드: 변경 없이 리포트만 생성합니다.\n');

  console.log('📥 고객 데이터 로드 중...');
  const allCustomers = await loadAll('customers');
  console.log(`✅ customers: ${allCustomers.length}건 로드`);

  console.log('📥 예약 데이터 로드 중...');
  const allBookings = await loadAll('bookings');
  console.log(`✅ bookings: ${allBookings.length}건 로드\n`);

  // phone 기준으로 고객 인덱스 생성
  const customerByPhone = new Map();
  for (const c of allCustomers) {
    if (!c.phone) continue;
    const normalized = normalizePhone(c.phone);
    if (!normalized) continue;
    
    // 동일 phone에 여러 고객이 있으면 첫 번째 것만 사용
    if (!customerByPhone.has(normalized)) {
      customerByPhone.set(normalized, c);
    }
  }

  // customer_profile_id가 null인 예약 찾기
  const unlinkedBookings = allBookings.filter(b => 
    !b.customer_profile_id || b.customer_profile_id === null
  );

  console.log(`📊 customer_profile_id가 null인 예약: ${unlinkedBookings.length}건\n`);

  const toLink = [];
  const skipped = {
    noPhone: [],
    invalidPhone: [],
    noCustomer: [],
  };

  for (const booking of unlinkedBookings) {
    if (!booking.phone || !booking.phone.toString().trim()) {
      skipped.noPhone.push({
        id: booking.id,
        name: booking.name,
        date: booking.date,
        reason: '전화번호 없음',
      });
      continue;
    }

    const normalized = normalizePhone(booking.phone);
    if (!normalized) {
      skipped.invalidPhone.push({
        id: booking.id,
        name: booking.name,
        rawPhone: booking.phone,
        date: booking.date,
        reason: '유효하지 않은 전화번호',
      });
      continue;
    }

    const customer = customerByPhone.get(normalized);
    if (!customer) {
      skipped.noCustomer.push({
        id: booking.id,
        name: booking.name,
        phone: normalized,
        date: booking.date,
        reason: '고객 정보 없음',
      });
      continue;
    }

    toLink.push({
      bookingId: booking.id,
      bookingName: booking.name,
      phone: normalized,
      customerId: customer.id,
      customerName: customer.name,
      date: booking.date,
    });
  }

  console.log('📊 연결 가능한 예약 요약:\n');
  console.log(`✅ 연결 가능: ${toLink.length}건`);
  console.log(`⚠️  전화번호 없음: ${skipped.noPhone.length}건`);
  console.log(`⚠️  유효하지 않은 전화번호: ${skipped.invalidPhone.length}건`);
  console.log(`⚠️  고객 정보 없음: ${skipped.noCustomer.length}건\n`);

  if (toLink.length > 0) {
    console.log('🔍 연결 가능한 예약 샘플 (최대 10건):');
    toLink.slice(0, 10).forEach((item, i) => {
      console.log(`   ${i + 1}. 예약 ID: ${item.bookingId} (${item.bookingName}) → 고객 ID: ${item.customerId} (${item.customerName})`);
    });
    console.log('');
  }

  if (skipped.noCustomer.length > 0) {
    console.log('⚠️  고객 정보 없는 예약 샘플 (최대 5건):');
    skipped.noCustomer.slice(0, 5).forEach((item, i) => {
      console.log(`   ${i + 1}. 예약 ID: ${item.id} (${item.name}), 전화: ${item.phone}, 날짜: ${item.date}`);
    });
    console.log('');
  }

  if (!apply) {
    console.log('💡 --apply 옵션 없이 실행했으므로, 여기까지는 리포트만 생성했습니다.');
    console.log('   내용이 기대와 일치하면 다음 명령으로 실제 반영을 수행하세요:');
    console.log('   node scripts/link-all-bookings-to-customers.js --apply\n');
    return;
  }

  console.log('⚠️  실제 DB 반영을 시작합니다...\n');

  if (toLink.length === 0) {
    console.log('✅ 연결할 예약이 없습니다.\n');
    return;
  }

  console.log(`🔗 예약 ${toLink.length}건 연결 중...`);
  let successCount = 0;
  let failCount = 0;

  const chunkSize = 100;
  for (let i = 0; i < toLink.length; i += chunkSize) {
    const chunk = toLink.slice(i, i + chunkSize);
    
    for (const item of chunk) {
      const bookingId = typeof item.bookingId === 'number' ? item.bookingId : parseInt(String(item.bookingId));
      const { error } = await supabase
        .from('bookings')
        .update({ customer_profile_id: item.customerId })
        .eq('id', bookingId);

      if (error) {
        console.error(`❌ 예약 ${item.bookingId} 연결 실패:`, error.message);
        failCount++;
      } else {
        successCount++;
      }
    }

    if ((i + chunkSize) % 500 === 0 || i + chunkSize >= toLink.length) {
      console.log(`   진행 중: ${Math.min(i + chunkSize, toLink.length)}/${toLink.length}건`);
    }
  }

  console.log('\n✅ 예약-고객 일괄 연결 완료!');
  console.log(`   성공: ${successCount}건`);
  console.log(`   실패: ${failCount}건\n`);
}

linkAllBookingsToCustomers().catch((err) => {
  console.error('❌ 스크립트 실행 중 오류:', err);
  process.exit(1);
});







 * 예약-고객 일괄 연결 스크립트
 *
 * 목표:
 * - customer_profile_id가 null인 예약들을 phone 기준으로 고객과 자동 연결
 * - 고객 정보가 있는 예약만 연결 (고객이 없으면 스킵)
 *
 * 사용법:
 *   node scripts/link-all-bookings-to-customers.js --dry-run   // 변경 없이 리포트만
 *   node scripts/link-all-bookings-to-customers.js --apply     // 실제 DB 반영
 */

const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Supabase 환경 변수가 설정되지 않았습니다.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// 전화번호 정규화 (sync-bookings-and-customers.js와 동일)
function normalizePhone(phone) {
  if (!phone) return null;
  let cleaned = phone.toString().replace(/[\s\-+(),]/g, '');

  if (cleaned.startsWith('82')) {
    cleaned = '0' + cleaned.substring(2);
  }

  if (cleaned.startsWith('01') && cleaned.length === 10) {
    cleaned = '010' + cleaned.substring(2);
  }

  if (cleaned.startsWith('10') && cleaned.length === 10) {
    cleaned = '0' + cleaned;
  }

  if (!/^010\d{8}$/.test(cleaned)) {
    return null;
  }

  return cleaned;
}

async function loadAll(table) {
  const pageSize = 1000;
  let from = 0;
  let hasMore = true;
  const all = [];

  while (hasMore) {
    const { data, error } = await supabase
      .from(table)
      .select('*')
      .range(from, from + pageSize - 1);

    if (error) {
      console.error(`❌ ${table} 로드 오류:`, error);
      break;
    }

    if (data && data.length > 0) {
      all.push(...data);
      from += pageSize;
      hasMore = data.length === pageSize;
    } else {
      hasMore = false;
    }
  }

  return all;
}

async function linkAllBookingsToCustomers() {
  const apply = process.argv.includes('--apply');

  console.log('🔗 예약-고객 일괄 연결 시작...');
  console.log(apply ? '⚠️  실제 DB 반영 모드입니다.\n' : '⚠️  DRY RUN 모드: 변경 없이 리포트만 생성합니다.\n');

  console.log('📥 고객 데이터 로드 중...');
  const allCustomers = await loadAll('customers');
  console.log(`✅ customers: ${allCustomers.length}건 로드`);

  console.log('📥 예약 데이터 로드 중...');
  const allBookings = await loadAll('bookings');
  console.log(`✅ bookings: ${allBookings.length}건 로드\n`);

  // phone 기준으로 고객 인덱스 생성
  const customerByPhone = new Map();
  for (const c of allCustomers) {
    if (!c.phone) continue;
    const normalized = normalizePhone(c.phone);
    if (!normalized) continue;
    
    // 동일 phone에 여러 고객이 있으면 첫 번째 것만 사용
    if (!customerByPhone.has(normalized)) {
      customerByPhone.set(normalized, c);
    }
  }

  // customer_profile_id가 null인 예약 찾기
  const unlinkedBookings = allBookings.filter(b => 
    !b.customer_profile_id || b.customer_profile_id === null
  );

  console.log(`📊 customer_profile_id가 null인 예약: ${unlinkedBookings.length}건\n`);

  const toLink = [];
  const skipped = {
    noPhone: [],
    invalidPhone: [],
    noCustomer: [],
  };

  for (const booking of unlinkedBookings) {
    if (!booking.phone || !booking.phone.toString().trim()) {
      skipped.noPhone.push({
        id: booking.id,
        name: booking.name,
        date: booking.date,
        reason: '전화번호 없음',
      });
      continue;
    }

    const normalized = normalizePhone(booking.phone);
    if (!normalized) {
      skipped.invalidPhone.push({
        id: booking.id,
        name: booking.name,
        rawPhone: booking.phone,
        date: booking.date,
        reason: '유효하지 않은 전화번호',
      });
      continue;
    }

    const customer = customerByPhone.get(normalized);
    if (!customer) {
      skipped.noCustomer.push({
        id: booking.id,
        name: booking.name,
        phone: normalized,
        date: booking.date,
        reason: '고객 정보 없음',
      });
      continue;
    }

    toLink.push({
      bookingId: booking.id,
      bookingName: booking.name,
      phone: normalized,
      customerId: customer.id,
      customerName: customer.name,
      date: booking.date,
    });
  }

  console.log('📊 연결 가능한 예약 요약:\n');
  console.log(`✅ 연결 가능: ${toLink.length}건`);
  console.log(`⚠️  전화번호 없음: ${skipped.noPhone.length}건`);
  console.log(`⚠️  유효하지 않은 전화번호: ${skipped.invalidPhone.length}건`);
  console.log(`⚠️  고객 정보 없음: ${skipped.noCustomer.length}건\n`);

  if (toLink.length > 0) {
    console.log('🔍 연결 가능한 예약 샘플 (최대 10건):');
    toLink.slice(0, 10).forEach((item, i) => {
      console.log(`   ${i + 1}. 예약 ID: ${item.bookingId} (${item.bookingName}) → 고객 ID: ${item.customerId} (${item.customerName})`);
    });
    console.log('');
  }

  if (skipped.noCustomer.length > 0) {
    console.log('⚠️  고객 정보 없는 예약 샘플 (최대 5건):');
    skipped.noCustomer.slice(0, 5).forEach((item, i) => {
      console.log(`   ${i + 1}. 예약 ID: ${item.id} (${item.name}), 전화: ${item.phone}, 날짜: ${item.date}`);
    });
    console.log('');
  }

  if (!apply) {
    console.log('💡 --apply 옵션 없이 실행했으므로, 여기까지는 리포트만 생성했습니다.');
    console.log('   내용이 기대와 일치하면 다음 명령으로 실제 반영을 수행하세요:');
    console.log('   node scripts/link-all-bookings-to-customers.js --apply\n');
    return;
  }

  console.log('⚠️  실제 DB 반영을 시작합니다...\n');

  if (toLink.length === 0) {
    console.log('✅ 연결할 예약이 없습니다.\n');
    return;
  }

  console.log(`🔗 예약 ${toLink.length}건 연결 중...`);
  let successCount = 0;
  let failCount = 0;

  const chunkSize = 100;
  for (let i = 0; i < toLink.length; i += chunkSize) {
    const chunk = toLink.slice(i, i + chunkSize);
    
    for (const item of chunk) {
      const bookingId = typeof item.bookingId === 'number' ? item.bookingId : parseInt(String(item.bookingId));
      const { error } = await supabase
        .from('bookings')
        .update({ customer_profile_id: item.customerId })
        .eq('id', bookingId);

      if (error) {
        console.error(`❌ 예약 ${item.bookingId} 연결 실패:`, error.message);
        failCount++;
      } else {
        successCount++;
      }
    }

    if ((i + chunkSize) % 500 === 0 || i + chunkSize >= toLink.length) {
      console.log(`   진행 중: ${Math.min(i + chunkSize, toLink.length)}/${toLink.length}건`);
    }
  }

  console.log('\n✅ 예약-고객 일괄 연결 완료!');
  console.log(`   성공: ${successCount}건`);
  console.log(`   실패: ${failCount}건\n`);
}

linkAllBookingsToCustomers().catch((err) => {
  console.error('❌ 스크립트 실행 중 오류:', err);
  process.exit(1);
});







 * 예약-고객 일괄 연결 스크립트
 *
 * 목표:
 * - customer_profile_id가 null인 예약들을 phone 기준으로 고객과 자동 연결
 * - 고객 정보가 있는 예약만 연결 (고객이 없으면 스킵)
 *
 * 사용법:
 *   node scripts/link-all-bookings-to-customers.js --dry-run   // 변경 없이 리포트만
 *   node scripts/link-all-bookings-to-customers.js --apply     // 실제 DB 반영
 */

const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Supabase 환경 변수가 설정되지 않았습니다.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// 전화번호 정규화 (sync-bookings-and-customers.js와 동일)
function normalizePhone(phone) {
  if (!phone) return null;
  let cleaned = phone.toString().replace(/[\s\-+(),]/g, '');

  if (cleaned.startsWith('82')) {
    cleaned = '0' + cleaned.substring(2);
  }

  if (cleaned.startsWith('01') && cleaned.length === 10) {
    cleaned = '010' + cleaned.substring(2);
  }

  if (cleaned.startsWith('10') && cleaned.length === 10) {
    cleaned = '0' + cleaned;
  }

  if (!/^010\d{8}$/.test(cleaned)) {
    return null;
  }

  return cleaned;
}

async function loadAll(table) {
  const pageSize = 1000;
  let from = 0;
  let hasMore = true;
  const all = [];

  while (hasMore) {
    const { data, error } = await supabase
      .from(table)
      .select('*')
      .range(from, from + pageSize - 1);

    if (error) {
      console.error(`❌ ${table} 로드 오류:`, error);
      break;
    }

    if (data && data.length > 0) {
      all.push(...data);
      from += pageSize;
      hasMore = data.length === pageSize;
    } else {
      hasMore = false;
    }
  }

  return all;
}

async function linkAllBookingsToCustomers() {
  const apply = process.argv.includes('--apply');

  console.log('🔗 예약-고객 일괄 연결 시작...');
  console.log(apply ? '⚠️  실제 DB 반영 모드입니다.\n' : '⚠️  DRY RUN 모드: 변경 없이 리포트만 생성합니다.\n');

  console.log('📥 고객 데이터 로드 중...');
  const allCustomers = await loadAll('customers');
  console.log(`✅ customers: ${allCustomers.length}건 로드`);

  console.log('📥 예약 데이터 로드 중...');
  const allBookings = await loadAll('bookings');
  console.log(`✅ bookings: ${allBookings.length}건 로드\n`);

  // phone 기준으로 고객 인덱스 생성
  const customerByPhone = new Map();
  for (const c of allCustomers) {
    if (!c.phone) continue;
    const normalized = normalizePhone(c.phone);
    if (!normalized) continue;
    
    // 동일 phone에 여러 고객이 있으면 첫 번째 것만 사용
    if (!customerByPhone.has(normalized)) {
      customerByPhone.set(normalized, c);
    }
  }

  // customer_profile_id가 null인 예약 찾기
  const unlinkedBookings = allBookings.filter(b => 
    !b.customer_profile_id || b.customer_profile_id === null
  );

  console.log(`📊 customer_profile_id가 null인 예약: ${unlinkedBookings.length}건\n`);

  const toLink = [];
  const skipped = {
    noPhone: [],
    invalidPhone: [],
    noCustomer: [],
  };

  for (const booking of unlinkedBookings) {
    if (!booking.phone || !booking.phone.toString().trim()) {
      skipped.noPhone.push({
        id: booking.id,
        name: booking.name,
        date: booking.date,
        reason: '전화번호 없음',
      });
      continue;
    }

    const normalized = normalizePhone(booking.phone);
    if (!normalized) {
      skipped.invalidPhone.push({
        id: booking.id,
        name: booking.name,
        rawPhone: booking.phone,
        date: booking.date,
        reason: '유효하지 않은 전화번호',
      });
      continue;
    }

    const customer = customerByPhone.get(normalized);
    if (!customer) {
      skipped.noCustomer.push({
        id: booking.id,
        name: booking.name,
        phone: normalized,
        date: booking.date,
        reason: '고객 정보 없음',
      });
      continue;
    }

    toLink.push({
      bookingId: booking.id,
      bookingName: booking.name,
      phone: normalized,
      customerId: customer.id,
      customerName: customer.name,
      date: booking.date,
    });
  }

  console.log('📊 연결 가능한 예약 요약:\n');
  console.log(`✅ 연결 가능: ${toLink.length}건`);
  console.log(`⚠️  전화번호 없음: ${skipped.noPhone.length}건`);
  console.log(`⚠️  유효하지 않은 전화번호: ${skipped.invalidPhone.length}건`);
  console.log(`⚠️  고객 정보 없음: ${skipped.noCustomer.length}건\n`);

  if (toLink.length > 0) {
    console.log('🔍 연결 가능한 예약 샘플 (최대 10건):');
    toLink.slice(0, 10).forEach((item, i) => {
      console.log(`   ${i + 1}. 예약 ID: ${item.bookingId} (${item.bookingName}) → 고객 ID: ${item.customerId} (${item.customerName})`);
    });
    console.log('');
  }

  if (skipped.noCustomer.length > 0) {
    console.log('⚠️  고객 정보 없는 예약 샘플 (최대 5건):');
    skipped.noCustomer.slice(0, 5).forEach((item, i) => {
      console.log(`   ${i + 1}. 예약 ID: ${item.id} (${item.name}), 전화: ${item.phone}, 날짜: ${item.date}`);
    });
    console.log('');
  }

  if (!apply) {
    console.log('💡 --apply 옵션 없이 실행했으므로, 여기까지는 리포트만 생성했습니다.');
    console.log('   내용이 기대와 일치하면 다음 명령으로 실제 반영을 수행하세요:');
    console.log('   node scripts/link-all-bookings-to-customers.js --apply\n');
    return;
  }

  console.log('⚠️  실제 DB 반영을 시작합니다...\n');

  if (toLink.length === 0) {
    console.log('✅ 연결할 예약이 없습니다.\n');
    return;
  }

  console.log(`🔗 예약 ${toLink.length}건 연결 중...`);
  let successCount = 0;
  let failCount = 0;

  const chunkSize = 100;
  for (let i = 0; i < toLink.length; i += chunkSize) {
    const chunk = toLink.slice(i, i + chunkSize);
    
    for (const item of chunk) {
      const bookingId = typeof item.bookingId === 'number' ? item.bookingId : parseInt(String(item.bookingId));
      const { error } = await supabase
        .from('bookings')
        .update({ customer_profile_id: item.customerId })
        .eq('id', bookingId);

      if (error) {
        console.error(`❌ 예약 ${item.bookingId} 연결 실패:`, error.message);
        failCount++;
      } else {
        successCount++;
      }
    }

    if ((i + chunkSize) % 500 === 0 || i + chunkSize >= toLink.length) {
      console.log(`   진행 중: ${Math.min(i + chunkSize, toLink.length)}/${toLink.length}건`);
    }
  }

  console.log('\n✅ 예약-고객 일괄 연결 완료!');
  console.log(`   성공: ${successCount}건`);
  console.log(`   실패: ${failCount}건\n`);
}

linkAllBookingsToCustomers().catch((err) => {
  console.error('❌ 스크립트 실행 중 오류:', err);
  process.exit(1);
});























