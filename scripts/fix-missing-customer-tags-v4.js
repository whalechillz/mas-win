/**
 * 마이그레이션 누락된 ai_tags 복구 스크립트 (v4)
 * 
 * 문제: file_path에는 있지만 ai_tags가 null이거나 customer-{id} 태그가 없는 이미지들
 * 해결: file_path에서 folder_name 추출하여 customer_id 매핑 후 ai_tags 업데이트
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

async function fixMissingCustomerTags() {
  console.log('🔧 마이그레이션 누락된 ai_tags 복구 시작...\n');
  
  // 1. customers 테이블에서 folder_name -> customer_id 매핑 생성
  console.log('1️⃣ customers 테이블에서 folder_name 매핑 생성...');
  const { data: allCustomers, error: customersError } = await supabase
    .from('customers')
    .select('id, folder_name');
  
  if (customersError) {
    console.error('❌ 고객 조회 오류:', customersError);
    return;
  }
  
  const folderNameToCustomerId = new Map();
  allCustomers?.forEach(c => {
    if (c.folder_name) {
      folderNameToCustomerId.set(c.folder_name, c.id);
    }
  });
  
  console.log(`✅ ${folderNameToCustomerId.size}명의 고객 folder_name 로드\n`);
  
  // 2. file_path에는 있지만 ai_tags가 null이거나 customer-{id}가 없는 이미지 조회
  console.log('2️⃣ file_path에는 있지만 ai_tags가 누락된 이미지 조회...');
  
  // 먼저 모든 customers 폴더 이미지 조회 (limit 없이)
  let allCustomerImages = [];
  let offset = 0;
  const batchSize = 1000;
  
  while (true) {
    const { data: batch, error: batchError } = await supabase
      .from('image_assets')
      .select('id, file_path, ai_tags, cdn_url')
      .ilike('file_path', 'originals/customers/%')
      // 동영상 제외
      .not('file_path', 'ilike', '%.mp4%')
      .not('file_path', 'ilike', '%.mov%')
      .not('file_path', 'ilike', '%.avi%')
      .not('file_path', 'ilike', '%.webm%')
      .not('file_path', 'ilike', '%.mkv%')
      .range(offset, offset + batchSize - 1);
    
    if (batchError) {
      console.error('❌ 이미지 조회 오류:', batchError);
      break;
    }
    
    if (!batch || batch.length === 0) {
      break;
    }
    
    allCustomerImages = [...allCustomerImages, ...batch];
    offset += batchSize;
    
    if (batch.length < batchSize) {
      break;
    }
  }
  
  console.log(`✅ ${allCustomerImages.length}개의 이미지 발견\n`);
  
  // 3. 각 이미지에서 folder_name 추출 및 customer_id 매핑
  console.log('3️⃣ folder_name 추출 및 customer_id 매핑...');
  const imagesToUpdate = [];
  
  allCustomerImages.forEach((img) => {
    const filePath = img.file_path || '';
    const match = filePath.match(/originals\/customers\/([^\/]+)\//);
    
    if (match) {
      const folderName = match[1];
      const customerId = folderNameToCustomerId.get(folderName);
      
      if (customerId) {
        const tags = img.ai_tags || [];
        const customerTag = `customer-${customerId}`;
        
        // ai_tags가 null이거나 빈 배열이거나 customer-{id} 태그가 없으면 추가
        const needsUpdate = 
          !Array.isArray(tags) || 
          tags.length === 0 || 
          !tags.includes(customerTag);
        
        if (needsUpdate) {
          imagesToUpdate.push({
            id: img.id,
            file_path: filePath,
            currentTags: tags,
            customerId,
            customerTag,
            folderName
          });
        }
      }
    }
  });
  
  console.log(`✅ ${imagesToUpdate.length}개의 이미지에 태그 추가 필요\n`);
  
  if (imagesToUpdate.length === 0) {
    console.log('✅ 모든 이미지에 태그가 이미 있습니다.\n');
    return;
  }
  
  // 4. ai_tags 업데이트
  console.log('4️⃣ ai_tags 업데이트 시작...\n');
  let successCount = 0;
  let errorCount = 0;
  
  for (const img of imagesToUpdate) {
    try {
      const currentTags = Array.isArray(img.currentTags) ? img.currentTags : [];
      const newTags = [...currentTags, img.customerTag];
      
      // 중복 제거
      const uniqueTags = [...new Set(newTags)];
      
      const { error: updateError } = await supabase
        .from('image_assets')
        .update({ ai_tags: uniqueTags })
        .eq('id', img.id);
      
      if (updateError) {
        console.error(`❌ [${img.id}] 업데이트 실패:`, updateError.message);
        errorCount++;
      } else {
        successCount++;
        if (successCount % 100 === 0) {
          console.log(`   진행 중: ${successCount}/${imagesToUpdate.length}개 업데이트 완료...`);
        }
      }
    } catch (error) {
      console.error(`❌ [${img.id}] 오류:`, error.message);
      errorCount++;
    }
  }
  
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`✅ 완료: ${successCount}개 성공, ${errorCount}개 실패`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  // 5. 업데이트 후 검증
  console.log('5️⃣ 업데이트 후 검증...');
  const sampleIds = imagesToUpdate.slice(0, 10).map(img => img.id);
  const { data: verifyImages, error: verifyError } = await supabase
    .from('image_assets')
    .select('id, file_path, ai_tags')
    .in('id', sampleIds);
  
  if (!verifyError && verifyImages) {
    console.log(`✅ 검증 샘플 (최대 10개):`);
    verifyImages.forEach((img, idx) => {
      const tags = img.ai_tags || [];
      const customerTags = tags.filter(t => typeof t === 'string' && t.startsWith('customer-'));
      console.log(`   [${idx + 1}] ${img.file_path?.substring(0, 60)}...`);
      console.log(`       태그: ${customerTags.join(', ') || '없음'}`);
    });
    console.log('');
  }
  
  console.log('✅ 복구 완료');
}

fixMissingCustomerTags().catch(console.error);
