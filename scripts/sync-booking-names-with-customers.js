const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function syncBookingNamesWithCustomers() {
  const dryRun = process.argv.includes('--dry-run');
  
  console.log('🔍 예약 이름을 고객 테이블 이름과 동기화 중...\n');
  if (dryRun) {
    console.log('⚠️  DRY RUN 모드: 실제 수정 없이 확인만 수행합니다.\n');
  }
  
  // 모든 고객 데이터 가져오기
  let allCustomers = [];
  let from = 0;
  const pageSize = 1000;
  let hasMore = true;
  
  while (hasMore) {
    const { data, error } = await supabase
      .from('customers')
      .select('id, name, phone')
      .order('id', { ascending: true })
      .range(from, from + pageSize - 1);
    
    if (error) {
      console.error('❌ 고객 데이터 로드 오류:', error);
      return;
    }
    
    if (data && data.length > 0) {
      allCustomers = [...allCustomers, ...data];
      from += pageSize;
      hasMore = data.length === pageSize;
    } else {
      hasMore = false;
    }
  }
  
  console.log(`✅ 총 ${allCustomers.length}명의 고객 로드 완료\n`);
  
  const results = {
    updated: [],
    skipped: [],
    errors: [],
  };
  
  // 각 고객에 대해 예약 이름 동기화
  for (const customer of allCustomers) {
    if (!customer.phone || !customer.name) {
      continue;
    }
    
    try {
      // 같은 전화번호를 가진 모든 예약 조회
      const { data: bookings, error: bookingError } = await supabase
        .from('bookings')
        .select('id, name, phone, date')
        .eq('phone', customer.phone);
      
      if (bookingError) {
        console.error(`❌ 예약 조회 오류 (${customer.name}):`, bookingError);
        results.errors.push({ customer: customer.name, error: bookingError.message });
        continue;
      }
      
      if (!bookings || bookings.length === 0) {
        continue; // 예약이 없는 고객은 건너뜀
      }
      
      // 이름이 다른 예약만 필터링
      const bookingsToUpdate = bookings.filter(b => b.name !== customer.name);
      
      if (bookingsToUpdate.length === 0) {
        continue; // 이미 동기화된 경우
      }
      
      console.log(`\n[${customer.name}] 처리 중...`);
      console.log(`   전화번호: ${customer.phone}`);
      console.log(`   업데이트 필요한 예약: ${bookingsToUpdate.length}건`);
      
      bookingsToUpdate.forEach(b => {
        console.log(`     - 예약 ID ${b.id}: "${b.name}" → "${customer.name}" (${b.date})`);
      });
      
      if (!dryRun) {
        // 예약 이름 업데이트
        const bookingIds = bookingsToUpdate.map(b => b.id);
        const { error: updateError } = await supabase
          .from('bookings')
          .update({ name: customer.name })
          .in('id', bookingIds);
        
        if (updateError) {
          throw updateError;
        }
        
        console.log(`   ✅ ${bookingsToUpdate.length}건 업데이트 완료`);
      }
      
      results.updated.push({
        customer: customer.name,
        phone: customer.phone,
        count: bookingsToUpdate.length,
        bookings: bookingsToUpdate.map(b => ({ id: b.id, oldName: b.name, date: b.date }))
      });
      
    } catch (error) {
      console.error(`   ❌ 처리 실패:`, error.message);
      results.errors.push({ customer: customer.name, error: error.message });
    }
  }
  
  // 결과 요약
  console.log('\n' + '='.repeat(60));
  console.log('📊 동기화 결과');
  console.log('='.repeat(60));
  console.log(`✅ 업데이트 완료: ${results.updated.length}명의 고객`);
  console.log(`   총 ${results.updated.reduce((sum, r) => sum + r.count, 0)}건의 예약 업데이트`);
  console.log(`❌ 오류: ${results.errors.length}건`);
  
  if (results.updated.length > 0) {
    console.log('\n📋 업데이트된 고객 (샘플 10명):');
    results.updated.slice(0, 10).forEach((r, i) => {
      console.log(`   ${i + 1}. ${r.customer} (${r.phone}): ${r.count}건`);
    });
    if (results.updated.length > 10) {
      console.log(`   ... 외 ${results.updated.length - 10}명`);
    }
  }
  
  if (results.errors.length > 0) {
    console.log('\n❌ 오류 발생:');
    results.errors.forEach((e, i) => {
      console.log(`   ${i + 1}. ${e.customer}: ${e.error}`);
    });
  }
  
  if (dryRun) {
    console.log('\n💡 실제 동기화를 하려면 --dry-run 옵션을 제거하고 다시 실행하세요.');
  } else {
    console.log('\n✅ 동기화 완료!');
    console.log('💡 이제 고객 테이블의 이름과 예약 테이블의 이름이 일치합니다.');
  }
}

