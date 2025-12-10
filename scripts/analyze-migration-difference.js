/**
 * 마이그레이션 데이터 차이 분석 스크립트
 * 
 * CSV 1,247건 → DB 945건 차이 원인 분석
 * 
 * 사용법:
 * node scripts/analyze-migration-difference.js
 */

const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');

// 환경 변수 로드
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

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

// 날짜 파싱 (Wix 형식)
function parseWixDate(dateStr) {
  if (!dateStr) return null;
  try {
    const match = dateStr.match(/(\d{4})\.\s*(\d{1,2})\.\s*(\d{1,2})\.\s*(오전|오후)?\s*(\d{1,2}):(\d{2})/);
    if (!match) {
      return new Date(dateStr);
    }
    const [, year, month, day, ampm, hour, minute] = match;
    let h = parseInt(hour);
    if (ampm === '오후' && h !== 12) {
      h += 12;
    } else if (ampm === '오전' && h === 12) {
      h = 0;
    }
    return new Date(year, parseInt(month) - 1, parseInt(day), h, parseInt(minute));
  } catch (e) {
    return null;
  }
}

// 날짜만 추출
function extractDate(dateStr) {
  const date = parseWixDate(dateStr);
  if (!date) return null;
  return date.toISOString().split('T')[0];
}

// 시간 파싱
function parseWixTime(timeStr) {
  if (!timeStr) return null;
  const date = parseWixDate(timeStr);
  if (!date) return null;
  return date.toTimeString().substring(0, 5);
}

async function analyzeDifference() {
  console.log('🔍 마이그레이션 데이터 차이 분석 시작...\n');

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

  // 분석 카테고리
  const analysis = {
    total: csvRows.length,
    withPhone: 0,
    withoutPhone: 0,
    withoutPhoneRows: [],
    withBookingDateTime: 0,
    withoutBookingDateTime: 0,
    withoutBookingDateTimeRows: [],
    validForMigration: 0,
    skippedRows: [],
    duplicateBookings: new Map(), // phone + date + time -> count
  };

  // 각 행 분석
  for (const row of csvRows) {
    const phone = normalizePhone(row['전화번호'] || row['전화']);
    const bookingDate = extractDate(row['예약 시작 시간']);
    const bookingTime = parseWixTime(row['예약 시작 시간']);

    // 전화번호 체크
    if (!phone) {
      analysis.withoutPhone++;
      analysis.withoutPhoneRows.push({
        name: row['이름'],
        phone: row['전화번호'] || row['전화'],
        email: row['이메일'],
        service: row['서비스명'],
        date: row['예약 시작 시간'],
      });
      analysis.skippedRows.push({
        reason: '전화번호 없음',
        row: row,
      });
      continue;
    }
    analysis.withPhone++;

    // 예약 날짜/시간 체크
    if (!bookingDate || !bookingTime) {
      analysis.withoutBookingDateTime++;
      analysis.withoutBookingDateTimeRows.push({
        name: row['이름'],
        phone: phone,
        email: row['이메일'],
        service: row['서비스명'],
        date: row['예약 시작 시간'],
      });
      analysis.skippedRows.push({
        reason: '예약 날짜/시간 없음',
        row: row,
      });
      continue;
    }
    analysis.withBookingDateTime++;

    // 중복 체크
    const duplicateKey = `${phone}_${bookingDate}_${bookingTime}`;
    if (analysis.duplicateBookings.has(duplicateKey)) {
      analysis.duplicateBookings.set(duplicateKey, analysis.duplicateBookings.get(duplicateKey) + 1);
    } else {
      analysis.duplicateBookings.set(duplicateKey, 1);
    }

    // 마이그레이션 가능한 행
    analysis.validForMigration++;
  }

  // 중복 예약 계산
  const duplicateCount = Array.from(analysis.duplicateBookings.values())
    .filter(count => count > 1)
    .reduce((sum, count) => sum + (count - 1), 0);

  // 결과 출력
  console.log('='.repeat(60));
  console.log('📋 분석 결과');
  console.log('='.repeat(60));
  console.log(`\n총 CSV 행 수: ${analysis.total}건`);
  console.log(`\n✅ 마이그레이션 가능: ${analysis.validForMigration}건`);
  console.log(`\n❌ 제외된 행: ${analysis.total - analysis.validForMigration}건`);
  console.log(`   - 전화번호 없음: ${analysis.withoutPhone}건`);
  console.log(`   - 예약 날짜/시간 없음: ${analysis.withoutBookingDateTime}건`);
  console.log(`   - 중복 예약: ${duplicateCount}건 (업데이트 처리)`);

  // 전화번호 없는 행 상세 (상위 20건)
  if (analysis.withoutPhoneRows.length > 0) {
    console.log(`\n📋 전화번호 없는 행 (상위 20건):`);
    analysis.withoutPhoneRows.slice(0, 20).forEach((row, idx) => {
      console.log(`  ${idx + 1}. ${row.name} - ${row.service || '-'} - ${row.date || '-'}`);
    });
    if (analysis.withoutPhoneRows.length > 20) {
      console.log(`  ... 외 ${analysis.withoutPhoneRows.length - 20}건`);
    }
  }

  // 예약 날짜/시간 없는 행 상세 (상위 20건)
  if (analysis.withoutBookingDateTimeRows.length > 0) {
    console.log(`\n📋 예약 날짜/시간 없는 행 (상위 20건):`);
    analysis.withoutBookingDateTimeRows.slice(0, 20).forEach((row, idx) => {
      console.log(`  ${idx + 1}. ${row.name} (${row.phone}) - ${row.service || '-'} - ${row.date || '날짜 없음'}`);
    });
    if (analysis.withoutBookingDateTimeRows.length > 20) {
      console.log(`  ... 외 ${analysis.withoutBookingDateTimeRows.length - 20}건`);
    }
  }

  // 중복 예약 상세 (상위 10건)
  const duplicateList = Array.from(analysis.duplicateBookings.entries())
    .filter(([key, count]) => count > 1)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);

  if (duplicateList.length > 0) {
    console.log(`\n📋 중복 예약 (상위 10건):`);
    duplicateList.forEach(([key, count], idx) => {
      const [phone, date, time] = key.split('_');
      console.log(`  ${idx + 1}. ${phone} - ${date} ${time} (${count}회)`);
    });
  }

  // 결과를 파일로 저장
  const reportPath = path.join(__dirname, '..', 'backup', `migration-difference-analysis-${Date.now()}.json`);
  const reportDir = path.dirname(reportPath);
  if (!fs.existsSync(reportDir)) {
    fs.mkdirSync(reportDir, { recursive: true });
  }

  const report = {
    timestamp: new Date().toISOString(),
    summary: {
      total: analysis.total,
      validForMigration: analysis.validForMigration,
      skipped: analysis.total - analysis.validForMigration,
      withoutPhone: analysis.withoutPhone,
      withoutBookingDateTime: analysis.withoutBookingDateTime,
      duplicateCount: duplicateCount,
    },
    withoutPhoneRows: analysis.withoutPhoneRows,
    withoutBookingDateTimeRows: analysis.withoutBookingDateTimeRows,
    duplicateBookings: Array.from(analysis.duplicateBookings.entries())
      .filter(([key, count]) => count > 1)
      .map(([key, count]) => {
        const [phone, date, time] = key.split('_');
        return { phone, date, time, count };
      }),
  };

  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2), 'utf8');
  console.log(`\n📄 상세 보고서 저장: ${reportPath}`);

  // 차이 요약
  console.log('\n' + '='.repeat(60));
  console.log('📊 차이 요약');
  console.log('='.repeat(60));
  console.log(`CSV 총 행 수: ${analysis.total}건`);
  console.log(`마이그레이션 가능: ${analysis.validForMigration}건`);
  console.log(`실제 DB 저장: 945건`);
  console.log(`\n차이: ${analysis.validForMigration - 945}건`);
  console.log(`\n가능한 원인:`);
  console.log(`  1. 중복 예약 업데이트 처리: ${duplicateCount}건`);
  console.log(`  2. Supabase 쿼리 제한: 1,000건 제한 (실제 945건 저장)`);
  console.log(`  3. 기타 오류: ${analysis.validForMigration - 945 - duplicateCount}건`);

  console.log('\n✅ 분석 완료!\n');
}

