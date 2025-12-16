const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// 이름에서 접미사 제거
function removeNameSuffixes(name) {
  if (!name) return { baseName: name, removedSuffix: null };
  
  const suffixes = [
    ' 방문시타',
    ' 방문',
    ' 방문AS',
    ' 방문 A/S',
    'AS',
    'as',
    ' A/S',
    ' a/s',
  ];
  
  for (const suffix of suffixes) {
    if (name.endsWith(suffix)) {
      return {
        baseName: name.slice(0, -suffix.length).trim(),
        removedSuffix: suffix
      };
    }
  }
  
  return { baseName: name, removedSuffix: null };
}

async function fixVisitSuffixNames() {
  const dryRun = process.argv.includes('--dry-run');
  
  console.log('🔍 "방문시타" 등 접미사 제거 중...\n');
  if (dryRun) {
    console.log('⚠️  DRY RUN 모드: 실제 수정 없이 확인만 수행합니다.\n');
  }
  
  // 모든 예약 데이터 가져오기
  let allBookings = [];
  let from = 0;
  const pageSize = 1000;
  let hasMore = true;
  
  while (hasMore) {
    const { data, error } = await supabase
      .from('bookings')
      .select('*')
      .order('created_at', { ascending: true })
      .range(from, from + pageSize - 1);
    
    if (error) {
      console.error('❌ 예약 데이터 로드 오류:', error);
      return;
    }
    
    if (data && data.length > 0) {
      allBookings = [...allBookings, ...data];
      from += pageSize;
      hasMore = data.length === pageSize;
    } else {
      hasMore = false;
    }
  }
  
  console.log(`✅ 총 ${allBookings.length}건 로드 완료\n`);
  
  // 접미사가 있는 예약 찾기
  const bookingsToFix = [];
  
  for (const booking of allBookings) {
    const { baseName, removedSuffix } = removeNameSuffixes(booking.name);
    
    if (removedSuffix) {
      bookingsToFix.push({
        booking,
        baseName,
        removedSuffix
      });
    }
  }
  
  console.log(`📋 접미사가 있는 예약 발견: ${bookingsToFix.length}건\n`);
  
  if (bookingsToFix.length === 0) {
    console.log('✅ 처리할 패턴이 없습니다.\n');
    return;
  }
  
  // 처리 결과
  const results = {
    updated: [],
    errors: [],
  };
  
  // 각 예약 처리
  for (const { booking, baseName, removedSuffix } of bookingsToFix) {
    try {
      console.log(`[${booking.id}] 처리 중: "${booking.name}" → "${baseName}"`);
      console.log(`   제거된 접미사: ${removedSuffix}`);
      console.log(`   전화번호: ${booking.phone}, 날짜: ${booking.date}`);
      
      if (!dryRun) {
        // 예약 이름 업데이트
        const { error: updateError } = await supabase
          .from('bookings')
          .update({ name: baseName })
          .eq('id', booking.id);
        
        if (updateError) {
          throw updateError;
        }
        
        // 같은 전화번호를 가진 고객 이름도 업데이트 (더 정확한 이름으로)
        const { data: existingCustomer } = await supabase
          .from('customers')
          .select('id, name')
          .eq('phone', booking.phone)
          .single();
        
        if (existingCustomer) {
          // 고객 이름이 예약 이름과 같거나 더 긴 경우 업데이트
          const customerNameSuffix = removeNameSuffixes(existingCustomer.name);
          if (customerNameSuffix.removedSuffix || existingCustomer.name === booking.name) {
            await supabase
              .from('customers')
              .update({ name: baseName })
              .eq('id', existingCustomer.id);
            console.log(`   고객 이름도 업데이트: "${existingCustomer.name}" → "${baseName}"`);
          }
        }
      }
      
      results.updated.push({
        id: booking.id,
        originalName: booking.name,
        newName: baseName,
        removedSuffix,
      });
      
      console.log(`   ✅ 처리 완료`);
      console.log('');
      
    } catch (error) {
      console.error(`   ❌ 처리 실패:`, error);
      results.errors.push({
        id: booking.id,
        name: booking.name,
        error: error.message,
      });
      console.log('');
    }
  }
  
  // 결과 요약
  console.log('='.repeat(60));
  console.log('📊 처리 결과');
  console.log('='.repeat(60));
  console.log(`✅ 처리 완료: ${results.updated.length}건`);
  console.log(`❌ 오류: ${results.errors.length}건`);
  
  if (results.updated.length > 0) {
    console.log('\n📋 처리된 예약 (샘플 10건):');
    results.updated.slice(0, 10).forEach((r, i) => {
      console.log(`   ${i + 1}. "${r.originalName}" → "${r.newName}" (${r.removedSuffix} 제거)`);
    });
    if (results.updated.length > 10) {
      console.log(`   ... 외 ${results.updated.length - 10}건`);
    }
  }
  
  if (results.errors.length > 0) {
    console.log('\n❌ 오류 발생:');
    results.errors.forEach((e, i) => {
      console.log(`   ${i + 1}. ${e.name}: ${e.error}`);
    });
  }
  
  if (dryRun) {
    console.log('\n💡 실제 수정을 하려면 --dry-run 옵션을 제거하고 다시 실행하세요.');
  } else {
    console.log('\n✅ 작업 완료!');
    console.log('💡 예약과 고객 이름이 정규화되었습니다.');
  }
}

