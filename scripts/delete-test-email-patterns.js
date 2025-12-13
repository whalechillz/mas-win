const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// 삭제할 테스트 이메일 패턴 목록
const testEmailPatterns = [
  'aa@aaa.aaaa',
  'aaa.aaa@aaa.aaa',
  'AAA.AAA@AAA.AAA',
  'aaa.aaa@aaa.com',
  'AAA.AAAA@AAA.AAA',
  // 추가 패턴들
  'aa@aa.com',
  'aa@aa.ss',
  'aa@aaa.aaa',
  'AA@AAA.AAA',
  'aaaa@naver.com',
  'GGG@GGG.GG',
  'hh@hh.hh',
  'hh@hh.hhg',
  'hsg@gg.gg',
];

async function deleteTestEmailPatterns() {
  const dryRun = process.argv.includes('--dry-run');
  
  console.log('🔍 테스트 이메일 패턴 찾기 및 삭제 중...\n');
  if (dryRun) {
    console.log('⚠️  DRY RUN 모드: 실제 삭제 없이 확인만 수행합니다.\n');
  }
  
  const results = {
    bookings: [],
    customers: [],
    totalBookings: 0,
    totalCustomers: 0,
    errors: []
  };
  
  // 예약 테이블 처리
  console.log('='.repeat(60));
  console.log('📊 예약 테이블');
  console.log('='.repeat(60));
  
  for (const email of testEmailPatterns) {
    const { data: bookings, error } = await supabase
      .from('bookings')
      .select('id, name, phone, email, date')
      .ilike('email', email);
    
    if (error) {
      console.error(`❌ ${email} 조회 오류:`, error);
      results.errors.push({ email, type: 'booking', error: error.message });
      continue;
    }
    
    if (bookings && bookings.length > 0) {
      console.log(`\n📧 ${email}: ${bookings.length}건`);
      bookings.forEach(b => {
        console.log(`   - ID: ${b.id}, 이름: ${b.name}, 전화번호: ${b.phone}, 날짜: ${b.date}`);
      });
      
      if (!dryRun) {
        const bookingIds = bookings.map(b => b.id);
        const { error: updateError } = await supabase
          .from('bookings')
          .update({ email: null })
          .in('id', bookingIds);
        
        if (updateError) {
          console.error(`   ❌ 삭제 실패:`, updateError);
          results.errors.push({ email, type: 'booking', error: updateError.message });
        } else {
          console.log(`   ✅ 이메일 삭제 완료`);
          results.bookings.push({ email, count: bookings.length });
          results.totalBookings += bookings.length;
        }
      } else {
        results.bookings.push({ email, count: bookings.length });
        results.totalBookings += bookings.length;
      }
    }
  }
  
  // 고객 테이블 처리
  console.log('\n' + '='.repeat(60));
  console.log('📊 고객 테이블');
  console.log('='.repeat(60));
  
  for (const email of testEmailPatterns) {
    const { data: customers, error } = await supabase
      .from('customers')
      .select('id, name, phone, email')
      .ilike('email', email);
    
    if (error) {
      console.error(`❌ ${email} 조회 오류:`, error);
      results.errors.push({ email, type: 'customer', error: error.message });
      continue;
    }
    
    if (customers && customers.length > 0) {
      console.log(`\n📧 ${email}: ${customers.length}건`);
      customers.forEach(c => {
        console.log(`   - ID: ${c.id}, 이름: ${c.name}, 전화번호: ${c.phone}`);
      });
      
      if (!dryRun) {
        const customerIds = customers.map(c => c.id);
        const { error: updateError } = await supabase
          .from('customers')
          .update({ email: null })
          .in('id', customerIds);
        
        if (updateError) {
          console.error(`   ❌ 삭제 실패:`, updateError);
          results.errors.push({ email, type: 'customer', error: updateError.message });
        } else {
          console.log(`   ✅ 이메일 삭제 완료`);
          results.customers.push({ email, count: customers.length });
          results.totalCustomers += customers.length;
        }
      } else {
        results.customers.push({ email, count: customers.length });
        results.totalCustomers += customers.length;
      }
    }
  }
  
  // 결과 요약
  console.log('\n' + '='.repeat(60));
  console.log('📊 삭제 결과 요약');
  console.log('='.repeat(60));
  console.log(`\n✅ 예약 이메일 삭제: ${results.totalBookings}건`);
  console.log(`✅ 고객 이메일 삭제: ${results.totalCustomers}건`);
  
  if (results.bookings.length > 0) {
    console.log(`\n📧 예약 테이블 이메일별:`);
    results.bookings.forEach(item => {
      console.log(`   - ${item.email}: ${item.count}건`);
    });
  }
  
  if (results.customers.length > 0) {
    console.log(`\n📧 고객 테이블 이메일별:`);
    results.customers.forEach(item => {
      console.log(`   - ${item.email}: ${item.count}건`);
    });
  }
  
  if (results.errors.length > 0) {
    console.log(`\n❌ 오류: ${results.errors.length}건`);
    results.errors.forEach((e, i) => {
      console.log(`   ${i + 1}. ${e.email} (${e.type}): ${e.error}`);
    });
  }
  
  if (dryRun) {
    console.log('\n💡 실제 삭제를 하려면 --dry-run 옵션을 제거하고 다시 실행하세요.');
  } else {
    console.log('\n✅ 작업 완료!');
    console.log('💡 고객과 예약 정보는 유지되었고, 이메일만 삭제되었습니다.');
  }
}

