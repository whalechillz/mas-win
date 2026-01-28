/**
 * Storage 폴더와 customers 테이블 매칭 스크립트
 * 
 * 목표: Storage의 97개 고객 폴더를 customers 테이블과 정확히 매칭
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const bucketName = 'blog-images';

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Supabase 환경 변수가 설정되지 않았습니다');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function matchStorageFoldersToCustomers() {
  console.log('🔍 Storage 폴더와 customers 테이블 매칭 시작...\n');
  console.log('='.repeat(80));
  
  // 1. Storage에서 고객 폴더 목록 조회
  console.log('\n1️⃣ Storage에서 고객 폴더 목록 조회...');
  const { data: folders, error: foldersError } = await supabase.storage
    .from(bucketName)
    .list('originals/customers', {
      limit: 10000,
      sortBy: { column: 'name', order: 'asc' }
    });
  
  if (foldersError) {
    console.error('❌ 폴더 목록 조회 오류:', foldersError);
    return;
  }
  
  const customerFolders = folders?.filter(f => 
    !f.name.endsWith('.') && 
    f.name !== '.keep.png' &&
    !f.name.startsWith('.')
  ) || [];
  
  console.log(`✅ ${customerFolders.length}개의 고객 폴더 발견\n`);
  
  // 2. customers 테이블에서 folder_name 목록 조회
  console.log('2️⃣ customers 테이블에서 folder_name 목록 조회...');
  const { data: allCustomers, error: customersError } = await supabase
    .from('customers')
    .select('id, name, phone, folder_name')
    .not('folder_name', 'is', null)
    .limit(10000);
  
  if (customersError) {
    console.error('❌ 고객 조회 오류:', customersError);
    return;
  }
  
  const folderNameToCustomer = new Map();
  allCustomers?.forEach(c => {
    if (c.folder_name) {
      folderNameToCustomer.set(c.folder_name, c);
    }
  });
  
  console.log(`✅ ${folderNameToCustomer.size}명의 고객 folder_name 로드\n`);
  
  // 3. 매칭 분석
  console.log('3️⃣ 매칭 분석 시작...\n');
  
  const matched = [];
  const unmatched = [];
  
  for (const folder of customerFolders) {
    const customer = folderNameToCustomer.get(folder.name);
    
    if (customer) {
      matched.push({
        folderName: folder.name,
        customerId: customer.id,
        customerName: customer.name,
        phone: customer.phone
      });
    } else {
      unmatched.push({
        folderName: folder.name
      });
    }
  }
  
  // 4. 결과 출력
  console.log('='.repeat(80));
  console.log('📊 매칭 결과:');
  console.log('='.repeat(80));
  console.log(`   총 Storage 폴더: ${customerFolders.length}개`);
  console.log(`   ✅ 매칭 성공: ${matched.length}개`);
  console.log(`   ⚠️  매칭 실패: ${unmatched.length}개`);
  console.log('='.repeat(80));
  
  // 5. 매칭된 폴더 상세 정보
  if (matched.length > 0) {
    console.log('\n✅ 매칭된 폴더 (최대 20개):');
    matched.slice(0, 20).forEach((m, idx) => {
      console.log(`   [${idx + 1}] ${m.folderName} → ${m.customerName} (ID: ${m.customerId})`);
    });
    if (matched.length > 20) {
      console.log(`   ... 외 ${matched.length - 20}개`);
    }
  }
  
  // 6. 매칭되지 않은 폴더
  if (unmatched.length > 0) {
    console.log('\n⚠️  매칭되지 않은 폴더:');
    unmatched.forEach((u, idx) => {
      console.log(`   [${idx + 1}] ${u.folderName}`);
    });
    
    console.log('\n💡 해결 방법:');
    console.log('   1. 폴더명을 기반으로 customers 테이블에 새 고객 생성');
    console.log('   2. 폴더명을 수정하여 기존 고객과 매칭');
    console.log('   3. 수동으로 customers 테이블의 folder_name 업데이트');
  }
  
  // 7. JSON 파일로 결과 저장
  const fs = require('fs');
  const result = {
    totalFolders: customerFolders.length,
    matched: matched.length,
    unmatched: unmatched.length,
    matchedFolders: matched,
    unmatchedFolders: unmatched,
    timestamp: new Date().toISOString()
  };
  
  fs.writeFileSync(
    'scripts/storage-customers-match-result.json',
    JSON.stringify(result, null, 2),
    'utf-8'
  );
  
  console.log('\n✅ 매칭 결과가 scripts/storage-customers-match-result.json에 저장되었습니다.');
  console.log('\n✅ 작업 완료!');
  
  return { matched, unmatched };
}

matchStorageFoldersToCustomers().catch(console.error);
