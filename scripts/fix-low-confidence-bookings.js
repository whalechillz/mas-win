/**
 * Low Confidence 매칭으로 생성된 예약 데이터 수정 스크립트
 * 
 * 수정 사항:
 * 1. 9번 "최동우고객" → "최동우"로 이름 수정
 * 2. 6번, 13번 is_as_visit = true로 수정
 */

const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Supabase 환경 변수가 설정되지 않았습니다.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fixBookings() {
  console.log('🔧 Low Confidence 예약 데이터 수정 시작...\n');
  
  // 1. 9번 "최동우고객" → "최동우"로 수정
  console.log('[1] 최동우고객 → 최동우 이름 수정...');
  const { data: booking9, error: error9 } = await supabase
    .from('bookings')
    .update({ name: '최동우' })
    .eq('phone', '01039549665')
    .eq('date', '2023-01-03')
    .eq('name', '최동우고객')
    .select();
  
  if (error9) {
    console.error('  ❌ 수정 실패:', error9);
  } else {
    console.log(`  ✅ 수정 완료: ${booking9?.length || 0}건`);
  }
  
  // 2. 6번 이동열 is_as_visit = true로 수정
  console.log('\n[2] 이동열 AS 방문 플래그 수정...');
  const { data: booking6, error: error6 } = await supabase
    .from('bookings')
    .update({ is_as_visit: true })
    .eq('phone', '01056015676')
    .eq('date', '2023-03-21')
    .eq('name', '이동열')
    .eq('is_as_visit', false)
    .select();
  
  if (error6) {
    console.error('  ❌ 수정 실패:', error6);
  } else {
    console.log(`  ✅ 수정 완료: ${booking6?.length || 0}건`);
  }
  
  // 3. 13번 오세집 is_as_visit = true로 수정
  console.log('\n[3] 오세집 AS 방문 플래그 수정...');
  const { data: booking13, error: error13 } = await supabase
    .from('bookings')
    .update({ is_as_visit: true })
    .eq('phone', '01052184544')
    .eq('date', '2022-08-18')
    .eq('name', '오세집')
    .eq('is_as_visit', false)
    .select();
  
  if (error13) {
    console.error('  ❌ 수정 실패:', error13);
  } else {
    console.log(`  ✅ 수정 완료: ${booking13?.length || 0}건`);
  }
  
  console.log('\n✅ 수정 완료!\n');
}

fixBookings()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('\n❌ 수정 실패:', err);
    process.exit(1);
  });







 * Low Confidence 매칭으로 생성된 예약 데이터 수정 스크립트
 * 
 * 수정 사항:
 * 1. 9번 "최동우고객" → "최동우"로 이름 수정
 * 2. 6번, 13번 is_as_visit = true로 수정
 */

const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Supabase 환경 변수가 설정되지 않았습니다.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fixBookings() {
  console.log('🔧 Low Confidence 예약 데이터 수정 시작...\n');
  
  // 1. 9번 "최동우고객" → "최동우"로 수정
  console.log('[1] 최동우고객 → 최동우 이름 수정...');
  const { data: booking9, error: error9 } = await supabase
    .from('bookings')
    .update({ name: '최동우' })
    .eq('phone', '01039549665')
    .eq('date', '2023-01-03')
    .eq('name', '최동우고객')
    .select();
  
  if (error9) {
    console.error('  ❌ 수정 실패:', error9);
  } else {
    console.log(`  ✅ 수정 완료: ${booking9?.length || 0}건`);
  }
  
  // 2. 6번 이동열 is_as_visit = true로 수정
  console.log('\n[2] 이동열 AS 방문 플래그 수정...');
  const { data: booking6, error: error6 } = await supabase
    .from('bookings')
    .update({ is_as_visit: true })
    .eq('phone', '01056015676')
    .eq('date', '2023-03-21')
    .eq('name', '이동열')
    .eq('is_as_visit', false)
    .select();
  
  if (error6) {
    console.error('  ❌ 수정 실패:', error6);
  } else {
    console.log(`  ✅ 수정 완료: ${booking6?.length || 0}건`);
  }
  
  // 3. 13번 오세집 is_as_visit = true로 수정
  console.log('\n[3] 오세집 AS 방문 플래그 수정...');
  const { data: booking13, error: error13 } = await supabase
    .from('bookings')
    .update({ is_as_visit: true })
    .eq('phone', '01052184544')
    .eq('date', '2022-08-18')
    .eq('name', '오세집')
    .eq('is_as_visit', false)
    .select();
  
  if (error13) {
    console.error('  ❌ 수정 실패:', error13);
  } else {
    console.log(`  ✅ 수정 완료: ${booking13?.length || 0}건`);
  }
  
  console.log('\n✅ 수정 완료!\n');
}

