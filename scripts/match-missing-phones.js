/**
 * 전화번호 없는 행을 이름과 날짜로 매칭하는 스크립트
 * 
 * 매칭 전략:
 * 1. 이름이 정확히 일치하는 다른 예약에서 전화번호 찾기
 * 2. 이름이 유사한 경우 (공백, 괄호 제거 후 비교)
 * 3. 이메일이 일치하는 경우 우선 매칭
 * 4. 같은 날짜 또는 비슷한 날짜의 예약에서 찾기
 * 
 * 사용법:
 * node scripts/match-missing-phones.js
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

// 이름 정규화 (공백, 괄호 제거)
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

// 이메일 정규화
function normalizeEmail(email) {
  if (!email) return null;
  return email.trim().toLowerCase();
}

async function matchMissingPhones() {
  console.log('🔍 전화번호 매칭 시작...\n');

  const csvFilePath = path.join(__dirname, '..', 'database', '예약 목록-2025. 11. 26..csv');
  if (!fs.existsSync(csvFilePath)) {
    console.error(`❌ CSV 파일을 찾을 수 없습니다: ${csvFilePath}`);
    process.exit(1);
  }

  const allRows = [];
  await new Promise((resolve, reject) => {
    fs.createReadStream(csvFilePath)
      .pipe(csv())
      .on('data', (row) => allRows.push(row))
      .on('end', resolve)
      .on('error', reject);
  });

  console.log(`📊 CSV 파일: ${allRows.length}건\n`);

  // 전화번호 없는 행과 있는 행 분리
  const rowsWithoutPhone = [];
  const rowsWithPhone = new Map(); // normalizedName -> [rows with phone]

  for (const row of allRows) {
    const phone = normalizePhone(row['전화번호'] || row['전화']);
    const name = (row['이름'] || '').trim();
    const normalizedName = normalizeName(name);
    
    if (!phone) {
      rowsWithoutPhone.push(row);
    } else {
      if (!rowsWithPhone.has(normalizedName)) {
        rowsWithPhone.set(normalizedName, []);
      }
      rowsWithPhone.get(normalizedName).push({
        ...row,
        normalizedPhone: phone,
      });
    }
  }

  console.log(`📋 전화번호 없는 행: ${rowsWithoutPhone.length}건`);
  console.log(`📋 전화번호 있는 행: ${allRows.length - rowsWithoutPhone.length}건\n`);

  // 매칭 수행
  const matches = [];
  const noMatches = [];

  for (const row of rowsWithoutPhone) {
    const name = (row['이름'] || '').trim();
    const normalizedName = normalizeName(name);
    const email = normalizeEmail(row['이메일']);
    const bookingDate = extractDate(row['예약 시작 시간']);

    let match = null;
    let confidence = 'low';
    let matchReason = '';

    // 1. 이름 정확히 일치 + 이메일 일치 (최우선, high confidence)
    if (email) {
      const candidates = rowsWithPhone.get(normalizedName) || [];
      match = candidates.find(r => {
        const rEmail = normalizeEmail(r['이메일']);
        return rEmail === email;
      });
      if (match) {
        confidence = 'high';
        matchReason = '이름 + 이메일 일치';
      }
    }

    // 2. 이름 정확히 일치 (이메일 없어도, medium confidence)
    if (!match) {
      const candidates = rowsWithPhone.get(normalizedName) || [];
      if (candidates.length > 0) {
        // 같은 날짜에 가까운 예약 우선
        if (bookingDate) {
          match = candidates.find(r => {
            const rDate = extractDate(r['예약 시작 시간']);
            return rDate === bookingDate;
          });
          if (match) {
            confidence = 'high';
            matchReason = '이름 + 날짜 일치';
          } else {
            // 날짜가 다르지만 이름이 일치
            match = candidates[0];
            confidence = 'medium';
            matchReason = '이름 일치 (날짜 다름)';
          }
        } else {
          match = candidates[0];
          confidence = 'medium';
          matchReason = '이름 일치';
        }
      }
    }

    // 3. 이름 유사 매칭 (공백, 괄호 제거 후 비교, low confidence)
    if (!match) {
      for (const [key, candidates] of rowsWithPhone.entries()) {
        // 이름이 부분적으로 일치하는 경우
        if (normalizedName.length >= 2 && key.includes(normalizedName) || normalizedName.includes(key)) {
          match = candidates[0];
          confidence = 'low';
          matchReason = `이름 유사 (${name} ≈ ${candidates[0]['이름']})`;
          break;
        }
      }
    }

    if (match) {
      matches.push({
        original: {
          name: name,
          email: email || '',
          date: bookingDate || row['예약 시작 시간'] || '',
          service: row['서비스명'] || '',
        },
        matched: {
          name: match['이름'],
          phone: match.normalizedPhone,
          email: match['이메일'] || '',
          date: extractDate(match['예약 시작 시간']) || '',
        },
        confidence: confidence,
        reason: matchReason,
        suggestedPhone: match.normalizedPhone,
      });
    } else {
      noMatches.push({
        name: name,
        email: email || '',
        date: bookingDate || row['예약 시작 시간'] || '',
        service: row['서비스명'] || '',
      });
    }
  }

  // 결과 출력
  console.log('='.repeat(60));
  console.log('📋 매칭 결과');
  console.log('='.repeat(60));
  console.log(`\n✅ 매칭 성공: ${matches.length}건`);
  console.log(`   - High confidence: ${matches.filter(m => m.confidence === 'high').length}건`);
  console.log(`   - Medium confidence: ${matches.filter(m => m.confidence === 'medium').length}건`);
  console.log(`   - Low confidence: ${matches.filter(m => m.confidence === 'low').length}건`);
  console.log(`\n❌ 매칭 실패: ${noMatches.length}건`);

  // High confidence 매칭 상세 (상위 20건)
  const highConfidenceMatches = matches.filter(m => m.confidence === 'high');
  if (highConfidenceMatches.length > 0) {
    console.log(`\n📋 High Confidence 매칭 (상위 20건):`);
    highConfidenceMatches.slice(0, 20).forEach((match, idx) => {
      console.log(`  ${idx + 1}. ${match.original.name} → ${match.suggestedPhone}`);
      console.log(`     이유: ${match.reason}`);
      console.log(`     원본: ${match.original.date} | 매칭: ${match.matched.date}`);
    });
  }

  // Medium confidence 매칭 상세 (상위 10건)
  const mediumConfidenceMatches = matches.filter(m => m.confidence === 'medium');
  if (mediumConfidenceMatches.length > 0) {
    console.log(`\n📋 Medium Confidence 매칭 (상위 10건):`);
    mediumConfidenceMatches.slice(0, 10).forEach((match, idx) => {
      console.log(`  ${idx + 1}. ${match.original.name} → ${match.suggestedPhone}`);
      console.log(`     이유: ${match.reason}`);
    });
  }

  // 매칭 실패 목록 (상위 20건)
  if (noMatches.length > 0) {
    console.log(`\n📋 매칭 실패 목록 (상위 20건):`);
    noMatches.slice(0, 20).forEach((row, idx) => {
      console.log(`  ${idx + 1}. ${row.name} - ${row.date} - ${row.service}`);
    });
    if (noMatches.length > 20) {
      console.log(`  ... 외 ${noMatches.length - 20}건`);
    }
  }

  // 결과를 파일로 저장
  const reportPath = path.join(__dirname, '..', 'backup', `phone-matching-report-${Date.now()}.json`);
  const reportDir = path.dirname(reportPath);
  if (!fs.existsSync(reportDir)) {
    fs.mkdirSync(reportDir, { recursive: true });
  }

  const report = {
    timestamp: new Date().toISOString(),
    summary: {
      totalWithoutPhone: rowsWithoutPhone.length,
      matched: matches.length,
      noMatch: noMatches.length,
      highConfidence: highConfidenceMatches.length,
      mediumConfidence: mediumConfidenceMatches.length,
      lowConfidence: matches.filter(m => m.confidence === 'low').length,
    },
    matches: matches,
    noMatches: noMatches,
  };

  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2), 'utf8');
  console.log(`\n📄 상세 보고서 저장: ${reportPath}`);

  // CSV 수정 가이드 생성
  const csvUpdatePath = path.join(__dirname, '..', 'backup', `phone-updates-${Date.now()}.csv`);
  const csvUpdates = [];
  
  // High confidence만 CSV 업데이트 파일에 포함
  for (const match of highConfidenceMatches) {
    csvUpdates.push({
      원본이름: match.original.name,
      원본날짜: match.original.date,
      제안전화번호: match.suggestedPhone,
      매칭이름: match.matched.name,
      매칭날짜: match.matched.date,
      신뢰도: match.confidence,
      이유: match.reason,
    });
  }

  if (csvUpdates.length > 0) {
    const csvContent = [
      Object.keys(csvUpdates[0]).join(','),
      ...csvUpdates.map(row => Object.values(row).join(','))
    ].join('\n');
    
    fs.writeFileSync(csvUpdatePath, csvContent, 'utf8');
    console.log(`📄 CSV 업데이트 가이드 저장: ${csvUpdatePath}`);
  }

  console.log('\n✅ 매칭 완료!\n');
  console.log('💡 다음 단계:');
  console.log('   1. 보고서를 확인하여 매칭 결과 검토');
  console.log('   2. High confidence 매칭은 자동 적용 가능');
  console.log('   3. Medium/Low confidence는 수동 검토 필요');
  console.log('   4. node scripts/apply-phone-matches.js 로 적용');
}

matchMissingPhones()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('\n❌ 매칭 실패:', err);
    process.exit(1);
  });







 * 전화번호 없는 행을 이름과 날짜로 매칭하는 스크립트
 * 
 * 매칭 전략:
 * 1. 이름이 정확히 일치하는 다른 예약에서 전화번호 찾기
 * 2. 이름이 유사한 경우 (공백, 괄호 제거 후 비교)
 * 3. 이메일이 일치하는 경우 우선 매칭
 * 4. 같은 날짜 또는 비슷한 날짜의 예약에서 찾기
 * 
 * 사용법:
 * node scripts/match-missing-phones.js
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

// 이름 정규화 (공백, 괄호 제거)
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

// 이메일 정규화
function normalizeEmail(email) {
  if (!email) return null;
  return email.trim().toLowerCase();
}

async function matchMissingPhones() {
  console.log('🔍 전화번호 매칭 시작...\n');

  const csvFilePath = path.join(__dirname, '..', 'database', '예약 목록-2025. 11. 26..csv');
  if (!fs.existsSync(csvFilePath)) {
    console.error(`❌ CSV 파일을 찾을 수 없습니다: ${csvFilePath}`);
    process.exit(1);
  }

  const allRows = [];
  await new Promise((resolve, reject) => {
    fs.createReadStream(csvFilePath)
      .pipe(csv())
      .on('data', (row) => allRows.push(row))
      .on('end', resolve)
      .on('error', reject);
  });

  console.log(`📊 CSV 파일: ${allRows.length}건\n`);

  // 전화번호 없는 행과 있는 행 분리
  const rowsWithoutPhone = [];
  const rowsWithPhone = new Map(); // normalizedName -> [rows with phone]

  for (const row of allRows) {
    const phone = normalizePhone(row['전화번호'] || row['전화']);
    const name = (row['이름'] || '').trim();
    const normalizedName = normalizeName(name);
    
    if (!phone) {
      rowsWithoutPhone.push(row);
    } else {
      if (!rowsWithPhone.has(normalizedName)) {
        rowsWithPhone.set(normalizedName, []);
      }
      rowsWithPhone.get(normalizedName).push({
        ...row,
        normalizedPhone: phone,
      });
    }
  }

  console.log(`📋 전화번호 없는 행: ${rowsWithoutPhone.length}건`);
  console.log(`📋 전화번호 있는 행: ${allRows.length - rowsWithoutPhone.length}건\n`);

  // 매칭 수행
  const matches = [];
  const noMatches = [];

  for (const row of rowsWithoutPhone) {
    const name = (row['이름'] || '').trim();
    const normalizedName = normalizeName(name);
    const email = normalizeEmail(row['이메일']);
    const bookingDate = extractDate(row['예약 시작 시간']);

    let match = null;
    let confidence = 'low';
    let matchReason = '';

    // 1. 이름 정확히 일치 + 이메일 일치 (최우선, high confidence)
    if (email) {
      const candidates = rowsWithPhone.get(normalizedName) || [];
      match = candidates.find(r => {
        const rEmail = normalizeEmail(r['이메일']);
        return rEmail === email;
      });
      if (match) {
        confidence = 'high';
        matchReason = '이름 + 이메일 일치';
      }
    }

    // 2. 이름 정확히 일치 (이메일 없어도, medium confidence)
    if (!match) {
      const candidates = rowsWithPhone.get(normalizedName) || [];
      if (candidates.length > 0) {
        // 같은 날짜에 가까운 예약 우선
        if (bookingDate) {
          match = candidates.find(r => {
            const rDate = extractDate(r['예약 시작 시간']);
            return rDate === bookingDate;
          });
          if (match) {
            confidence = 'high';
            matchReason = '이름 + 날짜 일치';
          } else {
            // 날짜가 다르지만 이름이 일치
            match = candidates[0];
            confidence = 'medium';
            matchReason = '이름 일치 (날짜 다름)';
          }
        } else {
          match = candidates[0];
          confidence = 'medium';
          matchReason = '이름 일치';
        }
      }
    }

    // 3. 이름 유사 매칭 (공백, 괄호 제거 후 비교, low confidence)
    if (!match) {
      for (const [key, candidates] of rowsWithPhone.entries()) {
        // 이름이 부분적으로 일치하는 경우
        if (normalizedName.length >= 2 && key.includes(normalizedName) || normalizedName.includes(key)) {
          match = candidates[0];
          confidence = 'low';
          matchReason = `이름 유사 (${name} ≈ ${candidates[0]['이름']})`;
          break;
        }
      }
    }

    if (match) {
      matches.push({
        original: {
          name: name,
          email: email || '',
          date: bookingDate || row['예약 시작 시간'] || '',
          service: row['서비스명'] || '',
        },
        matched: {
          name: match['이름'],
          phone: match.normalizedPhone,
          email: match['이메일'] || '',
          date: extractDate(match['예약 시작 시간']) || '',
        },
        confidence: confidence,
        reason: matchReason,
        suggestedPhone: match.normalizedPhone,
      });
    } else {
      noMatches.push({
        name: name,
        email: email || '',
        date: bookingDate || row['예약 시작 시간'] || '',
        service: row['서비스명'] || '',
      });
    }
  }

  // 결과 출력
  console.log('='.repeat(60));
  console.log('📋 매칭 결과');
  console.log('='.repeat(60));
  console.log(`\n✅ 매칭 성공: ${matches.length}건`);
  console.log(`   - High confidence: ${matches.filter(m => m.confidence === 'high').length}건`);
  console.log(`   - Medium confidence: ${matches.filter(m => m.confidence === 'medium').length}건`);
  console.log(`   - Low confidence: ${matches.filter(m => m.confidence === 'low').length}건`);
  console.log(`\n❌ 매칭 실패: ${noMatches.length}건`);

  // High confidence 매칭 상세 (상위 20건)
  const highConfidenceMatches = matches.filter(m => m.confidence === 'high');
  if (highConfidenceMatches.length > 0) {
    console.log(`\n📋 High Confidence 매칭 (상위 20건):`);
    highConfidenceMatches.slice(0, 20).forEach((match, idx) => {
      console.log(`  ${idx + 1}. ${match.original.name} → ${match.suggestedPhone}`);
      console.log(`     이유: ${match.reason}`);
      console.log(`     원본: ${match.original.date} | 매칭: ${match.matched.date}`);
    });
  }

  // Medium confidence 매칭 상세 (상위 10건)
  const mediumConfidenceMatches = matches.filter(m => m.confidence === 'medium');
  if (mediumConfidenceMatches.length > 0) {
    console.log(`\n📋 Medium Confidence 매칭 (상위 10건):`);
    mediumConfidenceMatches.slice(0, 10).forEach((match, idx) => {
      console.log(`  ${idx + 1}. ${match.original.name} → ${match.suggestedPhone}`);
      console.log(`     이유: ${match.reason}`);
    });
  }

  // 매칭 실패 목록 (상위 20건)
  if (noMatches.length > 0) {
    console.log(`\n📋 매칭 실패 목록 (상위 20건):`);
    noMatches.slice(0, 20).forEach((row, idx) => {
      console.log(`  ${idx + 1}. ${row.name} - ${row.date} - ${row.service}`);
    });
    if (noMatches.length > 20) {
      console.log(`  ... 외 ${noMatches.length - 20}건`);
    }
  }

  // 결과를 파일로 저장
  const reportPath = path.join(__dirname, '..', 'backup', `phone-matching-report-${Date.now()}.json`);
  const reportDir = path.dirname(reportPath);
  if (!fs.existsSync(reportDir)) {
    fs.mkdirSync(reportDir, { recursive: true });
  }

  const report = {
    timestamp: new Date().toISOString(),
    summary: {
      totalWithoutPhone: rowsWithoutPhone.length,
      matched: matches.length,
      noMatch: noMatches.length,
      highConfidence: highConfidenceMatches.length,
      mediumConfidence: mediumConfidenceMatches.length,
      lowConfidence: matches.filter(m => m.confidence === 'low').length,
    },
    matches: matches,
    noMatches: noMatches,
  };

  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2), 'utf8');
  console.log(`\n📄 상세 보고서 저장: ${reportPath}`);

  // CSV 수정 가이드 생성
  const csvUpdatePath = path.join(__dirname, '..', 'backup', `phone-updates-${Date.now()}.csv`);
  const csvUpdates = [];
  
  // High confidence만 CSV 업데이트 파일에 포함
  for (const match of highConfidenceMatches) {
    csvUpdates.push({
      원본이름: match.original.name,
      원본날짜: match.original.date,
      제안전화번호: match.suggestedPhone,
      매칭이름: match.matched.name,
      매칭날짜: match.matched.date,
      신뢰도: match.confidence,
      이유: match.reason,
    });
  }

  if (csvUpdates.length > 0) {
    const csvContent = [
      Object.keys(csvUpdates[0]).join(','),
      ...csvUpdates.map(row => Object.values(row).join(','))
    ].join('\n');
    
    fs.writeFileSync(csvUpdatePath, csvContent, 'utf8');
    console.log(`📄 CSV 업데이트 가이드 저장: ${csvUpdatePath}`);
  }

  console.log('\n✅ 매칭 완료!\n');
  console.log('💡 다음 단계:');
  console.log('   1. 보고서를 확인하여 매칭 결과 검토');
  console.log('   2. High confidence 매칭은 자동 적용 가능');
  console.log('   3. Medium/Low confidence는 수동 검토 필요');
  console.log('   4. node scripts/apply-phone-matches.js 로 적용');
}

matchMissingPhones()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('\n❌ 매칭 실패:', err);
    process.exit(1);
  });







 * 전화번호 없는 행을 이름과 날짜로 매칭하는 스크립트
 * 
 * 매칭 전략:
 * 1. 이름이 정확히 일치하는 다른 예약에서 전화번호 찾기
 * 2. 이름이 유사한 경우 (공백, 괄호 제거 후 비교)
 * 3. 이메일이 일치하는 경우 우선 매칭
 * 4. 같은 날짜 또는 비슷한 날짜의 예약에서 찾기
 * 
 * 사용법:
 * node scripts/match-missing-phones.js
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

// 이름 정규화 (공백, 괄호 제거)
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

// 이메일 정규화
function normalizeEmail(email) {
  if (!email) return null;
  return email.trim().toLowerCase();
}

async function matchMissingPhones() {
  console.log('🔍 전화번호 매칭 시작...\n');

  const csvFilePath = path.join(__dirname, '..', 'database', '예약 목록-2025. 11. 26..csv');
  if (!fs.existsSync(csvFilePath)) {
    console.error(`❌ CSV 파일을 찾을 수 없습니다: ${csvFilePath}`);
    process.exit(1);
  }

  const allRows = [];
  await new Promise((resolve, reject) => {
    fs.createReadStream(csvFilePath)
      .pipe(csv())
      .on('data', (row) => allRows.push(row))
      .on('end', resolve)
      .on('error', reject);
  });

  console.log(`📊 CSV 파일: ${allRows.length}건\n`);

  // 전화번호 없는 행과 있는 행 분리
  const rowsWithoutPhone = [];
  const rowsWithPhone = new Map(); // normalizedName -> [rows with phone]

  for (const row of allRows) {
    const phone = normalizePhone(row['전화번호'] || row['전화']);
    const name = (row['이름'] || '').trim();
    const normalizedName = normalizeName(name);
    
    if (!phone) {
      rowsWithoutPhone.push(row);
    } else {
      if (!rowsWithPhone.has(normalizedName)) {
        rowsWithPhone.set(normalizedName, []);
      }
      rowsWithPhone.get(normalizedName).push({
        ...row,
        normalizedPhone: phone,
      });
    }
  }

  console.log(`📋 전화번호 없는 행: ${rowsWithoutPhone.length}건`);
  console.log(`📋 전화번호 있는 행: ${allRows.length - rowsWithoutPhone.length}건\n`);

  // 매칭 수행
  const matches = [];
  const noMatches = [];

  for (const row of rowsWithoutPhone) {
    const name = (row['이름'] || '').trim();
    const normalizedName = normalizeName(name);
    const email = normalizeEmail(row['이메일']);
    const bookingDate = extractDate(row['예약 시작 시간']);

    let match = null;
    let confidence = 'low';
    let matchReason = '';

    // 1. 이름 정확히 일치 + 이메일 일치 (최우선, high confidence)
    if (email) {
      const candidates = rowsWithPhone.get(normalizedName) || [];
      match = candidates.find(r => {
        const rEmail = normalizeEmail(r['이메일']);
        return rEmail === email;
      });
      if (match) {
        confidence = 'high';
        matchReason = '이름 + 이메일 일치';
      }
    }

    // 2. 이름 정확히 일치 (이메일 없어도, medium confidence)
    if (!match) {
      const candidates = rowsWithPhone.get(normalizedName) || [];
      if (candidates.length > 0) {
        // 같은 날짜에 가까운 예약 우선
        if (bookingDate) {
          match = candidates.find(r => {
            const rDate = extractDate(r['예약 시작 시간']);
            return rDate === bookingDate;
          });
          if (match) {
            confidence = 'high';
            matchReason = '이름 + 날짜 일치';
          } else {
            // 날짜가 다르지만 이름이 일치
            match = candidates[0];
            confidence = 'medium';
            matchReason = '이름 일치 (날짜 다름)';
          }
        } else {
          match = candidates[0];
          confidence = 'medium';
          matchReason = '이름 일치';
        }
      }
    }

    // 3. 이름 유사 매칭 (공백, 괄호 제거 후 비교, low confidence)
    if (!match) {
      for (const [key, candidates] of rowsWithPhone.entries()) {
        // 이름이 부분적으로 일치하는 경우
        if (normalizedName.length >= 2 && key.includes(normalizedName) || normalizedName.includes(key)) {
          match = candidates[0];
          confidence = 'low';
          matchReason = `이름 유사 (${name} ≈ ${candidates[0]['이름']})`;
          break;
        }
      }
    }

    if (match) {
      matches.push({
        original: {
          name: name,
          email: email || '',
          date: bookingDate || row['예약 시작 시간'] || '',
          service: row['서비스명'] || '',
        },
        matched: {
          name: match['이름'],
          phone: match.normalizedPhone,
          email: match['이메일'] || '',
          date: extractDate(match['예약 시작 시간']) || '',
        },
        confidence: confidence,
        reason: matchReason,
        suggestedPhone: match.normalizedPhone,
      });
    } else {
      noMatches.push({
        name: name,
        email: email || '',
        date: bookingDate || row['예약 시작 시간'] || '',
        service: row['서비스명'] || '',
      });
    }
  }

  // 결과 출력
  console.log('='.repeat(60));
  console.log('📋 매칭 결과');
  console.log('='.repeat(60));
  console.log(`\n✅ 매칭 성공: ${matches.length}건`);
  console.log(`   - High confidence: ${matches.filter(m => m.confidence === 'high').length}건`);
  console.log(`   - Medium confidence: ${matches.filter(m => m.confidence === 'medium').length}건`);
  console.log(`   - Low confidence: ${matches.filter(m => m.confidence === 'low').length}건`);
  console.log(`\n❌ 매칭 실패: ${noMatches.length}건`);

  // High confidence 매칭 상세 (상위 20건)
  const highConfidenceMatches = matches.filter(m => m.confidence === 'high');
  if (highConfidenceMatches.length > 0) {
    console.log(`\n📋 High Confidence 매칭 (상위 20건):`);
    highConfidenceMatches.slice(0, 20).forEach((match, idx) => {
      console.log(`  ${idx + 1}. ${match.original.name} → ${match.suggestedPhone}`);
      console.log(`     이유: ${match.reason}`);
      console.log(`     원본: ${match.original.date} | 매칭: ${match.matched.date}`);
    });
  }

  // Medium confidence 매칭 상세 (상위 10건)
  const mediumConfidenceMatches = matches.filter(m => m.confidence === 'medium');
  if (mediumConfidenceMatches.length > 0) {
    console.log(`\n📋 Medium Confidence 매칭 (상위 10건):`);
    mediumConfidenceMatches.slice(0, 10).forEach((match, idx) => {
      console.log(`  ${idx + 1}. ${match.original.name} → ${match.suggestedPhone}`);
      console.log(`     이유: ${match.reason}`);
    });
  }

  // 매칭 실패 목록 (상위 20건)
  if (noMatches.length > 0) {
    console.log(`\n📋 매칭 실패 목록 (상위 20건):`);
    noMatches.slice(0, 20).forEach((row, idx) => {
      console.log(`  ${idx + 1}. ${row.name} - ${row.date} - ${row.service}`);
    });
    if (noMatches.length > 20) {
      console.log(`  ... 외 ${noMatches.length - 20}건`);
    }
  }

  // 결과를 파일로 저장
  const reportPath = path.join(__dirname, '..', 'backup', `phone-matching-report-${Date.now()}.json`);
  const reportDir = path.dirname(reportPath);
  if (!fs.existsSync(reportDir)) {
    fs.mkdirSync(reportDir, { recursive: true });
  }

  const report = {
    timestamp: new Date().toISOString(),
    summary: {
      totalWithoutPhone: rowsWithoutPhone.length,
      matched: matches.length,
      noMatch: noMatches.length,
      highConfidence: highConfidenceMatches.length,
      mediumConfidence: mediumConfidenceMatches.length,
      lowConfidence: matches.filter(m => m.confidence === 'low').length,
    },
    matches: matches,
    noMatches: noMatches,
  };

  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2), 'utf8');
  console.log(`\n📄 상세 보고서 저장: ${reportPath}`);

  // CSV 수정 가이드 생성
  const csvUpdatePath = path.join(__dirname, '..', 'backup', `phone-updates-${Date.now()}.csv`);
  const csvUpdates = [];
  
  // High confidence만 CSV 업데이트 파일에 포함
  for (const match of highConfidenceMatches) {
    csvUpdates.push({
      원본이름: match.original.name,
      원본날짜: match.original.date,
      제안전화번호: match.suggestedPhone,
      매칭이름: match.matched.name,
      매칭날짜: match.matched.date,
      신뢰도: match.confidence,
      이유: match.reason,
    });
  }

  if (csvUpdates.length > 0) {
    const csvContent = [
      Object.keys(csvUpdates[0]).join(','),
      ...csvUpdates.map(row => Object.values(row).join(','))
    ].join('\n');
    
    fs.writeFileSync(csvUpdatePath, csvContent, 'utf8');
    console.log(`📄 CSV 업데이트 가이드 저장: ${csvUpdatePath}`);
  }

  console.log('\n✅ 매칭 완료!\n');
  console.log('💡 다음 단계:');
  console.log('   1. 보고서를 확인하여 매칭 결과 검토');
  console.log('   2. High confidence 매칭은 자동 적용 가능');
  console.log('   3. Medium/Low confidence는 수동 검토 필요');
  console.log('   4. node scripts/apply-phone-matches.js 로 적용');
}

matchMissingPhones()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('\n❌ 매칭 실패:', err);
    process.exit(1);
  });







 * 전화번호 없는 행을 이름과 날짜로 매칭하는 스크립트
 * 
 * 매칭 전략:
 * 1. 이름이 정확히 일치하는 다른 예약에서 전화번호 찾기
 * 2. 이름이 유사한 경우 (공백, 괄호 제거 후 비교)
 * 3. 이메일이 일치하는 경우 우선 매칭
 * 4. 같은 날짜 또는 비슷한 날짜의 예약에서 찾기
 * 
 * 사용법:
 * node scripts/match-missing-phones.js
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

// 이름 정규화 (공백, 괄호 제거)
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

// 이메일 정규화
function normalizeEmail(email) {
  if (!email) return null;
  return email.trim().toLowerCase();
}

async function matchMissingPhones() {
  console.log('🔍 전화번호 매칭 시작...\n');

  const csvFilePath = path.join(__dirname, '..', 'database', '예약 목록-2025. 11. 26..csv');
  if (!fs.existsSync(csvFilePath)) {
    console.error(`❌ CSV 파일을 찾을 수 없습니다: ${csvFilePath}`);
    process.exit(1);
  }

  const allRows = [];
  await new Promise((resolve, reject) => {
    fs.createReadStream(csvFilePath)
      .pipe(csv())
      .on('data', (row) => allRows.push(row))
      .on('end', resolve)
      .on('error', reject);
  });

  console.log(`📊 CSV 파일: ${allRows.length}건\n`);

  // 전화번호 없는 행과 있는 행 분리
  const rowsWithoutPhone = [];
  const rowsWithPhone = new Map(); // normalizedName -> [rows with phone]

  for (const row of allRows) {
    const phone = normalizePhone(row['전화번호'] || row['전화']);
    const name = (row['이름'] || '').trim();
    const normalizedName = normalizeName(name);
    
    if (!phone) {
      rowsWithoutPhone.push(row);
    } else {
      if (!rowsWithPhone.has(normalizedName)) {
        rowsWithPhone.set(normalizedName, []);
      }
      rowsWithPhone.get(normalizedName).push({
        ...row,
        normalizedPhone: phone,
      });
    }
  }

  console.log(`📋 전화번호 없는 행: ${rowsWithoutPhone.length}건`);
  console.log(`📋 전화번호 있는 행: ${allRows.length - rowsWithoutPhone.length}건\n`);

  // 매칭 수행
  const matches = [];
  const noMatches = [];

  for (const row of rowsWithoutPhone) {
    const name = (row['이름'] || '').trim();
    const normalizedName = normalizeName(name);
    const email = normalizeEmail(row['이메일']);
    const bookingDate = extractDate(row['예약 시작 시간']);

    let match = null;
    let confidence = 'low';
    let matchReason = '';

    // 1. 이름 정확히 일치 + 이메일 일치 (최우선, high confidence)
    if (email) {
      const candidates = rowsWithPhone.get(normalizedName) || [];
      match = candidates.find(r => {
        const rEmail = normalizeEmail(r['이메일']);
        return rEmail === email;
      });
      if (match) {
        confidence = 'high';
        matchReason = '이름 + 이메일 일치';
      }
    }

    // 2. 이름 정확히 일치 (이메일 없어도, medium confidence)
    if (!match) {
      const candidates = rowsWithPhone.get(normalizedName) || [];
      if (candidates.length > 0) {
        // 같은 날짜에 가까운 예약 우선
        if (bookingDate) {
          match = candidates.find(r => {
            const rDate = extractDate(r['예약 시작 시간']);
            return rDate === bookingDate;
          });
          if (match) {
            confidence = 'high';
            matchReason = '이름 + 날짜 일치';
          } else {
            // 날짜가 다르지만 이름이 일치
            match = candidates[0];
            confidence = 'medium';
            matchReason = '이름 일치 (날짜 다름)';
          }
        } else {
          match = candidates[0];
          confidence = 'medium';
          matchReason = '이름 일치';
        }
      }
    }

    // 3. 이름 유사 매칭 (공백, 괄호 제거 후 비교, low confidence)
    if (!match) {
      for (const [key, candidates] of rowsWithPhone.entries()) {
        // 이름이 부분적으로 일치하는 경우
        if (normalizedName.length >= 2 && key.includes(normalizedName) || normalizedName.includes(key)) {
          match = candidates[0];
          confidence = 'low';
          matchReason = `이름 유사 (${name} ≈ ${candidates[0]['이름']})`;
          break;
        }
      }
    }

    if (match) {
      matches.push({
        original: {
          name: name,
          email: email || '',
          date: bookingDate || row['예약 시작 시간'] || '',
          service: row['서비스명'] || '',
        },
        matched: {
          name: match['이름'],
          phone: match.normalizedPhone,
          email: match['이메일'] || '',
          date: extractDate(match['예약 시작 시간']) || '',
        },
        confidence: confidence,
        reason: matchReason,
        suggestedPhone: match.normalizedPhone,
      });
    } else {
      noMatches.push({
        name: name,
        email: email || '',
        date: bookingDate || row['예약 시작 시간'] || '',
        service: row['서비스명'] || '',
      });
    }
  }

  // 결과 출력
  console.log('='.repeat(60));
  console.log('📋 매칭 결과');
  console.log('='.repeat(60));
  console.log(`\n✅ 매칭 성공: ${matches.length}건`);
  console.log(`   - High confidence: ${matches.filter(m => m.confidence === 'high').length}건`);
  console.log(`   - Medium confidence: ${matches.filter(m => m.confidence === 'medium').length}건`);
  console.log(`   - Low confidence: ${matches.filter(m => m.confidence === 'low').length}건`);
  console.log(`\n❌ 매칭 실패: ${noMatches.length}건`);

  // High confidence 매칭 상세 (상위 20건)
  const highConfidenceMatches = matches.filter(m => m.confidence === 'high');
  if (highConfidenceMatches.length > 0) {
    console.log(`\n📋 High Confidence 매칭 (상위 20건):`);
    highConfidenceMatches.slice(0, 20).forEach((match, idx) => {
      console.log(`  ${idx + 1}. ${match.original.name} → ${match.suggestedPhone}`);
      console.log(`     이유: ${match.reason}`);
      console.log(`     원본: ${match.original.date} | 매칭: ${match.matched.date}`);
    });
  }

  // Medium confidence 매칭 상세 (상위 10건)
  const mediumConfidenceMatches = matches.filter(m => m.confidence === 'medium');
  if (mediumConfidenceMatches.length > 0) {
    console.log(`\n📋 Medium Confidence 매칭 (상위 10건):`);
    mediumConfidenceMatches.slice(0, 10).forEach((match, idx) => {
      console.log(`  ${idx + 1}. ${match.original.name} → ${match.suggestedPhone}`);
      console.log(`     이유: ${match.reason}`);
    });
  }

  // 매칭 실패 목록 (상위 20건)
  if (noMatches.length > 0) {
    console.log(`\n📋 매칭 실패 목록 (상위 20건):`);
    noMatches.slice(0, 20).forEach((row, idx) => {
      console.log(`  ${idx + 1}. ${row.name} - ${row.date} - ${row.service}`);
    });
    if (noMatches.length > 20) {
      console.log(`  ... 외 ${noMatches.length - 20}건`);
    }
  }

  // 결과를 파일로 저장
  const reportPath = path.join(__dirname, '..', 'backup', `phone-matching-report-${Date.now()}.json`);
  const reportDir = path.dirname(reportPath);
  if (!fs.existsSync(reportDir)) {
    fs.mkdirSync(reportDir, { recursive: true });
  }

  const report = {
    timestamp: new Date().toISOString(),
    summary: {
      totalWithoutPhone: rowsWithoutPhone.length,
      matched: matches.length,
      noMatch: noMatches.length,
      highConfidence: highConfidenceMatches.length,
      mediumConfidence: mediumConfidenceMatches.length,
      lowConfidence: matches.filter(m => m.confidence === 'low').length,
    },
    matches: matches,
    noMatches: noMatches,
  };

  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2), 'utf8');
  console.log(`\n📄 상세 보고서 저장: ${reportPath}`);

  // CSV 수정 가이드 생성
  const csvUpdatePath = path.join(__dirname, '..', 'backup', `phone-updates-${Date.now()}.csv`);
  const csvUpdates = [];
  
  // High confidence만 CSV 업데이트 파일에 포함
  for (const match of highConfidenceMatches) {
    csvUpdates.push({
      원본이름: match.original.name,
      원본날짜: match.original.date,
      제안전화번호: match.suggestedPhone,
      매칭이름: match.matched.name,
      매칭날짜: match.matched.date,
      신뢰도: match.confidence,
      이유: match.reason,
    });
  }

  if (csvUpdates.length > 0) {
    const csvContent = [
      Object.keys(csvUpdates[0]).join(','),
      ...csvUpdates.map(row => Object.values(row).join(','))
    ].join('\n');
    
    fs.writeFileSync(csvUpdatePath, csvContent, 'utf8');
    console.log(`📄 CSV 업데이트 가이드 저장: ${csvUpdatePath}`);
  }

  console.log('\n✅ 매칭 완료!\n');
  console.log('💡 다음 단계:');
  console.log('   1. 보고서를 확인하여 매칭 결과 검토');
  console.log('   2. High confidence 매칭은 자동 적용 가능');
  console.log('   3. Medium/Low confidence는 수동 검토 필요');
  console.log('   4. node scripts/apply-phone-matches.js 로 적용');
}

matchMissingPhones()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('\n❌ 매칭 실패:', err);
    process.exit(1);
  });







 * 전화번호 없는 행을 이름과 날짜로 매칭하는 스크립트
 * 
 * 매칭 전략:
 * 1. 이름이 정확히 일치하는 다른 예약에서 전화번호 찾기
 * 2. 이름이 유사한 경우 (공백, 괄호 제거 후 비교)
 * 3. 이메일이 일치하는 경우 우선 매칭
 * 4. 같은 날짜 또는 비슷한 날짜의 예약에서 찾기
 * 
 * 사용법:
 * node scripts/match-missing-phones.js
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

// 이름 정규화 (공백, 괄호 제거)
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

// 이메일 정규화
function normalizeEmail(email) {
  if (!email) return null;
  return email.trim().toLowerCase();
}

async function matchMissingPhones() {
  console.log('🔍 전화번호 매칭 시작...\n');

  const csvFilePath = path.join(__dirname, '..', 'database', '예약 목록-2025. 11. 26..csv');
  if (!fs.existsSync(csvFilePath)) {
    console.error(`❌ CSV 파일을 찾을 수 없습니다: ${csvFilePath}`);
    process.exit(1);
  }

  const allRows = [];
  await new Promise((resolve, reject) => {
    fs.createReadStream(csvFilePath)
      .pipe(csv())
      .on('data', (row) => allRows.push(row))
      .on('end', resolve)
      .on('error', reject);
  });

  console.log(`📊 CSV 파일: ${allRows.length}건\n`);

  // 전화번호 없는 행과 있는 행 분리
  const rowsWithoutPhone = [];
  const rowsWithPhone = new Map(); // normalizedName -> [rows with phone]

  for (const row of allRows) {
    const phone = normalizePhone(row['전화번호'] || row['전화']);
    const name = (row['이름'] || '').trim();
    const normalizedName = normalizeName(name);
    
    if (!phone) {
      rowsWithoutPhone.push(row);
    } else {
      if (!rowsWithPhone.has(normalizedName)) {
        rowsWithPhone.set(normalizedName, []);
      }
      rowsWithPhone.get(normalizedName).push({
        ...row,
        normalizedPhone: phone,
      });
    }
  }

  console.log(`📋 전화번호 없는 행: ${rowsWithoutPhone.length}건`);
  console.log(`📋 전화번호 있는 행: ${allRows.length - rowsWithoutPhone.length}건\n`);

  // 매칭 수행
  const matches = [];
  const noMatches = [];

  for (const row of rowsWithoutPhone) {
    const name = (row['이름'] || '').trim();
    const normalizedName = normalizeName(name);
    const email = normalizeEmail(row['이메일']);
    const bookingDate = extractDate(row['예약 시작 시간']);

    let match = null;
    let confidence = 'low';
    let matchReason = '';

    // 1. 이름 정확히 일치 + 이메일 일치 (최우선, high confidence)
    if (email) {
      const candidates = rowsWithPhone.get(normalizedName) || [];
      match = candidates.find(r => {
        const rEmail = normalizeEmail(r['이메일']);
        return rEmail === email;
      });
      if (match) {
        confidence = 'high';
        matchReason = '이름 + 이메일 일치';
      }
    }

    // 2. 이름 정확히 일치 (이메일 없어도, medium confidence)
    if (!match) {
      const candidates = rowsWithPhone.get(normalizedName) || [];
      if (candidates.length > 0) {
        // 같은 날짜에 가까운 예약 우선
        if (bookingDate) {
          match = candidates.find(r => {
            const rDate = extractDate(r['예약 시작 시간']);
            return rDate === bookingDate;
          });
          if (match) {
            confidence = 'high';
            matchReason = '이름 + 날짜 일치';
          } else {
            // 날짜가 다르지만 이름이 일치
            match = candidates[0];
            confidence = 'medium';
            matchReason = '이름 일치 (날짜 다름)';
          }
        } else {
          match = candidates[0];
          confidence = 'medium';
          matchReason = '이름 일치';
        }
      }
    }

    // 3. 이름 유사 매칭 (공백, 괄호 제거 후 비교, low confidence)
    if (!match) {
      for (const [key, candidates] of rowsWithPhone.entries()) {
        // 이름이 부분적으로 일치하는 경우
        if (normalizedName.length >= 2 && key.includes(normalizedName) || normalizedName.includes(key)) {
          match = candidates[0];
          confidence = 'low';
          matchReason = `이름 유사 (${name} ≈ ${candidates[0]['이름']})`;
          break;
        }
      }
    }

    if (match) {
      matches.push({
        original: {
          name: name,
          email: email || '',
          date: bookingDate || row['예약 시작 시간'] || '',
          service: row['서비스명'] || '',
        },
        matched: {
          name: match['이름'],
          phone: match.normalizedPhone,
          email: match['이메일'] || '',
          date: extractDate(match['예약 시작 시간']) || '',
        },
        confidence: confidence,
        reason: matchReason,
        suggestedPhone: match.normalizedPhone,
      });
    } else {
      noMatches.push({
        name: name,
        email: email || '',
        date: bookingDate || row['예약 시작 시간'] || '',
        service: row['서비스명'] || '',
      });
    }
  }

  // 결과 출력
  console.log('='.repeat(60));
  console.log('📋 매칭 결과');
  console.log('='.repeat(60));
  console.log(`\n✅ 매칭 성공: ${matches.length}건`);
  console.log(`   - High confidence: ${matches.filter(m => m.confidence === 'high').length}건`);
  console.log(`   - Medium confidence: ${matches.filter(m => m.confidence === 'medium').length}건`);
  console.log(`   - Low confidence: ${matches.filter(m => m.confidence === 'low').length}건`);
  console.log(`\n❌ 매칭 실패: ${noMatches.length}건`);

  // High confidence 매칭 상세 (상위 20건)
  const highConfidenceMatches = matches.filter(m => m.confidence === 'high');
  if (highConfidenceMatches.length > 0) {
    console.log(`\n📋 High Confidence 매칭 (상위 20건):`);
    highConfidenceMatches.slice(0, 20).forEach((match, idx) => {
      console.log(`  ${idx + 1}. ${match.original.name} → ${match.suggestedPhone}`);
      console.log(`     이유: ${match.reason}`);
      console.log(`     원본: ${match.original.date} | 매칭: ${match.matched.date}`);
    });
  }

  // Medium confidence 매칭 상세 (상위 10건)
  const mediumConfidenceMatches = matches.filter(m => m.confidence === 'medium');
  if (mediumConfidenceMatches.length > 0) {
    console.log(`\n📋 Medium Confidence 매칭 (상위 10건):`);
    mediumConfidenceMatches.slice(0, 10).forEach((match, idx) => {
      console.log(`  ${idx + 1}. ${match.original.name} → ${match.suggestedPhone}`);
      console.log(`     이유: ${match.reason}`);
    });
  }

  // 매칭 실패 목록 (상위 20건)
  if (noMatches.length > 0) {
    console.log(`\n📋 매칭 실패 목록 (상위 20건):`);
    noMatches.slice(0, 20).forEach((row, idx) => {
      console.log(`  ${idx + 1}. ${row.name} - ${row.date} - ${row.service}`);
    });
    if (noMatches.length > 20) {
      console.log(`  ... 외 ${noMatches.length - 20}건`);
    }
  }

  // 결과를 파일로 저장
  const reportPath = path.join(__dirname, '..', 'backup', `phone-matching-report-${Date.now()}.json`);
  const reportDir = path.dirname(reportPath);
  if (!fs.existsSync(reportDir)) {
    fs.mkdirSync(reportDir, { recursive: true });
  }

  const report = {
    timestamp: new Date().toISOString(),
    summary: {
      totalWithoutPhone: rowsWithoutPhone.length,
      matched: matches.length,
      noMatch: noMatches.length,
      highConfidence: highConfidenceMatches.length,
      mediumConfidence: mediumConfidenceMatches.length,
      lowConfidence: matches.filter(m => m.confidence === 'low').length,
    },
    matches: matches,
    noMatches: noMatches,
  };

  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2), 'utf8');
  console.log(`\n📄 상세 보고서 저장: ${reportPath}`);

  // CSV 수정 가이드 생성
  const csvUpdatePath = path.join(__dirname, '..', 'backup', `phone-updates-${Date.now()}.csv`);
  const csvUpdates = [];
  
  // High confidence만 CSV 업데이트 파일에 포함
  for (const match of highConfidenceMatches) {
    csvUpdates.push({
      원본이름: match.original.name,
      원본날짜: match.original.date,
      제안전화번호: match.suggestedPhone,
      매칭이름: match.matched.name,
      매칭날짜: match.matched.date,
      신뢰도: match.confidence,
      이유: match.reason,
    });
  }

  if (csvUpdates.length > 0) {
    const csvContent = [
      Object.keys(csvUpdates[0]).join(','),
      ...csvUpdates.map(row => Object.values(row).join(','))
    ].join('\n');
    
    fs.writeFileSync(csvUpdatePath, csvContent, 'utf8');
    console.log(`📄 CSV 업데이트 가이드 저장: ${csvUpdatePath}`);
  }

  console.log('\n✅ 매칭 완료!\n');
  console.log('💡 다음 단계:');
  console.log('   1. 보고서를 확인하여 매칭 결과 검토');
  console.log('   2. High confidence 매칭은 자동 적용 가능');
  console.log('   3. Medium/Low confidence는 수동 검토 필요');
  console.log('   4. node scripts/apply-phone-matches.js 로 적용');
}

matchMissingPhones()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('\n❌ 매칭 실패:', err);
    process.exit(1);
  });




















