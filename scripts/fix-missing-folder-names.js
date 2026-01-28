/**
 * folder_name이 없는 고객 확인 및 수정 스크립트
 * 
 * 문제: Storage에는 고객 폴더가 있지만 customers 테이블에 folder_name이 없는 경우
 * 해결: folder_name을 생성하여 customers 테이블에 업데이트
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

// folder_name 생성 함수 (간단한 버전)
function generateCustomerFolderName({ name, phone, customerId }) {
  // 영문 이름 변환 (간단한 버전)
  const { translateKoreanToEnglish } = require('../lib/korean-to-english-translator');
  const nameEn = translateKoreanToEnglish(name).toLowerCase().replace(/[^a-z0-9]/g, '');
  
  if (phone) {
    const phoneLast4 = phone.replace(/-/g, '').slice(-4);
    return `${nameEn}-${phoneLast4}`;
  } else if (customerId) {
    return `${nameEn}-${String(customerId).padStart(4, '0')}`;
  } else {
    return `${nameEn}-unknown`;
  }
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const bucketName = 'blog-images';

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Supabase 환경 변수가 설정되지 않았습니다');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fixMissingFolderNames() {
  console.log('🔧 folder_name이 없는 고객 확인 및 수정 시작...\n');
  
  // 1. Storage에서 고객 폴더 목록 조회
  console.log('1️⃣ Storage에서 고객 폴더 목록 조회...');
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
  
  const customerFolders = folders?.filter(f => !f.name.endsWith('.') && f.name !== '.keep.png') || [];
  console.log(`✅ ${customerFolders.length}개의 고객 폴더 발견\n`);
  
  // 2. customers 테이블에서 folder_name이 없는 고객 확인
  console.log('2️⃣ customers 테이블에서 folder_name이 없는 고객 확인...');
  const { data: customersWithoutFolder, error: customersError } = await supabase
    .from('customers')
    .select('id, name, phone, folder_name')
    .is('folder_name', null)
    .limit(1000);
  
  if (customersError) {
    console.error('❌ 고객 조회 오류:', customersError);
    return;
  }
  
  console.log(`✅ folder_name이 없는 고객: ${customersWithoutFolder?.length || 0}명\n`);
  
  // 3. folder_name 생성 및 업데이트
  console.log('3️⃣ folder_name 생성 및 업데이트 시작...\n');
  
  let updatedCount = 0;
  let errorCount = 0;
  
  for (const customer of customersWithoutFolder || []) {
    try {
      // folder_name 생성
      const folderName = generateCustomerFolderName({
        name: customer.name,
        phone: customer.phone || null,
        customerId: customer.id
      });
      
      // 업데이트
      const { error: updateError } = await supabase
        .from('customers')
        .update({ folder_name: folderName })
        .eq('id', customer.id);
      
      if (updateError) {
        console.error(`❌ [${customer.name}] 업데이트 실패:`, updateError.message);
        errorCount++;
      } else {
        console.log(`✅ [${customer.name}] folder_name 생성: ${folderName}`);
        updatedCount++;
      }
    } catch (error) {
      console.error(`❌ [${customer.name}] 오류:`, error.message);
      errorCount++;
    }
  }
  
  console.log('\n' + '='.repeat(80));
  console.log('📊 최종 통계:');
  console.log('='.repeat(80));
  console.log(`   총 folder_name 없는 고객: ${customersWithoutFolder?.length || 0}명`);
  console.log(`   업데이트 완료: ${updatedCount}명`);
  console.log(`   오류: ${errorCount}명`);
  console.log('='.repeat(80));
  
  // 4. Storage 폴더와 매칭되지 않는 고객 확인
  console.log('\n4️⃣ Storage 폴더와 매칭되지 않는 고객 확인...');
  const { data: allCustomers, error: allCustomersError } = await supabase
    .from('customers')
    .select('id, name, folder_name')
    .limit(1000);
  
  if (!allCustomersError && allCustomers) {
    const folderNameSet = new Set(customerFolders.map(f => f.name));
    const unmatchedFolders = customerFolders.filter(f => {
      return !Array.from(allCustomers || []).some(c => c.folder_name === f.name);
    });
    
    console.log(`⚠️ Storage에 있지만 customers 테이블에 매칭되지 않는 폴더: ${unmatchedFolders.length}개`);
    if (unmatchedFolders.length > 0) {
      console.log(`\n   📋 매칭되지 않는 폴더 (최대 20개):`);
      unmatchedFolders.slice(0, 20).forEach((f, idx) => {
        console.log(`      [${idx + 1}] ${f.name}`);
      });
      console.log('');
    }
  }
  
  console.log('✅ 작업 완료!');
}

fixMissingFolderNames().catch(console.error);