fixVisitSuffixNames()
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

// 이름에서 접미사 제거
function removeNameSuffixes(name) {
  if (!name) return { baseName: name, removedSuffix: null };
  
  const suffixes = [
    ' 방문시타',
    ' 방문',
    ' 방문AS',
    ' 방문 A/S',
    'AS',
    'as',
    ' A/S',
    ' a/s',
  ];
  
  for (const suffix of suffixes) {
    if (name.endsWith(suffix)) {
      return {
        baseName: name.slice(0, -suffix.length).trim(),
        removedSuffix: suffix
      };
    }
  }
  
  return { baseName: name, removedSuffix: null };
}

async function fixVisitSuffixNames() {
  const dryRun = process.argv.includes('--dry-run');
  
  console.log('🔍 "방문시타" 등 접미사 제거 중...\n');
  if (dryRun) {
    console.log('⚠️  DRY RUN 모드: 실제 수정 없이 확인만 수행합니다.\n');
  }
  
  // 모든 예약 데이터 가져오기
  let allBookings = [];
  let from = 0;
  const pageSize = 1000;
  let hasMore = true;
  
  while (hasMore) {
    const { data, error } = await supabase
      .from('bookings')
      .select('*')
      .order('created_at', { ascending: true })
      .range(from, from + pageSize - 1);
    
    if (error) {
      console.error('❌ 예약 데이터 로드 오류:', error);
      return;
    }
    
    if (data && data.length > 0) {
      allBookings = [...allBookings, ...data];
      from += pageSize;
      hasMore = data.length === pageSize;
    } else {
      hasMore = false;
    }
  }
  
  console.log(`✅ 총 ${allBookings.length}건 로드 완료\n`);
  
  // 접미사가 있는 예약 찾기
  const bookingsToFix = [];
  
  for (const booking of allBookings) {
    const { baseName, removedSuffix } = removeNameSuffixes(booking.name);
    
    if (removedSuffix) {
      bookingsToFix.push({
        booking,
        baseName,
        removedSuffix
      });
    }
  }
  
  console.log(`📋 접미사가 있는 예약 발견: ${bookingsToFix.length}건\n`);
  
  if (bookingsToFix.length === 0) {
    console.log('✅ 처리할 패턴이 없습니다.\n');
    return;
  }
  
  // 처리 결과
  const results = {
    updated: [],
    errors: [],
  };
  
  // 각 예약 처리
  for (const { booking, baseName, removedSuffix } of bookingsToFix) {
    try {
      console.log(`[${booking.id}] 처리 중: "${booking.name}" → "${baseName}"`);
      console.log(`   제거된 접미사: ${removedSuffix}`);
      console.log(`   전화번호: ${booking.phone}, 날짜: ${booking.date}`);
      
      if (!dryRun) {
        // 예약 이름 업데이트
        const { error: updateError } = await supabase
          .from('bookings')
          .update({ name: baseName })
          .eq('id', booking.id);
        
        if (updateError) {
          throw updateError;
        }
        
        // 같은 전화번호를 가진 고객 이름도 업데이트 (더 정확한 이름으로)
        const { data: existingCustomer } = await supabase
          .from('customers')
          .select('id, name')
          .eq('phone', booking.phone)
          .single();
        
        if (existingCustomer) {
          // 고객 이름이 예약 이름과 같거나 더 긴 경우 업데이트
          const customerNameSuffix = removeNameSuffixes(existingCustomer.name);
          if (customerNameSuffix.removedSuffix || existingCustomer.name === booking.name) {
            await supabase
              .from('customers')
              .update({ name: baseName })
              .eq('id', existingCustomer.id);
            console.log(`   고객 이름도 업데이트: "${existingCustomer.name}" → "${baseName}"`);
          }
        }
      }
      
      results.updated.push({
        id: booking.id,
        originalName: booking.name,
        newName: baseName,
        removedSuffix,
      });
      
      console.log(`   ✅ 처리 완료`);
      console.log('');
      
    } catch (error) {
      console.error(`   ❌ 처리 실패:`, error);
      results.errors.push({
        id: booking.id,
        name: booking.name,
        error: error.message,
      });
      console.log('');
    }
  }
  
  // 결과 요약
  console.log('='.repeat(60));
  console.log('📊 처리 결과');
  console.log('='.repeat(60));
  console.log(`✅ 처리 완료: ${results.updated.length}건`);
  console.log(`❌ 오류: ${results.errors.length}건`);
  
  if (results.updated.length > 0) {
    console.log('\n📋 처리된 예약 (샘플 10건):');
    results.updated.slice(0, 10).forEach((r, i) => {
      console.log(`   ${i + 1}. "${r.originalName}" → "${r.newName}" (${r.removedSuffix} 제거)`);
    });
    if (results.updated.length > 10) {
      console.log(`   ... 외 ${results.updated.length - 10}건`);
    }
  }
  
  if (results.errors.length > 0) {
    console.log('\n❌ 오류 발생:');
    results.errors.forEach((e, i) => {
      console.log(`   ${i + 1}. ${e.name}: ${e.error}`);
    });
  }
  
  if (dryRun) {
    console.log('\n💡 실제 수정을 하려면 --dry-run 옵션을 제거하고 다시 실행하세요.');
  } else {
    console.log('\n✅ 작업 완료!');
    console.log('💡 예약과 고객 이름이 정규화되었습니다.');
  }
}

