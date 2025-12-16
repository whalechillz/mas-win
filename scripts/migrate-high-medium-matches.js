/**
 * High/Medium Confidence 매칭 마이그레이션 스크립트
 * 
 * High Confidence 18건과 Medium Confidence 55건을 처리하여 bookings 테이블에 추가
 * 
 * 처리 규칙:
 * 1. High Confidence: 자동 적용 (이름 + 이메일/날짜 일치)
 * 2. Medium Confidence: 재방문으로 처리 (이름 일치, 날짜 다름)
 * 3. 모든 매칭은 기존 고객에 재방문으로 추가
 * 
 * 사용법:
 * node scripts/migrate-high-medium-matches.js [--high-only] [--medium-only]
 * 
 * 옵션:
 *   --high-only    High Confidence만 처리
 *   --medium-only  Medium Confidence만 처리
 */

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// 환경 변수 로드
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Supabase 환경 변수가 설정되지 않았습니다.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// 보고서 파일에서 High/Medium Confidence 매칭 로드
function loadMatchesFromReport(reportPath) {
  if (!fs.existsSync(reportPath)) {
    console.error(`❌ 보고서 파일을 찾을 수 없습니다: ${reportPath}`);
    process.exit(1);
  }

  const report = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
  
  const highMatches = report.matches.filter(m => m.confidence === 'high');
  const mediumMatches = report.matches.filter(m => m.confidence === 'medium');
  
  return { highMatches, mediumMatches, report };
}

// 이름 정규화
function normalizeName(name) {
  if (!name) return '';
  return name.trim()
    .replace(/\s+/g, ' ')
    .replace(/\([^)]*\)/g, '')
    .trim();
}

// 날짜 추출
function extractDate(dateStr) {
  if (!dateStr) return null;
  try {
    const match = dateStr.match(/(\d{4})[\.\-](\d{1,2})[\.\-](\d{1,2})/);
    if (!match) return null;
    const [, year, month, day] = match;
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  } catch (e) {
    return null;
  }
}

// 시간 추출 (기본값 10:00)
function extractTime(dateStr) {
  if (!dateStr) return '10:00';
  try {
    const timeMatch = dateStr.match(/(\d{1,2}):(\d{2})/);
    if (timeMatch) {
      return `${timeMatch[1].padStart(2, '0')}:${timeMatch[2]}`;
    }
  } catch (e) {
    // ignore
  }
  return '10:00';
}

// 고객 찾기 또는 생성
async function findOrCreateCustomer(name, phone, email) {
  // 전화번호로 고객 찾기
  const { data: existingCustomer } = await supabase
    .from('customers')
    .select('*')
    .eq('phone', phone)
    .single();
  
  if (existingCustomer) {
    return existingCustomer;
  }
  
  // 이름으로도 검색 (전화번호가 다른 경우)
  const { data: nameMatch } = await supabase
    .from('customers')
    .select('*')
    .ilike('name', normalizeName(name).trim())
    .limit(1)
    .single();
  
  if (nameMatch) {
    // 전화번호 업데이트
    await supabase
      .from('customers')
      .update({ phone })
      .eq('id', nameMatch.id);
    return { ...nameMatch, phone };
  }
  
  // 새 고객 생성
  const { data: newCustomer, error } = await supabase
    .from('customers')
    .insert({
      name: normalizeName(name).trim(),
      phone,
      email: email || null,
    })
    .select()
    .single();
  
  if (error) {
    console.error(`❌ 고객 생성 실패: ${name}`, error);
    throw error;
  }
  
  return newCustomer;
}

// 방문 횟수 계산 (전화번호 기준)
async function getVisitCount(phone) {
  const { count } = await supabase
    .from('bookings')
    .select('*', { count: 'exact', head: true })
    .eq('phone', phone);
  
  return count || 0;
}

// 예약 생성
async function createBooking(bookingData) {
  // 중복 확인 (전화번호, 날짜, 시간)
  const { data: existing } = await supabase
    .from('bookings')
    .select('id')
    .eq('phone', bookingData.phone)
    .eq('date', bookingData.date)
    .eq('time', bookingData.time)
    .single();
  
  if (existing) {
    console.log(`  ⚠️  중복 예약 건너뜀: ${bookingData.name} (${bookingData.date} ${bookingData.time})`);
    return existing;
  }
  
  const { data, error } = await supabase
    .from('bookings')
    .insert(bookingData)
    .select()
    .single();
  
  if (error) {
    console.error(`❌ 예약 생성 실패:`, error);
    throw error;
  }
  
  return data;
}

// High/Medium Confidence 매칭 처리
async function processMatches(matches, confidence) {
  console.log(`\n🔍 ${confidence.toUpperCase()} Confidence 매칭 처리 시작...\n`);
  
  const results = {
    processed: [],
    errors: [],
    skipped: [],
  };
  
  for (const match of matches) {
    try {
      const matchId = `${confidence}-${match.original.name}-${match.original.date}`;
      console.log(`[${matchId}] 처리 중: ${match.original.name}`);
      
      // 이름 정규화
      const cleanName = normalizeName(match.original.name);
      
      // 고객 찾기 또는 생성
      const customer = await findOrCreateCustomer(
        cleanName,
        match.suggestedPhone,
        match.original.email || match.matched.email
      );
      
      // 방문 횟수 계산
      const visitCount = await getVisitCount(match.suggestedPhone);
      
      // 예약 생성
      const bookingDate = extractDate(match.original.date);
      const bookingTime = extractTime(match.original.date);
      
      if (!bookingDate) {
        console.log(`  ⚠️  날짜가 없어 건너뜀`);
        results.skipped.push({ match, reason: '날짜 없음' });
        continue;
      }
      
      const booking = await createBooking({
        name: cleanName,
        phone: match.suggestedPhone,
        date: bookingDate,
        time: bookingTime,
        club: '',
        service_type: match.original.service,
        is_as_visit: false, // High/Medium은 일반 재방문
        original_name: match.original.name,
        attendance_status: 'pending',
        notes: `${confidence.toUpperCase()} Confidence 매칭: ${match.reason}`,
      });
      
      results.processed.push({ match, booking, customer, visitCount });
      console.log(`  ✅ 예약 생성: ${booking.id} (${cleanName}, 방문 ${visitCount + 1}회)`);
      
    } catch (error) {
      console.error(`  ❌ 처리 실패:`, error);
      results.errors.push({ match, error: error.message });
    }
  }
  
  return results;
}