syncBookingNamesWithCustomers()
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

async function syncBookingNamesWithCustomers() {
  const dryRun = process.argv.includes('--dry-run');
  
  console.log('🔍 예약 이름을 고객 테이블 이름과 동기화 중...\n');
  if (dryRun) {
    console.log('⚠️  DRY RUN 모드: 실제 수정 없이 확인만 수행합니다.\n');
  }
  
  // 모든 고객 데이터 가져오기
  let allCustomers = [];
  let from = 0;
  const pageSize = 1000;
  let hasMore = true;
  
  while (hasMore) {
    const { data, error } = await supabase
      .from('customers')
      .select('id, name, phone')
      .order('id', { ascending: true })
      .range(from, from + pageSize - 1);
    
    if (error) {
      console.error('❌ 고객 데이터 로드 오류:', error);
      return;
    }
    
    if (data && data.length > 0) {
      allCustomers = [...allCustomers, ...data];
      from += pageSize;
      hasMore = data.length === pageSize;
    } else {
      hasMore = false;
    }
  }
  
  console.log(`✅ 총 ${allCustomers.length}명의 고객 로드 완료\n`);
  
  const results = {
    updated: [],
    skipped: [],
    errors: [],
  };
  
  // 각 고객에 대해 예약 이름 동기화
  for (const customer of allCustomers) {
    if (!customer.phone || !customer.name) {
      continue;
    }
    
    try {
      // 같은 전화번호를 가진 모든 예약 조회
      const { data: bookings, error: bookingError } = await supabase
        .from('bookings')
        .select('id, name, phone, date')
        .eq('phone', customer.phone);
      
      if (bookingError) {
        console.error(`❌ 예약 조회 오류 (${customer.name}):`, bookingError);
        results.errors.push({ customer: customer.name, error: bookingError.message });
        continue;
      }
      
      if (!bookings || bookings.length === 0) {
        continue; // 예약이 없는 고객은 건너뜀
      }
      
      // 이름이 다른 예약만 필터링
      const bookingsToUpdate = bookings.filter(b => b.name !== customer.name);
      
      if (bookingsToUpdate.length === 0) {
        continue; // 이미 동기화된 경우
      }
      
      console.log(`\n[${customer.name}] 처리 중...`);
      console.log(`   전화번호: ${customer.phone}`);
      console.log(`   업데이트 필요한 예약: ${bookingsToUpdate.length}건`);
      
      bookingsToUpdate.forEach(b => {
        console.log(`     - 예약 ID ${b.id}: "${b.name}" → "${customer.name}" (${b.date})`);
      });
      
      if (!dryRun) {
        // 예약 이름 업데이트
        const bookingIds = bookingsToUpdate.map(b => b.id);
        const { error: updateError } = await supabase
          .from('bookings')
          .update({ name: customer.name })
          .in('id', bookingIds);
        
        if (updateError) {
          throw updateError;
        }
        
        console.log(`   ✅ ${bookingsToUpdate.length}건 업데이트 완료`);
      }
      
      results.updated.push({
        customer: customer.name,
        phone: customer.phone,
        count: bookingsToUpdate.length,
        bookings: bookingsToUpdate.map(b => ({ id: b.id, oldName: b.name, date: b.date }))
      });
      
    } catch (error) {
      console.error(`   ❌ 처리 실패:`, error.message);
      results.errors.push({ customer: customer.name, error: error.message });
    }
  }
  
  // 결과 요약
  console.log('\n' + '='.repeat(60));
  console.log('📊 동기화 결과');
  console.log('='.repeat(60));
  console.log(`✅ 업데이트 완료: ${results.updated.length}명의 고객`);
  console.log(`   총 ${results.updated.reduce((sum, r) => sum + r.count, 0)}건의 예약 업데이트`);
  console.log(`❌ 오류: ${results.errors.length}건`);
  
  if (results.updated.length > 0) {
    console.log('\n📋 업데이트된 고객 (샘플 10명):');
    results.updated.slice(0, 10).forEach((r, i) => {
      console.log(`   ${i + 1}. ${r.customer} (${r.phone}): ${r.count}건`);
    });
    if (results.updated.length > 10) {
      console.log(`   ... 외 ${results.updated.length - 10}명`);
    }
  }
  
  if (results.errors.length > 0) {
    console.log('\n❌ 오류 발생:');
    results.errors.forEach((e, i) => {
      console.log(`   ${i + 1}. ${e.customer}: ${e.error}`);
    });
  }
  
  if (dryRun) {
    console.log('\n💡 실제 동기화를 하려면 --dry-run 옵션을 제거하고 다시 실행하세요.');
  } else {
    console.log('\n✅ 동기화 완료!');
    console.log('💡 이제 고객 테이블의 이름과 예약 테이블의 이름이 일치합니다.');
  }
}