deleteTestEmailPatterns()
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

// 삭제할 테스트 이메일 패턴 목록
const testEmailPatterns = [
  'aa@aaa.aaaa',
  'aaa.aaa@aaa.aaa',
  'AAA.AAA@AAA.AAA',
  'aaa.aaa@aaa.com',
  'AAA.AAAA@AAA.AAA',
  // 추가 패턴들
  'aa@aa.com',
  'aa@aa.ss',
  'aa@aaa.aaa',
  'AA@AAA.AAA',
  'aaaa@naver.com',
  'GGG@GGG.GG',
  'hh@hh.hh',
  'hh@hh.hhg',
  'hsg@gg.gg',
];

async function deleteTestEmailPatterns() {
  const dryRun = process.argv.includes('--dry-run');
  
  console.log('🔍 테스트 이메일 패턴 찾기 및 삭제 중...\n');
  if (dryRun) {
    console.log('⚠️  DRY RUN 모드: 실제 삭제 없이 확인만 수행합니다.\n');
  }
  
  const results = {
    bookings: [],
    customers: [],
    totalBookings: 0,
    totalCustomers: 0,
    errors: []
  };
  
  // 예약 테이블 처리
  console.log('='.repeat(60));
  console.log('📊 예약 테이블');
  console.log('='.repeat(60));
  
  for (const email of testEmailPatterns) {
    const { data: bookings, error } = await supabase
      .from('bookings')
      .select('id, name, phone, email, date')
      .ilike('email', email);
    
    if (error) {
      console.error(`❌ ${email} 조회 오류:`, error);
      results.errors.push({ email, type: 'booking', error: error.message });
      continue;
    }
    
    if (bookings && bookings.length > 0) {
      console.log(`\n📧 ${email}: ${bookings.length}건`);
      bookings.forEach(b => {
        console.log(`   - ID: ${b.id}, 이름: ${b.name}, 전화번호: ${b.phone}, 날짜: ${b.date}`);
      });
      
      if (!dryRun) {
        const bookingIds = bookings.map(b => b.id);
        const { error: updateError } = await supabase
          .from('bookings')
          .update({ email: null })
          .in('id', bookingIds);
        
        if (updateError) {
          console.error(`   ❌ 삭제 실패:`, updateError);
          results.errors.push({ email, type: 'booking', error: updateError.message });
        } else {
          console.log(`   ✅ 이메일 삭제 완료`);
          results.bookings.push({ email, count: bookings.length });
          results.totalBookings += bookings.length;
        }
      } else {
        results.bookings.push({ email, count: bookings.length });
        results.totalBookings += bookings.length;
      }
    }
  }
  
  // 고객 테이블 처리
  console.log('\n' + '='.repeat(60));
  console.log('📊 고객 테이블');
  console.log('='.repeat(60));
  
  for (const email of testEmailPatterns) {
    const { data: customers, error } = await supabase
      .from('customers')
      .select('id, name, phone, email')
      .ilike('email', email);
    
    if (error) {
      console.error(`❌ ${email} 조회 오류:`, error);
      results.errors.push({ email, type: 'customer', error: error.message });
      continue;
    }
    
    if (customers && customers.length > 0) {
      console.log(`\n📧 ${email}: ${customers.length}건`);
      customers.forEach(c => {
        console.log(`   - ID: ${c.id}, 이름: ${c.name}, 전화번호: ${c.phone}`);
      });
      
      if (!dryRun) {
        const customerIds = customers.map(c => c.id);
        const { error: updateError } = await supabase
          .from('customers')
          .update({ email: null })
          .in('id', customerIds);
        
        if (updateError) {
          console.error(`   ❌ 삭제 실패:`, updateError);
          results.errors.push({ email, type: 'customer', error: updateError.message });
        } else {
          console.log(`   ✅ 이메일 삭제 완료`);
          results.customers.push({ email, count: customers.length });
          results.totalCustomers += customers.length;
        }
      } else {
        results.customers.push({ email, count: customers.length });
        results.totalCustomers += customers.length;
      }
    }
  }
  
  // 결과 요약
  console.log('\n' + '='.repeat(60));
  console.log('📊 삭제 결과 요약');
  console.log('='.repeat(60));
  console.log(`\n✅ 예약 이메일 삭제: ${results.totalBookings}건`);
  console.log(`✅ 고객 이메일 삭제: ${results.totalCustomers}건`);
  
  if (results.bookings.length > 0) {
    console.log(`\n📧 예약 테이블 이메일별:`);
    results.bookings.forEach(item => {
      console.log(`   - ${item.email}: ${item.count}건`);
    });
  }
  
  if (results.customers.length > 0) {
    console.log(`\n📧 고객 테이블 이메일별:`);
    results.customers.forEach(item => {
      console.log(`   - ${item.email}: ${item.count}건`);
    });
  }
  
  if (results.errors.length > 0) {
    console.log(`\n❌ 오류: ${results.errors.length}건`);
    results.errors.forEach((e, i) => {
      console.log(`   ${i + 1}. ${e.email} (${e.type}): ${e.error}`);
    });
  }
  
  if (dryRun) {
    console.log('\n💡 실제 삭제를 하려면 --dry-run 옵션을 제거하고 다시 실행하세요.');
  } else {
    console.log('\n✅ 작업 완료!');
    console.log('💡 고객과 예약 정보는 유지되었고, 이메일만 삭제되었습니다.');
  }
}

