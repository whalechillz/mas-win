const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// "외 N명" 패턴에서 기본 이름 추출
function parseCompanionNameWithoutParentheses(name) {
  if (!name) return { baseName: name, companionInfo: null };
  
  // 패턴: "조영택외 1명", "조영택외2명", "조영택 외 1명" 등
  // 정규식: 이름 + (공백?) + "외" + (공백?) + 숫자 + "명"
  const match = name.match(/^(.+?)\s*외\s*(\d+)명\s*$/);
  
  if (match) {
    return {
      baseName: match[1].trim(),
      companionCount: parseInt(match[2], 10),
      companionInfo: `외 ${match[2]}명`
    };
  }
  
  return { baseName: name, companionInfo: null };
}

// 동반 방문자 정보를 notes에 추가
function formatCompanionNote(companionCount, existingNotes) {
  const noteText = companionCount === 1 
    ? '2인 동반 방문' 
    : `${companionCount + 1}인 동반 방문`;
  
  const newNote = `[${noteText}]`;
  
  if (existingNotes && existingNotes.trim()) {
    // 이미 같은 내용이 있는지 확인
    if (existingNotes.includes(noteText)) {
      return existingNotes;
    }
    return `${existingNotes}\n${newNote}`;
  }
  
  return newNote;
}