fixVisitSuffixNames()
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

// 이름에서 접미사 제거
function removeNameSuffixes(name) {
  if (!name) return { baseName: name, removedSuffix: null };
  
  const suffixes = [
    ' 방문시타',
    ' 방문',
    ' 방문AS',
    ' 방문 A/S',
    'AS',
    'as',
    ' A/S',
    ' a/s',
  ];
  
  for (const suffix of suffixes) {
    if (name.endsWith(suffix)) {
      return {
        baseName: name.slice(0, -suffix.length).trim(),
        removedSuffix: suffix
      };
    }
  }
  
  return { baseName: name, removedSuffix: null };
}

async function fixVisitSuffixNames() {
  const dryRun = process.argv.includes('--dry-run');
  
  console.log('🔍 "방문시타" 등 접미사 제거 중...\n');
  if (dryRun) {
    console.log('⚠️  DRY RUN 모드: 실제 수정 없이 확인만 수행합니다.\n');
  }
  
  // 모든 예약 데이터 가져오기
  let allBookings = [];
  let from = 0;
  const pageSize = 1000;
  let hasMore = true;
  
  while (hasMore) {
    const { data, error } = await supabase
      .from('bookings')
      .select('*')
      .order('created_at', { ascending: true })
      .range(from, from + pageSize - 1);
    
    if (error) {
      console.error('❌ 예약 데이터 로드 오류:', error);
      return;
    }
    
    if (data && data.length > 0) {
      allBookings = [...allBookings, ...data];
      from += pageSize;
      hasMore = data.length === pageSize;
    } else {
      hasMore = false;
    }
  }
  
  console.log(`✅ 총 ${allBookings.length}건 로드 완료\n`);
  
  // 접미사가 있는 예약 찾기
  const bookingsToFix = [];
  
  for (const booking of allBookings) {
    const { baseName, removedSuffix } = removeNameSuffixes(booking.name);
    
    if (removedSuffix) {
      bookingsToFix.push({
        booking,
        baseName,
        removedSuffix
      });
    }
  }
  
  console.log(`📋 접미사가 있는 예약 발견: ${bookingsToFix.length}건\n`);
  
  if (bookingsToFix.length === 0) {
    console.log('✅ 처리할 패턴이 없습니다.\n');
    return;
  }
  
  // 처리 결과
  const results = {
    updated: [],
    errors: [],
  };
  
  // 각 예약 처리
  for (const { booking, baseName, removedSuffix } of bookingsToFix) {
    try {
      console.log(`[${booking.id}] 처리 중: "${booking.name}" → "${baseName}"`);
      console.log(`   제거된 접미사: ${removedSuffix}`);
      console.log(`   전화번호: ${booking.phone}, 날짜: ${booking.date}`);
      
      if (!dryRun) {
        // 예약 이름 업데이트
        const { error: updateError } = await supabase
          .from('bookings')
          .update({ name: baseName })
          .eq('id', booking.id);
        
        if (updateError) {
          throw updateError;
        }
        
        // 같은 전화번호를 가진 고객 이름도 업데이트 (더 정확한 이름으로)
        const { data: existingCustomer } = await supabase
          .from('customers')
          .select('id, name')
          .eq('phone', booking.phone)
          .single();
        
        if (existingCustomer) {
          // 고객 이름이 예약 이름과 같거나 더 긴 경우 업데이트
          const customerNameSuffix = removeNameSuffixes(existingCustomer.name);
          if (customerNameSuffix.removedSuffix || existingCustomer.name === booking.name) {
            await supabase
              .from('customers')
              .update({ name: baseName })
              .eq('id', existingCustomer.id);
            console.log(`   고객 이름도 업데이트: "${existingCustomer.name}" → "${baseName}"`);
          }
        }
      }
      
      results.updated.push({
        id: booking.id,
        originalName: booking.name,
        newName: baseName,
        removedSuffix,
      });
      
      console.log(`   ✅ 처리 완료`);
      console.log('');
      
    } catch (error) {
      console.error(`   ❌ 처리 실패:`, error);
      results.errors.push({
        id: booking.id,
        name: booking.name,
        error: error.message,
      });
      console.log('');
    }
  }
  
  // 결과 요약
  console.log('='.repeat(60));
  console.log('📊 처리 결과');
  console.log('='.repeat(60));
  console.log(`✅ 처리 완료: ${results.updated.length}건`);
  console.log(`❌ 오류: ${results.errors.length}건`);
  
  if (results.updated.length > 0) {
    console.log('\n📋 처리된 예약 (샘플 10건):');
    results.updated.slice(0, 10).forEach((r, i) => {
      console.log(`   ${i + 1}. "${r.originalName}" → "${r.newName}" (${r.removedSuffix} 제거)`);
    });
    if (results.updated.length > 10) {
      console.log(`   ... 외 ${results.updated.length - 10}건`);
    }
  }
  
  if (results.errors.length > 0) {
    console.log('\n❌ 오류 발생:');
    results.errors.forEach((e, i) => {
      console.log(`   ${i + 1}. ${e.name}: ${e.error}`);
    });
  }
  
  if (dryRun) {
    console.log('\n💡 실제 수정을 하려면 --dry-run 옵션을 제거하고 다시 실행하세요.');
  } else {
    console.log('\n✅ 작업 완료!');
    console.log('💡 예약과 고객 이름이 정규화되었습니다.');
  }
}