deleteTestEmailPatterns()
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

// 삭제할 테스트 이메일 패턴 목록
const testEmailPatterns = [
  'aa@aaa.aaaa',
  'aaa.aaa@aaa.aaa',
  'AAA.AAA@AAA.AAA',
  'aaa.aaa@aaa.com',
  'AAA.AAAA@AAA.AAA',
  // 추가 패턴들
  'aa@aa.com',
  'aa@aa.ss',
  'aa@aaa.aaa',
  'AA@AAA.AAA',
  'aaaa@naver.com',
  'GGG@GGG.GG',
  'hh@hh.hh',
  'hh@hh.hhg',
  'hsg@gg.gg',
];

async function deleteTestEmailPatterns() {
  const dryRun = process.argv.includes('--dry-run');
  
  console.log('🔍 테스트 이메일 패턴 찾기 및 삭제 중...\n');
  if (dryRun) {
    console.log('⚠️  DRY RUN 모드: 실제 삭제 없이 확인만 수행합니다.\n');
  }
  
  const results = {
    bookings: [],
    customers: [],
    totalBookings: 0,
    totalCustomers: 0,
    errors: []
  };
  
  // 예약 테이블 처리
  console.log('='.repeat(60));
  console.log('📊 예약 테이블');
  console.log('='.repeat(60));
  
  for (const email of testEmailPatterns) {
    const { data: bookings, error } = await supabase
      .from('bookings')
      .select('id, name, phone, email, date')
      .ilike('email', email);
    
    if (error) {
      console.error(`❌ ${email} 조회 오류:`, error);
      results.errors.push({ email, type: 'booking', error: error.message });
      continue;
    }
    
    if (bookings && bookings.length > 0) {
      console.log(`\n📧 ${email}: ${bookings.length}건`);
      bookings.forEach(b => {
        console.log(`   - ID: ${b.id}, 이름: ${b.name}, 전화번호: ${b.phone}, 날짜: ${b.date}`);
      });
      
      if (!dryRun) {
        const bookingIds = bookings.map(b => b.id);
        const { error: updateError } = await supabase
          .from('bookings')
          .update({ email: null })
          .in('id', bookingIds);
        
        if (updateError) {
          console.error(`   ❌ 삭제 실패:`, updateError);
          results.errors.push({ email, type: 'booking', error: updateError.message });
        } else {
          console.log(`   ✅ 이메일 삭제 완료`);
          results.bookings.push({ email, count: bookings.length });
          results.totalBookings += bookings.length;
        }
      } else {
        results.bookings.push({ email, count: bookings.length });
        results.totalBookings += bookings.length;
      }
    }
  }
  
  // 고객 테이블 처리
  console.log('\n' + '='.repeat(60));
  console.log('📊 고객 테이블');
  console.log('='.repeat(60));
  
  for (const email of testEmailPatterns) {
    const { data: customers, error } = await supabase
      .from('customers')
      .select('id, name, phone, email')
      .ilike('email', email);
    
    if (error) {
      console.error(`❌ ${email} 조회 오류:`, error);
      results.errors.push({ email, type: 'customer', error: error.message });
      continue;
    }
    
    if (customers && customers.length > 0) {
      console.log(`\n📧 ${email}: ${customers.length}건`);
      customers.forEach(c => {
        console.log(`   - ID: ${c.id}, 이름: ${c.name}, 전화번호: ${c.phone}`);
      });
      
      if (!dryRun) {
        const customerIds = customers.map(c => c.id);
        const { error: updateError } = await supabase
          .from('customers')
          .update({ email: null })
          .in('id', customerIds);
        
        if (updateError) {
          console.error(`   ❌ 삭제 실패:`, updateError);
          results.errors.push({ email, type: 'customer', error: updateError.message });
        } else {
          console.log(`   ✅ 이메일 삭제 완료`);
          results.customers.push({ email, count: customers.length });
          results.totalCustomers += customers.length;
        }
      } else {
        results.customers.push({ email, count: customers.length });
        results.totalCustomers += customers.length;
      }
    }
  }
  
  // 결과 요약
  console.log('\n' + '='.repeat(60));
  console.log('📊 삭제 결과 요약');
  console.log('='.repeat(60));
  console.log(`\n✅ 예약 이메일 삭제: ${results.totalBookings}건`);
  console.log(`✅ 고객 이메일 삭제: ${results.totalCustomers}건`);
  
  if (results.bookings.length > 0) {
    console.log(`\n📧 예약 테이블 이메일별:`);
    results.bookings.forEach(item => {
      console.log(`   - ${item.email}: ${item.count}건`);
    });
  }
  
  if (results.customers.length > 0) {
    console.log(`\n📧 고객 테이블 이메일별:`);
    results.customers.forEach(item => {
      console.log(`   - ${item.email}: ${item.count}건`);
    });
  }
  
  if (results.errors.length > 0) {
    console.log(`\n❌ 오류: ${results.errors.length}건`);
    results.errors.forEach((e, i) => {
      console.log(`   ${i + 1}. ${e.email} (${e.type}): ${e.error}`);
    });
  }
  
  if (dryRun) {
    console.log('\n💡 실제 삭제를 하려면 --dry-run 옵션을 제거하고 다시 실행하세요.');
  } else {
    console.log('\n✅ 작업 완료!');
    console.log('💡 고객과 예약 정보는 유지되었고, 이메일만 삭제되었습니다.');
  }
}

