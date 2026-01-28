/**
 * 28명 외의 인물 확인 및 마이그레이션 누락 원인 확인 스크립트
 * 
 * 문제: "이미지 있는 고객만" 필터에서 28명만 표시되지만, 실제로는 더 많은 고객이 이미지를 가지고 있을 수 있음
 * 원인: 마이그레이션 과정에서 누락된 정보 또는 필터링 로직 문제
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

async function checkMissingCustomersMigration() {
  console.log('🔍 28명 외의 인물 확인 및 마이그레이션 누락 원인 확인 시작...\n');
  
  // 1. 전체 고객 수 확인
  console.log('1️⃣ 전체 고객 수 확인...');
  const { data: allCustomers, error: allCustomersError } = await supabase
    .from('customers')
    .select('id, name, folder_name', { count: 'exact' });
  
  if (allCustomersError) {
    console.error('❌ 전체 고객 조회 오류:', allCustomersError);
    return;
  }
  
  console.log(`✅ 전체 고객 수: ${allCustomers?.length || 0}명\n`);
  
  // 2. folder_name이 있는 고객 확인
  console.log('2️⃣ folder_name이 있는 고객 확인...');
  const customersWithFolderName = allCustomers?.filter(c => c.folder_name) || [];
  console.log(`✅ folder_name이 있는 고객: ${customersWithFolderName.length}명\n`);
  
  // 3. file_path로 이미지가 있는 고객 확인 (동영상 제외)
  console.log('3️⃣ file_path로 이미지가 있는 고객 확인 (동영상 제외)...');
  const { data: customerImagesByPath, error: pathError } = await supabase
    .from('image_assets')
    .select('file_path')
    .ilike('file_path', 'originals/customers/%')
    // 동영상 확장자 제외
    .not('file_path', 'ilike', '%.mp4%')
    .not('file_path', 'ilike', '%.mov%')
    .not('file_path', 'ilike', '%.avi%')
    .not('file_path', 'ilike', '%.webm%')
    .not('file_path', 'ilike', '%.mkv%');
  
  const customerIdsFromPath = new Set();
  if (!pathError && customerImagesByPath) {
    const folderNameToCustomerId = new Map();
    allCustomers?.forEach(c => {
      if (c.folder_name) {
        folderNameToCustomerId.set(c.folder_name, c.id);
      }
    });
    
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
    
    console.log(`✅ file_path로 찾은 고객: ${customerIdsFromPath.size}명\n`);
  }
  
  // 4. ai_tags로 이미지가 있는 고객 확인 (동영상 제외)
  console.log('4️⃣ ai_tags로 이미지가 있는 고객 확인 (동영상 제외)...');
  const { data: allImages, error: imagesError } = await supabase
    .from('image_assets')
    .select('ai_tags, file_path, cdn_url')
    .not('ai_tags', 'is', null);
  
  const customerIdsFromTags = new Set();
  if (!imagesError && allImages && allImages.length > 0) {
    const videoExtensions = ['.mp4', '.mov', '.avi', '.webm', '.mkv'];
    
    allImages.forEach((img) => {
      // 동영상 파일 제외
      const filePath = img.file_path || '';
      const cdnUrl = img.cdn_url || '';
      const isVideo = videoExtensions.some(ext => 
        filePath.toLowerCase().includes(ext) || 
        cdnUrl.toLowerCase().includes(ext)
      );
      if (isVideo) {
        return; // 동영상은 건너뜀
      }
      
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
    
    console.log(`✅ ai_tags로 찾은 고객: ${customerIdsFromTags.size}명\n`);
  }
  
  // 5. 최종 이미지 있는 고객 목록
  console.log('5️⃣ 최종 이미지 있는 고객 목록 생성...');
  const allCustomerIds = new Set([...customerIdsFromPath, ...customerIdsFromTags]);
  const customerIdArray = Array.from(allCustomerIds);
  
  console.log(`📊 통계:`);
  console.log(`   - file_path로 찾은 고객: ${customerIdsFromPath.size}명`);
  console.log(`   - ai_tags로 찾은 고객: ${customerIdsFromTags.size}명`);
  console.log(`   - 최종 이미지 있는 고객: ${allCustomerIds.size}명\n`);
  
  // 6. 실제 customers 테이블에서 조회
  console.log('6️⃣ 실제 customers 테이블에서 조회...');
  if (customerIdArray.length > 0) {
    const { data: customersWithImages, error: customersError } = await supabase
      .from('customers')
      .select('id, name, folder_name')
      .in('id', customerIdArray);
    
    if (customersError) {
      console.error('❌ 고객 조회 오류:', customersError);
    } else {
      console.log(`✅ 실제 이미지 있는 고객 수: ${customersWithImages?.length || 0}명\n`);
      
      // 7. 28명과의 차이 확인
      const expectedCount = 28;
      const actualCount = customersWithImages?.length || 0;
      
      if (actualCount !== expectedCount) {
        console.log(`⚠️ 차이 발견: 예상 ${expectedCount}명, 실제 ${actualCount}명`);
        console.log(`   차이: ${actualCount - expectedCount}명\n`);
      } else {
        console.log(`✅ 예상과 일치: ${actualCount}명\n`);
      }
      
      // 8. folder_name이 없는 고객 확인
      console.log('7️⃣ folder_name이 없는 고객 확인...');
      const customersWithoutFolder = customersWithImages?.filter(c => !c.folder_name) || [];
      console.log(`   - folder_name 없음: ${customersWithoutFolder.length}명`);
      
      if (customersWithoutFolder.length > 0) {
        console.log(`\n   ⚠️ folder_name이 없는 고객 (최대 10명):`);
        customersWithoutFolder.slice(0, 10).forEach((c, idx) => {
          console.log(`      [${idx + 1}] ${c.name} (ID: ${c.id})`);
        });
        console.log('');
      }
      
      // 9. file_path에는 있지만 ai_tags에는 없는 고객 확인
      console.log('8️⃣ file_path에는 있지만 ai_tags에는 없는 고객 확인...');
      const fromPathOnly = Array.from(customerIdsFromPath).filter(id => !customerIdsFromTags.has(id));
      console.log(`   - file_path만 있음: ${fromPathOnly.length}명`);
      
      if (fromPathOnly.length > 0) {
        const { data: pathOnlyCustomers } = await supabase
          .from('customers')
          .select('id, name, folder_name')
          .in('id', fromPathOnly);
        
        console.log(`\n   ⚠️ ai_tags가 누락된 고객 (최대 10명):`);
        pathOnlyCustomers?.slice(0, 10).forEach((c, idx) => {
          console.log(`      [${idx + 1}] ${c.name} (ID: ${c.id}, folder_name: ${c.folder_name || '없음'})`);
        });
        console.log('');
      }
      
      // 10. ai_tags에는 있지만 file_path에는 없는 고객 확인
      console.log('9️⃣ ai_tags에는 있지만 file_path에는 없는 고객 확인...');
      const fromTagsOnly = Array.from(customerIdsFromTags).filter(id => !customerIdsFromPath.has(id));
      console.log(`   - ai_tags만 있음: ${fromTagsOnly.length}명`);
      
      if (fromTagsOnly.length > 0) {
        const { data: tagsOnlyCustomers } = await supabase
          .from('customers')
          .select('id, name, folder_name')
          .in('id', fromTagsOnly);
        
        console.log(`\n   ⚠️ file_path가 다른 형식인 고객 (최대 10명):`);
        tagsOnlyCustomers?.slice(0, 10).forEach((c, idx) => {
          console.log(`      [${idx + 1}] ${c.name} (ID: ${c.id}, folder_name: ${c.folder_name || '없음'})`);
        });
        console.log('');
      }
      
      // 11. cdn_url이 없는 이미지 확인
      console.log('🔟 cdn_url이 없는 이미지 확인...');
      const { data: imagesWithoutCdnUrl, error: cdnUrlError } = await supabase
        .from('image_assets')
        .select('id, file_path, cdn_url, ai_tags')
        .ilike('file_path', 'originals/customers/%')
        .is('cdn_url', null)
        .limit(50);
      
      if (!cdnUrlError && imagesWithoutCdnUrl) {
        console.log(`   - cdn_url이 NULL인 이미지: ${imagesWithoutCdnUrl.length}개 (샘플 50개)\n`);
        
        if (imagesWithoutCdnUrl.length > 0) {
          console.log(`   ⚠️ cdn_url이 누락된 이미지 (최대 5개):`);
          imagesWithoutCdnUrl.slice(0, 5).forEach((img, idx) => {
            console.log(`      [${idx + 1}] ${img.file_path?.substring(0, 80)}...`);
            console.log(`          ai_tags: ${JSON.stringify(img.ai_tags || [])}`);
          });
          console.log('');
        }
      }
    }
  }
  
  // 12. 원인 분석
  console.log('🔍 원인 분석:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  const expectedCount = 28;
  const actualCount = customerIdArray.length;
  
  if (actualCount > expectedCount) {
    console.log(`❌ 문제 발견: 실제 이미지 있는 고객은 ${actualCount}명인데 ${expectedCount}명만 표시됨`);
    console.log(`   ⚠️ 가능한 원인:`);
    console.log(`      1. folder_name이 없는 고객이 제외됨`);
    console.log(`      2. cdn_url이 NULL인 이미지만 있는 고객이 제외됨`);
    console.log(`      3. 썸네일 조회 로직에서 일부 고객이 누락됨`);
    console.log(`      4. 필터링 로직에서 동영상 제외가 제대로 작동하지 않음`);
  } else if (actualCount === expectedCount) {
    console.log(`✅ 실제 이미지 있는 고객이 ${actualCount}명으로 확인됨`);
    console.log(`   ⚠️ 하지만 사용자가 예상한 수와 다를 수 있음`);
    console.log(`   ⚠️ 가능한 원인:`);
    console.log(`      1. 이미지가 있는 고객의 정의가 다름 (썸네일 vs 전체 이미지)`);
    console.log(`      2. folder_name이 없는 고객이 제외됨`);
    console.log(`      3. cdn_url이 NULL인 이미지만 있는 고객이 제외됨`);
  }
  
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  console.log('✅ 확인 완료');
}

checkMissingCustomersMigration().catch(console.error);
