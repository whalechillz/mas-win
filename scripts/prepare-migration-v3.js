/**
 * 마이그레이션 V3 준비 스크립트
 * 
 * Phase 1: Migrated3 폴더 생성 및 폴더명 변환
 * - 한글 폴더명을 영문이름+전화번호 뒷자리 4개로 변환
 * - 표준 로마자 표기법 적용
 * - 보고서 생성
 */

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
const { translateKoreanToEnglish } = require('../lib/korean-to-english-translator');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Supabase 환경 변수가 설정되지 않았습니다.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// 경로 설정
const SOURCE_FOLDER = '/Users/m2/MASLABS/00.blog_customers';
const TARGET_FOLDER = '/Users/m2/MASLABS/migrated3';
const REPORT_PATH = path.join(__dirname, '../docs/migration-v3-folder-report.json');

// 연도 필터 (빈 배열이면 모든 연도 처리)
const YEAR_FILTER = []; // 모든 연도 처리 (2022~2026)

/**
 * 표준 로마자 표기법 변환 (lib/korean-to-english-translator 사용)
 * 표준 성씨 로마자 표기법이 적용된 translateKoreanToEnglish 사용
 */
function romanizeKorean(text) {
  return translateKoreanToEnglish(text);
}

/**
 * NFD(정규화된) 한글을 NFC(조합된) 형식으로 변환
 * macOS 파일 시스템은 NFD 형식을 사용하므로 변환이 필요
 */
function normalizeKorean(text) {
  if (!text) return text;
  return text.normalize('NFC');
}

/**
 * 폴더명에서 고객 이름 추출
 * 예: "2023.06.20.조성대" -> "조성대"
 * 예: "2023.06.12.김영진-010-8832-9806" -> "김영진"
 */
function extractCustomerNameFromFolder(folderName) {
  // 날짜 패턴 제거 (YYYY.MM.DD. 또는 YYYY-MM-DD 형식)
  let name = folderName
    .replace(/^\d{4}[.\-]\d{2}[.\-]\d{2}[.\-]\s*/, '') // 날짜 제거
    .replace(/^\d{4}\d{2}\d{2}[.\-]\s*/, '') // YYYYMMDD 형식
    .trim();

  // 전화번호 제거 (예: "김영진-010-8832-9806" -> "김영진")
  name = name.replace(/[-]\s*0\d{2}[-]\d{3,4}[-]\d{4}.*$/, '').trim();
  
  // 공백 제거
  name = name.replace(/\s+/g, '').trim();

  // NFD → NFC 정규화 (macOS 파일 시스템 대응)
  name = normalizeKorean(name);

  return name;
}

/**
 * 고객 정보 조회 (이름으로)
 */
async function findCustomerByName(customerName, phone = null) {
  // 폴더명에서 고객 이름 추출
  const extractedName = extractCustomerNameFromFolder(customerName);
  
  if (!extractedName || extractedName.length === 0) {
    return null;
  }

  // 전화번호 추출
  const extractedPhone = extractPhoneFromFolderName(customerName);

  // 전화번호가 있으면 이름+전화번호로 정확히 찾기
  if (extractedPhone) {
    const { data, error } = await supabase
      .from('customers')
      .select('id, name, phone, name_en')
      .eq('name', extractedName)
      .eq('phone', extractedPhone)
      .single();

    if (!error && data) {
      return data;
    }
  }

  // 이름으로 정확히 찾기
  const { data, error } = await supabase
    .from('customers')
    .select('id, name, phone, name_en')
    .eq('name', extractedName)
    .order('updated_at', { ascending: false })
    .limit(1)
    .single();

  if (error || !data) {
    return null;
  }

  return data;
}

/**
 * 폴더명에서 전화번호 추출
 */
function extractPhoneFromFolderName(folderName) {
  const phoneMatch = folderName.match(/(0\d{2}[-]\d{3,4}[-]\d{4})/);
  return phoneMatch ? phoneMatch[1] : null;
}

/**
 * 폴더명 생성 (영문이름+전화번호 뒷자리 4개)
 */
