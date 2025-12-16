/**
 * 복구된 예약 업데이트 스크립트
 * 
 * 010-4245-0013 전화번호로 복구된 예약을 실제 고객 전화번호로 변경하고
 * 재방문으로 표시하며, AS는 notes로 이동합니다.
 * 
 * 사용법:
 * node scripts/update-restored-bookings.js [--dry-run]
 * 
 * 옵션:
 *   --dry-run    실제 수정 없이 확인만 수행
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

// 복구된 예약 정보 (이름, 날짜, 시간)
const restoredBookings = [
  { name: '이남구', date: '2020-09-23', time: '10:30' },
  { name: '이겸주AS', date: '2021-04-23', time: '16:00' },
  { name: '강희재AS', date: '2022-02-08', time: '15:00' },
  { name: '박용호AS', date: '2022-02-08', time: '16:00' },
  { name: '이정립', date: '2022-02-22', time: '14:00' },
  { name: '허영이', date: '2022-02-23', time: '14:30' },
  { name: '홍준표', date: '2022-02-23', time: '11:00' },
  { name: '시타예약', date: '2022-02-25', time: '15:00' },
  { name: '김영식', date: '2022-03-03', time: '14:00' },
];

async function updateRestoredBookings() {
  const dryRun = process.argv.includes('--dry-run');
  
  console.log('🔍 복구된 예약 업데이트 중...\n');
  if (dryRun) {
    console.log('⚠️  DRY RUN 모드: 실제 수정 없이 확인만 수행합니다.\n');
  }
  
  const results = {
    updated: [],
    errors: [],
    notFound: [],
  };
  
  // 각 예약 처리
  for (const bookingInfo of restoredBookings) {
    try {
      console.log(`[${bookingInfo.name}] 처리 중...`);
      
      // 1. 예약 찾기 (010-4245-0013 전화번호로)
      const { data: booking, error: bookingError } = await supabase
        .from('bookings')
        .select('*')
        .eq('phone', '01042450013')
        .eq('date', bookingInfo.date)
        .eq('time', bookingInfo.time)
        .single();
      
      if (bookingError || !booking) {
        console.log(`   ❌ 예약을 찾을 수 없습니다: ${bookingInfo.date} ${bookingInfo.time}`);
        results.notFound.push(bookingInfo);
        continue;
      }
      
      // 2. 이름에서 AS 제거하고 기본 이름 추출
      let baseName = bookingInfo.name.trim();
      const isAS = baseName.includes('AS');
      if (isAS) {
        baseName = baseName.replace(/AS/g, '').trim();
      }
      
      // 3. 고객 정보 찾기 (이름으로 검색)
      const { data: customers, error: customerError } = await supabase
        .from('customers')
        .select('id, name, phone, visit_count')
        .ilike('name', `%${baseName}%`)
        .order('visit_count', { ascending: false }); // 방문 횟수가 많은 것 우선
      
      if (customerError) {
        throw new Error(`고객 조회 오류: ${customerError.message}`);
      }
      
      if (!customers || customers.length === 0) {
        console.log(`   ⚠️  고객 정보를 찾을 수 없습니다: ${baseName}`);
        console.log(`   💡 수동으로 전화번호를 확인하고 업데이트해야 합니다.`);
        results.notFound.push({ ...bookingInfo, reason: '고객 정보 없음' });
        continue;
      }
      
      // 가장 적합한 고객 선택 (이름이 정확히 일치하는 것 우선)
      let selectedCustomer = customers.find(c => c.name === baseName || c.name.trim() === baseName);
      if (!selectedCustomer) {
        selectedCustomer = customers[0]; // 첫 번째 고객 선택
      }
      
      console.log(`   고객 찾음: ${selectedCustomer.name} (${selectedCustomer.phone}), 방문: ${selectedCustomer.visit_count || 0}회`);
      
      if (dryRun) {
        console.log(`   [DRY RUN] 전화번호 변경: 01042450013 → ${selectedCustomer.phone}`);
        console.log(`   [DRY RUN] 이름 변경: ${bookingInfo.name} → ${selectedCustomer.name}`);
        if (isAS) {
          console.log(`   [DRY RUN] AS 정보를 notes에 추가`);
        }
        console.log(`   [DRY RUN] 방문 횟수 업데이트: ${selectedCustomer.visit_count || 0} → ${(selectedCustomer.visit_count || 0) + 1}`);
        console.log('');
        continue;
      }
      
      // 4. 예약 업데이트
      const updateData = {
        name: selectedCustomer.name,
        phone: selectedCustomer.phone,
      };
      
      // AS 정보를 notes에 추가
      let notes = booking.notes || '';
      if (isAS) {
        const asNote = '[AS 방문]';
        if (notes && !notes.includes(asNote)) {
          notes = notes ? `${notes}\n${asNote}` : asNote;
        } else if (!notes) {
          notes = asNote;
        }
        updateData.notes = notes;
        updateData.is_as_visit = true;
      }
      
      const { error: updateError } = await supabase
        .from('bookings')
        .update(updateData)
        .eq('id', booking.id);
      
      if (updateError) {
        throw new Error(`예약 업데이트 오류: ${updateError.message}`);
      }
      
      // 5. 고객 방문 횟수 업데이트
      const newVisitCount = (selectedCustomer.visit_count || 0) + 1;
      const { error: visitCountError } = await supabase
        .from('customers')
        .update({ visit_count: newVisitCount })
        .eq('id', selectedCustomer.id);
      
      if (visitCountError) {
        console.log(`   ⚠️  방문 횟수 업데이트 실패: ${visitCountError.message}`);
      }
      
      // 6. 마지막 방문일 업데이트
      const { error: lastVisitError } = await supabase
        .from('customers')
        .update({ last_visit_date: bookingInfo.date })
        .eq('id', selectedCustomer.id);
      
      if (lastVisitError) {
        console.log(`   ⚠️  마지막 방문일 업데이트 실패: ${lastVisitError.message}`);
      }
      
      results.updated.push({
        bookingId: booking.id,
        originalName: bookingInfo.name,
        newName: selectedCustomer.name,
        originalPhone: '01042450013',
        newPhone: selectedCustomer.phone,
        visitCount: newVisitCount,
        isAS,
      });
      
      console.log(`   ✅ 업데이트 완료: ${selectedCustomer.name} (${selectedCustomer.phone}), 방문 ${newVisitCount}회`);
      console.log('');
      
    } catch (error) {
      console.error(`   ❌ 처리 실패:`, error.message);
      results.errors.push({
        ...bookingInfo,
        error: error.message,
      });
      console.log('');
    }
  }
  
  // 시타예약 특수 처리
  console.log('[시타예약] 특수 처리...');
  const { data: shitaBooking } = await supabase
    .from('bookings')
    .select('*')
    .eq('phone', '01042450013')
    .eq('date', '2022-02-25')
    .eq('time', '15:00')
    .single();
  
  if (shitaBooking) {
    console.log('   ⚠️  "시타예약"은 일반 이름이 아니므로 수동으로 처리해야 합니다.');
    console.log('   💡 실제 고객 이름과 전화번호를 확인하여 수동 업데이트하세요.');
    results.notFound.push({ name: '시타예약', date: '2022-02-25', time: '15:00', reason: '일반 이름 아님' });
  }
  
  // 결과 요약
  console.log('='.repeat(60));
  console.log('📊 업데이트 결과');
  console.log('='.repeat(60));
  console.log(`✅ 업데이트 완료: ${results.updated.length}건`);
  console.log(`❌ 오류: ${results.errors.length}건`);
  console.log(`⚠️  처리 불가: ${results.notFound.length}건`);
  
  if (results.updated.length > 0) {
    console.log('\n📋 업데이트된 예약:');
    results.updated.forEach((r, i) => {
      console.log(`   ${i + 1}. ${r.originalName} → ${r.newName}`);
      console.log(`      전화번호: ${r.originalPhone} → ${r.newPhone}`);
      console.log(`      방문 횟수: ${r.visitCount}회`);
      if (r.isAS) {
        console.log(`      AS 방문: 예`);
      }
    });
  }
  
  if (results.notFound.length > 0) {
    console.log('\n⚠️  처리 불가 항목:');
    results.notFound.forEach((n, i) => {
      console.log(`   ${i + 1}. ${n.name} (${n.date} ${n.time})`);
      if (n.reason) {
        console.log(`      이유: ${n.reason}`);
      }
    });
  }
  
  if (results.errors.length > 0) {
    console.log('\n❌ 오류 발생:');
    results.errors.forEach((e, i) => {
      console.log(`   ${i + 1}. ${e.name}: ${e.error}`);
    });
  }
  
  if (dryRun) {
    console.log('\n💡 실제 업데이트를 하려면 --dry-run 옵션을 제거하고 다시 실행하세요.');
  } else {
    console.log('\n✅ 작업 완료!');
  }
}

updateRestoredBookings()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('\n❌ 작업 실패:', err);
    process.exit(1);
  });







 * 복구된 예약 업데이트 스크립트
 * 
 * 010-4245-0013 전화번호로 복구된 예약을 실제 고객 전화번호로 변경하고
 * 재방문으로 표시하며, AS는 notes로 이동합니다.
 * 
 * 사용법:
 * node scripts/update-restored-bookings.js [--dry-run]
 * 
 * 옵션:
 *   --dry-run    실제 수정 없이 확인만 수행
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

// 복구된 예약 정보 (이름, 날짜, 시간)
const restoredBookings = [
  { name: '이남구', date: '2020-09-23', time: '10:30' },
  { name: '이겸주AS', date: '2021-04-23', time: '16:00' },
  { name: '강희재AS', date: '2022-02-08', time: '15:00' },
  { name: '박용호AS', date: '2022-02-08', time: '16:00' },
  { name: '이정립', date: '2022-02-22', time: '14:00' },
  { name: '허영이', date: '2022-02-23', time: '14:30' },
  { name: '홍준표', date: '2022-02-23', time: '11:00' },
  { name: '시타예약', date: '2022-02-25', time: '15:00' },
  { name: '김영식', date: '2022-03-03', time: '14:00' },
];

async function updateRestoredBookings() {
  const dryRun = process.argv.includes('--dry-run');
  
  console.log('🔍 복구된 예약 업데이트 중...\n');
  if (dryRun) {
    console.log('⚠️  DRY RUN 모드: 실제 수정 없이 확인만 수행합니다.\n');
  }
  
  const results = {
    updated: [],
    errors: [],
    notFound: [],
  };
  
  // 각 예약 처리
  for (const bookingInfo of restoredBookings) {
    try {
      console.log(`[${bookingInfo.name}] 처리 중...`);
      
      // 1. 예약 찾기 (010-4245-0013 전화번호로)
      const { data: booking, error: bookingError } = await supabase
        .from('bookings')
        .select('*')
        .eq('phone', '01042450013')
        .eq('date', bookingInfo.date)
        .eq('time', bookingInfo.time)
        .single();
      
      if (bookingError || !booking) {
        console.log(`   ❌ 예약을 찾을 수 없습니다: ${bookingInfo.date} ${bookingInfo.time}`);
        results.notFound.push(bookingInfo);
        continue;
      }
      
      // 2. 이름에서 AS 제거하고 기본 이름 추출
      let baseName = bookingInfo.name.trim();
      const isAS = baseName.includes('AS');
      if (isAS) {
        baseName = baseName.replace(/AS/g, '').trim();
      }
      
      // 3. 고객 정보 찾기 (이름으로 검색)
      const { data: customers, error: customerError } = await supabase
        .from('customers')
        .select('id, name, phone, visit_count')
        .ilike('name', `%${baseName}%`)
        .order('visit_count', { ascending: false }); // 방문 횟수가 많은 것 우선
      
      if (customerError) {
        throw new Error(`고객 조회 오류: ${customerError.message}`);
      }
      
      if (!customers || customers.length === 0) {
        console.log(`   ⚠️  고객 정보를 찾을 수 없습니다: ${baseName}`);
        console.log(`   💡 수동으로 전화번호를 확인하고 업데이트해야 합니다.`);
        results.notFound.push({ ...bookingInfo, reason: '고객 정보 없음' });
        continue;
      }
      
      // 가장 적합한 고객 선택 (이름이 정확히 일치하는 것 우선)
      let selectedCustomer = customers.find(c => c.name === baseName || c.name.trim() === baseName);
      if (!selectedCustomer) {
        selectedCustomer = customers[0]; // 첫 번째 고객 선택
      }
      
      console.log(`   고객 찾음: ${selectedCustomer.name} (${selectedCustomer.phone}), 방문: ${selectedCustomer.visit_count || 0}회`);
      
      if (dryRun) {
        console.log(`   [DRY RUN] 전화번호 변경: 01042450013 → ${selectedCustomer.phone}`);
        console.log(`   [DRY RUN] 이름 변경: ${bookingInfo.name} → ${selectedCustomer.name}`);
        if (isAS) {
          console.log(`   [DRY RUN] AS 정보를 notes에 추가`);
        }
        console.log(`   [DRY RUN] 방문 횟수 업데이트: ${selectedCustomer.visit_count || 0} → ${(selectedCustomer.visit_count || 0) + 1}`);
        console.log('');
        continue;
      }
      
      // 4. 예약 업데이트
      const updateData = {
        name: selectedCustomer.name,
        phone: selectedCustomer.phone,
      };
      
      // AS 정보를 notes에 추가
      let notes = booking.notes || '';
      if (isAS) {
        const asNote = '[AS 방문]';
        if (notes && !notes.includes(asNote)) {
          notes = notes ? `${notes}\n${asNote}` : asNote;
        } else if (!notes) {
          notes = asNote;
        }
        updateData.notes = notes;
        updateData.is_as_visit = true;
      }
      
      const { error: updateError } = await supabase
        .from('bookings')
        .update(updateData)
        .eq('id', booking.id);
      
      if (updateError) {
        throw new Error(`예약 업데이트 오류: ${updateError.message}`);
      }
      
      // 5. 고객 방문 횟수 업데이트
      const newVisitCount = (selectedCustomer.visit_count || 0) + 1;
      const { error: visitCountError } = await supabase
        .from('customers')
        .update({ visit_count: newVisitCount })
        .eq('id', selectedCustomer.id);
      
      if (visitCountError) {
        console.log(`   ⚠️  방문 횟수 업데이트 실패: ${visitCountError.message}`);
      }
      
      // 6. 마지막 방문일 업데이트
      const { error: lastVisitError } = await supabase
        .from('customers')
        .update({ last_visit_date: bookingInfo.date })
        .eq('id', selectedCustomer.id);
      
      if (lastVisitError) {
        console.log(`   ⚠️  마지막 방문일 업데이트 실패: ${lastVisitError.message}`);
      }
      
      results.updated.push({
        bookingId: booking.id,
        originalName: bookingInfo.name,
        newName: selectedCustomer.name,
        originalPhone: '01042450013',
        newPhone: selectedCustomer.phone,
        visitCount: newVisitCount,
        isAS,
      });
      
      console.log(`   ✅ 업데이트 완료: ${selectedCustomer.name} (${selectedCustomer.phone}), 방문 ${newVisitCount}회`);
      console.log('');
      
    } catch (error) {
      console.error(`   ❌ 처리 실패:`, error.message);
      results.errors.push({
        ...bookingInfo,
        error: error.message,
      });
      console.log('');
    }
  }
  
  // 시타예약 특수 처리
  console.log('[시타예약] 특수 처리...');
  const { data: shitaBooking } = await supabase
    .from('bookings')
    .select('*')
    .eq('phone', '01042450013')
    .eq('date', '2022-02-25')
    .eq('time', '15:00')
    .single();
  
  if (shitaBooking) {
    console.log('   ⚠️  "시타예약"은 일반 이름이 아니므로 수동으로 처리해야 합니다.');
    console.log('   💡 실제 고객 이름과 전화번호를 확인하여 수동 업데이트하세요.');
    results.notFound.push({ name: '시타예약', date: '2022-02-25', time: '15:00', reason: '일반 이름 아님' });
  }
  
  // 결과 요약
  console.log('='.repeat(60));
  console.log('📊 업데이트 결과');
  console.log('='.repeat(60));
  console.log(`✅ 업데이트 완료: ${results.updated.length}건`);
  console.log(`❌ 오류: ${results.errors.length}건`);
  console.log(`⚠️  처리 불가: ${results.notFound.length}건`);
  
  if (results.updated.length > 0) {
    console.log('\n📋 업데이트된 예약:');
    results.updated.forEach((r, i) => {
      console.log(`   ${i + 1}. ${r.originalName} → ${r.newName}`);
      console.log(`      전화번호: ${r.originalPhone} → ${r.newPhone}`);
      console.log(`      방문 횟수: ${r.visitCount}회`);
      if (r.isAS) {
        console.log(`      AS 방문: 예`);
      }
    });
  }
  
  if (results.notFound.length > 0) {
    console.log('\n⚠️  처리 불가 항목:');
    results.notFound.forEach((n, i) => {
      console.log(`   ${i + 1}. ${n.name} (${n.date} ${n.time})`);
      if (n.reason) {
        console.log(`      이유: ${n.reason}`);
      }
    });
  }
  
  if (results.errors.length > 0) {
    console.log('\n❌ 오류 발생:');
    results.errors.forEach((e, i) => {
      console.log(`   ${i + 1}. ${e.name}: ${e.error}`);
    });
  }
  
  if (dryRun) {
    console.log('\n💡 실제 업데이트를 하려면 --dry-run 옵션을 제거하고 다시 실행하세요.');
  } else {
    console.log('\n✅ 작업 완료!');
  }
}

updateRestoredBookings()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('\n❌ 작업 실패:', err);
    process.exit(1);
  });







 * 복구된 예약 업데이트 스크립트
 * 
 * 010-4245-0013 전화번호로 복구된 예약을 실제 고객 전화번호로 변경하고
 * 재방문으로 표시하며, AS는 notes로 이동합니다.
 * 
 * 사용법:
 * node scripts/update-restored-bookings.js [--dry-run]
 * 
 * 옵션:
 *   --dry-run    실제 수정 없이 확인만 수행
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

// 복구된 예약 정보 (이름, 날짜, 시간)
const restoredBookings = [
  { name: '이남구', date: '2020-09-23', time: '10:30' },
  { name: '이겸주AS', date: '2021-04-23', time: '16:00' },
  { name: '강희재AS', date: '2022-02-08', time: '15:00' },
  { name: '박용호AS', date: '2022-02-08', time: '16:00' },
  { name: '이정립', date: '2022-02-22', time: '14:00' },
  { name: '허영이', date: '2022-02-23', time: '14:30' },
  { name: '홍준표', date: '2022-02-23', time: '11:00' },
  { name: '시타예약', date: '2022-02-25', time: '15:00' },
  { name: '김영식', date: '2022-03-03', time: '14:00' },
];

async function updateRestoredBookings() {
  const dryRun = process.argv.includes('--dry-run');
  
  console.log('🔍 복구된 예약 업데이트 중...\n');
  if (dryRun) {
    console.log('⚠️  DRY RUN 모드: 실제 수정 없이 확인만 수행합니다.\n');
  }
  
  const results = {
    updated: [],
    errors: [],
    notFound: [],
  };
  
  // 각 예약 처리
  for (const bookingInfo of restoredBookings) {
    try {
      console.log(`[${bookingInfo.name}] 처리 중...`);
      
      // 1. 예약 찾기 (010-4245-0013 전화번호로)
      const { data: booking, error: bookingError } = await supabase
        .from('bookings')
        .select('*')
        .eq('phone', '01042450013')
        .eq('date', bookingInfo.date)
        .eq('time', bookingInfo.time)
        .single();
      
      if (bookingError || !booking) {
        console.log(`   ❌ 예약을 찾을 수 없습니다: ${bookingInfo.date} ${bookingInfo.time}`);
        results.notFound.push(bookingInfo);
        continue;
      }
      
      // 2. 이름에서 AS 제거하고 기본 이름 추출
      let baseName = bookingInfo.name.trim();
      const isAS = baseName.includes('AS');
      if (isAS) {
        baseName = baseName.replace(/AS/g, '').trim();
      }
      
      // 3. 고객 정보 찾기 (이름으로 검색)
      const { data: customers, error: customerError } = await supabase
        .from('customers')
        .select('id, name, phone, visit_count')
        .ilike('name', `%${baseName}%`)
        .order('visit_count', { ascending: false }); // 방문 횟수가 많은 것 우선
      
      if (customerError) {
        throw new Error(`고객 조회 오류: ${customerError.message}`);
      }
      
      if (!customers || customers.length === 0) {
        console.log(`   ⚠️  고객 정보를 찾을 수 없습니다: ${baseName}`);
        console.log(`   💡 수동으로 전화번호를 확인하고 업데이트해야 합니다.`);
        results.notFound.push({ ...bookingInfo, reason: '고객 정보 없음' });
        continue;
      }
      
      // 가장 적합한 고객 선택 (이름이 정확히 일치하는 것 우선)
      let selectedCustomer = customers.find(c => c.name === baseName || c.name.trim() === baseName);
      if (!selectedCustomer) {
        selectedCustomer = customers[0]; // 첫 번째 고객 선택
      }
      
      console.log(`   고객 찾음: ${selectedCustomer.name} (${selectedCustomer.phone}), 방문: ${selectedCustomer.visit_count || 0}회`);
      
      if (dryRun) {
        console.log(`   [DRY RUN] 전화번호 변경: 01042450013 → ${selectedCustomer.phone}`);
        console.log(`   [DRY RUN] 이름 변경: ${bookingInfo.name} → ${selectedCustomer.name}`);
        if (isAS) {
          console.log(`   [DRY RUN] AS 정보를 notes에 추가`);
        }
        console.log(`   [DRY RUN] 방문 횟수 업데이트: ${selectedCustomer.visit_count || 0} → ${(selectedCustomer.visit_count || 0) + 1}`);
        console.log('');
        continue;
      }
      
      // 4. 예약 업데이트
      const updateData = {
        name: selectedCustomer.name,
        phone: selectedCustomer.phone,
      };
      
      // AS 정보를 notes에 추가
      let notes = booking.notes || '';
      if (isAS) {
        const asNote = '[AS 방문]';
        if (notes && !notes.includes(asNote)) {
          notes = notes ? `${notes}\n${asNote}` : asNote;
        } else if (!notes) {
          notes = asNote;
        }
        updateData.notes = notes;
        updateData.is_as_visit = true;
      }
      
      const { error: updateError } = await supabase
        .from('bookings')
        .update(updateData)
        .eq('id', booking.id);
      
      if (updateError) {
        throw new Error(`예약 업데이트 오류: ${updateError.message}`);
      }
      
      // 5. 고객 방문 횟수 업데이트
      const newVisitCount = (selectedCustomer.visit_count || 0) + 1;
      const { error: visitCountError } = await supabase
        .from('customers')
        .update({ visit_count: newVisitCount })
        .eq('id', selectedCustomer.id);
      
      if (visitCountError) {
        console.log(`   ⚠️  방문 횟수 업데이트 실패: ${visitCountError.message}`);
      }
      
      // 6. 마지막 방문일 업데이트
      const { error: lastVisitError } = await supabase
        .from('customers')
        .update({ last_visit_date: bookingInfo.date })
        .eq('id', selectedCustomer.id);
      
      if (lastVisitError) {
        console.log(`   ⚠️  마지막 방문일 업데이트 실패: ${lastVisitError.message}`);
      }
      
      results.updated.push({
        bookingId: booking.id,
        originalName: bookingInfo.name,
        newName: selectedCustomer.name,
        originalPhone: '01042450013',
        newPhone: selectedCustomer.phone,
        visitCount: newVisitCount,
        isAS,
      });
      
      console.log(`   ✅ 업데이트 완료: ${selectedCustomer.name} (${selectedCustomer.phone}), 방문 ${newVisitCount}회`);
      console.log('');
      
    } catch (error) {
      console.error(`   ❌ 처리 실패:`, error.message);
      results.errors.push({
        ...bookingInfo,
        error: error.message,
      });
      console.log('');
    }
  }
  
  // 시타예약 특수 처리
  console.log('[시타예약] 특수 처리...');
  const { data: shitaBooking } = await supabase
    .from('bookings')
    .select('*')
    .eq('phone', '01042450013')
    .eq('date', '2022-02-25')
    .eq('time', '15:00')
    .single();
  
  if (shitaBooking) {
    console.log('   ⚠️  "시타예약"은 일반 이름이 아니므로 수동으로 처리해야 합니다.');
    console.log('   💡 실제 고객 이름과 전화번호를 확인하여 수동 업데이트하세요.');
    results.notFound.push({ name: '시타예약', date: '2022-02-25', time: '15:00', reason: '일반 이름 아님' });
  }
  
  // 결과 요약
  console.log('='.repeat(60));
  console.log('📊 업데이트 결과');
  console.log('='.repeat(60));
  console.log(`✅ 업데이트 완료: ${results.updated.length}건`);
  console.log(`❌ 오류: ${results.errors.length}건`);
  console.log(`⚠️  처리 불가: ${results.notFound.length}건`);
  
  if (results.updated.length > 0) {
    console.log('\n📋 업데이트된 예약:');
    results.updated.forEach((r, i) => {
      console.log(`   ${i + 1}. ${r.originalName} → ${r.newName}`);
      console.log(`      전화번호: ${r.originalPhone} → ${r.newPhone}`);
      console.log(`      방문 횟수: ${r.visitCount}회`);
      if (r.isAS) {
        console.log(`      AS 방문: 예`);
      }
    });
  }
  
  if (results.notFound.length > 0) {
    console.log('\n⚠️  처리 불가 항목:');
    results.notFound.forEach((n, i) => {
      console.log(`   ${i + 1}. ${n.name} (${n.date} ${n.time})`);
      if (n.reason) {
        console.log(`      이유: ${n.reason}`);
      }
    });
  }
  
  if (results.errors.length > 0) {
    console.log('\n❌ 오류 발생:');
    results.errors.forEach((e, i) => {
      console.log(`   ${i + 1}. ${e.name}: ${e.error}`);
    });
  }
  
  if (dryRun) {
    console.log('\n💡 실제 업데이트를 하려면 --dry-run 옵션을 제거하고 다시 실행하세요.');
  } else {
    console.log('\n✅ 작업 완료!');
  }
}

updateRestoredBookings()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('\n❌ 작업 실패:', err);
    process.exit(1);
  });







 * 복구된 예약 업데이트 스크립트
 * 
 * 010-4245-0013 전화번호로 복구된 예약을 실제 고객 전화번호로 변경하고
 * 재방문으로 표시하며, AS는 notes로 이동합니다.
 * 
 * 사용법:
 * node scripts/update-restored-bookings.js [--dry-run]
 * 
 * 옵션:
 *   --dry-run    실제 수정 없이 확인만 수행
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

// 복구된 예약 정보 (이름, 날짜, 시간)
const restoredBookings = [
  { name: '이남구', date: '2020-09-23', time: '10:30' },
  { name: '이겸주AS', date: '2021-04-23', time: '16:00' },
  { name: '강희재AS', date: '2022-02-08', time: '15:00' },
  { name: '박용호AS', date: '2022-02-08', time: '16:00' },
  { name: '이정립', date: '2022-02-22', time: '14:00' },
  { name: '허영이', date: '2022-02-23', time: '14:30' },
  { name: '홍준표', date: '2022-02-23', time: '11:00' },
  { name: '시타예약', date: '2022-02-25', time: '15:00' },
  { name: '김영식', date: '2022-03-03', time: '14:00' },
];

async function updateRestoredBookings() {
  const dryRun = process.argv.includes('--dry-run');
  
  console.log('🔍 복구된 예약 업데이트 중...\n');
  if (dryRun) {
    console.log('⚠️  DRY RUN 모드: 실제 수정 없이 확인만 수행합니다.\n');
  }
  
  const results = {
    updated: [],
    errors: [],
    notFound: [],
  };
  
  // 각 예약 처리
  for (const bookingInfo of restoredBookings) {
    try {
      console.log(`[${bookingInfo.name}] 처리 중...`);
      
      // 1. 예약 찾기 (010-4245-0013 전화번호로)
      const { data: booking, error: bookingError } = await supabase
        .from('bookings')
        .select('*')
        .eq('phone', '01042450013')
        .eq('date', bookingInfo.date)
        .eq('time', bookingInfo.time)
        .single();
      
      if (bookingError || !booking) {
        console.log(`   ❌ 예약을 찾을 수 없습니다: ${bookingInfo.date} ${bookingInfo.time}`);
        results.notFound.push(bookingInfo);
        continue;
      }
      
      // 2. 이름에서 AS 제거하고 기본 이름 추출
      let baseName = bookingInfo.name.trim();
      const isAS = baseName.includes('AS');
      if (isAS) {
        baseName = baseName.replace(/AS/g, '').trim();
      }
      
      // 3. 고객 정보 찾기 (이름으로 검색)
      const { data: customers, error: customerError } = await supabase
        .from('customers')
        .select('id, name, phone, visit_count')
        .ilike('name', `%${baseName}%`)
        .order('visit_count', { ascending: false }); // 방문 횟수가 많은 것 우선
      
      if (customerError) {
        throw new Error(`고객 조회 오류: ${customerError.message}`);
      }
      
      if (!customers || customers.length === 0) {
        console.log(`   ⚠️  고객 정보를 찾을 수 없습니다: ${baseName}`);
        console.log(`   💡 수동으로 전화번호를 확인하고 업데이트해야 합니다.`);
        results.notFound.push({ ...bookingInfo, reason: '고객 정보 없음' });
        continue;
      }
      
      // 가장 적합한 고객 선택 (이름이 정확히 일치하는 것 우선)
      let selectedCustomer = customers.find(c => c.name === baseName || c.name.trim() === baseName);
      if (!selectedCustomer) {
        selectedCustomer = customers[0]; // 첫 번째 고객 선택
      }
      
      console.log(`   고객 찾음: ${selectedCustomer.name} (${selectedCustomer.phone}), 방문: ${selectedCustomer.visit_count || 0}회`);
      
      if (dryRun) {
        console.log(`   [DRY RUN] 전화번호 변경: 01042450013 → ${selectedCustomer.phone}`);
        console.log(`   [DRY RUN] 이름 변경: ${bookingInfo.name} → ${selectedCustomer.name}`);
        if (isAS) {
          console.log(`   [DRY RUN] AS 정보를 notes에 추가`);
        }
        console.log(`   [DRY RUN] 방문 횟수 업데이트: ${selectedCustomer.visit_count || 0} → ${(selectedCustomer.visit_count || 0) + 1}`);
        console.log('');
        continue;
      }
      
      // 4. 예약 업데이트
      const updateData = {
        name: selectedCustomer.name,
        phone: selectedCustomer.phone,
      };
      
      // AS 정보를 notes에 추가
      let notes = booking.notes || '';
      if (isAS) {
        const asNote = '[AS 방문]';
        if (notes && !notes.includes(asNote)) {
          notes = notes ? `${notes}\n${asNote}` : asNote;
        } else if (!notes) {
          notes = asNote;
        }
        updateData.notes = notes;
        updateData.is_as_visit = true;
      }
      
      const { error: updateError } = await supabase
        .from('bookings')
        .update(updateData)
        .eq('id', booking.id);
      
      if (updateError) {
        throw new Error(`예약 업데이트 오류: ${updateError.message}`);
      }
      
      // 5. 고객 방문 횟수 업데이트
      const newVisitCount = (selectedCustomer.visit_count || 0) + 1;
      const { error: visitCountError } = await supabase
        .from('customers')
        .update({ visit_count: newVisitCount })
        .eq('id', selectedCustomer.id);
      
      if (visitCountError) {
        console.log(`   ⚠️  방문 횟수 업데이트 실패: ${visitCountError.message}`);
      }
      
      // 6. 마지막 방문일 업데이트
      const { error: lastVisitError } = await supabase
        .from('customers')
        .update({ last_visit_date: bookingInfo.date })
        .eq('id', selectedCustomer.id);
      
      if (lastVisitError) {
        console.log(`   ⚠️  마지막 방문일 업데이트 실패: ${lastVisitError.message}`);
      }
      
      results.updated.push({
        bookingId: booking.id,
        originalName: bookingInfo.name,
        newName: selectedCustomer.name,
        originalPhone: '01042450013',
        newPhone: selectedCustomer.phone,
        visitCount: newVisitCount,
        isAS,
      });
      
      console.log(`   ✅ 업데이트 완료: ${selectedCustomer.name} (${selectedCustomer.phone}), 방문 ${newVisitCount}회`);
      console.log('');
      
    } catch (error) {
      console.error(`   ❌ 처리 실패:`, error.message);
      results.errors.push({
        ...bookingInfo,
        error: error.message,
      });
      console.log('');
    }
  }
  
  // 시타예약 특수 처리
  console.log('[시타예약] 특수 처리...');
  const { data: shitaBooking } = await supabase
    .from('bookings')
    .select('*')
    .eq('phone', '01042450013')
    .eq('date', '2022-02-25')
    .eq('time', '15:00')
    .single();
  
  if (shitaBooking) {
    console.log('   ⚠️  "시타예약"은 일반 이름이 아니므로 수동으로 처리해야 합니다.');
    console.log('   💡 실제 고객 이름과 전화번호를 확인하여 수동 업데이트하세요.');
    results.notFound.push({ name: '시타예약', date: '2022-02-25', time: '15:00', reason: '일반 이름 아님' });
  }
  
  // 결과 요약
  console.log('='.repeat(60));
  console.log('📊 업데이트 결과');
  console.log('='.repeat(60));
  console.log(`✅ 업데이트 완료: ${results.updated.length}건`);
  console.log(`❌ 오류: ${results.errors.length}건`);
  console.log(`⚠️  처리 불가: ${results.notFound.length}건`);
  
  if (results.updated.length > 0) {
    console.log('\n📋 업데이트된 예약:');
    results.updated.forEach((r, i) => {
      console.log(`   ${i + 1}. ${r.originalName} → ${r.newName}`);
      console.log(`      전화번호: ${r.originalPhone} → ${r.newPhone}`);
      console.log(`      방문 횟수: ${r.visitCount}회`);
      if (r.isAS) {
        console.log(`      AS 방문: 예`);
      }
    });
  }
  
  if (results.notFound.length > 0) {
    console.log('\n⚠️  처리 불가 항목:');
    results.notFound.forEach((n, i) => {
      console.log(`   ${i + 1}. ${n.name} (${n.date} ${n.time})`);
      if (n.reason) {
        console.log(`      이유: ${n.reason}`);
      }
    });
  }
  
  if (results.errors.length > 0) {
    console.log('\n❌ 오류 발생:');
    results.errors.forEach((e, i) => {
      console.log(`   ${i + 1}. ${e.name}: ${e.error}`);
    });
  }
  
  if (dryRun) {
    console.log('\n💡 실제 업데이트를 하려면 --dry-run 옵션을 제거하고 다시 실행하세요.');
  } else {
    console.log('\n✅ 작업 완료!');
  }
}

updateRestoredBookings()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('\n❌ 작업 실패:', err);
    process.exit(1);
  });







 * 복구된 예약 업데이트 스크립트
 * 
 * 010-4245-0013 전화번호로 복구된 예약을 실제 고객 전화번호로 변경하고
 * 재방문으로 표시하며, AS는 notes로 이동합니다.
 * 
 * 사용법:
 * node scripts/update-restored-bookings.js [--dry-run]
 * 
 * 옵션:
 *   --dry-run    실제 수정 없이 확인만 수행
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

// 복구된 예약 정보 (이름, 날짜, 시간)
const restoredBookings = [
  { name: '이남구', date: '2020-09-23', time: '10:30' },
  { name: '이겸주AS', date: '2021-04-23', time: '16:00' },
  { name: '강희재AS', date: '2022-02-08', time: '15:00' },
  { name: '박용호AS', date: '2022-02-08', time: '16:00' },
  { name: '이정립', date: '2022-02-22', time: '14:00' },
  { name: '허영이', date: '2022-02-23', time: '14:30' },
  { name: '홍준표', date: '2022-02-23', time: '11:00' },
  { name: '시타예약', date: '2022-02-25', time: '15:00' },
  { name: '김영식', date: '2022-03-03', time: '14:00' },
];

async function updateRestoredBookings() {
  const dryRun = process.argv.includes('--dry-run');
  
  console.log('🔍 복구된 예약 업데이트 중...\n');
  if (dryRun) {
    console.log('⚠️  DRY RUN 모드: 실제 수정 없이 확인만 수행합니다.\n');
  }
  
  const results = {
    updated: [],
    errors: [],
    notFound: [],
  };
  
  // 각 예약 처리
  for (const bookingInfo of restoredBookings) {
    try {
      console.log(`[${bookingInfo.name}] 처리 중...`);
      
      // 1. 예약 찾기 (010-4245-0013 전화번호로)
      const { data: booking, error: bookingError } = await supabase
        .from('bookings')
        .select('*')
        .eq('phone', '01042450013')
        .eq('date', bookingInfo.date)
        .eq('time', bookingInfo.time)
        .single();
      
      if (bookingError || !booking) {
        console.log(`   ❌ 예약을 찾을 수 없습니다: ${bookingInfo.date} ${bookingInfo.time}`);
        results.notFound.push(bookingInfo);
        continue;
      }
      
      // 2. 이름에서 AS 제거하고 기본 이름 추출
      let baseName = bookingInfo.name.trim();
      const isAS = baseName.includes('AS');
      if (isAS) {
        baseName = baseName.replace(/AS/g, '').trim();
      }
      
      // 3. 고객 정보 찾기 (이름으로 검색)
      const { data: customers, error: customerError } = await supabase
        .from('customers')
        .select('id, name, phone, visit_count')
        .ilike('name', `%${baseName}%`)
        .order('visit_count', { ascending: false }); // 방문 횟수가 많은 것 우선
      
      if (customerError) {
        throw new Error(`고객 조회 오류: ${customerError.message}`);
      }
      
      if (!customers || customers.length === 0) {
        console.log(`   ⚠️  고객 정보를 찾을 수 없습니다: ${baseName}`);
        console.log(`   💡 수동으로 전화번호를 확인하고 업데이트해야 합니다.`);
        results.notFound.push({ ...bookingInfo, reason: '고객 정보 없음' });
        continue;
      }
      
      // 가장 적합한 고객 선택 (이름이 정확히 일치하는 것 우선)
      let selectedCustomer = customers.find(c => c.name === baseName || c.name.trim() === baseName);
      if (!selectedCustomer) {
        selectedCustomer = customers[0]; // 첫 번째 고객 선택
      }
      
      console.log(`   고객 찾음: ${selectedCustomer.name} (${selectedCustomer.phone}), 방문: ${selectedCustomer.visit_count || 0}회`);
      
      if (dryRun) {
        console.log(`   [DRY RUN] 전화번호 변경: 01042450013 → ${selectedCustomer.phone}`);
        console.log(`   [DRY RUN] 이름 변경: ${bookingInfo.name} → ${selectedCustomer.name}`);
        if (isAS) {
          console.log(`   [DRY RUN] AS 정보를 notes에 추가`);
        }
        console.log(`   [DRY RUN] 방문 횟수 업데이트: ${selectedCustomer.visit_count || 0} → ${(selectedCustomer.visit_count || 0) + 1}`);
        console.log('');
        continue;
      }
      
      // 4. 예약 업데이트
      const updateData = {
        name: selectedCustomer.name,
        phone: selectedCustomer.phone,
      };
      
      // AS 정보를 notes에 추가
      let notes = booking.notes || '';
      if (isAS) {
        const asNote = '[AS 방문]';
        if (notes && !notes.includes(asNote)) {
          notes = notes ? `${notes}\n${asNote}` : asNote;
        } else if (!notes) {
          notes = asNote;
        }
        updateData.notes = notes;
        updateData.is_as_visit = true;
      }
      
      const { error: updateError } = await supabase
        .from('bookings')
        .update(updateData)
        .eq('id', booking.id);
      
      if (updateError) {
        throw new Error(`예약 업데이트 오류: ${updateError.message}`);
      }
      
      // 5. 고객 방문 횟수 업데이트
      const newVisitCount = (selectedCustomer.visit_count || 0) + 1;
      const { error: visitCountError } = await supabase
        .from('customers')
        .update({ visit_count: newVisitCount })
        .eq('id', selectedCustomer.id);
      
      if (visitCountError) {
        console.log(`   ⚠️  방문 횟수 업데이트 실패: ${visitCountError.message}`);
      }
      
      // 6. 마지막 방문일 업데이트
      const { error: lastVisitError } = await supabase
        .from('customers')
        .update({ last_visit_date: bookingInfo.date })
        .eq('id', selectedCustomer.id);
      
      if (lastVisitError) {
        console.log(`   ⚠️  마지막 방문일 업데이트 실패: ${lastVisitError.message}`);
      }
      
      results.updated.push({
        bookingId: booking.id,
        originalName: bookingInfo.name,
        newName: selectedCustomer.name,
        originalPhone: '01042450013',
        newPhone: selectedCustomer.phone,
        visitCount: newVisitCount,
        isAS,
      });
      
      console.log(`   ✅ 업데이트 완료: ${selectedCustomer.name} (${selectedCustomer.phone}), 방문 ${newVisitCount}회`);
      console.log('');
      
    } catch (error) {
      console.error(`   ❌ 처리 실패:`, error.message);
      results.errors.push({
        ...bookingInfo,
        error: error.message,
      });
      console.log('');
    }
  }
  
  // 시타예약 특수 처리
  console.log('[시타예약] 특수 처리...');
  const { data: shitaBooking } = await supabase
    .from('bookings')
    .select('*')
    .eq('phone', '01042450013')
    .eq('date', '2022-02-25')
    .eq('time', '15:00')
    .single();
  
  if (shitaBooking) {
    console.log('   ⚠️  "시타예약"은 일반 이름이 아니므로 수동으로 처리해야 합니다.');
    console.log('   💡 실제 고객 이름과 전화번호를 확인하여 수동 업데이트하세요.');
    results.notFound.push({ name: '시타예약', date: '2022-02-25', time: '15:00', reason: '일반 이름 아님' });
  }
  
  // 결과 요약
  console.log('='.repeat(60));
  console.log('📊 업데이트 결과');
  console.log('='.repeat(60));
  console.log(`✅ 업데이트 완료: ${results.updated.length}건`);
  console.log(`❌ 오류: ${results.errors.length}건`);
  console.log(`⚠️  처리 불가: ${results.notFound.length}건`);
  
  if (results.updated.length > 0) {
    console.log('\n📋 업데이트된 예약:');
    results.updated.forEach((r, i) => {
      console.log(`   ${i + 1}. ${r.originalName} → ${r.newName}`);
      console.log(`      전화번호: ${r.originalPhone} → ${r.newPhone}`);
      console.log(`      방문 횟수: ${r.visitCount}회`);
      if (r.isAS) {
        console.log(`      AS 방문: 예`);
      }
    });
  }
  
  if (results.notFound.length > 0) {
    console.log('\n⚠️  처리 불가 항목:');
    results.notFound.forEach((n, i) => {
      console.log(`   ${i + 1}. ${n.name} (${n.date} ${n.time})`);
      if (n.reason) {
        console.log(`      이유: ${n.reason}`);
      }
    });
  }
  
  if (results.errors.length > 0) {
    console.log('\n❌ 오류 발생:');
    results.errors.forEach((e, i) => {
      console.log(`   ${i + 1}. ${e.name}: ${e.error}`);
    });
  }
  
  if (dryRun) {
    console.log('\n💡 실제 업데이트를 하려면 --dry-run 옵션을 제거하고 다시 실행하세요.');
  } else {
    console.log('\n✅ 작업 완료!');
  }
}

updateRestoredBookings()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('\n❌ 작업 실패:', err);
    process.exit(1);
  });























