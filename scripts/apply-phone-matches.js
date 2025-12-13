/**
 * 전화번호 매칭 결과를 CSV에 적용하는 스크립트
 * 
 * 사용법:
 * node scripts/apply-phone-matches.js [보고서파일경로] [--auto-high]
 * 
 * 옵션:
 *   --auto-high    High confidence 매칭만 자동 적용
 */

const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');

// 전화번호 정규화
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

// 이름 정규화
function normalizeName(name) {
  if (!name) return '';
  return name.trim()
    .replace(/\s+/g, '')
    .replace(/\([^)]*\)/g, '')
    .toLowerCase();
}

// 날짜 추출
function extractDate(dateStr) {
  if (!dateStr) return null;
  try {
    const match = dateStr.match(/(\d{4})\.\s*(\d{1,2})\.\s*(\d{1,2})/);
    if (!match) return null;
    const [, year, month, day] = match;
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  } catch (e) {
    return null;
  }
}

async function applyPhoneMatches(reportPath, options = {}) {
  const { autoHigh = false } = options;

  console.log('📝 전화번호 매칭 결과 적용 시작...\n');

  // 보고서 파일 읽기
  if (!fs.existsSync(reportPath)) {
    console.error(`❌ 보고서 파일을 찾을 수 없습니다: ${reportPath}`);
    process.exit(1);
  }

  const report = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
  console.log(`📊 보고서 로드: ${report.matches.length}건 매칭, ${report.noMatches.length}건 실패\n`);

  // 적용할 매칭 선택
  let matchesToApply = [];
  if (autoHigh) {
    matchesToApply = report.matches.filter(m => m.confidence === 'high');
    console.log(`✅ High confidence 매칭만 자동 적용: ${matchesToApply.length}건\n`);
  } else {
    // 모든 매칭 적용
    matchesToApply = report.matches;
    console.log(`⚠️  모든 매칭 적용: ${matchesToApply.length}건\n`);
  }

  // 원본 CSV 파일 읽기
  const csvFilePath = path.join(__dirname, '..', 'database', '예약 목록-2025. 11. 26..csv');
  if (!fs.existsSync(csvFilePath)) {
    console.error(`❌ CSV 파일을 찾을 수 없습니다: ${csvFilePath}`);
    process.exit(1);
  }

  const rows = [];
  const headers = [];

  await new Promise((resolve, reject) => {
    let isFirstRow = true;
    fs.createReadStream(csvFilePath)
      .pipe(csv())
      .on('data', (row) => {
        if (isFirstRow) {
          headers.push(...Object.keys(row));
          isFirstRow = false;
        }
        rows.push(row);
      })
      .on('end', resolve)
      .on('error', reject);
  });

  console.log(`📊 CSV 파일 로드: ${rows.length}건\n`);

  // 매칭 맵 생성 (빠른 검색을 위해)
  const matchMap = new Map();
  for (const match of matchesToApply) {
    const key = `${normalizeName(match.original.name)}_${extractDate(match.original.date) || match.original.date}`;
    matchMap.set(key, match.suggestedPhone);
  }

  // CSV 행 업데이트
  let updatedCount = 0;
  let skippedCount = 0;

  for (const row of rows) {
    const name = (row['이름'] || '').trim();
    const normalizedName = normalizeName(name);
    const date = extractDate(row['예약 시작 시간']) || row['예약 시작 시간'] || '';
    const key = `${normalizedName}_${date}`;
    const currentPhone = normalizePhone(row['전화번호'] || row['전화']);

    // 전화번호가 없고 매칭이 있는 경우
    if (!currentPhone && matchMap.has(key)) {
      const suggestedPhone = matchMap.get(key);
      row['전화번호'] = suggestedPhone;
      updatedCount++;
    } else if (!currentPhone) {
      skippedCount++;
    }
  }

  console.log(`✅ 업데이트된 행: ${updatedCount}건`);
  console.log(`⚠️  건너뛴 행: ${skippedCount}건\n`);

  // 백업 생성
  const backupPath = path.join(__dirname, '..', 'backup', `예약 목록-2025. 11. 26-backup-${Date.now()}.csv`);
  fs.copyFileSync(csvFilePath, backupPath);
  console.log(`📦 원본 CSV 백업: ${backupPath}\n`);

  // 업데이트된 CSV 저장
  const updatedCsvPath = path.join(__dirname, '..', 'database', '예약 목록-2025. 11. 26-updated.csv');
  
  // CSV 헤더 작성
  const csvLines = [headers.join(',')];
  
  // CSV 행 작성
  for (const row of rows) {
    const values = headers.map(header => {
      const value = row[header] || '';
      // CSV 이스케이프 처리
      if (value.includes(',') || value.includes('"') || value.includes('\n')) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return value;
    });
    csvLines.push(values.join(','));
  }

  fs.writeFileSync(updatedCsvPath, csvLines.join('\n'), 'utf8');
  console.log(`✅ 업데이트된 CSV 저장: ${updatedCsvPath}\n`);

  console.log('💡 다음 단계:');
  console.log('   1. 업데이트된 CSV 파일 검토');
  console.log('   2. 문제없으면 원본 파일 교체');
  console.log('   3. node scripts/migrate-wix-bookings.js 로 재마이그레이션');
  console.log('\n✅ 적용 완료!\n');
}