// 메인 실행
async function main() {
  try {
    // 보고서 파일 찾기
    const backupDir = path.join(__dirname, '..', 'backup');
    const files = fs.readdirSync(backupDir)
      .filter(f => f.startsWith('phone-matching-report-') && f.endsWith('.json'))
      .map(f => ({
        name: f,
        path: path.join(backupDir, f),
        time: fs.statSync(path.join(backupDir, f)).mtime.getTime(),
      }))
      .sort((a, b) => b.time - a.time);
    
    if (files.length === 0) {
      console.error('❌ 매칭 보고서 파일을 찾을 수 없습니다.');
      console.error('   먼저 node scripts/match-missing-phones.js 를 실행하세요.');
      process.exit(1);
    }
    
    const reportPath = files[0].path;
    console.log(`📄 보고서 파일 로드: ${reportPath}\n`);
    
    // 매칭 데이터 로드
    const { highMatches, mediumMatches, report } = loadMatchesFromReport(reportPath);
    
    console.log(`📊 매칭 데이터:`);
    console.log(`   - High Confidence: ${highMatches.length}건`);
    console.log(`   - Medium Confidence: ${mediumMatches.length}건\n`);
    
    // 옵션 확인
    const highOnly = process.argv.includes('--high-only');
    const mediumOnly = process.argv.includes('--medium-only');
    
    const allResults = {
      high: null,
      medium: null,
    };
    
    // High Confidence 처리
    if (!mediumOnly && highMatches.length > 0) {
      allResults.high = await processMatches(highMatches, 'high');
    }
    
    // Medium Confidence 처리
    if (!highOnly && mediumMatches.length > 0) {
      allResults.medium = await processMatches(mediumMatches, 'medium');
    }
    
    // 결과 요약
    console.log('\n' + '='.repeat(60));
    console.log('📊 처리 결과');
    console.log('='.repeat(60));
    
    if (allResults.high) {
      console.log(`\n✅ High Confidence 처리 완료: ${allResults.high.processed.length}건`);
      console.log(`   ⚠️  건너뛴 항목: ${allResults.high.skipped.length}건`);
      console.log(`   ❌ 오류: ${allResults.high.errors.length}건`);
    }
    
    if (allResults.medium) {
      console.log(`\n✅ Medium Confidence 처리 완료: ${allResults.medium.processed.length}건`);
      console.log(`   ⚠️  건너뛴 항목: ${allResults.medium.skipped.length}건`);
      console.log(`   ❌ 오류: ${allResults.medium.errors.length}건`);
    }
    
    const totalProcessed = (allResults.high?.processed.length || 0) + (allResults.medium?.processed.length || 0);
    const totalErrors = (allResults.high?.errors.length || 0) + (allResults.medium?.errors.length || 0);
    
    console.log(`\n📊 총 처리: ${totalProcessed}건`);
    console.log(`   ❌ 총 오류: ${totalErrors}건`);
    
    // 결과 저장
    const reportPath2 = path.join(__dirname, '..', 'backup', `high-medium-migration-${Date.now()}.json`);
    fs.writeFileSync(reportPath2, JSON.stringify(allResults, null, 2), 'utf8');
    console.log(`\n📄 결과 보고서 저장: ${reportPath2}`);
    
    console.log('\n✅ 마이그레이션 완료!\n');
    
  } catch (error) {
    console.error('\n❌ 마이그레이션 실패:', error);
    process.exit(1);
  }
}

main();







 * High/Medium Confidence 매칭 마이그레이션 스크립트
 * 
 * High Confidence 18건과 Medium Confidence 55건을 처리하여 bookings 테이블에 추가
 * 
 * 처리 규칙:
 * 1. High Confidence: 자동 적용 (이름 + 이메일/날짜 일치)
 * 2. Medium Confidence: 재방문으로 처리 (이름 일치, 날짜 다름)
 * 3. 모든 매칭은 기존 고객에 재방문으로 추가
 * 
 * 사용법:
 * node scripts/migrate-high-medium-matches.js [--high-only] [--medium-only]
 * 
 * 옵션:
 *   --high-only    High Confidence만 처리
 *   --medium-only  Medium Confidence만 처리
 */

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// 환경 변수 로드
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Supabase 환경 변수가 설정되지 않았습니다.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// 보고서 파일에서 High/Medium Confidence 매칭 로드
function loadMatchesFromReport(reportPath) {
  if (!fs.existsSync(reportPath)) {
    console.error(`❌ 보고서 파일을 찾을 수 없습니다: ${reportPath}`);
    process.exit(1);
  }

  const report = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
  
  const highMatches = report.matches.filter(m => m.confidence === 'high');
  const mediumMatches = report.matches.filter(m => m.confidence === 'medium');
  
  return { highMatches, mediumMatches, report };
}

// 이름 정규화
function normalizeName(name) {
  if (!name) return '';
  return name.trim()
    .replace(/\s+/g, ' ')
    .replace(/\([^)]*\)/g, '')
    .trim();
}

// 날짜 추출
function extractDate(dateStr) {
  if (!dateStr) return null;
  try {
    const match = dateStr.match(/(\d{4})[\.\-](\d{1,2})[\.\-](\d{1,2})/);
    if (!match) return null;
    const [, year, month, day] = match;
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  } catch (e) {
    return null;
  }
}

// 시간 추출 (기본값 10:00)
function extractTime(dateStr) {
  if (!dateStr) return '10:00';
  try {
    const timeMatch = dateStr.match(/(\d{1,2}):(\d{2})/);
    if (timeMatch) {
      return `${timeMatch[1].padStart(2, '0')}:${timeMatch[2]}`;
    }
  } catch (e) {
    // ignore
  }
  return '10:00';
}