syncBookingNamesWithCustomers()
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

async function syncBookingNamesWithCustomers() {
  const dryRun = process.argv.includes('--dry-run');
  
  console.log('🔍 예약 이름을 고객 테이블 이름과 동기화 중...\n');
  if (dryRun) {
    console.log('⚠️  DRY RUN 모드: 실제 수정 없이 확인만 수행합니다.\n');
  }
  
  // 모든 고객 데이터 가져오기
  let allCustomers = [];
  let from = 0;
  const pageSize = 1000;
  let hasMore = true;
  
  while (hasMore) {
    const { data, error } = await supabase
      .from('customers')
      .select('id, name, phone')
      .order('id', { ascending: true })
      .range(from, from + pageSize - 1);
    
    if (error) {
      console.error('❌ 고객 데이터 로드 오류:', error);
      return;
    }
    
    if (data && data.length > 0) {
      allCustomers = [...allCustomers, ...data];
      from += pageSize;
      hasMore = data.length === pageSize;
    } else {
      hasMore = false;
    }
  }
  
  console.log(`✅ 총 ${allCustomers.length}명의 고객 로드 완료\n`);
  
  const results = {
    updated: [],
    skipped: [],
    errors: [],
  };
  
  // 각 고객에 대해 예약 이름 동기화
  for (const customer of allCustomers) {
    if (!customer.phone || !customer.name) {
      continue;
    }
    
    try {
      // 같은 전화번호를 가진 모든 예약 조회
      const { data: bookings, error: bookingError } = await supabase
        .from('bookings')
        .select('id, name, phone, date')
        .eq('phone', customer.phone);
      
      if (bookingError) {
        console.error(`❌ 예약 조회 오류 (${customer.name}):`, bookingError);
        results.errors.push({ customer: customer.name, error: bookingError.message });
        continue;
      }
      
      if (!bookings || bookings.length === 0) {
        continue; // 예약이 없는 고객은 건너뜀
      }
      
      // 이름이 다른 예약만 필터링
      const bookingsToUpdate = bookings.filter(b => b.name !== customer.name);
      
      if (bookingsToUpdate.length === 0) {
        continue; // 이미 동기화된 경우
      }
      
      console.log(`\n[${customer.name}] 처리 중...`);
      console.log(`   전화번호: ${customer.phone}`);
      console.log(`   업데이트 필요한 예약: ${bookingsToUpdate.length}건`);
      
      bookingsToUpdate.forEach(b => {
        console.log(`     - 예약 ID ${b.id}: "${b.name}" → "${customer.name}" (${b.date})`);
      });
      
      if (!dryRun) {
        // 예약 이름 업데이트
        const bookingIds = bookingsToUpdate.map(b => b.id);
        const { error: updateError } = await supabase
          .from('bookings')
          .update({ name: customer.name })
          .in('id', bookingIds);
        
        if (updateError) {
          throw updateError;
        }
        
        console.log(`   ✅ ${bookingsToUpdate.length}건 업데이트 완료`);
      }
      
      results.updated.push({
        customer: customer.name,
        phone: customer.phone,
        count: bookingsToUpdate.length,
        bookings: bookingsToUpdate.map(b => ({ id: b.id, oldName: b.name, date: b.date }))
      });
      
    } catch (error) {
      console.error(`   ❌ 처리 실패:`, error.message);
      results.errors.push({ customer: customer.name, error: error.message });
    }
  }
  
  // 결과 요약
  console.log('\n' + '='.repeat(60));
  console.log('📊 동기화 결과');
  console.log('='.repeat(60));
  console.log(`✅ 업데이트 완료: ${results.updated.length}명의 고객`);
  console.log(`   총 ${results.updated.reduce((sum, r) => sum + r.count, 0)}건의 예약 업데이트`);
  console.log(`❌ 오류: ${results.errors.length}건`);
  
  if (results.updated.length > 0) {
    console.log('\n📋 업데이트된 고객 (샘플 10명):');
    results.updated.slice(0, 10).forEach((r, i) => {
      console.log(`   ${i + 1}. ${r.customer} (${r.phone}): ${r.count}건`);
    });
    if (results.updated.length > 10) {
      console.log(`   ... 외 ${results.updated.length - 10}명`);
    }
  }
  
  if (results.errors.length > 0) {
    console.log('\n❌ 오류 발생:');
    results.errors.forEach((e, i) => {
      console.log(`   ${i + 1}. ${e.customer}: ${e.error}`);
    });
  }
  
  if (dryRun) {
    console.log('\n💡 실제 동기화를 하려면 --dry-run 옵션을 제거하고 다시 실행하세요.');
  } else {
    console.log('\n✅ 동기화 완료!');
    console.log('💡 이제 고객 테이블의 이름과 예약 테이블의 이름이 일치합니다.');
  }
}

