/**
 * 박영만 고객 및 예약 추가 스크립트
 * 
 * 박영만 (010-3386-5860) 고객을 첫 방문 고객으로 추가하고
 * 2022년 3월 9일 예약을 추가합니다.
 * 
 * 사용법:
 * node scripts/add-park-young-man.js [--dry-run]
 * 
 * 옵션:
 *   --dry-run    실제 추가 없이 확인만 수행
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

async function addParkYoungMan() {
  const dryRun = process.argv.includes('--dry-run');
  
  const name = '박영만';
  const phone = '01033865860'; // 하이픈 제거
  const bookingDate = '2022-03-09';
  const bookingTime = '13:00'; // 기본 시간 (정확한 시간이 없으므로 오후 1시로 설정)
  
  console.log('🔍 박영만 고객 및 예약 추가 중...\n');
  if (dryRun) {
    console.log('⚠️  DRY RUN 모드: 실제 추가 없이 확인만 수행합니다.\n');
  }
  
  console.log('📋 추가할 정보:');
  console.log(`   이름: ${name}`);
  console.log(`   전화번호: ${phone}`);
  console.log(`   예약 날짜: ${bookingDate}`);
  console.log(`   예약 시간: ${bookingTime}`);
  console.log('');
  
  // 기존 고객 확인
  const { data: existingCustomers, error: customerCheckError } = await supabase
    .from('customers')
    .select('*')
    .eq('phone', phone);
  
  if (customerCheckError) {
    console.error('❌ 고객 조회 오류:', customerCheckError);
    process.exit(1);
  }
  
  // 기존 예약 확인
  const { data: existingBookings, error: bookingCheckError } = await supabase
    .from('bookings')
    .select('*')
    .eq('phone', phone)
    .eq('date', bookingDate);
  
  if (bookingCheckError) {
    console.error('❌ 예약 조회 오류:', bookingCheckError);
    process.exit(1);
  }
  
  if (existingCustomers && existingCustomers.length > 0) {
    console.log('⚠️  이미 존재하는 고객:');
    existingCustomers.forEach(c => {
      console.log(`   ID: ${c.id}, 이름: ${c.name}, 방문: ${c.visit_count || 0}회`);
    });
    console.log('');
    console.log('💡 기존 고객이 있지만 첫 방문 고객으로 처리하라고 하셨으므로 업데이트합니다.');
    console.log('');
  }
  
  if (existingBookings && existingBookings.length > 0) {
    console.log('⚠️  이미 존재하는 예약:');
    existingBookings.forEach(b => {
      console.log(`   ID: ${b.id}, 날짜: ${b.date}, 시간: ${b.time}`);
    });
    console.log('');
    console.log('💡 기존 예약이 있지만 추가하라고 하셨으므로 중복 확인 후 추가합니다.');
    console.log('');
  }
  
  if (dryRun) {
    console.log('💡 실제 추가를 하려면 --dry-run 옵션을 제거하고 다시 실행하세요.\n');
    return;
  }
  
  let customerId = null;
  
  // 고객 추가 또는 업데이트
  if (existingCustomers && existingCustomers.length > 0) {
    // 기존 고객 업데이트 (첫 방문 고객으로 설정)
    customerId = existingCustomers[0].id;
    console.log('📝 고객 정보 업데이트 중...');
    const { error: updateError } = await supabase
      .from('customers')
      .update({
        name: name,
        visit_count: 1,
        last_visit_date: bookingDate,
        first_inquiry_date: bookingDate,
      })
      .eq('id', customerId);
    
    if (updateError) {
      console.error('❌ 고객 업데이트 오류:', updateError);
      process.exit(1);
    }
    console.log(`✅ 고객 정보 업데이트 완료: ID ${customerId}\n`);
  } else {
    // 새 고객 추가
    console.log('➕ 새 고객 추가 중...');
    const { data: newCustomer, error: insertError } = await supabase
      .from('customers')
      .insert({
        name: name,
        phone: phone,
        visit_count: 1,
        last_visit_date: bookingDate,
        first_inquiry_date: bookingDate,
      })
      .select('id')
      .single();
    
    if (insertError) {
      console.error('❌ 고객 추가 오류:', insertError);
      process.exit(1);
    }
    
    customerId = newCustomer.id;
    console.log(`✅ 고객 추가 완료: ID ${customerId}\n`);
  }
  
  // 예약 추가 (중복 확인)
  if (existingBookings && existingBookings.length > 0) {
    console.log('⚠️  해당 날짜에 이미 예약이 있습니다. 중복 추가를 건너뜁니다.');
    console.log('');
  } else {
    console.log('➕ 예약 추가 중...');
    const { error: bookingInsertError } = await supabase
      .from('bookings')
      .insert({
        name: name,
        phone: phone,
        date: bookingDate,
        time: bookingTime,
        service_type: '마쓰구 드라이버 시타 서비스', // 기본 서비스 타입
        location: 'Massgoo Studio',
        duration: 60, // 기본 1시간
        status: 'completed', // 과거 예약이므로 완료로 설정
        attendance_status: 'attended', // 참석으로 설정
        club: '', // NOT NULL 제약조건
        created_at: new Date().toISOString(),
      });
    
    if (bookingInsertError) {
      console.error('❌ 예약 추가 오류:', bookingInsertError);
      process.exit(1);
    }
    console.log('✅ 예약 추가 완료\n');
  }
  
  console.log('='.repeat(60));
  console.log('📊 추가 결과');
  console.log('='.repeat(60));
  console.log(`✅ 고객 ID: ${customerId}`);
  console.log(`✅ 예약 날짜: ${bookingDate} ${bookingTime}`);
  console.log('\n✅ 작업 완료!\n');
}

addParkYoungMan()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('\n❌ 작업 실패:', err);
    process.exit(1);
  });







 * 박영만 고객 및 예약 추가 스크립트
 * 
 * 박영만 (010-3386-5860) 고객을 첫 방문 고객으로 추가하고
 * 2022년 3월 9일 예약을 추가합니다.
 * 
 * 사용법:
 * node scripts/add-park-young-man.js [--dry-run]
 * 
 * 옵션:
 *   --dry-run    실제 추가 없이 확인만 수행
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

async function addParkYoungMan() {
  const dryRun = process.argv.includes('--dry-run');
  
  const name = '박영만';
  const phone = '01033865860'; // 하이픈 제거
  const bookingDate = '2022-03-09';
  const bookingTime = '13:00'; // 기본 시간 (정확한 시간이 없으므로 오후 1시로 설정)
  
  console.log('🔍 박영만 고객 및 예약 추가 중...\n');
  if (dryRun) {
    console.log('⚠️  DRY RUN 모드: 실제 추가 없이 확인만 수행합니다.\n');
  }
  
  console.log('📋 추가할 정보:');
  console.log(`   이름: ${name}`);
  console.log(`   전화번호: ${phone}`);
  console.log(`   예약 날짜: ${bookingDate}`);
  console.log(`   예약 시간: ${bookingTime}`);
  console.log('');
  
  // 기존 고객 확인
  const { data: existingCustomers, error: customerCheckError } = await supabase
    .from('customers')
    .select('*')
    .eq('phone', phone);
  
  if (customerCheckError) {
    console.error('❌ 고객 조회 오류:', customerCheckError);
    process.exit(1);
  }
  
  // 기존 예약 확인
  const { data: existingBookings, error: bookingCheckError } = await supabase
    .from('bookings')
    .select('*')
    .eq('phone', phone)
    .eq('date', bookingDate);
  
  if (bookingCheckError) {
    console.error('❌ 예약 조회 오류:', bookingCheckError);
    process.exit(1);
  }
  
  if (existingCustomers && existingCustomers.length > 0) {
    console.log('⚠️  이미 존재하는 고객:');
    existingCustomers.forEach(c => {
      console.log(`   ID: ${c.id}, 이름: ${c.name}, 방문: ${c.visit_count || 0}회`);
    });
    console.log('');
    console.log('💡 기존 고객이 있지만 첫 방문 고객으로 처리하라고 하셨으므로 업데이트합니다.');
    console.log('');
  }
  
  if (existingBookings && existingBookings.length > 0) {
    console.log('⚠️  이미 존재하는 예약:');
    existingBookings.forEach(b => {
      console.log(`   ID: ${b.id}, 날짜: ${b.date}, 시간: ${b.time}`);
    });
    console.log('');
    console.log('💡 기존 예약이 있지만 추가하라고 하셨으므로 중복 확인 후 추가합니다.');
    console.log('');
  }
  
  if (dryRun) {
    console.log('💡 실제 추가를 하려면 --dry-run 옵션을 제거하고 다시 실행하세요.\n');
    return;
  }
  
  let customerId = null;
  
  // 고객 추가 또는 업데이트
  if (existingCustomers && existingCustomers.length > 0) {
    // 기존 고객 업데이트 (첫 방문 고객으로 설정)
    customerId = existingCustomers[0].id;
    console.log('📝 고객 정보 업데이트 중...');
    const { error: updateError } = await supabase
      .from('customers')
      .update({
        name: name,
        visit_count: 1,
        last_visit_date: bookingDate,
        first_inquiry_date: bookingDate,
      })
      .eq('id', customerId);
    
    if (updateError) {
      console.error('❌ 고객 업데이트 오류:', updateError);
      process.exit(1);
    }
    console.log(`✅ 고객 정보 업데이트 완료: ID ${customerId}\n`);
  } else {
    // 새 고객 추가
    console.log('➕ 새 고객 추가 중...');
    const { data: newCustomer, error: insertError } = await supabase
      .from('customers')
      .insert({
        name: name,
        phone: phone,
        visit_count: 1,
        last_visit_date: bookingDate,
        first_inquiry_date: bookingDate,
      })
      .select('id')
      .single();
    
    if (insertError) {
      console.error('❌ 고객 추가 오류:', insertError);
      process.exit(1);
    }
    
    customerId = newCustomer.id;
    console.log(`✅ 고객 추가 완료: ID ${customerId}\n`);
  }
  
  // 예약 추가 (중복 확인)
  if (existingBookings && existingBookings.length > 0) {
    console.log('⚠️  해당 날짜에 이미 예약이 있습니다. 중복 추가를 건너뜁니다.');
    console.log('');
  } else {
    console.log('➕ 예약 추가 중...');
    const { error: bookingInsertError } = await supabase
      .from('bookings')
      .insert({
        name: name,
        phone: phone,
        date: bookingDate,
        time: bookingTime,
        service_type: '마쓰구 드라이버 시타 서비스', // 기본 서비스 타입
        location: 'Massgoo Studio',
        duration: 60, // 기본 1시간
        status: 'completed', // 과거 예약이므로 완료로 설정
        attendance_status: 'attended', // 참석으로 설정
        club: '', // NOT NULL 제약조건
        created_at: new Date().toISOString(),
      });
    
    if (bookingInsertError) {
      console.error('❌ 예약 추가 오류:', bookingInsertError);
      process.exit(1);
    }
    console.log('✅ 예약 추가 완료\n');
  }
  
  console.log('='.repeat(60));
  console.log('📊 추가 결과');
  console.log('='.repeat(60));
  console.log(`✅ 고객 ID: ${customerId}`);
  console.log(`✅ 예약 날짜: ${bookingDate} ${bookingTime}`);
  console.log('\n✅ 작업 완료!\n');
}

addParkYoungMan()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('\n❌ 작업 실패:', err);
    process.exit(1);
  });







 * 박영만 고객 및 예약 추가 스크립트
 * 
 * 박영만 (010-3386-5860) 고객을 첫 방문 고객으로 추가하고
 * 2022년 3월 9일 예약을 추가합니다.
 * 
 * 사용법:
 * node scripts/add-park-young-man.js [--dry-run]
 * 
 * 옵션:
 *   --dry-run    실제 추가 없이 확인만 수행
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

async function addParkYoungMan() {
  const dryRun = process.argv.includes('--dry-run');
  
  const name = '박영만';
  const phone = '01033865860'; // 하이픈 제거
  const bookingDate = '2022-03-09';
  const bookingTime = '13:00'; // 기본 시간 (정확한 시간이 없으므로 오후 1시로 설정)
  
  console.log('🔍 박영만 고객 및 예약 추가 중...\n');
  if (dryRun) {
    console.log('⚠️  DRY RUN 모드: 실제 추가 없이 확인만 수행합니다.\n');
  }
  
  console.log('📋 추가할 정보:');
  console.log(`   이름: ${name}`);
  console.log(`   전화번호: ${phone}`);
  console.log(`   예약 날짜: ${bookingDate}`);
  console.log(`   예약 시간: ${bookingTime}`);
  console.log('');
  
  // 기존 고객 확인
  const { data: existingCustomers, error: customerCheckError } = await supabase
    .from('customers')
    .select('*')
    .eq('phone', phone);
  
  if (customerCheckError) {
    console.error('❌ 고객 조회 오류:', customerCheckError);
    process.exit(1);
  }
  
  // 기존 예약 확인
  const { data: existingBookings, error: bookingCheckError } = await supabase
    .from('bookings')
    .select('*')
    .eq('phone', phone)
    .eq('date', bookingDate);
  
  if (bookingCheckError) {
    console.error('❌ 예약 조회 오류:', bookingCheckError);
    process.exit(1);
  }
  
  if (existingCustomers && existingCustomers.length > 0) {
    console.log('⚠️  이미 존재하는 고객:');
    existingCustomers.forEach(c => {
      console.log(`   ID: ${c.id}, 이름: ${c.name}, 방문: ${c.visit_count || 0}회`);
    });
    console.log('');
    console.log('💡 기존 고객이 있지만 첫 방문 고객으로 처리하라고 하셨으므로 업데이트합니다.');
    console.log('');
  }
  
  if (existingBookings && existingBookings.length > 0) {
    console.log('⚠️  이미 존재하는 예약:');
    existingBookings.forEach(b => {
      console.log(`   ID: ${b.id}, 날짜: ${b.date}, 시간: ${b.time}`);
    });
    console.log('');
    console.log('💡 기존 예약이 있지만 추가하라고 하셨으므로 중복 확인 후 추가합니다.');
    console.log('');
  }
  
  if (dryRun) {
    console.log('💡 실제 추가를 하려면 --dry-run 옵션을 제거하고 다시 실행하세요.\n');
    return;
  }
  
  let customerId = null;
  
  // 고객 추가 또는 업데이트
  if (existingCustomers && existingCustomers.length > 0) {
    // 기존 고객 업데이트 (첫 방문 고객으로 설정)
    customerId = existingCustomers[0].id;
    console.log('📝 고객 정보 업데이트 중...');
    const { error: updateError } = await supabase
      .from('customers')
      .update({
        name: name,
        visit_count: 1,
        last_visit_date: bookingDate,
        first_inquiry_date: bookingDate,
      })
      .eq('id', customerId);
    
    if (updateError) {
      console.error('❌ 고객 업데이트 오류:', updateError);
      process.exit(1);
    }
    console.log(`✅ 고객 정보 업데이트 완료: ID ${customerId}\n`);
  } else {
    // 새 고객 추가
    console.log('➕ 새 고객 추가 중...');
    const { data: newCustomer, error: insertError } = await supabase
      .from('customers')
      .insert({
        name: name,
        phone: phone,
        visit_count: 1,
        last_visit_date: bookingDate,
        first_inquiry_date: bookingDate,
      })
      .select('id')
      .single();
    
    if (insertError) {
      console.error('❌ 고객 추가 오류:', insertError);
      process.exit(1);
    }
    
    customerId = newCustomer.id;
    console.log(`✅ 고객 추가 완료: ID ${customerId}\n`);
  }
  
  // 예약 추가 (중복 확인)
  if (existingBookings && existingBookings.length > 0) {
    console.log('⚠️  해당 날짜에 이미 예약이 있습니다. 중복 추가를 건너뜁니다.');
    console.log('');
  } else {
    console.log('➕ 예약 추가 중...');
    const { error: bookingInsertError } = await supabase
      .from('bookings')
      .insert({
        name: name,
        phone: phone,
        date: bookingDate,
        time: bookingTime,
        service_type: '마쓰구 드라이버 시타 서비스', // 기본 서비스 타입
        location: 'Massgoo Studio',
        duration: 60, // 기본 1시간
        status: 'completed', // 과거 예약이므로 완료로 설정
        attendance_status: 'attended', // 참석으로 설정
        club: '', // NOT NULL 제약조건
        created_at: new Date().toISOString(),
      });
    
    if (bookingInsertError) {
      console.error('❌ 예약 추가 오류:', bookingInsertError);
      process.exit(1);
    }
    console.log('✅ 예약 추가 완료\n');
  }
  
  console.log('='.repeat(60));
  console.log('📊 추가 결과');
  console.log('='.repeat(60));
  console.log(`✅ 고객 ID: ${customerId}`);
  console.log(`✅ 예약 날짜: ${bookingDate} ${bookingTime}`);
  console.log('\n✅ 작업 완료!\n');
}

addParkYoungMan()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('\n❌ 작업 실패:', err);
    process.exit(1);
  });







 * 박영만 고객 및 예약 추가 스크립트
 * 
 * 박영만 (010-3386-5860) 고객을 첫 방문 고객으로 추가하고
 * 2022년 3월 9일 예약을 추가합니다.
 * 
 * 사용법:
 * node scripts/add-park-young-man.js [--dry-run]
 * 
 * 옵션:
 *   --dry-run    실제 추가 없이 확인만 수행
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

async function addParkYoungMan() {
  const dryRun = process.argv.includes('--dry-run');
  
  const name = '박영만';
  const phone = '01033865860'; // 하이픈 제거
  const bookingDate = '2022-03-09';
  const bookingTime = '13:00'; // 기본 시간 (정확한 시간이 없으므로 오후 1시로 설정)
  
  console.log('🔍 박영만 고객 및 예약 추가 중...\n');
  if (dryRun) {
    console.log('⚠️  DRY RUN 모드: 실제 추가 없이 확인만 수행합니다.\n');
  }
  
  console.log('📋 추가할 정보:');
  console.log(`   이름: ${name}`);
  console.log(`   전화번호: ${phone}`);
  console.log(`   예약 날짜: ${bookingDate}`);
  console.log(`   예약 시간: ${bookingTime}`);
  console.log('');
  
  // 기존 고객 확인
  const { data: existingCustomers, error: customerCheckError } = await supabase
    .from('customers')
    .select('*')
    .eq('phone', phone);
  
  if (customerCheckError) {
    console.error('❌ 고객 조회 오류:', customerCheckError);
    process.exit(1);
  }
  
  // 기존 예약 확인
  const { data: existingBookings, error: bookingCheckError } = await supabase
    .from('bookings')
    .select('*')
    .eq('phone', phone)
    .eq('date', bookingDate);
  
  if (bookingCheckError) {
    console.error('❌ 예약 조회 오류:', bookingCheckError);
    process.exit(1);
  }
  
  if (existingCustomers && existingCustomers.length > 0) {
    console.log('⚠️  이미 존재하는 고객:');
    existingCustomers.forEach(c => {
      console.log(`   ID: ${c.id}, 이름: ${c.name}, 방문: ${c.visit_count || 0}회`);
    });
    console.log('');
    console.log('💡 기존 고객이 있지만 첫 방문 고객으로 처리하라고 하셨으므로 업데이트합니다.');
    console.log('');
  }
  
  if (existingBookings && existingBookings.length > 0) {
    console.log('⚠️  이미 존재하는 예약:');
    existingBookings.forEach(b => {
      console.log(`   ID: ${b.id}, 날짜: ${b.date}, 시간: ${b.time}`);
    });
    console.log('');
    console.log('💡 기존 예약이 있지만 추가하라고 하셨으므로 중복 확인 후 추가합니다.');
    console.log('');
  }
  
  if (dryRun) {
    console.log('💡 실제 추가를 하려면 --dry-run 옵션을 제거하고 다시 실행하세요.\n');
    return;
  }
  
  let customerId = null;
  
  // 고객 추가 또는 업데이트
  if (existingCustomers && existingCustomers.length > 0) {
    // 기존 고객 업데이트 (첫 방문 고객으로 설정)
    customerId = existingCustomers[0].id;
    console.log('📝 고객 정보 업데이트 중...');
    const { error: updateError } = await supabase
      .from('customers')
      .update({
        name: name,
        visit_count: 1,
        last_visit_date: bookingDate,
        first_inquiry_date: bookingDate,
      })
      .eq('id', customerId);
    
    if (updateError) {
      console.error('❌ 고객 업데이트 오류:', updateError);
      process.exit(1);
    }
    console.log(`✅ 고객 정보 업데이트 완료: ID ${customerId}\n`);
  } else {
    // 새 고객 추가
    console.log('➕ 새 고객 추가 중...');
    const { data: newCustomer, error: insertError } = await supabase
      .from('customers')
      .insert({
        name: name,
        phone: phone,
        visit_count: 1,
        last_visit_date: bookingDate,
        first_inquiry_date: bookingDate,
      })
      .select('id')
      .single();
    
    if (insertError) {
      console.error('❌ 고객 추가 오류:', insertError);
      process.exit(1);
    }
    
    customerId = newCustomer.id;
    console.log(`✅ 고객 추가 완료: ID ${customerId}\n`);
  }
  
  // 예약 추가 (중복 확인)
  if (existingBookings && existingBookings.length > 0) {
    console.log('⚠️  해당 날짜에 이미 예약이 있습니다. 중복 추가를 건너뜁니다.');
    console.log('');
  } else {
    console.log('➕ 예약 추가 중...');
    const { error: bookingInsertError } = await supabase
      .from('bookings')
      .insert({
        name: name,
        phone: phone,
        date: bookingDate,
        time: bookingTime,
        service_type: '마쓰구 드라이버 시타 서비스', // 기본 서비스 타입
        location: 'Massgoo Studio',
        duration: 60, // 기본 1시간
        status: 'completed', // 과거 예약이므로 완료로 설정
        attendance_status: 'attended', // 참석으로 설정
        club: '', // NOT NULL 제약조건
        created_at: new Date().toISOString(),
      });
    
    if (bookingInsertError) {
      console.error('❌ 예약 추가 오류:', bookingInsertError);
      process.exit(1);
    }
    console.log('✅ 예약 추가 완료\n');
  }
  
  console.log('='.repeat(60));
  console.log('📊 추가 결과');
  console.log('='.repeat(60));
  console.log(`✅ 고객 ID: ${customerId}`);
  console.log(`✅ 예약 날짜: ${bookingDate} ${bookingTime}`);
  console.log('\n✅ 작업 완료!\n');
}

addParkYoungMan()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('\n❌ 작업 실패:', err);
    process.exit(1);
  });







 * 박영만 고객 및 예약 추가 스크립트
 * 
 * 박영만 (010-3386-5860) 고객을 첫 방문 고객으로 추가하고
 * 2022년 3월 9일 예약을 추가합니다.
 * 
 * 사용법:
 * node scripts/add-park-young-man.js [--dry-run]
 * 
 * 옵션:
 *   --dry-run    실제 추가 없이 확인만 수행
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

async function addParkYoungMan() {
  const dryRun = process.argv.includes('--dry-run');
  
  const name = '박영만';
  const phone = '01033865860'; // 하이픈 제거
  const bookingDate = '2022-03-09';
  const bookingTime = '13:00'; // 기본 시간 (정확한 시간이 없으므로 오후 1시로 설정)
  
  console.log('🔍 박영만 고객 및 예약 추가 중...\n');
  if (dryRun) {
    console.log('⚠️  DRY RUN 모드: 실제 추가 없이 확인만 수행합니다.\n');
  }
  
  console.log('📋 추가할 정보:');
  console.log(`   이름: ${name}`);
  console.log(`   전화번호: ${phone}`);
  console.log(`   예약 날짜: ${bookingDate}`);
  console.log(`   예약 시간: ${bookingTime}`);
  console.log('');
  
  // 기존 고객 확인
  const { data: existingCustomers, error: customerCheckError } = await supabase
    .from('customers')
    .select('*')
    .eq('phone', phone);
  
  if (customerCheckError) {
    console.error('❌ 고객 조회 오류:', customerCheckError);
    process.exit(1);
  }
  
  // 기존 예약 확인
  const { data: existingBookings, error: bookingCheckError } = await supabase
    .from('bookings')
    .select('*')
    .eq('phone', phone)
    .eq('date', bookingDate);
  
  if (bookingCheckError) {
    console.error('❌ 예약 조회 오류:', bookingCheckError);
    process.exit(1);
  }
  
  if (existingCustomers && existingCustomers.length > 0) {
    console.log('⚠️  이미 존재하는 고객:');
    existingCustomers.forEach(c => {
      console.log(`   ID: ${c.id}, 이름: ${c.name}, 방문: ${c.visit_count || 0}회`);
    });
    console.log('');
    console.log('💡 기존 고객이 있지만 첫 방문 고객으로 처리하라고 하셨으므로 업데이트합니다.');
    console.log('');
  }
  
  if (existingBookings && existingBookings.length > 0) {
    console.log('⚠️  이미 존재하는 예약:');
    existingBookings.forEach(b => {
      console.log(`   ID: ${b.id}, 날짜: ${b.date}, 시간: ${b.time}`);
    });
    console.log('');
    console.log('💡 기존 예약이 있지만 추가하라고 하셨으므로 중복 확인 후 추가합니다.');
    console.log('');
  }
  
  if (dryRun) {
    console.log('💡 실제 추가를 하려면 --dry-run 옵션을 제거하고 다시 실행하세요.\n');
    return;
  }
  
  let customerId = null;
  
  // 고객 추가 또는 업데이트
  if (existingCustomers && existingCustomers.length > 0) {
    // 기존 고객 업데이트 (첫 방문 고객으로 설정)
    customerId = existingCustomers[0].id;
    console.log('📝 고객 정보 업데이트 중...');
    const { error: updateError } = await supabase
      .from('customers')
      .update({
        name: name,
        visit_count: 1,
        last_visit_date: bookingDate,
        first_inquiry_date: bookingDate,
      })
      .eq('id', customerId);
    
    if (updateError) {
      console.error('❌ 고객 업데이트 오류:', updateError);
      process.exit(1);
    }
    console.log(`✅ 고객 정보 업데이트 완료: ID ${customerId}\n`);
  } else {
    // 새 고객 추가
    console.log('➕ 새 고객 추가 중...');
    const { data: newCustomer, error: insertError } = await supabase
      .from('customers')
      .insert({
        name: name,
        phone: phone,
        visit_count: 1,
        last_visit_date: bookingDate,
        first_inquiry_date: bookingDate,
      })
      .select('id')
      .single();
    
    if (insertError) {
      console.error('❌ 고객 추가 오류:', insertError);
      process.exit(1);
    }
    
    customerId = newCustomer.id;
    console.log(`✅ 고객 추가 완료: ID ${customerId}\n`);
  }
  
  // 예약 추가 (중복 확인)
  if (existingBookings && existingBookings.length > 0) {
    console.log('⚠️  해당 날짜에 이미 예약이 있습니다. 중복 추가를 건너뜁니다.');
    console.log('');
  } else {
    console.log('➕ 예약 추가 중...');
    const { error: bookingInsertError } = await supabase
      .from('bookings')
      .insert({
        name: name,
        phone: phone,
        date: bookingDate,
        time: bookingTime,
        service_type: '마쓰구 드라이버 시타 서비스', // 기본 서비스 타입
        location: 'Massgoo Studio',
        duration: 60, // 기본 1시간
        status: 'completed', // 과거 예약이므로 완료로 설정
        attendance_status: 'attended', // 참석으로 설정
        club: '', // NOT NULL 제약조건
        created_at: new Date().toISOString(),
      });
    
    if (bookingInsertError) {
      console.error('❌ 예약 추가 오류:', bookingInsertError);
      process.exit(1);
    }
    console.log('✅ 예약 추가 완료\n');
  }
  
  console.log('='.repeat(60));
  console.log('📊 추가 결과');
  console.log('='.repeat(60));
  console.log(`✅ 고객 ID: ${customerId}`);
  console.log(`✅ 예약 날짜: ${bookingDate} ${bookingTime}`);
  console.log('\n✅ 작업 완료!\n');
}

addParkYoungMan()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('\n❌ 작업 실패:', err);
    process.exit(1);
  });


