// 고객 찾기 또는 생성
async function findOrCreateCustomer(name, phone, email) {
  // 전화번호로 고객 찾기
  const { data: existingCustomer } = await supabase
    .from('customers')
    .select('*')
    .eq('phone', phone)
    .single();
  
  if (existingCustomer) {
    return existingCustomer;
  }
  
  // 이름으로도 검색 (전화번호가 다른 경우)
  const { data: nameMatch } = await supabase
    .from('customers')
    .select('*')
    .ilike('name', normalizeName(name).trim())
    .limit(1)
    .single();
  
  if (nameMatch) {
    // 전화번호 업데이트
    await supabase
      .from('customers')
      .update({ phone })
      .eq('id', nameMatch.id);
    return { ...nameMatch, phone };
  }
  
  // 새 고객 생성
  const { data: newCustomer, error } = await supabase
    .from('customers')
    .insert({
      name: normalizeName(name).trim(),
      phone,
      email: email || null,
    })
    .select()
    .single();
  
  if (error) {
    console.error(`❌ 고객 생성 실패: ${name}`, error);
    throw error;
  }
  
  return newCustomer;
}

// 방문 횟수 계산 (전화번호 기준)
async function getVisitCount(phone) {
  const { count } = await supabase
    .from('bookings')
    .select('*', { count: 'exact', head: true })
    .eq('phone', phone);
  
  return count || 0;
}

// 예약 생성
async function createBooking(bookingData) {
  // 중복 확인 (전화번호, 날짜, 시간)
  const { data: existing } = await supabase
    .from('bookings')
    .select('id')
    .eq('phone', bookingData.phone)
    .eq('date', bookingData.date)
    .eq('time', bookingData.time)
    .single();
  
  if (existing) {
    console.log(`  ⚠️  중복 예약 건너뜀: ${bookingData.name} (${bookingData.date} ${bookingData.time})`);
    return existing;
  }
  
  const { data, error } = await supabase
    .from('bookings')
    .insert(bookingData)
    .select()
    .single();
  
  if (error) {
    console.error(`❌ 예약 생성 실패:`, error);
    throw error;
  }
  
  return data;
}

// High/Medium Confidence 매칭 처리
async function processMatches(matches, confidence) {
  console.log(`\n🔍 ${confidence.toUpperCase()} Confidence 매칭 처리 시작...\n`);
  
  const results = {
    processed: [],
    errors: [],
    skipped: [],
  };
  
  for (const match of matches) {
    try {
      const matchId = `${confidence}-${match.original.name}-${match.original.date}`;
      console.log(`[${matchId}] 처리 중: ${match.original.name}`);
      
      // 이름 정규화
      const cleanName = normalizeName(match.original.name);
      
      // 고객 찾기 또는 생성
      const customer = await findOrCreateCustomer(
        cleanName,
        match.suggestedPhone,
        match.original.email || match.matched.email
      );
      
      // 방문 횟수 계산
      const visitCount = await getVisitCount(match.suggestedPhone);
      
      // 예약 생성
      const bookingDate = extractDate(match.original.date);
      const bookingTime = extractTime(match.original.date);
      
      if (!bookingDate) {
        console.log(`  ⚠️  날짜가 없어 건너뜀`);
        results.skipped.push({ match, reason: '날짜 없음' });
        continue;
      }
      
      const booking = await createBooking({
        name: cleanName,
        phone: match.suggestedPhone,
        date: bookingDate,
        time: bookingTime,
        club: '',
        service_type: match.original.service,
        is_as_visit: false, // High/Medium은 일반 재방문
        original_name: match.original.name,
        attendance_status: 'pending',
        notes: `${confidence.toUpperCase()} Confidence 매칭: ${match.reason}`,
      });
      
      results.processed.push({ match, booking, customer, visitCount });
      console.log(`  ✅ 예약 생성: ${booking.id} (${cleanName}, 방문 ${visitCount + 1}회)`);
      
    } catch (error) {
      console.error(`  ❌ 처리 실패:`, error);
      results.errors.push({ match, error: error.message });
    }
  }
  
  return results;
}

// 메인 실행
async function main() {
  try {
    // 보고서 파일 찾기
    const backupDir = path.join(__dirname, '..', 'backup');
    const files = fs.readdirSync(backupDir)
      .filter(f => f.startsWith('phone-matching-report-') && f.endsWith('.json'))
      .map(f => ({
        name: f,
        path: path.join(backupDir, f),
        time: fs.statSync(path.join(backupDir, f)).mtime.getTime(),
      }))
      .sort((a, b) => b.time - a.time);
    
    if (files.length === 0) {
      console.error('❌ 매칭 보고서 파일을 찾을 수 없습니다.');
      console.error('   먼저 node scripts/match-missing-phones.js 를 실행하세요.');
      process.exit(1);
    }
    
    const reportPath = files[0].path;
    console.log(`📄 보고서 파일 로드: ${reportPath}\n`);
    
    // 매칭 데이터 로드
    const { highMatches, mediumMatches, report } = loadMatchesFromReport(reportPath);
    
    console.log(`📊 매칭 데이터:`);
    console.log(`   - High Confidence: ${highMatches.length}건`);
    console.log(`   - Medium Confidence: ${mediumMatches.length}건\n`);
    
    // 옵션 확인
    const highOnly = process.argv.includes('--high-only');
    const mediumOnly = process.argv.includes('--medium-only');
    
    const allResults = {
      high: null,
      medium: null,
    };
    
    // High Confidence 처리
    if (!mediumOnly && highMatches.length > 0) {
      allResults.high = await processMatches(highMatches, 'high');
    }
    
    // Medium Confidence 처리
    if (!highOnly && mediumMatches.length > 0) {
      allResults.medium = await processMatches(mediumMatches, 'medium');
    }
    
    // 결과 요약
    console.log('\n' + '='.repeat(60));
    console.log('📊 처리 결과');
    console.log('='.repeat(60));
    
    if (allResults.high) {
      console.log(`\n✅ High Confidence 처리 완료: ${allResults.high.processed.length}건`);
      console.log(`   ⚠️  건너뛴 항목: ${allResults.high.skipped.length}건`);
      console.log(`   ❌ 오류: ${allResults.high.errors.length}건`);
    }
    
    if (allResults.medium) {
      console.log(`\n✅ Medium Confidence 처리 완료: ${allResults.medium.processed.length}건`);
      console.log(`   ⚠️  건너뛴 항목: ${allResults.medium.skipped.length}건`);
      console.log(`   ❌ 오류: ${allResults.medium.errors.length}건`);
    }
    
    const totalProcessed = (allResults.high?.processed.length || 0) + (allResults.medium?.processed.length || 0);
    const totalErrors = (allResults.high?.errors.length || 0) + (allResults.medium?.errors.length || 0);
    
    console.log(`\n📊 총 처리: ${totalProcessed}건`);
    console.log(`   ❌ 총 오류: ${totalErrors}건`);
    
    // 결과 저장
    const reportPath2 = path.join(__dirname, '..', 'backup', `high-medium-migration-${Date.now()}.json`);
    fs.writeFileSync(reportPath2, JSON.stringify(allResults, null, 2), 'utf8');
    console.log(`\n📄 결과 보고서 저장: ${reportPath2}`);
    
    console.log('\n✅ 마이그레이션 완료!\n');
    
  } catch (error) {
    console.error('\n❌ 마이그레이션 실패:', error);
    process.exit(1);
  }
}