syncBookingNamesWithCustomers()
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

async function syncBookingNamesWithCustomers() {
  const dryRun = process.argv.includes('--dry-run');
  
  console.log('🔍 예약 이름을 고객 테이블 이름과 동기화 중...\n');
  if (dryRun) {
    console.log('⚠️  DRY RUN 모드: 실제 수정 없이 확인만 수행합니다.\n');
  }
  
  // 모든 고객 데이터 가져오기
  let allCustomers = [];
  let from = 0;
  const pageSize = 1000;
  let hasMore = true;
  
  while (hasMore) {
    const { data, error } = await supabase
      .from('customers')
      .select('id, name, phone')
      .order('id', { ascending: true })
      .range(from, from + pageSize - 1);
    
    if (error) {
      console.error('❌ 고객 데이터 로드 오류:', error);
      return;
    }
    
    if (data && data.length > 0) {
      allCustomers = [...allCustomers, ...data];
      from += pageSize;
      hasMore = data.length === pageSize;
    } else {
      hasMore = false;
    }
  }
  
  console.log(`✅ 총 ${allCustomers.length}명의 고객 로드 완료\n`);
  
  const results = {
    updated: [],
    skipped: [],
    errors: [],
  };
  
  // 각 고객에 대해 예약 이름 동기화
  for (const customer of allCustomers) {
    if (!customer.phone || !customer.name) {
      continue;
    }
    
    try {
      // 같은 전화번호를 가진 모든 예약 조회
      const { data: bookings, error: bookingError } = await supabase
        .from('bookings')
        .select('id, name, phone, date')
        .eq('phone', customer.phone);
      
      if (bookingError) {
        console.error(`❌ 예약 조회 오류 (${customer.name}):`, bookingError);
        results.errors.push({ customer: customer.name, error: bookingError.message });
        continue;
      }
      
      if (!bookings || bookings.length === 0) {
        continue; // 예약이 없는 고객은 건너뜀
      }
      
      // 이름이 다른 예약만 필터링
      const bookingsToUpdate = bookings.filter(b => b.name !== customer.name);
      
      if (bookingsToUpdate.length === 0) {
        continue; // 이미 동기화된 경우
      }
      
      console.log(`\n[${customer.name}] 처리 중...`);
      console.log(`   전화번호: ${customer.phone}`);
      console.log(`   업데이트 필요한 예약: ${bookingsToUpdate.length}건`);
      
      bookingsToUpdate.forEach(b => {
        console.log(`     - 예약 ID ${b.id}: "${b.name}" → "${customer.name}" (${b.date})`);
      });
      
      if (!dryRun) {
        // 예약 이름 업데이트
        const bookingIds = bookingsToUpdate.map(b => b.id);
        const { error: updateError } = await supabase
          .from('bookings')
          .update({ name: customer.name })
          .in('id', bookingIds);
        
        if (updateError) {
          throw updateError;
        }
        
        console.log(`   ✅ ${bookingsToUpdate.length}건 업데이트 완료`);
      }
      
      results.updated.push({
        customer: customer.name,
        phone: customer.phone,
        count: bookingsToUpdate.length,
        bookings: bookingsToUpdate.map(b => ({ id: b.id, oldName: b.name, date: b.date }))
      });
      
    } catch (error) {
      console.error(`   ❌ 처리 실패:`, error.message);
      results.errors.push({ customer: customer.name, error: error.message });
    }
  }
  
  // 결과 요약
  console.log('\n' + '='.repeat(60));
  console.log('📊 동기화 결과');
  console.log('='.repeat(60));
  console.log(`✅ 업데이트 완료: ${results.updated.length}명의 고객`);
  console.log(`   총 ${results.updated.reduce((sum, r) => sum + r.count, 0)}건의 예약 업데이트`);
  console.log(`❌ 오류: ${results.errors.length}건`);
  
  if (results.updated.length > 0) {
    console.log('\n📋 업데이트된 고객 (샘플 10명):');
    results.updated.slice(0, 10).forEach((r, i) => {
      console.log(`   ${i + 1}. ${r.customer} (${r.phone}): ${r.count}건`);
    });
    if (results.updated.length > 10) {
      console.log(`   ... 외 ${results.updated.length - 10}명`);
    }
  }
  
  if (results.errors.length > 0) {
    console.log('\n❌ 오류 발생:');
    results.errors.forEach((e, i) => {
      console.log(`   ${i + 1}. ${e.customer}: ${e.error}`);
    });
  }
  
  if (dryRun) {
    console.log('\n💡 실제 동기화를 하려면 --dry-run 옵션을 제거하고 다시 실행하세요.');
  } else {
    console.log('\n✅ 동기화 완료!');
    console.log('💡 이제 고객 테이블의 이름과 예약 테이블의 이름이 일치합니다.');
  }
}