analyzeDifference()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('\n❌ 분석 실패:', err);
    process.exit(1);
  });







 * 마이그레이션 데이터 차이 분석 스크립트
 * 
 * CSV 1,247건 → DB 945건 차이 원인 분석
 * 
 * 사용법:
 * node scripts/analyze-migration-difference.js
 */

const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');

// 환경 변수 로드
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

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

// 날짜 파싱 (Wix 형식)
function parseWixDate(dateStr) {
  if (!dateStr) return null;
  try {
    const match = dateStr.match(/(\d{4})\.\s*(\d{1,2})\.\s*(\d{1,2})\.\s*(오전|오후)?\s*(\d{1,2}):(\d{2})/);
    if (!match) {
      return new Date(dateStr);
    }
    const [, year, month, day, ampm, hour, minute] = match;
    let h = parseInt(hour);
    if (ampm === '오후' && h !== 12) {
      h += 12;
    } else if (ampm === '오전' && h === 12) {
      h = 0;
    }
    return new Date(year, parseInt(month) - 1, parseInt(day), h, parseInt(minute));
  } catch (e) {
    return null;
  }
}

// 날짜만 추출
function extractDate(dateStr) {
  const date = parseWixDate(dateStr);
  if (!date) return null;
  return date.toISOString().split('T')[0];
}

// 시간 파싱
function parseWixTime(timeStr) {
  if (!timeStr) return null;
  const date = parseWixDate(timeStr);
  if (!date) return null;
  return date.toTimeString().substring(0, 5);
}

