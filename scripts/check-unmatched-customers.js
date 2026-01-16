/**
 * 2024년, 2025년 언매칭 고객 확인 스크립트
 * 로컬 폴더의 고객 이름을 추출하고 DB에서 매칭되지 않은 고객 목록을 출력
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const LOCAL_FOLDER = '/Users/m2/MASLABS/00.블로그_고객';

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Supabase 환경 변수가 설정되지 않았습니다.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

/**
 * 한글 정규화 (NFC)
 */
function normalizeKorean(text) {
  if (!text) return '';
  return text.normalize('NFC');
}

/**
 * 로컬 폴더에서 고객 이름 추출
 */
function extractCustomerNamesFromYear(year) {
  const customerNames = new Set();
  const yearFolder = path.join(LOCAL_FOLDER, year);
  
  if (!fs.existsSync(yearFolder)) {
    console.log(`   ⚠️  폴더가 없습니다: ${yearFolder}`);
    return [];
  }
  
  const items = fs.readdirSync(yearFolder);
  console.log(`   📁 폴더 내 항목 수: ${items.length}개`);
  
  for (const item of items) {
    const fullPath = path.join(yearFolder, item);
    
    try {
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        // 연도별 폴더 구조: "YYYY.MM.DD.고객이름" 형식
        // 정규식: 2024.01.05.조영수 또는 2024.01.10 이종수 (공백 포함)
        if (item.startsWith(year + '.')) {
          // 점(.) 또는 공백으로 분리
          const parts = item.split(/[\.\s]+/);
          if (parts.length >= 4) {
            // 마지막 부분이 고객 이름
            const customerName = parts.slice(3).join(' ').trim();
            // "-고객정보없음" 같은 접미사 제거
            const cleanName = customerName.split('-')[0].split('(')[0].trim();
            // 한글 정규화 (NFC)
            const normalizedName = normalizeKorean(cleanName);
            if (/[가-힣]/.test(normalizedName) && normalizedName.length >= 2 && normalizedName.length <= 10) {
              customerNames.add(normalizedName);
            }
          }
        }
      }
    } catch (e) {
      // 무시
    }
  }
  
  return Array.from(customerNames);
}

/**
 * DB에서 고객 매칭 확인
 */
async function checkCustomerMatch(customerName) {
  const normalizedName = normalizeKorean(customerName);
  
  const { data, error } = await supabase
    .from('customers')
    .select('id, name, phone')
    .eq('name', normalizedName)
    .limit(1);
  
  if (error) {
    console.error(`❌ 고객 조회 오류 (${customerName}):`, error);
    return null;
  }
  
  return data && data.length > 0 ? data[0] : null;
}

/**
 * 메인 실행
 */
async function checkUnmatchedCustomers() {
  console.log('='.repeat(60));
  console.log('2024년, 2025년 언매칭 고객 확인');
  console.log('='.repeat(60));
  console.log('');
  
  const results = {
    2024: {
      total: 0,
      matched: [],
      unmatched: []
    },
    2025: {
      total: 0,
      matched: [],
      unmatched: []
    }
  };
  
  // 2024년 확인
  console.log('📂 2024년 고객 확인 중...');
  const customers2024 = extractCustomerNamesFromYear('2024');
  results[2024].total = customers2024.length;
  console.log(`   발견된 고객: ${customers2024.length}명\n`);
  
  for (const customerName of customers2024) {
    const matched = await checkCustomerMatch(customerName);
    if (matched) {
      results[2024].matched.push({
        name: customerName,
        id: matched.id,
        phone: matched.phone
      });
    } else {
      results[2024].unmatched.push({
        name: customerName,
        folder: `2024.*.*.${customerName}`
      });
    }
  }
  
  // 2025년 확인
  console.log('📂 2025년 고객 확인 중...');
  const customers2025 = extractCustomerNamesFromYear('2025');
  results[2025].total = customers2025.length;
  console.log(`   발견된 고객: ${customers2025.length}명\n`);
  
  for (const customerName of customers2025) {
    const matched = await checkCustomerMatch(customerName);
    if (matched) {
      results[2025].matched.push({
        name: customerName,
        id: matched.id,
        phone: matched.phone
      });
    } else {
      results[2025].unmatched.push({
        name: customerName,
        folder: `2025.*.*.${customerName}`
      });
    }
  }
  
  // 결과 출력
  console.log('='.repeat(60));
  console.log('📊 결과 요약');
  console.log('='.repeat(60));
  console.log('');
  
  console.log('📅 2024년:');
  console.log(`   총 고객: ${results[2024].total}명`);
  console.log(`   매칭됨: ${results[2024].matched.length}명`);
  console.log(`   언매칭: ${results[2024].unmatched.length}명`);
  
  if (results[2024].unmatched.length > 0) {
    console.log('\n   ⚠️  언매칭 고객 목록:');
    results[2024].unmatched.forEach((c, idx) => {
      console.log(`   ${idx + 1}. ${c.name}`);
    });
  }
  
  console.log('\n📅 2025년:');
  console.log(`   총 고객: ${results[2025].total}명`);
  console.log(`   매칭됨: ${results[2025].matched.length}명`);
  console.log(`   언매칭: ${results[2025].unmatched.length}명`);
  
  if (results[2025].unmatched.length > 0) {
    console.log('\n   ⚠️  언매칭 고객 목록:');
    results[2025].unmatched.forEach((c, idx) => {
      console.log(`   ${idx + 1}. ${c.name}`);
    });
  }
  
  // 결과를 JSON 파일로 저장
  const outputDir = path.join(process.cwd(), 'migrated');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  const outputPath = path.join(outputDir, 'unmatched-customers-2024-2025.json');
  fs.writeFileSync(outputPath, JSON.stringify(results, null, 2), 'utf-8');
  console.log(`\n✅ 결과가 저장되었습니다: ${outputPath}`);
  
  return results;
}

if (require.main === module) {
  checkUnmatchedCustomers().catch(console.error);
}

module.exports = { checkUnmatchedCustomers };
