/**
 * VIP9911 고객 정보 수정 스크립트
 * 
 * 010-8230-9911 전화번호의 예약과 고객 정보를 수정합니다.
 * - 전화번호 형식 수정 (108-230-9911 → 010-8230-9911)
 * - 고객명을 "신세원"으로 업데이트
 * 
 * 사용법:
 * node scripts/fix-vip9911-customer.js [--dry-run]
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

async function fixVIP9911Customer() {
  const dryRun = process.argv.includes('--dry-run');
  
  const correctPhone = '01082309911'; // 올바른 형식 (하이픈 없음)
  const correctPhoneFormatted = '010-8230-9911'; // 표시용 형식
  const wrongPhone1 = '1082309911'; // 잘못된 형식 (앞의 0이 빠짐)
  const wrongPhone2 = '108-230-9911'; // 잘못된 형식 (하이픈 포함)
  const correctName = '신세원';
  
  console.log('🔍 VIP9911 고객 정보 수정 중...\n');
  if (dryRun) {
    console.log('⚠️  DRY RUN 모드: 실제 수정 없이 확인만 수행합니다.\n');
  }
  
  // 모든 형태의 전화번호로 조회
  const phoneConditions = `phone.eq.${correctPhone},phone.eq.${wrongPhone1},phone.eq.${wrongPhone2},phone.eq.010-8230-9911`;
  
  // 예약 조회
  const { data: bookings, error: bookingsError } = await supabase
    .from('bookings')
    .select('*')
    .or(phoneConditions)
    .order('date', { ascending: true });
  
  if (bookingsError) {
    console.error('❌ 예약 조회 오류:', bookingsError);
    process.exit(1);
  }
  
  // 고객 조회
  const { data: customers, error: customersError } = await supabase
    .from('customers')
    .select('*')
    .or(phoneConditions)
    .order('created_at', { ascending: true });
  
  if (customersError) {
    console.error('❌ 고객 조회 오류:', customersError);
    process.exit(1);
  }
  
  const bookingCount = bookings?.length || 0;
  const customerCount = customers?.length || 0;
  
  if (bookingCount === 0 && customerCount === 0) {
    console.log('✅ 해당 전화번호로 된 예약이나 고객이 없습니다.\n');
    return;
  }
  
  console.log(`📊 발견된 예약: ${bookingCount}건\n`);
  if (bookings && bookings.length > 0) {
    bookings.forEach((b, i) => {
      console.log(`${i + 1}. ID: ${b.id}`);
      console.log(`   현재 이름: ${b.name}`);
      console.log(`   현재 전화번호: ${b.phone}`);
      console.log(`   날짜/시간: ${b.date} ${b.time}`);
      console.log('');
    });
  }
  
  console.log(`📊 발견된 고객: ${customerCount}건\n`);
  if (customers && customers.length > 0) {
    customers.forEach((c, i) => {
      console.log(`${i + 1}. ID: ${c.id}`);
      console.log(`   현재 이름: ${c.name}`);
      console.log(`   현재 전화번호: ${c.phone}`);
      console.log(`   방문 횟수: ${c.visit_count || 0}회`);
      console.log('');
    });
  }
  
  if (dryRun) {
    console.log('💡 실제 수정 내용:');
    console.log(`   - 예약 전화번호: → ${correctPhoneFormatted}`);
    console.log(`   - 예약 이름: → ${correctName}`);
    console.log(`   - 고객 전화번호: → ${correctPhoneFormatted}`);
    console.log(`   - 고객 이름: → ${correctName}`);
    console.log('\n💡 실제 수정을 하려면 --dry-run 옵션을 제거하고 다시 실행하세요.\n');
    return;
  }
  
  // 예약 업데이트
  if (bookings && bookings.length > 0) {
    console.log('📝 예약 정보 업데이트 중...');
    for (const booking of bookings) {
      const { error: updateError } = await supabase
        .from('bookings')
        .update({
          name: correctName,
          phone: correctPhone,
        })
        .eq('id', booking.id);
      
      if (updateError) {
        console.error(`❌ 예약 업데이트 실패 (ID: ${booking.id}):`, updateError);
      } else {
        console.log(`✅ 예약 업데이트 완료: ID ${booking.id} (${booking.date} ${booking.time})`);
      }
    }
    console.log('');
  }
  
  // 고객 업데이트 또는 생성
  if (customers && customers.length > 0) {
    console.log('📝 고객 정보 업데이트 중...');
    // 첫 번째 고객을 메인으로 사용하고 나머지는 삭제
    const mainCustomer = customers[0];
    
    // 메인 고객 업데이트
    const { error: updateError } = await supabase
      .from('customers')
      .update({
        name: correctName,
        phone: correctPhone,
      })
      .eq('id', mainCustomer.id);
    
    if (updateError) {
      console.error(`❌ 고객 업데이트 실패 (ID: ${mainCustomer.id}):`, updateError);
    } else {
      console.log(`✅ 고객 업데이트 완료: ID ${mainCustomer.id}`);
    }
    
    // 중복 고객 삭제 (있는 경우)
    if (customers.length > 1) {
      const duplicateIds = customers.slice(1).map(c => c.id);
      const { error: deleteError } = await supabase
        .from('customers')
        .delete()
        .in('id', duplicateIds);
      
      if (deleteError) {
        console.error('❌ 중복 고객 삭제 실패:', deleteError);
      } else {
        console.log(`✅ 중복 고객 삭제 완료: ${duplicateIds.length}건`);
      }
    }
  } else {
    // 고객이 없으면 생성
    console.log('➕ 새 고객 생성 중...');
    const { data: newCustomer, error: insertError } = await supabase
      .from('customers')
      .insert({
        name: correctName,
        phone: correctPhone,
        visit_count: bookingCount,
      })
      .select('id')
      .single();
    
    if (insertError) {
      console.error('❌ 고객 생성 실패:', insertError);
    } else {
      console.log(`✅ 고객 생성 완료: ID ${newCustomer.id}`);
    }
  }
  
  console.log('\n='.repeat(60));
  console.log('📊 수정 결과');
  console.log('='.repeat(60));
  console.log(`✅ 예약 업데이트: ${bookingCount}건`);
  console.log(`✅ 고객 업데이트/생성: 1건`);
  console.log(`✅ 전화번호: ${correctPhoneFormatted}`);
  console.log(`✅ 고객명: ${correctName}`);
  console.log('\n✅ 작업 완료!\n');
}

fixVIP9911Customer()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('\n❌ 작업 실패:', err);
    process.exit(1);
  });







 * VIP9911 고객 정보 수정 스크립트
 * 
 * 010-8230-9911 전화번호의 예약과 고객 정보를 수정합니다.
 * - 전화번호 형식 수정 (108-230-9911 → 010-8230-9911)
 * - 고객명을 "신세원"으로 업데이트
 * 
 * 사용법:
 * node scripts/fix-vip9911-customer.js [--dry-run]
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

async function fixVIP9911Customer() {
  const dryRun = process.argv.includes('--dry-run');
  
  const correctPhone = '01082309911'; // 올바른 형식 (하이픈 없음)
  const correctPhoneFormatted = '010-8230-9911'; // 표시용 형식
  const wrongPhone1 = '1082309911'; // 잘못된 형식 (앞의 0이 빠짐)
  const wrongPhone2 = '108-230-9911'; // 잘못된 형식 (하이픈 포함)
  const correctName = '신세원';
  
  console.log('🔍 VIP9911 고객 정보 수정 중...\n');
  if (dryRun) {
    console.log('⚠️  DRY RUN 모드: 실제 수정 없이 확인만 수행합니다.\n');
  }
  
  // 모든 형태의 전화번호로 조회
  const phoneConditions = `phone.eq.${correctPhone},phone.eq.${wrongPhone1},phone.eq.${wrongPhone2},phone.eq.010-8230-9911`;
  
  // 예약 조회
  const { data: bookings, error: bookingsError } = await supabase
    .from('bookings')
    .select('*')
    .or(phoneConditions)
    .order('date', { ascending: true });
  
  if (bookingsError) {
    console.error('❌ 예약 조회 오류:', bookingsError);
    process.exit(1);
  }
  
  // 고객 조회
  const { data: customers, error: customersError } = await supabase
    .from('customers')
    .select('*')
    .or(phoneConditions)
    .order('created_at', { ascending: true });
  
  if (customersError) {
    console.error('❌ 고객 조회 오류:', customersError);
    process.exit(1);
  }
  
  const bookingCount = bookings?.length || 0;
  const customerCount = customers?.length || 0;
  
  if (bookingCount === 0 && customerCount === 0) {
    console.log('✅ 해당 전화번호로 된 예약이나 고객이 없습니다.\n');
    return;
  }
  
  console.log(`📊 발견된 예약: ${bookingCount}건\n`);
  if (bookings && bookings.length > 0) {
    bookings.forEach((b, i) => {
      console.log(`${i + 1}. ID: ${b.id}`);
      console.log(`   현재 이름: ${b.name}`);
      console.log(`   현재 전화번호: ${b.phone}`);
      console.log(`   날짜/시간: ${b.date} ${b.time}`);
      console.log('');
    });
  }
  
  console.log(`📊 발견된 고객: ${customerCount}건\n`);
  if (customers && customers.length > 0) {
    customers.forEach((c, i) => {
      console.log(`${i + 1}. ID: ${c.id}`);
      console.log(`   현재 이름: ${c.name}`);
      console.log(`   현재 전화번호: ${c.phone}`);
      console.log(`   방문 횟수: ${c.visit_count || 0}회`);
      console.log('');
    });
  }
  
  if (dryRun) {
    console.log('💡 실제 수정 내용:');
    console.log(`   - 예약 전화번호: → ${correctPhoneFormatted}`);
    console.log(`   - 예약 이름: → ${correctName}`);
    console.log(`   - 고객 전화번호: → ${correctPhoneFormatted}`);
    console.log(`   - 고객 이름: → ${correctName}`);
    console.log('\n💡 실제 수정을 하려면 --dry-run 옵션을 제거하고 다시 실행하세요.\n');
    return;
  }
  
  // 예약 업데이트
  if (bookings && bookings.length > 0) {
    console.log('📝 예약 정보 업데이트 중...');
    for (const booking of bookings) {
      const { error: updateError } = await supabase
        .from('bookings')
        .update({
          name: correctName,
          phone: correctPhone,
        })
        .eq('id', booking.id);
      
      if (updateError) {
        console.error(`❌ 예약 업데이트 실패 (ID: ${booking.id}):`, updateError);
      } else {
        console.log(`✅ 예약 업데이트 완료: ID ${booking.id} (${booking.date} ${booking.time})`);
      }
    }
    console.log('');
  }
  
  // 고객 업데이트 또는 생성
  if (customers && customers.length > 0) {
    console.log('📝 고객 정보 업데이트 중...');
    // 첫 번째 고객을 메인으로 사용하고 나머지는 삭제
    const mainCustomer = customers[0];
    
    // 메인 고객 업데이트
    const { error: updateError } = await supabase
      .from('customers')
      .update({
        name: correctName,
        phone: correctPhone,
      })
      .eq('id', mainCustomer.id);
    
    if (updateError) {
      console.error(`❌ 고객 업데이트 실패 (ID: ${mainCustomer.id}):`, updateError);
    } else {
      console.log(`✅ 고객 업데이트 완료: ID ${mainCustomer.id}`);
    }
    
    // 중복 고객 삭제 (있는 경우)
    if (customers.length > 1) {
      const duplicateIds = customers.slice(1).map(c => c.id);
      const { error: deleteError } = await supabase
        .from('customers')
        .delete()
        .in('id', duplicateIds);
      
      if (deleteError) {
        console.error('❌ 중복 고객 삭제 실패:', deleteError);
      } else {
        console.log(`✅ 중복 고객 삭제 완료: ${duplicateIds.length}건`);
      }
    }
  } else {
    // 고객이 없으면 생성
    console.log('➕ 새 고객 생성 중...');
    const { data: newCustomer, error: insertError } = await supabase
      .from('customers')
      .insert({
        name: correctName,
        phone: correctPhone,
        visit_count: bookingCount,
      })
      .select('id')
      .single();
    
    if (insertError) {
      console.error('❌ 고객 생성 실패:', insertError);
    } else {
      console.log(`✅ 고객 생성 완료: ID ${newCustomer.id}`);
    }
  }
  
  console.log('\n='.repeat(60));
  console.log('📊 수정 결과');
  console.log('='.repeat(60));
  console.log(`✅ 예약 업데이트: ${bookingCount}건`);
  console.log(`✅ 고객 업데이트/생성: 1건`);
  console.log(`✅ 전화번호: ${correctPhoneFormatted}`);
  console.log(`✅ 고객명: ${correctName}`);
  console.log('\n✅ 작업 완료!\n');
}

fixVIP9911Customer()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('\n❌ 작업 실패:', err);
    process.exit(1);
  });







 * VIP9911 고객 정보 수정 스크립트
 * 
 * 010-8230-9911 전화번호의 예약과 고객 정보를 수정합니다.
 * - 전화번호 형식 수정 (108-230-9911 → 010-8230-9911)
 * - 고객명을 "신세원"으로 업데이트
 * 
 * 사용법:
 * node scripts/fix-vip9911-customer.js [--dry-run]
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

async function fixVIP9911Customer() {
  const dryRun = process.argv.includes('--dry-run');
  
  const correctPhone = '01082309911'; // 올바른 형식 (하이픈 없음)
  const correctPhoneFormatted = '010-8230-9911'; // 표시용 형식
  const wrongPhone1 = '1082309911'; // 잘못된 형식 (앞의 0이 빠짐)
  const wrongPhone2 = '108-230-9911'; // 잘못된 형식 (하이픈 포함)
  const correctName = '신세원';
  
  console.log('🔍 VIP9911 고객 정보 수정 중...\n');
  if (dryRun) {
    console.log('⚠️  DRY RUN 모드: 실제 수정 없이 확인만 수행합니다.\n');
  }
  
  // 모든 형태의 전화번호로 조회
  const phoneConditions = `phone.eq.${correctPhone},phone.eq.${wrongPhone1},phone.eq.${wrongPhone2},phone.eq.010-8230-9911`;
  
  // 예약 조회
  const { data: bookings, error: bookingsError } = await supabase
    .from('bookings')
    .select('*')
    .or(phoneConditions)
    .order('date', { ascending: true });
  
  if (bookingsError) {
    console.error('❌ 예약 조회 오류:', bookingsError);
    process.exit(1);
  }
  
  // 고객 조회
  const { data: customers, error: customersError } = await supabase
    .from('customers')
    .select('*')
    .or(phoneConditions)
    .order('created_at', { ascending: true });
  
  if (customersError) {
    console.error('❌ 고객 조회 오류:', customersError);
    process.exit(1);
  }
  
  const bookingCount = bookings?.length || 0;
  const customerCount = customers?.length || 0;
  
  if (bookingCount === 0 && customerCount === 0) {
    console.log('✅ 해당 전화번호로 된 예약이나 고객이 없습니다.\n');
    return;
  }
  
  console.log(`📊 발견된 예약: ${bookingCount}건\n`);
  if (bookings && bookings.length > 0) {
    bookings.forEach((b, i) => {
      console.log(`${i + 1}. ID: ${b.id}`);
      console.log(`   현재 이름: ${b.name}`);
      console.log(`   현재 전화번호: ${b.phone}`);
      console.log(`   날짜/시간: ${b.date} ${b.time}`);
      console.log('');
    });
  }
  
  console.log(`📊 발견된 고객: ${customerCount}건\n`);
  if (customers && customers.length > 0) {
    customers.forEach((c, i) => {
      console.log(`${i + 1}. ID: ${c.id}`);
      console.log(`   현재 이름: ${c.name}`);
      console.log(`   현재 전화번호: ${c.phone}`);
      console.log(`   방문 횟수: ${c.visit_count || 0}회`);
      console.log('');
    });
  }
  
  if (dryRun) {
    console.log('💡 실제 수정 내용:');
    console.log(`   - 예약 전화번호: → ${correctPhoneFormatted}`);
    console.log(`   - 예약 이름: → ${correctName}`);
    console.log(`   - 고객 전화번호: → ${correctPhoneFormatted}`);
    console.log(`   - 고객 이름: → ${correctName}`);
    console.log('\n💡 실제 수정을 하려면 --dry-run 옵션을 제거하고 다시 실행하세요.\n');
    return;
  }
  
  // 예약 업데이트
  if (bookings && bookings.length > 0) {
    console.log('📝 예약 정보 업데이트 중...');
    for (const booking of bookings) {
      const { error: updateError } = await supabase
        .from('bookings')
        .update({
          name: correctName,
          phone: correctPhone,
        })
        .eq('id', booking.id);
      
      if (updateError) {
        console.error(`❌ 예약 업데이트 실패 (ID: ${booking.id}):`, updateError);
      } else {
        console.log(`✅ 예약 업데이트 완료: ID ${booking.id} (${booking.date} ${booking.time})`);
      }
    }
    console.log('');
  }
  
  // 고객 업데이트 또는 생성
  if (customers && customers.length > 0) {
    console.log('📝 고객 정보 업데이트 중...');
    // 첫 번째 고객을 메인으로 사용하고 나머지는 삭제
    const mainCustomer = customers[0];
    
    // 메인 고객 업데이트
    const { error: updateError } = await supabase
      .from('customers')
      .update({
        name: correctName,
        phone: correctPhone,
      })
      .eq('id', mainCustomer.id);
    
    if (updateError) {
      console.error(`❌ 고객 업데이트 실패 (ID: ${mainCustomer.id}):`, updateError);
    } else {
      console.log(`✅ 고객 업데이트 완료: ID ${mainCustomer.id}`);
    }
    
    // 중복 고객 삭제 (있는 경우)
    if (customers.length > 1) {
      const duplicateIds = customers.slice(1).map(c => c.id);
      const { error: deleteError } = await supabase
        .from('customers')
        .delete()
        .in('id', duplicateIds);
      
      if (deleteError) {
        console.error('❌ 중복 고객 삭제 실패:', deleteError);
      } else {
        console.log(`✅ 중복 고객 삭제 완료: ${duplicateIds.length}건`);
      }
    }
  } else {
    // 고객이 없으면 생성
    console.log('➕ 새 고객 생성 중...');
    const { data: newCustomer, error: insertError } = await supabase
      .from('customers')
      .insert({
        name: correctName,
        phone: correctPhone,
        visit_count: bookingCount,
      })
      .select('id')
      .single();
    
    if (insertError) {
      console.error('❌ 고객 생성 실패:', insertError);
    } else {
      console.log(`✅ 고객 생성 완료: ID ${newCustomer.id}`);
    }
  }
  
  console.log('\n='.repeat(60));
  console.log('📊 수정 결과');
  console.log('='.repeat(60));
  console.log(`✅ 예약 업데이트: ${bookingCount}건`);
  console.log(`✅ 고객 업데이트/생성: 1건`);
  console.log(`✅ 전화번호: ${correctPhoneFormatted}`);
  console.log(`✅ 고객명: ${correctName}`);
  console.log('\n✅ 작업 완료!\n');
}

fixVIP9911Customer()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('\n❌ 작업 실패:', err);
    process.exit(1);
  });







 * VIP9911 고객 정보 수정 스크립트
 * 
 * 010-8230-9911 전화번호의 예약과 고객 정보를 수정합니다.
 * - 전화번호 형식 수정 (108-230-9911 → 010-8230-9911)
 * - 고객명을 "신세원"으로 업데이트
 * 
 * 사용법:
 * node scripts/fix-vip9911-customer.js [--dry-run]
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

async function fixVIP9911Customer() {
  const dryRun = process.argv.includes('--dry-run');
  
  const correctPhone = '01082309911'; // 올바른 형식 (하이픈 없음)
  const correctPhoneFormatted = '010-8230-9911'; // 표시용 형식
  const wrongPhone1 = '1082309911'; // 잘못된 형식 (앞의 0이 빠짐)
  const wrongPhone2 = '108-230-9911'; // 잘못된 형식 (하이픈 포함)
  const correctName = '신세원';
  
  console.log('🔍 VIP9911 고객 정보 수정 중...\n');
  if (dryRun) {
    console.log('⚠️  DRY RUN 모드: 실제 수정 없이 확인만 수행합니다.\n');
  }
  
  // 모든 형태의 전화번호로 조회
  const phoneConditions = `phone.eq.${correctPhone},phone.eq.${wrongPhone1},phone.eq.${wrongPhone2},phone.eq.010-8230-9911`;
  
  // 예약 조회
  const { data: bookings, error: bookingsError } = await supabase
    .from('bookings')
    .select('*')
    .or(phoneConditions)
    .order('date', { ascending: true });
  
  if (bookingsError) {
    console.error('❌ 예약 조회 오류:', bookingsError);
    process.exit(1);
  }
  
  // 고객 조회
  const { data: customers, error: customersError } = await supabase
    .from('customers')
    .select('*')
    .or(phoneConditions)
    .order('created_at', { ascending: true });
  
  if (customersError) {
    console.error('❌ 고객 조회 오류:', customersError);
    process.exit(1);
  }
  
  const bookingCount = bookings?.length || 0;
  const customerCount = customers?.length || 0;
  
  if (bookingCount === 0 && customerCount === 0) {
    console.log('✅ 해당 전화번호로 된 예약이나 고객이 없습니다.\n');
    return;
  }
  
  console.log(`📊 발견된 예약: ${bookingCount}건\n`);
  if (bookings && bookings.length > 0) {
    bookings.forEach((b, i) => {
      console.log(`${i + 1}. ID: ${b.id}`);
      console.log(`   현재 이름: ${b.name}`);
      console.log(`   현재 전화번호: ${b.phone}`);
      console.log(`   날짜/시간: ${b.date} ${b.time}`);
      console.log('');
    });
  }
  
  console.log(`📊 발견된 고객: ${customerCount}건\n`);
  if (customers && customers.length > 0) {
    customers.forEach((c, i) => {
      console.log(`${i + 1}. ID: ${c.id}`);
      console.log(`   현재 이름: ${c.name}`);
      console.log(`   현재 전화번호: ${c.phone}`);
      console.log(`   방문 횟수: ${c.visit_count || 0}회`);
      console.log('');
    });
  }
  
  if (dryRun) {
    console.log('💡 실제 수정 내용:');
    console.log(`   - 예약 전화번호: → ${correctPhoneFormatted}`);
    console.log(`   - 예약 이름: → ${correctName}`);
    console.log(`   - 고객 전화번호: → ${correctPhoneFormatted}`);
    console.log(`   - 고객 이름: → ${correctName}`);
    console.log('\n💡 실제 수정을 하려면 --dry-run 옵션을 제거하고 다시 실행하세요.\n');
    return;
  }
  
  // 예약 업데이트
  if (bookings && bookings.length > 0) {
    console.log('📝 예약 정보 업데이트 중...');
    for (const booking of bookings) {
      const { error: updateError } = await supabase
        .from('bookings')
        .update({
          name: correctName,
          phone: correctPhone,
        })
        .eq('id', booking.id);
      
      if (updateError) {
        console.error(`❌ 예약 업데이트 실패 (ID: ${booking.id}):`, updateError);
      } else {
        console.log(`✅ 예약 업데이트 완료: ID ${booking.id} (${booking.date} ${booking.time})`);
      }
    }
    console.log('');
  }
  
  // 고객 업데이트 또는 생성
  if (customers && customers.length > 0) {
    console.log('📝 고객 정보 업데이트 중...');
    // 첫 번째 고객을 메인으로 사용하고 나머지는 삭제
    const mainCustomer = customers[0];
    
    // 메인 고객 업데이트
    const { error: updateError } = await supabase
      .from('customers')
      .update({
        name: correctName,
        phone: correctPhone,
      })
      .eq('id', mainCustomer.id);
    
    if (updateError) {
      console.error(`❌ 고객 업데이트 실패 (ID: ${mainCustomer.id}):`, updateError);
    } else {
      console.log(`✅ 고객 업데이트 완료: ID ${mainCustomer.id}`);
    }
    
    // 중복 고객 삭제 (있는 경우)
    if (customers.length > 1) {
      const duplicateIds = customers.slice(1).map(c => c.id);
      const { error: deleteError } = await supabase
        .from('customers')
        .delete()
        .in('id', duplicateIds);
      
      if (deleteError) {
        console.error('❌ 중복 고객 삭제 실패:', deleteError);
      } else {
        console.log(`✅ 중복 고객 삭제 완료: ${duplicateIds.length}건`);
      }
    }
  } else {
    // 고객이 없으면 생성
    console.log('➕ 새 고객 생성 중...');
    const { data: newCustomer, error: insertError } = await supabase
      .from('customers')
      .insert({
        name: correctName,
        phone: correctPhone,
        visit_count: bookingCount,
      })
      .select('id')
      .single();
    
    if (insertError) {
      console.error('❌ 고객 생성 실패:', insertError);
    } else {
      console.log(`✅ 고객 생성 완료: ID ${newCustomer.id}`);
    }
  }
  
  console.log('\n='.repeat(60));
  console.log('📊 수정 결과');
  console.log('='.repeat(60));
  console.log(`✅ 예약 업데이트: ${bookingCount}건`);
  console.log(`✅ 고객 업데이트/생성: 1건`);
  console.log(`✅ 전화번호: ${correctPhoneFormatted}`);
  console.log(`✅ 고객명: ${correctName}`);
  console.log('\n✅ 작업 완료!\n');
}

fixVIP9911Customer()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('\n❌ 작업 실패:', err);
    process.exit(1);
  });







 * VIP9911 고객 정보 수정 스크립트
 * 
 * 010-8230-9911 전화번호의 예약과 고객 정보를 수정합니다.
 * - 전화번호 형식 수정 (108-230-9911 → 010-8230-9911)
 * - 고객명을 "신세원"으로 업데이트
 * 
 * 사용법:
 * node scripts/fix-vip9911-customer.js [--dry-run]
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

async function fixVIP9911Customer() {
  const dryRun = process.argv.includes('--dry-run');
  
  const correctPhone = '01082309911'; // 올바른 형식 (하이픈 없음)
  const correctPhoneFormatted = '010-8230-9911'; // 표시용 형식
  const wrongPhone1 = '1082309911'; // 잘못된 형식 (앞의 0이 빠짐)
  const wrongPhone2 = '108-230-9911'; // 잘못된 형식 (하이픈 포함)
  const correctName = '신세원';
  
  console.log('🔍 VIP9911 고객 정보 수정 중...\n');
  if (dryRun) {
    console.log('⚠️  DRY RUN 모드: 실제 수정 없이 확인만 수행합니다.\n');
  }
  
  // 모든 형태의 전화번호로 조회
  const phoneConditions = `phone.eq.${correctPhone},phone.eq.${wrongPhone1},phone.eq.${wrongPhone2},phone.eq.010-8230-9911`;
  
  // 예약 조회
  const { data: bookings, error: bookingsError } = await supabase
    .from('bookings')
    .select('*')
    .or(phoneConditions)
    .order('date', { ascending: true });
  
  if (bookingsError) {
    console.error('❌ 예약 조회 오류:', bookingsError);
    process.exit(1);
  }
  
  // 고객 조회
  const { data: customers, error: customersError } = await supabase
    .from('customers')
    .select('*')
    .or(phoneConditions)
    .order('created_at', { ascending: true });
  
  if (customersError) {
    console.error('❌ 고객 조회 오류:', customersError);
    process.exit(1);
  }
  
  const bookingCount = bookings?.length || 0;
  const customerCount = customers?.length || 0;
  
  if (bookingCount === 0 && customerCount === 0) {
    console.log('✅ 해당 전화번호로 된 예약이나 고객이 없습니다.\n');
    return;
  }
  
  console.log(`📊 발견된 예약: ${bookingCount}건\n`);
  if (bookings && bookings.length > 0) {
    bookings.forEach((b, i) => {
      console.log(`${i + 1}. ID: ${b.id}`);
      console.log(`   현재 이름: ${b.name}`);
      console.log(`   현재 전화번호: ${b.phone}`);
      console.log(`   날짜/시간: ${b.date} ${b.time}`);
      console.log('');
    });
  }
  
  console.log(`📊 발견된 고객: ${customerCount}건\n`);
  if (customers && customers.length > 0) {
    customers.forEach((c, i) => {
      console.log(`${i + 1}. ID: ${c.id}`);
      console.log(`   현재 이름: ${c.name}`);
      console.log(`   현재 전화번호: ${c.phone}`);
      console.log(`   방문 횟수: ${c.visit_count || 0}회`);
      console.log('');
    });
  }
  
  if (dryRun) {
    console.log('💡 실제 수정 내용:');
    console.log(`   - 예약 전화번호: → ${correctPhoneFormatted}`);
    console.log(`   - 예약 이름: → ${correctName}`);
    console.log(`   - 고객 전화번호: → ${correctPhoneFormatted}`);
    console.log(`   - 고객 이름: → ${correctName}`);
    console.log('\n💡 실제 수정을 하려면 --dry-run 옵션을 제거하고 다시 실행하세요.\n');
    return;
  }
  
  // 예약 업데이트
  if (bookings && bookings.length > 0) {
    console.log('📝 예약 정보 업데이트 중...');
    for (const booking of bookings) {
      const { error: updateError } = await supabase
        .from('bookings')
        .update({
          name: correctName,
          phone: correctPhone,
        })
        .eq('id', booking.id);
      
      if (updateError) {
        console.error(`❌ 예약 업데이트 실패 (ID: ${booking.id}):`, updateError);
      } else {
        console.log(`✅ 예약 업데이트 완료: ID ${booking.id} (${booking.date} ${booking.time})`);
      }
    }
    console.log('');
  }
  
  // 고객 업데이트 또는 생성
  if (customers && customers.length > 0) {
    console.log('📝 고객 정보 업데이트 중...');
    // 첫 번째 고객을 메인으로 사용하고 나머지는 삭제
    const mainCustomer = customers[0];
    
    // 메인 고객 업데이트
    const { error: updateError } = await supabase
      .from('customers')
      .update({
        name: correctName,
        phone: correctPhone,
      })
      .eq('id', mainCustomer.id);
    
    if (updateError) {
      console.error(`❌ 고객 업데이트 실패 (ID: ${mainCustomer.id}):`, updateError);
    } else {
      console.log(`✅ 고객 업데이트 완료: ID ${mainCustomer.id}`);
    }
    
    // 중복 고객 삭제 (있는 경우)
    if (customers.length > 1) {
      const duplicateIds = customers.slice(1).map(c => c.id);
      const { error: deleteError } = await supabase
        .from('customers')
        .delete()
        .in('id', duplicateIds);
      
      if (deleteError) {
        console.error('❌ 중복 고객 삭제 실패:', deleteError);
      } else {
        console.log(`✅ 중복 고객 삭제 완료: ${duplicateIds.length}건`);
      }
    }
  } else {
    // 고객이 없으면 생성
    console.log('➕ 새 고객 생성 중...');
    const { data: newCustomer, error: insertError } = await supabase
      .from('customers')
      .insert({
        name: correctName,
        phone: correctPhone,
        visit_count: bookingCount,
      })
      .select('id')
      .single();
    
    if (insertError) {
      console.error('❌ 고객 생성 실패:', insertError);
    } else {
      console.log(`✅ 고객 생성 완료: ID ${newCustomer.id}`);
    }
  }
  
  console.log('\n='.repeat(60));
  console.log('📊 수정 결과');
  console.log('='.repeat(60));
  console.log(`✅ 예약 업데이트: ${bookingCount}건`);
  console.log(`✅ 고객 업데이트/생성: 1건`);
  console.log(`✅ 전화번호: ${correctPhoneFormatted}`);
  console.log(`✅ 고객명: ${correctName}`);
  console.log('\n✅ 작업 완료!\n');
}

fixVIP9911Customer()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('\n❌ 작업 실패:', err);
    process.exit(1);
  });




