deleteTestEmailPatterns()
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

// 삭제할 테스트 이메일 패턴 목록
const testEmailPatterns = [
  'aa@aaa.aaaa',
  'aaa.aaa@aaa.aaa',
  'AAA.AAA@AAA.AAA',
  'aaa.aaa@aaa.com',
  'AAA.AAAA@AAA.AAA',
  // 추가 패턴들
  'aa@aa.com',
  'aa@aa.ss',
  'aa@aaa.aaa',
  'AA@AAA.AAA',
  'aaaa@naver.com',
  'GGG@GGG.GG',
  'hh@hh.hh',
  'hh@hh.hhg',
  'hsg@gg.gg',
];

async function deleteTestEmailPatterns() {
  const dryRun = process.argv.includes('--dry-run');
  
  console.log('🔍 테스트 이메일 패턴 찾기 및 삭제 중...\n');
  if (dryRun) {
    console.log('⚠️  DRY RUN 모드: 실제 삭제 없이 확인만 수행합니다.\n');
  }
  
  const results = {
    bookings: [],
    customers: [],
    totalBookings: 0,
    totalCustomers: 0,
    errors: []
  };
  
  // 예약 테이블 처리
  console.log('='.repeat(60));
  console.log('📊 예약 테이블');
  console.log('='.repeat(60));
  
  for (const email of testEmailPatterns) {
    const { data: bookings, error } = await supabase
      .from('bookings')
      .select('id, name, phone, email, date')
      .ilike('email', email);
    
    if (error) {
      console.error(`❌ ${email} 조회 오류:`, error);
      results.errors.push({ email, type: 'booking', error: error.message });
      continue;
    }
    
    if (bookings && bookings.length > 0) {
      console.log(`\n📧 ${email}: ${bookings.length}건`);
      bookings.forEach(b => {
        console.log(`   - ID: ${b.id}, 이름: ${b.name}, 전화번호: ${b.phone}, 날짜: ${b.date}`);
      });
      
      if (!dryRun) {
        const bookingIds = bookings.map(b => b.id);
        const { error: updateError } = await supabase
          .from('bookings')
          .update({ email: null })
          .in('id', bookingIds);
        
        if (updateError) {
          console.error(`   ❌ 삭제 실패:`, updateError);
          results.errors.push({ email, type: 'booking', error: updateError.message });
        } else {
          console.log(`   ✅ 이메일 삭제 완료`);
          results.bookings.push({ email, count: bookings.length });
          results.totalBookings += bookings.length;
        }
      } else {
        results.bookings.push({ email, count: bookings.length });
        results.totalBookings += bookings.length;
      }
    }
  }
  
  // 고객 테이블 처리
  console.log('\n' + '='.repeat(60));
  console.log('📊 고객 테이블');
  console.log('='.repeat(60));
  
  for (const email of testEmailPatterns) {
    const { data: customers, error } = await supabase
      .from('customers')
      .select('id, name, phone, email')
      .ilike('email', email);
    
    if (error) {
      console.error(`❌ ${email} 조회 오류:`, error);
      results.errors.push({ email, type: 'customer', error: error.message });
      continue;
    }
    
    if (customers && customers.length > 0) {
      console.log(`\n📧 ${email}: ${customers.length}건`);
      customers.forEach(c => {
        console.log(`   - ID: ${c.id}, 이름: ${c.name}, 전화번호: ${c.phone}`);
      });
      
      if (!dryRun) {
        const customerIds = customers.map(c => c.id);
        const { error: updateError } = await supabase
          .from('customers')
          .update({ email: null })
          .in('id', customerIds);
        
        if (updateError) {
          console.error(`   ❌ 삭제 실패:`, updateError);
          results.errors.push({ email, type: 'customer', error: updateError.message });
        } else {
          console.log(`   ✅ 이메일 삭제 완료`);
          results.customers.push({ email, count: customers.length });
          results.totalCustomers += customers.length;
        }
      } else {
        results.customers.push({ email, count: customers.length });
        results.totalCustomers += customers.length;
      }
    }
  }
  
  // 결과 요약
  console.log('\n' + '='.repeat(60));
  console.log('📊 삭제 결과 요약');
  console.log('='.repeat(60));
  console.log(`\n✅ 예약 이메일 삭제: ${results.totalBookings}건`);
  console.log(`✅ 고객 이메일 삭제: ${results.totalCustomers}건`);
  
  if (results.bookings.length > 0) {
    console.log(`\n📧 예약 테이블 이메일별:`);
    results.bookings.forEach(item => {
      console.log(`   - ${item.email}: ${item.count}건`);
    });
  }
  
  if (results.customers.length > 0) {
    console.log(`\n📧 고객 테이블 이메일별:`);
    results.customers.forEach(item => {
      console.log(`   - ${item.email}: ${item.count}건`);
    });
  }
  
  if (results.errors.length > 0) {
    console.log(`\n❌ 오류: ${results.errors.length}건`);
    results.errors.forEach((e, i) => {
      console.log(`   ${i + 1}. ${e.email} (${e.type}): ${e.error}`);
    });
  }
  
  if (dryRun) {
    console.log('\n💡 실제 삭제를 하려면 --dry-run 옵션을 제거하고 다시 실행하세요.');
  } else {
    console.log('\n✅ 작업 완료!');
    console.log('💡 고객과 예약 정보는 유지되었고, 이메일만 삭제되었습니다.');
  }
}

