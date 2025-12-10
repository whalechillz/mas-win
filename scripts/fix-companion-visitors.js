/**
 * 동반 방문자 처리 스크립트
 * 
 * 이름에 "(여자)", "(여자손님 모시고 옴)", "(2인)" 등이 포함된 예약을 처리
 * 
 * 처리 규칙:
 * 1. 이름에서 괄호 부분 제거하여 기본 이름으로 정규화
 * 2. notes 필드에 동반 방문자 정보 추가
 * 3. 같은 전화번호를 가진 고객의 visit_count 업데이트
 * 4. 두 예약 모두 유지 (다른 날짜이므로 중복 아님)
 * 
 * 사용법:
 * node scripts/fix-companion-visitors.js [--dry-run]
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

// 이름에서 동반 방문자 정보 추출
function parseCompanionInfo(name) {
  if (!name) return { baseName: name, companionInfo: null };
  
  // (여자), (여자손님 모시고 옴), (2인), (외1) 등 패턴 찾기
  const match = name.match(/^(.+?)(\([^)]+\))$/);
  if (match) {
    return {
      baseName: match[1].trim(),
      companionInfo: match[2] // (여자), (여자손님 모시고 옴) 등
    };
  }
  
  return { baseName: name, companionInfo: null };
}

// 동반 방문자 정보를 notes에 추가
function formatCompanionNote(companionInfo, existingNotes) {
  const companionText = companionInfo
    .replace(/[()]/g, '') // 괄호 제거
    .trim();
  
  let noteText = '';
  if (companionText.includes('여자')) {
    noteText = '여자 동반 방문';
  } else if (companionText.includes('2인') || companionText.includes('외1')) {
    noteText = '2인 동반 방문';
  } else {
    noteText = `${companionText} 동반 방문`;
  }
  
  if (existingNotes && existingNotes.trim()) {
    return `${existingNotes}\n[${noteText}]`;
  }
  
  return `[${noteText}]`;
}

async function fixCompanionVisitors() {
  const dryRun = process.argv.includes('--dry-run');
  
  console.log('🔍 동반 방문자 패턴 찾기...\n');
  if (dryRun) {
    console.log('⚠️  DRY RUN 모드: 실제 수정 없이 확인만 수행합니다.\n');
  }
  
  // 모든 예약 데이터 가져오기
  let allBookings = [];
  let from = 0;
  const pageSize = 1000;
  let hasMore = true;
  
  while (hasMore) {
    const { data: bookingsData, error } = await supabase
      .from('bookings')
      .select('*')
      .range(from, from + pageSize - 1);
    
    if (error) {
      console.error('❌ 데이터 로드 오류:', error);
      break;
    }
    
    if (bookingsData && bookingsData.length > 0) {
      allBookings = [...allBookings, ...bookingsData];
      from += pageSize;
      hasMore = bookingsData.length === pageSize;
    } else {
      hasMore = false;
    }
  }
  
  console.log(`✅ 총 ${allBookings.length}건 로드 완료\n`);
  
  // 동반 방문자 패턴 찾기
  const companionBookings = [];
  
  for (const booking of allBookings) {
    if (!booking.name) continue;
    
    const { baseName, companionInfo } = parseCompanionInfo(booking.name);
    
    if (companionInfo) {
      companionBookings.push({
        booking,
        baseName,
        companionInfo,
      });
    }
  }
  
  console.log(`📋 동반 방문자 패턴 발견: ${companionBookings.length}건\n`);
  
  if (companionBookings.length === 0) {
    console.log('✅ 처리할 동반 방문자 패턴이 없습니다.\n');
    return;
  }
  
  // 처리 결과
  const results = {
    updated: [],
    errors: [],
  };
  
  // 각 동반 방문자 예약 처리
  for (const { booking, baseName, companionInfo } of companionBookings) {
    try {
      console.log(`[${booking.id}] 처리 중: "${booking.name}" → "${baseName}"`);
      console.log(`   전화번호: ${booking.phone}, 날짜: ${booking.date}`);
      console.log(`   동반 정보: ${companionInfo}`);
      
      // notes에 동반 방문자 정보 추가
      const newNotes = formatCompanionNote(companionInfo, booking.notes);
      
      // 방문 횟수 계산 (dry-run 모드에서도 표시하기 위해)
      const { data: customerBookings } = await supabase
        .from('bookings')
        .select('id')
        .eq('phone', booking.phone);
      
      const visitCount = customerBookings?.length || 0;
      
      if (!dryRun) {
        // 이름 업데이트
        const { error: updateError } = await supabase
          .from('bookings')
          .update({
            name: baseName,
            notes: newNotes,
          })
          .eq('id', booking.id);
        
        if (updateError) {
          throw updateError;
        }
        
        // customers 테이블 업데이트
        const { data: existingCustomer } = await supabase
          .from('customers')
          .select('id')
          .eq('phone', booking.phone)
          .single();
        
        if (existingCustomer) {
          await supabase
            .from('customers')
            .update({ visit_count: visitCount })
            .eq('id', existingCustomer.id);
        } else {
          // 고객이 없으면 생성
          await supabase
            .from('customers')
            .insert({
              name: baseName,
              phone: booking.phone,
              email: booking.email || null,
              visit_count: visitCount,
            });
        }
        
        // 고객 이름도 업데이트 (더 정확한 이름으로)
        await supabase
          .from('customers')
          .update({ name: baseName })
          .eq('phone', booking.phone);
      }
      
      results.updated.push({
        id: booking.id,
        originalName: booking.name,
        newName: baseName,
        companionInfo,
        notes: newNotes,
      });
      
      console.log(`   ✅ 처리 완료: "${baseName}" (방문 ${visitCount}회)`);
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
    console.log('\n📋 처리된 예약:');
    results.updated.forEach((r, i) => {
      console.log(`   ${i + 1}. "${r.originalName}" → "${r.newName}"`);
      console.log(`      동반 정보: ${r.companionInfo}`);
    });
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
  }
}

fixCompanionVisitors()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('\n❌ 작업 실패:', err);
    process.exit(1);
  });


 * 
 * 이름에 "(여자)", "(여자손님 모시고 옴)", "(2인)" 등이 포함된 예약을 처리
 * 
 * 처리 규칙:
 * 1. 이름에서 괄호 부분 제거하여 기본 이름으로 정규화
 * 2. notes 필드에 동반 방문자 정보 추가
 * 3. 같은 전화번호를 가진 고객의 visit_count 업데이트
 * 4. 두 예약 모두 유지 (다른 날짜이므로 중복 아님)
 * 
 * 사용법:
 * node scripts/fix-companion-visitors.js [--dry-run]
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

// 이름에서 동반 방문자 정보 추출
function parseCompanionInfo(name) {
  if (!name) return { baseName: name, companionInfo: null };
  
  // (여자), (여자손님 모시고 옴), (2인), (외1) 등 패턴 찾기
  const match = name.match(/^(.+?)(\([^)]+\))$/);
  if (match) {
    return {
      baseName: match[1].trim(),
      companionInfo: match[2] // (여자), (여자손님 모시고 옴) 등
    };
  }
  
  return { baseName: name, companionInfo: null };
}

// 동반 방문자 정보를 notes에 추가
function formatCompanionNote(companionInfo, existingNotes) {
  const companionText = companionInfo
    .replace(/[()]/g, '') // 괄호 제거
    .trim();
  
  let noteText = '';
  if (companionText.includes('여자')) {
    noteText = '여자 동반 방문';
  } else if (companionText.includes('2인') || companionText.includes('외1')) {
    noteText = '2인 동반 방문';
  } else {
    noteText = `${companionText} 동반 방문`;
  }
  
  if (existingNotes && existingNotes.trim()) {
    return `${existingNotes}\n[${noteText}]`;
  }
  
  return `[${noteText}]`;
}

async function fixCompanionVisitors() {
  const dryRun = process.argv.includes('--dry-run');
  
  console.log('🔍 동반 방문자 패턴 찾기...\n');
  if (dryRun) {
    console.log('⚠️  DRY RUN 모드: 실제 수정 없이 확인만 수행합니다.\n');
  }
  
  // 모든 예약 데이터 가져오기
  let allBookings = [];
  let from = 0;
  const pageSize = 1000;
  let hasMore = true;
  
  while (hasMore) {
    const { data: bookingsData, error } = await supabase
      .from('bookings')
      .select('*')
      .range(from, from + pageSize - 1);
    
    if (error) {
      console.error('❌ 데이터 로드 오류:', error);
      break;
    }
    
    if (bookingsData && bookingsData.length > 0) {
      allBookings = [...allBookings, ...bookingsData];
      from += pageSize;
      hasMore = bookingsData.length === pageSize;
    } else {
      hasMore = false;
    }
  }
  
  console.log(`✅ 총 ${allBookings.length}건 로드 완료\n`);
  
  // 동반 방문자 패턴 찾기
  const companionBookings = [];
  
  for (const booking of allBookings) {
    if (!booking.name) continue;
    
    const { baseName, companionInfo } = parseCompanionInfo(booking.name);
    
    if (companionInfo) {
      companionBookings.push({
        booking,
        baseName,
        companionInfo,
      });
    }
  }
  
  console.log(`📋 동반 방문자 패턴 발견: ${companionBookings.length}건\n`);
  
  if (companionBookings.length === 0) {
    console.log('✅ 처리할 동반 방문자 패턴이 없습니다.\n');
    return;
  }
  
  // 처리 결과
  const results = {
    updated: [],
    errors: [],
  };
  
  // 각 동반 방문자 예약 처리
  for (const { booking, baseName, companionInfo } of companionBookings) {
    try {
      console.log(`[${booking.id}] 처리 중: "${booking.name}" → "${baseName}"`);
      console.log(`   전화번호: ${booking.phone}, 날짜: ${booking.date}`);
      console.log(`   동반 정보: ${companionInfo}`);
      
      // notes에 동반 방문자 정보 추가
      const newNotes = formatCompanionNote(companionInfo, booking.notes);
      
      // 방문 횟수 계산 (dry-run 모드에서도 표시하기 위해)
      const { data: customerBookings } = await supabase
        .from('bookings')
        .select('id')
        .eq('phone', booking.phone);
      
      const visitCount = customerBookings?.length || 0;
      
      if (!dryRun) {
        // 이름 업데이트
        const { error: updateError } = await supabase
          .from('bookings')
          .update({
            name: baseName,
            notes: newNotes,
          })
          .eq('id', booking.id);
        
        if (updateError) {
          throw updateError;
        }
        
        // customers 테이블 업데이트
        const { data: existingCustomer } = await supabase
          .from('customers')
          .select('id')
          .eq('phone', booking.phone)
          .single();
        
        if (existingCustomer) {
          await supabase
            .from('customers')
            .update({ visit_count: visitCount })
            .eq('id', existingCustomer.id);
        } else {
          // 고객이 없으면 생성
          await supabase
            .from('customers')
            .insert({
              name: baseName,
              phone: booking.phone,
              email: booking.email || null,
              visit_count: visitCount,
            });
        }
        
        // 고객 이름도 업데이트 (더 정확한 이름으로)
        await supabase
          .from('customers')
          .update({ name: baseName })
          .eq('phone', booking.phone);
      }
      
      results.updated.push({
        id: booking.id,
        originalName: booking.name,
        newName: baseName,
        companionInfo,
        notes: newNotes,
      });
      
      console.log(`   ✅ 처리 완료: "${baseName}" (방문 ${visitCount}회)`);
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
    console.log('\n📋 처리된 예약:');
    results.updated.forEach((r, i) => {
      console.log(`   ${i + 1}. "${r.originalName}" → "${r.newName}"`);
      console.log(`      동반 정보: ${r.companionInfo}`);
    });
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
  }
}

fixCompanionVisitors()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('\n❌ 작업 실패:', err);
    process.exit(1);
  });


 * 
 * 이름에 "(여자)", "(여자손님 모시고 옴)", "(2인)" 등이 포함된 예약을 처리
 * 
 * 처리 규칙:
 * 1. 이름에서 괄호 부분 제거하여 기본 이름으로 정규화
 * 2. notes 필드에 동반 방문자 정보 추가
 * 3. 같은 전화번호를 가진 고객의 visit_count 업데이트
 * 4. 두 예약 모두 유지 (다른 날짜이므로 중복 아님)
 * 
 * 사용법:
 * node scripts/fix-companion-visitors.js [--dry-run]
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

// 이름에서 동반 방문자 정보 추출
function parseCompanionInfo(name) {
  if (!name) return { baseName: name, companionInfo: null };
  
  // (여자), (여자손님 모시고 옴), (2인), (외1) 등 패턴 찾기
  const match = name.match(/^(.+?)(\([^)]+\))$/);
  if (match) {
    return {
      baseName: match[1].trim(),
      companionInfo: match[2] // (여자), (여자손님 모시고 옴) 등
    };
  }
  
  return { baseName: name, companionInfo: null };
}

// 동반 방문자 정보를 notes에 추가
function formatCompanionNote(companionInfo, existingNotes) {
  const companionText = companionInfo
    .replace(/[()]/g, '') // 괄호 제거
    .trim();
  
  let noteText = '';
  if (companionText.includes('여자')) {
    noteText = '여자 동반 방문';
  } else if (companionText.includes('2인') || companionText.includes('외1')) {
    noteText = '2인 동반 방문';
  } else {
    noteText = `${companionText} 동반 방문`;
  }
  
  if (existingNotes && existingNotes.trim()) {
    return `${existingNotes}\n[${noteText}]`;
  }
  
  return `[${noteText}]`;
}

async function fixCompanionVisitors() {
  const dryRun = process.argv.includes('--dry-run');
  
  console.log('🔍 동반 방문자 패턴 찾기...\n');
  if (dryRun) {
    console.log('⚠️  DRY RUN 모드: 실제 수정 없이 확인만 수행합니다.\n');
  }
  
  // 모든 예약 데이터 가져오기
  let allBookings = [];
  let from = 0;
  const pageSize = 1000;
  let hasMore = true;
  
  while (hasMore) {
    const { data: bookingsData, error } = await supabase
      .from('bookings')
      .select('*')
      .range(from, from + pageSize - 1);
    
    if (error) {
      console.error('❌ 데이터 로드 오류:', error);
      break;
    }
    
    if (bookingsData && bookingsData.length > 0) {
      allBookings = [...allBookings, ...bookingsData];
      from += pageSize;
      hasMore = bookingsData.length === pageSize;
    } else {
      hasMore = false;
    }
  }
  
  console.log(`✅ 총 ${allBookings.length}건 로드 완료\n`);
  
  // 동반 방문자 패턴 찾기
  const companionBookings = [];
  
  for (const booking of allBookings) {
    if (!booking.name) continue;
    
    const { baseName, companionInfo } = parseCompanionInfo(booking.name);
    
    if (companionInfo) {
      companionBookings.push({
        booking,
        baseName,
        companionInfo,
      });
    }
  }
  
  console.log(`📋 동반 방문자 패턴 발견: ${companionBookings.length}건\n`);
  
  if (companionBookings.length === 0) {
    console.log('✅ 처리할 동반 방문자 패턴이 없습니다.\n');
    return;
  }
  
  // 처리 결과
  const results = {
    updated: [],
    errors: [],
  };
  
  // 각 동반 방문자 예약 처리
  for (const { booking, baseName, companionInfo } of companionBookings) {
    try {
      console.log(`[${booking.id}] 처리 중: "${booking.name}" → "${baseName}"`);
      console.log(`   전화번호: ${booking.phone}, 날짜: ${booking.date}`);
      console.log(`   동반 정보: ${companionInfo}`);
      
      // notes에 동반 방문자 정보 추가
      const newNotes = formatCompanionNote(companionInfo, booking.notes);
      
      // 방문 횟수 계산 (dry-run 모드에서도 표시하기 위해)
      const { data: customerBookings } = await supabase
        .from('bookings')
        .select('id')
        .eq('phone', booking.phone);
      
      const visitCount = customerBookings?.length || 0;
      
      if (!dryRun) {
        // 이름 업데이트
        const { error: updateError } = await supabase
          .from('bookings')
          .update({
            name: baseName,
            notes: newNotes,
          })
          .eq('id', booking.id);
        
        if (updateError) {
          throw updateError;
        }
        
        // customers 테이블 업데이트
        const { data: existingCustomer } = await supabase
          .from('customers')
          .select('id')
          .eq('phone', booking.phone)
          .single();
        
        if (existingCustomer) {
          await supabase
            .from('customers')
            .update({ visit_count: visitCount })
            .eq('id', existingCustomer.id);
        } else {
          // 고객이 없으면 생성
          await supabase
            .from('customers')
            .insert({
              name: baseName,
              phone: booking.phone,
              email: booking.email || null,
              visit_count: visitCount,
            });
        }
        
        // 고객 이름도 업데이트 (더 정확한 이름으로)
        await supabase
          .from('customers')
          .update({ name: baseName })
          .eq('phone', booking.phone);
      }
      
      results.updated.push({
        id: booking.id,
        originalName: booking.name,
        newName: baseName,
        companionInfo,
        notes: newNotes,
      });
      
      console.log(`   ✅ 처리 완료: "${baseName}" (방문 ${visitCount}회)`);
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
    console.log('\n📋 처리된 예약:');
    results.updated.forEach((r, i) => {
      console.log(`   ${i + 1}. "${r.originalName}" → "${r.newName}"`);
      console.log(`      동반 정보: ${r.companionInfo}`);
    });
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
  }
}

fixCompanionVisitors()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('\n❌ 작업 실패:', err);
    process.exit(1);
  });


 * 
 * 이름에 "(여자)", "(여자손님 모시고 옴)", "(2인)" 등이 포함된 예약을 처리
 * 
 * 처리 규칙:
 * 1. 이름에서 괄호 부분 제거하여 기본 이름으로 정규화
 * 2. notes 필드에 동반 방문자 정보 추가
 * 3. 같은 전화번호를 가진 고객의 visit_count 업데이트
 * 4. 두 예약 모두 유지 (다른 날짜이므로 중복 아님)
 * 
 * 사용법:
 * node scripts/fix-companion-visitors.js [--dry-run]
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

// 이름에서 동반 방문자 정보 추출
function parseCompanionInfo(name) {
  if (!name) return { baseName: name, companionInfo: null };
  
  // (여자), (여자손님 모시고 옴), (2인), (외1) 등 패턴 찾기
  const match = name.match(/^(.+?)(\([^)]+\))$/);
  if (match) {
    return {
      baseName: match[1].trim(),
      companionInfo: match[2] // (여자), (여자손님 모시고 옴) 등
    };
  }
  
  return { baseName: name, companionInfo: null };
}

// 동반 방문자 정보를 notes에 추가
function formatCompanionNote(companionInfo, existingNotes) {
  const companionText = companionInfo
    .replace(/[()]/g, '') // 괄호 제거
    .trim();
  
  let noteText = '';
  if (companionText.includes('여자')) {
    noteText = '여자 동반 방문';
  } else if (companionText.includes('2인') || companionText.includes('외1')) {
    noteText = '2인 동반 방문';
  } else {
    noteText = `${companionText} 동반 방문`;
  }
  
  if (existingNotes && existingNotes.trim()) {
    return `${existingNotes}\n[${noteText}]`;
  }
  
  return `[${noteText}]`;
}

async function fixCompanionVisitors() {
  const dryRun = process.argv.includes('--dry-run');
  
  console.log('🔍 동반 방문자 패턴 찾기...\n');
  if (dryRun) {
    console.log('⚠️  DRY RUN 모드: 실제 수정 없이 확인만 수행합니다.\n');
  }
  
  // 모든 예약 데이터 가져오기
  let allBookings = [];
  let from = 0;
  const pageSize = 1000;
  let hasMore = true;
  
  while (hasMore) {
    const { data: bookingsData, error } = await supabase
      .from('bookings')
      .select('*')
      .range(from, from + pageSize - 1);
    
    if (error) {
      console.error('❌ 데이터 로드 오류:', error);
      break;
    }
    
    if (bookingsData && bookingsData.length > 0) {
      allBookings = [...allBookings, ...bookingsData];
      from += pageSize;
      hasMore = bookingsData.length === pageSize;
    } else {
      hasMore = false;
    }
  }
  
  console.log(`✅ 총 ${allBookings.length}건 로드 완료\n`);
  
  // 동반 방문자 패턴 찾기
  const companionBookings = [];
  
  for (const booking of allBookings) {
    if (!booking.name) continue;
    
    const { baseName, companionInfo } = parseCompanionInfo(booking.name);
    
    if (companionInfo) {
      companionBookings.push({
        booking,
        baseName,
        companionInfo,
      });
    }
  }
  
  console.log(`📋 동반 방문자 패턴 발견: ${companionBookings.length}건\n`);
  
  if (companionBookings.length === 0) {
    console.log('✅ 처리할 동반 방문자 패턴이 없습니다.\n');
    return;
  }
  
  // 처리 결과
  const results = {
    updated: [],
    errors: [],
  };
  
  // 각 동반 방문자 예약 처리
  for (const { booking, baseName, companionInfo } of companionBookings) {
    try {
      console.log(`[${booking.id}] 처리 중: "${booking.name}" → "${baseName}"`);
      console.log(`   전화번호: ${booking.phone}, 날짜: ${booking.date}`);
      console.log(`   동반 정보: ${companionInfo}`);
      
      // notes에 동반 방문자 정보 추가
      const newNotes = formatCompanionNote(companionInfo, booking.notes);
      
      // 방문 횟수 계산 (dry-run 모드에서도 표시하기 위해)
      const { data: customerBookings } = await supabase
        .from('bookings')
        .select('id')
        .eq('phone', booking.phone);
      
      const visitCount = customerBookings?.length || 0;
      
      if (!dryRun) {
        // 이름 업데이트
        const { error: updateError } = await supabase
          .from('bookings')
          .update({
            name: baseName,
            notes: newNotes,
          })
          .eq('id', booking.id);
        
        if (updateError) {
          throw updateError;
        }
        
        // customers 테이블 업데이트
        const { data: existingCustomer } = await supabase
          .from('customers')
          .select('id')
          .eq('phone', booking.phone)
          .single();
        
        if (existingCustomer) {
          await supabase
            .from('customers')
            .update({ visit_count: visitCount })
            .eq('id', existingCustomer.id);
        } else {
          // 고객이 없으면 생성
          await supabase
            .from('customers')
            .insert({
              name: baseName,
              phone: booking.phone,
              email: booking.email || null,
              visit_count: visitCount,
            });
        }
        
        // 고객 이름도 업데이트 (더 정확한 이름으로)
        await supabase
          .from('customers')
          .update({ name: baseName })
          .eq('phone', booking.phone);
      }
      
      results.updated.push({
        id: booking.id,
        originalName: booking.name,
        newName: baseName,
        companionInfo,
        notes: newNotes,
      });
      
      console.log(`   ✅ 처리 완료: "${baseName}" (방문 ${visitCount}회)`);
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
    console.log('\n📋 처리된 예약:');
    results.updated.forEach((r, i) => {
      console.log(`   ${i + 1}. "${r.originalName}" → "${r.newName}"`);
      console.log(`      동반 정보: ${r.companionInfo}`);
    });
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
  }
}

fixCompanionVisitors()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('\n❌ 작업 실패:', err);
    process.exit(1);
  });


 * 
 * 이름에 "(여자)", "(여자손님 모시고 옴)", "(2인)" 등이 포함된 예약을 처리
 * 
 * 처리 규칙:
 * 1. 이름에서 괄호 부분 제거하여 기본 이름으로 정규화
 * 2. notes 필드에 동반 방문자 정보 추가
 * 3. 같은 전화번호를 가진 고객의 visit_count 업데이트
 * 4. 두 예약 모두 유지 (다른 날짜이므로 중복 아님)
 * 
 * 사용법:
 * node scripts/fix-companion-visitors.js [--dry-run]
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

// 이름에서 동반 방문자 정보 추출
function parseCompanionInfo(name) {
  if (!name) return { baseName: name, companionInfo: null };
  
  // (여자), (여자손님 모시고 옴), (2인), (외1) 등 패턴 찾기
  const match = name.match(/^(.+?)(\([^)]+\))$/);
  if (match) {
    return {
      baseName: match[1].trim(),
      companionInfo: match[2] // (여자), (여자손님 모시고 옴) 등
    };
  }
  
  return { baseName: name, companionInfo: null };
}

// 동반 방문자 정보를 notes에 추가
function formatCompanionNote(companionInfo, existingNotes) {
  const companionText = companionInfo
    .replace(/[()]/g, '') // 괄호 제거
    .trim();
  
  let noteText = '';
  if (companionText.includes('여자')) {
    noteText = '여자 동반 방문';
  } else if (companionText.includes('2인') || companionText.includes('외1')) {
    noteText = '2인 동반 방문';
  } else {
    noteText = `${companionText} 동반 방문`;
  }
  
  if (existingNotes && existingNotes.trim()) {
    return `${existingNotes}\n[${noteText}]`;
  }
  
  return `[${noteText}]`;
}

async function fixCompanionVisitors() {
  const dryRun = process.argv.includes('--dry-run');
  
  console.log('🔍 동반 방문자 패턴 찾기...\n');
  if (dryRun) {
    console.log('⚠️  DRY RUN 모드: 실제 수정 없이 확인만 수행합니다.\n');
  }
  
  // 모든 예약 데이터 가져오기
  let allBookings = [];
  let from = 0;
  const pageSize = 1000;
  let hasMore = true;
  
  while (hasMore) {
    const { data: bookingsData, error } = await supabase
      .from('bookings')
      .select('*')
      .range(from, from + pageSize - 1);
    
    if (error) {
      console.error('❌ 데이터 로드 오류:', error);
      break;
    }
    
    if (bookingsData && bookingsData.length > 0) {
      allBookings = [...allBookings, ...bookingsData];
      from += pageSize;
      hasMore = bookingsData.length === pageSize;
    } else {
      hasMore = false;
    }
  }
  
  console.log(`✅ 총 ${allBookings.length}건 로드 완료\n`);
  
  // 동반 방문자 패턴 찾기
  const companionBookings = [];
  
  for (const booking of allBookings) {
    if (!booking.name) continue;
    
    const { baseName, companionInfo } = parseCompanionInfo(booking.name);
    
    if (companionInfo) {
      companionBookings.push({
        booking,
        baseName,
        companionInfo,
      });
    }
  }
  
  console.log(`📋 동반 방문자 패턴 발견: ${companionBookings.length}건\n`);
  
  if (companionBookings.length === 0) {
    console.log('✅ 처리할 동반 방문자 패턴이 없습니다.\n');
    return;
  }
  
  // 처리 결과
  const results = {
    updated: [],
    errors: [],
  };
  
  // 각 동반 방문자 예약 처리
  for (const { booking, baseName, companionInfo } of companionBookings) {
    try {
      console.log(`[${booking.id}] 처리 중: "${booking.name}" → "${baseName}"`);
      console.log(`   전화번호: ${booking.phone}, 날짜: ${booking.date}`);
      console.log(`   동반 정보: ${companionInfo}`);
      
      // notes에 동반 방문자 정보 추가
      const newNotes = formatCompanionNote(companionInfo, booking.notes);
      
      // 방문 횟수 계산 (dry-run 모드에서도 표시하기 위해)
      const { data: customerBookings } = await supabase
        .from('bookings')
        .select('id')
        .eq('phone', booking.phone);
      
      const visitCount = customerBookings?.length || 0;
      
      if (!dryRun) {
        // 이름 업데이트
        const { error: updateError } = await supabase
          .from('bookings')
          .update({
            name: baseName,
            notes: newNotes,
          })
          .eq('id', booking.id);
        
        if (updateError) {
          throw updateError;
        }
        
        // customers 테이블 업데이트
        const { data: existingCustomer } = await supabase
          .from('customers')
          .select('id')
          .eq('phone', booking.phone)
          .single();
        
        if (existingCustomer) {
          await supabase
            .from('customers')
            .update({ visit_count: visitCount })
            .eq('id', existingCustomer.id);
        } else {
          // 고객이 없으면 생성
          await supabase
            .from('customers')
            .insert({
              name: baseName,
              phone: booking.phone,
              email: booking.email || null,
              visit_count: visitCount,
            });
        }
        
        // 고객 이름도 업데이트 (더 정확한 이름으로)
        await supabase
          .from('customers')
          .update({ name: baseName })
          .eq('phone', booking.phone);
      }
      
      results.updated.push({
        id: booking.id,
        originalName: booking.name,
        newName: baseName,
        companionInfo,
        notes: newNotes,
      });
      
      console.log(`   ✅ 처리 완료: "${baseName}" (방문 ${visitCount}회)`);
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
    console.log('\n📋 처리된 예약:');
    results.updated.forEach((r, i) => {
      console.log(`   ${i + 1}. "${r.originalName}" → "${r.newName}"`);
      console.log(`      동반 정보: ${r.companionInfo}`);
    });
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
  }
}

fixCompanionVisitors()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('\n❌ 작업 실패:', err);
    process.exit(1);
  });