fixVisitSuffixNames()
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

// 이름에서 접미사 제거
function removeNameSuffixes(name) {
  if (!name) return { baseName: name, removedSuffix: null };
  
  const suffixes = [
    ' 방문시타',
    ' 방문',
    ' 방문AS',
    ' 방문 A/S',
    'AS',
    'as',
    ' A/S',
    ' a/s',
  ];
  
  for (const suffix of suffixes) {
    if (name.endsWith(suffix)) {
      return {
        baseName: name.slice(0, -suffix.length).trim(),
        removedSuffix: suffix
      };
    }
  }
  
  return { baseName: name, removedSuffix: null };
}

async function fixVisitSuffixNames() {
  const dryRun = process.argv.includes('--dry-run');
  
  console.log('🔍 "방문시타" 등 접미사 제거 중...\n');
  if (dryRun) {
    console.log('⚠️  DRY RUN 모드: 실제 수정 없이 확인만 수행합니다.\n');
  }
  
  // 모든 예약 데이터 가져오기
  let allBookings = [];
  let from = 0;
  const pageSize = 1000;
  let hasMore = true;
  
  while (hasMore) {
    const { data, error } = await supabase
      .from('bookings')
      .select('*')
      .order('created_at', { ascending: true })
      .range(from, from + pageSize - 1);
    
    if (error) {
      console.error('❌ 예약 데이터 로드 오류:', error);
      return;
    }
    
    if (data && data.length > 0) {
      allBookings = [...allBookings, ...data];
      from += pageSize;
      hasMore = data.length === pageSize;
    } else {
      hasMore = false;
    }
  }
  
  console.log(`✅ 총 ${allBookings.length}건 로드 완료\n`);
  
  // 접미사가 있는 예약 찾기
  const bookingsToFix = [];
  
  for (const booking of allBookings) {
    const { baseName, removedSuffix } = removeNameSuffixes(booking.name);
    
    if (removedSuffix) {
      bookingsToFix.push({
        booking,
        baseName,
        removedSuffix
      });
    }
  }
  
  console.log(`📋 접미사가 있는 예약 발견: ${bookingsToFix.length}건\n`);
  
  if (bookingsToFix.length === 0) {
    console.log('✅ 처리할 패턴이 없습니다.\n');
    return;
  }
  
  // 처리 결과
  const results = {
    updated: [],
    errors: [],
  };
  
  // 각 예약 처리
  for (const { booking, baseName, removedSuffix } of bookingsToFix) {
    try {
      console.log(`[${booking.id}] 처리 중: "${booking.name}" → "${baseName}"`);
      console.log(`   제거된 접미사: ${removedSuffix}`);
      console.log(`   전화번호: ${booking.phone}, 날짜: ${booking.date}`);
      
      if (!dryRun) {
        // 예약 이름 업데이트
        const { error: updateError } = await supabase
          .from('bookings')
          .update({ name: baseName })
          .eq('id', booking.id);
        
        if (updateError) {
          throw updateError;
        }
        
        // 같은 전화번호를 가진 고객 이름도 업데이트 (더 정확한 이름으로)
        const { data: existingCustomer } = await supabase
          .from('customers')
          .select('id, name')
          .eq('phone', booking.phone)
          .single();
        
        if (existingCustomer) {
          // 고객 이름이 예약 이름과 같거나 더 긴 경우 업데이트
          const customerNameSuffix = removeNameSuffixes(existingCustomer.name);
          if (customerNameSuffix.removedSuffix || existingCustomer.name === booking.name) {
            await supabase
              .from('customers')
              .update({ name: baseName })
              .eq('id', existingCustomer.id);
            console.log(`   고객 이름도 업데이트: "${existingCustomer.name}" → "${baseName}"`);
          }
        }
      }
      
      results.updated.push({
        id: booking.id,
        originalName: booking.name,
        newName: baseName,
        removedSuffix,
      });
      
      console.log(`   ✅ 처리 완료`);
      console.log('');
      
    } catch (error) {
      console.error(`   ❌ 처리 실패:`, error);
      results.errors.push({
        id: booking.id,
        name: booking.name,
        error: error.message,
      });
      console.log('');
    }
  }
  
  // 결과 요약
  console.log('='.repeat(60));
  console.log('📊 처리 결과');
  console.log('='.repeat(60));
  console.log(`✅ 처리 완료: ${results.updated.length}건`);
  console.log(`❌ 오류: ${results.errors.length}건`);
  
  if (results.updated.length > 0) {
    console.log('\n📋 처리된 예약 (샘플 10건):');
    results.updated.slice(0, 10).forEach((r, i) => {
      console.log(`   ${i + 1}. "${r.originalName}" → "${r.newName}" (${r.removedSuffix} 제거)`);
    });
    if (results.updated.length > 10) {
      console.log(`   ... 외 ${results.updated.length - 10}건`);
    }
  }
  
  if (results.errors.length > 0) {
    console.log('\n❌ 오류 발생:');
    results.errors.forEach((e, i) => {
      console.log(`   ${i + 1}. ${e.name}: ${e.error}`);
    });
  }
  
  if (dryRun) {
    console.log('\n💡 실제 수정을 하려면 --dry-run 옵션을 제거하고 다시 실행하세요.');
  } else {
    console.log('\n✅ 작업 완료!');
    console.log('💡 예약과 고객 이름이 정규화되었습니다.');
  }
}

