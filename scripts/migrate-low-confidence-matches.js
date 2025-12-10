/**
 * Low Confidence 매칭 19건 마이그레이션 스크립트
 * 
 * Low Confidence 매칭 결과를 처리하여 bookings 테이블에 추가
 * 
 * 처리 규칙:
 * 1. AS 분리: 이름에서 AS 제거하고 is_as_visit = true 설정
 * 2. 재방문: 기존 고객에 방문 횟수 추가
 * 3. 복수명 처리: "송영의,이관욱 AS" 같은 경우 1시간 단위로 2개 입력 또는 하나만 입력
 * 4. 삭제 대상: "시타" 같은 유효하지 않은 이름은 삭제 마킹
 * 
 * 사용법:
 * node scripts/migrate-low-confidence-matches.js
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

// Low Confidence 매칭 데이터 (19건)
const LOW_CONFIDENCE_MATCHES = [
  {
    id: 1,
    original: { name: "진지화AS", email: "massgoogolf@naver.com", date: "2023-08-22", service: "한번 시타해 보세요." },
    matched: { name: "진지화", phone: "01027542368", email: "aa@aa.aa", date: "2023-08-22" },
    reason: "이름 유사 (진지화AS ≈ 진지화)",
    suggestedPhone: "01027542368"
  },
  {
    id: 2,
    original: { name: "김대진(2인)", email: "massgoogolf@naver.com", date: "2023-08-20", service: "한번 시타해 보세요." },
    matched: { name: "김대", phone: "01052774119", email: "AAA.AAA@AAA.AAA", date: "2023-04-25" },
    reason: "이름 유사 (김대진(2인) ≈ 김대)",
    suggestedPhone: "01052774119"
  },
  {
    id: 3,
    original: { name: "최원구AS", email: "massgoogolf@naver.com", date: "2023-08-15", service: "한번 시타해 보세요." },
    matched: { name: "최원구", phone: "01032205375", email: "aa@aa.aa", date: "2023-08-12" },
    reason: "이름 유사 (최원구AS ≈ 최원구)",
    suggestedPhone: "01032205375"
  },
  {
    id: 4,
    original: { name: "송영의,이관욱 AS", email: "aaa.aaaa@aaa.aaa", date: "2023-04-26", service: "마쓰구드라이버 시타" },
    matched: { name: "이관욱", phone: "01037701435", email: "AAA.AAA@AAA.AAA", date: "2023-04-20" },
    reason: "이름 유사 (송영의,이관욱 AS ≈ 이관욱)",
    suggestedPhone: "01037701435",
    // 특별 처리: 송영의와 이관욱 모두 처리 (1시간 차이로 2개 입력)
    multipleNames: ["송영의", "이관욱"],
    multiplePhones: [null, "01037701435"] // 송영의 전화번호는 모름
  },
  {
    id: 5,
    original: { name: "오세집", email: "massgoogolf@naver.com", date: "2023-04-20", service: "마쓰구드라이버 시타" },
    matched: { name: "오세집 AS", phone: "01052184544", email: "aaa@aaaa.aaa", date: "2023-05-18" },
    reason: "이름 유사 (오세집 ≈ 오세집 AS)",
    suggestedPhone: "01052184544"
  },
  {
    id: 6,
    original: { name: "이동열", email: "massgoogolf@naver.com", date: "2023-03-21", service: "마쓰구드라이버 시타" },
    matched: { name: "이동열 방문AS 시타채수거", phone: "01056015676", email: "AAA@AA.AAA", date: "2023-05-26" },
    reason: "이름 유사 (이동열 ≈ 이동열 방문AS 시타채수거)",
    suggestedPhone: "01056015676",
    // AS 방문으로 처리
    forceAS: true
  },
  {
    id: 7,
    original: { name: "장철", email: "aa@aa.com", date: "2023-02-21", service: "마쓰구드라이버 시타" },
    matched: { name: "박장철 ", phone: "01003132603", email: "matia1072@naver.com", date: "2023-02-22" },
    reason: "이름 유사 (장철 ≈ 박장철 )",
    suggestedPhone: "01003132603",
    // 특별 처리: 박장철로 통일
    normalizedName: "박장철"
  },
  {
    id: 8,
    original: { name: "김석현점검", email: "massgoogolf@naver.com", date: "2023-02-17", service: "마쓰구드라이버 시타" },
    matched: { name: "김석현", phone: "01052620104", email: "oksk1731@naver.com", date: "2022-11-21" },
    reason: "이름 유사 (김석현점검 ≈ 김석현)",
    suggestedPhone: "01052620104"
  },
  {
    id: 9,
    original: { name: "최동우고객 사모님", email: "massgoogolf@naver.com", date: "2023-01-03", service: "마쓰구 드라이버 시타 서비스" },
    matched: { name: "최동우", phone: "01039549665", email: "Midam9665@hanmail.net", date: "2022-07-13" },
    reason: "이름 유사 (최동우고객 사모님 ≈ 최동우)",
    suggestedPhone: "01039549665",
    // 특별 처리: "최동우고객 사모님" → "최동우"
    normalizedName: "최동우"
  },
  {
    id: 10,
    original: { name: "김춘택AS", email: "massgoogolf@naver.com", date: "2022-11-24", service: "마쓰구 드라이버 시타 서비스" },
    matched: { name: "김춘택", phone: "01037258142", email: "aa@aa.aa", date: "2022-11-22" },
    reason: "이름 유사 (김춘택AS ≈ 김춘택)",
    suggestedPhone: "01037258142"
  },
  {
    id: 11,
    original: { name: "윤의권AS", email: "massgoogolf@naver.com", date: "2022-10-20", service: "마쓰구 드라이버 시타 서비스" },
    matched: { name: "윤의권", phone: "01032361000", email: "", date: "2022-10-14" },
    reason: "이름 유사 (윤의권AS ≈ 윤의권)",
    suggestedPhone: "01032361000"
  },
  {
    id: 12,
    original: { name: "김명배AS", email: "massgoogolf@naver.com", date: "2022-08-31", service: "마쓰구 드라이버 시타 서비스" },
    matched: { name: "김명배", phone: "01052244819", email: "aa@aa.aa", date: "2022-08-16" },
    reason: "이름 유사 (김명배AS ≈ 김명배)",
    suggestedPhone: "01052244819"
  },
  {
    id: 13,
    original: { name: "오세집", email: "massgoogolf@naver.com", date: "2022-08-18", service: "마쓰구 드라이버 시타 서비스" },
    matched: { name: "오세집 AS", phone: "01052184544", email: "aaa@aaaa.aaa", date: "2023-05-18" },
    reason: "이름 유사 (오세집 ≈ 오세집 AS)",
    suggestedPhone: "01052184544",
    // AS 방문으로 처리
    forceAS: true
  },
  {
    id: 14,
    original: { name: "김태정AS", email: "massgoogolf@naver.com", date: "2022-08-04", service: "마쓰구 드라이버 시타 서비스" },
    matched: { name: "김태정 ", phone: "01037140025", email: "ktj0025@aa.aa", date: "2025-07-17" },
    reason: "이름 유사 (김태정AS ≈ 김태정 )",
    suggestedPhone: "01037140025"
  },
  {
    id: 15,
    original: { name: "시타", email: "massgoogolf@naver.com", date: "2022-08-01", service: "마쓰구 드라이버 시타 서비스" },
    matched: { name: "이동열 방문AS 시타채수거", phone: "01056015676", email: "AAA@AA.AAA", date: "2023-05-26" },
    reason: "이름 유사 (시타 ≈ 이동열 방문AS 시타채수거)",
    suggestedPhone: "01056015676",
    // 삭제 대상
    shouldDelete: true,
    deleteReason: "이름이 '시타'만 있어 유효하지 않음"
  },
  {
    id: 16,
    original: { name: "김영희", email: "massgoogolf@naver.com", date: "2022-05-06", service: "마쓰구 드라이버 시타 서비스" },
    matched: { name: "김영희,여금성 AS 방", phone: "01099227312", email: "AA@AAA.AAA", date: "2023-06-27" },
    reason: "이름 유사 (김영희 ≈ 김영희,여금성 AS 방)",
    suggestedPhone: "01099227312"
  },
  {
    id: 17,
    original: { name: "김동광", email: "kimdk4292@daum.net", date: "2020-09-30", service: "마쓰구 드라이버 시타 서비스" },
    matched: { name: "김동광AS ", phone: "01052752924", email: "massgoogolf@naver.com", date: "2021-08-30" },
    reason: "이름 유사 (김동광 ≈ 김동광AS )",
    suggestedPhone: "01052752924"
  }
];

// 이름 파싱 및 AS 분리
function parseNameAndAS(name) {
  if (!name) return { cleanName: '', isAS: false, originalName: name };
  
  const originalName = name.trim();
  let cleanName = originalName;
  let isAS = false;
  
  // AS 패턴 매칭
  const asPatterns = [
    /^(.+?)\s*AS\s*$/i,
    /\s*AS\s*(.+?)$/i,
    /(.+?)\s*방문AS/i,
    /(.+?),\s*(.+?)\s*AS/i,
    /(.+?)\s*AS\s*방/i,
  ];
  
  for (const pattern of asPatterns) {
    const match = originalName.match(pattern);
    if (match) {
      cleanName = match[1] ? match[1].trim() : match[0].replace(/AS/gi, '').trim();
      isAS = true;
      break;
    }
  }
  
  // 괄호 내용 제거: "김대진(2인)" → "김대진"
  cleanName = cleanName.replace(/\([^)]*\)/g, '').trim();
  
  // 특수 키워드 제거
  cleanName = cleanName.replace(/\s*(사모님|여자|외\s*1|외\s*2|2인|매각상담|점검|방문|시타채수거)\s*/gi, '').trim();
  
  return { cleanName, isAS, originalName };
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

