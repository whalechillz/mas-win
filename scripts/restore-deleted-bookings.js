/**
 * 삭제된 실제 예약 복구 스크립트
 * 
 * 010-4245-0013 전화번호로 삭제된 예약 중 실제 예약 9건을 복구합니다.
 * 
 * 사용법:
 * node scripts/restore-deleted-bookings.js [--dry-run]
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

// 복구할 예약 목록 (삭제 전 확인한 정보)
const bookingsToRestore = [
  {
    name: '이남구',
    phone: '01042450013',
    date: '2020-09-23',
    time: '10:30',
    service_type: '마쓰구 드라이버 시타 서비스',
    status: 'confirmed',
    attendance_status: 'pending',
  },
  {
    name: '이겸주AS',
    phone: '01042450013',
    date: '2021-04-23',
    time: '16:00',
    service_type: '마쓰구 드라이버 시타 서비스',
    status: 'confirmed',
    attendance_status: 'pending',
    is_as_visit: true,
    original_name: '이겸주AS',
  },
  {
    name: '강희재AS',
    phone: '01042450013',
    date: '2022-02-08',
    time: '15:00',
    service_type: '마쓰구 드라이버 시타 서비스',
    status: 'confirmed',
    attendance_status: 'attended',
    is_as_visit: true,
    original_name: '강희재AS',
  },
  {
    name: '박용호AS',
    phone: '01042450013',
    date: '2022-02-08',
    time: '16:00',
    service_type: '마쓰구 드라이버 시타 서비스',
    status: 'confirmed',
    attendance_status: 'pending',
    is_as_visit: true,
    original_name: ' 박용호AS', // 앞에 공백 있음
  },
  {
    name: '이정립',
    phone: '01042450013',
    date: '2022-02-22',
    time: '14:00',
    service_type: '마쓰구 드라이버 시타 서비스',
    status: 'confirmed',
    attendance_status: 'pending',
  },
  {
    name: '허영이',
    phone: '01042450013',
    date: '2022-02-23',
    time: '14:30',
    service_type: '마쓰구 드라이버 시타 서비스',
    status: 'confirmed',
    attendance_status: 'attended',
  },
  {
    name: '홍준표',
    phone: '01042450013',
    date: '2022-02-23',
    time: '11:00',
    service_type: '마쓰구 드라이버 시타 서비스',
    status: 'confirmed',
    attendance_status: 'attended',
  },
  {
    name: '시타예약',
    phone: '01042450013',
    date: '2022-02-25',
    time: '15:00',
    service_type: '마쓰구 드라이버 시타 서비스',
    status: 'confirmed',
    attendance_status: 'attended',
  },
  {
    name: '김영식',
    phone: '01042450013',
    date: '2022-03-03',
    time: '14:00',
    service_type: '마쓰구 드라이버 시타 서비스',
    status: 'confirmed',
    attendance_status: 'attended',
  },
];

async function restoreDeletedBookings() {
  const dryRun = process.argv.includes('--dry-run');
  
  console.log('🔍 삭제된 예약 복구 중...\n');
  if (dryRun) {
    console.log('⚠️  DRY RUN 모드: 실제 추가 없이 확인만 수행합니다.\n');
  }
  
  console.log(`📋 복구할 예약: ${bookingsToRestore.length}건\n`);
  
  // 각 예약 정보 출력
  bookingsToRestore.forEach((b, i) => {
    console.log(`${i + 1}. ${b.name}`);
    console.log(`   날짜/시간: ${b.date} ${b.time}`);
    console.log(`   상태: ${b.status} / ${b.attendance_status}`);
    if (b.is_as_visit) {
      console.log(`   AS 방문: 예`);
    }
    console.log('');
  });
  
  if (dryRun) {
    console.log('💡 실제 복구를 하려면 --dry-run 옵션을 제거하고 다시 실행하세요.\n');
    return;
  }
  
  const results = {
    restored: [],
    errors: [],
  };
  
  // 각 예약 복구
  for (const booking of bookingsToRestore) {
    try {
      // 중복 확인
      const { data: existing } = await supabase
        .from('bookings')
        .select('id')
        .eq('phone', booking.phone)
        .eq('date', booking.date)
        .eq('time', booking.time)
        .single();
      
      if (existing) {
        console.log(`⚠️  이미 존재하는 예약: ${booking.name} (${booking.date} ${booking.time})`);
        continue;
      }
      
      // 예약 추가
      const bookingData = {
        name: booking.name.trim(), // 공백 제거
        phone: booking.phone,
        date: booking.date,
        time: booking.time,
        service_type: booking.service_type,
        location: 'Massgoo Studio',
        duration: 60,
        status: booking.status,
        attendance_status: booking.attendance_status,
        club: '', // NOT NULL 제약조건
        is_as_visit: booking.is_as_visit || false,
        original_name: booking.original_name || booking.name.trim(),
        notes: '삭제된 예약 복구',
        created_at: new Date().toISOString(),
      };
      
      const { data: inserted, error: insertError } = await supabase
        .from('bookings')
        .insert(bookingData)
        .select('id')
        .single();
      
      if (insertError) {
        throw insertError;
      }
      
      results.restored.push({
        id: inserted.id,
        name: booking.name,
        date: booking.date,
        time: booking.time,
      });
      
      console.log(`✅ 복구 완료: ${booking.name} (${booking.date} ${booking.time})`);
      
    } catch (error) {
      console.error(`❌ 복구 실패: ${booking.name}`, error.message);
      results.errors.push({
        name: booking.name,
        error: error.message,
      });
    }
  }
  
  // 고객 정보 확인 및 업데이트
  console.log('\n📝 고객 정보 확인 중...');
  const uniqueNames = [...new Set(bookingsToRestore.map(b => {
    // AS 제거하고 기본 이름 추출
    let name = b.name.trim();
    if (name.includes('AS')) {
      name = name.replace(/AS/g, '').trim();
    }
    return name;
  }))];
  
  console.log(`고유 고객명: ${uniqueNames.join(', ')}`);
  console.log('💡 각 고객의 실제 전화번호를 확인하여 고객 정보를 업데이트해야 합니다.');
  
  console.log('\n='.repeat(60));
  console.log('📊 복구 결과');
  console.log('='.repeat(60));
  console.log(`✅ 복구 완료: ${results.restored.length}건`);
  console.log(`❌ 오류: ${results.errors.length}건`);
  
  if (results.restored.length > 0) {
    console.log('\n📋 복구된 예약:');
    results.restored.forEach((r, i) => {
      console.log(`   ${i + 1}. ${r.name} (${r.date} ${r.time}) - ID: ${r.id}`);
    });
  }
  
  if (results.errors.length > 0) {
    console.log('\n❌ 오류 발생:');
    results.errors.forEach((e, i) => {
      console.log(`   ${i + 1}. ${e.name}: ${e.error}`);
    });
  }
  
  console.log('\n✅ 작업 완료!\n');
}

restoreDeletedBookings()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('\n❌ 작업 실패:', err);
    process.exit(1);
  });







 * 삭제된 실제 예약 복구 스크립트
 * 
 * 010-4245-0013 전화번호로 삭제된 예약 중 실제 예약 9건을 복구합니다.
 * 
 * 사용법:
 * node scripts/restore-deleted-bookings.js [--dry-run]
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

// 복구할 예약 목록 (삭제 전 확인한 정보)
const bookingsToRestore = [
  {
    name: '이남구',
    phone: '01042450013',
    date: '2020-09-23',
    time: '10:30',
    service_type: '마쓰구 드라이버 시타 서비스',
    status: 'confirmed',
    attendance_status: 'pending',
  },
  {
    name: '이겸주AS',
    phone: '01042450013',
    date: '2021-04-23',
    time: '16:00',
    service_type: '마쓰구 드라이버 시타 서비스',
    status: 'confirmed',
    attendance_status: 'pending',
    is_as_visit: true,
    original_name: '이겸주AS',
  },
  {
    name: '강희재AS',
    phone: '01042450013',
    date: '2022-02-08',
    time: '15:00',
    service_type: '마쓰구 드라이버 시타 서비스',
    status: 'confirmed',
    attendance_status: 'attended',
    is_as_visit: true,
    original_name: '강희재AS',
  },
  {
    name: '박용호AS',
    phone: '01042450013',
    date: '2022-02-08',
    time: '16:00',
    service_type: '마쓰구 드라이버 시타 서비스',
    status: 'confirmed',
    attendance_status: 'pending',
    is_as_visit: true,
    original_name: ' 박용호AS', // 앞에 공백 있음
  },
  {
    name: '이정립',
    phone: '01042450013',
    date: '2022-02-22',
    time: '14:00',
    service_type: '마쓰구 드라이버 시타 서비스',
    status: 'confirmed',
    attendance_status: 'pending',
  },
  {
    name: '허영이',
    phone: '01042450013',
    date: '2022-02-23',
    time: '14:30',
    service_type: '마쓰구 드라이버 시타 서비스',
    status: 'confirmed',
    attendance_status: 'attended',
  },
  {
    name: '홍준표',
    phone: '01042450013',
    date: '2022-02-23',
    time: '11:00',
    service_type: '마쓰구 드라이버 시타 서비스',
    status: 'confirmed',
    attendance_status: 'attended',
  },
  {
    name: '시타예약',
    phone: '01042450013',
    date: '2022-02-25',
    time: '15:00',
    service_type: '마쓰구 드라이버 시타 서비스',
    status: 'confirmed',
    attendance_status: 'attended',
  },
  {
    name: '김영식',
    phone: '01042450013',
    date: '2022-03-03',
    time: '14:00',
    service_type: '마쓰구 드라이버 시타 서비스',
    status: 'confirmed',
    attendance_status: 'attended',
  },
];

async function restoreDeletedBookings() {
  const dryRun = process.argv.includes('--dry-run');
  
  console.log('🔍 삭제된 예약 복구 중...\n');
  if (dryRun) {
    console.log('⚠️  DRY RUN 모드: 실제 추가 없이 확인만 수행합니다.\n');
  }
  
  console.log(`📋 복구할 예약: ${bookingsToRestore.length}건\n`);
  
  // 각 예약 정보 출력
  bookingsToRestore.forEach((b, i) => {
    console.log(`${i + 1}. ${b.name}`);
    console.log(`   날짜/시간: ${b.date} ${b.time}`);
    console.log(`   상태: ${b.status} / ${b.attendance_status}`);
    if (b.is_as_visit) {
      console.log(`   AS 방문: 예`);
    }
    console.log('');
  });
  
  if (dryRun) {
    console.log('💡 실제 복구를 하려면 --dry-run 옵션을 제거하고 다시 실행하세요.\n');
    return;
  }
  
  const results = {
    restored: [],
    errors: [],
  };
  
  // 각 예약 복구
  for (const booking of bookingsToRestore) {
    try {
      // 중복 확인
      const { data: existing } = await supabase
        .from('bookings')
        .select('id')
        .eq('phone', booking.phone)
        .eq('date', booking.date)
        .eq('time', booking.time)
        .single();
      
      if (existing) {
        console.log(`⚠️  이미 존재하는 예약: ${booking.name} (${booking.date} ${booking.time})`);
        continue;
      }
      
      // 예약 추가
      const bookingData = {
        name: booking.name.trim(), // 공백 제거
        phone: booking.phone,
        date: booking.date,
        time: booking.time,
        service_type: booking.service_type,
        location: 'Massgoo Studio',
        duration: 60,
        status: booking.status,
        attendance_status: booking.attendance_status,
        club: '', // NOT NULL 제약조건
        is_as_visit: booking.is_as_visit || false,
        original_name: booking.original_name || booking.name.trim(),
        notes: '삭제된 예약 복구',
        created_at: new Date().toISOString(),
      };
      
      const { data: inserted, error: insertError } = await supabase
        .from('bookings')
        .insert(bookingData)
        .select('id')
        .single();
      
      if (insertError) {
        throw insertError;
      }
      
      results.restored.push({
        id: inserted.id,
        name: booking.name,
        date: booking.date,
        time: booking.time,
      });
      
      console.log(`✅ 복구 완료: ${booking.name} (${booking.date} ${booking.time})`);
      
    } catch (error) {
      console.error(`❌ 복구 실패: ${booking.name}`, error.message);
      results.errors.push({
        name: booking.name,
        error: error.message,
      });
    }
  }
  
  // 고객 정보 확인 및 업데이트
  console.log('\n📝 고객 정보 확인 중...');
  const uniqueNames = [...new Set(bookingsToRestore.map(b => {
    // AS 제거하고 기본 이름 추출
    let name = b.name.trim();
    if (name.includes('AS')) {
      name = name.replace(/AS/g, '').trim();
    }
    return name;
  }))];
  
  console.log(`고유 고객명: ${uniqueNames.join(', ')}`);
  console.log('💡 각 고객의 실제 전화번호를 확인하여 고객 정보를 업데이트해야 합니다.');
  
  console.log('\n='.repeat(60));
  console.log('📊 복구 결과');
  console.log('='.repeat(60));
  console.log(`✅ 복구 완료: ${results.restored.length}건`);
  console.log(`❌ 오류: ${results.errors.length}건`);
  
  if (results.restored.length > 0) {
    console.log('\n📋 복구된 예약:');
    results.restored.forEach((r, i) => {
      console.log(`   ${i + 1}. ${r.name} (${r.date} ${r.time}) - ID: ${r.id}`);
    });
  }
  
  if (results.errors.length > 0) {
    console.log('\n❌ 오류 발생:');
    results.errors.forEach((e, i) => {
      console.log(`   ${i + 1}. ${e.name}: ${e.error}`);
    });
  }
  
  console.log('\n✅ 작업 완료!\n');
}

restoreDeletedBookings()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('\n❌ 작업 실패:', err);
    process.exit(1);
  });







 * 삭제된 실제 예약 복구 스크립트
 * 
 * 010-4245-0013 전화번호로 삭제된 예약 중 실제 예약 9건을 복구합니다.
 * 
 * 사용법:
 * node scripts/restore-deleted-bookings.js [--dry-run]
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

// 복구할 예약 목록 (삭제 전 확인한 정보)
const bookingsToRestore = [
  {
    name: '이남구',
    phone: '01042450013',
    date: '2020-09-23',
    time: '10:30',
    service_type: '마쓰구 드라이버 시타 서비스',
    status: 'confirmed',
    attendance_status: 'pending',
  },
  {
    name: '이겸주AS',
    phone: '01042450013',
    date: '2021-04-23',
    time: '16:00',
    service_type: '마쓰구 드라이버 시타 서비스',
    status: 'confirmed',
    attendance_status: 'pending',
    is_as_visit: true,
    original_name: '이겸주AS',
  },
  {
    name: '강희재AS',
    phone: '01042450013',
    date: '2022-02-08',
    time: '15:00',
    service_type: '마쓰구 드라이버 시타 서비스',
    status: 'confirmed',
    attendance_status: 'attended',
    is_as_visit: true,
    original_name: '강희재AS',
  },
  {
    name: '박용호AS',
    phone: '01042450013',
    date: '2022-02-08',
    time: '16:00',
    service_type: '마쓰구 드라이버 시타 서비스',
    status: 'confirmed',
    attendance_status: 'pending',
    is_as_visit: true,
    original_name: ' 박용호AS', // 앞에 공백 있음
  },
  {
    name: '이정립',
    phone: '01042450013',
    date: '2022-02-22',
    time: '14:00',
    service_type: '마쓰구 드라이버 시타 서비스',
    status: 'confirmed',
    attendance_status: 'pending',
  },
  {
    name: '허영이',
    phone: '01042450013',
    date: '2022-02-23',
    time: '14:30',
    service_type: '마쓰구 드라이버 시타 서비스',
    status: 'confirmed',
    attendance_status: 'attended',
  },
  {
    name: '홍준표',
    phone: '01042450013',
    date: '2022-02-23',
    time: '11:00',
    service_type: '마쓰구 드라이버 시타 서비스',
    status: 'confirmed',
    attendance_status: 'attended',
  },
  {
    name: '시타예약',
    phone: '01042450013',
    date: '2022-02-25',
    time: '15:00',
    service_type: '마쓰구 드라이버 시타 서비스',
    status: 'confirmed',
    attendance_status: 'attended',
  },
  {
    name: '김영식',
    phone: '01042450013',
    date: '2022-03-03',
    time: '14:00',
    service_type: '마쓰구 드라이버 시타 서비스',
    status: 'confirmed',
    attendance_status: 'attended',
  },
];

async function restoreDeletedBookings() {
  const dryRun = process.argv.includes('--dry-run');
  
  console.log('🔍 삭제된 예약 복구 중...\n');
  if (dryRun) {
    console.log('⚠️  DRY RUN 모드: 실제 추가 없이 확인만 수행합니다.\n');
  }
  
  console.log(`📋 복구할 예약: ${bookingsToRestore.length}건\n`);
  
  // 각 예약 정보 출력
  bookingsToRestore.forEach((b, i) => {
    console.log(`${i + 1}. ${b.name}`);
    console.log(`   날짜/시간: ${b.date} ${b.time}`);
    console.log(`   상태: ${b.status} / ${b.attendance_status}`);
    if (b.is_as_visit) {
      console.log(`   AS 방문: 예`);
    }
    console.log('');
  });
  
  if (dryRun) {
    console.log('💡 실제 복구를 하려면 --dry-run 옵션을 제거하고 다시 실행하세요.\n');
    return;
  }
  
  const results = {
    restored: [],
    errors: [],
  };
  
  // 각 예약 복구
  for (const booking of bookingsToRestore) {
    try {
      // 중복 확인
      const { data: existing } = await supabase
        .from('bookings')
        .select('id')
        .eq('phone', booking.phone)
        .eq('date', booking.date)
        .eq('time', booking.time)
        .single();
      
      if (existing) {
        console.log(`⚠️  이미 존재하는 예약: ${booking.name} (${booking.date} ${booking.time})`);
        continue;
      }
      
      // 예약 추가
      const bookingData = {
        name: booking.name.trim(), // 공백 제거
        phone: booking.phone,
        date: booking.date,
        time: booking.time,
        service_type: booking.service_type,
        location: 'Massgoo Studio',
        duration: 60,
        status: booking.status,
        attendance_status: booking.attendance_status,
        club: '', // NOT NULL 제약조건
        is_as_visit: booking.is_as_visit || false,
        original_name: booking.original_name || booking.name.trim(),
        notes: '삭제된 예약 복구',
        created_at: new Date().toISOString(),
      };
      
      const { data: inserted, error: insertError } = await supabase
        .from('bookings')
        .insert(bookingData)
        .select('id')
        .single();
      
      if (insertError) {
        throw insertError;
      }
      
      results.restored.push({
        id: inserted.id,
        name: booking.name,
        date: booking.date,
        time: booking.time,
      });
      
      console.log(`✅ 복구 완료: ${booking.name} (${booking.date} ${booking.time})`);
      
    } catch (error) {
      console.error(`❌ 복구 실패: ${booking.name}`, error.message);
      results.errors.push({
        name: booking.name,
        error: error.message,
      });
    }
  }
  
  // 고객 정보 확인 및 업데이트
  console.log('\n📝 고객 정보 확인 중...');
  const uniqueNames = [...new Set(bookingsToRestore.map(b => {
    // AS 제거하고 기본 이름 추출
    let name = b.name.trim();
    if (name.includes('AS')) {
      name = name.replace(/AS/g, '').trim();
    }
    return name;
  }))];
  
  console.log(`고유 고객명: ${uniqueNames.join(', ')}`);
  console.log('💡 각 고객의 실제 전화번호를 확인하여 고객 정보를 업데이트해야 합니다.');
  
  console.log('\n='.repeat(60));
  console.log('📊 복구 결과');
  console.log('='.repeat(60));
  console.log(`✅ 복구 완료: ${results.restored.length}건`);
  console.log(`❌ 오류: ${results.errors.length}건`);
  
  if (results.restored.length > 0) {
    console.log('\n📋 복구된 예약:');
    results.restored.forEach((r, i) => {
      console.log(`   ${i + 1}. ${r.name} (${r.date} ${r.time}) - ID: ${r.id}`);
    });
  }
  
  if (results.errors.length > 0) {
    console.log('\n❌ 오류 발생:');
    results.errors.forEach((e, i) => {
      console.log(`   ${i + 1}. ${e.name}: ${e.error}`);
    });
  }
  
  console.log('\n✅ 작업 완료!\n');
}

restoreDeletedBookings()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('\n❌ 작업 실패:', err);
    process.exit(1);
  });







 * 삭제된 실제 예약 복구 스크립트
 * 
 * 010-4245-0013 전화번호로 삭제된 예약 중 실제 예약 9건을 복구합니다.
 * 
 * 사용법:
 * node scripts/restore-deleted-bookings.js [--dry-run]
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

// 복구할 예약 목록 (삭제 전 확인한 정보)
const bookingsToRestore = [
  {
    name: '이남구',
    phone: '01042450013',
    date: '2020-09-23',
    time: '10:30',
    service_type: '마쓰구 드라이버 시타 서비스',
    status: 'confirmed',
    attendance_status: 'pending',
  },
  {
    name: '이겸주AS',
    phone: '01042450013',
    date: '2021-04-23',
    time: '16:00',
    service_type: '마쓰구 드라이버 시타 서비스',
    status: 'confirmed',
    attendance_status: 'pending',
    is_as_visit: true,
    original_name: '이겸주AS',
  },
  {
    name: '강희재AS',
    phone: '01042450013',
    date: '2022-02-08',
    time: '15:00',
    service_type: '마쓰구 드라이버 시타 서비스',
    status: 'confirmed',
    attendance_status: 'attended',
    is_as_visit: true,
    original_name: '강희재AS',
  },
  {
    name: '박용호AS',
    phone: '01042450013',
    date: '2022-02-08',
    time: '16:00',
    service_type: '마쓰구 드라이버 시타 서비스',
    status: 'confirmed',
    attendance_status: 'pending',
    is_as_visit: true,
    original_name: ' 박용호AS', // 앞에 공백 있음
  },
  {
    name: '이정립',
    phone: '01042450013',
    date: '2022-02-22',
    time: '14:00',
    service_type: '마쓰구 드라이버 시타 서비스',
    status: 'confirmed',
    attendance_status: 'pending',
  },
  {
    name: '허영이',
    phone: '01042450013',
    date: '2022-02-23',
    time: '14:30',
    service_type: '마쓰구 드라이버 시타 서비스',
    status: 'confirmed',
    attendance_status: 'attended',
  },
  {
    name: '홍준표',
    phone: '01042450013',
    date: '2022-02-23',
    time: '11:00',
    service_type: '마쓰구 드라이버 시타 서비스',
    status: 'confirmed',
    attendance_status: 'attended',
  },
  {
    name: '시타예약',
    phone: '01042450013',
    date: '2022-02-25',
    time: '15:00',
    service_type: '마쓰구 드라이버 시타 서비스',
    status: 'confirmed',
    attendance_status: 'attended',
  },
  {
    name: '김영식',
    phone: '01042450013',
    date: '2022-03-03',
    time: '14:00',
    service_type: '마쓰구 드라이버 시타 서비스',
    status: 'confirmed',
    attendance_status: 'attended',
  },
];

async function restoreDeletedBookings() {
  const dryRun = process.argv.includes('--dry-run');
  
  console.log('🔍 삭제된 예약 복구 중...\n');
  if (dryRun) {
    console.log('⚠️  DRY RUN 모드: 실제 추가 없이 확인만 수행합니다.\n');
  }
  
  console.log(`📋 복구할 예약: ${bookingsToRestore.length}건\n`);
  
  // 각 예약 정보 출력
  bookingsToRestore.forEach((b, i) => {
    console.log(`${i + 1}. ${b.name}`);
    console.log(`   날짜/시간: ${b.date} ${b.time}`);
    console.log(`   상태: ${b.status} / ${b.attendance_status}`);
    if (b.is_as_visit) {
      console.log(`   AS 방문: 예`);
    }
    console.log('');
  });
  
  if (dryRun) {
    console.log('💡 실제 복구를 하려면 --dry-run 옵션을 제거하고 다시 실행하세요.\n');
    return;
  }
  
  const results = {
    restored: [],
    errors: [],
  };
  
  // 각 예약 복구
  for (const booking of bookingsToRestore) {
    try {
      // 중복 확인
      const { data: existing } = await supabase
        .from('bookings')
        .select('id')
        .eq('phone', booking.phone)
        .eq('date', booking.date)
        .eq('time', booking.time)
        .single();
      
      if (existing) {
        console.log(`⚠️  이미 존재하는 예약: ${booking.name} (${booking.date} ${booking.time})`);
        continue;
      }
      
      // 예약 추가
      const bookingData = {
        name: booking.name.trim(), // 공백 제거
        phone: booking.phone,
        date: booking.date,
        time: booking.time,
        service_type: booking.service_type,
        location: 'Massgoo Studio',
        duration: 60,
        status: booking.status,
        attendance_status: booking.attendance_status,
        club: '', // NOT NULL 제약조건
        is_as_visit: booking.is_as_visit || false,
        original_name: booking.original_name || booking.name.trim(),
        notes: '삭제된 예약 복구',
        created_at: new Date().toISOString(),
      };
      
      const { data: inserted, error: insertError } = await supabase
        .from('bookings')
        .insert(bookingData)
        .select('id')
        .single();
      
      if (insertError) {
        throw insertError;
      }
      
      results.restored.push({
        id: inserted.id,
        name: booking.name,
        date: booking.date,
        time: booking.time,
      });
      
      console.log(`✅ 복구 완료: ${booking.name} (${booking.date} ${booking.time})`);
      
    } catch (error) {
      console.error(`❌ 복구 실패: ${booking.name}`, error.message);
      results.errors.push({
        name: booking.name,
        error: error.message,
      });
    }
  }
  
  // 고객 정보 확인 및 업데이트
  console.log('\n📝 고객 정보 확인 중...');
  const uniqueNames = [...new Set(bookingsToRestore.map(b => {
    // AS 제거하고 기본 이름 추출
    let name = b.name.trim();
    if (name.includes('AS')) {
      name = name.replace(/AS/g, '').trim();
    }
    return name;
  }))];
  
  console.log(`고유 고객명: ${uniqueNames.join(', ')}`);
  console.log('💡 각 고객의 실제 전화번호를 확인하여 고객 정보를 업데이트해야 합니다.');
  
  console.log('\n='.repeat(60));
  console.log('📊 복구 결과');
  console.log('='.repeat(60));
  console.log(`✅ 복구 완료: ${results.restored.length}건`);
  console.log(`❌ 오류: ${results.errors.length}건`);
  
  if (results.restored.length > 0) {
    console.log('\n📋 복구된 예약:');
    results.restored.forEach((r, i) => {
      console.log(`   ${i + 1}. ${r.name} (${r.date} ${r.time}) - ID: ${r.id}`);
    });
  }
  
  if (results.errors.length > 0) {
    console.log('\n❌ 오류 발생:');
    results.errors.forEach((e, i) => {
      console.log(`   ${i + 1}. ${e.name}: ${e.error}`);
    });
  }
  
  console.log('\n✅ 작업 완료!\n');
}

restoreDeletedBookings()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('\n❌ 작업 실패:', err);
    process.exit(1);
  });







 * 삭제된 실제 예약 복구 스크립트
 * 
 * 010-4245-0013 전화번호로 삭제된 예약 중 실제 예약 9건을 복구합니다.
 * 
 * 사용법:
 * node scripts/restore-deleted-bookings.js [--dry-run]
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

// 복구할 예약 목록 (삭제 전 확인한 정보)
const bookingsToRestore = [
  {
    name: '이남구',
    phone: '01042450013',
    date: '2020-09-23',
    time: '10:30',
    service_type: '마쓰구 드라이버 시타 서비스',
    status: 'confirmed',
    attendance_status: 'pending',
  },
  {
    name: '이겸주AS',
    phone: '01042450013',
    date: '2021-04-23',
    time: '16:00',
    service_type: '마쓰구 드라이버 시타 서비스',
    status: 'confirmed',
    attendance_status: 'pending',
    is_as_visit: true,
    original_name: '이겸주AS',
  },
  {
    name: '강희재AS',
    phone: '01042450013',
    date: '2022-02-08',
    time: '15:00',
    service_type: '마쓰구 드라이버 시타 서비스',
    status: 'confirmed',
    attendance_status: 'attended',
    is_as_visit: true,
    original_name: '강희재AS',
  },
  {
    name: '박용호AS',
    phone: '01042450013',
    date: '2022-02-08',
    time: '16:00',
    service_type: '마쓰구 드라이버 시타 서비스',
    status: 'confirmed',
    attendance_status: 'pending',
    is_as_visit: true,
    original_name: ' 박용호AS', // 앞에 공백 있음
  },
  {
    name: '이정립',
    phone: '01042450013',
    date: '2022-02-22',
    time: '14:00',
    service_type: '마쓰구 드라이버 시타 서비스',
    status: 'confirmed',
    attendance_status: 'pending',
  },
  {
    name: '허영이',
    phone: '01042450013',
    date: '2022-02-23',
    time: '14:30',
    service_type: '마쓰구 드라이버 시타 서비스',
    status: 'confirmed',
    attendance_status: 'attended',
  },
  {
    name: '홍준표',
    phone: '01042450013',
    date: '2022-02-23',
    time: '11:00',
    service_type: '마쓰구 드라이버 시타 서비스',
    status: 'confirmed',
    attendance_status: 'attended',
  },
  {
    name: '시타예약',
    phone: '01042450013',
    date: '2022-02-25',
    time: '15:00',
    service_type: '마쓰구 드라이버 시타 서비스',
    status: 'confirmed',
    attendance_status: 'attended',
  },
  {
    name: '김영식',
    phone: '01042450013',
    date: '2022-03-03',
    time: '14:00',
    service_type: '마쓰구 드라이버 시타 서비스',
    status: 'confirmed',
    attendance_status: 'attended',
  },
];

async function restoreDeletedBookings() {
  const dryRun = process.argv.includes('--dry-run');
  
  console.log('🔍 삭제된 예약 복구 중...\n');
  if (dryRun) {
    console.log('⚠️  DRY RUN 모드: 실제 추가 없이 확인만 수행합니다.\n');
  }
  
  console.log(`📋 복구할 예약: ${bookingsToRestore.length}건\n`);
  
  // 각 예약 정보 출력
  bookingsToRestore.forEach((b, i) => {
    console.log(`${i + 1}. ${b.name}`);
    console.log(`   날짜/시간: ${b.date} ${b.time}`);
    console.log(`   상태: ${b.status} / ${b.attendance_status}`);
    if (b.is_as_visit) {
      console.log(`   AS 방문: 예`);
    }
    console.log('');
  });
  
  if (dryRun) {
    console.log('💡 실제 복구를 하려면 --dry-run 옵션을 제거하고 다시 실행하세요.\n');
    return;
  }
  
  const results = {
    restored: [],
    errors: [],
  };
  
  // 각 예약 복구
  for (const booking of bookingsToRestore) {
    try {
      // 중복 확인
      const { data: existing } = await supabase
        .from('bookings')
        .select('id')
        .eq('phone', booking.phone)
        .eq('date', booking.date)
        .eq('time', booking.time)
        .single();
      
      if (existing) {
        console.log(`⚠️  이미 존재하는 예약: ${booking.name} (${booking.date} ${booking.time})`);
        continue;
      }
      
      // 예약 추가
      const bookingData = {
        name: booking.name.trim(), // 공백 제거
        phone: booking.phone,
        date: booking.date,
        time: booking.time,
        service_type: booking.service_type,
        location: 'Massgoo Studio',
        duration: 60,
        status: booking.status,
        attendance_status: booking.attendance_status,
        club: '', // NOT NULL 제약조건
        is_as_visit: booking.is_as_visit || false,
        original_name: booking.original_name || booking.name.trim(),
        notes: '삭제된 예약 복구',
        created_at: new Date().toISOString(),
      };
      
      const { data: inserted, error: insertError } = await supabase
        .from('bookings')
        .insert(bookingData)
        .select('id')
        .single();
      
      if (insertError) {
        throw insertError;
      }
      
      results.restored.push({
        id: inserted.id,
        name: booking.name,
        date: booking.date,
        time: booking.time,
      });
      
      console.log(`✅ 복구 완료: ${booking.name} (${booking.date} ${booking.time})`);
      
    } catch (error) {
      console.error(`❌ 복구 실패: ${booking.name}`, error.message);
      results.errors.push({
        name: booking.name,
        error: error.message,
      });
    }
  }
  
  // 고객 정보 확인 및 업데이트
  console.log('\n📝 고객 정보 확인 중...');
  const uniqueNames = [...new Set(bookingsToRestore.map(b => {
    // AS 제거하고 기본 이름 추출
    let name = b.name.trim();
    if (name.includes('AS')) {
      name = name.replace(/AS/g, '').trim();
    }
    return name;
  }))];
  
  console.log(`고유 고객명: ${uniqueNames.join(', ')}`);
  console.log('💡 각 고객의 실제 전화번호를 확인하여 고객 정보를 업데이트해야 합니다.');
  
  console.log('\n='.repeat(60));
  console.log('📊 복구 결과');
  console.log('='.repeat(60));
  console.log(`✅ 복구 완료: ${results.restored.length}건`);
  console.log(`❌ 오류: ${results.errors.length}건`);
  
  if (results.restored.length > 0) {
    console.log('\n📋 복구된 예약:');
    results.restored.forEach((r, i) => {
      console.log(`   ${i + 1}. ${r.name} (${r.date} ${r.time}) - ID: ${r.id}`);
    });
  }
  
  if (results.errors.length > 0) {
    console.log('\n❌ 오류 발생:');
    results.errors.forEach((e, i) => {
      console.log(`   ${i + 1}. ${e.name}: ${e.error}`);
    });
  }
  
  console.log('\n✅ 작업 완료!\n');
}

restoreDeletedBookings()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('\n❌ 작업 실패:', err);
    process.exit(1);
  });