function generateFolderName(customerName, phone, customerId) {
  // 영문 이름 생성
  let nameEn = romanizeKorean(customerName);
  
  // 영문 변환이 실패하면 고객 ID 사용
  if (!nameEn || nameEn.trim() === '' || /[가-힣]/.test(nameEn)) {
    if (customerId) {
      nameEn = `customer${String(customerId).padStart(4, '0')}`;
    } else {
      nameEn = 'customerunknown';
    }
  }
  
  // 영문 이름 정리 (하이픈 제거, 영문 숫자만, 소문자로)
  nameEn = nameEn.replace(/[^a-z0-9]/g, '').toLowerCase();
  
  if (!nameEn || nameEn.trim() === '') {
    nameEn = customerId ? `customer${String(customerId).padStart(4, '0')}` : 'customerunknown';
  }
  
  // 전화번호 뒷자리 4개 추출
  if (phone && phone.trim() !== '') {
    const phoneLast4 = phone.replace(/[^0-9]/g, '').slice(-4);
    if (phoneLast4.length === 4 && /^\d{4}$/.test(phoneLast4)) {
      return `${nameEn}-${phoneLast4}`;
    }
  }
  
  // 전화번호가 없으면 고객 ID 사용
  if (customerId) {
    return `${nameEn}-${String(customerId).padStart(4, '0')}`;
  }
  
  return `${nameEn}-unknown`;
}

/**
 * 연도 폴더 스캔
 */
function getYearFolders(basePath) {
  const folders = [];
  
  if (!fs.existsSync(basePath)) {
    console.error(`❌ 소스 폴더가 존재하지 않습니다: ${basePath}`);
    return folders;
  }

  const entries = fs.readdirSync(basePath, { withFileTypes: true });
  
  for (const entry of entries) {
    if (entry.isDirectory()) {
      const year = parseInt(entry.name);
      if (!isNaN(year) && (YEAR_FILTER.length === 0 || YEAR_FILTER.includes(year))) {
        folders.push({
          year: year,
          path: path.join(basePath, entry.name)
        });
      }
    }
  }
  
  return folders.sort((a, b) => a.year - b.year);
}

/**
 * 고객 폴더 스캔 및 변환
 */