async function analyzeDifference() {
  console.log('🔍 마이그레이션 데이터 차이 분석 시작...\n');

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

  // 분석 카테고리
  const analysis = {
    total: csvRows.length,
    withPhone: 0,
    withoutPhone: 0,
    withoutPhoneRows: [],
    withBookingDateTime: 0,
    withoutBookingDateTime: 0,
    withoutBookingDateTimeRows: [],
    validForMigration: 0,
    skippedRows: [],
    duplicateBookings: new Map(), // phone + date + time -> count
  };

  // 각 행 분석
  for (const row of csvRows) {
    const phone = normalizePhone(row['전화번호'] || row['전화']);
    const bookingDate = extractDate(row['예약 시작 시간']);
    const bookingTime = parseWixTime(row['예약 시작 시간']);

    // 전화번호 체크
    if (!phone) {
      analysis.withoutPhone++;
      analysis.withoutPhoneRows.push({
        name: row['이름'],
        phone: row['전화번호'] || row['전화'],
        email: row['이메일'],
        service: row['서비스명'],
        date: row['예약 시작 시간'],
      });
      analysis.skippedRows.push({
        reason: '전화번호 없음',
        row: row,
      });
      continue;
    }
    analysis.withPhone++;

    // 예약 날짜/시간 체크
    if (!bookingDate || !bookingTime) {
      analysis.withoutBookingDateTime++;
      analysis.withoutBookingDateTimeRows.push({
        name: row['이름'],
        phone: phone,
        email: row['이메일'],
        service: row['서비스명'],
        date: row['예약 시작 시간'],
      });
      analysis.skippedRows.push({
        reason: '예약 날짜/시간 없음',
        row: row,
      });
      continue;
    }
    analysis.withBookingDateTime++;

    // 중복 체크
    const duplicateKey = `${phone}_${bookingDate}_${bookingTime}`;
    if (analysis.duplicateBookings.has(duplicateKey)) {
      analysis.duplicateBookings.set(duplicateKey, analysis.duplicateBookings.get(duplicateKey) + 1);
    } else {
      analysis.duplicateBookings.set(duplicateKey, 1);
    }

    // 마이그레이션 가능한 행
    analysis.validForMigration++;
  }

  // 중복 예약 계산
  const duplicateCount = Array.from(analysis.duplicateBookings.values())
    .filter(count => count > 1)
    .reduce((sum, count) => sum + (count - 1), 0);

  // 결과 출력
  console.log('='.repeat(60));
  console.log('📋 분석 결과');
  console.log('='.repeat(60));
  console.log(`\n총 CSV 행 수: ${analysis.total}건`);
  console.log(`\n✅ 마이그레이션 가능: ${analysis.validForMigration}건`);
  console.log(`\n❌ 제외된 행: ${analysis.total - analysis.validForMigration}건`);
  console.log(`   - 전화번호 없음: ${analysis.withoutPhone}건`);
  console.log(`   - 예약 날짜/시간 없음: ${analysis.withoutBookingDateTime}건`);
  console.log(`   - 중복 예약: ${duplicateCount}건 (업데이트 처리)`);

  // 전화번호 없는 행 상세 (상위 20건)
  if (analysis.withoutPhoneRows.length > 0) {
    console.log(`\n📋 전화번호 없는 행 (상위 20건):`);
    analysis.withoutPhoneRows.slice(0, 20).forEach((row, idx) => {
      console.log(`  ${idx + 1}. ${row.name} - ${row.service || '-'} - ${row.date || '-'}`);
    });
    if (analysis.withoutPhoneRows.length > 20) {
      console.log(`  ... 외 ${analysis.withoutPhoneRows.length - 20}건`);
    }
  }

  // 예약 날짜/시간 없는 행 상세 (상위 20건)
  if (analysis.withoutBookingDateTimeRows.length > 0) {
    console.log(`\n📋 예약 날짜/시간 없는 행 (상위 20건):`);
    analysis.withoutBookingDateTimeRows.slice(0, 20).forEach((row, idx) => {
      console.log(`  ${idx + 1}. ${row.name} (${row.phone}) - ${row.service || '-'} - ${row.date || '날짜 없음'}`);
    });
    if (analysis.withoutBookingDateTimeRows.length > 20) {
      console.log(`  ... 외 ${analysis.withoutBookingDateTimeRows.length - 20}건`);
    }
  }

  // 중복 예약 상세 (상위 10건)
  const duplicateList = Array.from(analysis.duplicateBookings.entries())
    .filter(([key, count]) => count > 1)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);

  if (duplicateList.length > 0) {
    console.log(`\n📋 중복 예약 (상위 10건):`);
    duplicateList.forEach(([key, count], idx) => {
      const [phone, date, time] = key.split('_');
      console.log(`  ${idx + 1}. ${phone} - ${date} ${time} (${count}회)`);
    });
  }

  // 결과를 파일로 저장
  const reportPath = path.join(__dirname, '..', 'backup', `migration-difference-analysis-${Date.now()}.json`);
  const reportDir = path.dirname(reportPath);
  if (!fs.existsSync(reportDir)) {
    fs.mkdirSync(reportDir, { recursive: true });
  }

  const report = {
    timestamp: new Date().toISOString(),
    summary: {
      total: analysis.total,
      validForMigration: analysis.validForMigration,
      skipped: analysis.total - analysis.validForMigration,
      withoutPhone: analysis.withoutPhone,
      withoutBookingDateTime: analysis.withoutBookingDateTime,
      duplicateCount: duplicateCount,
    },
    withoutPhoneRows: analysis.withoutPhoneRows,
    withoutBookingDateTimeRows: analysis.withoutBookingDateTimeRows,
    duplicateBookings: Array.from(analysis.duplicateBookings.entries())
      .filter(([key, count]) => count > 1)
      .map(([key, count]) => {
        const [phone, date, time] = key.split('_');
        return { phone, date, time, count };
      }),
  };

  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2), 'utf8');
  console.log(`\n📄 상세 보고서 저장: ${reportPath}`);

  // 차이 요약
  console.log('\n' + '='.repeat(60));
  console.log('📊 차이 요약');
  console.log('='.repeat(60));
  console.log(`CSV 총 행 수: ${analysis.total}건`);
  console.log(`마이그레이션 가능: ${analysis.validForMigration}건`);
  console.log(`실제 DB 저장: 945건`);
  console.log(`\n차이: ${analysis.validForMigration - 945}건`);
  console.log(`\n가능한 원인:`);
  console.log(`  1. 중복 예약 업데이트 처리: ${duplicateCount}건`);
  console.log(`  2. Supabase 쿼리 제한: 1,000건 제한 (실제 945건 저장)`);
  console.log(`  3. 기타 오류: ${analysis.validForMigration - 945 - duplicateCount}건`);

  console.log('\n✅ 분석 완료!\n');
}