main();







 * High/Medium Confidence 매칭 마이그레이션 스크립트
 * 
 * High Confidence 18건과 Medium Confidence 55건을 처리하여 bookings 테이블에 추가
 * 
 * 처리 규칙:
 * 1. High Confidence: 자동 적용 (이름 + 이메일/날짜 일치)
 * 2. Medium Confidence: 재방문으로 처리 (이름 일치, 날짜 다름)
 * 3. 모든 매칭은 기존 고객에 재방문으로 추가
 * 
 * 사용법:
 * node scripts/migrate-high-medium-matches.js [--high-only] [--medium-only]
 * 
 * 옵션:
 *   --high-only    High Confidence만 처리
 *   --medium-only  Medium Confidence만 처리
 */

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// 환경 변수 로드
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Supabase 환경 변수가 설정되지 않았습니다.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// 보고서 파일에서 High/Medium Confidence 매칭 로드
function loadMatchesFromReport(reportPath) {
  if (!fs.existsSync(reportPath)) {
    console.error(`❌ 보고서 파일을 찾을 수 없습니다: ${reportPath}`);
    process.exit(1);
  }

  const report = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
  
  const highMatches = report.matches.filter(m => m.confidence === 'high');
  const mediumMatches = report.matches.filter(m => m.confidence === 'medium');
  
  return { highMatches, mediumMatches, report };
}

// 이름 정규화
function normalizeName(name) {
  if (!name) return '';
  return name.trim()
    .replace(/\s+/g, ' ')
    .replace(/\([^)]*\)/g, '')
    .trim();
}

// 날짜 추출
function extractDate(dateStr) {
  if (!dateStr) return null;
  try {
    const match = dateStr.match(/(\d{4})[\.\-](\d{1,2})[\.\-](\d{1,2})/);
    if (!match) return null;
    const [, year, month, day] = match;
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  } catch (e) {
    return null;
  }
}

// 시간 추출 (기본값 10:00)
function extractTime(dateStr) {
  if (!dateStr) return '10:00';
  try {
    const timeMatch = dateStr.match(/(\d{1,2}):(\d{2})/);
    if (timeMatch) {
      return `${timeMatch[1].padStart(2, '0')}:${timeMatch[2]}`;
    }
  } catch (e) {
    // ignore
  }
  return '10:00';
}

// 고객 찾기 또는 생성
async function findOrCreateCustomer(name, phone, email) {
  // 전화번호로 고객 찾기
  const { data: existingCustomer } = await supabase
    .from('customers')
    .select('*')
    .eq('phone', phone)
    .single();
  
  if (existingCustomer) {
    return existingCustomer;
  }
  
  // 이름으로도 검색 (전화번호가 다른 경우)
  const { data: nameMatch } = await supabase
    .from('customers')
    .select('*')
    .ilike('name', normalizeName(name).trim())
    .limit(1)
    .single();
  
  if (nameMatch) {
    // 전화번호 업데이트
    await supabase
      .from('customers')
      .update({ phone })
      .eq('id', nameMatch.id);
    return { ...nameMatch, phone };
  }
  
  // 새 고객 생성
  const { data: newCustomer, error } = await supabase
    .from('customers')
    .insert({
      name: normalizeName(name).trim(),
      phone,
      email: email || null,
    })
    .select()
    .single();
  
  if (error) {
    console.error(`❌ 고객 생성 실패: ${name}`, error);
    throw error;
  }
  
  return newCustomer;
}

// 방문 횟수 계산 (전화번호 기준)
async function getVisitCount(phone) {
  const { count } = await supabase
    .from('bookings')
    .select('*', { count: 'exact', head: true })
    .eq('phone', phone);
  
  return count || 0;
}

// 예약 생성
async function createBooking(bookingData) {
  // 중복 확인 (전화번호, 날짜, 시간)
  const { data: existing } = await supabase
    .from('bookings')
    .select('id')
    .eq('phone', bookingData.phone)
    .eq('date', bookingData.date)
    .eq('time', bookingData.time)
    .single();
  
  if (existing) {
    console.log(`  ⚠️  중복 예약 건너뜀: ${bookingData.name} (${bookingData.date} ${bookingData.time})`);
    return existing;
  }
  
  const { data, error } = await supabase
    .from('bookings')
    .insert(bookingData)
    .select()
    .single();
  
  if (error) {
    console.error(`❌ 예약 생성 실패:`, error);
    throw error;
  }
  
  return data;
}