async function processYearFolder(yearFolder) {
  const results = {
    year: yearFolder.year,
    folders: [],
    success: 0,
    failed: 0,
    skipped: 0
  };

  console.log(`\n📁 ${yearFolder.year}년 폴더 처리 중...`);

  if (!fs.existsSync(yearFolder.path)) {
    console.error(`❌ 폴더가 존재하지 않습니다: ${yearFolder.path}`);
    return results;
  }

  const entries = fs.readdirSync(yearFolder.path, { withFileTypes: true });
  
  for (const entry of entries) {
    if (!entry.isDirectory()) {
      continue;
    }

    const originalFolderName = entry.name;
    const originalPath = path.join(yearFolder.path, originalFolderName);
    
    // 이미 영문+숫자 형식인지 확인 (예: joseotdae-7010)
    if (/^[a-z0-9]+-\d{4}$/.test(originalFolderName)) {
      results.skipped++;
      results.folders.push({
        original: originalFolderName,
        converted: originalFolderName,
        status: 'skipped',
        reason: '이미 변환된 형식'
      });
      continue;
    }

    // 폴더명에서 고객 이름 추출
    const extractedCustomerName = extractCustomerNameFromFolder(originalFolderName);
    const extractedPhone = extractPhoneFromFolderName(originalFolderName);
    
    // 고객 정보 조회
    const customer = await findCustomerByName(originalFolderName, extractedPhone);
    
    let convertedFolderName;
    let status = 'success';
    let reason = '';
    let customerId = null;
    let phone = null;

    if (customer) {
      customerId = customer.id;
      phone = customer.phone || extractedPhone;
      convertedFolderName = generateFolderName(customer.name, phone, customer.id);
      results.success++;
    } else if (extractedCustomerName && extractedCustomerName.length > 0) {
      // 고객 정보가 없지만 이름은 추출된 경우, 이름만 변환
      const nameEn = romanizeKorean(extractedCustomerName);
      if (nameEn && nameEn.length > 0 && !/[가-힣]/.test(nameEn)) {
        const cleanNameEn = nameEn.replace(/[^a-z0-9]/g, '').toLowerCase();
        if (cleanNameEn && cleanNameEn.length > 0) {
          if (extractedPhone) {
            const phoneLast4 = extractedPhone.replace(/[^0-9]/g, '').slice(-4);
            convertedFolderName = `${cleanNameEn}-${phoneLast4}`;
          } else {
            convertedFolderName = `${cleanNameEn}-unknown`;
          }
          status = 'success'; // 이름 추출 성공이면 성공으로 처리
          results.success++;
        } else {
          convertedFolderName = 'customerunknown-unknown';
          status = 'failed';
          reason = '이름 변환 후 정리 실패';
          results.failed++;
        }
      } else {
        convertedFolderName = 'customerunknown-unknown';
        status = 'failed';
        reason = `이름 변환 실패 (입력: ${extractedCustomerName}, 출력: ${nameEn || 'empty'})`;
        results.failed++;
      }
    } else {
      // 이름도 추출되지 않은 경우 (날짜만 있는 폴더 등)
      // 날짜 부분을 제거하고 나머지를 사용
      const dateRemoved = originalFolderName.replace(/^\d{4}[.\-]\d{1,2}[.\-]\d{1,2}[.\-]?\s*/, '');
      if (dateRemoved && dateRemoved.length > 0) {
        convertedFolderName = dateRemoved.replace(/[^a-z0-9]/g, '-').toLowerCase() || 'customerunknown-unknown';
      } else {
        convertedFolderName = 'customerunknown-unknown';
      }
      status = 'failed';
      reason = '고객 이름 추출 실패';
      results.failed++;
    }

    // 폴더명이 같으면 스킵
    if (convertedFolderName === originalFolderName) {
      results.skipped++;
      results.folders.push({
        original: originalFolderName,
        converted: convertedFolderName,
        status: 'skipped',
        reason: '변환 불필요'
      });
      continue;
    }

    // 대상 폴더 경로 생성
    const targetYearPath = path.join(TARGET_FOLDER, String(yearFolder.year));
    let finalTargetPath = path.join(targetYearPath, convertedFolderName);

    // 중복 확인 및 처리
    let duplicateIndex = 1;
    while (fs.existsSync(finalTargetPath)) {
      // 중복 시 인덱스 추가
      const nameWithoutExt = convertedFolderName;
      finalTargetPath = path.join(targetYearPath, `${nameWithoutExt}-${duplicateIndex}`);
      duplicateIndex++;
    }
    
    if (duplicateIndex > 1) {
      convertedFolderName = `${convertedFolderName}-${duplicateIndex - 1}`;
      finalTargetPath = path.join(targetYearPath, convertedFolderName);
    }

    // 폴더 복사
    if (status === 'success') {
      try {
        // 대상 연도 폴더 생성
        if (!fs.existsSync(targetYearPath)) {
          fs.mkdirSync(targetYearPath, { recursive: true });
        }

        // 폴더 복사 (재귀적)
        copyFolderRecursive(originalPath, finalTargetPath);
        results.success++;
      } catch (error) {
        status = 'failed';
        reason = `폴더 복사 실패: ${error.message}`;
        results.failed++;
      }
    }

    results.folders.push({
      original: originalFolderName,
      converted: convertedFolderName,
      status: status,
      reason: reason,
      customerId: customerId,
      phone: phone
    });

    console.log(`  ${status === 'success' ? '✅' : status === 'skipped' ? '⏭️' : '❌'} ${originalFolderName} → ${convertedFolderName}${reason ? ` (${reason})` : ''}`);
  }

  return results;
}

/**
 * 폴더 재귀적 복사
 */
