/**
 * 고객 이미지의 ai_tags에 customer-{id} 태그 추가 스크립트
 * 마이그레이션 과정에서 누락된 태그를 복구
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

async function fixCustomerImageTags() {
  console.log('🔧 고객 이미지 ai_tags 복구 시작...\n');
  
  // 1. customers 폴더에 있는 모든 이미지 조회
  console.log('1️⃣ customers 폴더의 이미지 조회 중...');
  const { data: customerImages, error: imagesError } = await supabase
    .from('image_assets')
    .select('id, cdn_url, ai_tags, file_path')
    .ilike('file_path', 'originals/customers/%')
    .limit(10000);
  
  if (imagesError) {
    console.error('❌ 이미지 조회 오류:', imagesError);
    return;
  }
  
  console.log(`✅ ${customerImages?.length || 0}개의 고객 이미지 발견\n`);
  
  if (!customerImages || customerImages.length === 0) {
    console.log('⚠️ 고객 이미지가 없습니다.');
    return;
  }
  
  // 2. file_path에서 고객 폴더명 추출 및 customer_id 매핑
  console.log('2️⃣ file_path에서 고객 정보 추출 중...');
  const customerFolderMap = new Map(); // folder_name -> customer_id
  
  // 모든 고객 정보 조회
  const { data: allCustomers, error: customersError } = await supabase
    .from('customers')
    .select('id, folder_name');
  
  if (!customersError && allCustomers) {
    allCustomers.forEach(customer => {
      if (customer.folder_name) {
        customerFolderMap.set(customer.folder_name, customer.id);
      }
    });
    console.log(`✅ ${customerFolderMap.size}명의 고객 정보 로드 완료\n`);
  }
  
  // 3. 각 이미지의 file_path에서 고객 폴더명 추출
  const imagesToUpdate = [];
  
  customerImages.forEach(img => {
    const filePath = img.file_path || '';
    // originals/customers/{folder_name}/... 형식에서 folder_name 추출
    const match = filePath.match(/originals\/customers\/([^\/]+)\//);
    if (match) {
      const folderName = match[1];
      const customerId = customerFolderMap.get(folderName);
      
      if (customerId) {
        const currentTags = img.ai_tags || [];
        const customerTag = `customer-${customerId}`;
        
        // customer 태그가 없으면 추가
        if (!Array.isArray(currentTags) || !currentTags.includes(customerTag)) {
          const newTags = Array.isArray(currentTags) 
            ? [...currentTags, customerTag]
            : [customerTag];
          
          imagesToUpdate.push({
            id: img.id,
            customerId: customerId,
            folderName: folderName,
            currentTags: currentTags,
            newTags: newTags,
            filePath: filePath
          });
        }
      }
    }
  });
  
  console.log(`📋 업데이트 대상: ${imagesToUpdate.length}개 이미지\n`);
  
  if (imagesToUpdate.length === 0) {
    console.log('✅ 모든 이미지에 customer 태그가 이미 있습니다.');
    return;
  }
  
  // 4. 배치로 업데이트 (100개씩)
  console.log('3️⃣ ai_tags 업데이트 중...');
  const batchSize = 100;
  let updatedCount = 0;
  let errorCount = 0;
  
  for (let i = 0; i < imagesToUpdate.length; i += batchSize) {
    const batch = imagesToUpdate.slice(i, i + batchSize);
    
    for (const item of batch) {
      try {
        const { error: updateError } = await supabase
          .from('image_assets')
          .update({ ai_tags: item.newTags })
          .eq('id', item.id);
        
        if (updateError) {
          console.error(`❌ 업데이트 실패 (ID: ${item.id}):`, updateError.message);
          errorCount++;
        } else {
          updatedCount++;
          if (updatedCount % 50 === 0) {
            console.log(`   진행 중: ${updatedCount}/${imagesToUpdate.length}개 업데이트 완료...`);
          }
        }
      } catch (error) {
        console.error(`❌ 업데이트 오류 (ID: ${item.id}):`, error.message);
        errorCount++;
      }
    }
  }
  
  console.log(`\n✅ 업데이트 완료:`);
  console.log(`   - 성공: ${updatedCount}개`);
  console.log(`   - 실패: ${errorCount}개`);
  
  // 5. 검증: 김종철 고객 이미지 확인
  console.log(`\n4️⃣ 검증: 김종철 고객 이미지 확인...`);
  const { data: kimjongchulCustomer } = await supabase
    .from('customers')
    .select('id, name, folder_name')
    .ilike('name', '%김종철%')
    .limit(1)
    .single();
  
  if (kimjongchulCustomer) {
    const customerId = kimjongchulCustomer.id;
    const { data: verifiedImages, error: verifyError } = await supabase
      .from('image_assets')
      .select('id, cdn_url, ai_tags, file_path')
      .or(`ai_tags.cs.{customer-${customerId}},file_path.ilike.%customers/${kimjongchulCustomer.folder_name}%`)
      .limit(10);
    
    if (!verifyError && verifiedImages) {
      console.log(`✅ 김종철 고객 이미지: ${verifiedImages.length}개 발견`);
      verifiedImages.forEach((img, idx) => {
        console.log(`   [${idx + 1}] ID: ${img.id}`);
        console.log(`       ai_tags: ${JSON.stringify(img.ai_tags)}`);
      });
    } else {
      console.log(`⚠️ 검증 오류:`, verifyError?.message);
    }
  }
  
  console.log('\n✅ 작업 완료');
}

fixCustomerImageTags().catch(console.error);