// 메인 실행
const reportPath = process.argv[2] || (() => {
  // 가장 최근 보고서 파일 찾기
  const backupDir = path.join(__dirname, '..', 'backup');
  if (!fs.existsSync(backupDir)) {
    console.error('❌ backup 디렉토리가 없습니다.');
    process.exit(1);
  }
  
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
  
  return files[0].path;
})();

const autoHigh = process.argv.includes('--auto-high');

applyPhoneMatches(reportPath, { autoHigh })
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('\n❌ 적용 실패:', err);
    process.exit(1);
  });







 * 전화번호 매칭 결과를 CSV에 적용하는 스크립트
 * 
 * 사용법:
 * node scripts/apply-phone-matches.js [보고서파일경로] [--auto-high]
 * 
 * 옵션:
 *   --auto-high    High confidence 매칭만 자동 적용
 */

const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');

// 전화번호 정규화
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

// 이름 정규화
function normalizeName(name) {
  if (!name) return '';
  return name.trim()
    .replace(/\s+/g, '')
    .replace(/\([^)]*\)/g, '')
    .toLowerCase();
}

// 날짜 추출
function extractDate(dateStr) {
  if (!dateStr) return null;
  try {
    const match = dateStr.match(/(\d{4})\.\s*(\d{1,2})\.\s*(\d{1,2})/);
    if (!match) return null;
    const [, year, month, day] = match;
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  } catch (e) {
    return null;
  }
}