// 시간에 1시간 추가
function addHour(timeStr) {
  const [hour, minute] = timeStr.split(':').map(Number);
  const newHour = (hour + 1) % 24;
  return `${String(newHour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
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
    .ilike('name', name.trim())
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
      name: name.trim(),
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

// Low Confidence 매칭 처리
async function processLowConfidenceMatches() {
  console.log('🔍 Low Confidence 매칭 처리 시작...\n');
  
  const results = {
    processed: [],
    deleted: [],
    errors: [],
  };
  
  for (const match of LOW_CONFIDENCE_MATCHES) {
    try {
      console.log(`\n[${match.id}] 처리 중: ${match.original.name}`);
      
      // 삭제 대상 확인
      if (match.shouldDelete) {
        console.log(`  ❌ 삭제 대상: ${match.deleteReason}`);
        results.deleted.push({
          id: match.id,
          original: match.original,
          reason: match.deleteReason,
        });
        continue;
      }
      
      // 4번: 송영의,이관욱 AS 특별 처리
      if (match.id === 4 && match.multipleNames) {
        const bookingDate = extractDate(match.original.date);
        const bookingTime = extractTime(match.original.date);
        
        // 이관욱 처리 (전화번호 있음)
        const customer1 = await findOrCreateCustomer(
          match.multipleNames[1],
          match.multiplePhones[1],
          match.matched.email
        );
        const visitCount1 = await getVisitCount(match.multiplePhones[1]);
        
        const booking1 = await createBooking({
          name: match.multipleNames[1],
          phone: match.multiplePhones[1],
          date: bookingDate,
          time: bookingTime,
          club: '',
          service_type: match.original.service,
          is_as_visit: true,
          original_name: match.original.name,
          attendance_status: 'pending',
          notes: `Low Confidence 매칭 #${match.id}: ${match.reason} | 복수명 처리 (이관욱)`,
        });
        
        results.processed.push({ id: match.id, booking: booking1, customer: customer1 });
        console.log(`  ✅ 이관욱 예약 생성: ${booking1.id} (방문 ${visitCount1 + 1}회)`);
        
        // 송영의는 전화번호가 없어서 건너뜀 (또는 수동 입력 필요)
        console.log(`  ⚠️  송영의는 전화번호가 없어 건너뜀`);
        continue;
      }
      
      // 이름 파싱
      const nameParse = parseNameAndAS(match.original.name);
      const cleanName = match.normalizedName || nameParse.cleanName;
      
      // AS 방문 여부 결정 (forceAS 옵션이 있으면 우선)
      const isAS = match.forceAS !== undefined ? match.forceAS : nameParse.isAS;
      
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
      
      const booking = await createBooking({
        name: cleanName,
        phone: match.suggestedPhone,
        date: bookingDate,
        time: bookingTime,
        club: '',
        service_type: match.original.service,
        is_as_visit: isAS,
        original_name: match.original.name,
        attendance_status: 'pending',
        notes: `Low Confidence 매칭 #${match.id}: ${match.reason}`,
      });
      
      results.processed.push({ id: match.id, booking, customer });
      console.log(`  ✅ 예약 생성: ${booking.id} (${cleanName}, 방문 ${visitCount + 1}회)`);
      
    } catch (error) {
      console.error(`  ❌ 처리 실패:`, error);
      results.errors.push({ id: match.id, error: error.message });
    }
  }
  
  return results;
}

// 메인 실행
async function main() {
  try {
    const results = await processLowConfidenceMatches();
    
    console.log('\n' + '='.repeat(60));
    console.log('📊 처리 결과');
    console.log('='.repeat(60));
    console.log(`\n✅ 처리 완료: ${results.processed.length}건`);
    console.log(`❌ 삭제 대상: ${results.deleted.length}건`);
    console.log(`⚠️  오류: ${results.errors.length}건`);
    
    if (results.deleted.length > 0) {
      console.log('\n📋 삭제 대상 목록:');
      results.deleted.forEach(item => {
        console.log(`  - ${item.original.name}: ${item.reason}`);
      });
    }
    
    if (results.errors.length > 0) {
      console.log('\n❌ 오류 목록:');
      results.errors.forEach(item => {
        console.log(`  - #${item.id}: ${item.error}`);
      });
    }
    
    // 결과 저장
    const reportPath = path.join(__dirname, '..', 'backup', `low-confidence-migration-${Date.now()}.json`);
    fs.writeFileSync(reportPath, JSON.stringify(results, null, 2), 'utf8');
    console.log(`\n📄 결과 보고서 저장: ${reportPath}`);
    
    console.log('\n✅ 마이그레이션 완료!\n');
    
  } catch (error) {
    console.error('\n❌ 마이그레이션 실패:', error);
    process.exit(1);
  }
}

main();


 * 
 * Low Confidence 매칭 결과를 처리하여 bookings 테이블에 추가
 * 
 * 처리 규칙:
 * 1. AS 분리: 이름에서 AS 제거하고 is_as_visit = true 설정
 * 2. 재방문: 기존 고객에 방문 횟수 추가
 * 3. 복수명 처리: "송영의,이관욱 AS" 같은 경우 1시간 단위로 2개 입력 또는 하나만 입력
 * 4. 삭제 대상: "시타" 같은 유효하지 않은 이름은 삭제 마킹
 * 
 * 사용법:
 * node scripts/migrate-low-confidence-matches.js
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