fixBookings()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('\n❌ 수정 실패:', err);
    process.exit(1);
  });







 * Low Confidence 매칭으로 생성된 예약 데이터 수정 스크립트
 * 
 * 수정 사항:
 * 1. 9번 "최동우고객" → "최동우"로 이름 수정
 * 2. 6번, 13번 is_as_visit = true로 수정
 */

const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Supabase 환경 변수가 설정되지 않았습니다.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fixBookings() {
  console.log('🔧 Low Confidence 예약 데이터 수정 시작...\n');
  
  // 1. 9번 "최동우고객" → "최동우"로 수정
  console.log('[1] 최동우고객 → 최동우 이름 수정...');
  const { data: booking9, error: error9 } = await supabase
    .from('bookings')
    .update({ name: '최동우' })
    .eq('phone', '01039549665')
    .eq('date', '2023-01-03')
    .eq('name', '최동우고객')
    .select();
  
  if (error9) {
    console.error('  ❌ 수정 실패:', error9);
  } else {
    console.log(`  ✅ 수정 완료: ${booking9?.length || 0}건`);
  }
  
  // 2. 6번 이동열 is_as_visit = true로 수정
  console.log('\n[2] 이동열 AS 방문 플래그 수정...');
  const { data: booking6, error: error6 } = await supabase
    .from('bookings')
    .update({ is_as_visit: true })
    .eq('phone', '01056015676')
    .eq('date', '2023-03-21')
    .eq('name', '이동열')
    .eq('is_as_visit', false)
    .select();
  
  if (error6) {
    console.error('  ❌ 수정 실패:', error6);
  } else {
    console.log(`  ✅ 수정 완료: ${booking6?.length || 0}건`);
  }
  
  // 3. 13번 오세집 is_as_visit = true로 수정
  console.log('\n[3] 오세집 AS 방문 플래그 수정...');
  const { data: booking13, error: error13 } = await supabase
    .from('bookings')
    .update({ is_as_visit: true })
    .eq('phone', '01052184544')
    .eq('date', '2022-08-18')
    .eq('name', '오세집')
    .eq('is_as_visit', false)
    .select();
  
  if (error13) {
    console.error('  ❌ 수정 실패:', error13);
  } else {
    console.log(`  ✅ 수정 완료: ${booking13?.length || 0}건`);
  }
  
  console.log('\n✅ 수정 완료!\n');
}

fixBookings()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('\n❌ 수정 실패:', err);
    process.exit(1);
  });







 * Low Confidence 매칭으로 생성된 예약 데이터 수정 스크립트
 * 
 * 수정 사항:
 * 1. 9번 "최동우고객" → "최동우"로 이름 수정
 * 2. 6번, 13번 is_as_visit = true로 수정
 */

