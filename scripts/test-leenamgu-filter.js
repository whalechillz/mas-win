/**
 * 이남구 고객이 "이미지가 있는 고객만" 필터에 포함되는지 테스트
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ 환경 변수가 설정되지 않았습니다.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testLeenamguFilter() {
  console.log('🔍 이남구 고객 필터 테스트...\n');

  try {
    // 이남구 고객 정보 조회
    const { data: customers } = await supabase
      .from('customers')
      .select('id, name, folder_name')
      .ilike('name', '%이남구%')
      .limit(1);

    if (!customers || customers.length === 0) {
      console.error('❌ 이남구 고객을 찾을 수 없습니다.');
      return;
    }

    const customer = customers[0];
    const folderName = customer.folder_name;
    const customerId = customer.id;
    
    console.log(`✅ 고객: ${customer.name} (ID: ${customerId}, 폴더: ${folderName})\n`);

    // 1. file_path로 이미지 조회 (이남구 고객만)
    const { data: customerImagesByPath, error: pathError } = await supabase
      .from('image_assets')
      .select('file_path')
      .ilike('file_path', `originals/customers/${folderName}/%`)
      .not('file_path', 'ilike', '%.mp4%')
      .not('file_path', 'ilike', '%.mov%')
      .not('file_path', 'ilike', '%.avi%')
      .not('file_path', 'ilike', '%.webm%')
      .not('file_path', 'ilike', '%.mkv%');

    if (pathError) {
      console.error('❌ 이미지 조회 실패:', pathError);
      return;
    }

    console.log(`📦 전체 이미지: ${customerImagesByPath?.length || 0}개\n`);

    // 2. 고객 폴더명 매핑 생성
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
    
    console.log(`📋 고객 폴더명 매핑:`);
    console.log(`   총 고객 수: ${allCustomers?.length || 0}`);
    console.log(`   매핑된 폴더 수: ${folderNameToCustomerId.size}`);
    console.log(`   이남구 폴더명: ${folderName}`);
    console.log(`   매핑된 고객 ID: ${folderNameToCustomerId.get(folderName) || '없음'}\n`);

    // 3. file_path에서 고객 ID 추출 (필터 로직과 동일)
    const customerIdsFromPath = new Set();
    
    if (customerImagesByPath) {
      customerImagesByPath.forEach((img) => {
        const filePath = img.file_path || '';
        
        // 동영상 확장자 제외
        const videoExtensions = ['.mp4', '.mov', '.avi', '.webm', '.mkv'];
        const isVideo = videoExtensions.some(ext => filePath.toLowerCase().includes(ext));
        if (isVideo) {
          return;
        }
        
        // file_path에서 고객 폴더명 추출 (필터 로직과 동일)
        let match = filePath.match(/originals\/customers\/([^\/]+)\//);
        
        // 패턴 2: file_path가 날짜 폴더로 끝나는 경우
        if (!match) {
          const dateFolderPattern = /\/(\d{4}[.-]\d{2}[.-]\d{2})$/;
          if (dateFolderPattern.test(filePath)) {
            match = filePath.match(/originals\/customers\/([^\/]+)\/\d{4}[.-]\d{2}[.-]\d{2}$/);
          } else {
            match = filePath.match(/originals\/customers\/([^\/]+)$/);
          }
        }
        
        if (match) {
          const matchedFolderName = match[1];
          const matchedCustomerId = folderNameToCustomerId.get(matchedFolderName);
          
          console.log(`🔍 매칭 시도: ${filePath.substring(0, 100)}...`);
          console.log(`   추출된 폴더명: ${matchedFolderName}`);
          console.log(`   매핑된 고객 ID: ${matchedCustomerId}`);
          console.log(`   목표 고객 ID: ${customerId}`);
          
          if (matchedCustomerId === customerId) {
            console.log(`✅ 매칭 성공!`);
            customerIdsFromPath.add(matchedCustomerId);
          } else {
            console.log(`❌ 고객 ID 불일치`);
          }
        } else {
          console.log(`❌ 정규식 매칭 실패: ${filePath.substring(0, 100)}...`);
        }
      });
    }

    console.log(`\n📊 결과:`);
    console.log(`   이남구 고객 ID: ${customerId}`);
    console.log(`   필터에 포함된 고객 ID 수: ${customerIdsFromPath.size}`);
    console.log(`   이남구가 포함됨: ${customerIdsFromPath.has(customerId) ? '✅' : '❌'}\n`);

    // 4. ai_tags에서도 확인
    const { data: allImages, error: imagesError } = await supabase
      .from('image_assets')
      .select('ai_tags, file_path, cdn_url')
      .not('ai_tags', 'is', null);

    const customerIdsFromTags = new Set();
    if (!imagesError && allImages) {
      const videoExtensions = ['.mp4', '.mov', '.avi', '.webm', '.mkv'];
      
      allImages.forEach((img) => {
        const filePath = img.file_path || '';
        const cdnUrl = img.cdn_url || '';
        const isVideo = videoExtensions.some(ext => 
          filePath.toLowerCase().includes(ext) || 
          cdnUrl.toLowerCase().includes(ext)
        );
        if (isVideo) {
          return;
        }
        
        const tags = img.ai_tags || [];
        if (Array.isArray(tags)) {
          tags.forEach((tag) => {
            if (typeof tag === 'string' && tag.startsWith('customer-')) {
              const tagCustomerId = parseInt(tag.replace('customer-', ''), 10);
              if (!isNaN(tagCustomerId) && tagCustomerId === customerId) {
                customerIdsFromTags.add(tagCustomerId);
              }
            }
          });
        }
      });
    }

    console.log(`📊 ai_tags 결과:`);
    console.log(`   이남구가 포함됨: ${customerIdsFromTags.has(customerId) ? '✅' : '❌'}\n`);

    // 5. 최종 결과
    const allCustomerIds = new Set([...customerIdsFromPath, ...customerIdsFromTags]);
    console.log(`✅ 최종 결과: 이남구가 필터에 포함됨: ${allCustomerIds.has(customerId) ? '✅' : '❌'}\n`);

  } catch (error) {
    console.error('❌ 예외 발생:', error);
  }
}

testLeenamguFilter().catch(console.error);
