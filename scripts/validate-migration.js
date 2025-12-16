/**
 * Wix 마이그레이션 검증 스크립트
 * 
 * 마이그레이션된 데이터의 품질을 검증하고 누락된 데이터를 확인합니다.
 * 
 * 사용법:
 * node scripts/validate-migration.js
 */

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
const csv = require('csv-parser');

// 환경 변수 로드
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Supabase 환경 변수가 설정되지 않았습니다.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// 전화번호 정규화 (마이그레이션과 동일한 로직)
function normalizePhone(phone) {
  if (!phone) return null;
  let cleaned = phone.toString().replace(/[\s\-+()]/g, '');
  if (cleaned.startsWith('82')) {
    cleaned = '0' + cleaned.substring(2);
  }
  if (cleaned.startsWith('01') && cleaned.length === 10) {
    cleaned = '010' + cleaned.substring(2);
  }
  if (!/^010\d{8}$/.test(cleaned)) {
    return null;
  }
  return cleaned;
}

async function validateMigration() {
  console.log('🔍 마이그레이션 검증 시작...\n');

  // 1. CSV 파일 읽기
  const csvFilePath = path.join(__dirname, '..', 'database', '예약 목록-2025. 11. 26..csv');
  if (!fs.existsSync(csvFilePath)) {
    console.error(`❌ CSV 파일을 찾을 수 없습니다: ${csvFilePath}`);
    process.exit(1);
  }

  const csvRows = [];
  await new Promise((resolve, reject) => {
    fs.createReadStream(csvFilePath)
      .pipe(csv())
      .on('data', (row) => csvRows.push(row))
      .on('end', resolve)
      .on('error', reject);
  });

  console.log(`📊 CSV 파일: ${csvRows.length}건\n`);

  // 2. 데이터베이스에서 마이그레이션된 데이터 조회
  const { data: dbBookings, error: bookingsError } = await supabase
    .from('bookings')
    .select('*')
    .order('created_at', { ascending: false });

  if (bookingsError) {
    console.error('❌ 예약 데이터 조회 실패:', bookingsError);
    process.exit(1);
  }

  console.log(`📊 DB 예약 데이터: ${dbBookings.length}건\n`);

  // 3. CSV 데이터와 DB 데이터 비교
  const csvPhones = new Set();
  const csvBookings = new Map(); // phone -> [bookings]

  for (const row of csvRows) {
    const phone = normalizePhone(row['전화번호'] || row['전화']);
    if (!phone) continue;

    csvPhones.add(phone);
    if (!csvBookings.has(phone)) {
      csvBookings.set(phone, []);
    }

    const bookingDate = row['예약 시작 시간'];
    if (bookingDate) {
      csvBookings.get(phone).push({
        phone,
        name: row['이름'],
        date: bookingDate,
        service: row['서비스명'],
        status: row['예약 상태'],
        attendance: row['참석 여부'],
      });
    }
  }

  // 4. DB 데이터 그룹화
  const dbPhones = new Set();
  const dbBookingsByPhone = new Map();

  for (const booking of dbBookings) {
    const phone = normalizePhone(booking.phone);
    if (!phone) continue;

    dbPhones.add(phone);
    if (!dbBookingsByPhone.has(phone)) {
      dbBookingsByPhone.set(phone, []);
    }
    dbBookingsByPhone.get(phone).push(booking);
  }

  // 5. 누락된 데이터 확인
  console.log('='.repeat(60));
  console.log('📋 검증 결과');
  console.log('='.repeat(60));

  // 5-1. CSV에 있지만 DB에 없는 전화번호
  const missingPhones = [];
  for (const phone of csvPhones) {
    if (!dbPhones.has(phone)) {
      const csvData = csvBookings.get(phone);
      missingPhones.push({
        phone,
        name: csvData[0]?.name,
        bookings: csvData.length,
      });
    }
  }

  if (missingPhones.length > 0) {
    console.log(`\n⚠️  DB에 없는 전화번호: ${missingPhones.length}건`);
    console.log('\n상세 목록:');
    missingPhones.slice(0, 20).forEach((item, idx) => {
      console.log(`  ${idx + 1}. ${item.name} (${item.phone}) - ${item.bookings}건 예약`);
    });
    if (missingPhones.length > 20) {
      console.log(`  ... 외 ${missingPhones.length - 20}건`);
    }
  } else {
    console.log('\n✅ 모든 전화번호가 DB에 있습니다.');
  }

  // 5-2. 데이터 품질 검증
  console.log('\n' + '='.repeat(60));
  console.log('📊 데이터 품질 검증');
  console.log('='.repeat(60));

  const stats = {
    total: dbBookings.length,
    withClub: 0,
    withClubBrand: 0,
    withClubLoft: 0,
    withClubShaft: 0,
    withDistance: 0,
    withAgeGroup: 0,
    withTrajectory: 0,
    withShotShape: 0,
    withEmail: 0,
    withNotes: 0,
    attendanceStatus: {
      attended: 0,
      no_show: 0,
      cancelled: 0,
      pending: 0,
    },
    bookingStatus: {
      confirmed: 0,
      pending: 0,
      cancelled: 0,
      completed: 0,
    },
    emptyClub: 0,
  };

  for (const booking of dbBookings) {
    if (booking.club && booking.club.trim() !== '') stats.withClub++;
    if (booking.club === '' || !booking.club) stats.emptyClub++;
    if (booking.club_brand) stats.withClubBrand++;
    if (booking.club_loft) stats.withClubLoft++;
    if (booking.club_shaft) stats.withClubShaft++;
    if (booking.current_distance) stats.withDistance++;
    if (booking.age_group) stats.withAgeGroup++;
    if (booking.trajectory) stats.withTrajectory++;
    if (booking.shot_shape) stats.withShotShape++;
    if (booking.email) stats.withEmail++;
    if (booking.notes) stats.withNotes++;

    const attendance = booking.attendance_status || 'pending';
    stats.attendanceStatus[attendance] = (stats.attendanceStatus[attendance] || 0) + 1;

    const status = booking.status || 'pending';
    stats.bookingStatus[status] = (stats.bookingStatus[status] || 0) + 1;
  }

  console.log(`\n총 예약 수: ${stats.total}건`);
  console.log(`\n📌 클럽 정보:`);
  console.log(`  - 클럽 정보 있음: ${stats.withClub}건 (${((stats.withClub / stats.total) * 100).toFixed(1)}%)`);
  console.log(`  - 클럽 정보 없음: ${stats.emptyClub}건 (${((stats.emptyClub / stats.total) * 100).toFixed(1)}%)`);
  console.log(`  - 브랜드: ${stats.withClubBrand}건 (${((stats.withClubBrand / stats.total) * 100).toFixed(1)}%)`);
  console.log(`  - 로프트: ${stats.withClubLoft}건 (${((stats.withClubLoft / stats.total) * 100).toFixed(1)}%)`);
  console.log(`  - 샤프트: ${stats.withClubShaft}건 (${((stats.withClubShaft / stats.total) * 100).toFixed(1)}%)`);

  console.log(`\n📌 골프 정보:`);
  console.log(`  - 현재 비거리: ${stats.withDistance}건 (${((stats.withDistance / stats.total) * 100).toFixed(1)}%)`);
  console.log(`  - 연령대: ${stats.withAgeGroup}건 (${((stats.withAgeGroup / stats.total) * 100).toFixed(1)}%)`);
  console.log(`  - 탄도: ${stats.withTrajectory}건 (${((stats.withTrajectory / stats.total) * 100).toFixed(1)}%)`);
  console.log(`  - 구질: ${stats.withShotShape}건 (${((stats.withShotShape / stats.total) * 100).toFixed(1)}%)`);

  console.log(`\n📌 기타 정보:`);
  console.log(`  - 이메일: ${stats.withEmail}건 (${((stats.withEmail / stats.total) * 100).toFixed(1)}%)`);
  console.log(`  - 메모: ${stats.withNotes}건 (${((stats.withNotes / stats.total) * 100).toFixed(1)}%)`);

  console.log(`\n📌 참석 상태:`);
  console.log(`  - 참석: ${stats.attendanceStatus.attended}건`);
  console.log(`  - 노쇼: ${stats.attendanceStatus.no_show}건`);
  console.log(`  - 취소: ${stats.attendanceStatus.cancelled}건`);
  console.log(`  - 대기중: ${stats.attendanceStatus.pending}건`);

  console.log(`\n📌 예약 상태:`);
  console.log(`  - 확정: ${stats.bookingStatus.confirmed}건`);
  console.log(`  - 대기중: ${stats.bookingStatus.pending}건`);
  console.log(`  - 취소: ${stats.bookingStatus.cancelled}건`);
  console.log(`  - 완료: ${stats.bookingStatus.completed || 0}건`);

  // 5-3. 여러 번 방문한 고객 확인
  const multipleVisits = [];
  for (const [phone, bookings] of dbBookingsByPhone) {
    if (bookings.length > 1) {
      multipleVisits.push({
        phone,
        name: bookings[0].name,
        count: bookings.length,
        dates: bookings.map(b => b.date).sort(),
      });
    }
  }

  console.log(`\n📌 여러 번 방문한 고객: ${multipleVisits.length}명`);
  if (multipleVisits.length > 0) {
    console.log('\n상위 10명:');
    multipleVisits
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)
      .forEach((item, idx) => {
        console.log(`  ${idx + 1}. ${item.name} (${item.phone}) - ${item.count}회 방문`);
      });
  }

  // 6. 누락된 필드가 있는 예약 목록
  console.log('\n' + '='.repeat(60));
  console.log('⚠️  클럽 정보가 없는 예약 (상위 20건)');
  console.log('='.repeat(60));

  const bookingsWithoutClub = dbBookings
    .filter(b => !b.club || b.club.trim() === '')
    .slice(0, 20);

  if (bookingsWithoutClub.length > 0) {
    bookingsWithoutClub.forEach((booking, idx) => {
      console.log(`${idx + 1}. ${booking.name} (${booking.phone}) - ${booking.date} ${booking.time}`);
    });
  } else {
    console.log('모든 예약에 클럽 정보가 있습니다.');
  }

  // 7. 결과 요약
  console.log('\n' + '='.repeat(60));
  console.log('📋 검증 요약');
  console.log('='.repeat(60));
  console.log(`✅ 총 예약: ${stats.total}건`);
  console.log(`⚠️  누락된 전화번호: ${missingPhones.length}건`);
  console.log(`⚠️  클럽 정보 없음: ${stats.emptyClub}건`);
  console.log(`✅ 여러 번 방문: ${multipleVisits.length}명`);

  // 8. 결과를 파일로 저장
  const reportPath = path.join(__dirname, '..', 'backup', `validation-report-${Date.now()}.json`);
  const reportDir = path.dirname(reportPath);
  if (!fs.existsSync(reportDir)) {
    fs.mkdirSync(reportDir, { recursive: true });
  }

  const report = {
    timestamp: new Date().toISOString(),
    csvRows: csvRows.length,
    dbBookings: dbBookings.length,
    missingPhones,
    stats,
    multipleVisits: multipleVisits.slice(0, 50), // 상위 50명만
    bookingsWithoutClub: bookingsWithoutClub.map(b => ({
      id: b.id,
      name: b.name,
      phone: b.phone,
      date: b.date,
      time: b.time,
    })),
  };

  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2), 'utf8');
  console.log(`\n📄 상세 보고서 저장: ${reportPath}`);

  console.log('\n✅ 검증 완료!\n');
}