// High/Medium Confidence 매칭 처리
async function processMatches(matches, confidence) {
  console.log(`\n🔍 ${confidence.toUpperCase()} Confidence 매칭 처리 시작...\n`);
  
  const results = {
    processed: [],
    errors: [],
    skipped: [],
  };
  
  for (const match of matches) {
    try {
      const matchId = `${confidence}-${match.original.name}-${match.original.date}`;
      console.log(`[${matchId}] 처리 중: ${match.original.name}`);
      
      // 이름 정규화
      const cleanName = normalizeName(match.original.name);
      
      // 고객 찾기 또는 생성
      const customer = await findOrCreateCustomer(
        cleanName,
        match.suggestedPhone,
        match.original.email || match.matched.email
      );
      
      // 방문 횟수 계산
      const visitCount = await getVisitCount(match.suggestedPhone);
      
      // 예약 생성
      const bookingDate = extractDate(match.original.date);
      const bookingTime = extractTime(match.original.date);
      
      if (!bookingDate) {
        console.log(`  ⚠️  날짜가 없어 건너뜀`);
        results.skipped.push({ match, reason: '날짜 없음' });
        continue;
      }
      
      const booking = await createBooking({
        name: cleanName,
        phone: match.suggestedPhone,
        date: bookingDate,
        time: bookingTime,
        club: '',
        service_type: match.original.service,
        is_as_visit: false, // High/Medium은 일반 재방문
        original_name: match.original.name,
        attendance_status: 'pending',
        notes: `${confidence.toUpperCase()} Confidence 매칭: ${match.reason}`,
      });
      
      results.processed.push({ match, booking, customer, visitCount });
      console.log(`  ✅ 예약 생성: ${booking.id} (${cleanName}, 방문 ${visitCount + 1}회)`);
      
    } catch (error) {
      console.error(`  ❌ 처리 실패:`, error);
      results.errors.push({ match, error: error.message });
    }
  }
  
  return results;
}

// 메인 실행
async function main() {
  try {
    // 보고서 파일 찾기
    const backupDir = path.join(__dirname, '..', 'backup');
    const files = fs.readdirSync(backupDir)
      .filter(f => f.startsWith('phone-matching-report-') && f.endsWith('.json'))
      .map(f => ({
        name: f,
        path: path.join(backupDir, f),
        time: fs.statSync(path.join(backupDir, f)).mtime.getTime(),
      }))
      .sort((a, b) => b.time - a.time);
    
    if (files.length === 0) {
      console.error('❌ 매칭 보고서 파일을 찾을 수 없습니다.');
      console.error('   먼저 node scripts/match-missing-phones.js 를 실행하세요.');
      process.exit(1);
    }
    
    const reportPath = files[0].path;
    console.log(`📄 보고서 파일 로드: ${reportPath}\n`);
    
    // 매칭 데이터 로드
    const { highMatches, mediumMatches, report } = loadMatchesFromReport(reportPath);
    
    console.log(`📊 매칭 데이터:`);
    console.log(`   - High Confidence: ${highMatches.length}건`);
    console.log(`   - Medium Confidence: ${mediumMatches.length}건\n`);
    
    // 옵션 확인
    const highOnly = process.argv.includes('--high-only');
    const mediumOnly = process.argv.includes('--medium-only');
    
    const allResults = {
      high: null,
      medium: null,
    };
    
    // High Confidence 처리
    if (!mediumOnly && highMatches.length > 0) {
      allResults.high = await processMatches(highMatches, 'high');
    }
    
    // Medium Confidence 처리
    if (!highOnly && mediumMatches.length > 0) {
      allResults.medium = await processMatches(mediumMatches, 'medium');
    }
    
    // 결과 요약
    console.log('\n' + '='.repeat(60));
    console.log('📊 처리 결과');
    console.log('='.repeat(60));
    
    if (allResults.high) {
      console.log(`\n✅ High Confidence 처리 완료: ${allResults.high.processed.length}건`);
      console.log(`   ⚠️  건너뛴 항목: ${allResults.high.skipped.length}건`);
      console.log(`   ❌ 오류: ${allResults.high.errors.length}건`);
    }
    
    if (allResults.medium) {
      console.log(`\n✅ Medium Confidence 처리 완료: ${allResults.medium.processed.length}건`);
      console.log(`   ⚠️  건너뛴 항목: ${allResults.medium.skipped.length}건`);
      console.log(`   ❌ 오류: ${allResults.medium.errors.length}건`);
    }
    
    const totalProcessed = (allResults.high?.processed.length || 0) + (allResults.medium?.processed.length || 0);
    const totalErrors = (allResults.high?.errors.length || 0) + (allResults.medium?.errors.length || 0);
    
    console.log(`\n📊 총 처리: ${totalProcessed}건`);
    console.log(`   ❌ 총 오류: ${totalErrors}건`);
    
    // 결과 저장
    const reportPath2 = path.join(__dirname, '..', 'backup', `high-medium-migration-${Date.now()}.json`);
    fs.writeFileSync(reportPath2, JSON.stringify(allResults, null, 2), 'utf8');
    console.log(`\n📄 결과 보고서 저장: ${reportPath2}`);
    
    console.log('\n✅ 마이그레이션 완료!\n');
    
  } catch (error) {
    console.error('\n❌ 마이그레이션 실패:', error);
    process.exit(1);
  }
}

main();







 * High/Medium Confidence 매칭 마이그레이션 스크립트
 * 
 * High Confidence 18건과 Medium Confidence 55건을 처리하여 bookings 테이블에 추가
 * 
 * 처리 규칙:
 * 1. High Confidence: 자동 적용 (이름 + 이메일/날짜 일치)
 * 2. Medium Confidence: 재방문으로 처리 (이름 일치, 날짜 다름)
 * 3. 모든 매칭은 기존 고객에 재방문으로 추가
 * 
 * 사용법:
 * node scripts/migrate-high-medium-matches.js [--high-only] [--medium-only]
 * 
 * 옵션:
 *   --high-only    High Confidence만 처리
 *   --medium-only  Medium Confidence만 처리
 */

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// 환경 변수 로드
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Supabase 환경 변수가 설정되지 않았습니다.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// 보고서 파일에서 High/Medium Confidence 매칭 로드
function loadMatchesFromReport(reportPath) {
  if (!fs.existsSync(reportPath)) {
    console.error(`❌ 보고서 파일을 찾을 수 없습니다: ${reportPath}`);
    process.exit(1);
  }

  const report = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
  
  const highMatches = report.matches.filter(m => m.confidence === 'high');
  const mediumMatches = report.matches.filter(m => m.confidence === 'medium');
  
  return { highMatches, mediumMatches, report };
}

