/**
 * 고객 이미지 조회 디버깅 스크립트
 * 김종철 고객의 이미지가 왜 안 나오는지 확인
 */

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env.local') });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Supabase 환경 변수가 설정되지 않았습니다');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function debugCustomerImages() {
  console.log('🔍 고객 이미지 조회 디버깅 시작...\n');
  
  // 1. 김종철 고객 정보 조회
  console.log('1️⃣ 김종철 고객 정보 조회...');
  const { data: customer, error: customerError } = await supabase
    .from('customers')
    .select('id, name, folder_name')
    .ilike('name', '%김종철%')
    .limit(5);
  
  if (customerError) {
    console.error('❌ 고객 조회 오류:', customerError);
    return;
  }
  
  if (!customer || customer.length === 0) {
    console.log('⚠️ 김종철 고객을 찾을 수 없습니다.');
    return;
  }
  
  console.log(`✅ ${customer.length}명의 고객 발견:`);
  customer.forEach(c => {
    console.log(`   - ID: ${c.id}, 이름: ${c.name}, 폴더명: ${c.folder_name}`);
  });
  
  const targetCustomer = customer[0];
  const customerId = targetCustomer.id;
  const folderName = targetCustomer.folder_name;
  
  console.log(`\n📋 대상 고객: ID=${customerId}, 폴더명=${folderName}\n`);
  
  // 2. image_assets에서 ai_tags로 조회
  console.log('2️⃣ image_assets에서 ai_tags로 조회...');
  const { data: imagesByTags, error: tagsError } = await supabase
    .from('image_assets')
    .select('id, cdn_url, ai_tags, file_path')
    .contains('ai_tags', [`customer-${customerId}`])
    .limit(10);
  
  if (tagsError) {
    console.error('❌ ai_tags 조회 오류:', tagsError);
  } else {
    console.log(`✅ ai_tags로 찾은 이미지: ${imagesByTags?.length || 0}개`);
    if (imagesByTags && imagesByTags.length > 0) {
      imagesByTags.forEach((img, idx) => {
        console.log(`   [${idx + 1}] ID: ${img.id}`);
        console.log(`       cdn_url: ${img.cdn_url?.substring(0, 80)}...`);
        console.log(`       ai_tags: ${JSON.stringify(img.ai_tags)}`);
        console.log(`       file_path: ${img.file_path?.substring(0, 80)}...`);
      });
    }
  }
  
  // 3. file_path로 조회 (folder_name이 있는 경우)
  if (folderName) {
    console.log(`\n3️⃣ file_path로 조회 (${folderName})...`);
    const { data: imagesByPath, error: pathError } = await supabase
      .from('image_assets')
      .select('id, cdn_url, ai_tags, file_path')
      .ilike('file_path', `%customers/${folderName}%`)
      .limit(10);
    
    if (pathError) {
      console.error('❌ file_path 조회 오류:', pathError);
    } else {
      console.log(`✅ file_path로 찾은 이미지: ${imagesByPath?.length || 0}개`);
      if (imagesByPath && imagesByPath.length > 0) {
        imagesByPath.forEach((img, idx) => {
          console.log(`   [${idx + 1}] ID: ${img.id}`);
          console.log(`       cdn_url: ${img.cdn_url?.substring(0, 80)}...`);
          console.log(`       ai_tags: ${JSON.stringify(img.ai_tags)}`);
          console.log(`       file_path: ${img.file_path?.substring(0, 80)}...`);
        });
      }
    }
  }
  
  // 4. ai_tags와 file_path 모두 사용하여 조회
  console.log(`\n4️⃣ ai_tags AND file_path로 조회...`);
  let combinedQuery = supabase
    .from('image_assets')
    .select('id, cdn_url, ai_tags, file_path')
    .contains('ai_tags', [`customer-${customerId}`]);
  
  if (folderName) {
    combinedQuery = combinedQuery.ilike('file_path', `%customers/${folderName}%`);
  }
  
  const { data: combinedImages, error: combinedError } = await combinedQuery.limit(10);
  
  if (combinedError) {
    console.error('❌ 조합 조회 오류:', combinedError);
  } else {
    console.log(`✅ 조합 조회로 찾은 이미지: ${combinedImages?.length || 0}개`);
    if (combinedImages && combinedImages.length > 0) {
      combinedImages.forEach((img, idx) => {
        console.log(`   [${idx + 1}] ID: ${img.id}`);
        console.log(`       cdn_url: ${img.cdn_url?.substring(0, 80)}...`);
        console.log(`       ai_tags: ${JSON.stringify(img.ai_tags)}`);
        console.log(`       file_path: ${img.file_path?.substring(0, 80)}...`);
      });
    }
  }
  
  // 5. Storage에서 실제 파일 확인
  if (folderName) {
    console.log(`\n5️⃣ Storage에서 실제 파일 확인 (${folderName})...`);
    const folderPath = `originals/customers/${folderName}`;
    const { data: storageFiles, error: storageError } = await supabase.storage
      .from('blog-images')
      .list(folderPath, {
        limit: 20,
        sortBy: { column: 'name', order: 'asc' }
      });
    
    if (storageError) {
      console.error('❌ Storage 조회 오류:', storageError);
    } else {
      console.log(`✅ Storage에서 찾은 파일: ${storageFiles?.length || 0}개`);
      if (storageFiles && storageFiles.length > 0) {
        storageFiles.slice(0, 5).forEach((file, idx) => {
          console.log(`   [${idx + 1}] ${file.name}`);
        });
      }
    }
  }
  
  // 6. ai_tags가 NULL이거나 빈 배열인 이미지 확인
  console.log(`\n6️⃣ ai_tags가 NULL이거나 customer 태그가 없는 이미지 확인...`);
  const { data: allCustomerImages, error: allError } = await supabase
    .from('image_assets')
    .select('id, cdn_url, ai_tags, file_path')
    .ilike('file_path', `%customers/${folderName}%`)
    .limit(20);
  
  if (!allError && allCustomerImages) {
    const withoutCustomerTag = allCustomerImages.filter(img => {
      const tags = img.ai_tags || [];
      if (!Array.isArray(tags)) return true;
      return !tags.some(tag => typeof tag === 'string' && tag.startsWith('customer-'));
    });
    
    console.log(`⚠️ customer 태그가 없는 이미지: ${withoutCustomerTag.length}개`);
    if (withoutCustomerTag.length > 0) {
      console.log('   이 이미지들은 ai_tags에 customer-{id} 태그가 없습니다:');
      withoutCustomerTag.slice(0, 5).forEach((img, idx) => {
        console.log(`   [${idx + 1}] ID: ${img.id}`);
        console.log(`       cdn_url: ${img.cdn_url?.substring(0, 80)}...`);
        console.log(`       ai_tags: ${JSON.stringify(img.ai_tags)}`);
      });
    }
  }
  
  console.log('\n✅ 디버깅 완료');
}

debugCustomerImages().catch(console.error);