// Low Confidence 매칭 데이터 (19건)
const LOW_CONFIDENCE_MATCHES = [
  {
    id: 1,
    original: { name: "진지화AS", email: "massgoogolf@naver.com", date: "2023-08-22", service: "한번 시타해 보세요." },
    matched: { name: "진지화", phone: "01027542368", email: "aa@aa.aa", date: "2023-08-22" },
    reason: "이름 유사 (진지화AS ≈ 진지화)",
    suggestedPhone: "01027542368"
  },
  {
    id: 2,
    original: { name: "김대진(2인)", email: "massgoogolf@naver.com", date: "2023-08-20", service: "한번 시타해 보세요." },
    matched: { name: "김대", phone: "01052774119", email: "AAA.AAA@AAA.AAA", date: "2023-04-25" },
    reason: "이름 유사 (김대진(2인) ≈ 김대)",
    suggestedPhone: "01052774119"
  },
  {
    id: 3,
    original: { name: "최원구AS", email: "massgoogolf@naver.com", date: "2023-08-15", service: "한번 시타해 보세요." },
    matched: { name: "최원구", phone: "01032205375", email: "aa@aa.aa", date: "2023-08-12" },
    reason: "이름 유사 (최원구AS ≈ 최원구)",
    suggestedPhone: "01032205375"
  },
  {
    id: 4,
    original: { name: "송영의,이관욱 AS", email: "aaa.aaaa@aaa.aaa", date: "2023-04-26", service: "마쓰구드라이버 시타" },
    matched: { name: "이관욱", phone: "01037701435", email: "AAA.AAA@AAA.AAA", date: "2023-04-20" },
    reason: "이름 유사 (송영의,이관욱 AS ≈ 이관욱)",
    suggestedPhone: "01037701435",
    // 특별 처리: 송영의와 이관욱 모두 처리 (1시간 차이로 2개 입력)
    multipleNames: ["송영의", "이관욱"],
    multiplePhones: [null, "01037701435"] // 송영의 전화번호는 모름
  },
  {
    id: 5,
    original: { name: "오세집", email: "massgoogolf@naver.com", date: "2023-04-20", service: "마쓰구드라이버 시타" },
    matched: { name: "오세집 AS", phone: "01052184544", email: "aaa@aaaa.aaa", date: "2023-05-18" },
    reason: "이름 유사 (오세집 ≈ 오세집 AS)",
    suggestedPhone: "01052184544"
  },
  {
    id: 6,
    original: { name: "이동열", email: "massgoogolf@naver.com", date: "2023-03-21", service: "마쓰구드라이버 시타" },
    matched: { name: "이동열 방문AS 시타채수거", phone: "01056015676", email: "AAA@AA.AAA", date: "2023-05-26" },
    reason: "이름 유사 (이동열 ≈ 이동열 방문AS 시타채수거)",
    suggestedPhone: "01056015676",
    // AS 방문으로 처리
    forceAS: true
  },
  {
    id: 7,
    original: { name: "장철", email: "aa@aa.com", date: "2023-02-21", service: "마쓰구드라이버 시타" },
    matched: { name: "박장철 ", phone: "01003132603", email: "matia1072@naver.com", date: "2023-02-22" },
    reason: "이름 유사 (장철 ≈ 박장철 )",
    suggestedPhone: "01003132603",
    // 특별 처리: 박장철로 통일
    normalizedName: "박장철"
  },
  {
    id: 8,
    original: { name: "김석현점검", email: "massgoogolf@naver.com", date: "2023-02-17", service: "마쓰구드라이버 시타" },
    matched: { name: "김석현", phone: "01052620104", email: "oksk1731@naver.com", date: "2022-11-21" },
    reason: "이름 유사 (김석현점검 ≈ 김석현)",
    suggestedPhone: "01052620104"
  },
  {
    id: 9,
    original: { name: "최동우고객 사모님", email: "massgoogolf@naver.com", date: "2023-01-03", service: "마쓰구 드라이버 시타 서비스" },
    matched: { name: "최동우", phone: "01039549665", email: "Midam9665@hanmail.net", date: "2022-07-13" },
    reason: "이름 유사 (최동우고객 사모님 ≈ 최동우)",
    suggestedPhone: "01039549665",
    // 특별 처리: "최동우고객 사모님" → "최동우"
    normalizedName: "최동우"
  },
  {
    id: 10,
    original: { name: "김춘택AS", email: "massgoogolf@naver.com", date: "2022-11-24", service: "마쓰구 드라이버 시타 서비스" },
    matched: { name: "김춘택", phone: "01037258142", email: "aa@aa.aa", date: "2022-11-22" },
    reason: "이름 유사 (김춘택AS ≈ 김춘택)",
    suggestedPhone: "01037258142"
  },
  {
    id: 11,
    original: { name: "윤의권AS", email: "massgoogolf@naver.com", date: "2022-10-20", service: "마쓰구 드라이버 시타 서비스" },
    matched: { name: "윤의권", phone: "01032361000", email: "", date: "2022-10-14" },
    reason: "이름 유사 (윤의권AS ≈ 윤의권)",
    suggestedPhone: "01032361000"
  },
  {
    id: 12,
    original: { name: "김명배AS", email: "massgoogolf@naver.com", date: "2022-08-31", service: "마쓰구 드라이버 시타 서비스" },
    matched: { name: "김명배", phone: "01052244819", email: "aa@aa.aa", date: "2022-08-16" },
    reason: "이름 유사 (김명배AS ≈ 김명배)",
    suggestedPhone: "01052244819"
  },
  {
    id: 13,
    original: { name: "오세집", email: "massgoogolf@naver.com", date: "2022-08-18", service: "마쓰구 드라이버 시타 서비스" },
    matched: { name: "오세집 AS", phone: "01052184544", email: "aaa@aaaa.aaa", date: "2023-05-18" },
    reason: "이름 유사 (오세집 ≈ 오세집 AS)",
    suggestedPhone: "01052184544",
    // AS 방문으로 처리
    forceAS: true
  },
  {
    id: 14,
    original: { name: "김태정AS", email: "massgoogolf@naver.com", date: "2022-08-04", service: "마쓰구 드라이버 시타 서비스" },
    matched: { name: "김태정 ", phone: "01037140025", email: "ktj0025@aa.aa", date: "2025-07-17" },
    reason: "이름 유사 (김태정AS ≈ 김태정 )",
    suggestedPhone: "01037140025"
  },
  {
    id: 15,
    original: { name: "시타", email: "massgoogolf@naver.com", date: "2022-08-01", service: "마쓰구 드라이버 시타 서비스" },
    matched: { name: "이동열 방문AS 시타채수거", phone: "01056015676", email: "AAA@AA.AAA", date: "2023-05-26" },
    reason: "이름 유사 (시타 ≈ 이동열 방문AS 시타채수거)",
    suggestedPhone: "01056015676",
    // 삭제 대상
    shouldDelete: true,
    deleteReason: "이름이 '시타'만 있어 유효하지 않음"
  },
  {
    id: 16,
    original: { name: "김영희", email: "massgoogolf@naver.com", date: "2022-05-06", service: "마쓰구 드라이버 시타 서비스" },
    matched: { name: "김영희,여금성 AS 방", phone: "01099227312", email: "AA@AAA.AAA", date: "2023-06-27" },
    reason: "이름 유사 (김영희 ≈ 김영희,여금성 AS 방)",
    suggestedPhone: "01099227312"
  },
  {
    id: 17,
    original: { name: "김동광", email: "kimdk4292@daum.net", date: "2020-09-30", service: "마쓰구 드라이버 시타 서비스" },
    matched: { name: "김동광AS ", phone: "01052752924", email: "massgoogolf@naver.com", date: "2021-08-30" },
    reason: "이름 유사 (김동광 ≈ 김동광AS )",
    suggestedPhone: "01052752924"
  }
];

// 이름 파싱 및 AS 분리
function parseNameAndAS(name) {
  if (!name) return { cleanName: '', isAS: false, originalName: name };
  
  const originalName = name.trim();
  let cleanName = originalName;
  let isAS = false;
  
  // AS 패턴 매칭
  const asPatterns = [
    /^(.+?)\s*AS\s*$/i,
    /\s*AS\s*(.+?)$/i,
    /(.+?)\s*방문AS/i,
    /(.+?),\s*(.+?)\s*AS/i,
    /(.+?)\s*AS\s*방/i,
  ];
  
  for (const pattern of asPatterns) {
    const match = originalName.match(pattern);
    if (match) {
      cleanName = match[1] ? match[1].trim() : match[0].replace(/AS/gi, '').trim();
      isAS = true;
      break;
    }
  }
  
  // 괄호 내용 제거: "김대진(2인)" → "김대진"
  cleanName = cleanName.replace(/\([^)]*\)/g, '').trim();
  
  // 특수 키워드 제거
  cleanName = cleanName.replace(/\s*(사모님|여자|외\s*1|외\s*2|2인|매각상담|점검|방문|시타채수거)\s*/gi, '').trim();
  
  return { cleanName, isAS, originalName };
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

// 시간에 1시간 추가
function addHour(timeStr) {
  const [hour, minute] = timeStr.split(':').map(Number);
  const newHour = (hour + 1) % 24;
  return `${String(newHour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
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
    .ilike('name', name.trim())
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
      name: name.trim(),
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

// Low Confidence 매칭 처리
async function processLowConfidenceMatches() {
  console.log('🔍 Low Confidence 매칭 처리 시작...\n');
  
  const results = {
    processed: [],
    deleted: [],
    errors: [],
  };
  
  for (const match of LOW_CONFIDENCE_MATCHES) {
    try {
      console.log(`\n[${match.id}] 처리 중: ${match.original.name}`);
      
      // 삭제 대상 확인
      if (match.shouldDelete) {
        console.log(`  ❌ 삭제 대상: ${match.deleteReason}`);
        results.deleted.push({
          id: match.id,
          original: match.original,
          reason: match.deleteReason,
        });
        continue;
      }
      
      // 4번: 송영의,이관욱 AS 특별 처리
      if (match.id === 4 && match.multipleNames) {
        const bookingDate = extractDate(match.original.date);
        const bookingTime = extractTime(match.original.date);
        
        // 이관욱 처리 (전화번호 있음)
        const customer1 = await findOrCreateCustomer(
          match.multipleNames[1],
          match.multiplePhones[1],
          match.matched.email
        );
        const visitCount1 = await getVisitCount(match.multiplePhones[1]);
        
        const booking1 = await createBooking({
          name: match.multipleNames[1],
          phone: match.multiplePhones[1],
          date: bookingDate,
          time: bookingTime,
          club: '',
          service_type: match.original.service,
          is_as_visit: true,
          original_name: match.original.name,
          attendance_status: 'pending',
          notes: `Low Confidence 매칭 #${match.id}: ${match.reason} | 복수명 처리 (이관욱)`,
        });
        
        results.processed.push({ id: match.id, booking: booking1, customer: customer1 });
        console.log(`  ✅ 이관욱 예약 생성: ${booking1.id} (방문 ${visitCount1 + 1}회)`);
        
        // 송영의는 전화번호가 없어서 건너뜀 (또는 수동 입력 필요)
        console.log(`  ⚠️  송영의는 전화번호가 없어 건너뜀`);
        continue;
      }
      
      // 이름 파싱
      const nameParse = parseNameAndAS(match.original.name);
      const cleanName = match.normalizedName || nameParse.cleanName;
      
      // AS 방문 여부 결정 (forceAS 옵션이 있으면 우선)
      const isAS = match.forceAS !== undefined ? match.forceAS : nameParse.isAS;
      
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
      
      const booking = await createBooking({
        name: cleanName,
        phone: match.suggestedPhone,
        date: bookingDate,
        time: bookingTime,
        club: '',
        service_type: match.original.service,
        is_as_visit: isAS,
        original_name: match.original.name,
        attendance_status: 'pending',
        notes: `Low Confidence 매칭 #${match.id}: ${match.reason}`,
      });
      
      results.processed.push({ id: match.id, booking, customer });
      console.log(`  ✅ 예약 생성: ${booking.id} (${cleanName}, 방문 ${visitCount + 1}회)`);
      
    } catch (error) {
      console.error(`  ❌ 처리 실패:`, error);
      results.errors.push({ id: match.id, error: error.message });
    }
  }
  
  return results;
}

