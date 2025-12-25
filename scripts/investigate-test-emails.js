/**
 * 테스트/내부 이메일 조사 스크립트
 * 
 * 삭제해야 할 테스트 이메일과 내부 메일을 조사합니다.
 * 
 * 사용법:
 * node scripts/investigate-test-emails.js
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
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

async function investigateTestEmails() {
  console.log('🔍 테스트/내부 이메일 조사 중...\n');
  console.log(`📋 조사 대상 이메일: ${testEmails.length}개\n`);
  
  const results = {
    bookings: [],
    customers: [],
    totalBookings: 0,
    totalCustomers: 0,
  };
  
  // 예약 테이블 조사
  console.log('='.repeat(60));
  console.log('📊 예약 테이블 조사');
  console.log('='.repeat(60));
  
  for (const email of testEmails) {
    const { data: bookings, error } = await supabase
      .from('bookings')
      .select('id, name, phone, email, date, time, service_type')
      .ilike('email', email);
    
    if (error) {
      console.error(`❌ ${email} 조회 오류:`, error);
      continue;
    }
    
    if (bookings && bookings.length > 0) {
      console.log(`\n📧 ${email}: ${bookings.length}건`);
      bookings.forEach((b, i) => {
        console.log(`   ${i + 1}. ID: ${b.id}`);
        console.log(`      이름: ${b.name}`);
        console.log(`      전화번호: ${b.phone}`);
        console.log(`      날짜/시간: ${b.date} ${b.time}`);
        console.log(`      서비스: ${b.service_type || '-'}`);
      });
      
      results.bookings.push({
        email,
        count: bookings.length,
        bookings: bookings
      });
      results.totalBookings += bookings.length;
    }
  }
  
  // 고객 테이블 조사
  console.log('\n' + '='.repeat(60));
  console.log('📊 고객 테이블 조사');
  console.log('='.repeat(60));
  
  for (const email of testEmails) {
    const { data: customers, error } = await supabase
      .from('customers')
      .select('id, name, phone, email, visit_count')
      .ilike('email', email);
    
    if (error) {
      console.error(`❌ ${email} 조회 오류:`, error);
      continue;
    }
    
    if (customers && customers.length > 0) {
      console.log(`\n📧 ${email}: ${customers.length}건`);
      customers.forEach((c, i) => {
        console.log(`   ${i + 1}. ID: ${c.id}`);
        console.log(`      이름: ${c.name}`);
        console.log(`      전화번호: ${c.phone}`);
        console.log(`      방문 횟수: ${c.visit_count || 0}회`);
      });
      
      results.customers.push({
        email,
        count: customers.length,
        customers: customers
      });
      results.totalCustomers += customers.length;
    }
  }
  
  // 요약 리포트
  console.log('\n' + '='.repeat(60));
  console.log('📊 조사 결과 요약');
  console.log('='.repeat(60));
  console.log(`\n✅ 총 예약 이메일 삭제 대상: ${results.totalBookings}건`);
  console.log(`✅ 총 고객 이메일 삭제 대상: ${results.totalCustomers}건`);
  console.log(`\n📋 이메일별 상세:`);
  
  // 예약 이메일별 통계
  if (results.bookings.length > 0) {
    console.log(`\n📧 예약 테이블:`);
    results.bookings.forEach(item => {
      console.log(`   - ${item.email}: ${item.count}건`);
    });
  } else {
    console.log(`\n📧 예약 테이블: 삭제 대상 없음`);
  }
  
  // 고객 이메일별 통계
  if (results.customers.length > 0) {
    console.log(`\n📧 고객 테이블:`);
    results.customers.forEach(item => {
      console.log(`   - ${item.email}: ${item.count}건`);
    });
  } else {
    console.log(`\n📧 고객 테이블: 삭제 대상 없음`);
  }
  
  // JSON 리포트 저장
  const backupDir = path.join(__dirname, '..', 'backup');
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }
  const reportPath = path.join(backupDir, `test-emails-investigation-${Date.now()}.json`);
  fs.writeFileSync(reportPath, JSON.stringify(results, null, 2), 'utf8');
  console.log(`\n📄 상세 리포트 저장: ${reportPath}`);
  
  console.log('\n✅ 조사 완료!\n');
}

investigateTestEmails()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('\n❌ 작업 실패:', err);
    process.exit(1);
  });







 * 테스트/내부 이메일 조사 스크립트
 * 
 * 삭제해야 할 테스트 이메일과 내부 메일을 조사합니다.
 * 
 * 사용법:
 * node scripts/investigate-test-emails.js
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
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

async function investigateTestEmails() {
  console.log('🔍 테스트/내부 이메일 조사 중...\n');
  console.log(`📋 조사 대상 이메일: ${testEmails.length}개\n`);
  
  const results = {
    bookings: [],
    customers: [],
    totalBookings: 0,
    totalCustomers: 0,
  };
  
  // 예약 테이블 조사
  console.log('='.repeat(60));
  console.log('📊 예약 테이블 조사');
  console.log('='.repeat(60));
  
  for (const email of testEmails) {
    const { data: bookings, error } = await supabase
      .from('bookings')
      .select('id, name, phone, email, date, time, service_type')
      .ilike('email', email);
    
    if (error) {
      console.error(`❌ ${email} 조회 오류:`, error);
      continue;
    }
    
    if (bookings && bookings.length > 0) {
      console.log(`\n📧 ${email}: ${bookings.length}건`);
      bookings.forEach((b, i) => {
        console.log(`   ${i + 1}. ID: ${b.id}`);
        console.log(`      이름: ${b.name}`);
        console.log(`      전화번호: ${b.phone}`);
        console.log(`      날짜/시간: ${b.date} ${b.time}`);
        console.log(`      서비스: ${b.service_type || '-'}`);
      });
      
      results.bookings.push({
        email,
        count: bookings.length,
        bookings: bookings
      });
      results.totalBookings += bookings.length;
    }
  }
  
  // 고객 테이블 조사
  console.log('\n' + '='.repeat(60));
  console.log('📊 고객 테이블 조사');
  console.log('='.repeat(60));
  
  for (const email of testEmails) {
    const { data: customers, error } = await supabase
      .from('customers')
      .select('id, name, phone, email, visit_count')
      .ilike('email', email);
    
    if (error) {
      console.error(`❌ ${email} 조회 오류:`, error);
      continue;
    }
    
    if (customers && customers.length > 0) {
      console.log(`\n📧 ${email}: ${customers.length}건`);
      customers.forEach((c, i) => {
        console.log(`   ${i + 1}. ID: ${c.id}`);
        console.log(`      이름: ${c.name}`);
        console.log(`      전화번호: ${c.phone}`);
        console.log(`      방문 횟수: ${c.visit_count || 0}회`);
      });
      
      results.customers.push({
        email,
        count: customers.length,
        customers: customers
      });
      results.totalCustomers += customers.length;
    }
  }
  
  // 요약 리포트
  console.log('\n' + '='.repeat(60));
  console.log('📊 조사 결과 요약');
  console.log('='.repeat(60));
  console.log(`\n✅ 총 예약 이메일 삭제 대상: ${results.totalBookings}건`);
  console.log(`✅ 총 고객 이메일 삭제 대상: ${results.totalCustomers}건`);
  console.log(`\n📋 이메일별 상세:`);
  
  // 예약 이메일별 통계
  if (results.bookings.length > 0) {
    console.log(`\n📧 예약 테이블:`);
    results.bookings.forEach(item => {
      console.log(`   - ${item.email}: ${item.count}건`);
    });
  } else {
    console.log(`\n📧 예약 테이블: 삭제 대상 없음`);
  }
  
  // 고객 이메일별 통계
  if (results.customers.length > 0) {
    console.log(`\n📧 고객 테이블:`);
    results.customers.forEach(item => {
      console.log(`   - ${item.email}: ${item.count}건`);
    });
  } else {
    console.log(`\n📧 고객 테이블: 삭제 대상 없음`);
  }
  
  // JSON 리포트 저장
  const backupDir = path.join(__dirname, '..', 'backup');
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }
  const reportPath = path.join(backupDir, `test-emails-investigation-${Date.now()}.json`);
  fs.writeFileSync(reportPath, JSON.stringify(results, null, 2), 'utf8');
  console.log(`\n📄 상세 리포트 저장: ${reportPath}`);
  
  console.log('\n✅ 조사 완료!\n');
}

investigateTestEmails()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('\n❌ 작업 실패:', err);
    process.exit(1);
  });







 * 테스트/내부 이메일 조사 스크립트
 * 
 * 삭제해야 할 테스트 이메일과 내부 메일을 조사합니다.
 * 
 * 사용법:
 * node scripts/investigate-test-emails.js
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
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

async function investigateTestEmails() {
  console.log('🔍 테스트/내부 이메일 조사 중...\n');
  console.log(`📋 조사 대상 이메일: ${testEmails.length}개\n`);
  
  const results = {
    bookings: [],
    customers: [],
    totalBookings: 0,
    totalCustomers: 0,
  };
  
  // 예약 테이블 조사
  console.log('='.repeat(60));
  console.log('📊 예약 테이블 조사');
  console.log('='.repeat(60));
  
  for (const email of testEmails) {
    const { data: bookings, error } = await supabase
      .from('bookings')
      .select('id, name, phone, email, date, time, service_type')
      .ilike('email', email);
    
    if (error) {
      console.error(`❌ ${email} 조회 오류:`, error);
      continue;
    }
    
    if (bookings && bookings.length > 0) {
      console.log(`\n📧 ${email}: ${bookings.length}건`);
      bookings.forEach((b, i) => {
        console.log(`   ${i + 1}. ID: ${b.id}`);
        console.log(`      이름: ${b.name}`);
        console.log(`      전화번호: ${b.phone}`);
        console.log(`      날짜/시간: ${b.date} ${b.time}`);
        console.log(`      서비스: ${b.service_type || '-'}`);
      });
      
      results.bookings.push({
        email,
        count: bookings.length,
        bookings: bookings
      });
      results.totalBookings += bookings.length;
    }
  }
  
  // 고객 테이블 조사
  console.log('\n' + '='.repeat(60));
  console.log('📊 고객 테이블 조사');
  console.log('='.repeat(60));
  
  for (const email of testEmails) {
    const { data: customers, error } = await supabase
      .from('customers')
      .select('id, name, phone, email, visit_count')
      .ilike('email', email);
    
    if (error) {
      console.error(`❌ ${email} 조회 오류:`, error);
      continue;
    }
    
    if (customers && customers.length > 0) {
      console.log(`\n📧 ${email}: ${customers.length}건`);
      customers.forEach((c, i) => {
        console.log(`   ${i + 1}. ID: ${c.id}`);
        console.log(`      이름: ${c.name}`);
        console.log(`      전화번호: ${c.phone}`);
        console.log(`      방문 횟수: ${c.visit_count || 0}회`);
      });
      
      results.customers.push({
        email,
        count: customers.length,
        customers: customers
      });
      results.totalCustomers += customers.length;
    }
  }
  
  // 요약 리포트
  console.log('\n' + '='.repeat(60));
  console.log('📊 조사 결과 요약');
  console.log('='.repeat(60));
  console.log(`\n✅ 총 예약 이메일 삭제 대상: ${results.totalBookings}건`);
  console.log(`✅ 총 고객 이메일 삭제 대상: ${results.totalCustomers}건`);
  console.log(`\n📋 이메일별 상세:`);
  
  // 예약 이메일별 통계
  if (results.bookings.length > 0) {
    console.log(`\n📧 예약 테이블:`);
    results.bookings.forEach(item => {
      console.log(`   - ${item.email}: ${item.count}건`);
    });
  } else {
    console.log(`\n📧 예약 테이블: 삭제 대상 없음`);
  }
  
  // 고객 이메일별 통계
  if (results.customers.length > 0) {
    console.log(`\n📧 고객 테이블:`);
    results.customers.forEach(item => {
      console.log(`   - ${item.email}: ${item.count}건`);
    });
  } else {
    console.log(`\n📧 고객 테이블: 삭제 대상 없음`);
  }
  
  // JSON 리포트 저장
  const backupDir = path.join(__dirname, '..', 'backup');
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }
  const reportPath = path.join(backupDir, `test-emails-investigation-${Date.now()}.json`);
  fs.writeFileSync(reportPath, JSON.stringify(results, null, 2), 'utf8');
  console.log(`\n📄 상세 리포트 저장: ${reportPath}`);
  
  console.log('\n✅ 조사 완료!\n');
}

investigateTestEmails()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('\n❌ 작업 실패:', err);
    process.exit(1);
  });







 * 테스트/내부 이메일 조사 스크립트
 * 
 * 삭제해야 할 테스트 이메일과 내부 메일을 조사합니다.
 * 
 * 사용법:
 * node scripts/investigate-test-emails.js
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
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

async function investigateTestEmails() {
  console.log('🔍 테스트/내부 이메일 조사 중...\n');
  console.log(`📋 조사 대상 이메일: ${testEmails.length}개\n`);
  
  const results = {
    bookings: [],
    customers: [],
    totalBookings: 0,
    totalCustomers: 0,
  };
  
  // 예약 테이블 조사
  console.log('='.repeat(60));
  console.log('📊 예약 테이블 조사');
  console.log('='.repeat(60));
  
  for (const email of testEmails) {
    const { data: bookings, error } = await supabase
      .from('bookings')
      .select('id, name, phone, email, date, time, service_type')
      .ilike('email', email);
    
    if (error) {
      console.error(`❌ ${email} 조회 오류:`, error);
      continue;
    }
    
    if (bookings && bookings.length > 0) {
      console.log(`\n📧 ${email}: ${bookings.length}건`);
      bookings.forEach((b, i) => {
        console.log(`   ${i + 1}. ID: ${b.id}`);
        console.log(`      이름: ${b.name}`);
        console.log(`      전화번호: ${b.phone}`);
        console.log(`      날짜/시간: ${b.date} ${b.time}`);
        console.log(`      서비스: ${b.service_type || '-'}`);
      });
      
      results.bookings.push({
        email,
        count: bookings.length,
        bookings: bookings
      });
      results.totalBookings += bookings.length;
    }
  }
  
  // 고객 테이블 조사
  console.log('\n' + '='.repeat(60));
  console.log('📊 고객 테이블 조사');
  console.log('='.repeat(60));
  
  for (const email of testEmails) {
    const { data: customers, error } = await supabase
      .from('customers')
      .select('id, name, phone, email, visit_count')
      .ilike('email', email);
    
    if (error) {
      console.error(`❌ ${email} 조회 오류:`, error);
      continue;
    }
    
    if (customers && customers.length > 0) {
      console.log(`\n📧 ${email}: ${customers.length}건`);
      customers.forEach((c, i) => {
        console.log(`   ${i + 1}. ID: ${c.id}`);
        console.log(`      이름: ${c.name}`);
        console.log(`      전화번호: ${c.phone}`);
        console.log(`      방문 횟수: ${c.visit_count || 0}회`);
      });
      
      results.customers.push({
        email,
        count: customers.length,
        customers: customers
      });
      results.totalCustomers += customers.length;
    }
  }
  
  // 요약 리포트
  console.log('\n' + '='.repeat(60));
  console.log('📊 조사 결과 요약');
  console.log('='.repeat(60));
  console.log(`\n✅ 총 예약 이메일 삭제 대상: ${results.totalBookings}건`);
  console.log(`✅ 총 고객 이메일 삭제 대상: ${results.totalCustomers}건`);
  console.log(`\n📋 이메일별 상세:`);
  
  // 예약 이메일별 통계
  if (results.bookings.length > 0) {
    console.log(`\n📧 예약 테이블:`);
    results.bookings.forEach(item => {
      console.log(`   - ${item.email}: ${item.count}건`);
    });
  } else {
    console.log(`\n📧 예약 테이블: 삭제 대상 없음`);
  }
  
  // 고객 이메일별 통계
  if (results.customers.length > 0) {
    console.log(`\n📧 고객 테이블:`);
    results.customers.forEach(item => {
      console.log(`   - ${item.email}: ${item.count}건`);
    });
  } else {
    console.log(`\n📧 고객 테이블: 삭제 대상 없음`);
  }
  
  // JSON 리포트 저장
  const backupDir = path.join(__dirname, '..', 'backup');
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }
  const reportPath = path.join(backupDir, `test-emails-investigation-${Date.now()}.json`);
  fs.writeFileSync(reportPath, JSON.stringify(results, null, 2), 'utf8');
  console.log(`\n📄 상세 리포트 저장: ${reportPath}`);
  
  console.log('\n✅ 조사 완료!\n');
}

investigateTestEmails()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('\n❌ 작업 실패:', err);
    process.exit(1);
  });







 * 테스트/내부 이메일 조사 스크립트
 * 
 * 삭제해야 할 테스트 이메일과 내부 메일을 조사합니다.
 * 
 * 사용법:
 * node scripts/investigate-test-emails.js
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
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

async function investigateTestEmails() {
  console.log('🔍 테스트/내부 이메일 조사 중...\n');
  console.log(`📋 조사 대상 이메일: ${testEmails.length}개\n`);
  
  const results = {
    bookings: [],
    customers: [],
    totalBookings: 0,
    totalCustomers: 0,
  };
  
  // 예약 테이블 조사
  console.log('='.repeat(60));
  console.log('📊 예약 테이블 조사');
  console.log('='.repeat(60));
  
  for (const email of testEmails) {
    const { data: bookings, error } = await supabase
      .from('bookings')
      .select('id, name, phone, email, date, time, service_type')
      .ilike('email', email);
    
    if (error) {
      console.error(`❌ ${email} 조회 오류:`, error);
      continue;
    }
    
    if (bookings && bookings.length > 0) {
      console.log(`\n📧 ${email}: ${bookings.length}건`);
      bookings.forEach((b, i) => {
        console.log(`   ${i + 1}. ID: ${b.id}`);
        console.log(`      이름: ${b.name}`);
        console.log(`      전화번호: ${b.phone}`);
        console.log(`      날짜/시간: ${b.date} ${b.time}`);
        console.log(`      서비스: ${b.service_type || '-'}`);
      });
      
      results.bookings.push({
        email,
        count: bookings.length,
        bookings: bookings
      });
      results.totalBookings += bookings.length;
    }
  }
  
  // 고객 테이블 조사
  console.log('\n' + '='.repeat(60));
  console.log('📊 고객 테이블 조사');
  console.log('='.repeat(60));
  
  for (const email of testEmails) {
    const { data: customers, error } = await supabase
      .from('customers')
      .select('id, name, phone, email, visit_count')
      .ilike('email', email);
    
    if (error) {
      console.error(`❌ ${email} 조회 오류:`, error);
      continue;
    }
    
    if (customers && customers.length > 0) {
      console.log(`\n📧 ${email}: ${customers.length}건`);
      customers.forEach((c, i) => {
        console.log(`   ${i + 1}. ID: ${c.id}`);
        console.log(`      이름: ${c.name}`);
        console.log(`      전화번호: ${c.phone}`);
        console.log(`      방문 횟수: ${c.visit_count || 0}회`);
      });
      
      results.customers.push({
        email,
        count: customers.length,
        customers: customers
      });
      results.totalCustomers += customers.length;
    }
  }
  
  // 요약 리포트
  console.log('\n' + '='.repeat(60));
  console.log('📊 조사 결과 요약');
  console.log('='.repeat(60));
  console.log(`\n✅ 총 예약 이메일 삭제 대상: ${results.totalBookings}건`);
  console.log(`✅ 총 고객 이메일 삭제 대상: ${results.totalCustomers}건`);
  console.log(`\n📋 이메일별 상세:`);
  
  // 예약 이메일별 통계
  if (results.bookings.length > 0) {
    console.log(`\n📧 예약 테이블:`);
    results.bookings.forEach(item => {
      console.log(`   - ${item.email}: ${item.count}건`);
    });
  } else {
    console.log(`\n📧 예약 테이블: 삭제 대상 없음`);
  }
  
  // 고객 이메일별 통계
  if (results.customers.length > 0) {
    console.log(`\n📧 고객 테이블:`);
    results.customers.forEach(item => {
      console.log(`   - ${item.email}: ${item.count}건`);
    });
  } else {
    console.log(`\n📧 고객 테이블: 삭제 대상 없음`);
  }
  
  // JSON 리포트 저장
  const backupDir = path.join(__dirname, '..', 'backup');
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }
  const reportPath = path.join(backupDir, `test-emails-investigation-${Date.now()}.json`);
  fs.writeFileSync(reportPath, JSON.stringify(results, null, 2), 'utf8');
  console.log(`\n📄 상세 리포트 저장: ${reportPath}`);
  
  console.log('\n✅ 조사 완료!\n');
}

investigateTestEmails()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('\n❌ 작업 실패:', err);
    process.exit(1);
  });







