async function applyPhoneMatches(reportPath, options = {}) {
  const { autoHigh = false } = options;

  console.log('📝 전화번호 매칭 결과 적용 시작...\n');

  // 보고서 파일 읽기
  if (!fs.existsSync(reportPath)) {
    console.error(`❌ 보고서 파일을 찾을 수 없습니다: ${reportPath}`);
    process.exit(1);
  }

  const report = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
  console.log(`📊 보고서 로드: ${report.matches.length}건 매칭, ${report.noMatches.length}건 실패\n`);

  // 적용할 매칭 선택
  let matchesToApply = [];
  if (autoHigh) {
    matchesToApply = report.matches.filter(m => m.confidence === 'high');
    console.log(`✅ High confidence 매칭만 자동 적용: ${matchesToApply.length}건\n`);
  } else {
    // 모든 매칭 적용
    matchesToApply = report.matches;
    console.log(`⚠️  모든 매칭 적용: ${matchesToApply.length}건\n`);
  }

  // 원본 CSV 파일 읽기
  const csvFilePath = path.join(__dirname, '..', 'database', '예약 목록-2025. 11. 26..csv');
  if (!fs.existsSync(csvFilePath)) {
    console.error(`❌ CSV 파일을 찾을 수 없습니다: ${csvFilePath}`);
    process.exit(1);
  }

  const rows = [];
  const headers = [];

  await new Promise((resolve, reject) => {
    let isFirstRow = true;
    fs.createReadStream(csvFilePath)
      .pipe(csv())
      .on('data', (row) => {
        if (isFirstRow) {
          headers.push(...Object.keys(row));
          isFirstRow = false;
        }
        rows.push(row);
      })
      .on('end', resolve)
      .on('error', reject);
  });

  console.log(`📊 CSV 파일 로드: ${rows.length}건\n`);

  // 매칭 맵 생성 (빠른 검색을 위해)
  const matchMap = new Map();
  for (const match of matchesToApply) {
    const key = `${normalizeName(match.original.name)}_${extractDate(match.original.date) || match.original.date}`;
    matchMap.set(key, match.suggestedPhone);
  }

  // CSV 행 업데이트
  let updatedCount = 0;
  let skippedCount = 0;

  for (const row of rows) {
    const name = (row['이름'] || '').trim();
    const normalizedName = normalizeName(name);
    const date = extractDate(row['예약 시작 시간']) || row['예약 시작 시간'] || '';
    const key = `${normalizedName}_${date}`;
    const currentPhone = normalizePhone(row['전화번호'] || row['전화']);

    // 전화번호가 없고 매칭이 있는 경우
    if (!currentPhone && matchMap.has(key)) {
      const suggestedPhone = matchMap.get(key);
      row['전화번호'] = suggestedPhone;
      updatedCount++;
    } else if (!currentPhone) {
      skippedCount++;
    }
  }

  console.log(`✅ 업데이트된 행: ${updatedCount}건`);
  console.log(`⚠️  건너뛴 행: ${skippedCount}건\n`);

  // 백업 생성
  const backupPath = path.join(__dirname, '..', 'backup', `예약 목록-2025. 11. 26-backup-${Date.now()}.csv`);
  fs.copyFileSync(csvFilePath, backupPath);
  console.log(`📦 원본 CSV 백업: ${backupPath}\n`);

  // 업데이트된 CSV 저장
  const updatedCsvPath = path.join(__dirname, '..', 'database', '예약 목록-2025. 11. 26-updated.csv');
  
  // CSV 헤더 작성
  const csvLines = [headers.join(',')];
  
  // CSV 행 작성
  for (const row of rows) {
    const values = headers.map(header => {
      const value = row[header] || '';
      // CSV 이스케이프 처리
      if (value.includes(',') || value.includes('"') || value.includes('\n')) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return value;
    });
    csvLines.push(values.join(','));
  }

  fs.writeFileSync(updatedCsvPath, csvLines.join('\n'), 'utf8');
  console.log(`✅ 업데이트된 CSV 저장: ${updatedCsvPath}\n`);

  console.log('💡 다음 단계:');
  console.log('   1. 업데이트된 CSV 파일 검토');
  console.log('   2. 문제없으면 원본 파일 교체');
  console.log('   3. node scripts/migrate-wix-bookings.js 로 재마이그레이션');
  console.log('\n✅ 적용 완료!\n');
}

// 메인 실행
const reportPath = process.argv[2] || (() => {
  // 가장 최근 보고서 파일 찾기
  const backupDir = path.join(__dirname, '..', 'backup');
  if (!fs.existsSync(backupDir)) {
    console.error('❌ backup 디렉토리가 없습니다.');
    process.exit(1);
  }
  
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
  
  return files[0].path;
})();

const autoHigh = process.argv.includes('--auto-high');

applyPhoneMatches(reportPath, { autoHigh })
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('\n❌ 적용 실패:', err);
    process.exit(1);
  });







 * 전화번호 매칭 결과를 CSV에 적용하는 스크립트
 * 
 * 사용법:
 * node scripts/apply-phone-matches.js [보고서파일경로] [--auto-high]
 * 
 * 옵션:
 *   --auto-high    High confidence 매칭만 자동 적용
 */

const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');

// 전화번호 정규화
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

// 이름 정규화
function normalizeName(name) {
  if (!name) return '';
  return name.trim()
    .replace(/\s+/g, '')
    .replace(/\([^)]*\)/g, '')
    .toLowerCase();
}

// 날짜 추출
function extractDate(dateStr) {
  if (!dateStr) return null;
  try {
    const match = dateStr.match(/(\d{4})\.\s*(\d{1,2})\.\s*(\d{1,2})/);
    if (!match) return null;
    const [, year, month, day] = match;
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  } catch (e) {
    return null;
  }
}