// 메인 실행
async function main() {
  try {
    const results = await processLowConfidenceMatches();
    
    console.log('\n' + '='.repeat(60));
    console.log('📊 처리 결과');
    console.log('='.repeat(60));
    console.log(`\n✅ 처리 완료: ${results.processed.length}건`);
    console.log(`❌ 삭제 대상: ${results.deleted.length}건`);
    console.log(`⚠️  오류: ${results.errors.length}건`);
    
    if (results.deleted.length > 0) {
      console.log('\n📋 삭제 대상 목록:');
      results.deleted.forEach(item => {
        console.log(`  - ${item.original.name}: ${item.reason}`);
      });
    }
    
    if (results.errors.length > 0) {
      console.log('\n❌ 오류 목록:');
      results.errors.forEach(item => {
        console.log(`  - #${item.id}: ${item.error}`);
      });
    }
    
    // 결과 저장
    const reportPath = path.join(__dirname, '..', 'backup', `low-confidence-migration-${Date.now()}.json`);
    fs.writeFileSync(reportPath, JSON.stringify(results, null, 2), 'utf8');
    console.log(`\n📄 결과 보고서 저장: ${reportPath}`);
    
    console.log('\n✅ 마이그레이션 완료!\n');
    
  } catch (error) {
    console.error('\n❌ 마이그레이션 실패:', error);
    process.exit(1);
  }
}

main();


 * 
 * Low Confidence 매칭 결과를 처리하여 bookings 테이블에 추가
 * 
 * 처리 규칙:
 * 1. AS 분리: 이름에서 AS 제거하고 is_as_visit = true 설정
 * 2. 재방문: 기존 고객에 방문 횟수 추가
 * 3. 복수명 처리: "송영의,이관욱 AS" 같은 경우 1시간 단위로 2개 입력 또는 하나만 입력
 * 4. 삭제 대상: "시타" 같은 유효하지 않은 이름은 삭제 마킹
 * 
 * 사용법:
 * node scripts/migrate-low-confidence-matches.js
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

// Low Confidence 매칭 데이터 (19건)
const LOW_CONFIDENCE_MATCHES = [
  {
    id: 1,
    original: { name: "진지화AS", email: "massgoogolf@naver.com", date: "2023-08-22", service: "한번 시타해 보세요." },
    matched: { name: "진지화", phone: "01027542368", email: "aa@aa.aa", date: "2023-08-22" },
    reason: "이름 유사 (진지화AS ≈ 진지화)",
    suggestedPhone: "01027542368"
  },
  {
    id: 2,
    original: { name: "김대진(2인)", email: "massgoogolf@naver.com", date: "2023-08-20", service: "한번 시타해 보세요." },
    matched: { name: "김대", phone: "01052774119", email: "AAA.AAA@AAA.AAA", date: "2023-04-25" },
    reason: "이름 유사 (김대진(2인) ≈ 김대)",
    suggestedPhone: "01052774119"
  },
  {
    id: 3,
    original: { name: "최원구AS", email: "massgoogolf@naver.com", date: "2023-08-15", service: "한번 시타해 보세요." },
    matched: { name: "최원구", phone: "01032205375", email: "aa@aa.aa", date: "2023-08-12" },
    reason: "이름 유사 (최원구AS ≈ 최원구)",
    suggestedPhone: "01032205375"
  },
  {
    id: 4,
    original: { name: "송영의,이관욱 AS", email: "aaa.aaaa@aaa.aaa", date: "2023-04-26", service: "마쓰구드라이버 시타" },
    matched: { name: "이관욱", phone: "01037701435", email: "AAA.AAA@AAA.AAA", date: "2023-04-20" },
    reason: "이름 유사 (송영의,이관욱 AS ≈ 이관욱)",
    suggestedPhone: "01037701435",
    // 특별 처리: 송영의와 이관욱 모두 처리 (1시간 차이로 2개 입력)
    multipleNames: ["송영의", "이관욱"],
    multiplePhones: [null, "01037701435"] // 송영의 전화번호는 모름
  },
  {
    id: 5,
    original: { name: "오세집", email: "massgoogolf@naver.com", date: "2023-04-20", service: "마쓰구드라이버 시타" },
    matched: { name: "오세집 AS", phone: "01052184544", email: "aaa@aaaa.aaa", date: "2023-05-18" },
    reason: "이름 유사 (오세집 ≈ 오세집 AS)",
    suggestedPhone: "01052184544"
  },
  {
    id: 6,
    original: { name: "이동열", email: "massgoogolf@naver.com", date: "2023-03-21", service: "마쓰구드라이버 시타" },
    matched: { name: "이동열 방문AS 시타채수거", phone: "01056015676", email: "AAA@AA.AAA", date: "2023-05-26" },
    reason: "이름 유사 (이동열 ≈ 이동열 방문AS 시타채수거)",
    suggestedPhone: "01056015676",
    // AS 방문으로 처리
    forceAS: true
  },
  {
    id: 7,
    original: { name: "장철", email: "aa@aa.com", date: "2023-02-21", service: "마쓰구드라이버 시타" },
    matched: { name: "박장철 ", phone: "01003132603", email: "matia1072@naver.com", date: "2023-02-22" },
    reason: "이름 유사 (장철 ≈ 박장철 )",
    suggestedPhone: "01003132603",
    // 특별 처리: 박장철로 통일
    normalizedName: "박장철"
  },
  {
    id: 8,
    original: { name: "김석현점검", email: "massgoogolf@naver.com", date: "2023-02-17", service: "마쓰구드라이버 시타" },
    matched: { name: "김석현", phone: "01052620104", email: "oksk1731@naver.com", date: "2022-11-21" },
    reason: "이름 유사 (김석현점검 ≈ 김석현)",
    suggestedPhone: "01052620104"
  },
  {
    id: 9,
    original: { name: "최동우고객 사모님", email: "massgoogolf@naver.com", date: "2023-01-03", service: "마쓰구 드라이버 시타 서비스" },
    matched: { name: "최동우", phone: "01039549665", email: "Midam9665@hanmail.net", date: "2022-07-13" },
    reason: "이름 유사 (최동우고객 사모님 ≈ 최동우)",
    suggestedPhone: "01039549665",
    // 특별 처리: "최동우고객 사모님" → "최동우"
    normalizedName: "최동우"
  },
  {
    id: 10,
    original: { name: "김춘택AS", email: "massgoogolf@naver.com", date: "2022-11-24", service: "마쓰구 드라이버 시타 서비스" },
    matched: { name: "김춘택", phone: "01037258142", email: "aa@aa.aa", date: "2022-11-22" },
    reason: "이름 유사 (김춘택AS ≈ 김춘택)",
    suggestedPhone: "01037258142"
  },
  {
    id: 11,
    original: { name: "윤의권AS", email: "massgoogolf@naver.com", date: "2022-10-20", service: "마쓰구 드라이버 시타 서비스" },
    matched: { name: "윤의권", phone: "01032361000", email: "", date: "2022-10-14" },
    reason: "이름 유사 (윤의권AS ≈ 윤의권)",
    suggestedPhone: "01032361000"
  },
  {
    id: 12,
    original: { name: "김명배AS", email: "massgoogolf@naver.com", date: "2022-08-31", service: "마쓰구 드라이버 시타 서비스" },
    matched: { name: "김명배", phone: "01052244819", email: "aa@aa.aa", date: "2022-08-16" },
    reason: "이름 유사 (김명배AS ≈ 김명배)",
    suggestedPhone: "01052244819"
  },
  {
    id: 13,
    original: { name: "오세집", email: "massgoogolf@naver.com", date: "2022-08-18", service: "마쓰구 드라이버 시타 서비스" },
    matched: { name: "오세집 AS", phone: "01052184544", email: "aaa@aaaa.aaa", date: "2023-05-18" },
    reason: "이름 유사 (오세집 ≈ 오세집 AS)",
    suggestedPhone: "01052184544",
    // AS 방문으로 처리
    forceAS: true
  },
  {
    id: 14,
    original: { name: "김태정AS", email: "massgoogolf@naver.com", date: "2022-08-04", service: "마쓰구 드라이버 시타 서비스" },
    matched: { name: "김태정 ", phone: "01037140025", email: "ktj0025@aa.aa", date: "2025-07-17" },
    reason: "이름 유사 (김태정AS ≈ 김태정 )",
    suggestedPhone: "01037140025"
  },
  {
    id: 15,
    original: { name: "시타", email: "massgoogolf@naver.com", date: "2022-08-01", service: "마쓰구 드라이버 시타 서비스" },
    matched: { name: "이동열 방문AS 시타채수거", phone: "01056015676", email: "AAA@AA.AAA", date: "2023-05-26" },
    reason: "이름 유사 (시타 ≈ 이동열 방문AS 시타채수거)",
    suggestedPhone: "01056015676",
    // 삭제 대상
    shouldDelete: true,
    deleteReason: "이름이 '시타'만 있어 유효하지 않음"
  },
  {
    id: 16,
    original: { name: "김영희", email: "massgoogolf@naver.com", date: "2022-05-06", service: "마쓰구 드라이버 시타 서비스" },
    matched: { name: "김영희,여금성 AS 방", phone: "01099227312", email: "AA@AAA.AAA", date: "2023-06-27" },
    reason: "이름 유사 (김영희 ≈ 김영희,여금성 AS 방)",
    suggestedPhone: "01099227312"
  },
  {
    id: 17,
    original: { name: "김동광", email: "kimdk4292@daum.net", date: "2020-09-30", service: "마쓰구 드라이버 시타 서비스" },
    matched: { name: "김동광AS ", phone: "01052752924", email: "massgoogolf@naver.com", date: "2021-08-30" },
    reason: "이름 유사 (김동광 ≈ 김동광AS )",
    suggestedPhone: "01052752924"
  }
];