analyzeDifference()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('\n❌ 분석 실패:', err);
    process.exit(1);
  });







 * 마이그레이션 데이터 차이 분석 스크립트
 * 
 * CSV 1,247건 → DB 945건 차이 원인 분석
 * 
 * 사용법:
 * node scripts/analyze-migration-difference.js
 */

const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');

// 환경 변수 로드
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

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

// 날짜 파싱 (Wix 형식)
function parseWixDate(dateStr) {
  if (!dateStr) return null;
  try {
    const match = dateStr.match(/(\d{4})\.\s*(\d{1,2})\.\s*(\d{1,2})\.\s*(오전|오후)?\s*(\d{1,2}):(\d{2})/);
    if (!match) {
      return new Date(dateStr);
    }
    const [, year, month, day, ampm, hour, minute] = match;
    let h = parseInt(hour);
    if (ampm === '오후' && h !== 12) {
      h += 12;
    } else if (ampm === '오전' && h === 12) {
      h = 0;
    }
    return new Date(year, parseInt(month) - 1, parseInt(day), h, parseInt(minute));
  } catch (e) {
    return null;
  }
}

// 날짜만 추출
function extractDate(dateStr) {
  const date = parseWixDate(dateStr);
  if (!date) return null;
  return date.toISOString().split('T')[0];
}

// 시간 파싱
function parseWixTime(timeStr) {
  if (!timeStr) return null;
  const date = parseWixDate(timeStr);
  if (!date) return null;
  return date.toTimeString().substring(0, 5);
}