deleteTestEmailPatterns()
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

// 삭제할 테스트 이메일 패턴 목록
const testEmailPatterns = [
  'aa@aaa.aaaa',
  'aaa.aaa@aaa.aaa',
  'AAA.AAA@AAA.AAA',
  'aaa.aaa@aaa.com',
  'AAA.AAAA@AAA.AAA',
  // 추가 패턴들
  'aa@aa.com',
  'aa@aa.ss',
  'aa@aaa.aaa',
  'AA@AAA.AAA',
  'aaaa@naver.com',
  'GGG@GGG.GG',
  'hh@hh.hh',
  'hh@hh.hhg',
  'hsg@gg.gg',
];

async function deleteTestEmailPatterns() {
  const dryRun = process.argv.includes('--dry-run');
  
  console.log('🔍 테스트 이메일 패턴 찾기 및 삭제 중...\n');
  if (dryRun) {
    console.log('⚠️  DRY RUN 모드: 실제 삭제 없이 확인만 수행합니다.\n');
  }
  
  const results = {
    bookings: [],
    customers: [],
    totalBookings: 0,
    totalCustomers: 0,
    errors: []
  };
  
  // 예약 테이블 처리
  console.log('='.repeat(60));
  console.log('📊 예약 테이블');
  console.log('='.repeat(60));
  
  for (const email of testEmailPatterns) {
    const { data: bookings, error } = await supabase
      .from('bookings')
      .select('id, name, phone, email, date')
      .ilike('email', email);
    
    if (error) {
      console.error(`❌ ${email} 조회 오류:`, error);
      results.errors.push({ email, type: 'booking', error: error.message });
      continue;
    }
    
    if (bookings && bookings.length > 0) {
      console.log(`\n📧 ${email}: ${bookings.length}건`);
      bookings.forEach(b => {
        console.log(`   - ID: ${b.id}, 이름: ${b.name}, 전화번호: ${b.phone}, 날짜: ${b.date}`);
      });
      
      if (!dryRun) {
        const bookingIds = bookings.map(b => b.id);
        const { error: updateError } = await supabase
          .from('bookings')
          .update({ email: null })
          .in('id', bookingIds);
        
        if (updateError) {
          console.error(`   ❌ 삭제 실패:`, updateError);
          results.errors.push({ email, type: 'booking', error: updateError.message });
        } else {
          console.log(`   ✅ 이메일 삭제 완료`);
          results.bookings.push({ email, count: bookings.length });
          results.totalBookings += bookings.length;
        }
      } else {
        results.bookings.push({ email, count: bookings.length });
        results.totalBookings += bookings.length;
      }
    }
  }
  
  // 고객 테이블 처리
  console.log('\n' + '='.repeat(60));
  console.log('📊 고객 테이블');
  console.log('='.repeat(60));
  
  for (const email of testEmailPatterns) {
    const { data: customers, error } = await supabase
      .from('customers')
      .select('id, name, phone, email')
      .ilike('email', email);
    
    if (error) {
      console.error(`❌ ${email} 조회 오류:`, error);
      results.errors.push({ email, type: 'customer', error: error.message });
      continue;
    }
    
    if (customers && customers.length > 0) {
      console.log(`\n📧 ${email}: ${customers.length}건`);
      customers.forEach(c => {
        console.log(`   - ID: ${c.id}, 이름: ${c.name}, 전화번호: ${c.phone}`);
      });
      
      if (!dryRun) {
        const customerIds = customers.map(c => c.id);
        const { error: updateError } = await supabase
          .from('customers')
          .update({ email: null })
          .in('id', customerIds);
        
        if (updateError) {
          console.error(`   ❌ 삭제 실패:`, updateError);
          results.errors.push({ email, type: 'customer', error: updateError.message });
        } else {
          console.log(`   ✅ 이메일 삭제 완료`);
          results.customers.push({ email, count: customers.length });
          results.totalCustomers += customers.length;
        }
      } else {
        results.customers.push({ email, count: customers.length });
        results.totalCustomers += customers.length;
      }
    }
  }
  
  // 결과 요약
  console.log('\n' + '='.repeat(60));
  console.log('📊 삭제 결과 요약');
  console.log('='.repeat(60));
  console.log(`\n✅ 예약 이메일 삭제: ${results.totalBookings}건`);
  console.log(`✅ 고객 이메일 삭제: ${results.totalCustomers}건`);
  
  if (results.bookings.length > 0) {
    console.log(`\n📧 예약 테이블 이메일별:`);
    results.bookings.forEach(item => {
      console.log(`   - ${item.email}: ${item.count}건`);
    });
  }
  
  if (results.customers.length > 0) {
    console.log(`\n📧 고객 테이블 이메일별:`);
    results.customers.forEach(item => {
      console.log(`   - ${item.email}: ${item.count}건`);
    });
  }
  
  if (results.errors.length > 0) {
    console.log(`\n❌ 오류: ${results.errors.length}건`);
    results.errors.forEach((e, i) => {
      console.log(`   ${i + 1}. ${e.email} (${e.type}): ${e.error}`);
    });
  }
  
  if (dryRun) {
    console.log('\n💡 실제 삭제를 하려면 --dry-run 옵션을 제거하고 다시 실행하세요.');
  } else {
    console.log('\n✅ 작업 완료!');
    console.log('💡 고객과 예약 정보는 유지되었고, 이메일만 삭제되었습니다.');
  }
}

deleteTestEmailPatterns()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('\n❌ 작업 실패:', err);
    process.exit(1);
  });