async function applyPhoneMatches(reportPath, options = {}) {
  const { autoHigh = false } = options;

  console.log('📝 전화번호 매칭 결과 적용 시작...\n');

  // 보고서 파일 읽기
  if (!fs.existsSync(reportPath)) {
    console.error(`❌ 보고서 파일을 찾을 수 없습니다: ${reportPath}`);
    process.exit(1);
  }

  const report = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
  console.log(`📊 보고서 로드: ${report.matches.length}건 매칭, ${report.noMatches.length}건 실패\n`);

  // 적용할 매칭 선택
  let matchesToApply = [];
  if (autoHigh) {
    matchesToApply = report.matches.filter(m => m.confidence === 'high');
    console.log(`✅ High confidence 매칭만 자동 적용: ${matchesToApply.length}건\n`);
  } else {
    // 모든 매칭 적용
    matchesToApply = report.matches;
    console.log(`⚠️  모든 매칭 적용: ${matchesToApply.length}건\n`);
  }

  // 원본 CSV 파일 읽기
  const csvFilePath = path.join(__dirname, '..', 'database', '예약 목록-2025. 11. 26..csv');
  if (!fs.existsSync(csvFilePath)) {
    console.error(`❌ CSV 파일을 찾을 수 없습니다: ${csvFilePath}`);
    process.exit(1);
  }

  const rows = [];
  const headers = [];

  await new Promise((resolve, reject) => {
    let isFirstRow = true;
    fs.createReadStream(csvFilePath)
      .pipe(csv())
      .on('data', (row) => {
        if (isFirstRow) {
          headers.push(...Object.keys(row));
          isFirstRow = false;
        }
        rows.push(row);
      })
      .on('end', resolve)
      .on('error', reject);
  });

  console.log(`📊 CSV 파일 로드: ${rows.length}건\n`);

  // 매칭 맵 생성 (빠른 검색을 위해)
  const matchMap = new Map();
  for (const match of matchesToApply) {
    const key = `${normalizeName(match.original.name)}_${extractDate(match.original.date) || match.original.date}`;
    matchMap.set(key, match.suggestedPhone);
  }

  // CSV 행 업데이트
  let updatedCount = 0;
  let skippedCount = 0;

  for (const row of rows) {
    const name = (row['이름'] || '').trim();
    const normalizedName = normalizeName(name);
    const date = extractDate(row['예약 시작 시간']) || row['예약 시작 시간'] || '';
    const key = `${normalizedName}_${date}`;
    const currentPhone = normalizePhone(row['전화번호'] || row['전화']);

    // 전화번호가 없고 매칭이 있는 경우
    if (!currentPhone && matchMap.has(key)) {
      const suggestedPhone = matchMap.get(key);
      row['전화번호'] = suggestedPhone;
      updatedCount++;
    } else if (!currentPhone) {
      skippedCount++;
    }
  }

  console.log(`✅ 업데이트된 행: ${updatedCount}건`);
  console.log(`⚠️  건너뛴 행: ${skippedCount}건\n`);

  // 백업 생성
  const backupPath = path.join(__dirname, '..', 'backup', `예약 목록-2025. 11. 26-backup-${Date.now()}.csv`);
  fs.copyFileSync(csvFilePath, backupPath);
  console.log(`📦 원본 CSV 백업: ${backupPath}\n`);

  // 업데이트된 CSV 저장
  const updatedCsvPath = path.join(__dirname, '..', 'database', '예약 목록-2025. 11. 26-updated.csv');
  
  // CSV 헤더 작성
  const csvLines = [headers.join(',')];
  
  // CSV 행 작성
  for (const row of rows) {
    const values = headers.map(header => {
      const value = row[header] || '';
      // CSV 이스케이프 처리
      if (value.includes(',') || value.includes('"') || value.includes('\n')) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return value;
    });
    csvLines.push(values.join(','));
  }

  fs.writeFileSync(updatedCsvPath, csvLines.join('\n'), 'utf8');
  console.log(`✅ 업데이트된 CSV 저장: ${updatedCsvPath}\n`);

  console.log('💡 다음 단계:');
  console.log('   1. 업데이트된 CSV 파일 검토');
  console.log('   2. 문제없으면 원본 파일 교체');
  console.log('   3. node scripts/migrate-wix-bookings.js 로 재마이그레이션');
  console.log('\n✅ 적용 완료!\n');
}