// 이름 파싱 및 AS 분리
function parseNameAndAS(name) {
  if (!name) return { cleanName: '', isAS: false, originalName: name };
  
  const originalName = name.trim();
  let cleanName = originalName;
  let isAS = false;
  
  // AS 패턴 매칭
  const asPatterns = [
    /^(.+?)\s*AS\s*$/i,
    /\s*AS\s*(.+?)$/i,
    /(.+?)\s*방문AS/i,
    /(.+?),\s*(.+?)\s*AS/i,
    /(.+?)\s*AS\s*방/i,
  ];
  
  for (const pattern of asPatterns) {
    const match = originalName.match(pattern);
    if (match) {
      cleanName = match[1] ? match[1].trim() : match[0].replace(/AS/gi, '').trim();
      isAS = true;
      break;
    }
  }
  
  // 괄호 내용 제거: "김대진(2인)" → "김대진"
  cleanName = cleanName.replace(/\([^)]*\)/g, '').trim();
  
  // 특수 키워드 제거
  cleanName = cleanName.replace(/\s*(사모님|여자|외\s*1|외\s*2|2인|매각상담|점검|방문|시타채수거)\s*/gi, '').trim();
  
  return { cleanName, isAS, originalName };
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

// 시간에 1시간 추가
function addHour(timeStr) {
  const [hour, minute] = timeStr.split(':').map(Number);
  const newHour = (hour + 1) % 24;
  return `${String(newHour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
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
    .ilike('name', name.trim())
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
      name: name.trim(),
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

// Low Confidence 매칭 처리
async function processLowConfidenceMatches() {
  console.log('🔍 Low Confidence 매칭 처리 시작...\n');
  
  const results = {
    processed: [],
    deleted: [],
    errors: [],
  };
  
  for (const match of LOW_CONFIDENCE_MATCHES) {
    try {
      console.log(`\n[${match.id}] 처리 중: ${match.original.name}`);
      
      // 삭제 대상 확인
      if (match.shouldDelete) {
        console.log(`  ❌ 삭제 대상: ${match.deleteReason}`);
        results.deleted.push({
          id: match.id,
          original: match.original,
          reason: match.deleteReason,
        });
        continue;
      }
      
      // 4번: 송영의,이관욱 AS 특별 처리
      if (match.id === 4 && match.multipleNames) {
        const bookingDate = extractDate(match.original.date);
        const bookingTime = extractTime(match.original.date);
        
        // 이관욱 처리 (전화번호 있음)
        const customer1 = await findOrCreateCustomer(
          match.multipleNames[1],
          match.multiplePhones[1],
          match.matched.email
        );
        const visitCount1 = await getVisitCount(match.multiplePhones[1]);
        
        const booking1 = await createBooking({
          name: match.multipleNames[1],
          phone: match.multiplePhones[1],
          date: bookingDate,
          time: bookingTime,
          club: '',
          service_type: match.original.service,
          is_as_visit: true,
          original_name: match.original.name,
          attendance_status: 'pending',
          notes: `Low Confidence 매칭 #${match.id}: ${match.reason} | 복수명 처리 (이관욱)`,
        });
        
        results.processed.push({ id: match.id, booking: booking1, customer: customer1 });
        console.log(`  ✅ 이관욱 예약 생성: ${booking1.id} (방문 ${visitCount1 + 1}회)`);
        
        // 송영의는 전화번호가 없어서 건너뜀 (또는 수동 입력 필요)
        console.log(`  ⚠️  송영의는 전화번호가 없어 건너뜀`);
        continue;
      }
      
      // 이름 파싱
      const nameParse = parseNameAndAS(match.original.name);
      const cleanName = match.normalizedName || nameParse.cleanName;
      
      // AS 방문 여부 결정 (forceAS 옵션이 있으면 우선)
      const isAS = match.forceAS !== undefined ? match.forceAS : nameParse.isAS;
      
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
      
      const booking = await createBooking({
        name: cleanName,
        phone: match.suggestedPhone,
        date: bookingDate,
        time: bookingTime,
        club: '',
        service_type: match.original.service,
        is_as_visit: isAS,
        original_name: match.original.name,
        attendance_status: 'pending',
        notes: `Low Confidence 매칭 #${match.id}: ${match.reason}`,
      });
      
      results.processed.push({ id: match.id, booking, customer });
      console.log(`  ✅ 예약 생성: ${booking.id} (${cleanName}, 방문 ${visitCount + 1}회)`);
      
    } catch (error) {
      console.error(`  ❌ 처리 실패:`, error);
      results.errors.push({ id: match.id, error: error.message });
    }
  }
  
  return results;
}

// 메인 실행
async function main() {
  try {
    const results = await processLowConfidenceMatches();
    
    console.log('\n' + '='.repeat(60));
    console.log('📊 처리 결과');
    console.log('='.repeat(60));
    console.log(`\n✅ 처리 완료: ${results.processed.length}건`);
    console.log(`❌ 삭제 대상: ${results.deleted.length}건`);
    console.log(`⚠️  오류: ${results.errors.length}건`);
    
    if (results.deleted.length > 0) {
      console.log('\n📋 삭제 대상 목록:');
      results.deleted.forEach(item => {
        console.log(`  - ${item.original.name}: ${item.reason}`);
      });
    }
    
    if (results.errors.length > 0) {
      console.log('\n❌ 오류 목록:');
      results.errors.forEach(item => {
        console.log(`  - #${item.id}: ${item.error}`);
      });
    }
    
    // 결과 저장
    const reportPath = path.join(__dirname, '..', 'backup', `low-confidence-migration-${Date.now()}.json`);
    fs.writeFileSync(reportPath, JSON.stringify(results, null, 2), 'utf8');
    console.log(`\n📄 결과 보고서 저장: ${reportPath}`);
    
    console.log('\n✅ 마이그레이션 완료!\n');
    
  } catch (error) {
    console.error('\n❌ 마이그레이션 실패:', error);
    process.exit(1);
  }
}

main();


 * 
 * Low Confidence 매칭 결과를 처리하여 bookings 테이블에 추가
 * 
 * 처리 규칙:
 * 1. AS 분리: 이름에서 AS 제거하고 is_as_visit = true 설정
 * 2. 재방문: 기존 고객에 방문 횟수 추가
 * 3. 복수명 처리: "송영의,이관욱 AS" 같은 경우 1시간 단위로 2개 입력 또는 하나만 입력
 * 4. 삭제 대상: "시타" 같은 유효하지 않은 이름은 삭제 마킹
 * 
 * 사용법:
 * node scripts/migrate-low-confidence-matches.js
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