validateMigration()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('\n❌ 검증 실패:', err);
    process.exit(1);
  });







 * Wix 마이그레이션 검증 스크립트
 * 
 * 마이그레이션된 데이터의 품질을 검증하고 누락된 데이터를 확인합니다.
 * 
 * 사용법:
 * node scripts/validate-migration.js
 */

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
const csv = require('csv-parser');

// 환경 변수 로드
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Supabase 환경 변수가 설정되지 않았습니다.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// 전화번호 정규화 (마이그레이션과 동일한 로직)
function normalizePhone(phone) {
  if (!phone) return null;
  let cleaned = phone.toString().replace(/[\s\-+()]/g, '');
  if (cleaned.startsWith('82')) {
    cleaned = '0' + cleaned.substring(2);
  }
  if (cleaned.startsWith('01') && cleaned.length === 10) {
    cleaned = '010' + cleaned.substring(2);
  }
  if (!/^010\d{8}$/.test(cleaned)) {
    return null;
  }
  return cleaned;
}

async function validateMigration() {
  console.log('🔍 마이그레이션 검증 시작...\n');

  // 1. CSV 파일 읽기
  const csvFilePath = path.join(__dirname, '..', 'database', '예약 목록-2025. 11. 26..csv');
  if (!fs.existsSync(csvFilePath)) {
    console.error(`❌ CSV 파일을 찾을 수 없습니다: ${csvFilePath}`);
    process.exit(1);
  }

  const csvRows = [];
  await new Promise((resolve, reject) => {
    fs.createReadStream(csvFilePath)
      .pipe(csv())
      .on('data', (row) => csvRows.push(row))
      .on('end', resolve)
      .on('error', reject);
  });

  console.log(`📊 CSV 파일: ${csvRows.length}건\n`);

  // 2. 데이터베이스에서 마이그레이션된 데이터 조회
  const { data: dbBookings, error: bookingsError } = await supabase
    .from('bookings')
    .select('*')
    .order('created_at', { ascending: false });

  if (bookingsError) {
    console.error('❌ 예약 데이터 조회 실패:', bookingsError);
    process.exit(1);
  }

  console.log(`📊 DB 예약 데이터: ${dbBookings.length}건\n`);

  // 3. CSV 데이터와 DB 데이터 비교
  const csvPhones = new Set();
  const csvBookings = new Map(); // phone -> [bookings]

  for (const row of csvRows) {
    const phone = normalizePhone(row['전화번호'] || row['전화']);
    if (!phone) continue;

    csvPhones.add(phone);
    if (!csvBookings.has(phone)) {
      csvBookings.set(phone, []);
    }

    const bookingDate = row['예약 시작 시간'];
    if (bookingDate) {
      csvBookings.get(phone).push({
        phone,
        name: row['이름'],
        date: bookingDate,
        service: row['서비스명'],
        status: row['예약 상태'],
        attendance: row['참석 여부'],
      });
    }
  }

  // 4. DB 데이터 그룹화
  const dbPhones = new Set();
  const dbBookingsByPhone = new Map();

  for (const booking of dbBookings) {
    const phone = normalizePhone(booking.phone);
    if (!phone) continue;

    dbPhones.add(phone);
    if (!dbBookingsByPhone.has(phone)) {
      dbBookingsByPhone.set(phone, []);
    }
    dbBookingsByPhone.get(phone).push(booking);
  }

  // 5. 누락된 데이터 확인
  console.log('='.repeat(60));
  console.log('📋 검증 결과');
  console.log('='.repeat(60));

  // 5-1. CSV에 있지만 DB에 없는 전화번호
  const missingPhones = [];
  for (const phone of csvPhones) {
    if (!dbPhones.has(phone)) {
      const csvData = csvBookings.get(phone);
      missingPhones.push({
        phone,
        name: csvData[0]?.name,
        bookings: csvData.length,
      });
    }
  }

  if (missingPhones.length > 0) {
    console.log(`\n⚠️  DB에 없는 전화번호: ${missingPhones.length}건`);
    console.log('\n상세 목록:');
    missingPhones.slice(0, 20).forEach((item, idx) => {
      console.log(`  ${idx + 1}. ${item.name} (${item.phone}) - ${item.bookings}건 예약`);
    });
    if (missingPhones.length > 20) {
      console.log(`  ... 외 ${missingPhones.length - 20}건`);
    }
  } else {
    console.log('\n✅ 모든 전화번호가 DB에 있습니다.');
  }

  // 5-2. 데이터 품질 검증
  console.log('\n' + '='.repeat(60));
  console.log('📊 데이터 품질 검증');
  console.log('='.repeat(60));

  const stats = {
    total: dbBookings.length,
    withClub: 0,
    withClubBrand: 0,
    withClubLoft: 0,
    withClubShaft: 0,
    withDistance: 0,
    withAgeGroup: 0,
    withTrajectory: 0,
    withShotShape: 0,
    withEmail: 0,
    withNotes: 0,
    attendanceStatus: {
      attended: 0,
      no_show: 0,
      cancelled: 0,
      pending: 0,
    },
    bookingStatus: {
      confirmed: 0,
      pending: 0,
      cancelled: 0,
      completed: 0,
    },
    emptyClub: 0,
  };

  for (const booking of dbBookings) {
    if (booking.club && booking.club.trim() !== '') stats.withClub++;
    if (booking.club === '' || !booking.club) stats.emptyClub++;
    if (booking.club_brand) stats.withClubBrand++;
    if (booking.club_loft) stats.withClubLoft++;
    if (booking.club_shaft) stats.withClubShaft++;
    if (booking.current_distance) stats.withDistance++;
    if (booking.age_group) stats.withAgeGroup++;
    if (booking.trajectory) stats.withTrajectory++;
    if (booking.shot_shape) stats.withShotShape++;
    if (booking.email) stats.withEmail++;
    if (booking.notes) stats.withNotes++;

    const attendance = booking.attendance_status || 'pending';
    stats.attendanceStatus[attendance] = (stats.attendanceStatus[attendance] || 0) + 1;

    const status = booking.status || 'pending';
    stats.bookingStatus[status] = (stats.bookingStatus[status] || 0) + 1;
  }

  console.log(`\n총 예약 수: ${stats.total}건`);
  console.log(`\n📌 클럽 정보:`);
  console.log(`  - 클럽 정보 있음: ${stats.withClub}건 (${((stats.withClub / stats.total) * 100).toFixed(1)}%)`);
  console.log(`  - 클럽 정보 없음: ${stats.emptyClub}건 (${((stats.emptyClub / stats.total) * 100).toFixed(1)}%)`);
  console.log(`  - 브랜드: ${stats.withClubBrand}건 (${((stats.withClubBrand / stats.total) * 100).toFixed(1)}%)`);
  console.log(`  - 로프트: ${stats.withClubLoft}건 (${((stats.withClubLoft / stats.total) * 100).toFixed(1)}%)`);
  console.log(`  - 샤프트: ${stats.withClubShaft}건 (${((stats.withClubShaft / stats.total) * 100).toFixed(1)}%)`);

  console.log(`\n📌 골프 정보:`);
  console.log(`  - 현재 비거리: ${stats.withDistance}건 (${((stats.withDistance / stats.total) * 100).toFixed(1)}%)`);
  console.log(`  - 연령대: ${stats.withAgeGroup}건 (${((stats.withAgeGroup / stats.total) * 100).toFixed(1)}%)`);
  console.log(`  - 탄도: ${stats.withTrajectory}건 (${((stats.withTrajectory / stats.total) * 100).toFixed(1)}%)`);
  console.log(`  - 구질: ${stats.withShotShape}건 (${((stats.withShotShape / stats.total) * 100).toFixed(1)}%)`);

  console.log(`\n📌 기타 정보:`);
  console.log(`  - 이메일: ${stats.withEmail}건 (${((stats.withEmail / stats.total) * 100).toFixed(1)}%)`);
  console.log(`  - 메모: ${stats.withNotes}건 (${((stats.withNotes / stats.total) * 100).toFixed(1)}%)`);

  console.log(`\n📌 참석 상태:`);
  console.log(`  - 참석: ${stats.attendanceStatus.attended}건`);
  console.log(`  - 노쇼: ${stats.attendanceStatus.no_show}건`);
  console.log(`  - 취소: ${stats.attendanceStatus.cancelled}건`);
  console.log(`  - 대기중: ${stats.attendanceStatus.pending}건`);

  console.log(`\n📌 예약 상태:`);
  console.log(`  - 확정: ${stats.bookingStatus.confirmed}건`);
  console.log(`  - 대기중: ${stats.bookingStatus.pending}건`);
  console.log(`  - 취소: ${stats.bookingStatus.cancelled}건`);
  console.log(`  - 완료: ${stats.bookingStatus.completed || 0}건`);

  // 5-3. 여러 번 방문한 고객 확인
  const multipleVisits = [];
  for (const [phone, bookings] of dbBookingsByPhone) {
    if (bookings.length > 1) {
      multipleVisits.push({
        phone,
        name: bookings[0].name,
        count: bookings.length,
        dates: bookings.map(b => b.date).sort(),
      });
    }
  }

  console.log(`\n📌 여러 번 방문한 고객: ${multipleVisits.length}명`);
  if (multipleVisits.length > 0) {
    console.log('\n상위 10명:');
    multipleVisits
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)
      .forEach((item, idx) => {
        console.log(`  ${idx + 1}. ${item.name} (${item.phone}) - ${item.count}회 방문`);
      });
  }

  // 6. 누락된 필드가 있는 예약 목록
  console.log('\n' + '='.repeat(60));
  console.log('⚠️  클럽 정보가 없는 예약 (상위 20건)');
  console.log('='.repeat(60));

  const bookingsWithoutClub = dbBookings
    .filter(b => !b.club || b.club.trim() === '')
    .slice(0, 20);

  if (bookingsWithoutClub.length > 0) {
    bookingsWithoutClub.forEach((booking, idx) => {
      console.log(`${idx + 1}. ${booking.name} (${booking.phone}) - ${booking.date} ${booking.time}`);
    });
  } else {
    console.log('모든 예약에 클럽 정보가 있습니다.');
  }

  // 7. 결과 요약
  console.log('\n' + '='.repeat(60));
  console.log('📋 검증 요약');
  console.log('='.repeat(60));
  console.log(`✅ 총 예약: ${stats.total}건`);
  console.log(`⚠️  누락된 전화번호: ${missingPhones.length}건`);
  console.log(`⚠️  클럽 정보 없음: ${stats.emptyClub}건`);
  console.log(`✅ 여러 번 방문: ${multipleVisits.length}명`);

  // 8. 결과를 파일로 저장
  const reportPath = path.join(__dirname, '..', 'backup', `validation-report-${Date.now()}.json`);
  const reportDir = path.dirname(reportPath);
  if (!fs.existsSync(reportDir)) {
    fs.mkdirSync(reportDir, { recursive: true });
  }

  const report = {
    timestamp: new Date().toISOString(),
    csvRows: csvRows.length,
    dbBookings: dbBookings.length,
    missingPhones,
    stats,
    multipleVisits: multipleVisits.slice(0, 50), // 상위 50명만
    bookingsWithoutClub: bookingsWithoutClub.map(b => ({
      id: b.id,
      name: b.name,
      phone: b.phone,
      date: b.date,
      time: b.time,
    })),
  };

  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2), 'utf8');
  console.log(`\n📄 상세 보고서 저장: ${reportPath}`);

  console.log('\n✅ 검증 완료!\n');
}