async function fixCompanionNamesWithoutParentheses() {
  const dryRun = process.argv.includes('--dry-run');
  
  console.log('🔍 "외 N명" 패턴 이름 정규화 중...\n');
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
  
  // "외 N명" 패턴 찾기
  const companionBookings = [];
  
  for (const booking of allBookings) {
    const { baseName, companionInfo, companionCount } = parseCompanionNameWithoutParentheses(booking.name);
    
    if (companionInfo) {
      companionBookings.push({
        booking,
        baseName,
        companionInfo,
        companionCount
      });
    }
  }
  
  console.log(`📋 "외 N명" 패턴 발견: ${companionBookings.length}건\n`);
  
  if (companionBookings.length === 0) {
    console.log('✅ 처리할 패턴이 없습니다.\n');
    return;
  }
  
  // 처리 결과
  const results = {
    updated: [],
    errors: [],
  };
  
  // 각 예약 처리
  for (const { booking, baseName, companionInfo, companionCount } of companionBookings) {
    try {
      console.log(`[${booking.id}] 처리 중: "${booking.name}" → "${baseName}"`);
      console.log(`   전화번호: ${booking.phone}, 날짜: ${booking.date}`);
      console.log(`   동반 정보: ${companionInfo} (${companionCount + 1}인)`);
      
      // notes에 동반 방문자 정보 추가
      const newNotes = formatCompanionNote(companionCount, booking.notes);
      
      // 방문 횟수 계산
      const { data: customerBookings } = await supabase
        .from('bookings')
        .select('id')
        .eq('phone', booking.phone);
      
      const visitCount = customerBookings?.length || 0;
      
      if (!dryRun) {
        // 예약 이름 업데이트
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
        
        // customers 테이블 확인 및 업데이트
        const { data: existingCustomer } = await supabase
          .from('customers')
          .select('id, name')
          .eq('phone', booking.phone)
          .single();
        
        if (existingCustomer) {
          // 고객 이름이 더 정확한 이름으로 업데이트 필요 시
          if (existingCustomer.name !== baseName && 
              existingCustomer.name.includes('외') && 
              !baseName.includes('외')) {
            await supabase
              .from('customers')
              .update({ 
                name: baseName,
                visit_count: visitCount 
              })
              .eq('id', existingCustomer.id);
          } else {
            // 방문 횟수만 업데이트
            await supabase
              .from('customers')
              .update({ visit_count: visitCount })
              .eq('id', existingCustomer.id);
          }
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
    console.log('💡 예약과 고객 이름이 정규화되어 매칭이 개선되었습니다.');
  }
}

fixCompanionNamesWithoutParentheses()
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

// "외 N명" 패턴에서 기본 이름 추출
function parseCompanionNameWithoutParentheses(name) {
  if (!name) return { baseName: name, companionInfo: null };
  
  // 패턴: "조영택외 1명", "조영택외2명", "조영택 외 1명" 등
  // 정규식: 이름 + (공백?) + "외" + (공백?) + 숫자 + "명"
  const match = name.match(/^(.+?)\s*외\s*(\d+)명\s*$/);
  
  if (match) {
    return {
      baseName: match[1].trim(),
      companionCount: parseInt(match[2], 10),
      companionInfo: `외 ${match[2]}명`
    };
  }
  
  return { baseName: name, companionInfo: null };
}

// 동반 방문자 정보를 notes에 추가
function formatCompanionNote(companionCount, existingNotes) {
  const noteText = companionCount === 1 
    ? '2인 동반 방문' 
    : `${companionCount + 1}인 동반 방문`;
  
  const newNote = `[${noteText}]`;
  
  if (existingNotes && existingNotes.trim()) {
    // 이미 같은 내용이 있는지 확인
    if (existingNotes.includes(noteText)) {
      return existingNotes;
    }
    return `${existingNotes}\n${newNote}`;
  }
  
  return newNote;
}

async function fixCompanionNamesWithoutParentheses() {
  const dryRun = process.argv.includes('--dry-run');
  
  console.log('🔍 "외 N명" 패턴 이름 정규화 중...\n');
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
  
  // "외 N명" 패턴 찾기
  const companionBookings = [];
  
  for (const booking of allBookings) {
    const { baseName, companionInfo, companionCount } = parseCompanionNameWithoutParentheses(booking.name);
    
    if (companionInfo) {
      companionBookings.push({
        booking,
        baseName,
        companionInfo,
        companionCount
      });
    }
  }
  
  console.log(`📋 "외 N명" 패턴 발견: ${companionBookings.length}건\n`);
  
  if (companionBookings.length === 0) {
    console.log('✅ 처리할 패턴이 없습니다.\n');
    return;
  }
  
  // 처리 결과
  const results = {
    updated: [],
    errors: [],
  };
  
  // 각 예약 처리
  for (const { booking, baseName, companionInfo, companionCount } of companionBookings) {
    try {
      console.log(`[${booking.id}] 처리 중: "${booking.name}" → "${baseName}"`);
      console.log(`   전화번호: ${booking.phone}, 날짜: ${booking.date}`);
      console.log(`   동반 정보: ${companionInfo} (${companionCount + 1}인)`);
      
      // notes에 동반 방문자 정보 추가
      const newNotes = formatCompanionNote(companionCount, booking.notes);
      
      // 방문 횟수 계산
      const { data: customerBookings } = await supabase
        .from('bookings')
        .select('id')
        .eq('phone', booking.phone);
      
      const visitCount = customerBookings?.length || 0;
      
      if (!dryRun) {
        // 예약 이름 업데이트
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
        
        // customers 테이블 확인 및 업데이트
        const { data: existingCustomer } = await supabase
          .from('customers')
          .select('id, name')
          .eq('phone', booking.phone)
          .single();
        
        if (existingCustomer) {
          // 고객 이름이 더 정확한 이름으로 업데이트 필요 시
          if (existingCustomer.name !== baseName && 
              existingCustomer.name.includes('외') && 
              !baseName.includes('외')) {
            await supabase
              .from('customers')
              .update({ 
                name: baseName,
                visit_count: visitCount 
              })
              .eq('id', existingCustomer.id);
          } else {
            // 방문 횟수만 업데이트
            await supabase
              .from('customers')
              .update({ visit_count: visitCount })
              .eq('id', existingCustomer.id);
          }
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
    console.log('💡 예약과 고객 이름이 정규화되어 매칭이 개선되었습니다.');
  }
}

fixCompanionNamesWithoutParentheses()
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

// "외 N명" 패턴에서 기본 이름 추출
function parseCompanionNameWithoutParentheses(name) {
  if (!name) return { baseName: name, companionInfo: null };
  
  // 패턴: "조영택외 1명", "조영택외2명", "조영택 외 1명" 등
  // 정규식: 이름 + (공백?) + "외" + (공백?) + 숫자 + "명"
  const match = name.match(/^(.+?)\s*외\s*(\d+)명\s*$/);
  
  if (match) {
    return {
      baseName: match[1].trim(),
      companionCount: parseInt(match[2], 10),
      companionInfo: `외 ${match[2]}명`
    };
  }
  
  return { baseName: name, companionInfo: null };
}

// 동반 방문자 정보를 notes에 추가
function formatCompanionNote(companionCount, existingNotes) {
  const noteText = companionCount === 1 
    ? '2인 동반 방문' 
    : `${companionCount + 1}인 동반 방문`;
  
  const newNote = `[${noteText}]`;
  
  if (existingNotes && existingNotes.trim()) {
    // 이미 같은 내용이 있는지 확인
    if (existingNotes.includes(noteText)) {
      return existingNotes;
    }
    return `${existingNotes}\n${newNote}`;
  }
  
  return newNote;
}

async function fixCompanionNamesWithoutParentheses() {
  const dryRun = process.argv.includes('--dry-run');
  
  console.log('🔍 "외 N명" 패턴 이름 정규화 중...\n');
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
  
  // "외 N명" 패턴 찾기
  const companionBookings = [];
  
  for (const booking of allBookings) {
    const { baseName, companionInfo, companionCount } = parseCompanionNameWithoutParentheses(booking.name);
    
    if (companionInfo) {
      companionBookings.push({
        booking,
        baseName,
        companionInfo,
        companionCount
      });
    }
  }
  
  console.log(`📋 "외 N명" 패턴 발견: ${companionBookings.length}건\n`);
  
  if (companionBookings.length === 0) {
    console.log('✅ 처리할 패턴이 없습니다.\n');
    return;
  }
  
  // 처리 결과
  const results = {
    updated: [],
    errors: [],
  };
  
  // 각 예약 처리
  for (const { booking, baseName, companionInfo, companionCount } of companionBookings) {
    try {
      console.log(`[${booking.id}] 처리 중: "${booking.name}" → "${baseName}"`);
      console.log(`   전화번호: ${booking.phone}, 날짜: ${booking.date}`);
      console.log(`   동반 정보: ${companionInfo} (${companionCount + 1}인)`);
      
      // notes에 동반 방문자 정보 추가
      const newNotes = formatCompanionNote(companionCount, booking.notes);
      
      // 방문 횟수 계산
      const { data: customerBookings } = await supabase
        .from('bookings')
        .select('id')
        .eq('phone', booking.phone);
      
      const visitCount = customerBookings?.length || 0;
      
      if (!dryRun) {
        // 예약 이름 업데이트
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
        
        // customers 테이블 확인 및 업데이트
        const { data: existingCustomer } = await supabase
          .from('customers')
          .select('id, name')
          .eq('phone', booking.phone)
          .single();
        
        if (existingCustomer) {
          // 고객 이름이 더 정확한 이름으로 업데이트 필요 시
          if (existingCustomer.name !== baseName && 
              existingCustomer.name.includes('외') && 
              !baseName.includes('외')) {
            await supabase
              .from('customers')
              .update({ 
                name: baseName,
                visit_count: visitCount 
              })
              .eq('id', existingCustomer.id);
          } else {
            // 방문 횟수만 업데이트
            await supabase
              .from('customers')
              .update({ visit_count: visitCount })
              .eq('id', existingCustomer.id);
          }
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
    console.log('💡 예약과 고객 이름이 정규화되어 매칭이 개선되었습니다.');
  }
}

fixCompanionNamesWithoutParentheses()
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

// "외 N명" 패턴에서 기본 이름 추출
function parseCompanionNameWithoutParentheses(name) {
  if (!name) return { baseName: name, companionInfo: null };
  
  // 패턴: "조영택외 1명", "조영택외2명", "조영택 외 1명" 등
  // 정규식: 이름 + (공백?) + "외" + (공백?) + 숫자 + "명"
  const match = name.match(/^(.+?)\s*외\s*(\d+)명\s*$/);
  
  if (match) {
    return {
      baseName: match[1].trim(),
      companionCount: parseInt(match[2], 10),
      companionInfo: `외 ${match[2]}명`
    };
  }
  
  return { baseName: name, companionInfo: null };
}

// 동반 방문자 정보를 notes에 추가
function formatCompanionNote(companionCount, existingNotes) {
  const noteText = companionCount === 1 
    ? '2인 동반 방문' 
    : `${companionCount + 1}인 동반 방문`;
  
  const newNote = `[${noteText}]`;
  
  if (existingNotes && existingNotes.trim()) {
    // 이미 같은 내용이 있는지 확인
    if (existingNotes.includes(noteText)) {
      return existingNotes;
    }
    return `${existingNotes}\n${newNote}`;
  }
  
  return newNote;
}

async function fixCompanionNamesWithoutParentheses() {
  const dryRun = process.argv.includes('--dry-run');
  
  console.log('🔍 "외 N명" 패턴 이름 정규화 중...\n');
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
  
  // "외 N명" 패턴 찾기
  const companionBookings = [];
  
  for (const booking of allBookings) {
    const { baseName, companionInfo, companionCount } = parseCompanionNameWithoutParentheses(booking.name);
    
    if (companionInfo) {
      companionBookings.push({
        booking,
        baseName,
        companionInfo,
        companionCount
      });
    }
  }
  
  console.log(`📋 "외 N명" 패턴 발견: ${companionBookings.length}건\n`);
  
  if (companionBookings.length === 0) {
    console.log('✅ 처리할 패턴이 없습니다.\n');
    return;
  }
  
  // 처리 결과
  const results = {
    updated: [],
    errors: [],
  };
  
  // 각 예약 처리
  for (const { booking, baseName, companionInfo, companionCount } of companionBookings) {
    try {
      console.log(`[${booking.id}] 처리 중: "${booking.name}" → "${baseName}"`);
      console.log(`   전화번호: ${booking.phone}, 날짜: ${booking.date}`);
      console.log(`   동반 정보: ${companionInfo} (${companionCount + 1}인)`);
      
      // notes에 동반 방문자 정보 추가
      const newNotes = formatCompanionNote(companionCount, booking.notes);
      
      // 방문 횟수 계산
      const { data: customerBookings } = await supabase
        .from('bookings')
        .select('id')
        .eq('phone', booking.phone);
      
      const visitCount = customerBookings?.length || 0;
      
      if (!dryRun) {
        // 예약 이름 업데이트
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
        
        // customers 테이블 확인 및 업데이트
        const { data: existingCustomer } = await supabase
          .from('customers')
          .select('id, name')
          .eq('phone', booking.phone)
          .single();
        
        if (existingCustomer) {
          // 고객 이름이 더 정확한 이름으로 업데이트 필요 시
          if (existingCustomer.name !== baseName && 
              existingCustomer.name.includes('외') && 
              !baseName.includes('외')) {
            await supabase
              .from('customers')
              .update({ 
                name: baseName,
                visit_count: visitCount 
              })
              .eq('id', existingCustomer.id);
          } else {
            // 방문 횟수만 업데이트
            await supabase
              .from('customers')
              .update({ visit_count: visitCount })
              .eq('id', existingCustomer.id);
          }
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
    console.log('💡 예약과 고객 이름이 정규화되어 매칭이 개선되었습니다.');
  }
}

fixCompanionNamesWithoutParentheses()
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

// "외 N명" 패턴에서 기본 이름 추출
function parseCompanionNameWithoutParentheses(name) {
  if (!name) return { baseName: name, companionInfo: null };
  
  // 패턴: "조영택외 1명", "조영택외2명", "조영택 외 1명" 등
  // 정규식: 이름 + (공백?) + "외" + (공백?) + 숫자 + "명"
  const match = name.match(/^(.+?)\s*외\s*(\d+)명\s*$/);
  
  if (match) {
    return {
      baseName: match[1].trim(),
      companionCount: parseInt(match[2], 10),
      companionInfo: `외 ${match[2]}명`
    };
  }
  
  return { baseName: name, companionInfo: null };
}

// 동반 방문자 정보를 notes에 추가
function formatCompanionNote(companionCount, existingNotes) {
  const noteText = companionCount === 1 
    ? '2인 동반 방문' 
    : `${companionCount + 1}인 동반 방문`;
  
  const newNote = `[${noteText}]`;
  
  if (existingNotes && existingNotes.trim()) {
    // 이미 같은 내용이 있는지 확인
    if (existingNotes.includes(noteText)) {
      return existingNotes;
    }
    return `${existingNotes}\n${newNote}`;
  }
  
  return newNote;
}

async function fixCompanionNamesWithoutParentheses() {
  const dryRun = process.argv.includes('--dry-run');
  
  console.log('🔍 "외 N명" 패턴 이름 정규화 중...\n');
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
  
  // "외 N명" 패턴 찾기
  const companionBookings = [];
  
  for (const booking of allBookings) {
    const { baseName, companionInfo, companionCount } = parseCompanionNameWithoutParentheses(booking.name);
    
    if (companionInfo) {
      companionBookings.push({
        booking,
        baseName,
        companionInfo,
        companionCount
      });
    }
  }
  
  console.log(`📋 "외 N명" 패턴 발견: ${companionBookings.length}건\n`);
  
  if (companionBookings.length === 0) {
    console.log('✅ 처리할 패턴이 없습니다.\n');
    return;
  }
  
  // 처리 결과
  const results = {
    updated: [],
    errors: [],
  };
  
  // 각 예약 처리
  for (const { booking, baseName, companionInfo, companionCount } of companionBookings) {
    try {
      console.log(`[${booking.id}] 처리 중: "${booking.name}" → "${baseName}"`);
      console.log(`   전화번호: ${booking.phone}, 날짜: ${booking.date}`);
      console.log(`   동반 정보: ${companionInfo} (${companionCount + 1}인)`);
      
      // notes에 동반 방문자 정보 추가
      const newNotes = formatCompanionNote(companionCount, booking.notes);
      
      // 방문 횟수 계산
      const { data: customerBookings } = await supabase
        .from('bookings')
        .select('id')
        .eq('phone', booking.phone);
      
      const visitCount = customerBookings?.length || 0;
      
      if (!dryRun) {
        // 예약 이름 업데이트
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
        
        // customers 테이블 확인 및 업데이트
        const { data: existingCustomer } = await supabase
          .from('customers')
          .select('id, name')
          .eq('phone', booking.phone)
          .single();
        
        if (existingCustomer) {
          // 고객 이름이 더 정확한 이름으로 업데이트 필요 시
          if (existingCustomer.name !== baseName && 
              existingCustomer.name.includes('외') && 
              !baseName.includes('외')) {
            await supabase
              .from('customers')
              .update({ 
                name: baseName,
                visit_count: visitCount 
              })
              .eq('id', existingCustomer.id);
          } else {
            // 방문 횟수만 업데이트
            await supabase
              .from('customers')
              .update({ visit_count: visitCount })
              .eq('id', existingCustomer.id);
          }
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
    console.log('💡 예약과 고객 이름이 정규화되어 매칭이 개선되었습니다.');
  }
}

fixCompanionNamesWithoutParentheses()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('\n❌ 작업 실패:', err);
    process.exit(1);
  });