const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Supabase 환경 변수가 설정되지 않았습니다.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fixBookings() {
  console.log('🔧 Low Confidence 예약 데이터 수정 시작...\n');
  
  // 1. 9번 "최동우고객" → "최동우"로 수정
  console.log('[1] 최동우고객 → 최동우 이름 수정...');
  const { data: booking9, error: error9 } = await supabase
    .from('bookings')
    .update({ name: '최동우' })
    .eq('phone', '01039549665')
    .eq('date', '2023-01-03')
    .eq('name', '최동우고객')
    .select();
  
  if (error9) {
    console.error('  ❌ 수정 실패:', error9);
  } else {
    console.log(`  ✅ 수정 완료: ${booking9?.length || 0}건`);
  }
  
  // 2. 6번 이동열 is_as_visit = true로 수정
  console.log('\n[2] 이동열 AS 방문 플래그 수정...');
  const { data: booking6, error: error6 } = await supabase
    .from('bookings')
    .update({ is_as_visit: true })
    .eq('phone', '01056015676')
    .eq('date', '2023-03-21')
    .eq('name', '이동열')
    .eq('is_as_visit', false)
    .select();
  
  if (error6) {
    console.error('  ❌ 수정 실패:', error6);
  } else {
    console.log(`  ✅ 수정 완료: ${booking6?.length || 0}건`);
  }
  
  // 3. 13번 오세집 is_as_visit = true로 수정
  console.log('\n[3] 오세집 AS 방문 플래그 수정...');
  const { data: booking13, error: error13 } = await supabase
    .from('bookings')
    .update({ is_as_visit: true })
    .eq('phone', '01052184544')
    .eq('date', '2022-08-18')
    .eq('name', '오세집')
    .eq('is_as_visit', false)
    .select();
  
  if (error13) {
    console.error('  ❌ 수정 실패:', error13);
  } else {
    console.log(`  ✅ 수정 완료: ${booking13?.length || 0}건`);
  }
  
  console.log('\n✅ 수정 완료!\n');
}

fixBookings()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('\n❌ 수정 실패:', err);
    process.exit(1);
  });







 * Low Confidence 매칭으로 생성된 예약 데이터 수정 스크립트
 * 
 * 수정 사항:
 * 1. 9번 "최동우고객" → "최동우"로 이름 수정
 * 2. 6번, 13번 is_as_visit = true로 수정
 */

const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Supabase 환경 변수가 설정되지 않았습니다.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fixBookings() {
  console.log('🔧 Low Confidence 예약 데이터 수정 시작...\n');
  
  // 1. 9번 "최동우고객" → "최동우"로 수정
  console.log('[1] 최동우고객 → 최동우 이름 수정...');
  const { data: booking9, error: error9 } = await supabase
    .from('bookings')
    .update({ name: '최동우' })
    .eq('phone', '01039549665')
    .eq('date', '2023-01-03')
    .eq('name', '최동우고객')
    .select();
  
  if (error9) {
    console.error('  ❌ 수정 실패:', error9);
  } else {
    console.log(`  ✅ 수정 완료: ${booking9?.length || 0}건`);
  }
  
  // 2. 6번 이동열 is_as_visit = true로 수정
  console.log('\n[2] 이동열 AS 방문 플래그 수정...');
  const { data: booking6, error: error6 } = await supabase
    .from('bookings')
    .update({ is_as_visit: true })
    .eq('phone', '01056015676')
    .eq('date', '2023-03-21')
    .eq('name', '이동열')
    .eq('is_as_visit', false)
    .select();
  
  if (error6) {
    console.error('  ❌ 수정 실패:', error6);
  } else {
    console.log(`  ✅ 수정 완료: ${booking6?.length || 0}건`);
  }
  
  // 3. 13번 오세집 is_as_visit = true로 수정
  console.log('\n[3] 오세집 AS 방문 플래그 수정...');
  const { data: booking13, error: error13 } = await supabase
    .from('bookings')
    .update({ is_as_visit: true })
    .eq('phone', '01052184544')
    .eq('date', '2022-08-18')
    .eq('name', '오세집')
    .eq('is_as_visit', false)
    .select();
  
  if (error13) {
    console.error('  ❌ 수정 실패:', error13);
  } else {
    console.log(`  ✅ 수정 완료: ${booking13?.length || 0}건`);
  }
  
  console.log('\n✅ 수정 완료!\n');
}

fixBookings()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('\n❌ 수정 실패:', err);
    process.exit(1);
  });







