function copyFolderRecursive(src, dest) {
  if (!fs.existsSync(src)) {
    throw new Error(`소스 폴더가 존재하지 않습니다: ${src}`);
  }

  // 대상 폴더 생성
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }

  const entries = fs.readdirSync(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      copyFolderRecursive(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

/**
 * 보고서 생성
 */
function generateReport(allResults) {
  const report = {
    timestamp: new Date().toISOString(),
    summary: {
      totalFolders: 0,
      success: 0,
      failed: 0,
      skipped: 0
    },
    byYear: {},
    folders: [],
    errors: []
  };

  for (const result of allResults) {
    report.summary.totalFolders += result.folders.length;
    report.summary.success += result.success;
    report.summary.failed += result.failed;
    report.summary.skipped += result.skipped;

    report.byYear[result.year] = {
      total: result.folders.length,
      success: result.success,
      failed: result.failed,
      skipped: result.skipped
    };

    for (const folder of result.folders) {
      report.folders.push({
        ...folder,
        year: result.year
      });

      if (folder.status === 'failed') {
        report.errors.push({
          year: result.year,
          original: folder.original,
          converted: folder.converted,
          reason: folder.reason
        });
      }
    }
  }

  return report;
}

/**
 * 메인 실행 함수
 */
async function main() {
  console.log('🚀 마이그레이션 V3 준비 시작...\n');
  console.log(`📂 소스: ${SOURCE_FOLDER}`);
  console.log(`📂 대상: ${TARGET_FOLDER}\n`);

  // 대상 폴더 생성
  if (!fs.existsSync(TARGET_FOLDER)) {
    fs.mkdirSync(TARGET_FOLDER, { recursive: true });
    console.log(`✅ 대상 폴더 생성: ${TARGET_FOLDER}\n`);
  }

  // 연도 폴더 스캔
  const yearFolders = getYearFolders(SOURCE_FOLDER);
  
  if (yearFolders.length === 0) {
    console.error('❌ 처리할 연도 폴더가 없습니다.');
    process.exit(1);
  }

  console.log(`📊 발견된 연도: ${yearFolders.map(f => f.year).join(', ')}\n`);

  // 각 연도별 처리
  const allResults = [];
  
  for (const yearFolder of yearFolders) {
    const result = await processYearFolder(yearFolder);
    allResults.push(result);
  }

  // 보고서 생성
  const report = generateReport(allResults);

  // 보고서 저장
  const reportDir = path.dirname(REPORT_PATH);
  if (!fs.existsSync(reportDir)) {
    fs.mkdirSync(reportDir, { recursive: true });
  }
  
  fs.writeFileSync(REPORT_PATH, JSON.stringify(report, null, 2), 'utf8');

  // 결과 출력
  console.log('\n' + '='.repeat(60));
  console.log('📊 마이그레이션 V3 준비 완료');
  console.log('='.repeat(60));
  console.log(`총 폴더 수: ${report.summary.totalFolders}`);
  console.log(`✅ 성공: ${report.summary.success}`);
  console.log(`❌ 실패: ${report.summary.failed}`);
  console.log(`⏭️  스킵: ${report.summary.skipped}`);
  console.log('\n연도별 통계:');
  for (const [year, stats] of Object.entries(report.byYear)) {
    console.log(`  ${year}년: 총 ${stats.total}, 성공 ${stats.success}, 실패 ${stats.failed}, 스킵 ${stats.skipped}`);
  }
  console.log(`\n📄 보고서 저장: ${REPORT_PATH}`);
  console.log('='.repeat(60) + '\n');

  if (report.errors.length > 0) {
    console.log('⚠️  오류 상세:');
    report.errors.slice(0, 10).forEach((error, idx) => {
      console.log(`  ${idx + 1}. ${error.year}년 - ${error.original} → ${error.converted}`);
      console.log(`     사유: ${error.reason}`);
    });
    if (report.errors.length > 10) {
      console.log(`  ... 외 ${report.errors.length - 10}개`);
    }
    console.log('');
  }
}

// 실행
main().catch(error => {
  console.error('❌ 오류 발생:', error);
  process.exit(1);
});
