const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const OLD_NAME = '자양동 부부';
const NEW_NAME = 'VIP1805';
const PHONE = '01052641805'; // 하이픈 제거된 형태

async function fixJayangdongCustomerName() {
  const dryRun = process.argv.includes('--dry-run');
  
  console.log('🔍 "자양동 부부" → "VIP1805" 이름 변경 중...\n');
  if (dryRun) {
    console.log('⚠️  DRY RUN 모드: 실제 수정 없이 확인만 수행합니다.\n');
  }
  
  // 1. 예약 찾기
  console.log('📊 예약 조회 중...');
  const { data: bookings, error: bookingError } = await supabase
    .from('bookings')
    .select('*')
    .or(`name.ilike.%${OLD_NAME}%,phone.eq.${PHONE}`);
  
  if (bookingError) {
    console.error('❌ 예약 조회 오류:', bookingError);
    return;
  }
  
  const targetBookings = bookings?.filter(b => 
    b.name.includes(OLD_NAME) || b.phone === PHONE || b.phone === '010-5264-1805'
  ) || [];
  
  console.log(`✅ 발견된 예약: ${targetBookings.length}건\n`);
  targetBookings.forEach((b, i) => {
    console.log(`${i + 1}. ID: ${b.id}`);
    console.log(`   현재 이름: ${b.name}`);
    console.log(`   전화번호: ${b.phone}`);
    console.log(`   날짜/시간: ${b.date} ${b.time}`);
    console.log(`   서비스: ${b.service_type}`);
    console.log('');
  });
  
  // 2. 고객 찾기
  console.log('📊 고객 조회 중...');
  const { data: customers, error: customerError } = await supabase
    .from('customers')
    .select('*')
    .or(`name.ilike.%${NEW_NAME}%,phone.eq.${PHONE}`);
  
  if (customerError) {
    console.error('❌ 고객 조회 오류:', customerError);
    return;
  }
  
  const targetCustomers = customers?.filter(c => 
    c.name.includes(NEW_NAME) || c.phone === PHONE || c.phone === '010-5264-1805'
  ) || [];
  
  console.log(`✅ 발견된 고객: ${targetCustomers.length}건\n`);
  targetCustomers.forEach((c, i) => {
    console.log(`${i + 1}. ID: ${c.id}`);
    console.log(`   현재 이름: ${c.name}`);
    console.log(`   전화번호: ${c.phone}`);
    console.log(`   방문 횟수: ${c.visit_count || 0}회`);
    console.log('');
  });
  
  if (targetBookings.length === 0 && targetCustomers.length === 0) {
    console.log('❌ 변경할 데이터가 없습니다.\n');
    return;
  }
  
  if (dryRun) {
    console.log('='.repeat(60));
    console.log('💡 실제 수정 내용:');
    console.log('='.repeat(60));
    if (targetBookings.length > 0) {
      console.log(`\n📝 예약 이름 변경:`);
      targetBookings.forEach(b => {
        console.log(`   - ID ${b.id}: "${b.name}" → "${NEW_NAME}"`);
      });
    }
    if (targetCustomers.length > 0) {
      console.log(`\n📝 고객 이름 변경:`);
      targetCustomers.forEach(c => {
        if (c.name !== NEW_NAME) {
          console.log(`   - ID ${c.id}: "${c.name}" → "${NEW_NAME}"`);
        } else {
          console.log(`   - ID ${c.id}: "${c.name}" (변경 없음)`);
        }
      });
    }
    console.log('\n💡 실제 수정을 하려면 --dry-run 옵션을 제거하고 다시 실행하세요.\n');
    return;
  }
  
  // 실제 업데이트
  console.log('='.repeat(60));
  console.log('📝 업데이트 시작...');
  console.log('='.repeat(60));
  
  const results = {
    bookings: { updated: 0, errors: [] },
    customers: { updated: 0, errors: [] },
  };
  
  // 예약 업데이트
  if (targetBookings.length > 0) {
    console.log('\n📝 예약 이름 업데이트 중...');
    for (const booking of targetBookings) {
      try {
        const { error: updateError } = await supabase
          .from('bookings')
          .update({ name: NEW_NAME })
          .eq('id', booking.id);
        
        if (updateError) {
          throw updateError;
        }
        
        console.log(`   ✅ 예약 ID ${booking.id}: "${booking.name}" → "${NEW_NAME}"`);
        results.bookings.updated++;
      } catch (error) {
        console.error(`   ❌ 예약 ID ${booking.id} 업데이트 실패:`, error.message);
        results.bookings.errors.push({ id: booking.id, error: error.message });
      }
    }
  }
  
  // 고객 업데이트
  if (targetCustomers.length > 0) {
    console.log('\n📝 고객 이름 업데이트 중...');
    for (const customer of targetCustomers) {
      if (customer.name === NEW_NAME) {
        console.log(`   ⏭️  고객 ID ${customer.id}: 이미 "${NEW_NAME}" (변경 없음)`);
        continue;
      }
      
      try {
        const { error: updateError } = await supabase
          .from('customers')
          .update({ name: NEW_NAME })
          .eq('id', customer.id);
        
        if (updateError) {
          throw updateError;
        }
        
        console.log(`   ✅ 고객 ID ${customer.id}: "${customer.name}" → "${NEW_NAME}"`);
        results.customers.updated++;
      } catch (error) {
        console.error(`   ❌ 고객 ID ${customer.id} 업데이트 실패:`, error.message);
        results.customers.errors.push({ id: customer.id, error: error.message });
      }
    }
  }
  
  // 결과 요약
  console.log('\n' + '='.repeat(60));
  console.log('📊 업데이트 결과');
  console.log('='.repeat(60));
  console.log(`✅ 예약 업데이트: ${results.bookings.updated}건`);
  if (results.bookings.errors.length > 0) {
    console.log(`❌ 예약 오류: ${results.bookings.errors.length}건`);
  }
  console.log(`✅ 고객 업데이트: ${results.customers.updated}건`);
  if (results.customers.errors.length > 0) {
    console.log(`❌ 고객 오류: ${results.customers.errors.length}건`);
  }
  console.log('\n✅ 작업 완료!\n');
}