// Low Confidence 매칭 데이터 (19건)
const LOW_CONFIDENCE_MATCHES = [
  {
    id: 1,
    original: { name: "진지화AS", email: "massgoogolf@naver.com", date: "2023-08-22", service: "한번 시타해 보세요." },
    matched: { name: "진지화", phone: "01027542368", email: "aa@aa.aa", date: "2023-08-22" },
    reason: "이름 유사 (진지화AS ≈ 진지화)",
    suggestedPhone: "01027542368"
  },
  {
    id: 2,
    original: { name: "김대진(2인)", email: "massgoogolf@naver.com", date: "2023-08-20", service: "한번 시타해 보세요." },
    matched: { name: "김대", phone: "01052774119", email: "AAA.AAA@AAA.AAA", date: "2023-04-25" },
    reason: "이름 유사 (김대진(2인) ≈ 김대)",
    suggestedPhone: "01052774119"
  },
  {
    id: 3,
    original: { name: "최원구AS", email: "massgoogolf@naver.com", date: "2023-08-15", service: "한번 시타해 보세요." },
    matched: { name: "최원구", phone: "01032205375", email: "aa@aa.aa", date: "2023-08-12" },
    reason: "이름 유사 (최원구AS ≈ 최원구)",
    suggestedPhone: "01032205375"
  },
  {
    id: 4,
    original: { name: "송영의,이관욱 AS", email: "aaa.aaaa@aaa.aaa", date: "2023-04-26", service: "마쓰구드라이버 시타" },
    matched: { name: "이관욱", phone: "01037701435", email: "AAA.AAA@AAA.AAA", date: "2023-04-20" },
    reason: "이름 유사 (송영의,이관욱 AS ≈ 이관욱)",
    suggestedPhone: "01037701435",
    // 특별 처리: 송영의와 이관욱 모두 처리 (1시간 차이로 2개 입력)
    multipleNames: ["송영의", "이관욱"],
    multiplePhones: [null, "01037701435"] // 송영의 전화번호는 모름
  },
  {
    id: 5,
    original: { name: "오세집", email: "massgoogolf@naver.com", date: "2023-04-20", service: "마쓰구드라이버 시타" },
    matched: { name: "오세집 AS", phone: "01052184544", email: "aaa@aaaa.aaa", date: "2023-05-18" },
    reason: "이름 유사 (오세집 ≈ 오세집 AS)",
    suggestedPhone: "01052184544"
  },
  {
    id: 6,
    original: { name: "이동열", email: "massgoogolf@naver.com", date: "2023-03-21", service: "마쓰구드라이버 시타" },
    matched: { name: "이동열 방문AS 시타채수거", phone: "01056015676", email: "AAA@AA.AAA", date: "2023-05-26" },
    reason: "이름 유사 (이동열 ≈ 이동열 방문AS 시타채수거)",
    suggestedPhone: "01056015676",
    // AS 방문으로 처리
    forceAS: true
  },
  {
    id: 7,
    original: { name: "장철", email: "aa@aa.com", date: "2023-02-21", service: "마쓰구드라이버 시타" },
    matched: { name: "박장철 ", phone: "01003132603", email: "matia1072@naver.com", date: "2023-02-22" },
    reason: "이름 유사 (장철 ≈ 박장철 )",
    suggestedPhone: "01003132603",
    // 특별 처리: 박장철로 통일
    normalizedName: "박장철"
  },
  {
    id: 8,
    original: { name: "김석현점검", email: "massgoogolf@naver.com", date: "2023-02-17", service: "마쓰구드라이버 시타" },
    matched: { name: "김석현", phone: "01052620104", email: "oksk1731@naver.com", date: "2022-11-21" },
    reason: "이름 유사 (김석현점검 ≈ 김석현)",
    suggestedPhone: "01052620104"
  },
  {
    id: 9,
    original: { name: "최동우고객 사모님", email: "massgoogolf@naver.com", date: "2023-01-03", service: "마쓰구 드라이버 시타 서비스" },
    matched: { name: "최동우", phone: "01039549665", email: "Midam9665@hanmail.net", date: "2022-07-13" },
    reason: "이름 유사 (최동우고객 사모님 ≈ 최동우)",
    suggestedPhone: "01039549665",
    // 특별 처리: "최동우고객 사모님" → "최동우"
    normalizedName: "최동우"
  },
  {
    id: 10,
    original: { name: "김춘택AS", email: "massgoogolf@naver.com", date: "2022-11-24", service: "마쓰구 드라이버 시타 서비스" },
    matched: { name: "김춘택", phone: "01037258142", email: "aa@aa.aa", date: "2022-11-22" },
    reason: "이름 유사 (김춘택AS ≈ 김춘택)",
    suggestedPhone: "01037258142"
  },
  {
    id: 11,
    original: { name: "윤의권AS", email: "massgoogolf@naver.com", date: "2022-10-20", service: "마쓰구 드라이버 시타 서비스" },
    matched: { name: "윤의권", phone: "01032361000", email: "", date: "2022-10-14" },
    reason: "이름 유사 (윤의권AS ≈ 윤의권)",
    suggestedPhone: "01032361000"
  },
  {
    id: 12,
    original: { name: "김명배AS", email: "massgoogolf@naver.com", date: "2022-08-31", service: "마쓰구 드라이버 시타 서비스" },
    matched: { name: "김명배", phone: "01052244819", email: "aa@aa.aa", date: "2022-08-16" },
    reason: "이름 유사 (김명배AS ≈ 김명배)",
    suggestedPhone: "01052244819"
  },
  {
    id: 13,
    original: { name: "오세집", email: "massgoogolf@naver.com", date: "2022-08-18", service: "마쓰구 드라이버 시타 서비스" },
    matched: { name: "오세집 AS", phone: "01052184544", email: "aaa@aaaa.aaa", date: "2023-05-18" },
    reason: "이름 유사 (오세집 ≈ 오세집 AS)",
    suggestedPhone: "01052184544",
    // AS 방문으로 처리
    forceAS: true
  },
  {
    id: 14,
    original: { name: "김태정AS", email: "massgoogolf@naver.com", date: "2022-08-04", service: "마쓰구 드라이버 시타 서비스" },
    matched: { name: "김태정 ", phone: "01037140025", email: "ktj0025@aa.aa", date: "2025-07-17" },
    reason: "이름 유사 (김태정AS ≈ 김태정 )",
    suggestedPhone: "01037140025"
  },
  {
    id: 15,
    original: { name: "시타", email: "massgoogolf@naver.com", date: "2022-08-01", service: "마쓰구 드라이버 시타 서비스" },
    matched: { name: "이동열 방문AS 시타채수거", phone: "01056015676", email: "AAA@AA.AAA", date: "2023-05-26" },
    reason: "이름 유사 (시타 ≈ 이동열 방문AS 시타채수거)",
    suggestedPhone: "01056015676",
    // 삭제 대상
    shouldDelete: true,
    deleteReason: "이름이 '시타'만 있어 유효하지 않음"
  },
  {
    id: 16,
    original: { name: "김영희", email: "massgoogolf@naver.com", date: "2022-05-06", service: "마쓰구 드라이버 시타 서비스" },
    matched: { name: "김영희,여금성 AS 방", phone: "01099227312", email: "AA@AAA.AAA", date: "2023-06-27" },
    reason: "이름 유사 (김영희 ≈ 김영희,여금성 AS 방)",
    suggestedPhone: "01099227312"
  },
  {
    id: 17,
    original: { name: "김동광", email: "kimdk4292@daum.net", date: "2020-09-30", service: "마쓰구 드라이버 시타 서비스" },
    matched: { name: "김동광AS ", phone: "01052752924", email: "massgoogolf@naver.com", date: "2021-08-30" },
    reason: "이름 유사 (김동광 ≈ 김동광AS )",
    suggestedPhone: "01052752924"
  }
];

// 이름 파싱 및 AS 분리
function parseNameAndAS(name) {
  if (!name) return { cleanName: '', isAS: false, originalName: name };
  
  const originalName = name.trim();
  let cleanName = originalName;
  let isAS = false;
  
  // AS 패턴 매칭
  const asPatterns = [
    /^(.+?)\s*AS\s*$/i,
    /\s*AS\s*(.+?)$/i,
    /(.+?)\s*방문AS/i,
    /(.+?),\s*(.+?)\s*AS/i,
    /(.+?)\s*AS\s*방/i,
  ];
  
  for (const pattern of asPatterns) {
    const match = originalName.match(pattern);
    if (match) {
      cleanName = match[1] ? match[1].trim() : match[0].replace(/AS/gi, '').trim();
      isAS = true;
      break;
    }
  }
  
  // 괄호 내용 제거: "김대진(2인)" → "김대진"
  cleanName = cleanName.replace(/\([^)]*\)/g, '').trim();
  
  // 특수 키워드 제거
  cleanName = cleanName.replace(/\s*(사모님|여자|외\s*1|외\s*2|2인|매각상담|점검|방문|시타채수거)\s*/gi, '').trim();
  
  return { cleanName, isAS, originalName };
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