// 메인 실행
const reportPath = process.argv[2] || (() => {
  // 가장 최근 보고서 파일 찾기
  const backupDir = path.join(__dirname, '..', 'backup');
  if (!fs.existsSync(backupDir)) {
    console.error('❌ backup 디렉토리가 없습니다.');
    process.exit(1);
  }
  
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
  
  return files[0].path;
})();

const autoHigh = process.argv.includes('--auto-high');

applyPhoneMatches(reportPath, { autoHigh })
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('\n❌ 적용 실패:', err);
    process.exit(1);
  });







 * 전화번호 매칭 결과를 CSV에 적용하는 스크립트
 * 
 * 사용법:
 * node scripts/apply-phone-matches.js [보고서파일경로] [--auto-high]
 * 
 * 옵션:
 *   --auto-high    High confidence 매칭만 자동 적용
 */

const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');

// 전화번호 정규화
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

// 이름 정규화
function normalizeName(name) {
  if (!name) return '';
  return name.trim()
    .replace(/\s+/g, '')
    .replace(/\([^)]*\)/g, '')
    .toLowerCase();
}

// 날짜 추출
function extractDate(dateStr) {
  if (!dateStr) return null;
  try {
    const match = dateStr.match(/(\d{4})\.\s*(\d{1,2})\.\s*(\d{1,2})/);
    if (!match) return null;
    const [, year, month, day] = match;
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  } catch (e) {
    return null;
  }
}

async function applyPhoneMatches(reportPath, options = {}) {
  const { autoHigh = false } = options;

  console.log('📝 전화번호 매칭 결과 적용 시작...\n');

  // 보고서 파일 읽기
  if (!fs.existsSync(reportPath)) {
    console.error(`❌ 보고서 파일을 찾을 수 없습니다: ${reportPath}`);
    process.exit(1);
  }

  const report = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
  console.log(`📊 보고서 로드: ${report.matches.length}건 매칭, ${report.noMatches.length}건 실패\n`);

  // 적용할 매칭 선택
  let matchesToApply = [];
  if (autoHigh) {
    matchesToApply = report.matches.filter(m => m.confidence === 'high');
    console.log(`✅ High confidence 매칭만 자동 적용: ${matchesToApply.length}건\n`);
  } else {
    // 모든 매칭 적용
    matchesToApply = report.matches;
    console.log(`⚠️  모든 매칭 적용: ${matchesToApply.length}건\n`);
  }

  // 원본 CSV 파일 읽기
  const csvFilePath = path.join(__dirname, '..', 'database', '예약 목록-2025. 11. 26..csv');
  if (!fs.existsSync(csvFilePath)) {
    console.error(`❌ CSV 파일을 찾을 수 없습니다: ${csvFilePath}`);
    process.exit(1);
  }

  const rows = [];
  const headers = [];

  await new Promise((resolve, reject) => {
    let isFirstRow = true;
    fs.createReadStream(csvFilePath)
      .pipe(csv())
      .on('data', (row) => {
        if (isFirstRow) {
          headers.push(...Object.keys(row));
          isFirstRow = false;
        }
        rows.push(row);
      })
      .on('end', resolve)
      .on('error', reject);
  });

  console.log(`📊 CSV 파일 로드: ${rows.length}건\n`);

  // 매칭 맵 생성 (빠른 검색을 위해)
  const matchMap = new Map();
  for (const match of matchesToApply) {
    const key = `${normalizeName(match.original.name)}_${extractDate(match.original.date) || match.original.date}`;
    matchMap.set(key, match.suggestedPhone);
  }

  // CSV 행 업데이트
  let updatedCount = 0;
  let skippedCount = 0;

  for (const row of rows) {
    const name = (row['이름'] || '').trim();
    const normalizedName = normalizeName(name);
    const date = extractDate(row['예약 시작 시간']) || row['예약 시작 시간'] || '';
    const key = `${normalizedName}_${date}`;
    const currentPhone = normalizePhone(row['전화번호'] || row['전화']);

    // 전화번호가 없고 매칭이 있는 경우
    if (!currentPhone && matchMap.has(key)) {
      const suggestedPhone = matchMap.get(key);
      row['전화번호'] = suggestedPhone;
      updatedCount++;
    } else if (!currentPhone) {
      skippedCount++;
    }
  }

  console.log(`✅ 업데이트된 행: ${updatedCount}건`);
  console.log(`⚠️  건너뛴 행: ${skippedCount}건\n`);

  // 백업 생성
  const backupPath = path.join(__dirname, '..', 'backup', `예약 목록-2025. 11. 26-backup-${Date.now()}.csv`);
  fs.copyFileSync(csvFilePath, backupPath);
  console.log(`📦 원본 CSV 백업: ${backupPath}\n`);

  // 업데이트된 CSV 저장
  const updatedCsvPath = path.join(__dirname, '..', 'database', '예약 목록-2025. 11. 26-updated.csv');
  
  // CSV 헤더 작성
  const csvLines = [headers.join(',')];
  
  // CSV 행 작성
  for (const row of rows) {
    const values = headers.map(header => {
      const value = row[header] || '';
      // CSV 이스케이프 처리
      if (value.includes(',') || value.includes('"') || value.includes('\n')) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return value;
    });
    csvLines.push(values.join(','));
  }

  fs.writeFileSync(updatedCsvPath, csvLines.join('\n'), 'utf8');
  console.log(`✅ 업데이트된 CSV 저장: ${updatedCsvPath}\n`);

  console.log('💡 다음 단계:');
  console.log('   1. 업데이트된 CSV 파일 검토');
  console.log('   2. 문제없으면 원본 파일 교체');
  console.log('   3. node scripts/migrate-wix-bookings.js 로 재마이그레이션');
  console.log('\n✅ 적용 완료!\n');
}