// 이름 정규화
function normalizeName(name) {
  if (!name) return '';
  return name.trim()
    .replace(/\s+/g, ' ')
    .replace(/\([^)]*\)/g, '')
    .trim();
}

// 날짜 추출
function extractDate(dateStr) {
  if (!dateStr) return null;
  try {
    const match = dateStr.match(/(\d{4})[\.\-](\d{1,2})[\.\-](\d{1,2})/);
    if (!match) return null;
    const [, year, month, day] = match;
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  } catch (e) {
    return null;
  }
}

// 시간 추출 (기본값 10:00)
function extractTime(dateStr) {
  if (!dateStr) return '10:00';
  try {
    const timeMatch = dateStr.match(/(\d{1,2}):(\d{2})/);
    if (timeMatch) {
      return `${timeMatch[1].padStart(2, '0')}:${timeMatch[2]}`;
    }
  } catch (e) {
    // ignore
  }
  return '10:00';
}

// 고객 찾기 또는 생성
async function findOrCreateCustomer(name, phone, email) {
  // 전화번호로 고객 찾기
  const { data: existingCustomer } = await supabase
    .from('customers')
    .select('*')
    .eq('phone', phone)
    .single();
  
  if (existingCustomer) {
    return existingCustomer;
  }
  
  // 이름으로도 검색 (전화번호가 다른 경우)
  const { data: nameMatch } = await supabase
    .from('customers')
    .select('*')
    .ilike('name', normalizeName(name).trim())
    .limit(1)
    .single();
  
  if (nameMatch) {
    // 전화번호 업데이트
    await supabase
      .from('customers')
      .update({ phone })
      .eq('id', nameMatch.id);
    return { ...nameMatch, phone };
  }
  
  // 새 고객 생성
  const { data: newCustomer, error } = await supabase
    .from('customers')
    .insert({
      name: normalizeName(name).trim(),
      phone,
      email: email || null,
    })
    .select()
    .single();
  
  if (error) {
    console.error(`❌ 고객 생성 실패: ${name}`, error);
    throw error;
  }
  
  return newCustomer;
}

// 방문 횟수 계산 (전화번호 기준)
async function getVisitCount(phone) {
  const { count } = await supabase
    .from('bookings')
    .select('*', { count: 'exact', head: true })
    .eq('phone', phone);
  
  return count || 0;
}

// 예약 생성
async function createBooking(bookingData) {
  // 중복 확인 (전화번호, 날짜, 시간)
  const { data: existing } = await supabase
    .from('bookings')
    .select('id')
    .eq('phone', bookingData.phone)
    .eq('date', bookingData.date)
    .eq('time', bookingData.time)
    .single();
  
  if (existing) {
    console.log(`  ⚠️  중복 예약 건너뜀: ${bookingData.name} (${bookingData.date} ${bookingData.time})`);
    return existing;
  }
  
  const { data, error } = await supabase
    .from('bookings')
    .insert(bookingData)
    .select()
    .single();
  
  if (error) {
    console.error(`❌ 예약 생성 실패:`, error);
    throw error;
  }
  
  return data;
}

// High/Medium Confidence 매칭 처리
async function processMatches(matches, confidence) {
  console.log(`\n🔍 ${confidence.toUpperCase()} Confidence 매칭 처리 시작...\n`);
  
  const results = {
    processed: [],
    errors: [],
    skipped: [],
  };
  
  for (const match of matches) {
    try {
      const matchId = `${confidence}-${match.original.name}-${match.original.date}`;
      console.log(`[${matchId}] 처리 중: ${match.original.name}`);
      
      // 이름 정규화
      const cleanName = normalizeName(match.original.name);
      
      // 고객 찾기 또는 생성
      const customer = await findOrCreateCustomer(
        cleanName,
        match.suggestedPhone,
        match.original.email || match.matched.email
      );
      
      // 방문 횟수 계산
      const visitCount = await getVisitCount(match.suggestedPhone);
      
      // 예약 생성
      const bookingDate = extractDate(match.original.date);
      const bookingTime = extractTime(match.original.date);
      
      if (!bookingDate) {
        console.log(`  ⚠️  날짜가 없어 건너뜀`);
        results.skipped.push({ match, reason: '날짜 없음' });
        continue;
      }
      
      const booking = await createBooking({
        name: cleanName,
        phone: match.suggestedPhone,
        date: bookingDate,
        time: bookingTime,
        club: '',
        service_type: match.original.service,
        is_as_visit: false, // High/Medium은 일반 재방문
        original_name: match.original.name,
        attendance_status: 'pending',
        notes: `${confidence.toUpperCase()} Confidence 매칭: ${match.reason}`,
      });
      
      results.processed.push({ match, booking, customer, visitCount });
      console.log(`  ✅ 예약 생성: ${booking.id} (${cleanName}, 방문 ${visitCount + 1}회)`);
      
    } catch (error) {
      console.error(`  ❌ 처리 실패:`, error);
      results.errors.push({ match, error: error.message });
    }
  }
  
  return results;
}

