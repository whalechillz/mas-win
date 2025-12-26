/**
 * 테스트/내부 이메일 삭제 스크립트 (이메일만 삭제)
 * 
 * 테스트 이메일과 내부 메일의 이메일 필드만 null로 업데이트합니다.
 * 고객과 예약 정보는 유지됩니다.
 * 
 * 사용법:
 * node scripts/delete-test-emails-only.js [--dry-run]
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

// 삭제해야 할 테스트/내부 이메일 목록
const testEmails = [
  // 첫 번째 그룹
  '1111111@naver.com',
  'aa@aa.com',
  'aa@aa.ss',
  'aa@aaa.aaa',
  'AA@AAA.AAA',
  'aaaa@naver.com',
  // 두 번째 그룹
  'GGG@GGG.GG',
  'hh@hh.hh',
  'hh@hh.hhg',
  'hsg@gg.gg',
  // 내부 메일
  'mas9golf@gg.com',
  'mas9golf@gmail.com',
  'massgogolf@naver.com',
  'Massgoo@gmail.com',
  'massgoo@massgoo.co.kr'
];

async function deleteTestEmailsOnly() {
  const dryRun = process.argv.includes('--dry-run');
  
  console.log('🔍 테스트/내부 이메일 삭제 중...\n');
  if (dryRun) {
    console.log('⚠️  DRY RUN 모드: 실제 삭제 없이 확인만 수행합니다.\n');
  }
  
  const results = {
    bookings: { total: 0, byEmail: {} },
    customers: { total: 0, byEmail: {} },
    errors: []
  };
  
  // 예약 테이블에서 이메일 삭제
  console.log('='.repeat(60));
  console.log('📊 예약 테이블 이메일 삭제');
  console.log('='.repeat(60));
  
  for (const email of testEmails) {
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
      
      if (!dryRun) {
        const bookingIds = bookings.map(b => b.id);
        const { error: updateError } = await supabase
          .from('bookings')
          .update({ email: null })
          .in('id', bookingIds);
        
        if (updateError) {
          console.error(`    ❌ 업데이트 실패:`, updateError);
          results.errors.push({ email, type: 'booking', error: updateError.message });
        } else {
          console.log(`    ✅ 이메일 삭제 완료`);
          results.bookings.total += bookings.length;
          results.bookings.byEmail[email] = bookings.length;
        }
      } else {
        results.bookings.total += bookings.length;
        results.bookings.byEmail[email] = bookings.length;
      }
    }
  }
  
  // 고객 테이블에서 이메일 삭제
  console.log('\n' + '='.repeat(60));
  console.log('📊 고객 테이블 이메일 삭제');
  console.log('='.repeat(60));
  
  for (const email of testEmails) {
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
      
      if (!dryRun) {
        const customerIds = customers.map(c => c.id);
        const { error: updateError } = await supabase
          .from('customers')
          .update({ email: null })
          .in('id', customerIds);
        
        if (updateError) {
          console.error(`    ❌ 업데이트 실패:`, updateError);
          results.errors.push({ email, type: 'customer', error: updateError.message });
        } else {
          console.log(`    ✅ 이메일 삭제 완료`);
          results.customers.total += customers.length;
          results.customers.byEmail[email] = customers.length;
        }
      } else {
        results.customers.total += customers.length;
        results.customers.byEmail[email] = customers.length;
      }
    }
  }
  
  // 결과 요약
  console.log('\n' + '='.repeat(60));
  console.log('📊 삭제 결과 요약');
  console.log('='.repeat(60));
  console.log(`\n✅ 예약 이메일 삭제: ${results.bookings.total}건`);
  console.log(`✅ 고객 이메일 삭제: ${results.customers.total}건`);
  
  if (Object.keys(results.bookings.byEmail).length > 0) {
    console.log(`\n📧 예약 테이블 이메일별:`);
    Object.entries(results.bookings.byEmail).forEach(([email, count]) => {
      console.log(`   - ${email}: ${count}건`);
    });
  }
  
  if (Object.keys(results.customers.byEmail).length > 0) {
    console.log(`\n📧 고객 테이블 이메일별:`);
    Object.entries(results.customers.byEmail).forEach(([email, count]) => {
      console.log(`   - ${email}: ${count}건`);
    });
  }
  
  if (results.errors.length > 0) {
    console.log(`\n❌ 오류 발생: ${results.errors.length}건`);
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

deleteTestEmailsOnly()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('\n❌ 작업 실패:', err);
    process.exit(1);
  });







 * 테스트/내부 이메일 삭제 스크립트 (이메일만 삭제)
 * 
 * 테스트 이메일과 내부 메일의 이메일 필드만 null로 업데이트합니다.
 * 고객과 예약 정보는 유지됩니다.
 * 
 * 사용법:
 * node scripts/delete-test-emails-only.js [--dry-run]
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

// 삭제해야 할 테스트/내부 이메일 목록
const testEmails = [
  // 첫 번째 그룹
  '1111111@naver.com',
  'aa@aa.com',
  'aa@aa.ss',
  'aa@aaa.aaa',
  'AA@AAA.AAA',
  'aaaa@naver.com',
  // 두 번째 그룹
  'GGG@GGG.GG',
  'hh@hh.hh',
  'hh@hh.hhg',
  'hsg@gg.gg',
  // 내부 메일
  'mas9golf@gg.com',
  'mas9golf@gmail.com',
  'massgogolf@naver.com',
  'Massgoo@gmail.com',
  'massgoo@massgoo.co.kr'
];

async function deleteTestEmailsOnly() {
  const dryRun = process.argv.includes('--dry-run');
  
  console.log('🔍 테스트/내부 이메일 삭제 중...\n');
  if (dryRun) {
    console.log('⚠️  DRY RUN 모드: 실제 삭제 없이 확인만 수행합니다.\n');
  }
  
  const results = {
    bookings: { total: 0, byEmail: {} },
    customers: { total: 0, byEmail: {} },
    errors: []
  };
  
  // 예약 테이블에서 이메일 삭제
  console.log('='.repeat(60));
  console.log('📊 예약 테이블 이메일 삭제');
  console.log('='.repeat(60));
  
  for (const email of testEmails) {
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
      
      if (!dryRun) {
        const bookingIds = bookings.map(b => b.id);
        const { error: updateError } = await supabase
          .from('bookings')
          .update({ email: null })
          .in('id', bookingIds);
        
        if (updateError) {
          console.error(`    ❌ 업데이트 실패:`, updateError);
          results.errors.push({ email, type: 'booking', error: updateError.message });
        } else {
          console.log(`    ✅ 이메일 삭제 완료`);
          results.bookings.total += bookings.length;
          results.bookings.byEmail[email] = bookings.length;
        }
      } else {
        results.bookings.total += bookings.length;
        results.bookings.byEmail[email] = bookings.length;
      }
    }
  }
  
  // 고객 테이블에서 이메일 삭제
  console.log('\n' + '='.repeat(60));
  console.log('📊 고객 테이블 이메일 삭제');
  console.log('='.repeat(60));
  
  for (const email of testEmails) {
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
      
      if (!dryRun) {
        const customerIds = customers.map(c => c.id);
        const { error: updateError } = await supabase
          .from('customers')
          .update({ email: null })
          .in('id', customerIds);
        
        if (updateError) {
          console.error(`    ❌ 업데이트 실패:`, updateError);
          results.errors.push({ email, type: 'customer', error: updateError.message });
        } else {
          console.log(`    ✅ 이메일 삭제 완료`);
          results.customers.total += customers.length;
          results.customers.byEmail[email] = customers.length;
        }
      } else {
        results.customers.total += customers.length;
        results.customers.byEmail[email] = customers.length;
      }
    }
  }
  
  // 결과 요약
  console.log('\n' + '='.repeat(60));
  console.log('📊 삭제 결과 요약');
  console.log('='.repeat(60));
  console.log(`\n✅ 예약 이메일 삭제: ${results.bookings.total}건`);
  console.log(`✅ 고객 이메일 삭제: ${results.customers.total}건`);
  
  if (Object.keys(results.bookings.byEmail).length > 0) {
    console.log(`\n📧 예약 테이블 이메일별:`);
    Object.entries(results.bookings.byEmail).forEach(([email, count]) => {
      console.log(`   - ${email}: ${count}건`);
    });
  }
  
  if (Object.keys(results.customers.byEmail).length > 0) {
    console.log(`\n📧 고객 테이블 이메일별:`);
    Object.entries(results.customers.byEmail).forEach(([email, count]) => {
      console.log(`   - ${email}: ${count}건`);
    });
  }
  
  if (results.errors.length > 0) {
    console.log(`\n❌ 오류 발생: ${results.errors.length}건`);
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

deleteTestEmailsOnly()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('\n❌ 작업 실패:', err);
    process.exit(1);
  });







 * 테스트/내부 이메일 삭제 스크립트 (이메일만 삭제)
 * 
 * 테스트 이메일과 내부 메일의 이메일 필드만 null로 업데이트합니다.
 * 고객과 예약 정보는 유지됩니다.
 * 
 * 사용법:
 * node scripts/delete-test-emails-only.js [--dry-run]
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

// 삭제해야 할 테스트/내부 이메일 목록
const testEmails = [
  // 첫 번째 그룹
  '1111111@naver.com',
  'aa@aa.com',
  'aa@aa.ss',
  'aa@aaa.aaa',
  'AA@AAA.AAA',
  'aaaa@naver.com',
  // 두 번째 그룹
  'GGG@GGG.GG',
  'hh@hh.hh',
  'hh@hh.hhg',
  'hsg@gg.gg',
  // 내부 메일
  'mas9golf@gg.com',
  'mas9golf@gmail.com',
  'massgogolf@naver.com',
  'Massgoo@gmail.com',
  'massgoo@massgoo.co.kr'
];

async function deleteTestEmailsOnly() {
  const dryRun = process.argv.includes('--dry-run');
  
  console.log('🔍 테스트/내부 이메일 삭제 중...\n');
  if (dryRun) {
    console.log('⚠️  DRY RUN 모드: 실제 삭제 없이 확인만 수행합니다.\n');
  }
  
  const results = {
    bookings: { total: 0, byEmail: {} },
    customers: { total: 0, byEmail: {} },
    errors: []
  };
  
  // 예약 테이블에서 이메일 삭제
  console.log('='.repeat(60));
  console.log('📊 예약 테이블 이메일 삭제');
  console.log('='.repeat(60));
  
  for (const email of testEmails) {
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
      
      if (!dryRun) {
        const bookingIds = bookings.map(b => b.id);
        const { error: updateError } = await supabase
          .from('bookings')
          .update({ email: null })
          .in('id', bookingIds);
        
        if (updateError) {
          console.error(`    ❌ 업데이트 실패:`, updateError);
          results.errors.push({ email, type: 'booking', error: updateError.message });
        } else {
          console.log(`    ✅ 이메일 삭제 완료`);
          results.bookings.total += bookings.length;
          results.bookings.byEmail[email] = bookings.length;
        }
      } else {
        results.bookings.total += bookings.length;
        results.bookings.byEmail[email] = bookings.length;
      }
    }
  }
  
  // 고객 테이블에서 이메일 삭제
  console.log('\n' + '='.repeat(60));
  console.log('📊 고객 테이블 이메일 삭제');
  console.log('='.repeat(60));
  
  for (const email of testEmails) {
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
      
      if (!dryRun) {
        const customerIds = customers.map(c => c.id);
        const { error: updateError } = await supabase
          .from('customers')
          .update({ email: null })
          .in('id', customerIds);
        
        if (updateError) {
          console.error(`    ❌ 업데이트 실패:`, updateError);
          results.errors.push({ email, type: 'customer', error: updateError.message });
        } else {
          console.log(`    ✅ 이메일 삭제 완료`);
          results.customers.total += customers.length;
          results.customers.byEmail[email] = customers.length;
        }
      } else {
        results.customers.total += customers.length;
        results.customers.byEmail[email] = customers.length;
      }
    }
  }
  
  // 결과 요약
  console.log('\n' + '='.repeat(60));
  console.log('📊 삭제 결과 요약');
  console.log('='.repeat(60));
  console.log(`\n✅ 예약 이메일 삭제: ${results.bookings.total}건`);
  console.log(`✅ 고객 이메일 삭제: ${results.customers.total}건`);
  
  if (Object.keys(results.bookings.byEmail).length > 0) {
    console.log(`\n📧 예약 테이블 이메일별:`);
    Object.entries(results.bookings.byEmail).forEach(([email, count]) => {
      console.log(`   - ${email}: ${count}건`);
    });
  }
  
  if (Object.keys(results.customers.byEmail).length > 0) {
    console.log(`\n📧 고객 테이블 이메일별:`);
    Object.entries(results.customers.byEmail).forEach(([email, count]) => {
      console.log(`   - ${email}: ${count}건`);
    });
  }
  
  if (results.errors.length > 0) {
    console.log(`\n❌ 오류 발생: ${results.errors.length}건`);
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

deleteTestEmailsOnly()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('\n❌ 작업 실패:', err);
    process.exit(1);
  });







 * 테스트/내부 이메일 삭제 스크립트 (이메일만 삭제)
 * 
 * 테스트 이메일과 내부 메일의 이메일 필드만 null로 업데이트합니다.
 * 고객과 예약 정보는 유지됩니다.
 * 
 * 사용법:
 * node scripts/delete-test-emails-only.js [--dry-run]
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

// 삭제해야 할 테스트/내부 이메일 목록
const testEmails = [
  // 첫 번째 그룹
  '1111111@naver.com',
  'aa@aa.com',
  'aa@aa.ss',
  'aa@aaa.aaa',
  'AA@AAA.AAA',
  'aaaa@naver.com',
  // 두 번째 그룹
  'GGG@GGG.GG',
  'hh@hh.hh',
  'hh@hh.hhg',
  'hsg@gg.gg',
  // 내부 메일
  'mas9golf@gg.com',
  'mas9golf@gmail.com',
  'massgogolf@naver.com',
  'Massgoo@gmail.com',
  'massgoo@massgoo.co.kr'
];

async function deleteTestEmailsOnly() {
  const dryRun = process.argv.includes('--dry-run');
  
  console.log('🔍 테스트/내부 이메일 삭제 중...\n');
  if (dryRun) {
    console.log('⚠️  DRY RUN 모드: 실제 삭제 없이 확인만 수행합니다.\n');
  }
  
  const results = {
    bookings: { total: 0, byEmail: {} },
    customers: { total: 0, byEmail: {} },
    errors: []
  };
  
  // 예약 테이블에서 이메일 삭제
  console.log('='.repeat(60));
  console.log('📊 예약 테이블 이메일 삭제');
  console.log('='.repeat(60));
  
  for (const email of testEmails) {
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
      
      if (!dryRun) {
        const bookingIds = bookings.map(b => b.id);
        const { error: updateError } = await supabase
          .from('bookings')
          .update({ email: null })
          .in('id', bookingIds);
        
        if (updateError) {
          console.error(`    ❌ 업데이트 실패:`, updateError);
          results.errors.push({ email, type: 'booking', error: updateError.message });
        } else {
          console.log(`    ✅ 이메일 삭제 완료`);
          results.bookings.total += bookings.length;
          results.bookings.byEmail[email] = bookings.length;
        }
      } else {
        results.bookings.total += bookings.length;
        results.bookings.byEmail[email] = bookings.length;
      }
    }
  }
  
  // 고객 테이블에서 이메일 삭제
  console.log('\n' + '='.repeat(60));
  console.log('📊 고객 테이블 이메일 삭제');
  console.log('='.repeat(60));
  
  for (const email of testEmails) {
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
      
      if (!dryRun) {
        const customerIds = customers.map(c => c.id);
        const { error: updateError } = await supabase
          .from('customers')
          .update({ email: null })
          .in('id', customerIds);
        
        if (updateError) {
          console.error(`    ❌ 업데이트 실패:`, updateError);
          results.errors.push({ email, type: 'customer', error: updateError.message });
        } else {
          console.log(`    ✅ 이메일 삭제 완료`);
          results.customers.total += customers.length;
          results.customers.byEmail[email] = customers.length;
        }
      } else {
        results.customers.total += customers.length;
        results.customers.byEmail[email] = customers.length;
      }
    }
  }
  
  // 결과 요약
  console.log('\n' + '='.repeat(60));
  console.log('📊 삭제 결과 요약');
  console.log('='.repeat(60));
  console.log(`\n✅ 예약 이메일 삭제: ${results.bookings.total}건`);
  console.log(`✅ 고객 이메일 삭제: ${results.customers.total}건`);
  
  if (Object.keys(results.bookings.byEmail).length > 0) {
    console.log(`\n📧 예약 테이블 이메일별:`);
    Object.entries(results.bookings.byEmail).forEach(([email, count]) => {
      console.log(`   - ${email}: ${count}건`);
    });
  }
  
  if (Object.keys(results.customers.byEmail).length > 0) {
    console.log(`\n📧 고객 테이블 이메일별:`);
    Object.entries(results.customers.byEmail).forEach(([email, count]) => {
      console.log(`   - ${email}: ${count}건`);
    });
  }
  
  if (results.errors.length > 0) {
    console.log(`\n❌ 오류 발생: ${results.errors.length}건`);
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

deleteTestEmailsOnly()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('\n❌ 작업 실패:', err);
    process.exit(1);
  });







 * 테스트/내부 이메일 삭제 스크립트 (이메일만 삭제)
 * 
 * 테스트 이메일과 내부 메일의 이메일 필드만 null로 업데이트합니다.
 * 고객과 예약 정보는 유지됩니다.
 * 
 * 사용법:
 * node scripts/delete-test-emails-only.js [--dry-run]
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

// 삭제해야 할 테스트/내부 이메일 목록
const testEmails = [
  // 첫 번째 그룹
  '1111111@naver.com',
  'aa@aa.com',
  'aa@aa.ss',
  'aa@aaa.aaa',
  'AA@AAA.AAA',
  'aaaa@naver.com',
  // 두 번째 그룹
  'GGG@GGG.GG',
  'hh@hh.hh',
  'hh@hh.hhg',
  'hsg@gg.gg',
  // 내부 메일
  'mas9golf@gg.com',
  'mas9golf@gmail.com',
  'massgogolf@naver.com',
  'Massgoo@gmail.com',
  'massgoo@massgoo.co.kr'
];

async function deleteTestEmailsOnly() {
  const dryRun = process.argv.includes('--dry-run');
  
  console.log('🔍 테스트/내부 이메일 삭제 중...\n');
  if (dryRun) {
    console.log('⚠️  DRY RUN 모드: 실제 삭제 없이 확인만 수행합니다.\n');
  }
  
  const results = {
    bookings: { total: 0, byEmail: {} },
    customers: { total: 0, byEmail: {} },
    errors: []
  };
  
  // 예약 테이블에서 이메일 삭제
  console.log('='.repeat(60));
  console.log('📊 예약 테이블 이메일 삭제');
  console.log('='.repeat(60));
  
  for (const email of testEmails) {
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
      
      if (!dryRun) {
        const bookingIds = bookings.map(b => b.id);
        const { error: updateError } = await supabase
          .from('bookings')
          .update({ email: null })
          .in('id', bookingIds);
        
        if (updateError) {
          console.error(`    ❌ 업데이트 실패:`, updateError);
          results.errors.push({ email, type: 'booking', error: updateError.message });
        } else {
          console.log(`    ✅ 이메일 삭제 완료`);
          results.bookings.total += bookings.length;
          results.bookings.byEmail[email] = bookings.length;
        }
      } else {
        results.bookings.total += bookings.length;
        results.bookings.byEmail[email] = bookings.length;
      }
    }
  }
  
  // 고객 테이블에서 이메일 삭제
  console.log('\n' + '='.repeat(60));
  console.log('📊 고객 테이블 이메일 삭제');
  console.log('='.repeat(60));
  
  for (const email of testEmails) {
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
      
      if (!dryRun) {
        const customerIds = customers.map(c => c.id);
        const { error: updateError } = await supabase
          .from('customers')
          .update({ email: null })
          .in('id', customerIds);
        
        if (updateError) {
          console.error(`    ❌ 업데이트 실패:`, updateError);
          results.errors.push({ email, type: 'customer', error: updateError.message });
        } else {
          console.log(`    ✅ 이메일 삭제 완료`);
          results.customers.total += customers.length;
          results.customers.byEmail[email] = customers.length;
        }
      } else {
        results.customers.total += customers.length;
        results.customers.byEmail[email] = customers.length;
      }
    }
  }
  
  // 결과 요약
  console.log('\n' + '='.repeat(60));
  console.log('📊 삭제 결과 요약');
  console.log('='.repeat(60));
  console.log(`\n✅ 예약 이메일 삭제: ${results.bookings.total}건`);
  console.log(`✅ 고객 이메일 삭제: ${results.customers.total}건`);
  
  if (Object.keys(results.bookings.byEmail).length > 0) {
    console.log(`\n📧 예약 테이블 이메일별:`);
    Object.entries(results.bookings.byEmail).forEach(([email, count]) => {
      console.log(`   - ${email}: ${count}건`);
    });
  }
  
  if (Object.keys(results.customers.byEmail).length > 0) {
    console.log(`\n📧 고객 테이블 이메일별:`);
    Object.entries(results.customers.byEmail).forEach(([email, count]) => {
      console.log(`   - ${email}: ${count}건`);
    });
  }
  
  if (results.errors.length > 0) {
    console.log(`\n❌ 오류 발생: ${results.errors.length}건`);
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

deleteTestEmailsOnly()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('\n❌ 작업 실패:', err);
    process.exit(1);
  });








































