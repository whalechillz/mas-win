/**
 * 내부자 전화번호 예약 삭제 스크립트
 * 
 * 특정 전화번호로 된 모든 예약을 삭제합니다.
 * 
 * 사용법:
 * node scripts/delete-internal-phone-bookings.js [--dry-run]
 * 
 * 옵션:
 *   --dry-run    실제 삭제 없이 확인만 수행
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Supabase 환경 변수가 설정되지 않았습니다.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// 삭제할 전화번호 목록
const INTERNAL_PHONES = [
  '01038486651',      // 하이픈 없는 형태
  '010-3848-6651',    // 하이픈 있는 형태
];

async function deleteInternalPhoneBookings() {
  const dryRun = process.argv.includes('--dry-run');
  
  console.log('🔍 내부자 전화번호 예약 조회 중...\n');
  if (dryRun) {
    console.log('⚠️  DRY RUN 모드: 실제 삭제 없이 확인만 수행합니다.\n');
  }
  
  // 모든 형태의 전화번호로 조회
  const phoneConditions = INTERNAL_PHONES.map(phone => `phone.eq.${phone}`).join(',');
  
  const { data: bookings, error } = await supabase
    .from('bookings')
    .select('id, name, phone, date, time, service_type, status, attendance_status, created_at')
    .or(phoneConditions)
    .order('date', { ascending: true });
  
  if (error) {
    console.error('❌ 예약 조회 오류:', error);
    process.exit(1);
  }
  
  if (!bookings || bookings.length === 0) {
    console.log('✅ 해당 전화번호로 된 예약이 없습니다.\n');
    return;
  }
  
  console.log(`📊 발견된 예약: ${bookings.length}건\n`);
  
  // 예약 목록 출력
  bookings.forEach((b, i) => {
    console.log(`${i + 1}. ID: ${b.id}`);
    console.log(`   이름: ${b.name || '-'}`);
    console.log(`   전화번호: ${b.phone}`);
    console.log(`   날짜/시간: ${b.date} ${b.time}`);
    console.log(`   서비스: ${b.service_type || '-'}`);
    console.log(`   상태: ${b.status || '-'} / ${b.attendance_status || '-'}`);
    console.log(`   생성일: ${b.created_at}`);
    console.log('');
  });
  
  if (dryRun) {
    console.log('💡 실제 삭제를 하려면 --dry-run 옵션을 제거하고 다시 실행하세요.\n');
    return;
  }
  
  // 삭제 확인
  console.log('='.repeat(60));
  console.log('⚠️  삭제 확인');
  console.log('='.repeat(60));
  console.log(`삭제할 예약 수: ${bookings.length}건`);
  console.log(`전화번호: ${INTERNAL_PHONES.join(', ')}`);
  console.log('');
  console.log('위 예약들을 삭제하시겠습니까?');
  console.log('(자동 실행 중...)');
  console.log('');
  
  // 예약 ID 목록 추출
  const bookingIds = bookings.map(b => b.id);
  
  // 삭제 실행
  console.log('🗑️  예약 삭제 중...');
  const { error: deleteError } = await supabase
    .from('bookings')
    .delete()
    .in('id', bookingIds);
  
  if (deleteError) {
    console.error('❌ 삭제 오류:', deleteError);
    process.exit(1);
  }
  
  console.log(`✅ 삭제 완료: ${bookings.length}건\n`);
  
  // 고객 정보도 확인 (해당 전화번호로 된 고객이 있는지)
  const { data: customers } = await supabase
    .from('customers')
    .select('id, name, phone, visit_count')
    .or(phoneConditions);
  
  if (customers && customers.length > 0) {
    console.log('📋 관련 고객 정보:');
    customers.forEach((c, i) => {
      console.log(`   ${i + 1}. ${c.name} (${c.phone}) - 방문 ${c.visit_count || 0}회`);
    });
    console.log('');
    console.log('💡 고객 정보도 삭제하시겠습니까? (수동으로 확인 후 삭제하세요)');
  }
  
  console.log('\n✅ 작업 완료!\n');
}

deleteInternalPhoneBookings()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('\n❌ 작업 실패:', err);
    process.exit(1);
  });







 * 내부자 전화번호 예약 삭제 스크립트
 * 
 * 특정 전화번호로 된 모든 예약을 삭제합니다.
 * 
 * 사용법:
 * node scripts/delete-internal-phone-bookings.js [--dry-run]
 * 
 * 옵션:
 *   --dry-run    실제 삭제 없이 확인만 수행
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Supabase 환경 변수가 설정되지 않았습니다.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// 삭제할 전화번호 목록
const INTERNAL_PHONES = [
  '01038486651',      // 하이픈 없는 형태
  '010-3848-6651',    // 하이픈 있는 형태
];

async function deleteInternalPhoneBookings() {
  const dryRun = process.argv.includes('--dry-run');
  
  console.log('🔍 내부자 전화번호 예약 조회 중...\n');
  if (dryRun) {
    console.log('⚠️  DRY RUN 모드: 실제 삭제 없이 확인만 수행합니다.\n');
  }
  
  // 모든 형태의 전화번호로 조회
  const phoneConditions = INTERNAL_PHONES.map(phone => `phone.eq.${phone}`).join(',');
  
  const { data: bookings, error } = await supabase
    .from('bookings')
    .select('id, name, phone, date, time, service_type, status, attendance_status, created_at')
    .or(phoneConditions)
    .order('date', { ascending: true });
  
  if (error) {
    console.error('❌ 예약 조회 오류:', error);
    process.exit(1);
  }
  
  if (!bookings || bookings.length === 0) {
    console.log('✅ 해당 전화번호로 된 예약이 없습니다.\n');
    return;
  }
  
  console.log(`📊 발견된 예약: ${bookings.length}건\n`);
  
  // 예약 목록 출력
  bookings.forEach((b, i) => {
    console.log(`${i + 1}. ID: ${b.id}`);
    console.log(`   이름: ${b.name || '-'}`);
    console.log(`   전화번호: ${b.phone}`);
    console.log(`   날짜/시간: ${b.date} ${b.time}`);
    console.log(`   서비스: ${b.service_type || '-'}`);
    console.log(`   상태: ${b.status || '-'} / ${b.attendance_status || '-'}`);
    console.log(`   생성일: ${b.created_at}`);
    console.log('');
  });
  
  if (dryRun) {
    console.log('💡 실제 삭제를 하려면 --dry-run 옵션을 제거하고 다시 실행하세요.\n');
    return;
  }
  
  // 삭제 확인
  console.log('='.repeat(60));
  console.log('⚠️  삭제 확인');
  console.log('='.repeat(60));
  console.log(`삭제할 예약 수: ${bookings.length}건`);
  console.log(`전화번호: ${INTERNAL_PHONES.join(', ')}`);
  console.log('');
  console.log('위 예약들을 삭제하시겠습니까?');
  console.log('(자동 실행 중...)');
  console.log('');
  
  // 예약 ID 목록 추출
  const bookingIds = bookings.map(b => b.id);
  
  // 삭제 실행
  console.log('🗑️  예약 삭제 중...');
  const { error: deleteError } = await supabase
    .from('bookings')
    .delete()
    .in('id', bookingIds);
  
  if (deleteError) {
    console.error('❌ 삭제 오류:', deleteError);
    process.exit(1);
  }
  
  console.log(`✅ 삭제 완료: ${bookings.length}건\n`);
  
  // 고객 정보도 확인 (해당 전화번호로 된 고객이 있는지)
  const { data: customers } = await supabase
    .from('customers')
    .select('id, name, phone, visit_count')
    .or(phoneConditions);
  
  if (customers && customers.length > 0) {
    console.log('📋 관련 고객 정보:');
    customers.forEach((c, i) => {
      console.log(`   ${i + 1}. ${c.name} (${c.phone}) - 방문 ${c.visit_count || 0}회`);
    });
    console.log('');
    console.log('💡 고객 정보도 삭제하시겠습니까? (수동으로 확인 후 삭제하세요)');
  }
  
  console.log('\n✅ 작업 완료!\n');
}

deleteInternalPhoneBookings()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('\n❌ 작업 실패:', err);
    process.exit(1);
  });







 * 내부자 전화번호 예약 삭제 스크립트
 * 
 * 특정 전화번호로 된 모든 예약을 삭제합니다.
 * 
 * 사용법:
 * node scripts/delete-internal-phone-bookings.js [--dry-run]
 * 
 * 옵션:
 *   --dry-run    실제 삭제 없이 확인만 수행
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Supabase 환경 변수가 설정되지 않았습니다.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// 삭제할 전화번호 목록
const INTERNAL_PHONES = [
  '01038486651',      // 하이픈 없는 형태
  '010-3848-6651',    // 하이픈 있는 형태
];

async function deleteInternalPhoneBookings() {
  const dryRun = process.argv.includes('--dry-run');
  
  console.log('🔍 내부자 전화번호 예약 조회 중...\n');
  if (dryRun) {
    console.log('⚠️  DRY RUN 모드: 실제 삭제 없이 확인만 수행합니다.\n');
  }
  
  // 모든 형태의 전화번호로 조회
  const phoneConditions = INTERNAL_PHONES.map(phone => `phone.eq.${phone}`).join(',');
  
  const { data: bookings, error } = await supabase
    .from('bookings')
    .select('id, name, phone, date, time, service_type, status, attendance_status, created_at')
    .or(phoneConditions)
    .order('date', { ascending: true });
  
  if (error) {
    console.error('❌ 예약 조회 오류:', error);
    process.exit(1);
  }
  
  if (!bookings || bookings.length === 0) {
    console.log('✅ 해당 전화번호로 된 예약이 없습니다.\n');
    return;
  }
  
  console.log(`📊 발견된 예약: ${bookings.length}건\n`);
  
  // 예약 목록 출력
  bookings.forEach((b, i) => {
    console.log(`${i + 1}. ID: ${b.id}`);
    console.log(`   이름: ${b.name || '-'}`);
    console.log(`   전화번호: ${b.phone}`);
    console.log(`   날짜/시간: ${b.date} ${b.time}`);
    console.log(`   서비스: ${b.service_type || '-'}`);
    console.log(`   상태: ${b.status || '-'} / ${b.attendance_status || '-'}`);
    console.log(`   생성일: ${b.created_at}`);
    console.log('');
  });
  
  if (dryRun) {
    console.log('💡 실제 삭제를 하려면 --dry-run 옵션을 제거하고 다시 실행하세요.\n');
    return;
  }
  
  // 삭제 확인
  console.log('='.repeat(60));
  console.log('⚠️  삭제 확인');
  console.log('='.repeat(60));
  console.log(`삭제할 예약 수: ${bookings.length}건`);
  console.log(`전화번호: ${INTERNAL_PHONES.join(', ')}`);
  console.log('');
  console.log('위 예약들을 삭제하시겠습니까?');
  console.log('(자동 실행 중...)');
  console.log('');
  
  // 예약 ID 목록 추출
  const bookingIds = bookings.map(b => b.id);
  
  // 삭제 실행
  console.log('🗑️  예약 삭제 중...');
  const { error: deleteError } = await supabase
    .from('bookings')
    .delete()
    .in('id', bookingIds);
  
  if (deleteError) {
    console.error('❌ 삭제 오류:', deleteError);
    process.exit(1);
  }
  
  console.log(`✅ 삭제 완료: ${bookings.length}건\n`);
  
  // 고객 정보도 확인 (해당 전화번호로 된 고객이 있는지)
  const { data: customers } = await supabase
    .from('customers')
    .select('id, name, phone, visit_count')
    .or(phoneConditions);
  
  if (customers && customers.length > 0) {
    console.log('📋 관련 고객 정보:');
    customers.forEach((c, i) => {
      console.log(`   ${i + 1}. ${c.name} (${c.phone}) - 방문 ${c.visit_count || 0}회`);
    });
    console.log('');
    console.log('💡 고객 정보도 삭제하시겠습니까? (수동으로 확인 후 삭제하세요)');
  }
  
  console.log('\n✅ 작업 완료!\n');
}

deleteInternalPhoneBookings()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('\n❌ 작업 실패:', err);
    process.exit(1);
  });







 * 내부자 전화번호 예약 삭제 스크립트
 * 
 * 특정 전화번호로 된 모든 예약을 삭제합니다.
 * 
 * 사용법:
 * node scripts/delete-internal-phone-bookings.js [--dry-run]
 * 
 * 옵션:
 *   --dry-run    실제 삭제 없이 확인만 수행
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Supabase 환경 변수가 설정되지 않았습니다.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// 삭제할 전화번호 목록
const INTERNAL_PHONES = [
  '01038486651',      // 하이픈 없는 형태
  '010-3848-6651',    // 하이픈 있는 형태
];

async function deleteInternalPhoneBookings() {
  const dryRun = process.argv.includes('--dry-run');
  
  console.log('🔍 내부자 전화번호 예약 조회 중...\n');
  if (dryRun) {
    console.log('⚠️  DRY RUN 모드: 실제 삭제 없이 확인만 수행합니다.\n');
  }
  
  // 모든 형태의 전화번호로 조회
  const phoneConditions = INTERNAL_PHONES.map(phone => `phone.eq.${phone}`).join(',');
  
  const { data: bookings, error } = await supabase
    .from('bookings')
    .select('id, name, phone, date, time, service_type, status, attendance_status, created_at')
    .or(phoneConditions)
    .order('date', { ascending: true });
  
  if (error) {
    console.error('❌ 예약 조회 오류:', error);
    process.exit(1);
  }
  
  if (!bookings || bookings.length === 0) {
    console.log('✅ 해당 전화번호로 된 예약이 없습니다.\n');
    return;
  }
  
  console.log(`📊 발견된 예약: ${bookings.length}건\n`);
  
  // 예약 목록 출력
  bookings.forEach((b, i) => {
    console.log(`${i + 1}. ID: ${b.id}`);
    console.log(`   이름: ${b.name || '-'}`);
    console.log(`   전화번호: ${b.phone}`);
    console.log(`   날짜/시간: ${b.date} ${b.time}`);
    console.log(`   서비스: ${b.service_type || '-'}`);
    console.log(`   상태: ${b.status || '-'} / ${b.attendance_status || '-'}`);
    console.log(`   생성일: ${b.created_at}`);
    console.log('');
  });
  
  if (dryRun) {
    console.log('💡 실제 삭제를 하려면 --dry-run 옵션을 제거하고 다시 실행하세요.\n');
    return;
  }
  
  // 삭제 확인
  console.log('='.repeat(60));
  console.log('⚠️  삭제 확인');
  console.log('='.repeat(60));
  console.log(`삭제할 예약 수: ${bookings.length}건`);
  console.log(`전화번호: ${INTERNAL_PHONES.join(', ')}`);
  console.log('');
  console.log('위 예약들을 삭제하시겠습니까?');
  console.log('(자동 실행 중...)');
  console.log('');
  
  // 예약 ID 목록 추출
  const bookingIds = bookings.map(b => b.id);
  
  // 삭제 실행
  console.log('🗑️  예약 삭제 중...');
  const { error: deleteError } = await supabase
    .from('bookings')
    .delete()
    .in('id', bookingIds);
  
  if (deleteError) {
    console.error('❌ 삭제 오류:', deleteError);
    process.exit(1);
  }
  
  console.log(`✅ 삭제 완료: ${bookings.length}건\n`);
  
  // 고객 정보도 확인 (해당 전화번호로 된 고객이 있는지)
  const { data: customers } = await supabase
    .from('customers')
    .select('id, name, phone, visit_count')
    .or(phoneConditions);
  
  if (customers && customers.length > 0) {
    console.log('📋 관련 고객 정보:');
    customers.forEach((c, i) => {
      console.log(`   ${i + 1}. ${c.name} (${c.phone}) - 방문 ${c.visit_count || 0}회`);
    });
    console.log('');
    console.log('💡 고객 정보도 삭제하시겠습니까? (수동으로 확인 후 삭제하세요)');
  }
  
  console.log('\n✅ 작업 완료!\n');
}

deleteInternalPhoneBookings()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('\n❌ 작업 실패:', err);
    process.exit(1);
  });







 * 내부자 전화번호 예약 삭제 스크립트
 * 
 * 특정 전화번호로 된 모든 예약을 삭제합니다.
 * 
 * 사용법:
 * node scripts/delete-internal-phone-bookings.js [--dry-run]
 * 
 * 옵션:
 *   --dry-run    실제 삭제 없이 확인만 수행
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Supabase 환경 변수가 설정되지 않았습니다.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// 삭제할 전화번호 목록
const INTERNAL_PHONES = [
  '01038486651',      // 하이픈 없는 형태
  '010-3848-6651',    // 하이픈 있는 형태
];

async function deleteInternalPhoneBookings() {
  const dryRun = process.argv.includes('--dry-run');
  
  console.log('🔍 내부자 전화번호 예약 조회 중...\n');
  if (dryRun) {
    console.log('⚠️  DRY RUN 모드: 실제 삭제 없이 확인만 수행합니다.\n');
  }
  
  // 모든 형태의 전화번호로 조회
  const phoneConditions = INTERNAL_PHONES.map(phone => `phone.eq.${phone}`).join(',');
  
  const { data: bookings, error } = await supabase
    .from('bookings')
    .select('id, name, phone, date, time, service_type, status, attendance_status, created_at')
    .or(phoneConditions)
    .order('date', { ascending: true });
  
  if (error) {
    console.error('❌ 예약 조회 오류:', error);
    process.exit(1);
  }
  
  if (!bookings || bookings.length === 0) {
    console.log('✅ 해당 전화번호로 된 예약이 없습니다.\n');
    return;
  }
  
  console.log(`📊 발견된 예약: ${bookings.length}건\n`);
  
  // 예약 목록 출력
  bookings.forEach((b, i) => {
    console.log(`${i + 1}. ID: ${b.id}`);
    console.log(`   이름: ${b.name || '-'}`);
    console.log(`   전화번호: ${b.phone}`);
    console.log(`   날짜/시간: ${b.date} ${b.time}`);
    console.log(`   서비스: ${b.service_type || '-'}`);
    console.log(`   상태: ${b.status || '-'} / ${b.attendance_status || '-'}`);
    console.log(`   생성일: ${b.created_at}`);
    console.log('');
  });
  
  if (dryRun) {
    console.log('💡 실제 삭제를 하려면 --dry-run 옵션을 제거하고 다시 실행하세요.\n');
    return;
  }
  
  // 삭제 확인
  console.log('='.repeat(60));
  console.log('⚠️  삭제 확인');
  console.log('='.repeat(60));
  console.log(`삭제할 예약 수: ${bookings.length}건`);
  console.log(`전화번호: ${INTERNAL_PHONES.join(', ')}`);
  console.log('');
  console.log('위 예약들을 삭제하시겠습니까?');
  console.log('(자동 실행 중...)');
  console.log('');
  
  // 예약 ID 목록 추출
  const bookingIds = bookings.map(b => b.id);
  
  // 삭제 실행
  console.log('🗑️  예약 삭제 중...');
  const { error: deleteError } = await supabase
    .from('bookings')
    .delete()
    .in('id', bookingIds);
  
  if (deleteError) {
    console.error('❌ 삭제 오류:', deleteError);
    process.exit(1);
  }
  
  console.log(`✅ 삭제 완료: ${bookings.length}건\n`);
  
  // 고객 정보도 확인 (해당 전화번호로 된 고객이 있는지)
  const { data: customers } = await supabase
    .from('customers')
    .select('id, name, phone, visit_count')
    .or(phoneConditions);
  
  if (customers && customers.length > 0) {
    console.log('📋 관련 고객 정보:');
    customers.forEach((c, i) => {
      console.log(`   ${i + 1}. ${c.name} (${c.phone}) - 방문 ${c.visit_count || 0}회`);
    });
    console.log('');
    console.log('💡 고객 정보도 삭제하시겠습니까? (수동으로 확인 후 삭제하세요)');
  }
  
  console.log('\n✅ 작업 완료!\n');
}

deleteInternalPhoneBookings()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('\n❌ 작업 실패:', err);
    process.exit(1);
  });








