async function analyzeDifference() {
  console.log('🔍 마이그레이션 데이터 차이 분석 시작...\n');

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

  // 분석 카테고리
  const analysis = {
    total: csvRows.length,
    withPhone: 0,
    withoutPhone: 0,
    withoutPhoneRows: [],
    withBookingDateTime: 0,
    withoutBookingDateTime: 0,
    withoutBookingDateTimeRows: [],
    validForMigration: 0,
    skippedRows: [],
    duplicateBookings: new Map(), // phone + date + time -> count
  };

  // 각 행 분석
  for (const row of csvRows) {
    const phone = normalizePhone(row['전화번호'] || row['전화']);
    const bookingDate = extractDate(row['예약 시작 시간']);
    const bookingTime = parseWixTime(row['예약 시작 시간']);

    // 전화번호 체크
    if (!phone) {
      analysis.withoutPhone++;
      analysis.withoutPhoneRows.push({
        name: row['이름'],
        phone: row['전화번호'] || row['전화'],
        email: row['이메일'],
        service: row['서비스명'],
        date: row['예약 시작 시간'],
      });
      analysis.skippedRows.push({
        reason: '전화번호 없음',
        row: row,
      });
      continue;
    }
    analysis.withPhone++;

    // 예약 날짜/시간 체크
    if (!bookingDate || !bookingTime) {
      analysis.withoutBookingDateTime++;
      analysis.withoutBookingDateTimeRows.push({
        name: row['이름'],
        phone: phone,
        email: row['이메일'],
        service: row['서비스명'],
        date: row['예약 시작 시간'],
      });
      analysis.skippedRows.push({
        reason: '예약 날짜/시간 없음',
        row: row,
      });
      continue;
    }
    analysis.withBookingDateTime++;

    // 중복 체크
    const duplicateKey = `${phone}_${bookingDate}_${bookingTime}`;
    if (analysis.duplicateBookings.has(duplicateKey)) {
      analysis.duplicateBookings.set(duplicateKey, analysis.duplicateBookings.get(duplicateKey) + 1);
    } else {
      analysis.duplicateBookings.set(duplicateKey, 1);
    }

    // 마이그레이션 가능한 행
    analysis.validForMigration++;
  }

  // 중복 예약 계산
  const duplicateCount = Array.from(analysis.duplicateBookings.values())
    .filter(count => count > 1)
    .reduce((sum, count) => sum + (count - 1), 0);

  // 결과 출력
  console.log('='.repeat(60));
  console.log('📋 분석 결과');
  console.log('='.repeat(60));
  console.log(`\n총 CSV 행 수: ${analysis.total}건`);
  console.log(`\n✅ 마이그레이션 가능: ${analysis.validForMigration}건`);
  console.log(`\n❌ 제외된 행: ${analysis.total - analysis.validForMigration}건`);
  console.log(`   - 전화번호 없음: ${analysis.withoutPhone}건`);
  console.log(`   - 예약 날짜/시간 없음: ${analysis.withoutBookingDateTime}건`);
  console.log(`   - 중복 예약: ${duplicateCount}건 (업데이트 처리)`);

  // 전화번호 없는 행 상세 (상위 20건)
  if (analysis.withoutPhoneRows.length > 0) {
    console.log(`\n📋 전화번호 없는 행 (상위 20건):`);
    analysis.withoutPhoneRows.slice(0, 20).forEach((row, idx) => {
      console.log(`  ${idx + 1}. ${row.name} - ${row.service || '-'} - ${row.date || '-'}`);
    });
    if (analysis.withoutPhoneRows.length > 20) {
      console.log(`  ... 외 ${analysis.withoutPhoneRows.length - 20}건`);
    }
  }

  // 예약 날짜/시간 없는 행 상세 (상위 20건)
  if (analysis.withoutBookingDateTimeRows.length > 0) {
    console.log(`\n📋 예약 날짜/시간 없는 행 (상위 20건):`);
    analysis.withoutBookingDateTimeRows.slice(0, 20).forEach((row, idx) => {
      console.log(`  ${idx + 1}. ${row.name} (${row.phone}) - ${row.service || '-'} - ${row.date || '날짜 없음'}`);
    });
    if (analysis.withoutBookingDateTimeRows.length > 20) {
      console.log(`  ... 외 ${analysis.withoutBookingDateTimeRows.length - 20}건`);
    }
  }

  // 중복 예약 상세 (상위 10건)
  const duplicateList = Array.from(analysis.duplicateBookings.entries())
    .filter(([key, count]) => count > 1)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);

  if (duplicateList.length > 0) {
    console.log(`\n📋 중복 예약 (상위 10건):`);
    duplicateList.forEach(([key, count], idx) => {
      const [phone, date, time] = key.split('_');
      console.log(`  ${idx + 1}. ${phone} - ${date} ${time} (${count}회)`);
    });
  }

  // 결과를 파일로 저장
  const reportPath = path.join(__dirname, '..', 'backup', `migration-difference-analysis-${Date.now()}.json`);
  const reportDir = path.dirname(reportPath);
  if (!fs.existsSync(reportDir)) {
    fs.mkdirSync(reportDir, { recursive: true });
  }

  const report = {
    timestamp: new Date().toISOString(),
    summary: {
      total: analysis.total,
      validForMigration: analysis.validForMigration,
      skipped: analysis.total - analysis.validForMigration,
      withoutPhone: analysis.withoutPhone,
      withoutBookingDateTime: analysis.withoutBookingDateTime,
      duplicateCount: duplicateCount,
    },
    withoutPhoneRows: analysis.withoutPhoneRows,
    withoutBookingDateTimeRows: analysis.withoutBookingDateTimeRows,
    duplicateBookings: Array.from(analysis.duplicateBookings.entries())
      .filter(([key, count]) => count > 1)
      .map(([key, count]) => {
        const [phone, date, time] = key.split('_');
        return { phone, date, time, count };
      }),
  };

  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2), 'utf8');
  console.log(`\n📄 상세 보고서 저장: ${reportPath}`);

  // 차이 요약
  console.log('\n' + '='.repeat(60));
  console.log('📊 차이 요약');
  console.log('='.repeat(60));
  console.log(`CSV 총 행 수: ${analysis.total}건`);
  console.log(`마이그레이션 가능: ${analysis.validForMigration}건`);
  console.log(`실제 DB 저장: 945건`);
  console.log(`\n차이: ${analysis.validForMigration - 945}건`);
  console.log(`\n가능한 원인:`);
  console.log(`  1. 중복 예약 업데이트 처리: ${duplicateCount}건`);
  console.log(`  2. Supabase 쿼리 제한: 1,000건 제한 (실제 945건 저장)`);
  console.log(`  3. 기타 오류: ${analysis.validForMigration - 945 - duplicateCount}건`);

  console.log('\n✅ 분석 완료!\n');
}

analyzeDifference()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('\n❌ 분석 실패:', err);
    process.exit(1);
  });







 * 마이그레이션 데이터 차이 분석 스크립트
 * 
 * CSV 1,247건 → DB 945건 차이 원인 분석
 * 
 * 사용법:
 * node scripts/analyze-migration-difference.js
 */

const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');

// 환경 변수 로드
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

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

// 날짜 파싱 (Wix 형식)
function parseWixDate(dateStr) {
  if (!dateStr) return null;
  try {
    const match = dateStr.match(/(\d{4})\.\s*(\d{1,2})\.\s*(\d{1,2})\.\s*(오전|오후)?\s*(\d{1,2}):(\d{2})/);
    if (!match) {
      return new Date(dateStr);
    }
    const [, year, month, day, ampm, hour, minute] = match;
    let h = parseInt(hour);
    if (ampm === '오후' && h !== 12) {
      h += 12;
    } else if (ampm === '오전' && h === 12) {
      h = 0;
    }
    return new Date(year, parseInt(month) - 1, parseInt(day), h, parseInt(minute));
  } catch (e) {
    return null;
  }
}