// 메인 실행
async function main() {
  try {
    // 보고서 파일 찾기
    const backupDir = path.join(__dirname, '..', 'backup');
    const files = fs.readdirSync(backupDir)
      .filter(f => f.startsWith('phone-matching-report-') && f.endsWith('.json'))
      .map(f => ({
        name: f,
        path: path.join(backupDir, f),
        time: fs.statSync(path.join(backupDir, f)).mtime.getTime(),
      }))
      .sort((a, b) => b.time - a.time);
    
    if (files.length === 0) {
      console.error('❌ 매칭 보고서 파일을 찾을 수 없습니다.');
      console.error('   먼저 node scripts/match-missing-phones.js 를 실행하세요.');
      process.exit(1);
    }
    
    const reportPath = files[0].path;
    console.log(`📄 보고서 파일 로드: ${reportPath}\n`);
    
    // 매칭 데이터 로드
    const { highMatches, mediumMatches, report } = loadMatchesFromReport(reportPath);
    
    console.log(`📊 매칭 데이터:`);
    console.log(`   - High Confidence: ${highMatches.length}건`);
    console.log(`   - Medium Confidence: ${mediumMatches.length}건\n`);
    
    // 옵션 확인
    const highOnly = process.argv.includes('--high-only');
    const mediumOnly = process.argv.includes('--medium-only');
    
    const allResults = {
      high: null,
      medium: null,
    };
    
    // High Confidence 처리
    if (!mediumOnly && highMatches.length > 0) {
      allResults.high = await processMatches(highMatches, 'high');
    }
    
    // Medium Confidence 처리
    if (!highOnly && mediumMatches.length > 0) {
      allResults.medium = await processMatches(mediumMatches, 'medium');
    }
    
    // 결과 요약
    console.log('\n' + '='.repeat(60));
    console.log('📊 처리 결과');
    console.log('='.repeat(60));
    
    if (allResults.high) {
      console.log(`\n✅ High Confidence 처리 완료: ${allResults.high.processed.length}건`);
      console.log(`   ⚠️  건너뛴 항목: ${allResults.high.skipped.length}건`);
      console.log(`   ❌ 오류: ${allResults.high.errors.length}건`);
    }
    
    if (allResults.medium) {
      console.log(`\n✅ Medium Confidence 처리 완료: ${allResults.medium.processed.length}건`);
      console.log(`   ⚠️  건너뛴 항목: ${allResults.medium.skipped.length}건`);
      console.log(`   ❌ 오류: ${allResults.medium.errors.length}건`);
    }
    
    const totalProcessed = (allResults.high?.processed.length || 0) + (allResults.medium?.processed.length || 0);
    const totalErrors = (allResults.high?.errors.length || 0) + (allResults.medium?.errors.length || 0);
    
    console.log(`\n📊 총 처리: ${totalProcessed}건`);
    console.log(`   ❌ 총 오류: ${totalErrors}건`);
    
    // 결과 저장
    const reportPath2 = path.join(__dirname, '..', 'backup', `high-medium-migration-${Date.now()}.json`);
    fs.writeFileSync(reportPath2, JSON.stringify(allResults, null, 2), 'utf8');
    console.log(`\n📄 결과 보고서 저장: ${reportPath2}`);
    
    console.log('\n✅ 마이그레이션 완료!\n');
    
  } catch (error) {
    console.error('\n❌ 마이그레이션 실패:', error);
    process.exit(1);
  }
}

main();







 * High/Medium Confidence 매칭 마이그레이션 스크립트
 * 
 * High Confidence 18건과 Medium Confidence 55건을 처리하여 bookings 테이블에 추가
 * 
 * 처리 규칙:
 * 1. High Confidence: 자동 적용 (이름 + 이메일/날짜 일치)
 * 2. Medium Confidence: 재방문으로 처리 (이름 일치, 날짜 다름)
 * 3. 모든 매칭은 기존 고객에 재방문으로 추가
 * 
 * 사용법:
 * node scripts/migrate-high-medium-matches.js [--high-only] [--medium-only]
 * 
 * 옵션:
 *   --high-only    High Confidence만 처리
 *   --medium-only  Medium Confidence만 처리
 */

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// 환경 변수 로드
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Supabase 환경 변수가 설정되지 않았습니다.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// 보고서 파일에서 High/Medium Confidence 매칭 로드
function loadMatchesFromReport(reportPath) {
  if (!fs.existsSync(reportPath)) {
    console.error(`❌ 보고서 파일을 찾을 수 없습니다: ${reportPath}`);
    process.exit(1);
  }

  const report = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
  
  const highMatches = report.matches.filter(m => m.confidence === 'high');
  const mediumMatches = report.matches.filter(m => m.confidence === 'medium');
  
  return { highMatches, mediumMatches, report };
}

// 이름 정규화
function normalizeName(name) {
  if (!name) return '';
  return name.trim()
    .replace(/\s+/g, ' ')
    .replace(/\([^)]*\)/g, '')
    .trim();
}

// 날짜 추출
function extractDate(dateStr) {
  if (!dateStr) return null;
  try {
    const match = dateStr.match(/(\d{4})[\.\-](\d{1,2})[\.\-](\d{1,2})/);
    if (!match) return null;
    const [, year, month, day] = match;
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  } catch (e) {
    return null;
  }
}

// 시간 추출 (기본값 10:00)
function extractTime(dateStr) {
  if (!dateStr) return '10:00';
  try {
    const timeMatch = dateStr.match(/(\d{1,2}):(\d{2})/);
    if (timeMatch) {
      return `${timeMatch[1].padStart(2, '0')}:${timeMatch[2]}`;
    }
  } catch (e) {
    // ignore
  }
  return '10:00';
}

// 고객 찾기 또는 생성
async function findOrCreateCustomer(name, phone, email) {
  // 전화번호로 고객 찾기
  const { data: existingCustomer } = await supabase
    .from('customers')
    .select('*')
    .eq('phone', phone)
    .single();
  
  if (existingCustomer) {
    return existingCustomer;
  }
  
  // 이름으로도 검색 (전화번호가 다른 경우)
  const { data: nameMatch } = await supabase
    .from('customers')
    .select('*')
    .ilike('name', normalizeName(name).trim())
    .limit(1)
    .single();
  
  if (nameMatch) {
    // 전화번호 업데이트
    await supabase
      .from('customers')
      .update({ phone })
      .eq('id', nameMatch.id);
    return { ...nameMatch, phone };
  }
  
  // 새 고객 생성
  const { data: newCustomer, error } = await supabase
    .from('customers')
    .insert({
      name: normalizeName(name).trim(),
      phone,
      email: email || null,
    })
    .select()
    .single();
  
  if (error) {
    console.error(`❌ 고객 생성 실패: ${name}`, error);
    throw error;
  }
  
  return newCustomer;
}

// 방문 횟수 계산 (전화번호 기준)
async function getVisitCount(phone) {
  const { count } = await supabase
    .from('bookings')
    .select('*', { count: 'exact', head: true })
    .eq('phone', phone);
  
  return count || 0;
}