validateMigration()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('\n❌ 검증 실패:', err);
    process.exit(1);
  });







 * Wix 마이그레이션 검증 스크립트
 * 
 * 마이그레이션된 데이터의 품질을 검증하고 누락된 데이터를 확인합니다.
 * 
 * 사용법:
 * node scripts/validate-migration.js
 */

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
const csv = require('csv-parser');

// 환경 변수 로드
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Supabase 환경 변수가 설정되지 않았습니다.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// 전화번호 정규화 (마이그레이션과 동일한 로직)
function normalizePhone(phone) {
  if (!phone) return null;
  let cleaned = phone.toString().replace(/[\s\-+()]/g, '');
  if (cleaned.startsWith('82')) {
    cleaned = '0' + cleaned.substring(2);
  }
  if (cleaned.startsWith('01') && cleaned.length === 10) {
    cleaned = '010' + cleaned.substring(2);
  }
  if (!/^010\d{8}$/.test(cleaned)) {
    return null;
  }
  return cleaned;
}

async function validateMigration() {
  console.log('🔍 마이그레이션 검증 시작...\n');

  // 1. CSV 파일 읽기
  const csvFilePath = path.join(__dirname, '..', 'database', '예약 목록-2025. 11. 26..csv');
  if (!fs.existsSync(csvFilePath)) {
    console.error(`❌ CSV 파일을 찾을 수 없습니다: ${csvFilePath}`);
    process.exit(1);
  }

  const csvRows = [];
  await new Promise((resolve, reject) => {
    fs.createReadStream(csvFilePath)
      .pipe(csv())
      .on('data', (row) => csvRows.push(row))
      .on('end', resolve)
      .on('error', reject);
  });

  console.log(`📊 CSV 파일: ${csvRows.length}건\n`);

  // 2. 데이터베이스에서 마이그레이션된 데이터 조회
  const { data: dbBookings, error: bookingsError } = await supabase
    .from('bookings')
    .select('*')
    .order('created_at', { ascending: false });

  if (bookingsError) {
    console.error('❌ 예약 데이터 조회 실패:', bookingsError);
    process.exit(1);
  }

  console.log(`📊 DB 예약 데이터: ${dbBookings.length}건\n`);

  // 3. CSV 데이터와 DB 데이터 비교
  const csvPhones = new Set();
  const csvBookings = new Map(); // phone -> [bookings]

  for (const row of csvRows) {
    const phone = normalizePhone(row['전화번호'] || row['전화']);
    if (!phone) continue;

    csvPhones.add(phone);
    if (!csvBookings.has(phone)) {
      csvBookings.set(phone, []);
    }

    const bookingDate = row['예약 시작 시간'];
    if (bookingDate) {
      csvBookings.get(phone).push({
        phone,
        name: row['이름'],
        date: bookingDate,
        service: row['서비스명'],
        status: row['예약 상태'],
        attendance: row['참석 여부'],
      });
    }
  }

  // 4. DB 데이터 그룹화
  const dbPhones = new Set();
  const dbBookingsByPhone = new Map();

  for (const booking of dbBookings) {
    const phone = normalizePhone(booking.phone);
    if (!phone) continue;

    dbPhones.add(phone);
    if (!dbBookingsByPhone.has(phone)) {
      dbBookingsByPhone.set(phone, []);
    }
    dbBookingsByPhone.get(phone).push(booking);
  }

  // 5. 누락된 데이터 확인
  console.log('='.repeat(60));
  console.log('📋 검증 결과');
  console.log('='.repeat(60));

  // 5-1. CSV에 있지만 DB에 없는 전화번호
  const missingPhones = [];
  for (const phone of csvPhones) {
    if (!dbPhones.has(phone)) {
      const csvData = csvBookings.get(phone);
      missingPhones.push({
        phone,
        name: csvData[0]?.name,
        bookings: csvData.length,
      });
    }
  }

  if (missingPhones.length > 0) {
    console.log(`\n⚠️  DB에 없는 전화번호: ${missingPhones.length}건`);
    console.log('\n상세 목록:');
    missingPhones.slice(0, 20).forEach((item, idx) => {
      console.log(`  ${idx + 1}. ${item.name} (${item.phone}) - ${item.bookings}건 예약`);
    });
    if (missingPhones.length > 20) {
      console.log(`  ... 외 ${missingPhones.length - 20}건`);
    }
  } else {
    console.log('\n✅ 모든 전화번호가 DB에 있습니다.');
  }

  // 5-2. 데이터 품질 검증
  console.log('\n' + '='.repeat(60));
  console.log('📊 데이터 품질 검증');
  console.log('='.repeat(60));

  const stats = {
    total: dbBookings.length,
    withClub: 0,
    withClubBrand: 0,
    withClubLoft: 0,
    withClubShaft: 0,
    withDistance: 0,
    withAgeGroup: 0,
    withTrajectory: 0,
    withShotShape: 0,
    withEmail: 0,
    withNotes: 0,
    attendanceStatus: {
      attended: 0,
      no_show: 0,
      cancelled: 0,
      pending: 0,
    },
    bookingStatus: {
      confirmed: 0,
      pending: 0,
      cancelled: 0,
      completed: 0,
    },
    emptyClub: 0,
  };

  for (const booking of dbBookings) {
    if (booking.club && booking.club.trim() !== '') stats.withClub++;
    if (booking.club === '' || !booking.club) stats.emptyClub++;
    if (booking.club_brand) stats.withClubBrand++;
    if (booking.club_loft) stats.withClubLoft++;
    if (booking.club_shaft) stats.withClubShaft++;
    if (booking.current_distance) stats.withDistance++;
    if (booking.age_group) stats.withAgeGroup++;
    if (booking.trajectory) stats.withTrajectory++;
    if (booking.shot_shape) stats.withShotShape++;
    if (booking.email) stats.withEmail++;
    if (booking.notes) stats.withNotes++;

    const attendance = booking.attendance_status || 'pending';
    stats.attendanceStatus[attendance] = (stats.attendanceStatus[attendance] || 0) + 1;

    const status = booking.status || 'pending';
    stats.bookingStatus[status] = (stats.bookingStatus[status] || 0) + 1;
  }

  console.log(`\n총 예약 수: ${stats.total}건`);
  console.log(`\n📌 클럽 정보:`);
  console.log(`  - 클럽 정보 있음: ${stats.withClub}건 (${((stats.withClub / stats.total) * 100).toFixed(1)}%)`);
  console.log(`  - 클럽 정보 없음: ${stats.emptyClub}건 (${((stats.emptyClub / stats.total) * 100).toFixed(1)}%)`);
  console.log(`  - 브랜드: ${stats.withClubBrand}건 (${((stats.withClubBrand / stats.total) * 100).toFixed(1)}%)`);
  console.log(`  - 로프트: ${stats.withClubLoft}건 (${((stats.withClubLoft / stats.total) * 100).toFixed(1)}%)`);
  console.log(`  - 샤프트: ${stats.withClubShaft}건 (${((stats.withClubShaft / stats.total) * 100).toFixed(1)}%)`);

  console.log(`\n📌 골프 정보:`);
  console.log(`  - 현재 비거리: ${stats.withDistance}건 (${((stats.withDistance / stats.total) * 100).toFixed(1)}%)`);
  console.log(`  - 연령대: ${stats.withAgeGroup}건 (${((stats.withAgeGroup / stats.total) * 100).toFixed(1)}%)`);
  console.log(`  - 탄도: ${stats.withTrajectory}건 (${((stats.withTrajectory / stats.total) * 100).toFixed(1)}%)`);
  console.log(`  - 구질: ${stats.withShotShape}건 (${((stats.withShotShape / stats.total) * 100).toFixed(1)}%)`);

  console.log(`\n📌 기타 정보:`);
  console.log(`  - 이메일: ${stats.withEmail}건 (${((stats.withEmail / stats.total) * 100).toFixed(1)}%)`);
  console.log(`  - 메모: ${stats.withNotes}건 (${((stats.withNotes / stats.total) * 100).toFixed(1)}%)`);

  console.log(`\n📌 참석 상태:`);
  console.log(`  - 참석: ${stats.attendanceStatus.attended}건`);
  console.log(`  - 노쇼: ${stats.attendanceStatus.no_show}건`);
  console.log(`  - 취소: ${stats.attendanceStatus.cancelled}건`);
  console.log(`  - 대기중: ${stats.attendanceStatus.pending}건`);

  console.log(`\n📌 예약 상태:`);
  console.log(`  - 확정: ${stats.bookingStatus.confirmed}건`);
  console.log(`  - 대기중: ${stats.bookingStatus.pending}건`);
  console.log(`  - 취소: ${stats.bookingStatus.cancelled}건`);
  console.log(`  - 완료: ${stats.bookingStatus.completed || 0}건`);

  // 5-3. 여러 번 방문한 고객 확인
  const multipleVisits = [];
  for (const [phone, bookings] of dbBookingsByPhone) {
    if (bookings.length > 1) {
      multipleVisits.push({
        phone,
        name: bookings[0].name,
        count: bookings.length,
        dates: bookings.map(b => b.date).sort(),
      });
    }
  }

  console.log(`\n📌 여러 번 방문한 고객: ${multipleVisits.length}명`);
  if (multipleVisits.length > 0) {
    console.log('\n상위 10명:');
    multipleVisits
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)
      .forEach((item, idx) => {
        console.log(`  ${idx + 1}. ${item.name} (${item.phone}) - ${item.count}회 방문`);
      });
  }

  // 6. 누락된 필드가 있는 예약 목록
  console.log('\n' + '='.repeat(60));
  console.log('⚠️  클럽 정보가 없는 예약 (상위 20건)');
  console.log('='.repeat(60));

  const bookingsWithoutClub = dbBookings
    .filter(b => !b.club || b.club.trim() === '')
    .slice(0, 20);

  if (bookingsWithoutClub.length > 0) {
    bookingsWithoutClub.forEach((booking, idx) => {
      console.log(`${idx + 1}. ${booking.name} (${booking.phone}) - ${booking.date} ${booking.time}`);
    });
  } else {
    console.log('모든 예약에 클럽 정보가 있습니다.');
  }

  // 7. 결과 요약
  console.log('\n' + '='.repeat(60));
  console.log('📋 검증 요약');
  console.log('='.repeat(60));
  console.log(`✅ 총 예약: ${stats.total}건`);
  console.log(`⚠️  누락된 전화번호: ${missingPhones.length}건`);
  console.log(`⚠️  클럽 정보 없음: ${stats.emptyClub}건`);
  console.log(`✅ 여러 번 방문: ${multipleVisits.length}명`);

  // 8. 결과를 파일로 저장
  const reportPath = path.join(__dirname, '..', 'backup', `validation-report-${Date.now()}.json`);
  const reportDir = path.dirname(reportPath);
  if (!fs.existsSync(reportDir)) {
    fs.mkdirSync(reportDir, { recursive: true });
  }

  const report = {
    timestamp: new Date().toISOString(),
    csvRows: csvRows.length,
    dbBookings: dbBookings.length,
    missingPhones,
    stats,
    multipleVisits: multipleVisits.slice(0, 50), // 상위 50명만
    bookingsWithoutClub: bookingsWithoutClub.map(b => ({
      id: b.id,
      name: b.name,
      phone: b.phone,
      date: b.date,
      time: b.time,
    })),
  };

  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2), 'utf8');
  console.log(`\n📄 상세 보고서 저장: ${reportPath}`);

  console.log('\n✅ 검증 완료!\n');
}