// 날짜만 추출
function extractDate(dateStr) {
  const date = parseWixDate(dateStr);
  if (!date) return null;
  return date.toISOString().split('T')[0];
}

// 시간 파싱
function parseWixTime(timeStr) {
  if (!timeStr) return null;
  const date = parseWixDate(timeStr);
  if (!date) return null;
  return date.toTimeString().substring(0, 5);
}

async function analyzeDifference() {
  console.log('🔍 마이그레이션 데이터 차이 분석 시작...\n');

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

  // 분석 카테고리
  const analysis = {
    total: csvRows.length,
    withPhone: 0,
    withoutPhone: 0,
    withoutPhoneRows: [],
    withBookingDateTime: 0,
    withoutBookingDateTime: 0,
    withoutBookingDateTimeRows: [],
    validForMigration: 0,
    skippedRows: [],
    duplicateBookings: new Map(), // phone + date + time -> count
  };

  // 각 행 분석
  for (const row of csvRows) {
    const phone = normalizePhone(row['전화번호'] || row['전화']);
    const bookingDate = extractDate(row['예약 시작 시간']);
    const bookingTime = parseWixTime(row['예약 시작 시간']);

    // 전화번호 체크
    if (!phone) {
      analysis.withoutPhone++;
      analysis.withoutPhoneRows.push({
        name: row['이름'],
        phone: row['전화번호'] || row['전화'],
        email: row['이메일'],
        service: row['서비스명'],
        date: row['예약 시작 시간'],
      });
      analysis.skippedRows.push({
        reason: '전화번호 없음',
        row: row,
      });
      continue;
    }
    analysis.withPhone++;

    // 예약 날짜/시간 체크
    if (!bookingDate || !bookingTime) {
      analysis.withoutBookingDateTime++;
      analysis.withoutBookingDateTimeRows.push({
        name: row['이름'],
        phone: phone,
        email: row['이메일'],
        service: row['서비스명'],
        date: row['예약 시작 시간'],
      });
      analysis.skippedRows.push({
        reason: '예약 날짜/시간 없음',
        row: row,
      });
      continue;
    }
    analysis.withBookingDateTime++;

    // 중복 체크
    const duplicateKey = `${phone}_${bookingDate}_${bookingTime}`;
    if (analysis.duplicateBookings.has(duplicateKey)) {
      analysis.duplicateBookings.set(duplicateKey, analysis.duplicateBookings.get(duplicateKey) + 1);
    } else {
      analysis.duplicateBookings.set(duplicateKey, 1);
    }

    // 마이그레이션 가능한 행
    analysis.validForMigration++;
  }

  // 중복 예약 계산
  const duplicateCount = Array.from(analysis.duplicateBookings.values())
    .filter(count => count > 1)
    .reduce((sum, count) => sum + (count - 1), 0);

  // 결과 출력
  console.log('='.repeat(60));
  console.log('📋 분석 결과');
  console.log('='.repeat(60));
  console.log(`\n총 CSV 행 수: ${analysis.total}건`);
  console.log(`\n✅ 마이그레이션 가능: ${analysis.validForMigration}건`);
  console.log(`\n❌ 제외된 행: ${analysis.total - analysis.validForMigration}건`);
  console.log(`   - 전화번호 없음: ${analysis.withoutPhone}건`);
  console.log(`   - 예약 날짜/시간 없음: ${analysis.withoutBookingDateTime}건`);
  console.log(`   - 중복 예약: ${duplicateCount}건 (업데이트 처리)`);

  // 전화번호 없는 행 상세 (상위 20건)
  if (analysis.withoutPhoneRows.length > 0) {
    console.log(`\n📋 전화번호 없는 행 (상위 20건):`);
    analysis.withoutPhoneRows.slice(0, 20).forEach((row, idx) => {
      console.log(`  ${idx + 1}. ${row.name} - ${row.service || '-'} - ${row.date || '-'}`);
    });
    if (analysis.withoutPhoneRows.length > 20) {
      console.log(`  ... 외 ${analysis.withoutPhoneRows.length - 20}건`);
    }
  }

  // 예약 날짜/시간 없는 행 상세 (상위 20건)
  if (analysis.withoutBookingDateTimeRows.length > 0) {
    console.log(`\n📋 예약 날짜/시간 없는 행 (상위 20건):`);
    analysis.withoutBookingDateTimeRows.slice(0, 20).forEach((row, idx) => {
      console.log(`  ${idx + 1}. ${row.name} (${row.phone}) - ${row.service || '-'} - ${row.date || '날짜 없음'}`);
    });
    if (analysis.withoutBookingDateTimeRows.length > 20) {
      console.log(`  ... 외 ${analysis.withoutBookingDateTimeRows.length - 20}건`);
    }
  }

  // 중복 예약 상세 (상위 10건)
  const duplicateList = Array.from(analysis.duplicateBookings.entries())
    .filter(([key, count]) => count > 1)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);

  if (duplicateList.length > 0) {
    console.log(`\n📋 중복 예약 (상위 10건):`);
    duplicateList.forEach(([key, count], idx) => {
      const [phone, date, time] = key.split('_');
      console.log(`  ${idx + 1}. ${phone} - ${date} ${time} (${count}회)`);
    });
  }

  // 결과를 파일로 저장
  const reportPath = path.join(__dirname, '..', 'backup', `migration-difference-analysis-${Date.now()}.json`);
  const reportDir = path.dirname(reportPath);
  if (!fs.existsSync(reportDir)) {
    fs.mkdirSync(reportDir, { recursive: true });
  }

  const report = {
    timestamp: new Date().toISOString(),
    summary: {
      total: analysis.total,
      validForMigration: analysis.validForMigration,
      skipped: analysis.total - analysis.validForMigration,
      withoutPhone: analysis.withoutPhone,
      withoutBookingDateTime: analysis.withoutBookingDateTime,
      duplicateCount: duplicateCount,
    },
    withoutPhoneRows: analysis.withoutPhoneRows,
    withoutBookingDateTimeRows: analysis.withoutBookingDateTimeRows,
    duplicateBookings: Array.from(analysis.duplicateBookings.entries())
      .filter(([key, count]) => count > 1)
      .map(([key, count]) => {
        const [phone, date, time] = key.split('_');
        return { phone, date, time, count };
      }),
  };

  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2), 'utf8');
  console.log(`\n📄 상세 보고서 저장: ${reportPath}`);

  // 차이 요약
  console.log('\n' + '='.repeat(60));
  console.log('📊 차이 요약');
  console.log('='.repeat(60));
  console.log(`CSV 총 행 수: ${analysis.total}건`);
  console.log(`마이그레이션 가능: ${analysis.validForMigration}건`);
  console.log(`실제 DB 저장: 945건`);
  console.log(`\n차이: ${analysis.validForMigration - 945}건`);
  console.log(`\n가능한 원인:`);
  console.log(`  1. 중복 예약 업데이트 처리: ${duplicateCount}건`);
  console.log(`  2. Supabase 쿼리 제한: 1,000건 제한 (실제 945건 저장)`);
  console.log(`  3. 기타 오류: ${analysis.validForMigration - 945 - duplicateCount}건`);

  console.log('\n✅ 분석 완료!\n');
}

