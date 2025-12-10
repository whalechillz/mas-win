/**
 * AS 포함 이름 정리 스크립트
 * 
 * 이름에 "AS", "a/s", "A/S"가 포함된 경우:
 * 1. 이름에서 AS 제거
 * 2. notes에 "AS 방문" 정보 추가
 * 3. is_as_visit 플래그 설정
 * 
 * 사용법:
 * node scripts/fix-as-names.js [--dry-run]
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

// 이름에서 AS 제거하고 기본 이름 추출
function removeASFromName(name) {
  if (!name) return { baseName: name, hasAS: false };
  
  let baseName = name.trim();
  let hasAS = false;
  
  // 1. 앞에 AS가 있는 경우: "AS김용율", "A/S 노태율"
  const frontASPatterns = [
    /^AS\s*/i,        // 앞에 AS + 공백
    /^A\/S\s*/i,      // 앞에 A/S + 공백
    /^a\/s\s*/i,      // 앞에 a/s + 공백
  ];
  
  for (const pattern of frontASPatterns) {
    if (pattern.test(baseName)) {
      baseName = baseName.replace(pattern, '').trim();
      hasAS = true;
      break;
    }
  }
  
  // 2. 중간에 AS가 있는 경우: "이태성 AS 찾으러옴", "정윤호A/S 방문", "이동열 방문AS 시타채수거"
  // AS/A/S 뒤의 모든 내용 제거
  const middleASPatterns = [
    /\s+AS\s+.*$/i,        // 공백 + AS + 공백 + 추가 정보
    /\s+A\/S\s+.*$/i,      // 공백 + A/S + 공백 + 추가 정보
    /\s+a\/s\s+.*$/i,      // 공백 + a/s + 공백 + 추가 정보
    /A\/S\s+.*$/i,         // A/S + 공백 + 추가 정보 (공백 없이 붙어있는 경우)
    /a\/s\s+.*$/i,         // a/s + 공백 + 추가 정보
    /\s+AS\s+.*$/i,        // 공백 + AS + 공백 + 추가 정보
    /방문AS\s+.*$/i,       // "방문AS 시타채수거" 같은 경우
    /AS\s+.*$/i,           // AS + 공백 + 추가 정보 (공백 없이 붙어있는 경우)
  ];
  
  for (const pattern of middleASPatterns) {
    if (pattern.test(baseName)) {
      baseName = baseName.replace(pattern, '').trim();
      hasAS = true;
      break;
    }
  }
  
  // 3. 이름 중간에 AS가 붙어있는 경우: "정윤호A/S 방문" -> "정윤호"
  // 한글 + AS/A/S + 공백 + 추가 정보 패턴
  const attachedASPatterns = [
    /([가-힣]+)A\/S\s+.*$/i,  // 한글 + A/S + 공백 + 추가 정보
    /([가-힣]+)a\/s\s+.*$/i,  // 한글 + a/s + 공백 + 추가 정보
    /([가-힣]+)AS\s+.*$/i,    // 한글 + AS + 공백 + 추가 정보
  ];
  
  for (const pattern of attachedASPatterns) {
    const match = baseName.match(pattern);
    if (match) {
      baseName = match[1].trim(); // 한글 부분만 추출
      hasAS = true;
      break;
    }
  }
  
  // 3. 끝에 AS가 있는 경우: "김인섭AS", "형남길AS"
  const endASPatterns = [
    /AS$/i,           // 끝에 AS
    /AS\s*$/i,        // 끝에 AS + 공백
    /\s+AS$/i,        // 공백 + AS
    /a\/s$/i,         // 끝에 a/s
    /A\/S$/i,         // 끝에 A/S
    /\s+a\/s$/i,      // 공백 + a/s
    /\s+A\/S$/i,      // 공백 + A/S
  ];
  
  for (const pattern of endASPatterns) {
    if (pattern.test(baseName)) {
      baseName = baseName.replace(pattern, '').trim();
      hasAS = true;
      break;
    }
  }
  
  return { baseName, hasAS };
}

// notes에 AS 정보 추가
function addASToNotes(existingNotes, hasAS) {
  if (!hasAS) return existingNotes;
  
  const asNote = '[AS 방문]';
  
  if (existingNotes && existingNotes.trim()) {
    // 이미 AS 방문 정보가 있는지 확인
    if (existingNotes.includes('[AS 방문]') || existingNotes.includes('AS 방문')) {
      return existingNotes; // 이미 있으면 그대로
    }
    return `${existingNotes}\n${asNote}`;
  }
  
  return asNote;
}

