/**
 * 폴더명 기반으로 유사 고객 찾기
 * 
 * 목표: 매칭되지 않은 55개 폴더명을 기반으로 customers 테이블에서 유사한 고객 찾기
 * 
 * 방법:
 * 1. 폴더명에서 이름 부분 추출 (예: "kimjongchull-6654" → "kimjongchull")
 * 2. customers 테이블에서 이름을 영문으로 변환하여 비교
 * 3. 유사도가 높은 고객 제안
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Supabase 환경 변수가 설정되지 않았습니다');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// 한글 이름을 영문으로 변환하는 함수 (간단한 버전)
function translateKoreanToEnglish(name) {
  const { translateKoreanToEnglish } = require('../lib/korean-to-english-translator');
  return translateKoreanToEnglish(name);
}

// 문자열 유사도 계산 (Levenshtein distance 기반)
function similarity(str1, str2) {
  const longer = str1.length > str2.length ? str1 : str2;
  const shorter = str1.length > str2.length ? str2 : str1;
  
  if (longer.length === 0) return 1.0;
  
  const distance = levenshteinDistance(longer, shorter);
  return (longer.length - distance) / longer.length;
}

// Levenshtein distance 계산
function levenshteinDistance(str1, str2) {
  const matrix = [];
  
  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }
  
  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }
  
  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  
  return matrix[str2.length][str1.length];
}

// 폴더명에서 이름 부분 추출
function extractNameFromFolderName(folderName) {
  // 형식: {영문이름}-{전화번호마지막4자리}
  // 예: "kimjongchull-6654" → "kimjongchull"
  const parts = folderName.split('-');
  if (parts.length >= 2) {
    // 마지막 부분이 숫자 4자리인지 확인
    const lastPart = parts[parts.length - 1];
    if (/^\d{4}$/.test(lastPart)) {
      // 마지막 부분을 제외한 나머지를 이름으로 간주
      return parts.slice(0, -1).join('-');
    }
  }
  // 숫자가 아니면 전체를 이름으로 간주
  return folderName;
}

// 고객 이름을 영문으로 변환하고 정규화
function normalizeCustomerName(name) {
  if (!name) return '';
  
  const nameEn = translateKoreanToEnglish(name);
  // 소문자로 변환하고 특수문자 제거
  return nameEn
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .replace(/-/g, '');
}

async function findSimilarCustomers() {
  console.log('🔍 폴더명 기반으로 유사 고객 찾기 시작...\n');
  console.log('='.repeat(80));
  
  // 1. 매칭되지 않은 폴더 목록 로드
  console.log('\n1️⃣ 매칭되지 않은 폴더 목록 로드...');
  const fs = require('fs');
  let unmatchedFolders = [];
  
  try {
    const matchResult = JSON.parse(
      fs.readFileSync('scripts/storage-customers-match-result.json', 'utf-8')
    );
    unmatchedFolders = matchResult.unmatchedFolders || [];
    console.log(`✅ ${unmatchedFolders.length}개의 매칭되지 않은 폴더 발견\n`);
  } catch (error) {
    console.error('❌ 매칭 결과 파일을 읽을 수 없습니다:', error.message);
    return;
  }
  
  // 2. customers 테이블에서 모든 고객 조회
  console.log('2️⃣ customers 테이블에서 모든 고객 조회...');
  const { data: allCustomers, error: customersError } = await supabase
    .from('customers')
    .select('id, name, phone, folder_name')
    .limit(10000);
  
  if (customersError) {
    console.error('❌ 고객 조회 오류:', customersError);
    return;
  }
  
  console.log(`✅ ${allCustomers?.length || 0}명의 고객 로드\n`);
  
  // 3. 각 고객의 이름을 영문으로 변환하여 인덱스 생성
  console.log('3️⃣ 고객 이름 영문 변환 및 인덱스 생성...');
  const customerIndex = new Map();
  
  for (const customer of allCustomers || []) {
    if (customer.name) {
      const normalizedName = normalizeCustomerName(customer.name);
      if (normalizedName) {
        if (!customerIndex.has(normalizedName)) {
          customerIndex.set(normalizedName, []);
        }
        customerIndex.get(normalizedName).push(customer);
      }
    }
  }
  
  console.log(`✅ ${customerIndex.size}개의 고유한 정규화된 이름 인덱스 생성\n`);
  
  // 4. 각 매칭되지 않은 폴더에 대해 유사 고객 찾기
  console.log('4️⃣ 각 폴더에 대해 유사 고객 찾기 시작...\n');
  
  const results = [];
  
  for (const folder of unmatchedFolders) {
    const folderName = folder.folderName;
    const extractedName = extractNameFromFolderName(folderName);
    const normalizedFolderName = extractedName.toLowerCase().replace(/[^a-z0-9]/g, '');
    
    console.log(`📁 폴더: ${folderName}`);
    console.log(`   추출된 이름: ${extractedName}`);
    console.log(`   정규화된 이름: ${normalizedFolderName}`);
    
    // 정확히 일치하는 고객 찾기
    const exactMatch = customerIndex.get(normalizedFolderName);
    
    if (exactMatch && exactMatch.length > 0) {
      console.log(`   ✅ 정확히 일치하는 고객 발견: ${exactMatch.length}명`);
      exactMatch.forEach(c => {
        console.log(`      - ${c.name} (ID: ${c.id}, 전화: ${c.phone || '없음'})`);
      });
      
      results.push({
        folderName,
        extractedName,
        matchType: 'exact',
        customers: exactMatch.map(c => ({
          id: c.id,
          name: c.name,
          phone: c.phone,
          folder_name: c.folder_name,
          similarity: 1.0
        }))
      });
    } else {
      // 유사도 기반으로 찾기
      const candidates = [];
      
      for (const [normalizedName, customers] of customerIndex.entries()) {
        const sim = similarity(normalizedFolderName, normalizedName);
        
        if (sim >= 0.7) { // 70% 이상 유사도
          customers.forEach(c => {
            candidates.push({
              customer: c,
              similarity: sim,
              normalizedName
            });
          });
        }
      }
      
      // 유사도 순으로 정렬
      candidates.sort((a, b) => b.similarity - a.similarity);
      
      if (candidates.length > 0) {
        console.log(`   🔍 유사한 고객 발견: ${candidates.length}명 (상위 5명)`);
        candidates.slice(0, 5).forEach((c, idx) => {
          console.log(`      [${idx + 1}] ${c.customer.name} (ID: ${c.customer.id}, 유사도: ${(c.similarity * 100).toFixed(1)}%)`);
        });
        
        results.push({
          folderName,
          extractedName,
          matchType: 'similar',
          customers: candidates.slice(0, 10).map(c => ({
            id: c.customer.id,
            name: c.customer.name,
            phone: c.customer.phone,
            folder_name: c.customer.folder_name,
            similarity: c.similarity
          }))
        });
      } else {
        console.log(`   ⚠️  유사한 고객을 찾을 수 없음`);
        results.push({
          folderName,
          extractedName,
          matchType: 'no_match',
          customers: []
        });
      }
    }
    
    console.log('');
  }
  
  // 5. 결과 저장
  console.log('='.repeat(80));
  console.log('📊 결과 요약:');
  console.log('='.repeat(80));
  
  const exactMatches = results.filter(r => r.matchType === 'exact').length;
  const similarMatches = results.filter(r => r.matchType === 'similar').length;
  const noMatches = results.filter(r => r.matchType === 'no_match').length;
  
  console.log(`   총 폴더: ${results.length}개`);
  console.log(`   ✅ 정확히 일치: ${exactMatches}개`);
  console.log(`   🔍 유사한 고객 발견: ${similarMatches}개`);
  console.log(`   ⚠️  매칭 없음: ${noMatches}개`);
  console.log('='.repeat(80));
  
  // JSON 파일로 결과 저장
  const output = {
    totalFolders: results.length,
    exactMatches,
    similarMatches,
    noMatches,
    results,
    timestamp: new Date().toISOString()
  };
  
  fs.writeFileSync(
    'scripts/similar-customers-match-result.json',
    JSON.stringify(output, null, 2),
    'utf-8'
  );
  
  console.log('\n✅ 결과가 scripts/similar-customers-match-result.json에 저장되었습니다.');
  
  // 6. 정확히 일치하는 고객 목록 출력
  if (exactMatches > 0) {
    console.log('\n📋 정확히 일치하는 고객 목록:');
    results
      .filter(r => r.matchType === 'exact')
      .forEach((r, idx) => {
        console.log(`\n[${idx + 1}] 폴더: ${r.folderName}`);
        r.customers.forEach(c => {
          console.log(`   → ${c.name} (ID: ${c.id}, 전화: ${c.phone || '없음'})`);
          if (!c.folder_name) {
            console.log(`      ⚠️  folder_name이 없습니다. 업데이트 필요: UPDATE customers SET folder_name = '${r.folderName}' WHERE id = ${c.id};`);
          }
        });
      });
  }
  
  console.log('\n✅ 작업 완료!');
}

findSimilarCustomers().catch(console.error);