// 메인 실행
const reportPath = process.argv[2] || (() => {
  // 가장 최근 보고서 파일 찾기
  const backupDir = path.join(__dirname, '..', 'backup');
  if (!fs.existsSync(backupDir)) {
    console.error('❌ backup 디렉토리가 없습니다.');
    process.exit(1);
  }
  
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
  
  return files[0].path;
})();

const autoHigh = process.argv.includes('--auto-high');

applyPhoneMatches(reportPath, { autoHigh })
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('\n❌ 적용 실패:', err);
    process.exit(1);
  });







 * 전화번호 매칭 결과를 CSV에 적용하는 스크립트
 * 
 * 사용법:
 * node scripts/apply-phone-matches.js [보고서파일경로] [--auto-high]
 * 
 * 옵션:
 *   --auto-high    High confidence 매칭만 자동 적용
 */

const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');

// 전화번호 정규화
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

// 이름 정규화
function normalizeName(name) {
  if (!name) return '';
  return name.trim()
    .replace(/\s+/g, '')
    .replace(/\([^)]*\)/g, '')
    .toLowerCase();
}

// 날짜 추출
function extractDate(dateStr) {
  if (!dateStr) return null;
  try {
    const match = dateStr.match(/(\d{4})\.\s*(\d{1,2})\.\s*(\d{1,2})/);
    if (!match) return null;
    const [, year, month, day] = match;
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  } catch (e) {
    return null;
  }
}

