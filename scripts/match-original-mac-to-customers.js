/**
 * 로컬 맥 폴더와 customers 테이블 매칭
 * 
 * 방법:
 * 1. 로컬 맥의 모든 고객 폴더 스캔
 * 2. 폴더명에서 고객명과 날짜 추출
 * 3. customers 테이블에서 고객명으로 매칭
 * 4. 전화번호가 있으면 전화번호로도 매칭 확인
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const ORIGINAL_MAC_FOLDER = '/Users/m2/MASLABS/00.blog_customers';

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Supabase 환경 변수가 설정되지 않았습니다');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// 한글 이름을 영문으로 변환
function translateKoreanToEnglish(name) {
  const { translateKoreanToEnglish } = require('../lib/korean-to-english-translator');
  return translateKoreanToEnglish(name);
}

// 폴더명에서 고객명과 날짜 추출
function extractInfoFromFolderName(folderName) {
  // 형식: YYYY.MM.DD.고객명 또는 YYYY.MM.DD.고객명-전화번호
  const match = folderName.match(/^(\d{4})\.(\d{2})\.(\d{2})\.(.+)$/);
  
  if (!match) {
    return null;
  }
  
  const [, year, month, day, namePart] = match;
  const date = `${year}-${month}-${day}`;
  
  // 이름 부분에서 전화번호 추출
  const phoneMatch = namePart.match(/-(\d{3}-\d{4}-\d{4})$/);
  let customerName = namePart;
  let phone = null;
  
  if (phoneMatch) {
    customerName = namePart.replace(/-(\d{3}-\d{4}-\d{4})$/, '');
    phone = phoneMatch[1];
  }
  
  return {
    date,
    customerName: customerName.trim(),
    phone
  };
}

// 고객명으로 고객 찾기
async function findCustomerByName(customerName) {
  const { data: customers, error } = await supabase
    .from('customers')
    .select('id, name, phone, folder_name')
    .ilike('name', `%${customerName}%`)
    .limit(10);
  
  if (error) {
    console.warn(`⚠️ 고객 조회 오류:`, error.message);
    return [];
  }
  
  return customers || [];
}

// 전화번호로 고객 찾기
async function findCustomerByPhone(phone) {
  if (!phone) return null;
  
  // 전화번호 정규화 (하이픈 제거)
  const normalizedPhone = phone.replace(/-/g, '').replace(/\s/g, '');
  
  const { data: customers, error } = await supabase
    .from('customers')
    .select('id, name, phone, folder_name')
    .limit(10000);
  
  if (error) {
    console.warn(`⚠️ 고객 조회 오류:`, error.message);
    return null;
  }
  
  // 전화번호가 일치하는 고객 찾기
  const matches = (customers || []).filter(c => {
    if (!c.phone) return false;
    const customerPhone = c.phone.replace(/-/g, '').replace(/\s/g, '');
    return customerPhone === normalizedPhone || customerPhone.slice(-4) === normalizedPhone.slice(-4);
  });
  
  if (matches.length === 1) {
    return matches[0];
  } else if (matches.length > 1) {
    // 가장 최근 고객 반환 (ID가 큰 것)
    return matches.sort((a, b) => b.id - a.id)[0];
  }
  
  return null;
}

async function matchOriginalMacToCustomers() {
  console.log('🔍 로컬 맥 폴더와 customers 테이블 매칭 시작...\n');
  console.log('='.repeat(80));
  
  if (!fs.existsSync(ORIGINAL_MAC_FOLDER)) {
    console.error(`❌ 폴더가 존재하지 않습니다: ${ORIGINAL_MAC_FOLDER}`);
    return;
  }
  
  // 연도별 폴더 확인
  const yearFolders = fs.readdirSync(ORIGINAL_MAC_FOLDER)
    .filter(item => {
      const itemPath = path.join(ORIGINAL_MAC_FOLDER, item);
      return fs.statSync(itemPath).isDirectory() && /^\d{4}$/.test(item);
    })
    .sort();
  
  console.log(`✅ 발견된 연도 폴더: ${yearFolders.join(', ')}\n`);
  
  // 모든 고객 폴더 수집
  const allCustomerFolders = [];
  
  for (const year of yearFolders) {
    const yearPath = path.join(ORIGINAL_MAC_FOLDER, year);
    const customerFolders = fs.readdirSync(yearPath)
      .filter(item => {
        const itemPath = path.join(yearPath, item);
        return fs.statSync(itemPath).isDirectory();
      });
    
    for (const folder of customerFolders) {
      const folderPath = path.join(yearPath, folder);
      const info = extractInfoFromFolderName(folder);
      
      if (info) {
        allCustomerFolders.push({
          year,
          folderName: folder,
          folderPath,
          ...info
        });
      }
    }
  }
  
  console.log(`✅ 총 ${allCustomerFolders.length}개의 고객 폴더 발견\n`);
  
  // 각 폴더를 customers 테이블과 매칭
  console.log('2️⃣ customers 테이블과 매칭 시작...\n');
  
  const results = [];
  const stats = {
    total: allCustomerFolders.length,
    matched: 0,
    unmatched: 0,
    matchedByName: 0,
    matchedByPhone: 0
  };
  
  for (let i = 0; i < allCustomerFolders.length; i++) {
    const folder = allCustomerFolders[i];
    
    if ((i + 1) % 20 === 0) {
      console.log(`   진행 상황: ${i + 1}/${allCustomerFolders.length} 처리 중...\n`);
    }
    
    const result = {
      year: folder.year,
      folderName: folder.folderName,
      folderPath: folder.folderPath,
      extractedInfo: {
        date: folder.date,
        customerName: folder.customerName,
        phone: folder.phone
      },
      matches: {
        byName: [],
        byPhone: null
      }
    };
    
    // 전화번호로 먼저 검색
    if (folder.phone) {
      const phoneMatch = await findCustomerByPhone(folder.phone);
      if (phoneMatch) {
        result.matches.byPhone = phoneMatch;
        stats.matchedByPhone++;
      }
    }
    
    // 고객명으로 검색
    const nameMatches = await findCustomerByName(folder.customerName);
    result.matches.byName = nameMatches;
    
    if (nameMatches.length > 0) {
      stats.matchedByName++;
    }
    
    // 최종 매칭 결정
    if (result.matches.byPhone) {
      result.matchedCustomer = result.matches.byPhone;
      result.matchMethod = 'phone';
      stats.matched++;
    } else if (nameMatches.length === 1) {
      result.matchedCustomer = nameMatches[0];
      result.matchMethod = 'name';
      stats.matched++;
    } else if (nameMatches.length > 1) {
      // 여러 고객이 매칭되는 경우, 가장 최근 고객 선택
      result.matchedCustomer = nameMatches.sort((a, b) => b.id - a.id)[0];
      result.matchMethod = 'name_multiple';
      stats.matched++;
    } else {
      result.matchedCustomer = null;
      result.matchMethod = 'none';
      stats.unmatched++;
    }
    
    results.push(result);
  }
  
  // 결과 요약
  console.log('\n' + '='.repeat(80));
  console.log('📊 매칭 결과:');
  console.log('='.repeat(80));
  console.log(`   총 고객 폴더: ${stats.total}개`);
  console.log(`   ✅ 매칭 성공: ${stats.matched}개`);
  console.log(`   ⚠️  매칭 실패: ${stats.unmatched}개`);
  console.log(`   📞 전화번호 매칭: ${stats.matchedByPhone}개`);
  console.log(`   👤 이름 매칭: ${stats.matchedByName}개`);
  console.log('='.repeat(80));
  
  // 매칭된 폴더 상세 정보
  const matchedFolders = results.filter(r => r.matchedCustomer);
  console.log(`\n✅ 매칭된 폴더 (최대 20개):\n`);
  matchedFolders.slice(0, 20).forEach((r, idx) => {
    console.log(`[${idx + 1}] ${r.folderName}`);
    console.log(`   → ${r.matchedCustomer.name} (ID: ${r.matchedCustomer.id}, 전화: ${r.matchedCustomer.phone || '없음'})`);
    console.log(`   매칭 방법: ${r.matchMethod}`);
    if (r.matchedCustomer.folder_name) {
      console.log(`   현재 folder_name: ${r.matchedCustomer.folder_name}`);
    }
    console.log('');
  });
  
  // 매칭되지 않은 폴더
  const unmatchedFolders = results.filter(r => !r.matchedCustomer);
  if (unmatchedFolders.length > 0) {
    console.log(`\n⚠️  매칭되지 않은 폴더 (최대 20개):\n`);
    unmatchedFolders.slice(0, 20).forEach((r, idx) => {
      console.log(`[${idx + 1}] ${r.folderName}`);
      console.log(`   고객명: ${r.extractedInfo.customerName}`);
      console.log(`   전화번호: ${r.extractedInfo.phone || '없음'}`);
      console.log('');
    });
  }
  
  // JSON 파일로 결과 저장
  fs.writeFileSync(
    'scripts/original-mac-customers-match-result.json',
    JSON.stringify({
      total: stats.total,
      matched: stats.matched,
      unmatched: stats.unmatched,
      matchedByPhone: stats.matchedByPhone,
      matchedByName: stats.matchedByName,
      results,
      timestamp: new Date().toISOString()
    }, null, 2),
    'utf-8'
  );
  
  console.log('✅ 결과가 scripts/original-mac-customers-match-result.json에 저장되었습니다.');
  console.log('\n✅ 작업 완료!');
  
  return results;
}

matchOriginalMacToCustomers().catch(console.error);