// 예약 생성
async function createBooking(bookingData) {
  // 중복 확인 (전화번호, 날짜, 시간)
  const { data: existing } = await supabase
    .from('bookings')
    .select('id')
    .eq('phone', bookingData.phone)
    .eq('date', bookingData.date)
    .eq('time', bookingData.time)
    .single();
  
  if (existing) {
    console.log(`  ⚠️  중복 예약 건너뜀: ${bookingData.name} (${bookingData.date} ${bookingData.time})`);
    return existing;
  }
  
  const { data, error } = await supabase
    .from('bookings')
    .insert(bookingData)
    .select()
    .single();
  
  if (error) {
    console.error(`❌ 예약 생성 실패:`, error);
    throw error;
  }
  
  return data;
}

// High/Medium Confidence 매칭 처리
async function processMatches(matches, confidence) {
  console.log(`\n🔍 ${confidence.toUpperCase()} Confidence 매칭 처리 시작...\n`);
  
  const results = {
    processed: [],
    errors: [],
    skipped: [],
  };
  
  for (const match of matches) {
    try {
      const matchId = `${confidence}-${match.original.name}-${match.original.date}`;
      console.log(`[${matchId}] 처리 중: ${match.original.name}`);
      
      // 이름 정규화
      const cleanName = normalizeName(match.original.name);
      
      // 고객 찾기 또는 생성
      const customer = await findOrCreateCustomer(
        cleanName,
        match.suggestedPhone,
        match.original.email || match.matched.email
      );
      
      // 방문 횟수 계산
      const visitCount = await getVisitCount(match.suggestedPhone);
      
      // 예약 생성
      const bookingDate = extractDate(match.original.date);
      const bookingTime = extractTime(match.original.date);
      
      if (!bookingDate) {
        console.log(`  ⚠️  날짜가 없어 건너뜀`);
        results.skipped.push({ match, reason: '날짜 없음' });
        continue;
      }
      
      const booking = await createBooking({
        name: cleanName,
        phone: match.suggestedPhone,
        date: bookingDate,
        time: bookingTime,
        club: '',
        service_type: match.original.service,
        is_as_visit: false, // High/Medium은 일반 재방문
        original_name: match.original.name,
        attendance_status: 'pending',
        notes: `${confidence.toUpperCase()} Confidence 매칭: ${match.reason}`,
      });
      
      results.processed.push({ match, booking, customer, visitCount });
      console.log(`  ✅ 예약 생성: ${booking.id} (${cleanName}, 방문 ${visitCount + 1}회)`);
      
    } catch (error) {
      console.error(`  ❌ 처리 실패:`, error);
      results.errors.push({ match, error: error.message });
    }
  }
  
  return results;
}

// 메인 실행
async function main() {
  try {
    // 보고서 파일 찾기
    const backupDir = path.join(__dirname, '..', 'backup');
    const files = fs.readdirSync(backupDir)
      .filter(f => f.startsWith('phone-matching-report-') && f.endsWith('.json'))
      .map(f => ({
        name: f,
        path: path.join(backupDir, f),
        time: fs.statSync(path.join(backupDir, f)).mtime.getTime(),
      }))
      .sort((a, b) => b.time - a.time);
    
    if (files.length === 0) {
      console.error('❌ 매칭 보고서 파일을 찾을 수 없습니다.');
      console.error('   먼저 node scripts/match-missing-phones.js 를 실행하세요.');
      process.exit(1);
    }
    
    const reportPath = files[0].path;
    console.log(`📄 보고서 파일 로드: ${reportPath}\n`);
    
    // 매칭 데이터 로드
    const { highMatches, mediumMatches, report } = loadMatchesFromReport(reportPath);
    
    console.log(`📊 매칭 데이터:`);
    console.log(`   - High Confidence: ${highMatches.length}건`);
    console.log(`   - Medium Confidence: ${mediumMatches.length}건\n`);
    
    // 옵션 확인
    const highOnly = process.argv.includes('--high-only');
    const mediumOnly = process.argv.includes('--medium-only');
    
    const allResults = {
      high: null,
      medium: null,
    };
    
    // High Confidence 처리
    if (!mediumOnly && highMatches.length > 0) {
      allResults.high = await processMatches(highMatches, 'high');
    }
    
    // Medium Confidence 처리
    if (!highOnly && mediumMatches.length > 0) {
      allResults.medium = await processMatches(mediumMatches, 'medium');
    }
    
    // 결과 요약
    console.log('\n' + '='.repeat(60));
    console.log('📊 처리 결과');
    console.log('='.repeat(60));
    
    if (allResults.high) {
      console.log(`\n✅ High Confidence 처리 완료: ${allResults.high.processed.length}건`);
      console.log(`   ⚠️  건너뛴 항목: ${allResults.high.skipped.length}건`);
      console.log(`   ❌ 오류: ${allResults.high.errors.length}건`);
    }
    
    if (allResults.medium) {
      console.log(`\n✅ Medium Confidence 처리 완료: ${allResults.medium.processed.length}건`);
      console.log(`   ⚠️  건너뛴 항목: ${allResults.medium.skipped.length}건`);
      console.log(`   ❌ 오류: ${allResults.medium.errors.length}건`);
    }
    
    const totalProcessed = (allResults.high?.processed.length || 0) + (allResults.medium?.processed.length || 0);
    const totalErrors = (allResults.high?.errors.length || 0) + (allResults.medium?.errors.length || 0);
    
    console.log(`\n📊 총 처리: ${totalProcessed}건`);
    console.log(`   ❌ 총 오류: ${totalErrors}건`);
    
    // 결과 저장
    const reportPath2 = path.join(__dirname, '..', 'backup', `high-medium-migration-${Date.now()}.json`);
    fs.writeFileSync(reportPath2, JSON.stringify(allResults, null, 2), 'utf8');
    console.log(`\n📄 결과 보고서 저장: ${reportPath2}`);
    
    console.log('\n✅ 마이그레이션 완료!\n');
    
  } catch (error) {
    console.error('\n❌ 마이그레이션 실패:', error);
    process.exit(1);
  }
}

main();




