validateMigration()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('\n❌ 검증 실패:', err);
    process.exit(1);
  });







 * Wix 마이그레이션 검증 스크립트
 * 
 * 마이그레이션된 데이터의 품질을 검증하고 누락된 데이터를 확인합니다.
 * 
 * 사용법:
 * node scripts/validate-migration.js
 */

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
const csv = require('csv-parser');

// 환경 변수 로드
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Supabase 환경 변수가 설정되지 않았습니다.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// 전화번호 정규화 (마이그레이션과 동일한 로직)
function normalizePhone(phone) {
  if (!phone) return null;
  let cleaned = phone.toString().replace(/[\s\-+()]/g, '');
  if (cleaned.startsWith('82')) {
    cleaned = '0' + cleaned.substring(2);
  }
  if (cleaned.startsWith('01') && cleaned.length === 10) {
    cleaned = '010' + cleaned.substring(2);
  }
  if (!/^010\d{8}$/.test(cleaned)) {
    return null;
  }
  return cleaned;
}

async function validateMigration() {
  console.log('🔍 마이그레이션 검증 시작...\n');

  // 1. CSV 파일 읽기
  const csvFilePath = path.join(__dirname, '..', 'database', '예약 목록-2025. 11. 26..csv');
  if (!fs.existsSync(csvFilePath)) {
    console.error(`❌ CSV 파일을 찾을 수 없습니다: ${csvFilePath}`);
    process.exit(1);
  }

  const csvRows = [];
  await new Promise((resolve, reject) => {
    fs.createReadStream(csvFilePath)
      .pipe(csv())
      .on('data', (row) => csvRows.push(row))
      .on('end', resolve)
      .on('error', reject);
  });

  console.log(`📊 CSV 파일: ${csvRows.length}건\n`);

  // 2. 데이터베이스에서 마이그레이션된 데이터 조회
  const { data: dbBookings, error: bookingsError } = await supabase
    .from('bookings')
    .select('*')
    .order('created_at', { ascending: false });

  if (bookingsError) {
    console.error('❌ 예약 데이터 조회 실패:', bookingsError);
    process.exit(1);
  }

  console.log(`📊 DB 예약 데이터: ${dbBookings.length}건\n`);

  // 3. CSV 데이터와 DB 데이터 비교
  const csvPhones = new Set();
  const csvBookings = new Map(); // phone -> [bookings]

  for (const row of csvRows) {
    const phone = normalizePhone(row['전화번호'] || row['전화']);
    if (!phone) continue;

    csvPhones.add(phone);
    if (!csvBookings.has(phone)) {
      csvBookings.set(phone, []);
    }

    const bookingDate = row['예약 시작 시간'];
    if (bookingDate) {
      csvBookings.get(phone).push({
        phone,
        name: row['이름'],
        date: bookingDate,
        service: row['서비스명'],
        status: row['예약 상태'],
        attendance: row['참석 여부'],
      });
    }
  }

  // 4. DB 데이터 그룹화
  const dbPhones = new Set();
  const dbBookingsByPhone = new Map();

  for (const booking of dbBookings) {
    const phone = normalizePhone(booking.phone);
    if (!phone) continue;

    dbPhones.add(phone);
    if (!dbBookingsByPhone.has(phone)) {
      dbBookingsByPhone.set(phone, []);
    }
    dbBookingsByPhone.get(phone).push(booking);
  }

  // 5. 누락된 데이터 확인
  console.log('='.repeat(60));
  console.log('📋 검증 결과');
  console.log('='.repeat(60));

  // 5-1. CSV에 있지만 DB에 없는 전화번호
  const missingPhones = [];
  for (const phone of csvPhones) {
    if (!dbPhones.has(phone)) {
      const csvData = csvBookings.get(phone);
      missingPhones.push({
        phone,
        name: csvData[0]?.name,
        bookings: csvData.length,
      });
    }
  }

  if (missingPhones.length > 0) {
    console.log(`\n⚠️  DB에 없는 전화번호: ${missingPhones.length}건`);
    console.log('\n상세 목록:');
    missingPhones.slice(0, 20).forEach((item, idx) => {
      console.log(`  ${idx + 1}. ${item.name} (${item.phone}) - ${item.bookings}건 예약`);
    });
    if (missingPhones.length > 20) {
      console.log(`  ... 외 ${missingPhones.length - 20}건`);
    }
  } else {
    console.log('\n✅ 모든 전화번호가 DB에 있습니다.');
  }

  // 5-2. 데이터 품질 검증
  console.log('\n' + '='.repeat(60));
  console.log('📊 데이터 품질 검증');
  console.log('='.repeat(60));

  const stats = {
    total: dbBookings.length,
    withClub: 0,
    withClubBrand: 0,
    withClubLoft: 0,
    withClubShaft: 0,
    withDistance: 0,
    withAgeGroup: 0,
    withTrajectory: 0,
    withShotShape: 0,
    withEmail: 0,
    withNotes: 0,
    attendanceStatus: {
      attended: 0,
      no_show: 0,
      cancelled: 0,
      pending: 0,
    },
    bookingStatus: {
      confirmed: 0,
      pending: 0,
      cancelled: 0,
      completed: 0,
    },
    emptyClub: 0,
  };

  for (const booking of dbBookings) {
    if (booking.club && booking.club.trim() !== '') stats.withClub++;
    if (booking.club === '' || !booking.club) stats.emptyClub++;
    if (booking.club_brand) stats.withClubBrand++;
    if (booking.club_loft) stats.withClubLoft++;
    if (booking.club_shaft) stats.withClubShaft++;
    if (booking.current_distance) stats.withDistance++;
    if (booking.age_group) stats.withAgeGroup++;
    if (booking.trajectory) stats.withTrajectory++;
    if (booking.shot_shape) stats.withShotShape++;
    if (booking.email) stats.withEmail++;
    if (booking.notes) stats.withNotes++;

    const attendance = booking.attendance_status || 'pending';
    stats.attendanceStatus[attendance] = (stats.attendanceStatus[attendance] || 0) + 1;

    const status = booking.status || 'pending';
    stats.bookingStatus[status] = (stats.bookingStatus[status] || 0) + 1;
  }

  console.log(`\n총 예약 수: ${stats.total}건`);
  console.log(`\n📌 클럽 정보:`);
  console.log(`  - 클럽 정보 있음: ${stats.withClub}건 (${((stats.withClub / stats.total) * 100).toFixed(1)}%)`);
  console.log(`  - 클럽 정보 없음: ${stats.emptyClub}건 (${((stats.emptyClub / stats.total) * 100).toFixed(1)}%)`);
  console.log(`  - 브랜드: ${stats.withClubBrand}건 (${((stats.withClubBrand / stats.total) * 100).toFixed(1)}%)`);
  console.log(`  - 로프트: ${stats.withClubLoft}건 (${((stats.withClubLoft / stats.total) * 100).toFixed(1)}%)`);
  console.log(`  - 샤프트: ${stats.withClubShaft}건 (${((stats.withClubShaft / stats.total) * 100).toFixed(1)}%)`);

  console.log(`\n📌 골프 정보:`);
  console.log(`  - 현재 비거리: ${stats.withDistance}건 (${((stats.withDistance / stats.total) * 100).toFixed(1)}%)`);
  console.log(`  - 연령대: ${stats.withAgeGroup}건 (${((stats.withAgeGroup / stats.total) * 100).toFixed(1)}%)`);
  console.log(`  - 탄도: ${stats.withTrajectory}건 (${((stats.withTrajectory / stats.total) * 100).toFixed(1)}%)`);
  console.log(`  - 구질: ${stats.withShotShape}건 (${((stats.withShotShape / stats.total) * 100).toFixed(1)}%)`);

  console.log(`\n📌 기타 정보:`);
  console.log(`  - 이메일: ${stats.withEmail}건 (${((stats.withEmail / stats.total) * 100).toFixed(1)}%)`);
  console.log(`  - 메모: ${stats.withNotes}건 (${((stats.withNotes / stats.total) * 100).toFixed(1)}%)`);

  console.log(`\n📌 참석 상태:`);
  console.log(`  - 참석: ${stats.attendanceStatus.attended}건`);
  console.log(`  - 노쇼: ${stats.attendanceStatus.no_show}건`);
  console.log(`  - 취소: ${stats.attendanceStatus.cancelled}건`);
  console.log(`  - 대기중: ${stats.attendanceStatus.pending}건`);

  console.log(`\n📌 예약 상태:`);
  console.log(`  - 확정: ${stats.bookingStatus.confirmed}건`);
  console.log(`  - 대기중: ${stats.bookingStatus.pending}건`);
  console.log(`  - 취소: ${stats.bookingStatus.cancelled}건`);
  console.log(`  - 완료: ${stats.bookingStatus.completed || 0}건`);

  // 5-3. 여러 번 방문한 고객 확인
  const multipleVisits = [];
  for (const [phone, bookings] of dbBookingsByPhone) {
    if (bookings.length > 1) {
      multipleVisits.push({
        phone,
        name: bookings[0].name,
        count: bookings.length,
        dates: bookings.map(b => b.date).sort(),
      });
    }
  }

  console.log(`\n📌 여러 번 방문한 고객: ${multipleVisits.length}명`);
  if (multipleVisits.length > 0) {
    console.log('\n상위 10명:');
    multipleVisits
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)
      .forEach((item, idx) => {
        console.log(`  ${idx + 1}. ${item.name} (${item.phone}) - ${item.count}회 방문`);
      });
  }

  // 6. 누락된 필드가 있는 예약 목록
  console.log('\n' + '='.repeat(60));
  console.log('⚠️  클럽 정보가 없는 예약 (상위 20건)');
  console.log('='.repeat(60));

  const bookingsWithoutClub = dbBookings
    .filter(b => !b.club || b.club.trim() === '')
    .slice(0, 20);

  if (bookingsWithoutClub.length > 0) {
    bookingsWithoutClub.forEach((booking, idx) => {
      console.log(`${idx + 1}. ${booking.name} (${booking.phone}) - ${booking.date} ${booking.time}`);
    });
  } else {
    console.log('모든 예약에 클럽 정보가 있습니다.');
  }

  // 7. 결과 요약
  console.log('\n' + '='.repeat(60));
  console.log('📋 검증 요약');
  console.log('='.repeat(60));
  console.log(`✅ 총 예약: ${stats.total}건`);
  console.log(`⚠️  누락된 전화번호: ${missingPhones.length}건`);
  console.log(`⚠️  클럽 정보 없음: ${stats.emptyClub}건`);
  console.log(`✅ 여러 번 방문: ${multipleVisits.length}명`);

  // 8. 결과를 파일로 저장
  const reportPath = path.join(__dirname, '..', 'backup', `validation-report-${Date.now()}.json`);
  const reportDir = path.dirname(reportPath);
  if (!fs.existsSync(reportDir)) {
    fs.mkdirSync(reportDir, { recursive: true });
  }

  const report = {
    timestamp: new Date().toISOString(),
    csvRows: csvRows.length,
    dbBookings: dbBookings.length,
    missingPhones,
    stats,
    multipleVisits: multipleVisits.slice(0, 50), // 상위 50명만
    bookingsWithoutClub: bookingsWithoutClub.map(b => ({
      id: b.id,
      name: b.name,
      phone: b.phone,
      date: b.date,
      time: b.time,
    })),
  };

  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2), 'utf8');
  console.log(`\n📄 상세 보고서 저장: ${reportPath}`);

  console.log('\n✅ 검증 완료!\n');
}

