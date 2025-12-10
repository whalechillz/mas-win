/**
 * 전화번호 정규화 및 중복 제거 스크립트
 * 
 * 1. 82로 시작하는 전화번호를 010으로 정규화
 * 2. 정규화된 전화번호 기준으로 중복 데이터 찾기
 * 3. 중복 데이터 제거 (더 최근 데이터 유지)
 * 4. 전화번호가 null인 데이터 확인
 * 
 * 사용법:
 * node scripts/fix-phone-normalization.js [--dry-run]
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

// 전화번호 정규화 함수
function normalizePhone(phone) {
  if (!phone) return null;
  
  // 1. 모든 공백, 하이픈, 괄호, +, 콤마 제거
  let cleaned = phone.toString().replace(/[\s\-+(),]/g, '');
  
  // 2. 82로 시작하면 0으로 변환
  if (cleaned.startsWith('82')) {
    cleaned = '0' + cleaned.substring(2);
  }
  
  // 3. 01로 시작하고 10자리면 010으로 변경
  if (cleaned.startsWith('01') && cleaned.length === 10) {
    cleaned = '010' + cleaned.substring(2);
  }

  // 4. 10으로 시작하고 10자리면 앞에 0을 붙여 010으로 보정
  if (cleaned.startsWith('10') && cleaned.length === 10) {
    cleaned = '0' + cleaned;
  }
  
  // 5. 유효성 검사 (11자리 숫자만 허용)
  if (!/^010\d{8}$/.test(cleaned)) {
    return null;
  }
  
  return cleaned; // 숫자만 반환 (하이픈 없음)
}

async function fixPhoneNormalization() {
  const dryRun = process.argv.includes('--dry-run');
  
  console.log('🔍 전화번호 정규화 및 중복 제거 시작...\n');
  if (dryRun) {
    console.log('⚠️  DRY RUN 모드: 실제 수정 없이 확인만 수행합니다.\n');
  }
  
  // bookings와 customers 둘 다 처리
  const tables = [
    { name: 'bookings', hasDate: true },
    { name: 'customers', hasDate: false }
  ];
  
  let allBookings = []; // 중복 제거는 bookings만
  
  for (const table of tables) {
    console.log(`\n📊 ${table.name} 테이블 처리 중...`);
    
    // 모든 데이터 가져오기
    let allData = [];
    let from = 0;
    const pageSize = 1000;
    let hasMore = true;
    
    while (hasMore) {
      const { data, error } = await supabase
        .from(table.name)
        .select('*')
        .range(from, from + pageSize - 1);
      
      if (error) {
        console.error(`❌ ${table.name} 로드 오류:`, error);
        break;
      }
      
      if (data && data.length > 0) {
        allData = [...allData, ...data];
        from += pageSize;
        hasMore = data.length === pageSize;
      } else {
        hasMore = false;
      }
    }
    
    console.log(`✅ ${table.name}: ${allData.length}건 로드 완료`);
    
    if (table.name === 'bookings') {
      allBookings = allData;
    }
    
    // 2. 전화번호가 null인 데이터 확인
    const noPhoneData = allData.filter(item => !item.phone || item.phone.toString().trim() === '');
    console.log(`📋 전화번호 없는 ${table.name}: ${noPhoneData.length}건`);
    if (noPhoneData.length > 0 && noPhoneData.length <= 10) {
      console.log('   샘플:');
      noPhoneData.slice(0, 5).forEach(item => {
        const nameField = table.hasDate ? 'name' : 'name';
        const dateField = table.hasDate ? `, 날짜: ${item.date}` : '';
        console.log(`     - ID: ${item.id}, 이름: ${item[nameField] || 'N/A'}${dateField}`);
      });
    }
    console.log('');
    
    // 3. 10으로 시작하는 10자리 전화번호 찾기 (10xxxxxxxx → 010xxxxxxxx)
    const phone10Pattern = allData.filter(item => {
      if (!item.phone) return false;
      const cleaned = item.phone.toString().replace(/[\s\-+(),]/g, '');
      return cleaned.startsWith('10') && cleaned.length === 10;
    });
    
    console.log(`📋 10으로 시작하는 10자리 전화번호: ${phone10Pattern.length}건`);
    if (phone10Pattern.length > 0) {
      console.log('   샘플:');
      phone10Pattern.slice(0, 10).forEach(item => {
        const normalized = normalizePhone(item.phone);
        const nameField = table.hasDate ? item.name : item.name;
        const dateField = table.hasDate ? `, 날짜: ${item.date}` : '';
        console.log(`     - ID: ${item.id}, 이름: ${nameField || 'N/A'}, 원본: ${item.phone} → 정규화: ${normalized}${dateField}`);
      });
    }
    console.log('');
    
    // 4. 82로 시작하는 전화번호 찾기
    const phone82Pattern = allData.filter(item => {
      if (!item.phone) return false;
      const cleaned = item.phone.toString().replace(/[\s\-+()]/g, '');
      return cleaned.startsWith('82');
    });
    
    console.log(`📋 82로 시작하는 전화번호: ${phone82Pattern.length}건`);
    if (phone82Pattern.length > 0) {
      console.log('   샘플:');
      phone82Pattern.slice(0, 10).forEach(item => {
        const normalized = normalizePhone(item.phone);
        const nameField = table.hasDate ? item.name : item.name;
        const dateField = table.hasDate ? `, 날짜: ${item.date}` : '';
        console.log(`     - ID: ${item.id}, 이름: ${nameField || 'N/A'}, 원본: ${item.phone} → 정규화: ${normalized}${dateField}`);
      });
    }
    console.log('');
    
    // 5. 정규화 필요 항목 합치기 (10xxxxxxxx + 82xxxxxxxx)
    const toUpdate = [...phone10Pattern, ...phone82Pattern];
    
    // 중복 제거 (같은 ID가 여러 패턴에 포함될 수 있음)
    const uniqueToUpdate = Array.from(
      new Map(toUpdate.map(item => [item.id, item])).values()
    );
    
    if (uniqueToUpdate.length > 0 && !dryRun) {
      console.log(`🔧 ${table.name} 전화번호 정규화 중...`);
      let updatedCount = 0;
      let errorCount = 0;
      
      for (const item of uniqueToUpdate) {
        const normalized = normalizePhone(item.phone);
        if (normalized && normalized !== item.phone) {
          const { error } = await supabase
            .from(table.name)
            .update({ phone: normalized })
            .eq('id', item.id);
          
          if (error) {
            console.error(`❌ 업데이트 실패 (ID: ${item.id}):`, error);
            errorCount++;
          } else {
            updatedCount++;
          }
        }
      }
      
      console.log(`✅ ${table.name} 정규화 완료: ${updatedCount}건 업데이트, ${errorCount}건 오류\n`);
    } else if (uniqueToUpdate.length > 0) {
      console.log(`💡 ${table.name}에서 ${uniqueToUpdate.length}건이 정규화 대상입니다.\n`);
    }
  }
  
  // 6. bookings 중복 제거 (기존 로직 유지)
  
  // 6. bookings 중복 제거 (기존 로직 유지)
  if (allBookings.length > 0) {
    console.log('\n🔍 bookings 중복 데이터 찾기 중...');
    const phoneMap = new Map();
    const duplicates = [];
    
    for (const booking of allBookings) {
      const normalized = normalizePhone(booking.phone);
      if (!normalized) continue;
      
      const key = `${normalized}_${booking.date}_${booking.time}`;
      
      if (phoneMap.has(key)) {
        const existing = phoneMap.get(key);
        duplicates.push({
          key,
          existing,
          duplicate: booking,
        });
      } else {
        phoneMap.set(key, booking);
      }
    }
    
    console.log(`📋 중복 예약 발견: ${duplicates.length}건\n`);
    
    if (duplicates.length > 0) {
      // 중복 그룹별로 정리
      const duplicateGroups = new Map();
      for (const dup of duplicates) {
        if (!duplicateGroups.has(dup.key)) {
          duplicateGroups.set(dup.key, [dup.existing, dup.duplicate]);
        } else {
          duplicateGroups.get(dup.key).push(dup.duplicate);
        }
      }
      
      console.log(`📊 중복 그룹: ${duplicateGroups.size}개\n`);
      
      // 중복 샘플 출력
      let sampleCount = 0;
      for (const [key, group] of duplicateGroups.entries()) {
        if (sampleCount >= 10) break;
        const [phone, date, time] = key.split('_');
        console.log(`   그룹 ${sampleCount + 1}: ${phone} (${date} ${time})`);
        console.log(`     - ${group.length}건 중복`);
        group.forEach((b, i) => {
          console.log(`       ${i + 1}. ID: ${b.id}, 이름: ${b.name}, 원본 전화번호: ${b.phone}, 생성일: ${b.created_at}`);
        });
        sampleCount++;
      }
      console.log('');
      
      // 중복 제거 (더 최근 데이터 유지)
      if (!dryRun) {
        console.log('🗑️  중복 데이터 제거 중...');
        let deletedCount = 0;
        let deleteErrorCount = 0;
        
        for (const [key, group] of duplicateGroups.entries()) {
          // 생성일 기준으로 정렬 (최신 것 유지)
          const sorted = group.sort((a, b) => {
            const dateA = new Date(a.created_at || a.id);
            const dateB = new Date(b.created_at || b.id);
            return dateB - dateA; // 최신 것이 앞에
          });
          
          // 첫 번째(최신) 것만 유지하고 나머지 삭제
          for (let i = 1; i < sorted.length; i++) {
            const { error } = await supabase
              .from('bookings')
              .delete()
              .eq('id', sorted[i].id);
            
            if (error) {
              console.error(`❌ 삭제 실패 (ID: ${sorted[i].id}):`, error);
              deleteErrorCount++;
            } else {
              deletedCount++;
            }
          }
        }
        
        console.log(`✅ 중복 제거 완료: ${deletedCount}건 삭제, ${deleteErrorCount}건 오류\n`);
      }
    }
  }
  
  // 7. 최종 통계
  console.log('='.repeat(60));
  console.log('📊 최종 통계');
  console.log('='.repeat(60));
  console.log(`전체 예약: ${allBookings.length}건`);
  
  if (dryRun) {
    console.log('\n💡 실제 수정을 하려면 --dry-run 옵션을 제거하고 다시 실행하세요.');
  } else {
    console.log('\n✅ 작업 완료!');
  }
}

fixPhoneNormalization()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('\n❌ 작업 실패:', err);
    process.exit(1);
  });


 * 
 * 1. 82로 시작하는 전화번호를 010으로 정규화
 * 2. 정규화된 전화번호 기준으로 중복 데이터 찾기
 * 3. 중복 데이터 제거 (더 최근 데이터 유지)
 * 4. 전화번호가 null인 데이터 확인
 * 
 * 사용법:
 * node scripts/fix-phone-normalization.js [--dry-run]
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

// 전화번호 정규화 함수
function normalizePhone(phone) {
  if (!phone) return null;
  
  // 1. 모든 공백, 하이픈, 괄호, +, 콤마 제거
  let cleaned = phone.toString().replace(/[\s\-+(),]/g, '');
  
  // 2. 82로 시작하면 0으로 변환
  if (cleaned.startsWith('82')) {
    cleaned = '0' + cleaned.substring(2);
  }
  
  // 3. 01로 시작하고 10자리면 010으로 변경
  if (cleaned.startsWith('01') && cleaned.length === 10) {
    cleaned = '010' + cleaned.substring(2);
  }

  // 4. 10으로 시작하고 10자리면 앞에 0을 붙여 010으로 보정
  if (cleaned.startsWith('10') && cleaned.length === 10) {
    cleaned = '0' + cleaned;
  }
  
  // 5. 유효성 검사 (11자리 숫자만 허용)
  if (!/^010\d{8}$/.test(cleaned)) {
    return null;
  }
  
  return cleaned; // 숫자만 반환 (하이픈 없음)
}

async function fixPhoneNormalization() {
  const dryRun = process.argv.includes('--dry-run');
  
  console.log('🔍 전화번호 정규화 및 중복 제거 시작...\n');
  if (dryRun) {
    console.log('⚠️  DRY RUN 모드: 실제 수정 없이 확인만 수행합니다.\n');
  }
  
  // bookings와 customers 둘 다 처리
  const tables = [
    { name: 'bookings', hasDate: true },
    { name: 'customers', hasDate: false }
  ];
  
  let allBookings = []; // 중복 제거는 bookings만
  
  for (const table of tables) {
    console.log(`\n📊 ${table.name} 테이블 처리 중...`);
    
    // 모든 데이터 가져오기
    let allData = [];
    let from = 0;
    const pageSize = 1000;
    let hasMore = true;
    
    while (hasMore) {
      const { data, error } = await supabase
        .from(table.name)
        .select('*')
        .range(from, from + pageSize - 1);
      
      if (error) {
        console.error(`❌ ${table.name} 로드 오류:`, error);
        break;
      }
      
      if (data && data.length > 0) {
        allData = [...allData, ...data];
        from += pageSize;
        hasMore = data.length === pageSize;
      } else {
        hasMore = false;
      }
    }
    
    console.log(`✅ ${table.name}: ${allData.length}건 로드 완료`);
    
    if (table.name === 'bookings') {
      allBookings = allData;
    }
    
    // 2. 전화번호가 null인 데이터 확인
    const noPhoneData = allData.filter(item => !item.phone || item.phone.toString().trim() === '');
    console.log(`📋 전화번호 없는 ${table.name}: ${noPhoneData.length}건`);
    if (noPhoneData.length > 0 && noPhoneData.length <= 10) {
      console.log('   샘플:');
      noPhoneData.slice(0, 5).forEach(item => {
        const nameField = table.hasDate ? 'name' : 'name';
        const dateField = table.hasDate ? `, 날짜: ${item.date}` : '';
        console.log(`     - ID: ${item.id}, 이름: ${item[nameField] || 'N/A'}${dateField}`);
      });
    }
    console.log('');
    
    // 3. 10으로 시작하는 10자리 전화번호 찾기 (10xxxxxxxx → 010xxxxxxxx)
    const phone10Pattern = allData.filter(item => {
      if (!item.phone) return false;
      const cleaned = item.phone.toString().replace(/[\s\-+(),]/g, '');
      return cleaned.startsWith('10') && cleaned.length === 10;
    });
    
    console.log(`📋 10으로 시작하는 10자리 전화번호: ${phone10Pattern.length}건`);
    if (phone10Pattern.length > 0) {
      console.log('   샘플:');
      phone10Pattern.slice(0, 10).forEach(item => {
        const normalized = normalizePhone(item.phone);
        const nameField = table.hasDate ? item.name : item.name;
        const dateField = table.hasDate ? `, 날짜: ${item.date}` : '';
        console.log(`     - ID: ${item.id}, 이름: ${nameField || 'N/A'}, 원본: ${item.phone} → 정규화: ${normalized}${dateField}`);
      });
    }
    console.log('');
    
    // 4. 82로 시작하는 전화번호 찾기
    const phone82Pattern = allData.filter(item => {
      if (!item.phone) return false;
      const cleaned = item.phone.toString().replace(/[\s\-+()]/g, '');
      return cleaned.startsWith('82');
    });
    
    console.log(`📋 82로 시작하는 전화번호: ${phone82Pattern.length}건`);
    if (phone82Pattern.length > 0) {
      console.log('   샘플:');
      phone82Pattern.slice(0, 10).forEach(item => {
        const normalized = normalizePhone(item.phone);
        const nameField = table.hasDate ? item.name : item.name;
        const dateField = table.hasDate ? `, 날짜: ${item.date}` : '';
        console.log(`     - ID: ${item.id}, 이름: ${nameField || 'N/A'}, 원본: ${item.phone} → 정규화: ${normalized}${dateField}`);
      });
    }
    console.log('');
    
    // 5. 정규화 필요 항목 합치기 (10xxxxxxxx + 82xxxxxxxx)
    const toUpdate = [...phone10Pattern, ...phone82Pattern];
    
    // 중복 제거 (같은 ID가 여러 패턴에 포함될 수 있음)
    const uniqueToUpdate = Array.from(
      new Map(toUpdate.map(item => [item.id, item])).values()
    );
    
    if (uniqueToUpdate.length > 0 && !dryRun) {
      console.log(`🔧 ${table.name} 전화번호 정규화 중...`);
      let updatedCount = 0;
      let errorCount = 0;
      
      for (const item of uniqueToUpdate) {
        const normalized = normalizePhone(item.phone);
        if (normalized && normalized !== item.phone) {
          const { error } = await supabase
            .from(table.name)
            .update({ phone: normalized })
            .eq('id', item.id);
          
          if (error) {
            console.error(`❌ 업데이트 실패 (ID: ${item.id}):`, error);
            errorCount++;
          } else {
            updatedCount++;
          }
        }
      }
      
      console.log(`✅ ${table.name} 정규화 완료: ${updatedCount}건 업데이트, ${errorCount}건 오류\n`);
    } else if (uniqueToUpdate.length > 0) {
      console.log(`💡 ${table.name}에서 ${uniqueToUpdate.length}건이 정규화 대상입니다.\n`);
    }
  }
  
  // 6. bookings 중복 제거 (기존 로직 유지)
  
  // 6. bookings 중복 제거 (기존 로직 유지)
  if (allBookings.length > 0) {
    console.log('\n🔍 bookings 중복 데이터 찾기 중...');
    const phoneMap = new Map();
    const duplicates = [];
    
    for (const booking of allBookings) {
      const normalized = normalizePhone(booking.phone);
      if (!normalized) continue;
      
      const key = `${normalized}_${booking.date}_${booking.time}`;
      
      if (phoneMap.has(key)) {
        const existing = phoneMap.get(key);
        duplicates.push({
          key,
          existing,
          duplicate: booking,
        });
      } else {
        phoneMap.set(key, booking);
      }
    }
    
    console.log(`📋 중복 예약 발견: ${duplicates.length}건\n`);
    
    if (duplicates.length > 0) {
      // 중복 그룹별로 정리
      const duplicateGroups = new Map();
      for (const dup of duplicates) {
        if (!duplicateGroups.has(dup.key)) {
          duplicateGroups.set(dup.key, [dup.existing, dup.duplicate]);
        } else {
          duplicateGroups.get(dup.key).push(dup.duplicate);
        }
      }
      
      console.log(`📊 중복 그룹: ${duplicateGroups.size}개\n`);
      
      // 중복 샘플 출력
      let sampleCount = 0;
      for (const [key, group] of duplicateGroups.entries()) {
        if (sampleCount >= 10) break;
        const [phone, date, time] = key.split('_');
        console.log(`   그룹 ${sampleCount + 1}: ${phone} (${date} ${time})`);
        console.log(`     - ${group.length}건 중복`);
        group.forEach((b, i) => {
          console.log(`       ${i + 1}. ID: ${b.id}, 이름: ${b.name}, 원본 전화번호: ${b.phone}, 생성일: ${b.created_at}`);
        });
        sampleCount++;
      }
      console.log('');
      
      // 중복 제거 (더 최근 데이터 유지)
      if (!dryRun) {
        console.log('🗑️  중복 데이터 제거 중...');
        let deletedCount = 0;
        let deleteErrorCount = 0;
        
        for (const [key, group] of duplicateGroups.entries()) {
          // 생성일 기준으로 정렬 (최신 것 유지)
          const sorted = group.sort((a, b) => {
            const dateA = new Date(a.created_at || a.id);
            const dateB = new Date(b.created_at || b.id);
            return dateB - dateA; // 최신 것이 앞에
          });
          
          // 첫 번째(최신) 것만 유지하고 나머지 삭제
          for (let i = 1; i < sorted.length; i++) {
            const { error } = await supabase
              .from('bookings')
              .delete()
              .eq('id', sorted[i].id);
            
            if (error) {
              console.error(`❌ 삭제 실패 (ID: ${sorted[i].id}):`, error);
              deleteErrorCount++;
            } else {
              deletedCount++;
            }
          }
        }
        
        console.log(`✅ 중복 제거 완료: ${deletedCount}건 삭제, ${deleteErrorCount}건 오류\n`);
      }
    }
  }
  
  // 7. 최종 통계
  console.log('='.repeat(60));
  console.log('📊 최종 통계');
  console.log('='.repeat(60));
  console.log(`전체 예약: ${allBookings.length}건`);
  
  if (dryRun) {
    console.log('\n💡 실제 수정을 하려면 --dry-run 옵션을 제거하고 다시 실행하세요.');
  } else {
    console.log('\n✅ 작업 완료!');
  }
}

fixPhoneNormalization()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('\n❌ 작업 실패:', err);
    process.exit(1);
  });


 * 
 * 1. 82로 시작하는 전화번호를 010으로 정규화
 * 2. 정규화된 전화번호 기준으로 중복 데이터 찾기
 * 3. 중복 데이터 제거 (더 최근 데이터 유지)
 * 4. 전화번호가 null인 데이터 확인
 * 
 * 사용법:
 * node scripts/fix-phone-normalization.js [--dry-run]
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

// 전화번호 정규화 함수
function normalizePhone(phone) {
  if (!phone) return null;
  
  // 1. 모든 공백, 하이픈, 괄호, +, 콤마 제거
  let cleaned = phone.toString().replace(/[\s\-+(),]/g, '');
  
  // 2. 82로 시작하면 0으로 변환
  if (cleaned.startsWith('82')) {
    cleaned = '0' + cleaned.substring(2);
  }
  
  // 3. 01로 시작하고 10자리면 010으로 변경
  if (cleaned.startsWith('01') && cleaned.length === 10) {
    cleaned = '010' + cleaned.substring(2);
  }

  // 4. 10으로 시작하고 10자리면 앞에 0을 붙여 010으로 보정
  if (cleaned.startsWith('10') && cleaned.length === 10) {
    cleaned = '0' + cleaned;
  }
  
  // 5. 유효성 검사 (11자리 숫자만 허용)
  if (!/^010\d{8}$/.test(cleaned)) {
    return null;
  }
  
  return cleaned; // 숫자만 반환 (하이픈 없음)
}

async function fixPhoneNormalization() {
  const dryRun = process.argv.includes('--dry-run');
  
  console.log('🔍 전화번호 정규화 및 중복 제거 시작...\n');
  if (dryRun) {
    console.log('⚠️  DRY RUN 모드: 실제 수정 없이 확인만 수행합니다.\n');
  }
  
  // bookings와 customers 둘 다 처리
  const tables = [
    { name: 'bookings', hasDate: true },
    { name: 'customers', hasDate: false }
  ];
  
  let allBookings = []; // 중복 제거는 bookings만
  
  for (const table of tables) {
    console.log(`\n📊 ${table.name} 테이블 처리 중...`);
    
    // 모든 데이터 가져오기
    let allData = [];
    let from = 0;
    const pageSize = 1000;
    let hasMore = true;
    
    while (hasMore) {
      const { data, error } = await supabase
        .from(table.name)
        .select('*')
        .range(from, from + pageSize - 1);
      
      if (error) {
        console.error(`❌ ${table.name} 로드 오류:`, error);
        break;
      }
      
      if (data && data.length > 0) {
        allData = [...allData, ...data];
        from += pageSize;
        hasMore = data.length === pageSize;
      } else {
        hasMore = false;
      }
    }
    
    console.log(`✅ ${table.name}: ${allData.length}건 로드 완료`);
    
    if (table.name === 'bookings') {
      allBookings = allData;
    }
    
    // 2. 전화번호가 null인 데이터 확인
    const noPhoneData = allData.filter(item => !item.phone || item.phone.toString().trim() === '');
    console.log(`📋 전화번호 없는 ${table.name}: ${noPhoneData.length}건`);
    if (noPhoneData.length > 0 && noPhoneData.length <= 10) {
      console.log('   샘플:');
      noPhoneData.slice(0, 5).forEach(item => {
        const nameField = table.hasDate ? 'name' : 'name';
        const dateField = table.hasDate ? `, 날짜: ${item.date}` : '';
        console.log(`     - ID: ${item.id}, 이름: ${item[nameField] || 'N/A'}${dateField}`);
      });
    }
    console.log('');
    
    // 3. 10으로 시작하는 10자리 전화번호 찾기 (10xxxxxxxx → 010xxxxxxxx)
    const phone10Pattern = allData.filter(item => {
      if (!item.phone) return false;
      const cleaned = item.phone.toString().replace(/[\s\-+(),]/g, '');
      return cleaned.startsWith('10') && cleaned.length === 10;
    });
    
    console.log(`📋 10으로 시작하는 10자리 전화번호: ${phone10Pattern.length}건`);
    if (phone10Pattern.length > 0) {
      console.log('   샘플:');
      phone10Pattern.slice(0, 10).forEach(item => {
        const normalized = normalizePhone(item.phone);
        const nameField = table.hasDate ? item.name : item.name;
        const dateField = table.hasDate ? `, 날짜: ${item.date}` : '';
        console.log(`     - ID: ${item.id}, 이름: ${nameField || 'N/A'}, 원본: ${item.phone} → 정규화: ${normalized}${dateField}`);
      });
    }
    console.log('');
    
    // 4. 82로 시작하는 전화번호 찾기
    const phone82Pattern = allData.filter(item => {
      if (!item.phone) return false;
      const cleaned = item.phone.toString().replace(/[\s\-+()]/g, '');
      return cleaned.startsWith('82');
    });
    
    console.log(`📋 82로 시작하는 전화번호: ${phone82Pattern.length}건`);
    if (phone82Pattern.length > 0) {
      console.log('   샘플:');
      phone82Pattern.slice(0, 10).forEach(item => {
        const normalized = normalizePhone(item.phone);
        const nameField = table.hasDate ? item.name : item.name;
        const dateField = table.hasDate ? `, 날짜: ${item.date}` : '';
        console.log(`     - ID: ${item.id}, 이름: ${nameField || 'N/A'}, 원본: ${item.phone} → 정규화: ${normalized}${dateField}`);
      });
    }
    console.log('');
    
    // 5. 정규화 필요 항목 합치기 (10xxxxxxxx + 82xxxxxxxx)
    const toUpdate = [...phone10Pattern, ...phone82Pattern];
    
    // 중복 제거 (같은 ID가 여러 패턴에 포함될 수 있음)
    const uniqueToUpdate = Array.from(
      new Map(toUpdate.map(item => [item.id, item])).values()
    );
    
    if (uniqueToUpdate.length > 0 && !dryRun) {
      console.log(`🔧 ${table.name} 전화번호 정규화 중...`);
      let updatedCount = 0;
      let errorCount = 0;
      
      for (const item of uniqueToUpdate) {
        const normalized = normalizePhone(item.phone);
        if (normalized && normalized !== item.phone) {
          const { error } = await supabase
            .from(table.name)
            .update({ phone: normalized })
            .eq('id', item.id);
          
          if (error) {
            console.error(`❌ 업데이트 실패 (ID: ${item.id}):`, error);
            errorCount++;
          } else {
            updatedCount++;
          }
        }
      }
      
      console.log(`✅ ${table.name} 정규화 완료: ${updatedCount}건 업데이트, ${errorCount}건 오류\n`);
    } else if (uniqueToUpdate.length > 0) {
      console.log(`💡 ${table.name}에서 ${uniqueToUpdate.length}건이 정규화 대상입니다.\n`);
    }
  }
  
  // 6. bookings 중복 제거 (기존 로직 유지)
  
  // 6. bookings 중복 제거 (기존 로직 유지)
  if (allBookings.length > 0) {
    console.log('\n🔍 bookings 중복 데이터 찾기 중...');
    const phoneMap = new Map();
    const duplicates = [];
    
    for (const booking of allBookings) {
      const normalized = normalizePhone(booking.phone);
      if (!normalized) continue;
      
      const key = `${normalized}_${booking.date}_${booking.time}`;
      
      if (phoneMap.has(key)) {
        const existing = phoneMap.get(key);
        duplicates.push({
          key,
          existing,
          duplicate: booking,
        });
      } else {
        phoneMap.set(key, booking);
      }
    }
    
    console.log(`📋 중복 예약 발견: ${duplicates.length}건\n`);
    
    if (duplicates.length > 0) {
      // 중복 그룹별로 정리
      const duplicateGroups = new Map();
      for (const dup of duplicates) {
        if (!duplicateGroups.has(dup.key)) {
          duplicateGroups.set(dup.key, [dup.existing, dup.duplicate]);
        } else {
          duplicateGroups.get(dup.key).push(dup.duplicate);
        }
      }
      
      console.log(`📊 중복 그룹: ${duplicateGroups.size}개\n`);
      
      // 중복 샘플 출력
      let sampleCount = 0;
      for (const [key, group] of duplicateGroups.entries()) {
        if (sampleCount >= 10) break;
        const [phone, date, time] = key.split('_');
        console.log(`   그룹 ${sampleCount + 1}: ${phone} (${date} ${time})`);
        console.log(`     - ${group.length}건 중복`);
        group.forEach((b, i) => {
          console.log(`       ${i + 1}. ID: ${b.id}, 이름: ${b.name}, 원본 전화번호: ${b.phone}, 생성일: ${b.created_at}`);
        });
        sampleCount++;
      }
      console.log('');
      
      // 중복 제거 (더 최근 데이터 유지)
      if (!dryRun) {
        console.log('🗑️  중복 데이터 제거 중...');
        let deletedCount = 0;
        let deleteErrorCount = 0;
        
        for (const [key, group] of duplicateGroups.entries()) {
          // 생성일 기준으로 정렬 (최신 것 유지)
          const sorted = group.sort((a, b) => {
            const dateA = new Date(a.created_at || a.id);
            const dateB = new Date(b.created_at || b.id);
            return dateB - dateA; // 최신 것이 앞에
          });
          
          // 첫 번째(최신) 것만 유지하고 나머지 삭제
          for (let i = 1; i < sorted.length; i++) {
            const { error } = await supabase
              .from('bookings')
              .delete()
              .eq('id', sorted[i].id);
            
            if (error) {
              console.error(`❌ 삭제 실패 (ID: ${sorted[i].id}):`, error);
              deleteErrorCount++;
            } else {
              deletedCount++;
            }
          }
        }
        
        console.log(`✅ 중복 제거 완료: ${deletedCount}건 삭제, ${deleteErrorCount}건 오류\n`);
      }
    }
  }
  
  // 7. 최종 통계
  console.log('='.repeat(60));
  console.log('📊 최종 통계');
  console.log('='.repeat(60));
  console.log(`전체 예약: ${allBookings.length}건`);
  
  if (dryRun) {
    console.log('\n💡 실제 수정을 하려면 --dry-run 옵션을 제거하고 다시 실행하세요.');
  } else {
    console.log('\n✅ 작업 완료!');
  }
}

fixPhoneNormalization()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('\n❌ 작업 실패:', err);
    process.exit(1);
  });


 * 
 * 1. 82로 시작하는 전화번호를 010으로 정규화
 * 2. 정규화된 전화번호 기준으로 중복 데이터 찾기
 * 3. 중복 데이터 제거 (더 최근 데이터 유지)
 * 4. 전화번호가 null인 데이터 확인
 * 
 * 사용법:
 * node scripts/fix-phone-normalization.js [--dry-run]
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

// 전화번호 정규화 함수
function normalizePhone(phone) {
  if (!phone) return null;
  
  // 1. 모든 공백, 하이픈, 괄호, +, 콤마 제거
  let cleaned = phone.toString().replace(/[\s\-+(),]/g, '');
  
  // 2. 82로 시작하면 0으로 변환
  if (cleaned.startsWith('82')) {
    cleaned = '0' + cleaned.substring(2);
  }
  
  // 3. 01로 시작하고 10자리면 010으로 변경
  if (cleaned.startsWith('01') && cleaned.length === 10) {
    cleaned = '010' + cleaned.substring(2);
  }

  // 4. 10으로 시작하고 10자리면 앞에 0을 붙여 010으로 보정
  if (cleaned.startsWith('10') && cleaned.length === 10) {
    cleaned = '0' + cleaned;
  }
  
  // 5. 유효성 검사 (11자리 숫자만 허용)
  if (!/^010\d{8}$/.test(cleaned)) {
    return null;
  }
  
  return cleaned; // 숫자만 반환 (하이픈 없음)
}

async function fixPhoneNormalization() {
  const dryRun = process.argv.includes('--dry-run');
  
  console.log('🔍 전화번호 정규화 및 중복 제거 시작...\n');
  if (dryRun) {
    console.log('⚠️  DRY RUN 모드: 실제 수정 없이 확인만 수행합니다.\n');
  }
  
  // bookings와 customers 둘 다 처리
  const tables = [
    { name: 'bookings', hasDate: true },
    { name: 'customers', hasDate: false }
  ];
  
  let allBookings = []; // 중복 제거는 bookings만
  
  for (const table of tables) {
    console.log(`\n📊 ${table.name} 테이블 처리 중...`);
    
    // 모든 데이터 가져오기
    let allData = [];
    let from = 0;
    const pageSize = 1000;
    let hasMore = true;
    
    while (hasMore) {
      const { data, error } = await supabase
        .from(table.name)
        .select('*')
        .range(from, from + pageSize - 1);
      
      if (error) {
        console.error(`❌ ${table.name} 로드 오류:`, error);
        break;
      }
      
      if (data && data.length > 0) {
        allData = [...allData, ...data];
        from += pageSize;
        hasMore = data.length === pageSize;
      } else {
        hasMore = false;
      }
    }
    
    console.log(`✅ ${table.name}: ${allData.length}건 로드 완료`);
    
    if (table.name === 'bookings') {
      allBookings = allData;
    }
    
    // 2. 전화번호가 null인 데이터 확인
    const noPhoneData = allData.filter(item => !item.phone || item.phone.toString().trim() === '');
    console.log(`📋 전화번호 없는 ${table.name}: ${noPhoneData.length}건`);
    if (noPhoneData.length > 0 && noPhoneData.length <= 10) {
      console.log('   샘플:');
      noPhoneData.slice(0, 5).forEach(item => {
        const nameField = table.hasDate ? 'name' : 'name';
        const dateField = table.hasDate ? `, 날짜: ${item.date}` : '';
        console.log(`     - ID: ${item.id}, 이름: ${item[nameField] || 'N/A'}${dateField}`);
      });
    }
    console.log('');
    
    // 3. 10으로 시작하는 10자리 전화번호 찾기 (10xxxxxxxx → 010xxxxxxxx)
    const phone10Pattern = allData.filter(item => {
      if (!item.phone) return false;
      const cleaned = item.phone.toString().replace(/[\s\-+(),]/g, '');
      return cleaned.startsWith('10') && cleaned.length === 10;
    });
    
    console.log(`📋 10으로 시작하는 10자리 전화번호: ${phone10Pattern.length}건`);
    if (phone10Pattern.length > 0) {
      console.log('   샘플:');
      phone10Pattern.slice(0, 10).forEach(item => {
        const normalized = normalizePhone(item.phone);
        const nameField = table.hasDate ? item.name : item.name;
        const dateField = table.hasDate ? `, 날짜: ${item.date}` : '';
        console.log(`     - ID: ${item.id}, 이름: ${nameField || 'N/A'}, 원본: ${item.phone} → 정규화: ${normalized}${dateField}`);
      });
    }
    console.log('');
    
    // 4. 82로 시작하는 전화번호 찾기
    const phone82Pattern = allData.filter(item => {
      if (!item.phone) return false;
      const cleaned = item.phone.toString().replace(/[\s\-+()]/g, '');
      return cleaned.startsWith('82');
    });
    
    console.log(`📋 82로 시작하는 전화번호: ${phone82Pattern.length}건`);
    if (phone82Pattern.length > 0) {
      console.log('   샘플:');
      phone82Pattern.slice(0, 10).forEach(item => {
        const normalized = normalizePhone(item.phone);
        const nameField = table.hasDate ? item.name : item.name;
        const dateField = table.hasDate ? `, 날짜: ${item.date}` : '';
        console.log(`     - ID: ${item.id}, 이름: ${nameField || 'N/A'}, 원본: ${item.phone} → 정규화: ${normalized}${dateField}`);
      });
    }
    console.log('');
    
    // 5. 정규화 필요 항목 합치기 (10xxxxxxxx + 82xxxxxxxx)
    const toUpdate = [...phone10Pattern, ...phone82Pattern];
    
    // 중복 제거 (같은 ID가 여러 패턴에 포함될 수 있음)
    const uniqueToUpdate = Array.from(
      new Map(toUpdate.map(item => [item.id, item])).values()
    );
    
    if (uniqueToUpdate.length > 0 && !dryRun) {
      console.log(`🔧 ${table.name} 전화번호 정규화 중...`);
      let updatedCount = 0;
      let errorCount = 0;
      
      for (const item of uniqueToUpdate) {
        const normalized = normalizePhone(item.phone);
        if (normalized && normalized !== item.phone) {
          const { error } = await supabase
            .from(table.name)
            .update({ phone: normalized })
            .eq('id', item.id);
          
          if (error) {
            console.error(`❌ 업데이트 실패 (ID: ${item.id}):`, error);
            errorCount++;
          } else {
            updatedCount++;
          }
        }
      }
      
      console.log(`✅ ${table.name} 정규화 완료: ${updatedCount}건 업데이트, ${errorCount}건 오류\n`);
    } else if (uniqueToUpdate.length > 0) {
      console.log(`💡 ${table.name}에서 ${uniqueToUpdate.length}건이 정규화 대상입니다.\n`);
    }
  }
  
  // 6. bookings 중복 제거 (기존 로직 유지)
  
  // 6. bookings 중복 제거 (기존 로직 유지)
  if (allBookings.length > 0) {
    console.log('\n🔍 bookings 중복 데이터 찾기 중...');
    const phoneMap = new Map();
    const duplicates = [];
    
    for (const booking of allBookings) {
      const normalized = normalizePhone(booking.phone);
      if (!normalized) continue;
      
      const key = `${normalized}_${booking.date}_${booking.time}`;
      
      if (phoneMap.has(key)) {
        const existing = phoneMap.get(key);
        duplicates.push({
          key,
          existing,
          duplicate: booking,
        });
      } else {
        phoneMap.set(key, booking);
      }
    }
    
    console.log(`📋 중복 예약 발견: ${duplicates.length}건\n`);
    
    if (duplicates.length > 0) {
      // 중복 그룹별로 정리
      const duplicateGroups = new Map();
      for (const dup of duplicates) {
        if (!duplicateGroups.has(dup.key)) {
          duplicateGroups.set(dup.key, [dup.existing, dup.duplicate]);
        } else {
          duplicateGroups.get(dup.key).push(dup.duplicate);
        }
      }
      
      console.log(`📊 중복 그룹: ${duplicateGroups.size}개\n`);
      
      // 중복 샘플 출력
      let sampleCount = 0;
      for (const [key, group] of duplicateGroups.entries()) {
        if (sampleCount >= 10) break;
        const [phone, date, time] = key.split('_');
        console.log(`   그룹 ${sampleCount + 1}: ${phone} (${date} ${time})`);
        console.log(`     - ${group.length}건 중복`);
        group.forEach((b, i) => {
          console.log(`       ${i + 1}. ID: ${b.id}, 이름: ${b.name}, 원본 전화번호: ${b.phone}, 생성일: ${b.created_at}`);
        });
        sampleCount++;
      }
      console.log('');
      
      // 중복 제거 (더 최근 데이터 유지)
      if (!dryRun) {
        console.log('🗑️  중복 데이터 제거 중...');
        let deletedCount = 0;
        let deleteErrorCount = 0;
        
        for (const [key, group] of duplicateGroups.entries()) {
          // 생성일 기준으로 정렬 (최신 것 유지)
          const sorted = group.sort((a, b) => {
            const dateA = new Date(a.created_at || a.id);
            const dateB = new Date(b.created_at || b.id);
            return dateB - dateA; // 최신 것이 앞에
          });
          
          // 첫 번째(최신) 것만 유지하고 나머지 삭제
          for (let i = 1; i < sorted.length; i++) {
            const { error } = await supabase
              .from('bookings')
              .delete()
              .eq('id', sorted[i].id);
            
            if (error) {
              console.error(`❌ 삭제 실패 (ID: ${sorted[i].id}):`, error);
              deleteErrorCount++;
            } else {
              deletedCount++;
            }
          }
        }
        
        console.log(`✅ 중복 제거 완료: ${deletedCount}건 삭제, ${deleteErrorCount}건 오류\n`);
      }
    }
  }
  
  // 7. 최종 통계
  console.log('='.repeat(60));
  console.log('📊 최종 통계');
  console.log('='.repeat(60));
  console.log(`전체 예약: ${allBookings.length}건`);
  
  if (dryRun) {
    console.log('\n💡 실제 수정을 하려면 --dry-run 옵션을 제거하고 다시 실행하세요.');
  } else {
    console.log('\n✅ 작업 완료!');
  }
}

fixPhoneNormalization()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('\n❌ 작업 실패:', err);
    process.exit(1);
  });


 * 
 * 1. 82로 시작하는 전화번호를 010으로 정규화
 * 2. 정규화된 전화번호 기준으로 중복 데이터 찾기
 * 3. 중복 데이터 제거 (더 최근 데이터 유지)
 * 4. 전화번호가 null인 데이터 확인
 * 
 * 사용법:
 * node scripts/fix-phone-normalization.js [--dry-run]
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

// 전화번호 정규화 함수
function normalizePhone(phone) {
  if (!phone) return null;
  
  // 1. 모든 공백, 하이픈, 괄호, +, 콤마 제거
  let cleaned = phone.toString().replace(/[\s\-+(),]/g, '');
  
  // 2. 82로 시작하면 0으로 변환
  if (cleaned.startsWith('82')) {
    cleaned = '0' + cleaned.substring(2);
  }
  
  // 3. 01로 시작하고 10자리면 010으로 변경
  if (cleaned.startsWith('01') && cleaned.length === 10) {
    cleaned = '010' + cleaned.substring(2);
  }

  // 4. 10으로 시작하고 10자리면 앞에 0을 붙여 010으로 보정
  if (cleaned.startsWith('10') && cleaned.length === 10) {
    cleaned = '0' + cleaned;
  }
  
  // 5. 유효성 검사 (11자리 숫자만 허용)
  if (!/^010\d{8}$/.test(cleaned)) {
    return null;
  }
  
  return cleaned; // 숫자만 반환 (하이픈 없음)
}

async function fixPhoneNormalization() {
  const dryRun = process.argv.includes('--dry-run');
  
  console.log('🔍 전화번호 정규화 및 중복 제거 시작...\n');
  if (dryRun) {
    console.log('⚠️  DRY RUN 모드: 실제 수정 없이 확인만 수행합니다.\n');
  }
  
  // bookings와 customers 둘 다 처리
  const tables = [
    { name: 'bookings', hasDate: true },
    { name: 'customers', hasDate: false }
  ];
  
  let allBookings = []; // 중복 제거는 bookings만
  
  for (const table of tables) {
    console.log(`\n📊 ${table.name} 테이블 처리 중...`);
    
    // 모든 데이터 가져오기
    let allData = [];
    let from = 0;
    const pageSize = 1000;
    let hasMore = true;
    
    while (hasMore) {
      const { data, error } = await supabase
        .from(table.name)
        .select('*')
        .range(from, from + pageSize - 1);
      
      if (error) {
        console.error(`❌ ${table.name} 로드 오류:`, error);
        break;
      }
      
      if (data && data.length > 0) {
        allData = [...allData, ...data];
        from += pageSize;
        hasMore = data.length === pageSize;
      } else {
        hasMore = false;
      }
    }
    
    console.log(`✅ ${table.name}: ${allData.length}건 로드 완료`);
    
    if (table.name === 'bookings') {
      allBookings = allData;
    }
    
    // 2. 전화번호가 null인 데이터 확인
    const noPhoneData = allData.filter(item => !item.phone || item.phone.toString().trim() === '');
    console.log(`📋 전화번호 없는 ${table.name}: ${noPhoneData.length}건`);
    if (noPhoneData.length > 0 && noPhoneData.length <= 10) {
      console.log('   샘플:');
      noPhoneData.slice(0, 5).forEach(item => {
        const nameField = table.hasDate ? 'name' : 'name';
        const dateField = table.hasDate ? `, 날짜: ${item.date}` : '';
        console.log(`     - ID: ${item.id}, 이름: ${item[nameField] || 'N/A'}${dateField}`);
      });
    }
    console.log('');
    
    // 3. 10으로 시작하는 10자리 전화번호 찾기 (10xxxxxxxx → 010xxxxxxxx)
    const phone10Pattern = allData.filter(item => {
      if (!item.phone) return false;
      const cleaned = item.phone.toString().replace(/[\s\-+(),]/g, '');
      return cleaned.startsWith('10') && cleaned.length === 10;
    });
    
    console.log(`📋 10으로 시작하는 10자리 전화번호: ${phone10Pattern.length}건`);
    if (phone10Pattern.length > 0) {
      console.log('   샘플:');
      phone10Pattern.slice(0, 10).forEach(item => {
        const normalized = normalizePhone(item.phone);
        const nameField = table.hasDate ? item.name : item.name;
        const dateField = table.hasDate ? `, 날짜: ${item.date}` : '';
        console.log(`     - ID: ${item.id}, 이름: ${nameField || 'N/A'}, 원본: ${item.phone} → 정규화: ${normalized}${dateField}`);
      });
    }
    console.log('');
    
    // 4. 82로 시작하는 전화번호 찾기
    const phone82Pattern = allData.filter(item => {
      if (!item.phone) return false;
      const cleaned = item.phone.toString().replace(/[\s\-+()]/g, '');
      return cleaned.startsWith('82');
    });
    
    console.log(`📋 82로 시작하는 전화번호: ${phone82Pattern.length}건`);
    if (phone82Pattern.length > 0) {
      console.log('   샘플:');
      phone82Pattern.slice(0, 10).forEach(item => {
        const normalized = normalizePhone(item.phone);
        const nameField = table.hasDate ? item.name : item.name;
        const dateField = table.hasDate ? `, 날짜: ${item.date}` : '';
        console.log(`     - ID: ${item.id}, 이름: ${nameField || 'N/A'}, 원본: ${item.phone} → 정규화: ${normalized}${dateField}`);
      });
    }
    console.log('');
    
    // 5. 정규화 필요 항목 합치기 (10xxxxxxxx + 82xxxxxxxx)
    const toUpdate = [...phone10Pattern, ...phone82Pattern];
    
    // 중복 제거 (같은 ID가 여러 패턴에 포함될 수 있음)
    const uniqueToUpdate = Array.from(
      new Map(toUpdate.map(item => [item.id, item])).values()
    );
    
    if (uniqueToUpdate.length > 0 && !dryRun) {
      console.log(`🔧 ${table.name} 전화번호 정규화 중...`);
      let updatedCount = 0;
      let errorCount = 0;
      
      for (const item of uniqueToUpdate) {
        const normalized = normalizePhone(item.phone);
        if (normalized && normalized !== item.phone) {
          const { error } = await supabase
            .from(table.name)
            .update({ phone: normalized })
            .eq('id', item.id);
          
          if (error) {
            console.error(`❌ 업데이트 실패 (ID: ${item.id}):`, error);
            errorCount++;
          } else {
            updatedCount++;
          }
        }
      }
      
      console.log(`✅ ${table.name} 정규화 완료: ${updatedCount}건 업데이트, ${errorCount}건 오류\n`);
    } else if (uniqueToUpdate.length > 0) {
      console.log(`💡 ${table.name}에서 ${uniqueToUpdate.length}건이 정규화 대상입니다.\n`);
    }
  }
  
  // 6. bookings 중복 제거 (기존 로직 유지)
  
  // 6. bookings 중복 제거 (기존 로직 유지)
  if (allBookings.length > 0) {
    console.log('\n🔍 bookings 중복 데이터 찾기 중...');
    const phoneMap = new Map();
    const duplicates = [];
    
    for (const booking of allBookings) {
      const normalized = normalizePhone(booking.phone);
      if (!normalized) continue;
      
      const key = `${normalized}_${booking.date}_${booking.time}`;
      
      if (phoneMap.has(key)) {
        const existing = phoneMap.get(key);
        duplicates.push({
          key,
          existing,
          duplicate: booking,
        });
      } else {
        phoneMap.set(key, booking);
      }
    }
    
    console.log(`📋 중복 예약 발견: ${duplicates.length}건\n`);
    
    if (duplicates.length > 0) {
      // 중복 그룹별로 정리
      const duplicateGroups = new Map();
      for (const dup of duplicates) {
        if (!duplicateGroups.has(dup.key)) {
          duplicateGroups.set(dup.key, [dup.existing, dup.duplicate]);
        } else {
          duplicateGroups.get(dup.key).push(dup.duplicate);
        }
      }
      
      console.log(`📊 중복 그룹: ${duplicateGroups.size}개\n`);
      
      // 중복 샘플 출력
      let sampleCount = 0;
      for (const [key, group] of duplicateGroups.entries()) {
        if (sampleCount >= 10) break;
        const [phone, date, time] = key.split('_');
        console.log(`   그룹 ${sampleCount + 1}: ${phone} (${date} ${time})`);
        console.log(`     - ${group.length}건 중복`);
        group.forEach((b, i) => {
          console.log(`       ${i + 1}. ID: ${b.id}, 이름: ${b.name}, 원본 전화번호: ${b.phone}, 생성일: ${b.created_at}`);
        });
        sampleCount++;
      }
      console.log('');
      
      // 중복 제거 (더 최근 데이터 유지)
      if (!dryRun) {
        console.log('🗑️  중복 데이터 제거 중...');
        let deletedCount = 0;
        let deleteErrorCount = 0;
        
        for (const [key, group] of duplicateGroups.entries()) {
          // 생성일 기준으로 정렬 (최신 것 유지)
          const sorted = group.sort((a, b) => {
            const dateA = new Date(a.created_at || a.id);
            const dateB = new Date(b.created_at || b.id);
            return dateB - dateA; // 최신 것이 앞에
          });
          
          // 첫 번째(최신) 것만 유지하고 나머지 삭제
          for (let i = 1; i < sorted.length; i++) {
            const { error } = await supabase
              .from('bookings')
              .delete()
              .eq('id', sorted[i].id);
            
            if (error) {
              console.error(`❌ 삭제 실패 (ID: ${sorted[i].id}):`, error);
              deleteErrorCount++;
            } else {
              deletedCount++;
            }
          }
        }
        
        console.log(`✅ 중복 제거 완료: ${deletedCount}건 삭제, ${deleteErrorCount}건 오류\n`);
      }
    }
  }
  
  // 7. 최종 통계
  console.log('='.repeat(60));
  console.log('📊 최종 통계');
  console.log('='.repeat(60));
  console.log(`전체 예약: ${allBookings.length}건`);
  
  if (dryRun) {
    console.log('\n💡 실제 수정을 하려면 --dry-run 옵션을 제거하고 다시 실행하세요.');
  } else {
    console.log('\n✅ 작업 완료!');
  }
}

fixPhoneNormalization()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('\n❌ 작업 실패:', err);
    process.exit(1);
  });

