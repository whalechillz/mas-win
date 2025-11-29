/**
 * bookings ↔ customers 일괄 동기화 스크립트
 *
 * 목표:
 * 1. phone(정규화된 번호)을 기준으로 예약/고객 데이터를 정렬
 * 2. 각 phone 그룹별로 visit_count, first_inquiry_date, last_visit_date 등을 customers에 반영
 * 3. customers에 없는 phone은 새 고객 생성
 * 4. 동일 phone에 여러 고객이 있는 경우는 "예외 목록"에만 기록 (자동 수정 X)
 *
 * 사용법:
 *   node scripts/sync-bookings-and-customers.js --dry-run   // 변경 없이 리포트만
 *   node scripts/sync-bookings-and-customers.js --apply     // 실제 DB 반영
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

// 전화번호 정규화 (fix-phone-normalization.js와 동일한 규칙 사용)
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

function toDateOnly(dateStr) {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString().split('T')[0];
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

async function syncBookingsAndCustomers() {
  const apply = process.argv.includes('--apply');

  console.log('🔄 bookings ↔ customers 동기화 시작...');
  console.log(apply ? '⚠️  실제 DB 반영 모드입니다.\n' : '⚠️  DRY RUN 모드: 변경 없이 리포트만 생성합니다.\n');

  console.log('📥 고객 데이터 로드 중...');
  const allCustomers = await loadAll('customers');
  console.log(`✅ customers: ${allCustomers.length}건 로드`);

  console.log('📥 예약 데이터 로드 중...');
  const allBookings = await loadAll('bookings');
  console.log(`✅ bookings: ${allBookings.length}건 로드\n`);

  // phone 기준 인덱스 생성
  const customerByPhone = new Map();
  const multiCustomersByPhone = new Map();

  for (const c of allCustomers) {
    const normalized = normalizePhone(c.phone);
    if (!normalized) continue;

    if (!customerByPhone.has(normalized)) {
      customerByPhone.set(normalized, c);
    } else {
      // 동일 phone에 여러 고객이 있으면 예외 목록에 기록
      if (!multiCustomersByPhone.has(normalized)) {
        multiCustomersByPhone.set(normalized, [customerByPhone.get(normalized)]);
      }
      multiCustomersByPhone.get(normalized).push(c);
    }
  }

  const groups = new Map(); // phone -> { bookings: [], customer?: Customer }
  const abnormal = {
    invalidPhoneBookings: [],
    noPhoneBookings: [],
    multiCustomerPhones: [],
  };

  // bookings를 phone 기준으로 그룹화
  for (const b of allBookings) {
    if (!b.phone || !b.phone.toString().trim()) {
      abnormal.noPhoneBookings.push({
        id: b.id,
        name: b.name,
        date: b.date,
        reason: '전화번호 없음',
      });
      continue;
    }

    const normalized = normalizePhone(b.phone);
    if (!normalized) {
      abnormal.invalidPhoneBookings.push({
        id: b.id,
        name: b.name,
        rawPhone: b.phone,
        date: b.date,
        reason: '유효하지 않은 전화번호',
      });
      continue;
    }

    if (!groups.has(normalized)) {
      groups.set(normalized, { bookings: [], customer: null });
    }
    groups.get(normalized).bookings.push(b);
  }

  // phone 그룹에 customer 매핑
  for (const [phone, group] of groups.entries()) {
    if (multiCustomersByPhone.has(phone)) {
      abnormal.multiCustomerPhones.push({
        phone,
        customers: multiCustomersByPhone.get(phone).map(c => ({ id: c.id, name: c.name })),
        bookingCount: group.bookings.length,
      });
      continue;
    }

    const customer = customerByPhone.get(phone) || null;
    group.customer = customer;
  }

  const toCreateCustomers = [];
  const toUpdateCustomers = [];

  for (const [phone, group] of groups.entries()) {
    // multi-customer 예외는 이미 abnormal에 기록되어 있고, group.customer는 null 상태일 것
    if (multiCustomersByPhone.has(phone)) {
      continue;
    }

    const bookings = group.bookings;
    if (!bookings.length) continue;

    // visit_count 및 first/last 날짜 계산
    const sortedByDate = [...bookings].sort((a, b) => {
      const ad = new Date(a.date || a.created_at || 0).getTime();
      const bd = new Date(b.date || b.created_at || 0).getTime();
      return ad - bd;
    });

    const firstDate = toDateOnly(sortedByDate[0].date || sortedByDate[0].created_at);
    const lastDate = toDateOnly(sortedByDate[sortedByDate.length - 1].date || sortedByDate[sortedByDate.length - 1].created_at);
    const visitCount = bookings.length;
    const asVisitCount = bookings.filter(b => b.is_as_visit).length;

    if (!group.customer) {
      // 고객이 없으면 새로 생성 (첫 예약 정보 기준)
      const base = sortedByDate[0];
      toCreateCustomers.push({
        name: base.name || '이름 미상',
        phone,
        email: base.email || null,
        visit_count: visitCount,
        as_visit_count: asVisitCount || 0,
        first_inquiry_date: firstDate,
        last_visit_date: lastDate,
      });
    } else {
      const c = group.customer;
      const update = {
        id: c.id,
        visit_count: visitCount,
        as_visit_count: typeof c.as_visit_count === 'number' ? asVisitCount : undefined,
        first_inquiry_date: c.first_inquiry_date || firstDate,
        last_visit_date: lastDate,
      };
      toUpdateCustomers.push(update);
    }
  }

  console.log('📊 동기화 요약 (DRY-RUN 기준):\n');
  console.log(`- 새로 생성될 고객 수: ${toCreateCustomers.length}명`);
  console.log(`- visit_count 업데이트 대상 고객 수: ${toUpdateCustomers.length}명`);
  console.log(`- 전화번호 없는 예약: ${abnormal.noPhoneBookings.length}건`);
  console.log(`- 유효하지 않은 전화번호 예약: ${abnormal.invalidPhoneBookings.length}건`);
  console.log(`- 동일 전화번호에 여러 고객이 있는 예외 phone: ${abnormal.multiCustomerPhones.length}개\n`);

  console.log('🔍 예외 케이스 상세 목록:');
  console.log('- 전화번호 없는 예약:', abnormal.noPhoneBookings);
  console.log('- 유효하지 않은 전화번호 예약 전체:', abnormal.invalidPhoneBookings);
  console.log('- 다중 고객 phone 전체:', abnormal.multiCustomerPhones);
  console.log('');

  if (!apply) {
    console.log('💡 --apply 옵션 없이 실행했으므로, 여기까지는 리포트만 생성했습니다.');
    console.log('   내용이 기대와 일치하면 다음 명령으로 실제 반영을 수행하세요:');
    console.log('   node scripts/sync-bookings-and-customers.js --apply\n');
    return;
  }

  console.log('⚠️  실제 DB 반영을 시작합니다...\n');

  // 1) 새 고객 생성
  if (toCreateCustomers.length > 0) {
    console.log(`➕ 고객 생성: ${toCreateCustomers.length}명`);
    const chunkSize = 500;
    for (let i = 0; i < toCreateCustomers.length; i += chunkSize) {
      const chunk = toCreateCustomers.slice(i, i + chunkSize);
      const { error } = await supabase.from('customers').insert(chunk);
      if (error) {
        console.error('❌ 고객 생성 오류:', error);
        break;
      }
    }
  }

  // 2) 기존 고객 업데이트
  if (toUpdateCustomers.length > 0) {
    console.log(`✏️ 고객 visit_count/날짜 업데이트: ${toUpdateCustomers.length}명`);
    let successCount = 0;
    let errorCount = 0;
    
    for (const c of toUpdateCustomers) {
      const updateData = {
        visit_count: c.visit_count,
      };
      
      if (typeof c.as_visit_count === 'number') {
        updateData.as_visit_count = c.as_visit_count;
      }
      
      if (c.first_inquiry_date) {
        updateData.first_inquiry_date = c.first_inquiry_date;
      }
      
      if (c.last_visit_date) {
        updateData.last_visit_date = c.last_visit_date;
      }

      const { error } = await supabase
        .from('customers')
        .update(updateData)
        .eq('id', c.id);

      if (error) {
        console.error(`❌ 고객 업데이트 실패 (ID: ${c.id}):`, error.message);
        errorCount++;
      } else {
        successCount++;
      }
      
      // 진행 상황 출력 (100건마다)
      if ((successCount + errorCount) % 100 === 0) {
        console.log(`   진행 중: ${successCount + errorCount}/${toUpdateCustomers.length}건`);
      }
    }
    
    console.log(`✅ 고객 업데이트 완료: ${successCount}건 성공, ${errorCount}건 실패`);
  }

  console.log('\n✅ bookings ↔ customers 동기화 완료 (apply 모드)\n');
  console.log('💡 예외 케이스(전화번호 없음/유효하지 않은 번호/다중 고객 phone)는 별도 리포트에서 확인 후,');
  console.log('   Admin UI의 개별/배치 동기화 기능으로 수동 정리하는 하이브리드 전략을 권장합니다.\n');
}

syncBookingsAndCustomers().catch((err) => {
  console.error('❌ 스크립트 실행 중 오류:', err);
  process.exit(1);
});