fixVisitSuffixNames()
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

// 이름에서 접미사 제거
function removeNameSuffixes(name) {
  if (!name) return { baseName: name, removedSuffix: null };
  
  const suffixes = [
    ' 방문시타',
    ' 방문',
    ' 방문AS',
    ' 방문 A/S',
    'AS',
    'as',
    ' A/S',
    ' a/s',
  ];
  
  for (const suffix of suffixes) {
    if (name.endsWith(suffix)) {
      return {
        baseName: name.slice(0, -suffix.length).trim(),
        removedSuffix: suffix
      };
    }
  }
  
  return { baseName: name, removedSuffix: null };
}

async function fixVisitSuffixNames() {
  const dryRun = process.argv.includes('--dry-run');
  
  console.log('🔍 "방문시타" 등 접미사 제거 중...\n');
  if (dryRun) {
    console.log('⚠️  DRY RUN 모드: 실제 수정 없이 확인만 수행합니다.\n');
  }
  
  // 모든 예약 데이터 가져오기
  let allBookings = [];
  let from = 0;
  const pageSize = 1000;
  let hasMore = true;
  
  while (hasMore) {
    const { data, error } = await supabase
      .from('bookings')
      .select('*')
      .order('created_at', { ascending: true })
      .range(from, from + pageSize - 1);
    
    if (error) {
      console.error('❌ 예약 데이터 로드 오류:', error);
      return;
    }
    
    if (data && data.length > 0) {
      allBookings = [...allBookings, ...data];
      from += pageSize;
      hasMore = data.length === pageSize;
    } else {
      hasMore = false;
    }
  }
  
  console.log(`✅ 총 ${allBookings.length}건 로드 완료\n`);
  
  // 접미사가 있는 예약 찾기
  const bookingsToFix = [];
  
  for (const booking of allBookings) {
    const { baseName, removedSuffix } = removeNameSuffixes(booking.name);
    
    if (removedSuffix) {
      bookingsToFix.push({
        booking,
        baseName,
        removedSuffix
      });
    }
  }
  
  console.log(`📋 접미사가 있는 예약 발견: ${bookingsToFix.length}건\n`);
  
  if (bookingsToFix.length === 0) {
    console.log('✅ 처리할 패턴이 없습니다.\n');
    return;
  }
  
  // 처리 결과
  const results = {
    updated: [],
    errors: [],
  };
  
  // 각 예약 처리
  for (const { booking, baseName, removedSuffix } of bookingsToFix) {
    try {
      console.log(`[${booking.id}] 처리 중: "${booking.name}" → "${baseName}"`);
      console.log(`   제거된 접미사: ${removedSuffix}`);
      console.log(`   전화번호: ${booking.phone}, 날짜: ${booking.date}`);
      
      if (!dryRun) {
        // 예약 이름 업데이트
        const { error: updateError } = await supabase
          .from('bookings')
          .update({ name: baseName })
          .eq('id', booking.id);
        
        if (updateError) {
          throw updateError;
        }
        
        // 같은 전화번호를 가진 고객 이름도 업데이트 (더 정확한 이름으로)
        const { data: existingCustomer } = await supabase
          .from('customers')
          .select('id, name')
          .eq('phone', booking.phone)
          .single();
        
        if (existingCustomer) {
          // 고객 이름이 예약 이름과 같거나 더 긴 경우 업데이트
          const customerNameSuffix = removeNameSuffixes(existingCustomer.name);
          if (customerNameSuffix.removedSuffix || existingCustomer.name === booking.name) {
            await supabase
              .from('customers')
              .update({ name: baseName })
              .eq('id', existingCustomer.id);
            console.log(`   고객 이름도 업데이트: "${existingCustomer.name}" → "${baseName}"`);
          }
        }
      }
      
      results.updated.push({
        id: booking.id,
        originalName: booking.name,
        newName: baseName,
        removedSuffix,
      });
      
      console.log(`   ✅ 처리 완료`);
      console.log('');
      
    } catch (error) {
      console.error(`   ❌ 처리 실패:`, error);
      results.errors.push({
        id: booking.id,
        name: booking.name,
        error: error.message,
      });
      console.log('');
    }
  }
  
  // 결과 요약
  console.log('='.repeat(60));
  console.log('📊 처리 결과');
  console.log('='.repeat(60));
  console.log(`✅ 처리 완료: ${results.updated.length}건`);
  console.log(`❌ 오류: ${results.errors.length}건`);
  
  if (results.updated.length > 0) {
    console.log('\n📋 처리된 예약 (샘플 10건):');
    results.updated.slice(0, 10).forEach((r, i) => {
      console.log(`   ${i + 1}. "${r.originalName}" → "${r.newName}" (${r.removedSuffix} 제거)`);
    });
    if (results.updated.length > 10) {
      console.log(`   ... 외 ${results.updated.length - 10}건`);
    }
  }
  
  if (results.errors.length > 0) {
    console.log('\n❌ 오류 발생:');
    results.errors.forEach((e, i) => {
      console.log(`   ${i + 1}. ${e.name}: ${e.error}`);
    });
  }
  
  if (dryRun) {
    console.log('\n💡 실제 수정을 하려면 --dry-run 옵션을 제거하고 다시 실행하세요.');
  } else {
    console.log('\n✅ 작업 완료!');
    console.log('💡 예약과 고객 이름이 정규화되었습니다.');
  }
}

fixVisitSuffixNames()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('\n❌ 작업 실패:', err);
    process.exit(1);
  });