analyzeDifference()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('\n❌ 분석 실패:', err);
    process.exit(1);
  });







 * 마이그레이션 데이터 차이 분석 스크립트
 * 
 * CSV 1,247건 → DB 945건 차이 원인 분석
 * 
 * 사용법:
 * node scripts/analyze-migration-difference.js
 */

const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');

// 환경 변수 로드
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

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

// 날짜 파싱 (Wix 형식)
function parseWixDate(dateStr) {
  if (!dateStr) return null;
  try {
    const match = dateStr.match(/(\d{4})\.\s*(\d{1,2})\.\s*(\d{1,2})\.\s*(오전|오후)?\s*(\d{1,2}):(\d{2})/);
    if (!match) {
      return new Date(dateStr);
    }
    const [, year, month, day, ampm, hour, minute] = match;
    let h = parseInt(hour);
    if (ampm === '오후' && h !== 12) {
      h += 12;
    } else if (ampm === '오전' && h === 12) {
      h = 0;
    }
    return new Date(year, parseInt(month) - 1, parseInt(day), h, parseInt(minute));
  } catch (e) {
    return null;
  }
}

// 날짜만 추출
function extractDate(dateStr) {
  const date = parseWixDate(dateStr);
  if (!date) return null;
  return date.toISOString().split('T')[0];
}

// 시간 파싱
function parseWixTime(timeStr) {
  if (!timeStr) return null;
  const date = parseWixDate(timeStr);
  if (!date) return null;
  return date.toTimeString().substring(0, 5);
}