async function fixASNames() {
  const dryRun = process.argv.includes('--dry-run');
  
  console.log('🔍 AS 포함 이름 정리 중...\n');
  if (dryRun) {
    console.log('⚠️  DRY RUN 모드: 실제 수정 없이 확인만 수행합니다.\n');
  }
  
  // 예약에서 AS 포함 이름 찾기 (페이지네이션)
  let allBookings = [];
  let from = 0;
  const pageSize = 1000;
  let hasMore = true;
  
  while (hasMore) {
    const { data: bookings, error: bookingError } = await supabase
      .from('bookings')
      .select('id, name, phone, email, date, notes, is_as_visit')
      .or('name.ilike.%AS%,name.ilike.%a/s%,name.ilike.%A/S%')
      .order('date', { ascending: true })
      .range(from, from + pageSize - 1);
    
    if (bookingError) {
      console.error('❌ 예약 조회 오류:', bookingError);
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
  
  // 고객에서 AS 포함 이름 찾기 (페이지네이션)
  let allCustomers = [];
  from = 0;
  hasMore = true;
  
  while (hasMore) {
    const { data: customers, error: customerError } = await supabase
      .from('customers')
      .select('id, name, phone, email')
      .or('name.ilike.%AS%,name.ilike.%a/s%,name.ilike.%A/S%')
      .order('created_at', { ascending: true })
      .range(from, from + pageSize - 1);
    
    if (customerError) {
      console.error('❌ 고객 조회 오류:', customerError);
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
  
  console.log(`📊 발견된 예약: ${allBookings.length}건`);
  console.log(`📊 발견된 고객: ${allCustomers.length}건\n`);
  
  const results = {
    bookings: { updated: [], skipped: [], errors: [] },
    customers: { updated: [], skipped: [], errors: [] },
  };
  
  // 예약 처리
  console.log('='.repeat(60));
  console.log('📊 예약 처리');
  console.log('='.repeat(60));
  
  for (const booking of allBookings) {
    const { baseName, hasAS } = removeASFromName(booking.name);
    
    if (!hasAS) {
      results.bookings.skipped.push({ id: booking.id, name: booking.name, reason: 'AS 패턴 없음' });
      continue;
    }
    
    if (baseName === booking.name) {
      results.bookings.skipped.push({ id: booking.id, name: booking.name, reason: '변경 없음' });
      continue;
    }
    
    console.log(`\n[예약 ID: ${booking.id}]`);
    console.log(`   현재 이름: "${booking.name}"`);
    console.log(`   변경 이름: "${baseName}"`);
    
    const newNotes = addASToNotes(booking.notes, hasAS);
    
    if (dryRun) {
      console.log(`   [DRY RUN] notes 업데이트: "${newNotes}"`);
      console.log(`   [DRY RUN] is_as_visit: true`);
      results.bookings.updated.push({ id: booking.id, oldName: booking.name, newName: baseName });
      continue;
    }
    
    try {
      const updateData = {
        name: baseName,
        is_as_visit: true,
      };
      
      if (newNotes !== booking.notes) {
        updateData.notes = newNotes;
      }
      
      const { error: updateError } = await supabase
        .from('bookings')
        .update(updateData)
        .eq('id', booking.id);
      
      if (updateError) {
        throw updateError;
      }
      
      console.log(`   ✅ 업데이트 완료`);
      results.bookings.updated.push({ id: booking.id, oldName: booking.name, newName: baseName });
    } catch (error) {
      console.error(`   ❌ 업데이트 실패:`, error.message);
      results.bookings.errors.push({ id: booking.id, name: booking.name, error: error.message });
    }
  }
  
  // 고객 처리
  console.log('\n' + '='.repeat(60));
  console.log('📊 고객 처리');
  console.log('='.repeat(60));
  
  for (const customer of allCustomers) {
    const { baseName, hasAS } = removeASFromName(customer.name);
    
    if (!hasAS) {
      results.customers.skipped.push({ id: customer.id, name: customer.name, reason: 'AS 패턴 없음' });
      continue;
    }
    
    if (baseName === customer.name) {
      results.customers.skipped.push({ id: customer.id, name: customer.name, reason: '변경 없음' });
      continue;
    }
    
    console.log(`\n[고객 ID: ${customer.id}]`);
    console.log(`   현재 이름: "${customer.name}"`);
    console.log(`   변경 이름: "${baseName}"`);
    
    if (dryRun) {
      console.log(`   [DRY RUN] 이름 업데이트`);
      results.customers.updated.push({ id: customer.id, oldName: customer.name, newName: baseName });
      continue;
    }
    
    try {
      const { error: updateError } = await supabase
        .from('customers')
        .update({ name: baseName })
        .eq('id', customer.id);
      
      if (updateError) {
        throw updateError;
      }
      
      console.log(`   ✅ 업데이트 완료`);
      results.customers.updated.push({ id: customer.id, oldName: customer.name, newName: baseName });
    } catch (error) {
      console.error(`   ❌ 업데이트 실패:`, error.message);
      results.customers.errors.push({ id: customer.id, name: customer.name, error: error.message });
    }
  }
  
  // 결과 요약
  console.log('\n' + '='.repeat(60));
  console.log('📊 처리 결과 요약');
  console.log('='.repeat(60));
  console.log(`\n✅ 예약 업데이트: ${results.bookings.updated.length}건`);
  console.log(`   ⚠️  건너뜀: ${results.bookings.skipped.length}건`);
  console.log(`   ❌ 오류: ${results.bookings.errors.length}건`);
  console.log(`\n✅ 고객 업데이트: ${results.customers.updated.length}건`);
  console.log(`   ⚠️  건너뜀: ${results.customers.skipped.length}건`);
  console.log(`   ❌ 오류: ${results.customers.errors.length}건`);
  
  if (results.bookings.updated.length > 0) {
    console.log(`\n📋 업데이트된 예약 (샘플 10건):`);
    results.bookings.updated.slice(0, 10).forEach((r, i) => {
      console.log(`   ${i + 1}. "${r.oldName}" → "${r.newName}"`);
    });
    if (results.bookings.updated.length > 10) {
      console.log(`   ... 외 ${results.bookings.updated.length - 10}건`);
    }
  }
  
  if (results.customers.updated.length > 0) {
    console.log(`\n📋 업데이트된 고객 (샘플 10건):`);
    results.customers.updated.slice(0, 10).forEach((r, i) => {
      console.log(`   ${i + 1}. "${r.oldName}" → "${r.newName}"`);
    });
    if (results.customers.updated.length > 10) {
      console.log(`   ... 외 ${results.customers.updated.length - 10}건`);
    }
  }
  
  if (dryRun) {
    console.log('\n💡 실제 수정을 하려면 --dry-run 옵션을 제거하고 다시 실행하세요.');
  } else {
    console.log('\n✅ 작업 완료!');
  }
}

fixASNames()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('\n❌ 작업 실패:', err);
    process.exit(1);
  });


 * 
 * 이름에 "AS", "a/s", "A/S"가 포함된 경우:
 * 1. 이름에서 AS 제거
 * 2. notes에 "AS 방문" 정보 추가
 * 3. is_as_visit 플래그 설정
 * 
 * 사용법:
 * node scripts/fix-as-names.js [--dry-run]
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

// 이름에서 AS 제거하고 기본 이름 추출
function removeASFromName(name) {
  if (!name) return { baseName: name, hasAS: false };
  
  let baseName = name.trim();
  let hasAS = false;
  
  // 1. 앞에 AS가 있는 경우: "AS김용율", "A/S 노태율"
  const frontASPatterns = [
    /^AS\s*/i,        // 앞에 AS + 공백
    /^A\/S\s*/i,      // 앞에 A/S + 공백
    /^a\/s\s*/i,      // 앞에 a/s + 공백
  ];
  
  for (const pattern of frontASPatterns) {
    if (pattern.test(baseName)) {
      baseName = baseName.replace(pattern, '').trim();
      hasAS = true;
      break;
    }
  }
  
  // 2. 중간에 AS가 있는 경우: "이태성 AS 찾으러옴", "정윤호A/S 방문", "이동열 방문AS 시타채수거"
  // AS/A/S 뒤의 모든 내용 제거
  const middleASPatterns = [
    /\s+AS\s+.*$/i,        // 공백 + AS + 공백 + 추가 정보
    /\s+A\/S\s+.*$/i,      // 공백 + A/S + 공백 + 추가 정보
    /\s+a\/s\s+.*$/i,      // 공백 + a/s + 공백 + 추가 정보
    /A\/S\s+.*$/i,         // A/S + 공백 + 추가 정보 (공백 없이 붙어있는 경우)
    /a\/s\s+.*$/i,         // a/s + 공백 + 추가 정보
    /\s+AS\s+.*$/i,        // 공백 + AS + 공백 + 추가 정보
    /방문AS\s+.*$/i,       // "방문AS 시타채수거" 같은 경우
    /AS\s+.*$/i,           // AS + 공백 + 추가 정보 (공백 없이 붙어있는 경우)
  ];
  
  for (const pattern of middleASPatterns) {
    if (pattern.test(baseName)) {
      baseName = baseName.replace(pattern, '').trim();
      hasAS = true;
      break;
    }
  }
  
  // 3. 이름 중간에 AS가 붙어있는 경우: "정윤호A/S 방문" -> "정윤호"
  // 한글 + AS/A/S + 공백 + 추가 정보 패턴
  const attachedASPatterns = [
    /([가-힣]+)A\/S\s+.*$/i,  // 한글 + A/S + 공백 + 추가 정보
    /([가-힣]+)a\/s\s+.*$/i,  // 한글 + a/s + 공백 + 추가 정보
    /([가-힣]+)AS\s+.*$/i,    // 한글 + AS + 공백 + 추가 정보
  ];
  
  for (const pattern of attachedASPatterns) {
    const match = baseName.match(pattern);
    if (match) {
      baseName = match[1].trim(); // 한글 부분만 추출
      hasAS = true;
      break;
    }
  }
  
  // 3. 끝에 AS가 있는 경우: "김인섭AS", "형남길AS"
  const endASPatterns = [
    /AS$/i,           // 끝에 AS
    /AS\s*$/i,        // 끝에 AS + 공백
    /\s+AS$/i,        // 공백 + AS
    /a\/s$/i,         // 끝에 a/s
    /A\/S$/i,         // 끝에 A/S
    /\s+a\/s$/i,      // 공백 + a/s
    /\s+A\/S$/i,      // 공백 + A/S
  ];
  
  for (const pattern of endASPatterns) {
    if (pattern.test(baseName)) {
      baseName = baseName.replace(pattern, '').trim();
      hasAS = true;
      break;
    }
  }
  
  return { baseName, hasAS };
}

// notes에 AS 정보 추가
function addASToNotes(existingNotes, hasAS) {
  if (!hasAS) return existingNotes;
  
  const asNote = '[AS 방문]';
  
  if (existingNotes && existingNotes.trim()) {
    // 이미 AS 방문 정보가 있는지 확인
    if (existingNotes.includes('[AS 방문]') || existingNotes.includes('AS 방문')) {
      return existingNotes; // 이미 있으면 그대로
    }
    return `${existingNotes}\n${asNote}`;
  }
  
  return asNote;
}

async function fixASNames() {
  const dryRun = process.argv.includes('--dry-run');
  
  console.log('🔍 AS 포함 이름 정리 중...\n');
  if (dryRun) {
    console.log('⚠️  DRY RUN 모드: 실제 수정 없이 확인만 수행합니다.\n');
  }
  
  // 예약에서 AS 포함 이름 찾기 (페이지네이션)
  let allBookings = [];
  let from = 0;
  const pageSize = 1000;
  let hasMore = true;
  
  while (hasMore) {
    const { data: bookings, error: bookingError } = await supabase
      .from('bookings')
      .select('id, name, phone, email, date, notes, is_as_visit')
      .or('name.ilike.%AS%,name.ilike.%a/s%,name.ilike.%A/S%')
      .order('date', { ascending: true })
      .range(from, from + pageSize - 1);
    
    if (bookingError) {
      console.error('❌ 예약 조회 오류:', bookingError);
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
  
  // 고객에서 AS 포함 이름 찾기 (페이지네이션)
  let allCustomers = [];
  from = 0;
  hasMore = true;
  
  while (hasMore) {
    const { data: customers, error: customerError } = await supabase
      .from('customers')
      .select('id, name, phone, email')
      .or('name.ilike.%AS%,name.ilike.%a/s%,name.ilike.%A/S%')
      .order('created_at', { ascending: true })
      .range(from, from + pageSize - 1);
    
    if (customerError) {
      console.error('❌ 고객 조회 오류:', customerError);
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
  
  console.log(`📊 발견된 예약: ${allBookings.length}건`);
  console.log(`📊 발견된 고객: ${allCustomers.length}건\n`);
  
  const results = {
    bookings: { updated: [], skipped: [], errors: [] },
    customers: { updated: [], skipped: [], errors: [] },
  };
  
  // 예약 처리
  console.log('='.repeat(60));
  console.log('📊 예약 처리');
  console.log('='.repeat(60));
  
  for (const booking of allBookings) {
    const { baseName, hasAS } = removeASFromName(booking.name);
    
    if (!hasAS) {
      results.bookings.skipped.push({ id: booking.id, name: booking.name, reason: 'AS 패턴 없음' });
      continue;
    }
    
    if (baseName === booking.name) {
      results.bookings.skipped.push({ id: booking.id, name: booking.name, reason: '변경 없음' });
      continue;
    }
    
    console.log(`\n[예약 ID: ${booking.id}]`);
    console.log(`   현재 이름: "${booking.name}"`);
    console.log(`   변경 이름: "${baseName}"`);
    
    const newNotes = addASToNotes(booking.notes, hasAS);
    
    if (dryRun) {
      console.log(`   [DRY RUN] notes 업데이트: "${newNotes}"`);
      console.log(`   [DRY RUN] is_as_visit: true`);
      results.bookings.updated.push({ id: booking.id, oldName: booking.name, newName: baseName });
      continue;
    }
    
    try {
      const updateData = {
        name: baseName,
        is_as_visit: true,
      };
      
      if (newNotes !== booking.notes) {
        updateData.notes = newNotes;
      }
      
      const { error: updateError } = await supabase
        .from('bookings')
        .update(updateData)
        .eq('id', booking.id);
      
      if (updateError) {
        throw updateError;
      }
      
      console.log(`   ✅ 업데이트 완료`);
      results.bookings.updated.push({ id: booking.id, oldName: booking.name, newName: baseName });
    } catch (error) {
      console.error(`   ❌ 업데이트 실패:`, error.message);
      results.bookings.errors.push({ id: booking.id, name: booking.name, error: error.message });
    }
  }
  
  // 고객 처리
  console.log('\n' + '='.repeat(60));
  console.log('📊 고객 처리');
  console.log('='.repeat(60));
  
  for (const customer of allCustomers) {
    const { baseName, hasAS } = removeASFromName(customer.name);
    
    if (!hasAS) {
      results.customers.skipped.push({ id: customer.id, name: customer.name, reason: 'AS 패턴 없음' });
      continue;
    }
    
    if (baseName === customer.name) {
      results.customers.skipped.push({ id: customer.id, name: customer.name, reason: '변경 없음' });
      continue;
    }
    
    console.log(`\n[고객 ID: ${customer.id}]`);
    console.log(`   현재 이름: "${customer.name}"`);
    console.log(`   변경 이름: "${baseName}"`);
    
    if (dryRun) {
      console.log(`   [DRY RUN] 이름 업데이트`);
      results.customers.updated.push({ id: customer.id, oldName: customer.name, newName: baseName });
      continue;
    }
    
    try {
      const { error: updateError } = await supabase
        .from('customers')
        .update({ name: baseName })
        .eq('id', customer.id);
      
      if (updateError) {
        throw updateError;
      }
      
      console.log(`   ✅ 업데이트 완료`);
      results.customers.updated.push({ id: customer.id, oldName: customer.name, newName: baseName });
    } catch (error) {
      console.error(`   ❌ 업데이트 실패:`, error.message);
      results.customers.errors.push({ id: customer.id, name: customer.name, error: error.message });
    }
  }
  
  // 결과 요약
  console.log('\n' + '='.repeat(60));
  console.log('📊 처리 결과 요약');
  console.log('='.repeat(60));
  console.log(`\n✅ 예약 업데이트: ${results.bookings.updated.length}건`);
  console.log(`   ⚠️  건너뜀: ${results.bookings.skipped.length}건`);
  console.log(`   ❌ 오류: ${results.bookings.errors.length}건`);
  console.log(`\n✅ 고객 업데이트: ${results.customers.updated.length}건`);
  console.log(`   ⚠️  건너뜀: ${results.customers.skipped.length}건`);
  console.log(`   ❌ 오류: ${results.customers.errors.length}건`);
  
  if (results.bookings.updated.length > 0) {
    console.log(`\n📋 업데이트된 예약 (샘플 10건):`);
    results.bookings.updated.slice(0, 10).forEach((r, i) => {
      console.log(`   ${i + 1}. "${r.oldName}" → "${r.newName}"`);
    });
    if (results.bookings.updated.length > 10) {
      console.log(`   ... 외 ${results.bookings.updated.length - 10}건`);
    }
  }
  
  if (results.customers.updated.length > 0) {
    console.log(`\n📋 업데이트된 고객 (샘플 10건):`);
    results.customers.updated.slice(0, 10).forEach((r, i) => {
      console.log(`   ${i + 1}. "${r.oldName}" → "${r.newName}"`);
    });
    if (results.customers.updated.length > 10) {
      console.log(`   ... 외 ${results.customers.updated.length - 10}건`);
    }
  }
  
  if (dryRun) {
    console.log('\n💡 실제 수정을 하려면 --dry-run 옵션을 제거하고 다시 실행하세요.');
  } else {
    console.log('\n✅ 작업 완료!');
  }
}

fixASNames()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('\n❌ 작업 실패:', err);
    process.exit(1);
  });


 * 
 * 이름에 "AS", "a/s", "A/S"가 포함된 경우:
 * 1. 이름에서 AS 제거
 * 2. notes에 "AS 방문" 정보 추가
 * 3. is_as_visit 플래그 설정
 * 
 * 사용법:
 * node scripts/fix-as-names.js [--dry-run]
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

// 이름에서 AS 제거하고 기본 이름 추출
function removeASFromName(name) {
  if (!name) return { baseName: name, hasAS: false };
  
  let baseName = name.trim();
  let hasAS = false;
  
  // 1. 앞에 AS가 있는 경우: "AS김용율", "A/S 노태율"
  const frontASPatterns = [
    /^AS\s*/i,        // 앞에 AS + 공백
    /^A\/S\s*/i,      // 앞에 A/S + 공백
    /^a\/s\s*/i,      // 앞에 a/s + 공백
  ];
  
  for (const pattern of frontASPatterns) {
    if (pattern.test(baseName)) {
      baseName = baseName.replace(pattern, '').trim();
      hasAS = true;
      break;
    }
  }
  
  // 2. 중간에 AS가 있는 경우: "이태성 AS 찾으러옴", "정윤호A/S 방문", "이동열 방문AS 시타채수거"
  // AS/A/S 뒤의 모든 내용 제거
  const middleASPatterns = [
    /\s+AS\s+.*$/i,        // 공백 + AS + 공백 + 추가 정보
    /\s+A\/S\s+.*$/i,      // 공백 + A/S + 공백 + 추가 정보
    /\s+a\/s\s+.*$/i,      // 공백 + a/s + 공백 + 추가 정보
    /A\/S\s+.*$/i,         // A/S + 공백 + 추가 정보 (공백 없이 붙어있는 경우)
    /a\/s\s+.*$/i,         // a/s + 공백 + 추가 정보
    /\s+AS\s+.*$/i,        // 공백 + AS + 공백 + 추가 정보
    /방문AS\s+.*$/i,       // "방문AS 시타채수거" 같은 경우
    /AS\s+.*$/i,           // AS + 공백 + 추가 정보 (공백 없이 붙어있는 경우)
  ];
  
  for (const pattern of middleASPatterns) {
    if (pattern.test(baseName)) {
      baseName = baseName.replace(pattern, '').trim();
      hasAS = true;
      break;
    }
  }
  
  // 3. 이름 중간에 AS가 붙어있는 경우: "정윤호A/S 방문" -> "정윤호"
  // 한글 + AS/A/S + 공백 + 추가 정보 패턴
  const attachedASPatterns = [
    /([가-힣]+)A\/S\s+.*$/i,  // 한글 + A/S + 공백 + 추가 정보
    /([가-힣]+)a\/s\s+.*$/i,  // 한글 + a/s + 공백 + 추가 정보
    /([가-힣]+)AS\s+.*$/i,    // 한글 + AS + 공백 + 추가 정보
  ];
  
  for (const pattern of attachedASPatterns) {
    const match = baseName.match(pattern);
    if (match) {
      baseName = match[1].trim(); // 한글 부분만 추출
      hasAS = true;
      break;
    }
  }
  
  // 3. 끝에 AS가 있는 경우: "김인섭AS", "형남길AS"
  const endASPatterns = [
    /AS$/i,           // 끝에 AS
    /AS\s*$/i,        // 끝에 AS + 공백
    /\s+AS$/i,        // 공백 + AS
    /a\/s$/i,         // 끝에 a/s
    /A\/S$/i,         // 끝에 A/S
    /\s+a\/s$/i,      // 공백 + a/s
    /\s+A\/S$/i,      // 공백 + A/S
  ];
  
  for (const pattern of endASPatterns) {
    if (pattern.test(baseName)) {
      baseName = baseName.replace(pattern, '').trim();
      hasAS = true;
      break;
    }
  }
  
  return { baseName, hasAS };
}

// notes에 AS 정보 추가
function addASToNotes(existingNotes, hasAS) {
  if (!hasAS) return existingNotes;
  
  const asNote = '[AS 방문]';
  
  if (existingNotes && existingNotes.trim()) {
    // 이미 AS 방문 정보가 있는지 확인
    if (existingNotes.includes('[AS 방문]') || existingNotes.includes('AS 방문')) {
      return existingNotes; // 이미 있으면 그대로
    }
    return `${existingNotes}\n${asNote}`;
  }
  
  return asNote;
}

async function fixASNames() {
  const dryRun = process.argv.includes('--dry-run');
  
  console.log('🔍 AS 포함 이름 정리 중...\n');
  if (dryRun) {
    console.log('⚠️  DRY RUN 모드: 실제 수정 없이 확인만 수행합니다.\n');
  }
  
  // 예약에서 AS 포함 이름 찾기 (페이지네이션)
  let allBookings = [];
  let from = 0;
  const pageSize = 1000;
  let hasMore = true;
  
  while (hasMore) {
    const { data: bookings, error: bookingError } = await supabase
      .from('bookings')
      .select('id, name, phone, email, date, notes, is_as_visit')
      .or('name.ilike.%AS%,name.ilike.%a/s%,name.ilike.%A/S%')
      .order('date', { ascending: true })
      .range(from, from + pageSize - 1);
    
    if (bookingError) {
      console.error('❌ 예약 조회 오류:', bookingError);
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
  
  // 고객에서 AS 포함 이름 찾기 (페이지네이션)
  let allCustomers = [];
  from = 0;
  hasMore = true;
  
  while (hasMore) {
    const { data: customers, error: customerError } = await supabase
      .from('customers')
      .select('id, name, phone, email')
      .or('name.ilike.%AS%,name.ilike.%a/s%,name.ilike.%A/S%')
      .order('created_at', { ascending: true })
      .range(from, from + pageSize - 1);
    
    if (customerError) {
      console.error('❌ 고객 조회 오류:', customerError);
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
  
  console.log(`📊 발견된 예약: ${allBookings.length}건`);
  console.log(`📊 발견된 고객: ${allCustomers.length}건\n`);
  
  const results = {
    bookings: { updated: [], skipped: [], errors: [] },
    customers: { updated: [], skipped: [], errors: [] },
  };
  
  // 예약 처리
  console.log('='.repeat(60));
  console.log('📊 예약 처리');
  console.log('='.repeat(60));
  
  for (const booking of allBookings) {
    const { baseName, hasAS } = removeASFromName(booking.name);
    
    if (!hasAS) {
      results.bookings.skipped.push({ id: booking.id, name: booking.name, reason: 'AS 패턴 없음' });
      continue;
    }
    
    if (baseName === booking.name) {
      results.bookings.skipped.push({ id: booking.id, name: booking.name, reason: '변경 없음' });
      continue;
    }
    
    console.log(`\n[예약 ID: ${booking.id}]`);
    console.log(`   현재 이름: "${booking.name}"`);
    console.log(`   변경 이름: "${baseName}"`);
    
    const newNotes = addASToNotes(booking.notes, hasAS);
    
    if (dryRun) {
      console.log(`   [DRY RUN] notes 업데이트: "${newNotes}"`);
      console.log(`   [DRY RUN] is_as_visit: true`);
      results.bookings.updated.push({ id: booking.id, oldName: booking.name, newName: baseName });
      continue;
    }
    
    try {
      const updateData = {
        name: baseName,
        is_as_visit: true,
      };
      
      if (newNotes !== booking.notes) {
        updateData.notes = newNotes;
      }
      
      const { error: updateError } = await supabase
        .from('bookings')
        .update(updateData)
        .eq('id', booking.id);
      
      if (updateError) {
        throw updateError;
      }
      
      console.log(`   ✅ 업데이트 완료`);
      results.bookings.updated.push({ id: booking.id, oldName: booking.name, newName: baseName });
    } catch (error) {
      console.error(`   ❌ 업데이트 실패:`, error.message);
      results.bookings.errors.push({ id: booking.id, name: booking.name, error: error.message });
    }
  }
  
  // 고객 처리
  console.log('\n' + '='.repeat(60));
  console.log('📊 고객 처리');
  console.log('='.repeat(60));
  
  for (const customer of allCustomers) {
    const { baseName, hasAS } = removeASFromName(customer.name);
    
    if (!hasAS) {
      results.customers.skipped.push({ id: customer.id, name: customer.name, reason: 'AS 패턴 없음' });
      continue;
    }
    
    if (baseName === customer.name) {
      results.customers.skipped.push({ id: customer.id, name: customer.name, reason: '변경 없음' });
      continue;
    }
    
    console.log(`\n[고객 ID: ${customer.id}]`);
    console.log(`   현재 이름: "${customer.name}"`);
    console.log(`   변경 이름: "${baseName}"`);
    
    if (dryRun) {
      console.log(`   [DRY RUN] 이름 업데이트`);
      results.customers.updated.push({ id: customer.id, oldName: customer.name, newName: baseName });
      continue;
    }
    
    try {
      const { error: updateError } = await supabase
        .from('customers')
        .update({ name: baseName })
        .eq('id', customer.id);
      
      if (updateError) {
        throw updateError;
      }
      
      console.log(`   ✅ 업데이트 완료`);
      results.customers.updated.push({ id: customer.id, oldName: customer.name, newName: baseName });
    } catch (error) {
      console.error(`   ❌ 업데이트 실패:`, error.message);
      results.customers.errors.push({ id: customer.id, name: customer.name, error: error.message });
    }
  }
  
  // 결과 요약
  console.log('\n' + '='.repeat(60));
  console.log('📊 처리 결과 요약');
  console.log('='.repeat(60));
  console.log(`\n✅ 예약 업데이트: ${results.bookings.updated.length}건`);
  console.log(`   ⚠️  건너뜀: ${results.bookings.skipped.length}건`);
  console.log(`   ❌ 오류: ${results.bookings.errors.length}건`);
  console.log(`\n✅ 고객 업데이트: ${results.customers.updated.length}건`);
  console.log(`   ⚠️  건너뜀: ${results.customers.skipped.length}건`);
  console.log(`   ❌ 오류: ${results.customers.errors.length}건`);
  
  if (results.bookings.updated.length > 0) {
    console.log(`\n📋 업데이트된 예약 (샘플 10건):`);
    results.bookings.updated.slice(0, 10).forEach((r, i) => {
      console.log(`   ${i + 1}. "${r.oldName}" → "${r.newName}"`);
    });
    if (results.bookings.updated.length > 10) {
      console.log(`   ... 외 ${results.bookings.updated.length - 10}건`);
    }
  }
  
  if (results.customers.updated.length > 0) {
    console.log(`\n📋 업데이트된 고객 (샘플 10건):`);
    results.customers.updated.slice(0, 10).forEach((r, i) => {
      console.log(`   ${i + 1}. "${r.oldName}" → "${r.newName}"`);
    });
    if (results.customers.updated.length > 10) {
      console.log(`   ... 외 ${results.customers.updated.length - 10}건`);
    }
  }
  
  if (dryRun) {
    console.log('\n💡 실제 수정을 하려면 --dry-run 옵션을 제거하고 다시 실행하세요.');
  } else {
    console.log('\n✅ 작업 완료!');
  }
}

fixASNames()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('\n❌ 작업 실패:', err);
    process.exit(1);
  });


 * 
 * 이름에 "AS", "a/s", "A/S"가 포함된 경우:
 * 1. 이름에서 AS 제거
 * 2. notes에 "AS 방문" 정보 추가
 * 3. is_as_visit 플래그 설정
 * 
 * 사용법:
 * node scripts/fix-as-names.js [--dry-run]
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

// 이름에서 AS 제거하고 기본 이름 추출
function removeASFromName(name) {
  if (!name) return { baseName: name, hasAS: false };
  
  let baseName = name.trim();
  let hasAS = false;
  
  // 1. 앞에 AS가 있는 경우: "AS김용율", "A/S 노태율"
  const frontASPatterns = [
    /^AS\s*/i,        // 앞에 AS + 공백
    /^A\/S\s*/i,      // 앞에 A/S + 공백
    /^a\/s\s*/i,      // 앞에 a/s + 공백
  ];
  
  for (const pattern of frontASPatterns) {
    if (pattern.test(baseName)) {
      baseName = baseName.replace(pattern, '').trim();
      hasAS = true;
      break;
    }
  }
  
  // 2. 중간에 AS가 있는 경우: "이태성 AS 찾으러옴", "정윤호A/S 방문", "이동열 방문AS 시타채수거"
  // AS/A/S 뒤의 모든 내용 제거
  const middleASPatterns = [
    /\s+AS\s+.*$/i,        // 공백 + AS + 공백 + 추가 정보
    /\s+A\/S\s+.*$/i,      // 공백 + A/S + 공백 + 추가 정보
    /\s+a\/s\s+.*$/i,      // 공백 + a/s + 공백 + 추가 정보
    /A\/S\s+.*$/i,         // A/S + 공백 + 추가 정보 (공백 없이 붙어있는 경우)
    /a\/s\s+.*$/i,         // a/s + 공백 + 추가 정보
    /\s+AS\s+.*$/i,        // 공백 + AS + 공백 + 추가 정보
    /방문AS\s+.*$/i,       // "방문AS 시타채수거" 같은 경우
    /AS\s+.*$/i,           // AS + 공백 + 추가 정보 (공백 없이 붙어있는 경우)
  ];
  
  for (const pattern of middleASPatterns) {
    if (pattern.test(baseName)) {
      baseName = baseName.replace(pattern, '').trim();
      hasAS = true;
      break;
    }
  }
  
  // 3. 이름 중간에 AS가 붙어있는 경우: "정윤호A/S 방문" -> "정윤호"
  // 한글 + AS/A/S + 공백 + 추가 정보 패턴
  const attachedASPatterns = [
    /([가-힣]+)A\/S\s+.*$/i,  // 한글 + A/S + 공백 + 추가 정보
    /([가-힣]+)a\/s\s+.*$/i,  // 한글 + a/s + 공백 + 추가 정보
    /([가-힣]+)AS\s+.*$/i,    // 한글 + AS + 공백 + 추가 정보
  ];
  
  for (const pattern of attachedASPatterns) {
    const match = baseName.match(pattern);
    if (match) {
      baseName = match[1].trim(); // 한글 부분만 추출
      hasAS = true;
      break;
    }
  }
  
  // 3. 끝에 AS가 있는 경우: "김인섭AS", "형남길AS"
  const endASPatterns = [
    /AS$/i,           // 끝에 AS
    /AS\s*$/i,        // 끝에 AS + 공백
    /\s+AS$/i,        // 공백 + AS
    /a\/s$/i,         // 끝에 a/s
    /A\/S$/i,         // 끝에 A/S
    /\s+a\/s$/i,      // 공백 + a/s
    /\s+A\/S$/i,      // 공백 + A/S
  ];
  
  for (const pattern of endASPatterns) {
    if (pattern.test(baseName)) {
      baseName = baseName.replace(pattern, '').trim();
      hasAS = true;
      break;
    }
  }
  
  return { baseName, hasAS };
}

// notes에 AS 정보 추가
function addASToNotes(existingNotes, hasAS) {
  if (!hasAS) return existingNotes;
  
  const asNote = '[AS 방문]';
  
  if (existingNotes && existingNotes.trim()) {
    // 이미 AS 방문 정보가 있는지 확인
    if (existingNotes.includes('[AS 방문]') || existingNotes.includes('AS 방문')) {
      return existingNotes; // 이미 있으면 그대로
    }
    return `${existingNotes}\n${asNote}`;
  }
  
  return asNote;
}

async function fixASNames() {
  const dryRun = process.argv.includes('--dry-run');
  
  console.log('🔍 AS 포함 이름 정리 중...\n');
  if (dryRun) {
    console.log('⚠️  DRY RUN 모드: 실제 수정 없이 확인만 수행합니다.\n');
  }
  
  // 예약에서 AS 포함 이름 찾기 (페이지네이션)
  let allBookings = [];
  let from = 0;
  const pageSize = 1000;
  let hasMore = true;
  
  while (hasMore) {
    const { data: bookings, error: bookingError } = await supabase
      .from('bookings')
      .select('id, name, phone, email, date, notes, is_as_visit')
      .or('name.ilike.%AS%,name.ilike.%a/s%,name.ilike.%A/S%')
      .order('date', { ascending: true })
      .range(from, from + pageSize - 1);
    
    if (bookingError) {
      console.error('❌ 예약 조회 오류:', bookingError);
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
  
  // 고객에서 AS 포함 이름 찾기 (페이지네이션)
  let allCustomers = [];
  from = 0;
  hasMore = true;
  
  while (hasMore) {
    const { data: customers, error: customerError } = await supabase
      .from('customers')
      .select('id, name, phone, email')
      .or('name.ilike.%AS%,name.ilike.%a/s%,name.ilike.%A/S%')
      .order('created_at', { ascending: true })
      .range(from, from + pageSize - 1);
    
    if (customerError) {
      console.error('❌ 고객 조회 오류:', customerError);
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
  
  console.log(`📊 발견된 예약: ${allBookings.length}건`);
  console.log(`📊 발견된 고객: ${allCustomers.length}건\n`);
  
  const results = {
    bookings: { updated: [], skipped: [], errors: [] },
    customers: { updated: [], skipped: [], errors: [] },
  };
  
  // 예약 처리
  console.log('='.repeat(60));
  console.log('📊 예약 처리');
  console.log('='.repeat(60));
  
  for (const booking of allBookings) {
    const { baseName, hasAS } = removeASFromName(booking.name);
    
    if (!hasAS) {
      results.bookings.skipped.push({ id: booking.id, name: booking.name, reason: 'AS 패턴 없음' });
      continue;
    }
    
    if (baseName === booking.name) {
      results.bookings.skipped.push({ id: booking.id, name: booking.name, reason: '변경 없음' });
      continue;
    }
    
    console.log(`\n[예약 ID: ${booking.id}]`);
    console.log(`   현재 이름: "${booking.name}"`);
    console.log(`   변경 이름: "${baseName}"`);
    
    const newNotes = addASToNotes(booking.notes, hasAS);
    
    if (dryRun) {
      console.log(`   [DRY RUN] notes 업데이트: "${newNotes}"`);
      console.log(`   [DRY RUN] is_as_visit: true`);
      results.bookings.updated.push({ id: booking.id, oldName: booking.name, newName: baseName });
      continue;
    }
    
    try {
      const updateData = {
        name: baseName,
        is_as_visit: true,
      };
      
      if (newNotes !== booking.notes) {
        updateData.notes = newNotes;
      }
      
      const { error: updateError } = await supabase
        .from('bookings')
        .update(updateData)
        .eq('id', booking.id);
      
      if (updateError) {
        throw updateError;
      }
      
      console.log(`   ✅ 업데이트 완료`);
      results.bookings.updated.push({ id: booking.id, oldName: booking.name, newName: baseName });
    } catch (error) {
      console.error(`   ❌ 업데이트 실패:`, error.message);
      results.bookings.errors.push({ id: booking.id, name: booking.name, error: error.message });
    }
  }
  
  // 고객 처리
  console.log('\n' + '='.repeat(60));
  console.log('📊 고객 처리');
  console.log('='.repeat(60));
  
  for (const customer of allCustomers) {
    const { baseName, hasAS } = removeASFromName(customer.name);
    
    if (!hasAS) {
      results.customers.skipped.push({ id: customer.id, name: customer.name, reason: 'AS 패턴 없음' });
      continue;
    }
    
    if (baseName === customer.name) {
      results.customers.skipped.push({ id: customer.id, name: customer.name, reason: '변경 없음' });
      continue;
    }
    
    console.log(`\n[고객 ID: ${customer.id}]`);
    console.log(`   현재 이름: "${customer.name}"`);
    console.log(`   변경 이름: "${baseName}"`);
    
    if (dryRun) {
      console.log(`   [DRY RUN] 이름 업데이트`);
      results.customers.updated.push({ id: customer.id, oldName: customer.name, newName: baseName });
      continue;
    }
    
    try {
      const { error: updateError } = await supabase
        .from('customers')
        .update({ name: baseName })
        .eq('id', customer.id);
      
      if (updateError) {
        throw updateError;
      }
      
      console.log(`   ✅ 업데이트 완료`);
      results.customers.updated.push({ id: customer.id, oldName: customer.name, newName: baseName });
    } catch (error) {
      console.error(`   ❌ 업데이트 실패:`, error.message);
      results.customers.errors.push({ id: customer.id, name: customer.name, error: error.message });
    }
  }
  
  // 결과 요약
  console.log('\n' + '='.repeat(60));
  console.log('📊 처리 결과 요약');
  console.log('='.repeat(60));
  console.log(`\n✅ 예약 업데이트: ${results.bookings.updated.length}건`);
  console.log(`   ⚠️  건너뜀: ${results.bookings.skipped.length}건`);
  console.log(`   ❌ 오류: ${results.bookings.errors.length}건`);
  console.log(`\n✅ 고객 업데이트: ${results.customers.updated.length}건`);
  console.log(`   ⚠️  건너뜀: ${results.customers.skipped.length}건`);
  console.log(`   ❌ 오류: ${results.customers.errors.length}건`);
  
  if (results.bookings.updated.length > 0) {
    console.log(`\n📋 업데이트된 예약 (샘플 10건):`);
    results.bookings.updated.slice(0, 10).forEach((r, i) => {
      console.log(`   ${i + 1}. "${r.oldName}" → "${r.newName}"`);
    });
    if (results.bookings.updated.length > 10) {
      console.log(`   ... 외 ${results.bookings.updated.length - 10}건`);
    }
  }
  
  if (results.customers.updated.length > 0) {
    console.log(`\n📋 업데이트된 고객 (샘플 10건):`);
    results.customers.updated.slice(0, 10).forEach((r, i) => {
      console.log(`   ${i + 1}. "${r.oldName}" → "${r.newName}"`);
    });
    if (results.customers.updated.length > 10) {
      console.log(`   ... 외 ${results.customers.updated.length - 10}건`);
    }
  }
  
  if (dryRun) {
    console.log('\n💡 실제 수정을 하려면 --dry-run 옵션을 제거하고 다시 실행하세요.');
  } else {
    console.log('\n✅ 작업 완료!');
  }
}

fixASNames()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('\n❌ 작업 실패:', err);
    process.exit(1);
  });


 * 
 * 이름에 "AS", "a/s", "A/S"가 포함된 경우:
 * 1. 이름에서 AS 제거
 * 2. notes에 "AS 방문" 정보 추가
 * 3. is_as_visit 플래그 설정
 * 
 * 사용법:
 * node scripts/fix-as-names.js [--dry-run]
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

// 이름에서 AS 제거하고 기본 이름 추출
function removeASFromName(name) {
  if (!name) return { baseName: name, hasAS: false };
  
  let baseName = name.trim();
  let hasAS = false;
  
  // 1. 앞에 AS가 있는 경우: "AS김용율", "A/S 노태율"
  const frontASPatterns = [
    /^AS\s*/i,        // 앞에 AS + 공백
    /^A\/S\s*/i,      // 앞에 A/S + 공백
    /^a\/s\s*/i,      // 앞에 a/s + 공백
  ];
  
  for (const pattern of frontASPatterns) {
    if (pattern.test(baseName)) {
      baseName = baseName.replace(pattern, '').trim();
      hasAS = true;
      break;
    }
  }
  
  // 2. 중간에 AS가 있는 경우: "이태성 AS 찾으러옴", "정윤호A/S 방문", "이동열 방문AS 시타채수거"
  // AS/A/S 뒤의 모든 내용 제거
  const middleASPatterns = [
    /\s+AS\s+.*$/i,        // 공백 + AS + 공백 + 추가 정보
    /\s+A\/S\s+.*$/i,      // 공백 + A/S + 공백 + 추가 정보
    /\s+a\/s\s+.*$/i,      // 공백 + a/s + 공백 + 추가 정보
    /A\/S\s+.*$/i,         // A/S + 공백 + 추가 정보 (공백 없이 붙어있는 경우)
    /a\/s\s+.*$/i,         // a/s + 공백 + 추가 정보
    /\s+AS\s+.*$/i,        // 공백 + AS + 공백 + 추가 정보
    /방문AS\s+.*$/i,       // "방문AS 시타채수거" 같은 경우
    /AS\s+.*$/i,           // AS + 공백 + 추가 정보 (공백 없이 붙어있는 경우)
  ];
  
  for (const pattern of middleASPatterns) {
    if (pattern.test(baseName)) {
      baseName = baseName.replace(pattern, '').trim();
      hasAS = true;
      break;
    }
  }
  
  // 3. 이름 중간에 AS가 붙어있는 경우: "정윤호A/S 방문" -> "정윤호"
  // 한글 + AS/A/S + 공백 + 추가 정보 패턴
  const attachedASPatterns = [
    /([가-힣]+)A\/S\s+.*$/i,  // 한글 + A/S + 공백 + 추가 정보
    /([가-힣]+)a\/s\s+.*$/i,  // 한글 + a/s + 공백 + 추가 정보
    /([가-힣]+)AS\s+.*$/i,    // 한글 + AS + 공백 + 추가 정보
  ];
  
  for (const pattern of attachedASPatterns) {
    const match = baseName.match(pattern);
    if (match) {
      baseName = match[1].trim(); // 한글 부분만 추출
      hasAS = true;
      break;
    }
  }
  
  // 3. 끝에 AS가 있는 경우: "김인섭AS", "형남길AS"
  const endASPatterns = [
    /AS$/i,           // 끝에 AS
    /AS\s*$/i,        // 끝에 AS + 공백
    /\s+AS$/i,        // 공백 + AS
    /a\/s$/i,         // 끝에 a/s
    /A\/S$/i,         // 끝에 A/S
    /\s+a\/s$/i,      // 공백 + a/s
    /\s+A\/S$/i,      // 공백 + A/S
  ];
  
  for (const pattern of endASPatterns) {
    if (pattern.test(baseName)) {
      baseName = baseName.replace(pattern, '').trim();
      hasAS = true;
      break;
    }
  }
  
  return { baseName, hasAS };
}

// notes에 AS 정보 추가
function addASToNotes(existingNotes, hasAS) {
  if (!hasAS) return existingNotes;
  
  const asNote = '[AS 방문]';
  
  if (existingNotes && existingNotes.trim()) {
    // 이미 AS 방문 정보가 있는지 확인
    if (existingNotes.includes('[AS 방문]') || existingNotes.includes('AS 방문')) {
      return existingNotes; // 이미 있으면 그대로
    }
    return `${existingNotes}\n${asNote}`;
  }
  
  return asNote;
}

async function fixASNames() {
  const dryRun = process.argv.includes('--dry-run');
  
  console.log('🔍 AS 포함 이름 정리 중...\n');
  if (dryRun) {
    console.log('⚠️  DRY RUN 모드: 실제 수정 없이 확인만 수행합니다.\n');
  }
  
  // 예약에서 AS 포함 이름 찾기 (페이지네이션)
  let allBookings = [];
  let from = 0;
  const pageSize = 1000;
  let hasMore = true;
  
  while (hasMore) {
    const { data: bookings, error: bookingError } = await supabase
      .from('bookings')
      .select('id, name, phone, email, date, notes, is_as_visit')
      .or('name.ilike.%AS%,name.ilike.%a/s%,name.ilike.%A/S%')
      .order('date', { ascending: true })
      .range(from, from + pageSize - 1);
    
    if (bookingError) {
      console.error('❌ 예약 조회 오류:', bookingError);
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
  
  // 고객에서 AS 포함 이름 찾기 (페이지네이션)
  let allCustomers = [];
  from = 0;
  hasMore = true;
  
  while (hasMore) {
    const { data: customers, error: customerError } = await supabase
      .from('customers')
      .select('id, name, phone, email')
      .or('name.ilike.%AS%,name.ilike.%a/s%,name.ilike.%A/S%')
      .order('created_at', { ascending: true })
      .range(from, from + pageSize - 1);
    
    if (customerError) {
      console.error('❌ 고객 조회 오류:', customerError);
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
  
  console.log(`📊 발견된 예약: ${allBookings.length}건`);
  console.log(`📊 발견된 고객: ${allCustomers.length}건\n`);
  
  const results = {
    bookings: { updated: [], skipped: [], errors: [] },
    customers: { updated: [], skipped: [], errors: [] },
  };
  
  // 예약 처리
  console.log('='.repeat(60));
  console.log('📊 예약 처리');
  console.log('='.repeat(60));
  
  for (const booking of allBookings) {
    const { baseName, hasAS } = removeASFromName(booking.name);
    
    if (!hasAS) {
      results.bookings.skipped.push({ id: booking.id, name: booking.name, reason: 'AS 패턴 없음' });
      continue;
    }
    
    if (baseName === booking.name) {
      results.bookings.skipped.push({ id: booking.id, name: booking.name, reason: '변경 없음' });
      continue;
    }
    
    console.log(`\n[예약 ID: ${booking.id}]`);
    console.log(`   현재 이름: "${booking.name}"`);
    console.log(`   변경 이름: "${baseName}"`);
    
    const newNotes = addASToNotes(booking.notes, hasAS);
    
    if (dryRun) {
      console.log(`   [DRY RUN] notes 업데이트: "${newNotes}"`);
      console.log(`   [DRY RUN] is_as_visit: true`);
      results.bookings.updated.push({ id: booking.id, oldName: booking.name, newName: baseName });
      continue;
    }
    
    try {
      const updateData = {
        name: baseName,
        is_as_visit: true,
      };
      
      if (newNotes !== booking.notes) {
        updateData.notes = newNotes;
      }
      
      const { error: updateError } = await supabase
        .from('bookings')
        .update(updateData)
        .eq('id', booking.id);
      
      if (updateError) {
        throw updateError;
      }
      
      console.log(`   ✅ 업데이트 완료`);
      results.bookings.updated.push({ id: booking.id, oldName: booking.name, newName: baseName });
    } catch (error) {
      console.error(`   ❌ 업데이트 실패:`, error.message);
      results.bookings.errors.push({ id: booking.id, name: booking.name, error: error.message });
    }
  }
  
  // 고객 처리
  console.log('\n' + '='.repeat(60));
  console.log('📊 고객 처리');
  console.log('='.repeat(60));
  
  for (const customer of allCustomers) {
    const { baseName, hasAS } = removeASFromName(customer.name);
    
    if (!hasAS) {
      results.customers.skipped.push({ id: customer.id, name: customer.name, reason: 'AS 패턴 없음' });
      continue;
    }
    
    if (baseName === customer.name) {
      results.customers.skipped.push({ id: customer.id, name: customer.name, reason: '변경 없음' });
      continue;
    }
    
    console.log(`\n[고객 ID: ${customer.id}]`);
    console.log(`   현재 이름: "${customer.name}"`);
    console.log(`   변경 이름: "${baseName}"`);
    
    if (dryRun) {
      console.log(`   [DRY RUN] 이름 업데이트`);
      results.customers.updated.push({ id: customer.id, oldName: customer.name, newName: baseName });
      continue;
    }
    
    try {
      const { error: updateError } = await supabase
        .from('customers')
        .update({ name: baseName })
        .eq('id', customer.id);
      
      if (updateError) {
        throw updateError;
      }
      
      console.log(`   ✅ 업데이트 완료`);
      results.customers.updated.push({ id: customer.id, oldName: customer.name, newName: baseName });
    } catch (error) {
      console.error(`   ❌ 업데이트 실패:`, error.message);
      results.customers.errors.push({ id: customer.id, name: customer.name, error: error.message });
    }
  }
  
  // 결과 요약
  console.log('\n' + '='.repeat(60));
  console.log('📊 처리 결과 요약');
  console.log('='.repeat(60));
  console.log(`\n✅ 예약 업데이트: ${results.bookings.updated.length}건`);
  console.log(`   ⚠️  건너뜀: ${results.bookings.skipped.length}건`);
  console.log(`   ❌ 오류: ${results.bookings.errors.length}건`);
  console.log(`\n✅ 고객 업데이트: ${results.customers.updated.length}건`);
  console.log(`   ⚠️  건너뜀: ${results.customers.skipped.length}건`);
  console.log(`   ❌ 오류: ${results.customers.errors.length}건`);
  
  if (results.bookings.updated.length > 0) {
    console.log(`\n📋 업데이트된 예약 (샘플 10건):`);
    results.bookings.updated.slice(0, 10).forEach((r, i) => {
      console.log(`   ${i + 1}. "${r.oldName}" → "${r.newName}"`);
    });
    if (results.bookings.updated.length > 10) {
      console.log(`   ... 외 ${results.bookings.updated.length - 10}건`);
    }
  }
  
  if (results.customers.updated.length > 0) {
    console.log(`\n📋 업데이트된 고객 (샘플 10건):`);
    results.customers.updated.slice(0, 10).forEach((r, i) => {
      console.log(`   ${i + 1}. "${r.oldName}" → "${r.newName}"`);
    });
    if (results.customers.updated.length > 10) {
      console.log(`   ... 외 ${results.customers.updated.length - 10}건`);
    }
  }
  
  if (dryRun) {
    console.log('\n💡 실제 수정을 하려면 --dry-run 옵션을 제거하고 다시 실행하세요.');
  } else {
    console.log('\n✅ 작업 완료!');
  }
}

fixASNames()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('\n❌ 작업 실패:', err);
    process.exit(1);
  });

