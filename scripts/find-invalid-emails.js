/**
 * 잘못된 이메일 형식 찾기 스크립트
 * 
 * 유효하지 않은 이메일 형식을 찾아서 보고합니다.
 * 예: "Aaa.aaa@@ aaa", "aaa@@aaa.com" 등
 * 
 * 사용법:
 * node scripts/find-invalid-emails.js
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
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
  
  // 추가 검증: @가 2개 이상이면 안됨, 공백이 있으면 안됨
  if (email.includes('@@')) return false;
  if (email.includes(' ')) return false;
  if (email.startsWith('@') || email.endsWith('@')) return false;
  if (email.startsWith('.') || email.endsWith('.')) return false;
  if (!email.includes('@')) return false; // @가 없으면 안됨
  if (email.split('@').length !== 2) return false; // @가 정확히 1개여야 함
  
  return emailRegex.test(email);
}

async function findInvalidEmails() {
  console.log('🔍 잘못된 이메일 형식 찾기 중...\n');
  
  const results = {
    bookings: [],
    customers: [],
    totalBookings: 0,
    totalCustomers: 0,
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
  
  // 잘못된 이메일 찾기
  for (const booking of allBookings) {
    if (booking.email && !isValidEmail(booking.email)) {
      results.bookings.push(booking);
      results.totalBookings++;
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
  
  // 잘못된 이메일 찾기
  for (const customer of allCustomers) {
    if (customer.email && !isValidEmail(customer.email)) {
      results.customers.push(customer);
      results.totalCustomers++;
    }
  }
  
  // 결과 출력
  console.log('='.repeat(60));
  console.log('📊 잘못된 이메일 형식 발견');
  console.log('='.repeat(60));
  
  console.log(`\n📧 예약 테이블: ${results.totalBookings}건\n`);
  if (results.bookings.length > 0) {
    results.bookings.forEach((b, i) => {
      console.log(`${i + 1}. ID: ${b.id}`);
      console.log(`   이름: ${b.name}`);
      console.log(`   전화번호: ${b.phone}`);
      console.log(`   잘못된 이메일: "${b.email}"`);
      console.log(`   날짜: ${b.date}`);
      console.log('');
    });
  }
  
  console.log(`\n📧 고객 테이블: ${results.totalCustomers}건\n`);
  if (results.customers.length > 0) {
    results.customers.forEach((c, i) => {
      console.log(`${i + 1}. ID: ${c.id}`);
      console.log(`   이름: ${c.name}`);
      console.log(`   전화번호: ${c.phone}`);
      console.log(`   잘못된 이메일: "${c.email}"`);
      console.log('');
    });
  }
  
  // 요약
  console.log('='.repeat(60));
  console.log('📊 요약');
  console.log('='.repeat(60));
  console.log(`✅ 총 잘못된 이메일: ${results.totalBookings + results.totalCustomers}건`);
  console.log(`   - 예약: ${results.totalBookings}건`);
  console.log(`   - 고객: ${results.totalCustomers}건`);
  
  // JSON 리포트 저장
  const backupDir = path.join(__dirname, '..', 'backup');
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }
  const reportPath = path.join(backupDir, `invalid-emails-${Date.now()}.json`);
  fs.writeFileSync(reportPath, JSON.stringify(results, null, 2), 'utf8');
  console.log(`\n📄 상세 리포트 저장: ${reportPath}`);
  
  console.log('\n✅ 조사 완료!\n');
}

findInvalidEmails()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('\n❌ 작업 실패:', err);
    process.exit(1);
  });