async function analyzeDifference() {
  console.log('🔍 마이그레이션 데이터 차이 분석 시작...\n');

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

  // 분석 카테고리
  const analysis = {
    total: csvRows.length,
    withPhone: 0,
    withoutPhone: 0,
    withoutPhoneRows: [],
    withBookingDateTime: 0,
    withoutBookingDateTime: 0,
    withoutBookingDateTimeRows: [],
    validForMigration: 0,
    skippedRows: [],
    duplicateBookings: new Map(), // phone + date + time -> count
  };

  // 각 행 분석
  for (const row of csvRows) {
    const phone = normalizePhone(row['전화번호'] || row['전화']);
    const bookingDate = extractDate(row['예약 시작 시간']);
    const bookingTime = parseWixTime(row['예약 시작 시간']);

    // 전화번호 체크
    if (!phone) {
      analysis.withoutPhone++;
      analysis.withoutPhoneRows.push({
        name: row['이름'],
        phone: row['전화번호'] || row['전화'],
        email: row['이메일'],
        service: row['서비스명'],
        date: row['예약 시작 시간'],
      });
      analysis.skippedRows.push({
        reason: '전화번호 없음',
        row: row,
      });
      continue;
    }
    analysis.withPhone++;

    // 예약 날짜/시간 체크
    if (!bookingDate || !bookingTime) {
      analysis.withoutBookingDateTime++;
      analysis.withoutBookingDateTimeRows.push({
        name: row['이름'],
        phone: phone,
        email: row['이메일'],
        service: row['서비스명'],
        date: row['예약 시작 시간'],
      });
      analysis.skippedRows.push({
        reason: '예약 날짜/시간 없음',
        row: row,
      });
      continue;
    }
    analysis.withBookingDateTime++;

    // 중복 체크
    const duplicateKey = `${phone}_${bookingDate}_${bookingTime}`;
    if (analysis.duplicateBookings.has(duplicateKey)) {
      analysis.duplicateBookings.set(duplicateKey, analysis.duplicateBookings.get(duplicateKey) + 1);
    } else {
      analysis.duplicateBookings.set(duplicateKey, 1);
    }

    // 마이그레이션 가능한 행
    analysis.validForMigration++;
  }

  // 중복 예약 계산
  const duplicateCount = Array.from(analysis.duplicateBookings.values())
    .filter(count => count > 1)
    .reduce((sum, count) => sum + (count - 1), 0);

  // 결과 출력
  console.log('='.repeat(60));
  console.log('📋 분석 결과');
  console.log('='.repeat(60));
  console.log(`\n총 CSV 행 수: ${analysis.total}건`);
  console.log(`\n✅ 마이그레이션 가능: ${analysis.validForMigration}건`);
  console.log(`\n❌ 제외된 행: ${analysis.total - analysis.validForMigration}건`);
  console.log(`   - 전화번호 없음: ${analysis.withoutPhone}건`);
  console.log(`   - 예약 날짜/시간 없음: ${analysis.withoutBookingDateTime}건`);
  console.log(`   - 중복 예약: ${duplicateCount}건 (업데이트 처리)`);

  // 전화번호 없는 행 상세 (상위 20건)
  if (analysis.withoutPhoneRows.length > 0) {
    console.log(`\n📋 전화번호 없는 행 (상위 20건):`);
    analysis.withoutPhoneRows.slice(0, 20).forEach((row, idx) => {
      console.log(`  ${idx + 1}. ${row.name} - ${row.service || '-'} - ${row.date || '-'}`);
    });
    if (analysis.withoutPhoneRows.length > 20) {
      console.log(`  ... 외 ${analysis.withoutPhoneRows.length - 20}건`);
    }
  }

  // 예약 날짜/시간 없는 행 상세 (상위 20건)
  if (analysis.withoutBookingDateTimeRows.length > 0) {
    console.log(`\n📋 예약 날짜/시간 없는 행 (상위 20건):`);
    analysis.withoutBookingDateTimeRows.slice(0, 20).forEach((row, idx) => {
      console.log(`  ${idx + 1}. ${row.name} (${row.phone}) - ${row.service || '-'} - ${row.date || '날짜 없음'}`);
    });
    if (analysis.withoutBookingDateTimeRows.length > 20) {
      console.log(`  ... 외 ${analysis.withoutBookingDateTimeRows.length - 20}건`);
    }
  }

  // 중복 예약 상세 (상위 10건)
  const duplicateList = Array.from(analysis.duplicateBookings.entries())
    .filter(([key, count]) => count > 1)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);

  if (duplicateList.length > 0) {
    console.log(`\n📋 중복 예약 (상위 10건):`);
    duplicateList.forEach(([key, count], idx) => {
      const [phone, date, time] = key.split('_');
      console.log(`  ${idx + 1}. ${phone} - ${date} ${time} (${count}회)`);
    });
  }

  // 결과를 파일로 저장
  const reportPath = path.join(__dirname, '..', 'backup', `migration-difference-analysis-${Date.now()}.json`);
  const reportDir = path.dirname(reportPath);
  if (!fs.existsSync(reportDir)) {
    fs.mkdirSync(reportDir, { recursive: true });
  }

  const report = {
    timestamp: new Date().toISOString(),
    summary: {
      total: analysis.total,
      validForMigration: analysis.validForMigration,
      skipped: analysis.total - analysis.validForMigration,
      withoutPhone: analysis.withoutPhone,
      withoutBookingDateTime: analysis.withoutBookingDateTime,
      duplicateCount: duplicateCount,
    },
    withoutPhoneRows: analysis.withoutPhoneRows,
    withoutBookingDateTimeRows: analysis.withoutBookingDateTimeRows,
    duplicateBookings: Array.from(analysis.duplicateBookings.entries())
      .filter(([key, count]) => count > 1)
      .map(([key, count]) => {
        const [phone, date, time] = key.split('_');
        return { phone, date, time, count };
      }),
  };

  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2), 'utf8');
  console.log(`\n📄 상세 보고서 저장: ${reportPath}`);

  // 차이 요약
  console.log('\n' + '='.repeat(60));
  console.log('📊 차이 요약');
  console.log('='.repeat(60));
  console.log(`CSV 총 행 수: ${analysis.total}건`);
  console.log(`마이그레이션 가능: ${analysis.validForMigration}건`);
  console.log(`실제 DB 저장: 945건`);
  console.log(`\n차이: ${analysis.validForMigration - 945}건`);
  console.log(`\n가능한 원인:`);
  console.log(`  1. 중복 예약 업데이트 처리: ${duplicateCount}건`);
  console.log(`  2. Supabase 쿼리 제한: 1,000건 제한 (실제 945건 저장)`);
  console.log(`  3. 기타 오류: ${analysis.validForMigration - 945 - duplicateCount}건`);

  console.log('\n✅ 분석 완료!\n');
}

analyzeDifference()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('\n❌ 분석 실패:', err);
    process.exit(1);
  });