async function applyPhoneMatches(reportPath, options = {}) {
  const { autoHigh = false } = options;

  console.log('📝 전화번호 매칭 결과 적용 시작...\n');

  // 보고서 파일 읽기
  if (!fs.existsSync(reportPath)) {
    console.error(`❌ 보고서 파일을 찾을 수 없습니다: ${reportPath}`);
    process.exit(1);
  }

  const report = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
  console.log(`📊 보고서 로드: ${report.matches.length}건 매칭, ${report.noMatches.length}건 실패\n`);

  // 적용할 매칭 선택
  let matchesToApply = [];
  if (autoHigh) {
    matchesToApply = report.matches.filter(m => m.confidence === 'high');
    console.log(`✅ High confidence 매칭만 자동 적용: ${matchesToApply.length}건\n`);
  } else {
    // 모든 매칭 적용
    matchesToApply = report.matches;
    console.log(`⚠️  모든 매칭 적용: ${matchesToApply.length}건\n`);
  }

  // 원본 CSV 파일 읽기
  const csvFilePath = path.join(__dirname, '..', 'database', '예약 목록-2025. 11. 26..csv');
  if (!fs.existsSync(csvFilePath)) {
    console.error(`❌ CSV 파일을 찾을 수 없습니다: ${csvFilePath}`);
    process.exit(1);
  }

  const rows = [];
  const headers = [];

  await new Promise((resolve, reject) => {
    let isFirstRow = true;
    fs.createReadStream(csvFilePath)
      .pipe(csv())
      .on('data', (row) => {
        if (isFirstRow) {
          headers.push(...Object.keys(row));
          isFirstRow = false;
        }
        rows.push(row);
      })
      .on('end', resolve)
      .on('error', reject);
  });

  console.log(`📊 CSV 파일 로드: ${rows.length}건\n`);

  // 매칭 맵 생성 (빠른 검색을 위해)
  const matchMap = new Map();
  for (const match of matchesToApply) {
    const key = `${normalizeName(match.original.name)}_${extractDate(match.original.date) || match.original.date}`;
    matchMap.set(key, match.suggestedPhone);
  }

  // CSV 행 업데이트
  let updatedCount = 0;
  let skippedCount = 0;

  for (const row of rows) {
    const name = (row['이름'] || '').trim();
    const normalizedName = normalizeName(name);
    const date = extractDate(row['예약 시작 시간']) || row['예약 시작 시간'] || '';
    const key = `${normalizedName}_${date}`;
    const currentPhone = normalizePhone(row['전화번호'] || row['전화']);

    // 전화번호가 없고 매칭이 있는 경우
    if (!currentPhone && matchMap.has(key)) {
      const suggestedPhone = matchMap.get(key);
      row['전화번호'] = suggestedPhone;
      updatedCount++;
    } else if (!currentPhone) {
      skippedCount++;
    }
  }

  console.log(`✅ 업데이트된 행: ${updatedCount}건`);
  console.log(`⚠️  건너뛴 행: ${skippedCount}건\n`);

  // 백업 생성
  const backupPath = path.join(__dirname, '..', 'backup', `예약 목록-2025. 11. 26-backup-${Date.now()}.csv`);
  fs.copyFileSync(csvFilePath, backupPath);
  console.log(`📦 원본 CSV 백업: ${backupPath}\n`);

  // 업데이트된 CSV 저장
  const updatedCsvPath = path.join(__dirname, '..', 'database', '예약 목록-2025. 11. 26-updated.csv');
  
  // CSV 헤더 작성
  const csvLines = [headers.join(',')];
  
  // CSV 행 작성
  for (const row of rows) {
    const values = headers.map(header => {
      const value = row[header] || '';
      // CSV 이스케이프 처리
      if (value.includes(',') || value.includes('"') || value.includes('\n')) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return value;
    });
    csvLines.push(values.join(','));
  }

  fs.writeFileSync(updatedCsvPath, csvLines.join('\n'), 'utf8');
  console.log(`✅ 업데이트된 CSV 저장: ${updatedCsvPath}\n`);

  console.log('💡 다음 단계:');
  console.log('   1. 업데이트된 CSV 파일 검토');
  console.log('   2. 문제없으면 원본 파일 교체');
  console.log('   3. node scripts/migrate-wix-bookings.js 로 재마이그레이션');
  console.log('\n✅ 적용 완료!\n');
}

// 메인 실행
const reportPath = process.argv[2] || (() => {
  // 가장 최근 보고서 파일 찾기
  const backupDir = path.join(__dirname, '..', 'backup');
  if (!fs.existsSync(backupDir)) {
    console.error('❌ backup 디렉토리가 없습니다.');
    process.exit(1);
  }
  
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
  
  return files[0].path;
})();

const autoHigh = process.argv.includes('--auto-high');

applyPhoneMatches(reportPath, { autoHigh })
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('\n❌ 적용 실패:', err);
    process.exit(1);
  });















