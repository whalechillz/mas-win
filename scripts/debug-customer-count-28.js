/**
 * 이미지 있는 고객이 28명만 나오는 원인 확인 스크립트
 * 
 * 문제: "이미지 있는 고객만" 필터를 체크했는데 28명만 표시됨
 * 예상: 92명 + 몇 명 더 있어야 함
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

async function debugCustomerCount28() {
  console.log('🔍 이미지 있는 고객이 28명만 나오는 원인 확인 시작...\n');
  
  // 1. file_path로 고객 ID 추출
  console.log('1️⃣ file_path로 고객 ID 추출...');
  const { data: customerImagesByPath, error: pathError } = await supabase
    .from('image_assets')
    .select('file_path')
    .ilike('file_path', 'originals/customers/%');
  
  const customerIdsFromPath = new Set();
  if (!pathError && customerImagesByPath) {
    // 모든 고객 정보 조회
    const { data: allCustomers } = await supabase
      .from('customers')
      .select('id, folder_name');
    
    const folderNameToCustomerId = new Map();
    if (allCustomers) {
      allCustomers.forEach(c => {
        if (c.folder_name) {
          folderNameToCustomerId.set(c.folder_name, c.id);
        }
      });
    }
    
    console.log(`   ✅ ${folderNameToCustomerId.size}명의 고객 folder_name 로드`);
    
    // file_path에서 고객 폴더명 추출
    customerImagesByPath.forEach((img) => {
      const filePath = img.file_path || '';
      const match = filePath.match(/originals\/customers\/([^\/]+)\//);
      if (match) {
        const folderName = match[1];
        const customerId = folderNameToCustomerId.get(folderName);
        if (customerId) {
          customerIdsFromPath.add(customerId);
        }
      }
    });
    
    console.log(`   ✅ file_path로 찾은 고객: ${customerIdsFromPath.size}명\n`);
  }
  
  // 2. ai_tags로 고객 ID 추출
  console.log('2️⃣ ai_tags로 고객 ID 추출...');
  const { data: allImages, error: imagesError } = await supabase
    .from('image_assets')
    .select('ai_tags')
    .not('ai_tags', 'is', null);
  
  const customerIdsFromTags = new Set();
  if (!imagesError && allImages && allImages.length > 0) {
    allImages.forEach((img) => {
      const tags = img.ai_tags || img.tags || [];
      if (Array.isArray(tags)) {
        tags.forEach((tag) => {
          if (typeof tag === 'string' && tag.startsWith('customer-')) {
            const customerId = parseInt(tag.replace('customer-', ''), 10);
            if (!isNaN(customerId)) {
              customerIdsFromTags.add(customerId);
            }
          }
        });
      }
    });
    
    console.log(`   ✅ ai_tags로 찾은 고객: ${customerIdsFromTags.size}명\n`);
  }
  
  // 3. 두 방법을 합쳐서 최종 고객 ID 목록 생성
  console.log('3️⃣ 최종 고객 ID 목록 생성...');
  const allCustomerIds = new Set([...customerIdsFromPath, ...customerIdsFromTags]);
  const customerIdArray = Array.from(allCustomerIds);
  
  console.log(`   📊 통계:`);
  console.log(`      - file_path로 찾은 고객: ${customerIdsFromPath.size}명`);
  console.log(`      - ai_tags로 찾은 고객: ${customerIdsFromTags.size}명`);
  console.log(`      - 최종 고객 수: ${allCustomerIds.size}명\n`);
  
  // 4. 실제 API 호출 시뮬레이션
  console.log('4️⃣ 실제 API 호출 시뮬레이션...');
  
  // customers 테이블에서 해당 ID들로 조회
  if (customerIdArray.length > 0) {
    const { data: customersWithImages, error: customersError } = await supabase
      .from('customers')
      .select('id, name, folder_name', { count: 'exact' })
      .in('id', customerIdArray);
    
    if (customersError) {
      console.error('❌ 고객 조회 오류:', customersError);
    } else {
      console.log(`   ✅ 실제 이미지 있는 고객 수: ${customersWithImages?.length || 0}명`);
      console.log(`   📊 count: ${customersWithImages?.length || 0}명\n`);
      
      // folder_name이 있는 고객과 없는 고객 분리
      const withFolderName = customersWithImages?.filter(c => c.folder_name) || [];
      const withoutFolderName = customersWithImages?.filter(c => !c.folder_name) || [];
      
      console.log(`   📋 세부 통계:`);
      console.log(`      - folder_name 있음: ${withFolderName.length}명`);
      console.log(`      - folder_name 없음: ${withoutFolderName.length}명\n`);
      
      if (withoutFolderName.length > 0) {
        console.log('   ⚠️ folder_name이 없는 고객 (최대 10명):');
        withoutFolderName.slice(0, 10).forEach((c, idx) => {
          console.log(`      [${idx + 1}] ${c.name} (ID: ${c.id})`);
        });
        console.log('');
      }
    }
  }
  
  // 5. 28명이 나오는 원인 추적
  console.log('5️⃣ 28명이 나오는 원인 추적...');
  
  // folder_name이 있는 고객만 필터링
  const customersWithFolderName = Array.from(customerIdsFromPath).filter(customerId => {
    // 실제로 folder_name이 있는지 확인
    // (이미 위에서 확인했지만 다시 확인)
    return true; // 일단 모든 ID 포함
  });
  
  // customers 테이블에서 folder_name이 있는 고객만 조회
  if (customerIdArray.length > 0) {
    const { data: allCustomersData } = await supabase
      .from('customers')
      .select('id, name, folder_name')
      .in('id', customerIdArray);
    
    const customersWithFolder = allCustomersData?.filter(c => c.folder_name) || [];
    const customersWithoutFolder = allCustomersData?.filter(c => !c.folder_name) || [];
    
    console.log(`   📊 folder_name 기준:`);
    console.log(`      - folder_name 있음: ${customersWithFolder.length}명`);
    console.log(`      - folder_name 없음: ${customersWithoutFolder.length}명`);
    
    // folder_name이 있는 고객만으로 다시 썸네일 조회 시뮬레이션
    console.log(`\n   🔍 folder_name이 있는 고객만 썸네일 조회 시뮬레이션...`);
    
    let thumbnailCount = 0;
    for (const customer of customersWithFolder.slice(0, 50)) {
      const folderName = customer.folder_name;
      if (!folderName) continue;
      
      const { data: images } = await supabase
        .from('image_assets')
        .select('cdn_url, file_path')
        .ilike('file_path', `originals/customers/${folderName}/%`)
        .not('file_path', 'ilike', '%.mp4%')
        .not('file_path', 'ilike', '%.mov%')
        .not('file_path', 'ilike', '%.avi%')
        .not('file_path', 'ilike', '%.webm%')
        .not('file_path', 'ilike', '%.mkv%')
        .not('cdn_url', 'ilike', '%.mp4%')
        .not('cdn_url', 'ilike', '%.mov%')
        .not('cdn_url', 'ilike', '%.avi%')
        .not('cdn_url', 'ilike', '%.webm%')
        .not('cdn_url', 'ilike', '%.mkv%')
        .order('created_at', { ascending: false })
        .limit(1);
      
      if (images && images.length > 0 && images[0].cdn_url) {
        thumbnailCount++;
      }
    }
    
    console.log(`      ✅ 썸네일이 있는 고객: ${thumbnailCount}명 (샘플 50명 중)`);
    console.log(`      ⚠️ 전체로 확장하면 약 ${Math.round(thumbnailCount * customersWithFolder.length / 50)}명 예상\n`);
  }
  
  // 6. 원인 분석
  console.log('🔍 원인 분석:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  if (customerIdArray.length > 28) {
    console.log(`❌ 문제 발견: 실제 이미지 있는 고객은 ${customerIdArray.length}명인데 28명만 표시됨`);
    console.log(`   ⚠️ 가능한 원인:`);
    console.log(`      1. folder_name이 없는 고객이 제외됨 (${withoutFolderName?.length || 0}명)`);
    console.log(`      2. cdn_url이 NULL인 이미지만 있는 고객이 제외됨`);
    console.log(`      3. 썸네일 조회 로직에서 일부 고객이 누락됨`);
  } else if (customerIdArray.length === 28) {
    console.log(`✅ 실제 이미지 있는 고객이 28명으로 확인됨`);
    console.log(`   ⚠️ 사용자가 예상한 92명 + 몇 명과 차이가 있음`);
    console.log(`   ⚠️ 가능한 원인:`);
    console.log(`      1. 이미지가 있는 고객의 정의가 다름 (썸네일 vs 전체 이미지)`);
    console.log(`      2. folder_name이 없는 고객이 제외됨`);
    console.log(`      3. cdn_url이 NULL인 이미지만 있는 고객이 제외됨`);
  }
  
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  console.log('✅ 확인 완료');
}

debugCustomerCount28().catch(console.error);
