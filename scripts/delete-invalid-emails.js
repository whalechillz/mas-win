/**
 * 잘못된 이메일 삭제 스크립트
 * 
 * 유효하지 않은 이메일 형식의 이메일 필드만 null로 업데이트합니다.
 * 고객과 예약 정보는 유지됩니다.
 * 
 * 사용법:
 * node scripts/delete-invalid-emails.js [--dry-run]
 * 
 * 옵션:
 *   --dry-run    실제 삭제 없이 확인만 수행
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// 유효한 이메일 형식 검증 함수
function isValidEmail(email) {
  if (!email || typeof email !== 'string') return false;
  
  // 기본 이메일 정규식: user@domain.com
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  
  // 추가 검증
  if (email.includes('@@')) return false;
  if (email.includes(' ')) return false;
  if (email.startsWith('@') || email.endsWith('@')) return false;
  if (email.startsWith('.') || email.endsWith('.')) return false;
  if (!email.includes('@')) return false;
  if (email.split('@').length !== 2) return false;
  
  return emailRegex.test(email);
}

async function deleteInvalidEmails() {
  const dryRun = process.argv.includes('--dry-run');
  
  console.log('🔍 잘못된 이메일 삭제 중...\n');
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
  
  // 예약 테이블에서 모든 이메일 조회
  console.log('📊 예약 테이블 조사 중...');
  let allBookings = [];
  let from = 0;
  const pageSize = 1000;
  let hasMore = true;
  
  while (hasMore) {
    const { data: bookings, error } = await supabase
      .from('bookings')
      .select('id, name, phone, email, date')
      .not('email', 'is', null)
      .range(from, from + pageSize - 1);
    
    if (error) {
      console.error('❌ 예약 조회 오류:', error);
      break;
    }
    
    if (bookings && bookings.length > 0) {
      allBookings = [...allBookings, ...bookings];
      from += pageSize;
      hasMore = bookings.length === pageSize;
    } else {
      hasMore = false;
    }
  }
  
  console.log(`   총 ${allBookings.length}건의 예약 확인 중...\n`);
  
  // 잘못된 이메일 찾기 및 삭제
  for (const booking of allBookings) {
    if (booking.email && !isValidEmail(booking.email)) {
      results.bookings.push(booking);
      results.totalBookings++;
      
      console.log(`📧 예약 ID: ${booking.id}`);
      console.log(`   이름: ${booking.name}`);
      console.log(`   전화번호: ${booking.phone}`);
      console.log(`   잘못된 이메일: "${booking.email}"`);
      
      if (!dryRun) {
        const { error: updateError } = await supabase
          .from('bookings')
          .update({ email: null })
          .eq('id', booking.id);
        
        if (updateError) {
          console.error(`   ❌ 삭제 실패:`, updateError);
          results.errors.push({ type: 'booking', id: booking.id, error: updateError.message });
        } else {
          console.log(`   ✅ 이메일 삭제 완료`);
        }
      }
      console.log('');
    }
  }
  
  // 고객 테이블에서 모든 이메일 조회
  console.log('📊 고객 테이블 조사 중...');
  let allCustomers = [];
  from = 0;
  hasMore = true;
  
  while (hasMore) {
    const { data: customers, error } = await supabase
      .from('customers')
      .select('id, name, phone, email')
      .not('email', 'is', null)
      .range(from, from + pageSize - 1);
    
    if (error) {
      console.error('❌ 고객 조회 오류:', error);
      break;
    }
    
    if (customers && customers.length > 0) {
      allCustomers = [...allCustomers, ...customers];
      from += pageSize;
      hasMore = customers.length === pageSize;
    } else {
      hasMore = false;
    }
  }
  
  console.log(`   총 ${allCustomers.length}건의 고객 확인 중...\n`);
  
  // 잘못된 이메일 찾기 및 삭제
  for (const customer of allCustomers) {
    if (customer.email && !isValidEmail(customer.email)) {
      results.customers.push(customer);
      results.totalCustomers++;
      
      console.log(`📧 고객 ID: ${customer.id}`);
      console.log(`   이름: ${customer.name}`);
      console.log(`   전화번호: ${customer.phone}`);
      console.log(`   잘못된 이메일: "${customer.email}"`);
      
      if (!dryRun) {
        const { error: updateError } = await supabase
          .from('customers')
          .update({ email: null })
          .eq('id', customer.id);
        
        if (updateError) {
          console.error(`   ❌ 삭제 실패:`, updateError);
          results.errors.push({ type: 'customer', id: customer.id, error: updateError.message });
        } else {
          console.log(`   ✅ 이메일 삭제 완료`);
        }
      }
      console.log('');
    }
  }
  
  // 결과 요약
  console.log('='.repeat(60));
  console.log('📊 삭제 결과 요약');
  console.log('='.repeat(60));
  console.log(`\n✅ 예약 이메일 삭제: ${results.totalBookings}건`);
  console.log(`✅ 고객 이메일 삭제: ${results.totalCustomers}건`);
  
  if (results.errors.length > 0) {
    console.log(`\n❌ 오류: ${results.errors.length}건`);
    results.errors.forEach((e, i) => {
      console.log(`   ${i + 1}. ${e.type} ID ${e.id}: ${e.error}`);
    });
  }
  
  if (dryRun) {
    console.log('\n💡 실제 삭제를 하려면 --dry-run 옵션을 제거하고 다시 실행하세요.');
  } else {
    console.log('\n✅ 작업 완료!');
    console.log('💡 고객과 예약 정보는 유지되었고, 이메일만 삭제되었습니다.');
  }
}

deleteInvalidEmails()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('\n❌ 작업 실패:', err);
    process.exit(1);
  });







 * 잘못된 이메일 삭제 스크립트
 * 
 * 유효하지 않은 이메일 형식의 이메일 필드만 null로 업데이트합니다.
 * 고객과 예약 정보는 유지됩니다.
 * 
 * 사용법:
 * node scripts/delete-invalid-emails.js [--dry-run]
 * 
 * 옵션:
 *   --dry-run    실제 삭제 없이 확인만 수행
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// 유효한 이메일 형식 검증 함수
function isValidEmail(email) {
  if (!email || typeof email !== 'string') return false;
  
  // 기본 이메일 정규식: user@domain.com
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  
  // 추가 검증
  if (email.includes('@@')) return false;
  if (email.includes(' ')) return false;
  if (email.startsWith('@') || email.endsWith('@')) return false;
  if (email.startsWith('.') || email.endsWith('.')) return false;
  if (!email.includes('@')) return false;
  if (email.split('@').length !== 2) return false;
  
  return emailRegex.test(email);
}

async function deleteInvalidEmails() {
  const dryRun = process.argv.includes('--dry-run');
  
  console.log('🔍 잘못된 이메일 삭제 중...\n');
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
  
  // 예약 테이블에서 모든 이메일 조회
  console.log('📊 예약 테이블 조사 중...');
  let allBookings = [];
  let from = 0;
  const pageSize = 1000;
  let hasMore = true;
  
  while (hasMore) {
    const { data: bookings, error } = await supabase
      .from('bookings')
      .select('id, name, phone, email, date')
      .not('email', 'is', null)
      .range(from, from + pageSize - 1);
    
    if (error) {
      console.error('❌ 예약 조회 오류:', error);
      break;
    }
    
    if (bookings && bookings.length > 0) {
      allBookings = [...allBookings, ...bookings];
      from += pageSize;
      hasMore = bookings.length === pageSize;
    } else {
      hasMore = false;
    }
  }
  
  console.log(`   총 ${allBookings.length}건의 예약 확인 중...\n`);
  
  // 잘못된 이메일 찾기 및 삭제
  for (const booking of allBookings) {
    if (booking.email && !isValidEmail(booking.email)) {
      results.bookings.push(booking);
      results.totalBookings++;
      
      console.log(`📧 예약 ID: ${booking.id}`);
      console.log(`   이름: ${booking.name}`);
      console.log(`   전화번호: ${booking.phone}`);
      console.log(`   잘못된 이메일: "${booking.email}"`);
      
      if (!dryRun) {
        const { error: updateError } = await supabase
          .from('bookings')
          .update({ email: null })
          .eq('id', booking.id);
        
        if (updateError) {
          console.error(`   ❌ 삭제 실패:`, updateError);
          results.errors.push({ type: 'booking', id: booking.id, error: updateError.message });
        } else {
          console.log(`   ✅ 이메일 삭제 완료`);
        }
      }
      console.log('');
    }
  }
  
  // 고객 테이블에서 모든 이메일 조회
  console.log('📊 고객 테이블 조사 중...');
  let allCustomers = [];
  from = 0;
  hasMore = true;
  
  while (hasMore) {
    const { data: customers, error } = await supabase
      .from('customers')
      .select('id, name, phone, email')
      .not('email', 'is', null)
      .range(from, from + pageSize - 1);
    
    if (error) {
      console.error('❌ 고객 조회 오류:', error);
      break;
    }
    
    if (customers && customers.length > 0) {
      allCustomers = [...allCustomers, ...customers];
      from += pageSize;
      hasMore = customers.length === pageSize;
    } else {
      hasMore = false;
    }
  }
  
  console.log(`   총 ${allCustomers.length}건의 고객 확인 중...\n`);
  
  // 잘못된 이메일 찾기 및 삭제
  for (const customer of allCustomers) {
    if (customer.email && !isValidEmail(customer.email)) {
      results.customers.push(customer);
      results.totalCustomers++;
      
      console.log(`📧 고객 ID: ${customer.id}`);
      console.log(`   이름: ${customer.name}`);
      console.log(`   전화번호: ${customer.phone}`);
      console.log(`   잘못된 이메일: "${customer.email}"`);
      
      if (!dryRun) {
        const { error: updateError } = await supabase
          .from('customers')
          .update({ email: null })
          .eq('id', customer.id);
        
        if (updateError) {
          console.error(`   ❌ 삭제 실패:`, updateError);
          results.errors.push({ type: 'customer', id: customer.id, error: updateError.message });
        } else {
          console.log(`   ✅ 이메일 삭제 완료`);
        }
      }
      console.log('');
    }
  }
  
  // 결과 요약
  console.log('='.repeat(60));
  console.log('📊 삭제 결과 요약');
  console.log('='.repeat(60));
  console.log(`\n✅ 예약 이메일 삭제: ${results.totalBookings}건`);
  console.log(`✅ 고객 이메일 삭제: ${results.totalCustomers}건`);
  
  if (results.errors.length > 0) {
    console.log(`\n❌ 오류: ${results.errors.length}건`);
    results.errors.forEach((e, i) => {
      console.log(`   ${i + 1}. ${e.type} ID ${e.id}: ${e.error}`);
    });
  }
  
  if (dryRun) {
    console.log('\n💡 실제 삭제를 하려면 --dry-run 옵션을 제거하고 다시 실행하세요.');
  } else {
    console.log('\n✅ 작업 완료!');
    console.log('💡 고객과 예약 정보는 유지되었고, 이메일만 삭제되었습니다.');
  }
}

deleteInvalidEmails()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('\n❌ 작업 실패:', err);
    process.exit(1);
  });







 * 잘못된 이메일 삭제 스크립트
 * 
 * 유효하지 않은 이메일 형식의 이메일 필드만 null로 업데이트합니다.
 * 고객과 예약 정보는 유지됩니다.
 * 
 * 사용법:
 * node scripts/delete-invalid-emails.js [--dry-run]
 * 
 * 옵션:
 *   --dry-run    실제 삭제 없이 확인만 수행
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// 유효한 이메일 형식 검증 함수
function isValidEmail(email) {
  if (!email || typeof email !== 'string') return false;
  
  // 기본 이메일 정규식: user@domain.com
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  
  // 추가 검증
  if (email.includes('@@')) return false;
  if (email.includes(' ')) return false;
  if (email.startsWith('@') || email.endsWith('@')) return false;
  if (email.startsWith('.') || email.endsWith('.')) return false;
  if (!email.includes('@')) return false;
  if (email.split('@').length !== 2) return false;
  
  return emailRegex.test(email);
}

async function deleteInvalidEmails() {
  const dryRun = process.argv.includes('--dry-run');
  
  console.log('🔍 잘못된 이메일 삭제 중...\n');
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
  
  // 예약 테이블에서 모든 이메일 조회
  console.log('📊 예약 테이블 조사 중...');
  let allBookings = [];
  let from = 0;
  const pageSize = 1000;
  let hasMore = true;
  
  while (hasMore) {
    const { data: bookings, error } = await supabase
      .from('bookings')
      .select('id, name, phone, email, date')
      .not('email', 'is', null)
      .range(from, from + pageSize - 1);
    
    if (error) {
      console.error('❌ 예약 조회 오류:', error);
      break;
    }
    
    if (bookings && bookings.length > 0) {
      allBookings = [...allBookings, ...bookings];
      from += pageSize;
      hasMore = bookings.length === pageSize;
    } else {
      hasMore = false;
    }
  }
  
  console.log(`   총 ${allBookings.length}건의 예약 확인 중...\n`);
  
  // 잘못된 이메일 찾기 및 삭제
  for (const booking of allBookings) {
    if (booking.email && !isValidEmail(booking.email)) {
      results.bookings.push(booking);
      results.totalBookings++;
      
      console.log(`📧 예약 ID: ${booking.id}`);
      console.log(`   이름: ${booking.name}`);
      console.log(`   전화번호: ${booking.phone}`);
      console.log(`   잘못된 이메일: "${booking.email}"`);
      
      if (!dryRun) {
        const { error: updateError } = await supabase
          .from('bookings')
          .update({ email: null })
          .eq('id', booking.id);
        
        if (updateError) {
          console.error(`   ❌ 삭제 실패:`, updateError);
          results.errors.push({ type: 'booking', id: booking.id, error: updateError.message });
        } else {
          console.log(`   ✅ 이메일 삭제 완료`);
        }
      }
      console.log('');
    }
  }
  
  // 고객 테이블에서 모든 이메일 조회
  console.log('📊 고객 테이블 조사 중...');
  let allCustomers = [];
  from = 0;
  hasMore = true;
  
  while (hasMore) {
    const { data: customers, error } = await supabase
      .from('customers')
      .select('id, name, phone, email')
      .not('email', 'is', null)
      .range(from, from + pageSize - 1);
    
    if (error) {
      console.error('❌ 고객 조회 오류:', error);
      break;
    }
    
    if (customers && customers.length > 0) {
      allCustomers = [...allCustomers, ...customers];
      from += pageSize;
      hasMore = customers.length === pageSize;
    } else {
      hasMore = false;
    }
  }
  
  console.log(`   총 ${allCustomers.length}건의 고객 확인 중...\n`);
  
  // 잘못된 이메일 찾기 및 삭제
  for (const customer of allCustomers) {
    if (customer.email && !isValidEmail(customer.email)) {
      results.customers.push(customer);
      results.totalCustomers++;
      
      console.log(`📧 고객 ID: ${customer.id}`);
      console.log(`   이름: ${customer.name}`);
      console.log(`   전화번호: ${customer.phone}`);
      console.log(`   잘못된 이메일: "${customer.email}"`);
      
      if (!dryRun) {
        const { error: updateError } = await supabase
          .from('customers')
          .update({ email: null })
          .eq('id', customer.id);
        
        if (updateError) {
          console.error(`   ❌ 삭제 실패:`, updateError);
          results.errors.push({ type: 'customer', id: customer.id, error: updateError.message });
        } else {
          console.log(`   ✅ 이메일 삭제 완료`);
        }
      }
      console.log('');
    }
  }
  
  // 결과 요약
  console.log('='.repeat(60));
  console.log('📊 삭제 결과 요약');
  console.log('='.repeat(60));
  console.log(`\n✅ 예약 이메일 삭제: ${results.totalBookings}건`);
  console.log(`✅ 고객 이메일 삭제: ${results.totalCustomers}건`);
  
  if (results.errors.length > 0) {
    console.log(`\n❌ 오류: ${results.errors.length}건`);
    results.errors.forEach((e, i) => {
      console.log(`   ${i + 1}. ${e.type} ID ${e.id}: ${e.error}`);
    });
  }
  
  if (dryRun) {
    console.log('\n💡 실제 삭제를 하려면 --dry-run 옵션을 제거하고 다시 실행하세요.');
  } else {
    console.log('\n✅ 작업 완료!');
    console.log('💡 고객과 예약 정보는 유지되었고, 이메일만 삭제되었습니다.');
  }
}

deleteInvalidEmails()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('\n❌ 작업 실패:', err);
    process.exit(1);
  });







 * 잘못된 이메일 삭제 스크립트
 * 
 * 유효하지 않은 이메일 형식의 이메일 필드만 null로 업데이트합니다.
 * 고객과 예약 정보는 유지됩니다.
 * 
 * 사용법:
 * node scripts/delete-invalid-emails.js [--dry-run]
 * 
 * 옵션:
 *   --dry-run    실제 삭제 없이 확인만 수행
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// 유효한 이메일 형식 검증 함수
function isValidEmail(email) {
  if (!email || typeof email !== 'string') return false;
  
  // 기본 이메일 정규식: user@domain.com
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  
  // 추가 검증
  if (email.includes('@@')) return false;
  if (email.includes(' ')) return false;
  if (email.startsWith('@') || email.endsWith('@')) return false;
  if (email.startsWith('.') || email.endsWith('.')) return false;
  if (!email.includes('@')) return false;
  if (email.split('@').length !== 2) return false;
  
  return emailRegex.test(email);
}

async function deleteInvalidEmails() {
  const dryRun = process.argv.includes('--dry-run');
  
  console.log('🔍 잘못된 이메일 삭제 중...\n');
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
  
  // 예약 테이블에서 모든 이메일 조회
  console.log('📊 예약 테이블 조사 중...');
  let allBookings = [];
  let from = 0;
  const pageSize = 1000;
  let hasMore = true;
  
  while (hasMore) {
    const { data: bookings, error } = await supabase
      .from('bookings')
      .select('id, name, phone, email, date')
      .not('email', 'is', null)
      .range(from, from + pageSize - 1);
    
    if (error) {
      console.error('❌ 예약 조회 오류:', error);
      break;
    }
    
    if (bookings && bookings.length > 0) {
      allBookings = [...allBookings, ...bookings];
      from += pageSize;
      hasMore = bookings.length === pageSize;
    } else {
      hasMore = false;
    }
  }
  
  console.log(`   총 ${allBookings.length}건의 예약 확인 중...\n`);
  
  // 잘못된 이메일 찾기 및 삭제
  for (const booking of allBookings) {
    if (booking.email && !isValidEmail(booking.email)) {
      results.bookings.push(booking);
      results.totalBookings++;
      
      console.log(`📧 예약 ID: ${booking.id}`);
      console.log(`   이름: ${booking.name}`);
      console.log(`   전화번호: ${booking.phone}`);
      console.log(`   잘못된 이메일: "${booking.email}"`);
      
      if (!dryRun) {
        const { error: updateError } = await supabase
          .from('bookings')
          .update({ email: null })
          .eq('id', booking.id);
        
        if (updateError) {
          console.error(`   ❌ 삭제 실패:`, updateError);
          results.errors.push({ type: 'booking', id: booking.id, error: updateError.message });
        } else {
          console.log(`   ✅ 이메일 삭제 완료`);
        }
      }
      console.log('');
    }
  }
  
  // 고객 테이블에서 모든 이메일 조회
  console.log('📊 고객 테이블 조사 중...');
  let allCustomers = [];
  from = 0;
  hasMore = true;
  
  while (hasMore) {
    const { data: customers, error } = await supabase
      .from('customers')
      .select('id, name, phone, email')
      .not('email', 'is', null)
      .range(from, from + pageSize - 1);
    
    if (error) {
      console.error('❌ 고객 조회 오류:', error);
      break;
    }
    
    if (customers && customers.length > 0) {
      allCustomers = [...allCustomers, ...customers];
      from += pageSize;
      hasMore = customers.length === pageSize;
    } else {
      hasMore = false;
    }
  }
  
  console.log(`   총 ${allCustomers.length}건의 고객 확인 중...\n`);
  
  // 잘못된 이메일 찾기 및 삭제
  for (const customer of allCustomers) {
    if (customer.email && !isValidEmail(customer.email)) {
      results.customers.push(customer);
      results.totalCustomers++;
      
      console.log(`📧 고객 ID: ${customer.id}`);
      console.log(`   이름: ${customer.name}`);
      console.log(`   전화번호: ${customer.phone}`);
      console.log(`   잘못된 이메일: "${customer.email}"`);
      
      if (!dryRun) {
        const { error: updateError } = await supabase
          .from('customers')
          .update({ email: null })
          .eq('id', customer.id);
        
        if (updateError) {
          console.error(`   ❌ 삭제 실패:`, updateError);
          results.errors.push({ type: 'customer', id: customer.id, error: updateError.message });
        } else {
          console.log(`   ✅ 이메일 삭제 완료`);
        }
      }
      console.log('');
    }
  }
  
  // 결과 요약
  console.log('='.repeat(60));
  console.log('📊 삭제 결과 요약');
  console.log('='.repeat(60));
  console.log(`\n✅ 예약 이메일 삭제: ${results.totalBookings}건`);
  console.log(`✅ 고객 이메일 삭제: ${results.totalCustomers}건`);
  
  if (results.errors.length > 0) {
    console.log(`\n❌ 오류: ${results.errors.length}건`);
    results.errors.forEach((e, i) => {
      console.log(`   ${i + 1}. ${e.type} ID ${e.id}: ${e.error}`);
    });
  }
  
  if (dryRun) {
    console.log('\n💡 실제 삭제를 하려면 --dry-run 옵션을 제거하고 다시 실행하세요.');
  } else {
    console.log('\n✅ 작업 완료!');
    console.log('💡 고객과 예약 정보는 유지되었고, 이메일만 삭제되었습니다.');
  }
}

deleteInvalidEmails()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('\n❌ 작업 실패:', err);
    process.exit(1);
  });







 * 잘못된 이메일 삭제 스크립트
 * 
 * 유효하지 않은 이메일 형식의 이메일 필드만 null로 업데이트합니다.
 * 고객과 예약 정보는 유지됩니다.
 * 
 * 사용법:
 * node scripts/delete-invalid-emails.js [--dry-run]
 * 
 * 옵션:
 *   --dry-run    실제 삭제 없이 확인만 수행
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// 유효한 이메일 형식 검증 함수
function isValidEmail(email) {
  if (!email || typeof email !== 'string') return false;
  
  // 기본 이메일 정규식: user@domain.com
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  
  // 추가 검증
  if (email.includes('@@')) return false;
  if (email.includes(' ')) return false;
  if (email.startsWith('@') || email.endsWith('@')) return false;
  if (email.startsWith('.') || email.endsWith('.')) return false;
  if (!email.includes('@')) return false;
  if (email.split('@').length !== 2) return false;
  
  return emailRegex.test(email);
}

async function deleteInvalidEmails() {
  const dryRun = process.argv.includes('--dry-run');
  
  console.log('🔍 잘못된 이메일 삭제 중...\n');
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
  
  // 예약 테이블에서 모든 이메일 조회
  console.log('📊 예약 테이블 조사 중...');
  let allBookings = [];
  let from = 0;
  const pageSize = 1000;
  let hasMore = true;
  
  while (hasMore) {
    const { data: bookings, error } = await supabase
      .from('bookings')
      .select('id, name, phone, email, date')
      .not('email', 'is', null)
      .range(from, from + pageSize - 1);
    
    if (error) {
      console.error('❌ 예약 조회 오류:', error);
      break;
    }
    
    if (bookings && bookings.length > 0) {
      allBookings = [...allBookings, ...bookings];
      from += pageSize;
      hasMore = bookings.length === pageSize;
    } else {
      hasMore = false;
    }
  }
  
  console.log(`   총 ${allBookings.length}건의 예약 확인 중...\n`);
  
  // 잘못된 이메일 찾기 및 삭제
  for (const booking of allBookings) {
    if (booking.email && !isValidEmail(booking.email)) {
      results.bookings.push(booking);
      results.totalBookings++;
      
      console.log(`📧 예약 ID: ${booking.id}`);
      console.log(`   이름: ${booking.name}`);
      console.log(`   전화번호: ${booking.phone}`);
      console.log(`   잘못된 이메일: "${booking.email}"`);
      
      if (!dryRun) {
        const { error: updateError } = await supabase
          .from('bookings')
          .update({ email: null })
          .eq('id', booking.id);
        
        if (updateError) {
          console.error(`   ❌ 삭제 실패:`, updateError);
          results.errors.push({ type: 'booking', id: booking.id, error: updateError.message });
        } else {
          console.log(`   ✅ 이메일 삭제 완료`);
        }
      }
      console.log('');
    }
  }
  
  // 고객 테이블에서 모든 이메일 조회
  console.log('📊 고객 테이블 조사 중...');
  let allCustomers = [];
  from = 0;
  hasMore = true;
  
  while (hasMore) {
    const { data: customers, error } = await supabase
      .from('customers')
      .select('id, name, phone, email')
      .not('email', 'is', null)
      .range(from, from + pageSize - 1);
    
    if (error) {
      console.error('❌ 고객 조회 오류:', error);
      break;
    }
    
    if (customers && customers.length > 0) {
      allCustomers = [...allCustomers, ...customers];
      from += pageSize;
      hasMore = customers.length === pageSize;
    } else {
      hasMore = false;
    }
  }
  
  console.log(`   총 ${allCustomers.length}건의 고객 확인 중...\n`);
  
  // 잘못된 이메일 찾기 및 삭제
  for (const customer of allCustomers) {
    if (customer.email && !isValidEmail(customer.email)) {
      results.customers.push(customer);
      results.totalCustomers++;
      
      console.log(`📧 고객 ID: ${customer.id}`);
      console.log(`   이름: ${customer.name}`);
      console.log(`   전화번호: ${customer.phone}`);
      console.log(`   잘못된 이메일: "${customer.email}"`);
      
      if (!dryRun) {
        const { error: updateError } = await supabase
          .from('customers')
          .update({ email: null })
          .eq('id', customer.id);
        
        if (updateError) {
          console.error(`   ❌ 삭제 실패:`, updateError);
          results.errors.push({ type: 'customer', id: customer.id, error: updateError.message });
        } else {
          console.log(`   ✅ 이메일 삭제 완료`);
        }
      }
      console.log('');
    }
  }
  
  // 결과 요약
  console.log('='.repeat(60));
  console.log('📊 삭제 결과 요약');
  console.log('='.repeat(60));
  console.log(`\n✅ 예약 이메일 삭제: ${results.totalBookings}건`);
  console.log(`✅ 고객 이메일 삭제: ${results.totalCustomers}건`);
  
  if (results.errors.length > 0) {
    console.log(`\n❌ 오류: ${results.errors.length}건`);
    results.errors.forEach((e, i) => {
      console.log(`   ${i + 1}. ${e.type} ID ${e.id}: ${e.error}`);
    });
  }
  
  if (dryRun) {
    console.log('\n💡 실제 삭제를 하려면 --dry-run 옵션을 제거하고 다시 실행하세요.');
  } else {
    console.log('\n✅ 작업 완료!');
    console.log('💡 고객과 예약 정보는 유지되었고, 이메일만 삭제되었습니다.');
  }
}

deleteInvalidEmails()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('\n❌ 작업 실패:', err);
    process.exit(1);
  });


