// 시간에 1시간 추가
function addHour(timeStr) {
  const [hour, minute] = timeStr.split(':').map(Number);
  const newHour = (hour + 1) % 24;
  return `${String(newHour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
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
    .ilike('name', name.trim())
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
      name: name.trim(),
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

// Low Confidence 매칭 처리
async function processLowConfidenceMatches() {
  console.log('🔍 Low Confidence 매칭 처리 시작...\n');
  
  const results = {
    processed: [],
    deleted: [],
    errors: [],
  };
  
  for (const match of LOW_CONFIDENCE_MATCHES) {
    try {
      console.log(`\n[${match.id}] 처리 중: ${match.original.name}`);
      
      // 삭제 대상 확인
      if (match.shouldDelete) {
        console.log(`  ❌ 삭제 대상: ${match.deleteReason}`);
        results.deleted.push({
          id: match.id,
          original: match.original,
          reason: match.deleteReason,
        });
        continue;
      }
      
      // 4번: 송영의,이관욱 AS 특별 처리
      if (match.id === 4 && match.multipleNames) {
        const bookingDate = extractDate(match.original.date);
        const bookingTime = extractTime(match.original.date);
        
        // 이관욱 처리 (전화번호 있음)
        const customer1 = await findOrCreateCustomer(
          match.multipleNames[1],
          match.multiplePhones[1],
          match.matched.email
        );
        const visitCount1 = await getVisitCount(match.multiplePhones[1]);
        
        const booking1 = await createBooking({
          name: match.multipleNames[1],
          phone: match.multiplePhones[1],
          date: bookingDate,
          time: bookingTime,
          club: '',
          service_type: match.original.service,
          is_as_visit: true,
          original_name: match.original.name,
          attendance_status: 'pending',
          notes: `Low Confidence 매칭 #${match.id}: ${match.reason} | 복수명 처리 (이관욱)`,
        });
        
        results.processed.push({ id: match.id, booking: booking1, customer: customer1 });
        console.log(`  ✅ 이관욱 예약 생성: ${booking1.id} (방문 ${visitCount1 + 1}회)`);
        
        // 송영의는 전화번호가 없어서 건너뜀 (또는 수동 입력 필요)
        console.log(`  ⚠️  송영의는 전화번호가 없어 건너뜀`);
        continue;
      }
      
      // 이름 파싱
      const nameParse = parseNameAndAS(match.original.name);
      const cleanName = match.normalizedName || nameParse.cleanName;
      
      // AS 방문 여부 결정 (forceAS 옵션이 있으면 우선)
      const isAS = match.forceAS !== undefined ? match.forceAS : nameParse.isAS;
      
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
      
      const booking = await createBooking({
        name: cleanName,
        phone: match.suggestedPhone,
        date: bookingDate,
        time: bookingTime,
        club: '',
        service_type: match.original.service,
        is_as_visit: isAS,
        original_name: match.original.name,
        attendance_status: 'pending',
        notes: `Low Confidence 매칭 #${match.id}: ${match.reason}`,
      });
      
      results.processed.push({ id: match.id, booking, customer });
      console.log(`  ✅ 예약 생성: ${booking.id} (${cleanName}, 방문 ${visitCount + 1}회)`);
      
    } catch (error) {
      console.error(`  ❌ 처리 실패:`, error);
      results.errors.push({ id: match.id, error: error.message });
    }
  }
  
  return results;
}

// 메인 실행
async function main() {
  try {
    const results = await processLowConfidenceMatches();
    
    console.log('\n' + '='.repeat(60));
    console.log('📊 처리 결과');
    console.log('='.repeat(60));
    console.log(`\n✅ 처리 완료: ${results.processed.length}건`);
    console.log(`❌ 삭제 대상: ${results.deleted.length}건`);
    console.log(`⚠️  오류: ${results.errors.length}건`);
    
    if (results.deleted.length > 0) {
      console.log('\n📋 삭제 대상 목록:');
      results.deleted.forEach(item => {
        console.log(`  - ${item.original.name}: ${item.reason}`);
      });
    }
    
    if (results.errors.length > 0) {
      console.log('\n❌ 오류 목록:');
      results.errors.forEach(item => {
        console.log(`  - #${item.id}: ${item.error}`);
      });
    }
    
    // 결과 저장
    const reportPath = path.join(__dirname, '..', 'backup', `low-confidence-migration-${Date.now()}.json`);
    fs.writeFileSync(reportPath, JSON.stringify(results, null, 2), 'utf8');
    console.log(`\n📄 결과 보고서 저장: ${reportPath}`);
    
    console.log('\n✅ 마이그레이션 완료!\n');
    
  } catch (error) {
    console.error('\n❌ 마이그레이션 실패:', error);
    process.exit(1);
  }
}

main();


 * 
 * Low Confidence 매칭 결과를 처리하여 bookings 테이블에 추가
 * 
 * 처리 규칙:
 * 1. AS 분리: 이름에서 AS 제거하고 is_as_visit = true 설정
 * 2. 재방문: 기존 고객에 방문 횟수 추가
 * 3. 복수명 처리: "송영의,이관욱 AS" 같은 경우 1시간 단위로 2개 입력 또는 하나만 입력
 * 4. 삭제 대상: "시타" 같은 유효하지 않은 이름은 삭제 마킹
 * 
 * 사용법:
 * node scripts/migrate-low-confidence-matches.js
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

// Low Confidence 매칭 데이터 (19건)
const LOW_CONFIDENCE_MATCHES = [
  {
    id: 1,
    original: { name: "진지화AS", email: "massgoogolf@naver.com", date: "2023-08-22", service: "한번 시타해 보세요." },
    matched: { name: "진지화", phone: "01027542368", email: "aa@aa.aa", date: "2023-08-22" },
    reason: "이름 유사 (진지화AS ≈ 진지화)",
    suggestedPhone: "01027542368"
  },
  {
    id: 2,
    original: { name: "김대진(2인)", email: "massgoogolf@naver.com", date: "2023-08-20", service: "한번 시타해 보세요." },
    matched: { name: "김대", phone: "01052774119", email: "AAA.AAA@AAA.AAA", date: "2023-04-25" },
    reason: "이름 유사 (김대진(2인) ≈ 김대)",
    suggestedPhone: "01052774119"
  },
  {
    id: 3,
    original: { name: "최원구AS", email: "massgoogolf@naver.com", date: "2023-08-15", service: "한번 시타해 보세요." },
    matched: { name: "최원구", phone: "01032205375", email: "aa@aa.aa", date: "2023-08-12" },
    reason: "이름 유사 (최원구AS ≈ 최원구)",
    suggestedPhone: "01032205375"
  },
  {
    id: 4,
    original: { name: "송영의,이관욱 AS", email: "aaa.aaaa@aaa.aaa", date: "2023-04-26", service: "마쓰구드라이버 시타" },
    matched: { name: "이관욱", phone: "01037701435", email: "AAA.AAA@AAA.AAA", date: "2023-04-20" },
    reason: "이름 유사 (송영의,이관욱 AS ≈ 이관욱)",
    suggestedPhone: "01037701435",
    // 특별 처리: 송영의와 이관욱 모두 처리 (1시간 차이로 2개 입력)
    multipleNames: ["송영의", "이관욱"],
    multiplePhones: [null, "01037701435"] // 송영의 전화번호는 모름
  },
  {
    id: 5,
    original: { name: "오세집", email: "massgoogolf@naver.com", date: "2023-04-20", service: "마쓰구드라이버 시타" },
    matched: { name: "오세집 AS", phone: "01052184544", email: "aaa@aaaa.aaa", date: "2023-05-18" },
    reason: "이름 유사 (오세집 ≈ 오세집 AS)",
    suggestedPhone: "01052184544"
  },
  {
    id: 6,
    original: { name: "이동열", email: "massgoogolf@naver.com", date: "2023-03-21", service: "마쓰구드라이버 시타" },
    matched: { name: "이동열 방문AS 시타채수거", phone: "01056015676", email: "AAA@AA.AAA", date: "2023-05-26" },
    reason: "이름 유사 (이동열 ≈ 이동열 방문AS 시타채수거)",
    suggestedPhone: "01056015676",
    // AS 방문으로 처리
    forceAS: true
  },
  {
    id: 7,
    original: { name: "장철", email: "aa@aa.com", date: "2023-02-21", service: "마쓰구드라이버 시타" },
    matched: { name: "박장철 ", phone: "01003132603", email: "matia1072@naver.com", date: "2023-02-22" },
    reason: "이름 유사 (장철 ≈ 박장철 )",
    suggestedPhone: "01003132603",
    // 특별 처리: 박장철로 통일
    normalizedName: "박장철"
  },
  {
    id: 8,
    original: { name: "김석현점검", email: "massgoogolf@naver.com", date: "2023-02-17", service: "마쓰구드라이버 시타" },
    matched: { name: "김석현", phone: "01052620104", email: "oksk1731@naver.com", date: "2022-11-21" },
    reason: "이름 유사 (김석현점검 ≈ 김석현)",
    suggestedPhone: "01052620104"
  },
  {
    id: 9,
    original: { name: "최동우고객 사모님", email: "massgoogolf@naver.com", date: "2023-01-03", service: "마쓰구 드라이버 시타 서비스" },
    matched: { name: "최동우", phone: "01039549665", email: "Midam9665@hanmail.net", date: "2022-07-13" },
    reason: "이름 유사 (최동우고객 사모님 ≈ 최동우)",
    suggestedPhone: "01039549665",
    // 특별 처리: "최동우고객 사모님" → "최동우"
    normalizedName: "최동우"
  },
  {
    id: 10,
    original: { name: "김춘택AS", email: "massgoogolf@naver.com", date: "2022-11-24", service: "마쓰구 드라이버 시타 서비스" },
    matched: { name: "김춘택", phone: "01037258142", email: "aa@aa.aa", date: "2022-11-22" },
    reason: "이름 유사 (김춘택AS ≈ 김춘택)",
    suggestedPhone: "01037258142"
  },
  {
    id: 11,
    original: { name: "윤의권AS", email: "massgoogolf@naver.com", date: "2022-10-20", service: "마쓰구 드라이버 시타 서비스" },
    matched: { name: "윤의권", phone: "01032361000", email: "", date: "2022-10-14" },
    reason: "이름 유사 (윤의권AS ≈ 윤의권)",
    suggestedPhone: "01032361000"
  },
  {
    id: 12,
    original: { name: "김명배AS", email: "massgoogolf@naver.com", date: "2022-08-31", service: "마쓰구 드라이버 시타 서비스" },
    matched: { name: "김명배", phone: "01052244819", email: "aa@aa.aa", date: "2022-08-16" },
    reason: "이름 유사 (김명배AS ≈ 김명배)",
    suggestedPhone: "01052244819"
  },
  {
    id: 13,
    original: { name: "오세집", email: "massgoogolf@naver.com", date: "2022-08-18", service: "마쓰구 드라이버 시타 서비스" },
    matched: { name: "오세집 AS", phone: "01052184544", email: "aaa@aaaa.aaa", date: "2023-05-18" },
    reason: "이름 유사 (오세집 ≈ 오세집 AS)",
    suggestedPhone: "01052184544",
    // AS 방문으로 처리
    forceAS: true
  },
  {
    id: 14,
    original: { name: "김태정AS", email: "massgoogolf@naver.com", date: "2022-08-04", service: "마쓰구 드라이버 시타 서비스" },
    matched: { name: "김태정 ", phone: "01037140025", email: "ktj0025@aa.aa", date: "2025-07-17" },
    reason: "이름 유사 (김태정AS ≈ 김태정 )",
    suggestedPhone: "01037140025"
  },
  {
    id: 15,
    original: { name: "시타", email: "massgoogolf@naver.com", date: "2022-08-01", service: "마쓰구 드라이버 시타 서비스" },
    matched: { name: "이동열 방문AS 시타채수거", phone: "01056015676", email: "AAA@AA.AAA", date: "2023-05-26" },
    reason: "이름 유사 (시타 ≈ 이동열 방문AS 시타채수거)",
    suggestedPhone: "01056015676",
    // 삭제 대상
    shouldDelete: true,
    deleteReason: "이름이 '시타'만 있어 유효하지 않음"
  },
  {
    id: 16,
    original: { name: "김영희", email: "massgoogolf@naver.com", date: "2022-05-06", service: "마쓰구 드라이버 시타 서비스" },
    matched: { name: "김영희,여금성 AS 방", phone: "01099227312", email: "AA@AAA.AAA", date: "2023-06-27" },
    reason: "이름 유사 (김영희 ≈ 김영희,여금성 AS 방)",
    suggestedPhone: "01099227312"
  },
  {
    id: 17,
    original: { name: "김동광", email: "kimdk4292@daum.net", date: "2020-09-30", service: "마쓰구 드라이버 시타 서비스" },
    matched: { name: "김동광AS ", phone: "01052752924", email: "massgoogolf@naver.com", date: "2021-08-30" },
    reason: "이름 유사 (김동광 ≈ 김동광AS )",
    suggestedPhone: "01052752924"
  }
];