syncBookingNamesWithCustomers()
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

async function syncBookingNamesWithCustomers() {
  const dryRun = process.argv.includes('--dry-run');
  
  console.log('🔍 예약 이름을 고객 테이블 이름과 동기화 중...\n');
  if (dryRun) {
    console.log('⚠️  DRY RUN 모드: 실제 수정 없이 확인만 수행합니다.\n');
  }
  
  // 모든 고객 데이터 가져오기
  let allCustomers = [];
  let from = 0;
  const pageSize = 1000;
  let hasMore = true;
  
  while (hasMore) {
    const { data, error } = await supabase
      .from('customers')
      .select('id, name, phone')
      .order('id', { ascending: true })
      .range(from, from + pageSize - 1);
    
    if (error) {
      console.error('❌ 고객 데이터 로드 오류:', error);
      return;
    }
    
    if (data && data.length > 0) {
      allCustomers = [...allCustomers, ...data];
      from += pageSize;
      hasMore = data.length === pageSize;
    } else {
      hasMore = false;
    }
  }
  
  console.log(`✅ 총 ${allCustomers.length}명의 고객 로드 완료\n`);
  
  const results = {
    updated: [],
    skipped: [],
    errors: [],
  };
  
  // 각 고객에 대해 예약 이름 동기화
  for (const customer of allCustomers) {
    if (!customer.phone || !customer.name) {
      continue;
    }
    
    try {
      // 같은 전화번호를 가진 모든 예약 조회
      const { data: bookings, error: bookingError } = await supabase
        .from('bookings')
        .select('id, name, phone, date')
        .eq('phone', customer.phone);
      
      if (bookingError) {
        console.error(`❌ 예약 조회 오류 (${customer.name}):`, bookingError);
        results.errors.push({ customer: customer.name, error: bookingError.message });
        continue;
      }
      
      if (!bookings || bookings.length === 0) {
        continue; // 예약이 없는 고객은 건너뜀
      }
      
      // 이름이 다른 예약만 필터링
      const bookingsToUpdate = bookings.filter(b => b.name !== customer.name);
      
      if (bookingsToUpdate.length === 0) {
        continue; // 이미 동기화된 경우
      }
      
      console.log(`\n[${customer.name}] 처리 중...`);
      console.log(`   전화번호: ${customer.phone}`);
      console.log(`   업데이트 필요한 예약: ${bookingsToUpdate.length}건`);
      
      bookingsToUpdate.forEach(b => {
        console.log(`     - 예약 ID ${b.id}: "${b.name}" → "${customer.name}" (${b.date})`);
      });
      
      if (!dryRun) {
        // 예약 이름 업데이트
        const bookingIds = bookingsToUpdate.map(b => b.id);
        const { error: updateError } = await supabase
          .from('bookings')
          .update({ name: customer.name })
          .in('id', bookingIds);
        
        if (updateError) {
          throw updateError;
        }
        
        console.log(`   ✅ ${bookingsToUpdate.length}건 업데이트 완료`);
      }
      
      results.updated.push({
        customer: customer.name,
        phone: customer.phone,
        count: bookingsToUpdate.length,
        bookings: bookingsToUpdate.map(b => ({ id: b.id, oldName: b.name, date: b.date }))
      });
      
    } catch (error) {
      console.error(`   ❌ 처리 실패:`, error.message);
      results.errors.push({ customer: customer.name, error: error.message });
    }
  }
  
  // 결과 요약
  console.log('\n' + '='.repeat(60));
  console.log('📊 동기화 결과');
  console.log('='.repeat(60));
  console.log(`✅ 업데이트 완료: ${results.updated.length}명의 고객`);
  console.log(`   총 ${results.updated.reduce((sum, r) => sum + r.count, 0)}건의 예약 업데이트`);
  console.log(`❌ 오류: ${results.errors.length}건`);
  
  if (results.updated.length > 0) {
    console.log('\n📋 업데이트된 고객 (샘플 10명):');
    results.updated.slice(0, 10).forEach((r, i) => {
      console.log(`   ${i + 1}. ${r.customer} (${r.phone}): ${r.count}건`);
    });
    if (results.updated.length > 10) {
      console.log(`   ... 외 ${results.updated.length - 10}명`);
    }
  }
  
  if (results.errors.length > 0) {
    console.log('\n❌ 오류 발생:');
    results.errors.forEach((e, i) => {
      console.log(`   ${i + 1}. ${e.customer}: ${e.error}`);
    });
  }
  
  if (dryRun) {
    console.log('\n💡 실제 동기화를 하려면 --dry-run 옵션을 제거하고 다시 실행하세요.');
  } else {
    console.log('\n✅ 동기화 완료!');
    console.log('💡 이제 고객 테이블의 이름과 예약 테이블의 이름이 일치합니다.');
  }
}

syncBookingNamesWithCustomers()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('\n❌ 작업 실패:', err);
    process.exit(1);
  });