fixJayangdongCustomerName()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('\n❌ 작업 실패:', err);
    process.exit(1);
  });







require('dotenv').config({ path: require('path').join(__dirname, '..', '.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const OLD_NAME = '자양동 부부';
const NEW_NAME = 'VIP1805';
const PHONE = '01052641805'; // 하이픈 제거된 형태

async function fixJayangdongCustomerName() {
  const dryRun = process.argv.includes('--dry-run');
  
  console.log('🔍 "자양동 부부" → "VIP1805" 이름 변경 중...\n');
  if (dryRun) {
    console.log('⚠️  DRY RUN 모드: 실제 수정 없이 확인만 수행합니다.\n');
  }
  
  // 1. 예약 찾기
  console.log('📊 예약 조회 중...');
  const { data: bookings, error: bookingError } = await supabase
    .from('bookings')
    .select('*')
    .or(`name.ilike.%${OLD_NAME}%,phone.eq.${PHONE}`);
  
  if (bookingError) {
    console.error('❌ 예약 조회 오류:', bookingError);
    return;
  }
  
  const targetBookings = bookings?.filter(b => 
    b.name.includes(OLD_NAME) || b.phone === PHONE || b.phone === '010-5264-1805'
  ) || [];
  
  console.log(`✅ 발견된 예약: ${targetBookings.length}건\n`);
  targetBookings.forEach((b, i) => {
    console.log(`${i + 1}. ID: ${b.id}`);
    console.log(`   현재 이름: ${b.name}`);
    console.log(`   전화번호: ${b.phone}`);
    console.log(`   날짜/시간: ${b.date} ${b.time}`);
    console.log(`   서비스: ${b.service_type}`);
    console.log('');
  });
  
  // 2. 고객 찾기
  console.log('📊 고객 조회 중...');
  const { data: customers, error: customerError } = await supabase
    .from('customers')
    .select('*')
    .or(`name.ilike.%${NEW_NAME}%,phone.eq.${PHONE}`);
  
  if (customerError) {
    console.error('❌ 고객 조회 오류:', customerError);
    return;
  }
  
  const targetCustomers = customers?.filter(c => 
    c.name.includes(NEW_NAME) || c.phone === PHONE || c.phone === '010-5264-1805'
  ) || [];
  
  console.log(`✅ 발견된 고객: ${targetCustomers.length}건\n`);
  targetCustomers.forEach((c, i) => {
    console.log(`${i + 1}. ID: ${c.id}`);
    console.log(`   현재 이름: ${c.name}`);
    console.log(`   전화번호: ${c.phone}`);
    console.log(`   방문 횟수: ${c.visit_count || 0}회`);
    console.log('');
  });
  
  if (targetBookings.length === 0 && targetCustomers.length === 0) {
    console.log('❌ 변경할 데이터가 없습니다.\n');
    return;
  }
  
  if (dryRun) {
    console.log('='.repeat(60));
    console.log('💡 실제 수정 내용:');
    console.log('='.repeat(60));
    if (targetBookings.length > 0) {
      console.log(`\n📝 예약 이름 변경:`);
      targetBookings.forEach(b => {
        console.log(`   - ID ${b.id}: "${b.name}" → "${NEW_NAME}"`);
      });
    }
    if (targetCustomers.length > 0) {
      console.log(`\n📝 고객 이름 변경:`);
      targetCustomers.forEach(c => {
        if (c.name !== NEW_NAME) {
          console.log(`   - ID ${c.id}: "${c.name}" → "${NEW_NAME}"`);
        } else {
          console.log(`   - ID ${c.id}: "${c.name}" (변경 없음)`);
        }
      });
    }
    console.log('\n💡 실제 수정을 하려면 --dry-run 옵션을 제거하고 다시 실행하세요.\n');
    return;
  }
  
  // 실제 업데이트
  console.log('='.repeat(60));
  console.log('📝 업데이트 시작...');
  console.log('='.repeat(60));
  
  const results = {
    bookings: { updated: 0, errors: [] },
    customers: { updated: 0, errors: [] },
  };
  
  // 예약 업데이트
  if (targetBookings.length > 0) {
    console.log('\n📝 예약 이름 업데이트 중...');
    for (const booking of targetBookings) {
      try {
        const { error: updateError } = await supabase
          .from('bookings')
          .update({ name: NEW_NAME })
          .eq('id', booking.id);
        
        if (updateError) {
          throw updateError;
        }
        
        console.log(`   ✅ 예약 ID ${booking.id}: "${booking.name}" → "${NEW_NAME}"`);
        results.bookings.updated++;
      } catch (error) {
        console.error(`   ❌ 예약 ID ${booking.id} 업데이트 실패:`, error.message);
        results.bookings.errors.push({ id: booking.id, error: error.message });
      }
    }
  }
  
  // 고객 업데이트
  if (targetCustomers.length > 0) {
    console.log('\n📝 고객 이름 업데이트 중...');
    for (const customer of targetCustomers) {
      if (customer.name === NEW_NAME) {
        console.log(`   ⏭️  고객 ID ${customer.id}: 이미 "${NEW_NAME}" (변경 없음)`);
        continue;
      }
      
      try {
        const { error: updateError } = await supabase
          .from('customers')
          .update({ name: NEW_NAME })
          .eq('id', customer.id);
        
        if (updateError) {
          throw updateError;
        }
        
        console.log(`   ✅ 고객 ID ${customer.id}: "${customer.name}" → "${NEW_NAME}"`);
        results.customers.updated++;
      } catch (error) {
        console.error(`   ❌ 고객 ID ${customer.id} 업데이트 실패:`, error.message);
        results.customers.errors.push({ id: customer.id, error: error.message });
      }
    }
  }
  
  // 결과 요약
  console.log('\n' + '='.repeat(60));
  console.log('📊 업데이트 결과');
  console.log('='.repeat(60));
  console.log(`✅ 예약 업데이트: ${results.bookings.updated}건`);
  if (results.bookings.errors.length > 0) {
    console.log(`❌ 예약 오류: ${results.bookings.errors.length}건`);
  }
  console.log(`✅ 고객 업데이트: ${results.customers.updated}건`);
  if (results.customers.errors.length > 0) {
    console.log(`❌ 고객 오류: ${results.customers.errors.length}건`);
  }
  console.log('\n✅ 작업 완료!\n');
}

fixJayangdongCustomerName()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('\n❌ 작업 실패:', err);
    process.exit(1);
  });







require('dotenv').config({ path: require('path').join(__dirname, '..', '.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const OLD_NAME = '자양동 부부';
const NEW_NAME = 'VIP1805';
const PHONE = '01052641805'; // 하이픈 제거된 형태

async function fixJayangdongCustomerName() {
  const dryRun = process.argv.includes('--dry-run');
  
  console.log('🔍 "자양동 부부" → "VIP1805" 이름 변경 중...\n');
  if (dryRun) {
    console.log('⚠️  DRY RUN 모드: 실제 수정 없이 확인만 수행합니다.\n');
  }
  
  // 1. 예약 찾기
  console.log('📊 예약 조회 중...');
  const { data: bookings, error: bookingError } = await supabase
    .from('bookings')
    .select('*')
    .or(`name.ilike.%${OLD_NAME}%,phone.eq.${PHONE}`);
  
  if (bookingError) {
    console.error('❌ 예약 조회 오류:', bookingError);
    return;
  }
  
  const targetBookings = bookings?.filter(b => 
    b.name.includes(OLD_NAME) || b.phone === PHONE || b.phone === '010-5264-1805'
  ) || [];
  
  console.log(`✅ 발견된 예약: ${targetBookings.length}건\n`);
  targetBookings.forEach((b, i) => {
    console.log(`${i + 1}. ID: ${b.id}`);
    console.log(`   현재 이름: ${b.name}`);
    console.log(`   전화번호: ${b.phone}`);
    console.log(`   날짜/시간: ${b.date} ${b.time}`);
    console.log(`   서비스: ${b.service_type}`);
    console.log('');
  });
  
  // 2. 고객 찾기
  console.log('📊 고객 조회 중...');
  const { data: customers, error: customerError } = await supabase
    .from('customers')
    .select('*')
    .or(`name.ilike.%${NEW_NAME}%,phone.eq.${PHONE}`);
  
  if (customerError) {
    console.error('❌ 고객 조회 오류:', customerError);
    return;
  }
  
  const targetCustomers = customers?.filter(c => 
    c.name.includes(NEW_NAME) || c.phone === PHONE || c.phone === '010-5264-1805'
  ) || [];
  
  console.log(`✅ 발견된 고객: ${targetCustomers.length}건\n`);
  targetCustomers.forEach((c, i) => {
    console.log(`${i + 1}. ID: ${c.id}`);
    console.log(`   현재 이름: ${c.name}`);
    console.log(`   전화번호: ${c.phone}`);
    console.log(`   방문 횟수: ${c.visit_count || 0}회`);
    console.log('');
  });
  
  if (targetBookings.length === 0 && targetCustomers.length === 0) {
    console.log('❌ 변경할 데이터가 없습니다.\n');
    return;
  }
  
  if (dryRun) {
    console.log('='.repeat(60));
    console.log('💡 실제 수정 내용:');
    console.log('='.repeat(60));
    if (targetBookings.length > 0) {
      console.log(`\n📝 예약 이름 변경:`);
      targetBookings.forEach(b => {
        console.log(`   - ID ${b.id}: "${b.name}" → "${NEW_NAME}"`);
      });
    }
    if (targetCustomers.length > 0) {
      console.log(`\n📝 고객 이름 변경:`);
      targetCustomers.forEach(c => {
        if (c.name !== NEW_NAME) {
          console.log(`   - ID ${c.id}: "${c.name}" → "${NEW_NAME}"`);
        } else {
          console.log(`   - ID ${c.id}: "${c.name}" (변경 없음)`);
        }
      });
    }
    console.log('\n💡 실제 수정을 하려면 --dry-run 옵션을 제거하고 다시 실행하세요.\n');
    return;
  }
  
  // 실제 업데이트
  console.log('='.repeat(60));
  console.log('📝 업데이트 시작...');
  console.log('='.repeat(60));
  
  const results = {
    bookings: { updated: 0, errors: [] },
    customers: { updated: 0, errors: [] },
  };
  
  // 예약 업데이트
  if (targetBookings.length > 0) {
    console.log('\n📝 예약 이름 업데이트 중...');
    for (const booking of targetBookings) {
      try {
        const { error: updateError } = await supabase
          .from('bookings')
          .update({ name: NEW_NAME })
          .eq('id', booking.id);
        
        if (updateError) {
          throw updateError;
        }
        
        console.log(`   ✅ 예약 ID ${booking.id}: "${booking.name}" → "${NEW_NAME}"`);
        results.bookings.updated++;
      } catch (error) {
        console.error(`   ❌ 예약 ID ${booking.id} 업데이트 실패:`, error.message);
        results.bookings.errors.push({ id: booking.id, error: error.message });
      }
    }
  }
  
  // 고객 업데이트
  if (targetCustomers.length > 0) {
    console.log('\n📝 고객 이름 업데이트 중...');
    for (const customer of targetCustomers) {
      if (customer.name === NEW_NAME) {
        console.log(`   ⏭️  고객 ID ${customer.id}: 이미 "${NEW_NAME}" (변경 없음)`);
        continue;
      }
      
      try {
        const { error: updateError } = await supabase
          .from('customers')
          .update({ name: NEW_NAME })
          .eq('id', customer.id);
        
        if (updateError) {
          throw updateError;
        }
        
        console.log(`   ✅ 고객 ID ${customer.id}: "${customer.name}" → "${NEW_NAME}"`);
        results.customers.updated++;
      } catch (error) {
        console.error(`   ❌ 고객 ID ${customer.id} 업데이트 실패:`, error.message);
        results.customers.errors.push({ id: customer.id, error: error.message });
      }
    }
  }
  
  // 결과 요약
  console.log('\n' + '='.repeat(60));
  console.log('📊 업데이트 결과');
  console.log('='.repeat(60));
  console.log(`✅ 예약 업데이트: ${results.bookings.updated}건`);
  if (results.bookings.errors.length > 0) {
    console.log(`❌ 예약 오류: ${results.bookings.errors.length}건`);
  }
  console.log(`✅ 고객 업데이트: ${results.customers.updated}건`);
  if (results.customers.errors.length > 0) {
    console.log(`❌ 고객 오류: ${results.customers.errors.length}건`);
  }
  console.log('\n✅ 작업 완료!\n');
}

fixJayangdongCustomerName()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('\n❌ 작업 실패:', err);
    process.exit(1);
  });







require('dotenv').config({ path: require('path').join(__dirname, '..', '.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const OLD_NAME = '자양동 부부';
const NEW_NAME = 'VIP1805';
const PHONE = '01052641805'; // 하이픈 제거된 형태

async function fixJayangdongCustomerName() {
  const dryRun = process.argv.includes('--dry-run');
  
  console.log('🔍 "자양동 부부" → "VIP1805" 이름 변경 중...\n');
  if (dryRun) {
    console.log('⚠️  DRY RUN 모드: 실제 수정 없이 확인만 수행합니다.\n');
  }
  
  // 1. 예약 찾기
  console.log('📊 예약 조회 중...');
  const { data: bookings, error: bookingError } = await supabase
    .from('bookings')
    .select('*')
    .or(`name.ilike.%${OLD_NAME}%,phone.eq.${PHONE}`);
  
  if (bookingError) {
    console.error('❌ 예약 조회 오류:', bookingError);
    return;
  }
  
  const targetBookings = bookings?.filter(b => 
    b.name.includes(OLD_NAME) || b.phone === PHONE || b.phone === '010-5264-1805'
  ) || [];
  
  console.log(`✅ 발견된 예약: ${targetBookings.length}건\n`);
  targetBookings.forEach((b, i) => {
    console.log(`${i + 1}. ID: ${b.id}`);
    console.log(`   현재 이름: ${b.name}`);
    console.log(`   전화번호: ${b.phone}`);
    console.log(`   날짜/시간: ${b.date} ${b.time}`);
    console.log(`   서비스: ${b.service_type}`);
    console.log('');
  });
  
  // 2. 고객 찾기
  console.log('📊 고객 조회 중...');
  const { data: customers, error: customerError } = await supabase
    .from('customers')
    .select('*')
    .or(`name.ilike.%${NEW_NAME}%,phone.eq.${PHONE}`);
  
  if (customerError) {
    console.error('❌ 고객 조회 오류:', customerError);
    return;
  }
  
  const targetCustomers = customers?.filter(c => 
    c.name.includes(NEW_NAME) || c.phone === PHONE || c.phone === '010-5264-1805'
  ) || [];
  
  console.log(`✅ 발견된 고객: ${targetCustomers.length}건\n`);
  targetCustomers.forEach((c, i) => {
    console.log(`${i + 1}. ID: ${c.id}`);
    console.log(`   현재 이름: ${c.name}`);
    console.log(`   전화번호: ${c.phone}`);
    console.log(`   방문 횟수: ${c.visit_count || 0}회`);
    console.log('');
  });
  
  if (targetBookings.length === 0 && targetCustomers.length === 0) {
    console.log('❌ 변경할 데이터가 없습니다.\n');
    return;
  }
  
  if (dryRun) {
    console.log('='.repeat(60));
    console.log('💡 실제 수정 내용:');
    console.log('='.repeat(60));
    if (targetBookings.length > 0) {
      console.log(`\n📝 예약 이름 변경:`);
      targetBookings.forEach(b => {
        console.log(`   - ID ${b.id}: "${b.name}" → "${NEW_NAME}"`);
      });
    }
    if (targetCustomers.length > 0) {
      console.log(`\n📝 고객 이름 변경:`);
      targetCustomers.forEach(c => {
        if (c.name !== NEW_NAME) {
          console.log(`   - ID ${c.id}: "${c.name}" → "${NEW_NAME}"`);
        } else {
          console.log(`   - ID ${c.id}: "${c.name}" (변경 없음)`);
        }
      });
    }
    console.log('\n💡 실제 수정을 하려면 --dry-run 옵션을 제거하고 다시 실행하세요.\n');
    return;
  }
  
  // 실제 업데이트
  console.log('='.repeat(60));
  console.log('📝 업데이트 시작...');
  console.log('='.repeat(60));
  
  const results = {
    bookings: { updated: 0, errors: [] },
    customers: { updated: 0, errors: [] },
  };
  
  // 예약 업데이트
  if (targetBookings.length > 0) {
    console.log('\n📝 예약 이름 업데이트 중...');
    for (const booking of targetBookings) {
      try {
        const { error: updateError } = await supabase
          .from('bookings')
          .update({ name: NEW_NAME })
          .eq('id', booking.id);
        
        if (updateError) {
          throw updateError;
        }
        
        console.log(`   ✅ 예약 ID ${booking.id}: "${booking.name}" → "${NEW_NAME}"`);
        results.bookings.updated++;
      } catch (error) {
        console.error(`   ❌ 예약 ID ${booking.id} 업데이트 실패:`, error.message);
        results.bookings.errors.push({ id: booking.id, error: error.message });
      }
    }
  }
  
  // 고객 업데이트
  if (targetCustomers.length > 0) {
    console.log('\n📝 고객 이름 업데이트 중...');
    for (const customer of targetCustomers) {
      if (customer.name === NEW_NAME) {
        console.log(`   ⏭️  고객 ID ${customer.id}: 이미 "${NEW_NAME}" (변경 없음)`);
        continue;
      }
      
      try {
        const { error: updateError } = await supabase
          .from('customers')
          .update({ name: NEW_NAME })
          .eq('id', customer.id);
        
        if (updateError) {
          throw updateError;
        }
        
        console.log(`   ✅ 고객 ID ${customer.id}: "${customer.name}" → "${NEW_NAME}"`);
        results.customers.updated++;
      } catch (error) {
        console.error(`   ❌ 고객 ID ${customer.id} 업데이트 실패:`, error.message);
        results.customers.errors.push({ id: customer.id, error: error.message });
      }
    }
  }
  
  // 결과 요약
  console.log('\n' + '='.repeat(60));
  console.log('📊 업데이트 결과');
  console.log('='.repeat(60));
  console.log(`✅ 예약 업데이트: ${results.bookings.updated}건`);
  if (results.bookings.errors.length > 0) {
    console.log(`❌ 예약 오류: ${results.bookings.errors.length}건`);
  }
  console.log(`✅ 고객 업데이트: ${results.customers.updated}건`);
  if (results.customers.errors.length > 0) {
    console.log(`❌ 고객 오류: ${results.customers.errors.length}건`);
  }
  console.log('\n✅ 작업 완료!\n');
}

fixJayangdongCustomerName()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('\n❌ 작업 실패:', err);
    process.exit(1);
  });







require('dotenv').config({ path: require('path').join(__dirname, '..', '.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const OLD_NAME = '자양동 부부';
const NEW_NAME = 'VIP1805';
const PHONE = '01052641805'; // 하이픈 제거된 형태

async function fixJayangdongCustomerName() {
  const dryRun = process.argv.includes('--dry-run');
  
  console.log('🔍 "자양동 부부" → "VIP1805" 이름 변경 중...\n');
  if (dryRun) {
    console.log('⚠️  DRY RUN 모드: 실제 수정 없이 확인만 수행합니다.\n');
  }
  
  // 1. 예약 찾기
  console.log('📊 예약 조회 중...');
  const { data: bookings, error: bookingError } = await supabase
    .from('bookings')
    .select('*')
    .or(`name.ilike.%${OLD_NAME}%,phone.eq.${PHONE}`);
  
  if (bookingError) {
    console.error('❌ 예약 조회 오류:', bookingError);
    return;
  }
  
  const targetBookings = bookings?.filter(b => 
    b.name.includes(OLD_NAME) || b.phone === PHONE || b.phone === '010-5264-1805'
  ) || [];
  
  console.log(`✅ 발견된 예약: ${targetBookings.length}건\n`);
  targetBookings.forEach((b, i) => {
    console.log(`${i + 1}. ID: ${b.id}`);
    console.log(`   현재 이름: ${b.name}`);
    console.log(`   전화번호: ${b.phone}`);
    console.log(`   날짜/시간: ${b.date} ${b.time}`);
    console.log(`   서비스: ${b.service_type}`);
    console.log('');
  });
  
  // 2. 고객 찾기
  console.log('📊 고객 조회 중...');
  const { data: customers, error: customerError } = await supabase
    .from('customers')
    .select('*')
    .or(`name.ilike.%${NEW_NAME}%,phone.eq.${PHONE}`);
  
  if (customerError) {
    console.error('❌ 고객 조회 오류:', customerError);
    return;
  }
  
  const targetCustomers = customers?.filter(c => 
    c.name.includes(NEW_NAME) || c.phone === PHONE || c.phone === '010-5264-1805'
  ) || [];
  
  console.log(`✅ 발견된 고객: ${targetCustomers.length}건\n`);
  targetCustomers.forEach((c, i) => {
    console.log(`${i + 1}. ID: ${c.id}`);
    console.log(`   현재 이름: ${c.name}`);
    console.log(`   전화번호: ${c.phone}`);
    console.log(`   방문 횟수: ${c.visit_count || 0}회`);
    console.log('');
  });
  
  if (targetBookings.length === 0 && targetCustomers.length === 0) {
    console.log('❌ 변경할 데이터가 없습니다.\n');
    return;
  }
  
  if (dryRun) {
    console.log('='.repeat(60));
    console.log('💡 실제 수정 내용:');
    console.log('='.repeat(60));
    if (targetBookings.length > 0) {
      console.log(`\n📝 예약 이름 변경:`);
      targetBookings.forEach(b => {
        console.log(`   - ID ${b.id}: "${b.name}" → "${NEW_NAME}"`);
      });
    }
    if (targetCustomers.length > 0) {
      console.log(`\n📝 고객 이름 변경:`);
      targetCustomers.forEach(c => {
        if (c.name !== NEW_NAME) {
          console.log(`   - ID ${c.id}: "${c.name}" → "${NEW_NAME}"`);
        } else {
          console.log(`   - ID ${c.id}: "${c.name}" (변경 없음)`);
        }
      });
    }
    console.log('\n💡 실제 수정을 하려면 --dry-run 옵션을 제거하고 다시 실행하세요.\n');
    return;
  }
  
  // 실제 업데이트
  console.log('='.repeat(60));
  console.log('📝 업데이트 시작...');
  console.log('='.repeat(60));
  
  const results = {
    bookings: { updated: 0, errors: [] },
    customers: { updated: 0, errors: [] },
  };
  
  // 예약 업데이트
  if (targetBookings.length > 0) {
    console.log('\n📝 예약 이름 업데이트 중...');
    for (const booking of targetBookings) {
      try {
        const { error: updateError } = await supabase
          .from('bookings')
          .update({ name: NEW_NAME })
          .eq('id', booking.id);
        
        if (updateError) {
          throw updateError;
        }
        
        console.log(`   ✅ 예약 ID ${booking.id}: "${booking.name}" → "${NEW_NAME}"`);
        results.bookings.updated++;
      } catch (error) {
        console.error(`   ❌ 예약 ID ${booking.id} 업데이트 실패:`, error.message);
        results.bookings.errors.push({ id: booking.id, error: error.message });
      }
    }
  }
  
  // 고객 업데이트
  if (targetCustomers.length > 0) {
    console.log('\n📝 고객 이름 업데이트 중...');
    for (const customer of targetCustomers) {
      if (customer.name === NEW_NAME) {
        console.log(`   ⏭️  고객 ID ${customer.id}: 이미 "${NEW_NAME}" (변경 없음)`);
        continue;
      }
      
      try {
        const { error: updateError } = await supabase
          .from('customers')
          .update({ name: NEW_NAME })
          .eq('id', customer.id);
        
        if (updateError) {
          throw updateError;
        }
        
        console.log(`   ✅ 고객 ID ${customer.id}: "${customer.name}" → "${NEW_NAME}"`);
        results.customers.updated++;
      } catch (error) {
        console.error(`   ❌ 고객 ID ${customer.id} 업데이트 실패:`, error.message);
        results.customers.errors.push({ id: customer.id, error: error.message });
      }
    }
  }
  
  // 결과 요약
  console.log('\n' + '='.repeat(60));
  console.log('📊 업데이트 결과');
  console.log('='.repeat(60));
  console.log(`✅ 예약 업데이트: ${results.bookings.updated}건`);
  if (results.bookings.errors.length > 0) {
    console.log(`❌ 예약 오류: ${results.bookings.errors.length}건`);
  }
  console.log(`✅ 고객 업데이트: ${results.customers.updated}건`);
  if (results.customers.errors.length > 0) {
    console.log(`❌ 고객 오류: ${results.customers.errors.length}건`);
  }
  console.log('\n✅ 작업 완료!\n');
}

fixJayangdongCustomerName()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('\n❌ 작업 실패:', err);
    process.exit(1);
  });























