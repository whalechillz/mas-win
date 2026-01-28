/**
 * image_metadata에는 있지만 image_assets에는 없는 고객 찾기
 * 
 * 안중철 같은 경우를 모두 찾아서 마이그레이션
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

async function findCustomersWithMetadataButNoAssets() {
  console.log('🚀 image_metadata에는 있지만 image_assets에는 없는 고객 찾기...\n');
  
  // image_metadata에서 고객 ID 추출
  console.log('1️⃣ image_metadata에서 고객 ID 추출...');
  const { data: metadataImages, error: metadataError } = await supabase
    .from('image_metadata')
    .select('customer_id, image_url, folder_path')
    .not('customer_id', 'is', null)
    .limit(10000);
  
  if (metadataError) {
    console.error('❌ image_metadata 조회 오류:', metadataError);
    return;
  }
  
  const customerIdsFromMetadata = new Set();
  (metadataImages || []).forEach(img => {
    if (img.customer_id) {
      customerIdsFromMetadata.add(img.customer_id);
    }
  });
  
  console.log(`✅ image_metadata에서 ${customerIdsFromMetadata.size}명의 고객 발견\n`);
  
  // image_assets에서 고객 ID 추출
  console.log('2️⃣ image_assets에서 고객 ID 추출...');
  const { data: assetImages, error: assetError } = await supabase
    .from('image_assets')
    .select('ai_tags, file_path')
    .not('ai_tags', 'is', null)
    .limit(10000);
  
  if (assetError) {
    console.error('❌ image_assets 조회 오류:', assetError);
    return;
  }
  
  const customerIdsFromAssets = new Set();
  (assetImages || []).forEach(img => {
    const tags = img.ai_tags || [];
    if (Array.isArray(tags)) {
      tags.forEach(tag => {
        if (typeof tag === 'string' && tag.startsWith('customer-')) {
          const customerId = parseInt(tag.replace('customer-', ''), 10);
          if (!isNaN(customerId)) {
            customerIdsFromAssets.add(customerId);
          }
        }
      });
    }
  });
  
  console.log(`✅ image_assets에서 ${customerIdsFromAssets.size}명의 고객 발견\n`);
  
  // 차이 계산: metadata에는 있지만 assets에는 없는 고객
  const missingCustomerIds = Array.from(customerIdsFromMetadata).filter(
    id => !customerIdsFromAssets.has(id)
  );
  
  console.log(`3️⃣ 차이 분석...`);
  console.log(`   image_metadata에만 있는 고객: ${missingCustomerIds.length}명\n`);
  
  if (missingCustomerIds.length === 0) {
    console.log('✅ 모든 고객의 이미지가 image_assets에 있습니다!');
    return;
  }
  
  // 고객 정보 조회
  console.log('4️⃣ 고객 정보 조회...');
  const { data: customers, error: customersError } = await supabase
    .from('customers')
    .select('id, name, phone, folder_name')
    .in('id', missingCustomerIds)
    .limit(1000);
  
  if (customersError) {
    console.error('❌ 고객 조회 오류:', customersError);
    return;
  }
  
  console.log(`✅ ${customers?.length || 0}명의 고객 정보 조회 완료\n`);
  
  // 결과 출력
  console.log('='.repeat(80));
  console.log('📊 결과: image_metadata에는 있지만 image_assets에는 없는 고객');
  console.log('='.repeat(80));
  
  if (customers && customers.length > 0) {
    customers.forEach((customer, idx) => {
      console.log(`${idx + 1}. ${customer.name} (ID: ${customer.id}, 전화: ${customer.phone}, 폴더: ${customer.folder_name || '없음'})`);
    });
    
    // folder_name이 있는 고객만 필터링
    const customersWithFolder = customers.filter(c => c.folder_name);
    console.log(`\n📁 folder_name이 있는 고객: ${customersWithFolder.length}명`);
    
    if (customersWithFolder.length > 0) {
      console.log('\n다음 명령으로 마이그레이션할 수 있습니다:');
      console.log('node scripts/fix-missing-customer-images.js');
    }
  } else {
    console.log('고객 정보를 찾을 수 없습니다.');
  }
  
  console.log('='.repeat(80));
}

findCustomersWithMetadataButNoAssets().catch(console.error);