validateMigration()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('\n❌ 검증 실패:', err);
    process.exit(1);
  });







 * Wix 마이그레이션 검증 스크립트
 * 
 * 마이그레이션된 데이터의 품질을 검증하고 누락된 데이터를 확인합니다.
 * 
 * 사용법:
 * node scripts/validate-migration.js
 */

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
const csv = require('csv-parser');

// 환경 변수 로드
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Supabase 환경 변수가 설정되지 않았습니다.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// 전화번호 정규화 (마이그레이션과 동일한 로직)
function normalizePhone(phone) {
  if (!phone) return null;
  let cleaned = phone.toString().replace(/[\s\-+()]/g, '');
  if (cleaned.startsWith('82')) {
    cleaned = '0' + cleaned.substring(2);
  }
  if (cleaned.startsWith('01') && cleaned.length === 10) {
    cleaned = '010' + cleaned.substring(2);
  }
  if (!/^010\d{8}$/.test(cleaned)) {
    return null;
  }
  return cleaned;
}

async function validateMigration() {
  console.log('🔍 마이그레이션 검증 시작...\n');

  // 1. CSV 파일 읽기
  const csvFilePath = path.join(__dirname, '..', 'database', '예약 목록-2025. 11. 26..csv');
  if (!fs.existsSync(csvFilePath)) {
    console.error(`❌ CSV 파일을 찾을 수 없습니다: ${csvFilePath}`);
    process.exit(1);
  }

  const csvRows = [];
  await new Promise((resolve, reject) => {
    fs.createReadStream(csvFilePath)
      .pipe(csv())
      .on('data', (row) => csvRows.push(row))
      .on('end', resolve)
      .on('error', reject);
  });

  console.log(`📊 CSV 파일: ${csvRows.length}건\n`);

  // 2. 데이터베이스에서 마이그레이션된 데이터 조회
  const { data: dbBookings, error: bookingsError } = await supabase
    .from('bookings')
    .select('*')
    .order('created_at', { ascending: false });

  if (bookingsError) {
    console.error('❌ 예약 데이터 조회 실패:', bookingsError);
    process.exit(1);
  }

  console.log(`📊 DB 예약 데이터: ${dbBookings.length}건\n`);

  // 3. CSV 데이터와 DB 데이터 비교
  const csvPhones = new Set();
  const csvBookings = new Map(); // phone -> [bookings]

  for (const row of csvRows) {
    const phone = normalizePhone(row['전화번호'] || row['전화']);
    if (!phone) continue;

    csvPhones.add(phone);
    if (!csvBookings.has(phone)) {
      csvBookings.set(phone, []);
    }

    const bookingDate = row['예약 시작 시간'];
    if (bookingDate) {
      csvBookings.get(phone).push({
        phone,
        name: row['이름'],
        date: bookingDate,
        service: row['서비스명'],
        status: row['예약 상태'],
        attendance: row['참석 여부'],
      });
    }
  }

  // 4. DB 데이터 그룹화
  const dbPhones = new Set();
  const dbBookingsByPhone = new Map();

  for (const booking of dbBookings) {
    const phone = normalizePhone(booking.phone);
    if (!phone) continue;

    dbPhones.add(phone);
    if (!dbBookingsByPhone.has(phone)) {
      dbBookingsByPhone.set(phone, []);
    }
    dbBookingsByPhone.get(phone).push(booking);
  }

  // 5. 누락된 데이터 확인
  console.log('='.repeat(60));
  console.log('📋 검증 결과');
  console.log('='.repeat(60));

  // 5-1. CSV에 있지만 DB에 없는 전화번호
  const missingPhones = [];
  for (const phone of csvPhones) {
    if (!dbPhones.has(phone)) {
      const csvData = csvBookings.get(phone);
      missingPhones.push({
        phone,
        name: csvData[0]?.name,
        bookings: csvData.length,
      });
    }
  }

  if (missingPhones.length > 0) {
    console.log(`\n⚠️  DB에 없는 전화번호: ${missingPhones.length}건`);
    console.log('\n상세 목록:');
    missingPhones.slice(0, 20).forEach((item, idx) => {
      console.log(`  ${idx + 1}. ${item.name} (${item.phone}) - ${item.bookings}건 예약`);
    });
    if (missingPhones.length > 20) {
      console.log(`  ... 외 ${missingPhones.length - 20}건`);
    }
  } else {
    console.log('\n✅ 모든 전화번호가 DB에 있습니다.');
  }

  // 5-2. 데이터 품질 검증
  console.log('\n' + '='.repeat(60));
  console.log('📊 데이터 품질 검증');
  console.log('='.repeat(60));

  const stats = {
    total: dbBookings.length,
    withClub: 0,
    withClubBrand: 0,
    withClubLoft: 0,
    withClubShaft: 0,
    withDistance: 0,
    withAgeGroup: 0,
    withTrajectory: 0,
    withShotShape: 0,
    withEmail: 0,
    withNotes: 0,
    attendanceStatus: {
      attended: 0,
      no_show: 0,
      cancelled: 0,
      pending: 0,
    },
    bookingStatus: {
      confirmed: 0,
      pending: 0,
      cancelled: 0,
      completed: 0,
    },
    emptyClub: 0,
  };

  for (const booking of dbBookings) {
    if (booking.club && booking.club.trim() !== '') stats.withClub++;
    if (booking.club === '' || !booking.club) stats.emptyClub++;
    if (booking.club_brand) stats.withClubBrand++;
    if (booking.club_loft) stats.withClubLoft++;
    if (booking.club_shaft) stats.withClubShaft++;
    if (booking.current_distance) stats.withDistance++;
    if (booking.age_group) stats.withAgeGroup++;
    if (booking.trajectory) stats.withTrajectory++;
    if (booking.shot_shape) stats.withShotShape++;
    if (booking.email) stats.withEmail++;
    if (booking.notes) stats.withNotes++;

    const attendance = booking.attendance_status || 'pending';
    stats.attendanceStatus[attendance] = (stats.attendanceStatus[attendance] || 0) + 1;

    const status = booking.status || 'pending';
    stats.bookingStatus[status] = (stats.bookingStatus[status] || 0) + 1;
  }

  console.log(`\n총 예약 수: ${stats.total}건`);
  console.log(`\n📌 클럽 정보:`);
  console.log(`  - 클럽 정보 있음: ${stats.withClub}건 (${((stats.withClub / stats.total) * 100).toFixed(1)}%)`);
  console.log(`  - 클럽 정보 없음: ${stats.emptyClub}건 (${((stats.emptyClub / stats.total) * 100).toFixed(1)}%)`);
  console.log(`  - 브랜드: ${stats.withClubBrand}건 (${((stats.withClubBrand / stats.total) * 100).toFixed(1)}%)`);
  console.log(`  - 로프트: ${stats.withClubLoft}건 (${((stats.withClubLoft / stats.total) * 100).toFixed(1)}%)`);
  console.log(`  - 샤프트: ${stats.withClubShaft}건 (${((stats.withClubShaft / stats.total) * 100).toFixed(1)}%)`);

  console.log(`\n📌 골프 정보:`);
  console.log(`  - 현재 비거리: ${stats.withDistance}건 (${((stats.withDistance / stats.total) * 100).toFixed(1)}%)`);
  console.log(`  - 연령대: ${stats.withAgeGroup}건 (${((stats.withAgeGroup / stats.total) * 100).toFixed(1)}%)`);
  console.log(`  - 탄도: ${stats.withTrajectory}건 (${((stats.withTrajectory / stats.total) * 100).toFixed(1)}%)`);
  console.log(`  - 구질: ${stats.withShotShape}건 (${((stats.withShotShape / stats.total) * 100).toFixed(1)}%)`);

  console.log(`\n📌 기타 정보:`);
  console.log(`  - 이메일: ${stats.withEmail}건 (${((stats.withEmail / stats.total) * 100).toFixed(1)}%)`);
  console.log(`  - 메모: ${stats.withNotes}건 (${((stats.withNotes / stats.total) * 100).toFixed(1)}%)`);

  console.log(`\n📌 참석 상태:`);
  console.log(`  - 참석: ${stats.attendanceStatus.attended}건`);
  console.log(`  - 노쇼: ${stats.attendanceStatus.no_show}건`);
  console.log(`  - 취소: ${stats.attendanceStatus.cancelled}건`);
  console.log(`  - 대기중: ${stats.attendanceStatus.pending}건`);

  console.log(`\n📌 예약 상태:`);
  console.log(`  - 확정: ${stats.bookingStatus.confirmed}건`);
  console.log(`  - 대기중: ${stats.bookingStatus.pending}건`);
  console.log(`  - 취소: ${stats.bookingStatus.cancelled}건`);
  console.log(`  - 완료: ${stats.bookingStatus.completed || 0}건`);

  // 5-3. 여러 번 방문한 고객 확인
  const multipleVisits = [];
  for (const [phone, bookings] of dbBookingsByPhone) {
    if (bookings.length > 1) {
      multipleVisits.push({
        phone,
        name: bookings[0].name,
        count: bookings.length,
        dates: bookings.map(b => b.date).sort(),
      });
    }
  }

  console.log(`\n📌 여러 번 방문한 고객: ${multipleVisits.length}명`);
  if (multipleVisits.length > 0) {
    console.log('\n상위 10명:');
    multipleVisits
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)
      .forEach((item, idx) => {
        console.log(`  ${idx + 1}. ${item.name} (${item.phone}) - ${item.count}회 방문`);
      });
  }

  // 6. 누락된 필드가 있는 예약 목록
  console.log('\n' + '='.repeat(60));
  console.log('⚠️  클럽 정보가 없는 예약 (상위 20건)');
  console.log('='.repeat(60));

  const bookingsWithoutClub = dbBookings
    .filter(b => !b.club || b.club.trim() === '')
    .slice(0, 20);

  if (bookingsWithoutClub.length > 0) {
    bookingsWithoutClub.forEach((booking, idx) => {
      console.log(`${idx + 1}. ${booking.name} (${booking.phone}) - ${booking.date} ${booking.time}`);
    });
  } else {
    console.log('모든 예약에 클럽 정보가 있습니다.');
  }

  // 7. 결과 요약
  console.log('\n' + '='.repeat(60));
  console.log('📋 검증 요약');
  console.log('='.repeat(60));
  console.log(`✅ 총 예약: ${stats.total}건`);
  console.log(`⚠️  누락된 전화번호: ${missingPhones.length}건`);
  console.log(`⚠️  클럽 정보 없음: ${stats.emptyClub}건`);
  console.log(`✅ 여러 번 방문: ${multipleVisits.length}명`);

  // 8. 결과를 파일로 저장
  const reportPath = path.join(__dirname, '..', 'backup', `validation-report-${Date.now()}.json`);
  const reportDir = path.dirname(reportPath);
  if (!fs.existsSync(reportDir)) {
    fs.mkdirSync(reportDir, { recursive: true });
  }

  const report = {
    timestamp: new Date().toISOString(),
    csvRows: csvRows.length,
    dbBookings: dbBookings.length,
    missingPhones,
    stats,
    multipleVisits: multipleVisits.slice(0, 50), // 상위 50명만
    bookingsWithoutClub: bookingsWithoutClub.map(b => ({
      id: b.id,
      name: b.name,
      phone: b.phone,
      date: b.date,
      time: b.time,
    })),
  };

  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2), 'utf8');
  console.log(`\n📄 상세 보고서 저장: ${reportPath}`);

  console.log('\n✅ 검증 완료!\n');
}

validateMigration()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('\n❌ 검증 실패:', err);
    process.exit(1);
  });




