// 이름 파싱 및 AS 분리
function parseNameAndAS(name) {
  if (!name) return { cleanName: '', isAS: false, originalName: name };
  
  const originalName = name.trim();
  let cleanName = originalName;
  let isAS = false;
  
  // AS 패턴 매칭
  const asPatterns = [
    /^(.+?)\s*AS\s*$/i,
    /\s*AS\s*(.+?)$/i,
    /(.+?)\s*방문AS/i,
    /(.+?),\s*(.+?)\s*AS/i,
    /(.+?)\s*AS\s*방/i,
  ];
  
  for (const pattern of asPatterns) {
    const match = originalName.match(pattern);
    if (match) {
      cleanName = match[1] ? match[1].trim() : match[0].replace(/AS/gi, '').trim();
      isAS = true;
      break;
    }
  }
  
  // 괄호 내용 제거: "김대진(2인)" → "김대진"
  cleanName = cleanName.replace(/\([^)]*\)/g, '').trim();
  
  // 특수 키워드 제거
  cleanName = cleanName.replace(/\s*(사모님|여자|외\s*1|외\s*2|2인|매각상담|점검|방문|시타채수거)\s*/gi, '').trim();
  
  return { cleanName, isAS, originalName };
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

// 시간에 1시간 추가
function addHour(timeStr) {
  const [hour, minute] = timeStr.split(':').map(Number);
  const newHour = (hour + 1) % 24;
  return `${String(newHour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
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
    .ilike('name', name.trim())
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
      name: name.trim(),
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

// Low Confidence 매칭 처리
async function processLowConfidenceMatches() {
  console.log('🔍 Low Confidence 매칭 처리 시작...\n');
  
  const results = {
    processed: [],
    deleted: [],
    errors: [],
  };
  
  for (const match of LOW_CONFIDENCE_MATCHES) {
    try {
      console.log(`\n[${match.id}] 처리 중: ${match.original.name}`);
      
      // 삭제 대상 확인
      if (match.shouldDelete) {
        console.log(`  ❌ 삭제 대상: ${match.deleteReason}`);
        results.deleted.push({
          id: match.id,
          original: match.original,
          reason: match.deleteReason,
        });
        continue;
      }
      
      // 4번: 송영의,이관욱 AS 특별 처리
      if (match.id === 4 && match.multipleNames) {
        const bookingDate = extractDate(match.original.date);
        const bookingTime = extractTime(match.original.date);
        
        // 이관욱 처리 (전화번호 있음)
        const customer1 = await findOrCreateCustomer(
          match.multipleNames[1],
          match.multiplePhones[1],
          match.matched.email
        );
        const visitCount1 = await getVisitCount(match.multiplePhones[1]);
        
        const booking1 = await createBooking({
          name: match.multipleNames[1],
          phone: match.multiplePhones[1],
          date: bookingDate,
          time: bookingTime,
          club: '',
          service_type: match.original.service,
          is_as_visit: true,
          original_name: match.original.name,
          attendance_status: 'pending',
          notes: `Low Confidence 매칭 #${match.id}: ${match.reason} | 복수명 처리 (이관욱)`,
        });
        
        results.processed.push({ id: match.id, booking: booking1, customer: customer1 });
        console.log(`  ✅ 이관욱 예약 생성: ${booking1.id} (방문 ${visitCount1 + 1}회)`);
        
        // 송영의는 전화번호가 없어서 건너뜀 (또는 수동 입력 필요)
        console.log(`  ⚠️  송영의는 전화번호가 없어 건너뜀`);
        continue;
      }
      
      // 이름 파싱
      const nameParse = parseNameAndAS(match.original.name);
      const cleanName = match.normalizedName || nameParse.cleanName;
      
      // AS 방문 여부 결정 (forceAS 옵션이 있으면 우선)
      const isAS = match.forceAS !== undefined ? match.forceAS : nameParse.isAS;
      
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
      
      const booking = await createBooking({
        name: cleanName,
        phone: match.suggestedPhone,
        date: bookingDate,
        time: bookingTime,
        club: '',
        service_type: match.original.service,
        is_as_visit: isAS,
        original_name: match.original.name,
        attendance_status: 'pending',
        notes: `Low Confidence 매칭 #${match.id}: ${match.reason}`,
      });
      
      results.processed.push({ id: match.id, booking, customer });
      console.log(`  ✅ 예약 생성: ${booking.id} (${cleanName}, 방문 ${visitCount + 1}회)`);
      
    } catch (error) {
      console.error(`  ❌ 처리 실패:`, error);
      results.errors.push({ id: match.id, error: error.message });
    }
  }
  
  return results;
}

// 메인 실행
async function main() {
  try {
    const results = await processLowConfidenceMatches();
    
    console.log('\n' + '='.repeat(60));
    console.log('📊 처리 결과');
    console.log('='.repeat(60));
    console.log(`\n✅ 처리 완료: ${results.processed.length}건`);
    console.log(`❌ 삭제 대상: ${results.deleted.length}건`);
    console.log(`⚠️  오류: ${results.errors.length}건`);
    
    if (results.deleted.length > 0) {
      console.log('\n📋 삭제 대상 목록:');
      results.deleted.forEach(item => {
        console.log(`  - ${item.original.name}: ${item.reason}`);
      });
    }
    
    if (results.errors.length > 0) {
      console.log('\n❌ 오류 목록:');
      results.errors.forEach(item => {
        console.log(`  - #${item.id}: ${item.error}`);
      });
    }
    
    // 결과 저장
    const reportPath = path.join(__dirname, '..', 'backup', `low-confidence-migration-${Date.now()}.json`);
    fs.writeFileSync(reportPath, JSON.stringify(results, null, 2), 'utf8');
    console.log(`\n📄 결과 보고서 저장: ${reportPath}`);
    
    console.log('\n✅ 마이그레이션 완료!\n');
    
  } catch (error) {
    console.error('\n❌ 마이그레이션 실패:', error);
    process.exit(1);
  }
}

main();

