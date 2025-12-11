/**
 * 내부자 전화번호 010-4245-0013 예약 및 고객 삭제 스크립트
 * 
 * 010-4245-0013 전화번호로 된 모든 예약과 고객을 삭제합니다.
 * 
 * 사용법:
 * node scripts/delete-internal-42450013.js [--dry-run]
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

async function deleteInternal42450013() {
  const dryRun = process.argv.includes('--dry-run');
  const phone = '01042450013'; // 하이픈 제거
  
  console.log('🔍 내부자 전화번호 예약 및 고객 조회 중...\n');
  if (dryRun) {
    console.log('⚠️  DRY RUN 모드: 실제 삭제 없이 확인만 수행합니다.\n');
  }
  
  // 모든 형태의 전화번호로 조회
  const phoneConditions = `phone.eq.${phone},phone.eq.010-4245-0013`;
  
  // 고객 조회
  const { data: customers, error: customersError } = await supabase
    .from('customers')
    .select('id, name, phone, visit_count')
    .or(phoneConditions);
  
  if (customersError) {
    console.error('❌ 고객 조회 오류:', customersError);
    process.exit(1);
  }
  
  // 예약 조회
  const { data: bookings, error: bookingsError } = await supabase
    .from('bookings')
    .select('id, name, phone, date, time, service_type, status, attendance_status, created_at')
    .or(phoneConditions)
    .order('date', { ascending: true });
  
  if (bookingsError) {
    console.error('❌ 예약 조회 오류:', bookingsError);
    process.exit(1);
  }
  
  const customerCount = customers?.length || 0;
  const bookingCount = bookings?.length || 0;
  
  if (customerCount === 0 && bookingCount === 0) {
    console.log('✅ 해당 전화번호로 된 고객이나 예약이 없습니다.\n');
    return;
  }
  
  console.log(`📊 발견된 고객: ${customerCount}건\n`);
  if (customers && customers.length > 0) {
    customers.forEach((c, i) => {
      console.log(`${i + 1}. ID: ${c.id}`);
      console.log(`   이름: ${c.name}`);
      console.log(`   전화번호: ${c.phone}`);
      console.log(`   방문 횟수: ${c.visit_count || 0}회`);
      console.log('');
    });
  }
  
  console.log(`📊 발견된 예약: ${bookingCount}건\n`);
  if (bookings && bookings.length > 0) {
    bookings.forEach((b, i) => {
      console.log(`${i + 1}. ID: ${b.id}`);
      console.log(`   이름: ${b.name}`);
      console.log(`   전화번호: ${b.phone}`);
      console.log(`   날짜/시간: ${b.date} ${b.time}`);
      console.log(`   서비스: ${b.service_type || '-'}`);
      console.log(`   상태: ${b.status || '-'} / ${b.attendance_status || '-'}`);
      console.log(`   생성일: ${b.created_at}`);
      console.log('');
    });
  }
  
  if (dryRun) {
    console.log('💡 실제 삭제를 하려면 --dry-run 옵션을 제거하고 다시 실행하세요.\n');
    return;
  }
  
  // 삭제 확인
  console.log('='.repeat(60));
  console.log('⚠️  삭제 확인');
  console.log('='.repeat(60));
  console.log(`삭제할 고객 수: ${customerCount}건`);
  console.log(`삭제할 예약 수: ${bookingCount}건`);
  console.log(`전화번호: 010-4245-0013 (내부자)`);
  console.log('');
  console.log('위 고객과 예약을 삭제하시겠습니까?');
  console.log('(자동 실행 중...)');
  console.log('');
  
  let deletedCustomers = 0;
  let deletedBookings = 0;
  
  // 예약 먼저 삭제 (외래키 제약조건 방지)
  if (bookings && bookings.length > 0) {
    const bookingIds = bookings.map(b => b.id);
    console.log('🗑️  예약 삭제 중...');
    const { error: deleteBookingsError } = await supabase
      .from('bookings')
      .delete()
      .in('id', bookingIds);
    
    if (deleteBookingsError) {
      console.error('❌ 예약 삭제 오류:', deleteBookingsError);
    } else {
      deletedBookings = bookings.length;
      console.log(`✅ 예약 삭제 완료: ${deletedBookings}건\n`);
    }
  }
  
  // 고객 삭제
  if (customers && customers.length > 0) {
    const customerIds = customers.map(c => c.id);
    console.log('🗑️  고객 정보 삭제 중...');
    const { error: deleteCustomersError } = await supabase
      .from('customers')
      .delete()
      .in('id', customerIds);
    
    if (deleteCustomersError) {
      console.error('❌ 고객 삭제 오류:', deleteCustomersError);
    } else {
      deletedCustomers = customers.length;
      console.log(`✅ 고객 정보 삭제 완료: ${deletedCustomers}건\n`);
    }
  }
  
  console.log('='.repeat(60));
  console.log('📊 삭제 결과');
  console.log('='.repeat(60));
  console.log(`✅ 예약 삭제: ${deletedBookings}건`);
  console.log(`✅ 고객 삭제: ${deletedCustomers}건`);
  console.log('\n✅ 작업 완료!\n');
}

deleteInternal42450013()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('\n❌ 작업 실패:', err);
    process.exit(1);
  });







 * 내부자 전화번호 010-4245-0013 예약 및 고객 삭제 스크립트
 * 
 * 010-4245-0013 전화번호로 된 모든 예약과 고객을 삭제합니다.
 * 
 * 사용법:
 * node scripts/delete-internal-42450013.js [--dry-run]
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

async function deleteInternal42450013() {
  const dryRun = process.argv.includes('--dry-run');
  const phone = '01042450013'; // 하이픈 제거
  
  console.log('🔍 내부자 전화번호 예약 및 고객 조회 중...\n');
  if (dryRun) {
    console.log('⚠️  DRY RUN 모드: 실제 삭제 없이 확인만 수행합니다.\n');
  }
  
  // 모든 형태의 전화번호로 조회
  const phoneConditions = `phone.eq.${phone},phone.eq.010-4245-0013`;
  
  // 고객 조회
  const { data: customers, error: customersError } = await supabase
    .from('customers')
    .select('id, name, phone, visit_count')
    .or(phoneConditions);
  
  if (customersError) {
    console.error('❌ 고객 조회 오류:', customersError);
    process.exit(1);
  }
  
  // 예약 조회
  const { data: bookings, error: bookingsError } = await supabase
    .from('bookings')
    .select('id, name, phone, date, time, service_type, status, attendance_status, created_at')
    .or(phoneConditions)
    .order('date', { ascending: true });
  
  if (bookingsError) {
    console.error('❌ 예약 조회 오류:', bookingsError);
    process.exit(1);
  }
  
  const customerCount = customers?.length || 0;
  const bookingCount = bookings?.length || 0;
  
  if (customerCount === 0 && bookingCount === 0) {
    console.log('✅ 해당 전화번호로 된 고객이나 예약이 없습니다.\n');
    return;
  }
  
  console.log(`📊 발견된 고객: ${customerCount}건\n`);
  if (customers && customers.length > 0) {
    customers.forEach((c, i) => {
      console.log(`${i + 1}. ID: ${c.id}`);
      console.log(`   이름: ${c.name}`);
      console.log(`   전화번호: ${c.phone}`);
      console.log(`   방문 횟수: ${c.visit_count || 0}회`);
      console.log('');
    });
  }
  
  console.log(`📊 발견된 예약: ${bookingCount}건\n`);
  if (bookings && bookings.length > 0) {
    bookings.forEach((b, i) => {
      console.log(`${i + 1}. ID: ${b.id}`);
      console.log(`   이름: ${b.name}`);
      console.log(`   전화번호: ${b.phone}`);
      console.log(`   날짜/시간: ${b.date} ${b.time}`);
      console.log(`   서비스: ${b.service_type || '-'}`);
      console.log(`   상태: ${b.status || '-'} / ${b.attendance_status || '-'}`);
      console.log(`   생성일: ${b.created_at}`);
      console.log('');
    });
  }
  
  if (dryRun) {
    console.log('💡 실제 삭제를 하려면 --dry-run 옵션을 제거하고 다시 실행하세요.\n');
    return;
  }
  
  // 삭제 확인
  console.log('='.repeat(60));
  console.log('⚠️  삭제 확인');
  console.log('='.repeat(60));
  console.log(`삭제할 고객 수: ${customerCount}건`);
  console.log(`삭제할 예약 수: ${bookingCount}건`);
  console.log(`전화번호: 010-4245-0013 (내부자)`);
  console.log('');
  console.log('위 고객과 예약을 삭제하시겠습니까?');
  console.log('(자동 실행 중...)');
  console.log('');
  
  let deletedCustomers = 0;
  let deletedBookings = 0;
  
  // 예약 먼저 삭제 (외래키 제약조건 방지)
  if (bookings && bookings.length > 0) {
    const bookingIds = bookings.map(b => b.id);
    console.log('🗑️  예약 삭제 중...');
    const { error: deleteBookingsError } = await supabase
      .from('bookings')
      .delete()
      .in('id', bookingIds);
    
    if (deleteBookingsError) {
      console.error('❌ 예약 삭제 오류:', deleteBookingsError);
    } else {
      deletedBookings = bookings.length;
      console.log(`✅ 예약 삭제 완료: ${deletedBookings}건\n`);
    }
  }
  
  // 고객 삭제
  if (customers && customers.length > 0) {
    const customerIds = customers.map(c => c.id);
    console.log('🗑️  고객 정보 삭제 중...');
    const { error: deleteCustomersError } = await supabase
      .from('customers')
      .delete()
      .in('id', customerIds);
    
    if (deleteCustomersError) {
      console.error('❌ 고객 삭제 오류:', deleteCustomersError);
    } else {
      deletedCustomers = customers.length;
      console.log(`✅ 고객 정보 삭제 완료: ${deletedCustomers}건\n`);
    }
  }
  
  console.log('='.repeat(60));
  console.log('📊 삭제 결과');
  console.log('='.repeat(60));
  console.log(`✅ 예약 삭제: ${deletedBookings}건`);
  console.log(`✅ 고객 삭제: ${deletedCustomers}건`);
  console.log('\n✅ 작업 완료!\n');
}

deleteInternal42450013()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('\n❌ 작업 실패:', err);
    process.exit(1);
  });







 * 내부자 전화번호 010-4245-0013 예약 및 고객 삭제 스크립트
 * 
 * 010-4245-0013 전화번호로 된 모든 예약과 고객을 삭제합니다.
 * 
 * 사용법:
 * node scripts/delete-internal-42450013.js [--dry-run]
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

async function deleteInternal42450013() {
  const dryRun = process.argv.includes('--dry-run');
  const phone = '01042450013'; // 하이픈 제거
  
  console.log('🔍 내부자 전화번호 예약 및 고객 조회 중...\n');
  if (dryRun) {
    console.log('⚠️  DRY RUN 모드: 실제 삭제 없이 확인만 수행합니다.\n');
  }
  
  // 모든 형태의 전화번호로 조회
  const phoneConditions = `phone.eq.${phone},phone.eq.010-4245-0013`;
  
  // 고객 조회
  const { data: customers, error: customersError } = await supabase
    .from('customers')
    .select('id, name, phone, visit_count')
    .or(phoneConditions);
  
  if (customersError) {
    console.error('❌ 고객 조회 오류:', customersError);
    process.exit(1);
  }
  
  // 예약 조회
  const { data: bookings, error: bookingsError } = await supabase
    .from('bookings')
    .select('id, name, phone, date, time, service_type, status, attendance_status, created_at')
    .or(phoneConditions)
    .order('date', { ascending: true });
  
  if (bookingsError) {
    console.error('❌ 예약 조회 오류:', bookingsError);
    process.exit(1);
  }
  
  const customerCount = customers?.length || 0;
  const bookingCount = bookings?.length || 0;
  
  if (customerCount === 0 && bookingCount === 0) {
    console.log('✅ 해당 전화번호로 된 고객이나 예약이 없습니다.\n');
    return;
  }
  
  console.log(`📊 발견된 고객: ${customerCount}건\n`);
  if (customers && customers.length > 0) {
    customers.forEach((c, i) => {
      console.log(`${i + 1}. ID: ${c.id}`);
      console.log(`   이름: ${c.name}`);
      console.log(`   전화번호: ${c.phone}`);
      console.log(`   방문 횟수: ${c.visit_count || 0}회`);
      console.log('');
    });
  }
  
  console.log(`📊 발견된 예약: ${bookingCount}건\n`);
  if (bookings && bookings.length > 0) {
    bookings.forEach((b, i) => {
      console.log(`${i + 1}. ID: ${b.id}`);
      console.log(`   이름: ${b.name}`);
      console.log(`   전화번호: ${b.phone}`);
      console.log(`   날짜/시간: ${b.date} ${b.time}`);
      console.log(`   서비스: ${b.service_type || '-'}`);
      console.log(`   상태: ${b.status || '-'} / ${b.attendance_status || '-'}`);
      console.log(`   생성일: ${b.created_at}`);
      console.log('');
    });
  }
  
  if (dryRun) {
    console.log('💡 실제 삭제를 하려면 --dry-run 옵션을 제거하고 다시 실행하세요.\n');
    return;
  }
  
  // 삭제 확인
  console.log('='.repeat(60));
  console.log('⚠️  삭제 확인');
  console.log('='.repeat(60));
  console.log(`삭제할 고객 수: ${customerCount}건`);
  console.log(`삭제할 예약 수: ${bookingCount}건`);
  console.log(`전화번호: 010-4245-0013 (내부자)`);
  console.log('');
  console.log('위 고객과 예약을 삭제하시겠습니까?');
  console.log('(자동 실행 중...)');
  console.log('');
  
  let deletedCustomers = 0;
  let deletedBookings = 0;
  
  // 예약 먼저 삭제 (외래키 제약조건 방지)
  if (bookings && bookings.length > 0) {
    const bookingIds = bookings.map(b => b.id);
    console.log('🗑️  예약 삭제 중...');
    const { error: deleteBookingsError } = await supabase
      .from('bookings')
      .delete()
      .in('id', bookingIds);
    
    if (deleteBookingsError) {
      console.error('❌ 예약 삭제 오류:', deleteBookingsError);
    } else {
      deletedBookings = bookings.length;
      console.log(`✅ 예약 삭제 완료: ${deletedBookings}건\n`);
    }
  }
  
  // 고객 삭제
  if (customers && customers.length > 0) {
    const customerIds = customers.map(c => c.id);
    console.log('🗑️  고객 정보 삭제 중...');
    const { error: deleteCustomersError } = await supabase
      .from('customers')
      .delete()
      .in('id', customerIds);
    
    if (deleteCustomersError) {
      console.error('❌ 고객 삭제 오류:', deleteCustomersError);
    } else {
      deletedCustomers = customers.length;
      console.log(`✅ 고객 정보 삭제 완료: ${deletedCustomers}건\n`);
    }
  }
  
  console.log('='.repeat(60));
  console.log('📊 삭제 결과');
  console.log('='.repeat(60));
  console.log(`✅ 예약 삭제: ${deletedBookings}건`);
  console.log(`✅ 고객 삭제: ${deletedCustomers}건`);
  console.log('\n✅ 작업 완료!\n');
}

deleteInternal42450013()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('\n❌ 작업 실패:', err);
    process.exit(1);
  });







 * 내부자 전화번호 010-4245-0013 예약 및 고객 삭제 스크립트
 * 
 * 010-4245-0013 전화번호로 된 모든 예약과 고객을 삭제합니다.
 * 
 * 사용법:
 * node scripts/delete-internal-42450013.js [--dry-run]
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

async function deleteInternal42450013() {
  const dryRun = process.argv.includes('--dry-run');
  const phone = '01042450013'; // 하이픈 제거
  
  console.log('🔍 내부자 전화번호 예약 및 고객 조회 중...\n');
  if (dryRun) {
    console.log('⚠️  DRY RUN 모드: 실제 삭제 없이 확인만 수행합니다.\n');
  }
  
  // 모든 형태의 전화번호로 조회
  const phoneConditions = `phone.eq.${phone},phone.eq.010-4245-0013`;
  
  // 고객 조회
  const { data: customers, error: customersError } = await supabase
    .from('customers')
    .select('id, name, phone, visit_count')
    .or(phoneConditions);
  
  if (customersError) {
    console.error('❌ 고객 조회 오류:', customersError);
    process.exit(1);
  }
  
  // 예약 조회
  const { data: bookings, error: bookingsError } = await supabase
    .from('bookings')
    .select('id, name, phone, date, time, service_type, status, attendance_status, created_at')
    .or(phoneConditions)
    .order('date', { ascending: true });
  
  if (bookingsError) {
    console.error('❌ 예약 조회 오류:', bookingsError);
    process.exit(1);
  }
  
  const customerCount = customers?.length || 0;
  const bookingCount = bookings?.length || 0;
  
  if (customerCount === 0 && bookingCount === 0) {
    console.log('✅ 해당 전화번호로 된 고객이나 예약이 없습니다.\n');
    return;
  }
  
  console.log(`📊 발견된 고객: ${customerCount}건\n`);
  if (customers && customers.length > 0) {
    customers.forEach((c, i) => {
      console.log(`${i + 1}. ID: ${c.id}`);
      console.log(`   이름: ${c.name}`);
      console.log(`   전화번호: ${c.phone}`);
      console.log(`   방문 횟수: ${c.visit_count || 0}회`);
      console.log('');
    });
  }
  
  console.log(`📊 발견된 예약: ${bookingCount}건\n`);
  if (bookings && bookings.length > 0) {
    bookings.forEach((b, i) => {
      console.log(`${i + 1}. ID: ${b.id}`);
      console.log(`   이름: ${b.name}`);
      console.log(`   전화번호: ${b.phone}`);
      console.log(`   날짜/시간: ${b.date} ${b.time}`);
      console.log(`   서비스: ${b.service_type || '-'}`);
      console.log(`   상태: ${b.status || '-'} / ${b.attendance_status || '-'}`);
      console.log(`   생성일: ${b.created_at}`);
      console.log('');
    });
  }
  
  if (dryRun) {
    console.log('💡 실제 삭제를 하려면 --dry-run 옵션을 제거하고 다시 실행하세요.\n');
    return;
  }
  
  // 삭제 확인
  console.log('='.repeat(60));
  console.log('⚠️  삭제 확인');
  console.log('='.repeat(60));
  console.log(`삭제할 고객 수: ${customerCount}건`);
  console.log(`삭제할 예약 수: ${bookingCount}건`);
  console.log(`전화번호: 010-4245-0013 (내부자)`);
  console.log('');
  console.log('위 고객과 예약을 삭제하시겠습니까?');
  console.log('(자동 실행 중...)');
  console.log('');
  
  let deletedCustomers = 0;
  let deletedBookings = 0;
  
  // 예약 먼저 삭제 (외래키 제약조건 방지)
  if (bookings && bookings.length > 0) {
    const bookingIds = bookings.map(b => b.id);
    console.log('🗑️  예약 삭제 중...');
    const { error: deleteBookingsError } = await supabase
      .from('bookings')
      .delete()
      .in('id', bookingIds);
    
    if (deleteBookingsError) {
      console.error('❌ 예약 삭제 오류:', deleteBookingsError);
    } else {
      deletedBookings = bookings.length;
      console.log(`✅ 예약 삭제 완료: ${deletedBookings}건\n`);
    }
  }
  
  // 고객 삭제
  if (customers && customers.length > 0) {
    const customerIds = customers.map(c => c.id);
    console.log('🗑️  고객 정보 삭제 중...');
    const { error: deleteCustomersError } = await supabase
      .from('customers')
      .delete()
      .in('id', customerIds);
    
    if (deleteCustomersError) {
      console.error('❌ 고객 삭제 오류:', deleteCustomersError);
    } else {
      deletedCustomers = customers.length;
      console.log(`✅ 고객 정보 삭제 완료: ${deletedCustomers}건\n`);
    }
  }
  
  console.log('='.repeat(60));
  console.log('📊 삭제 결과');
  console.log('='.repeat(60));
  console.log(`✅ 예약 삭제: ${deletedBookings}건`);
  console.log(`✅ 고객 삭제: ${deletedCustomers}건`);
  console.log('\n✅ 작업 완료!\n');
}

deleteInternal42450013()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('\n❌ 작업 실패:', err);
    process.exit(1);
  });







 * 내부자 전화번호 010-4245-0013 예약 및 고객 삭제 스크립트
 * 
 * 010-4245-0013 전화번호로 된 모든 예약과 고객을 삭제합니다.
 * 
 * 사용법:
 * node scripts/delete-internal-42450013.js [--dry-run]
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

async function deleteInternal42450013() {
  const dryRun = process.argv.includes('--dry-run');
  const phone = '01042450013'; // 하이픈 제거
  
  console.log('🔍 내부자 전화번호 예약 및 고객 조회 중...\n');
  if (dryRun) {
    console.log('⚠️  DRY RUN 모드: 실제 삭제 없이 확인만 수행합니다.\n');
  }
  
  // 모든 형태의 전화번호로 조회
  const phoneConditions = `phone.eq.${phone},phone.eq.010-4245-0013`;
  
  // 고객 조회
  const { data: customers, error: customersError } = await supabase
    .from('customers')
    .select('id, name, phone, visit_count')
    .or(phoneConditions);
  
  if (customersError) {
    console.error('❌ 고객 조회 오류:', customersError);
    process.exit(1);
  }
  
  // 예약 조회
  const { data: bookings, error: bookingsError } = await supabase
    .from('bookings')
    .select('id, name, phone, date, time, service_type, status, attendance_status, created_at')
    .or(phoneConditions)
    .order('date', { ascending: true });
  
  if (bookingsError) {
    console.error('❌ 예약 조회 오류:', bookingsError);
    process.exit(1);
  }
  
  const customerCount = customers?.length || 0;
  const bookingCount = bookings?.length || 0;
  
  if (customerCount === 0 && bookingCount === 0) {
    console.log('✅ 해당 전화번호로 된 고객이나 예약이 없습니다.\n');
    return;
  }
  
  console.log(`📊 발견된 고객: ${customerCount}건\n`);
  if (customers && customers.length > 0) {
    customers.forEach((c, i) => {
      console.log(`${i + 1}. ID: ${c.id}`);
      console.log(`   이름: ${c.name}`);
      console.log(`   전화번호: ${c.phone}`);
      console.log(`   방문 횟수: ${c.visit_count || 0}회`);
      console.log('');
    });
  }
  
  console.log(`📊 발견된 예약: ${bookingCount}건\n`);
  if (bookings && bookings.length > 0) {
    bookings.forEach((b, i) => {
      console.log(`${i + 1}. ID: ${b.id}`);
      console.log(`   이름: ${b.name}`);
      console.log(`   전화번호: ${b.phone}`);
      console.log(`   날짜/시간: ${b.date} ${b.time}`);
      console.log(`   서비스: ${b.service_type || '-'}`);
      console.log(`   상태: ${b.status || '-'} / ${b.attendance_status || '-'}`);
      console.log(`   생성일: ${b.created_at}`);
      console.log('');
    });
  }
  
  if (dryRun) {
    console.log('💡 실제 삭제를 하려면 --dry-run 옵션을 제거하고 다시 실행하세요.\n');
    return;
  }
  
  // 삭제 확인
  console.log('='.repeat(60));
  console.log('⚠️  삭제 확인');
  console.log('='.repeat(60));
  console.log(`삭제할 고객 수: ${customerCount}건`);
  console.log(`삭제할 예약 수: ${bookingCount}건`);
  console.log(`전화번호: 010-4245-0013 (내부자)`);
  console.log('');
  console.log('위 고객과 예약을 삭제하시겠습니까?');
  console.log('(자동 실행 중...)');
  console.log('');
  
  let deletedCustomers = 0;
  let deletedBookings = 0;
  
  // 예약 먼저 삭제 (외래키 제약조건 방지)
  if (bookings && bookings.length > 0) {
    const bookingIds = bookings.map(b => b.id);
    console.log('🗑️  예약 삭제 중...');
    const { error: deleteBookingsError } = await supabase
      .from('bookings')
      .delete()
      .in('id', bookingIds);
    
    if (deleteBookingsError) {
      console.error('❌ 예약 삭제 오류:', deleteBookingsError);
    } else {
      deletedBookings = bookings.length;
      console.log(`✅ 예약 삭제 완료: ${deletedBookings}건\n`);
    }
  }
  
  // 고객 삭제
  if (customers && customers.length > 0) {
    const customerIds = customers.map(c => c.id);
    console.log('🗑️  고객 정보 삭제 중...');
    const { error: deleteCustomersError } = await supabase
      .from('customers')
      .delete()
      .in('id', customerIds);
    
    if (deleteCustomersError) {
      console.error('❌ 고객 삭제 오류:', deleteCustomersError);
    } else {
      deletedCustomers = customers.length;
      console.log(`✅ 고객 정보 삭제 완료: ${deletedCustomers}건\n`);
    }
  }
  
  console.log('='.repeat(60));
  console.log('📊 삭제 결과');
  console.log('='.repeat(60));
  console.log(`✅ 예약 삭제: ${deletedBookings}건`);
  console.log(`✅ 고객 삭제: ${deletedCustomers}건`);
  console.log('\n✅ 작업 완료!\n');
}

deleteInternal42450013()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('\n❌ 작업 실패:', err);
    process.exit(1);
  });














