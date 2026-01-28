/**
 * 안희자 고객의 이미지 조회 및 필터링 확인 스크립트
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

async function checkAhnheejaImages() {
  console.log('🔍 안희자 고객의 이미지 확인...\n');

  try {
    // 안희자 고객 정보 조회
    const { data: customers } = await supabase
      .from('customers')
      .select('id, name, folder_name')
      .ilike('name', '%안희자%')
      .limit(1);

    if (!customers || customers.length === 0) {
      console.error('❌ 안희자 고객을 찾을 수 없습니다.');
      return;
    }

    const customer = customers[0];
    const folderName = customer.folder_name || `customer-${String(customer.id).padStart(3, '0')}`;
    const customerTag = `customer-${customer.id}`;
    
    console.log(`✅ 고객: ${customer.name} (ID: ${customer.id}, 폴더: ${folderName})\n`);

    // 1. file_path로 조회 (고객 이미지 관리 API와 동일한 방식)
    const { data: metadataImages, error: metadataError } = await supabase
      .from('image_assets')
      .select('id, filename, file_path, cdn_url, ai_tags, created_at')
      .ilike('file_path', `originals/customers/${folderName}/%`)
      .order('created_at', { ascending: false });

    if (metadataError) {
      console.error('❌ 메타데이터 조회 실패:', metadataError);
      return;
    }

    console.log(`📦 file_path로 조회된 이미지: ${metadataImages.length}개\n`);

    // 2. ai_tags 필터링 (고객 이미지 관리 API와 동일한 방식)
    const filteredByTags = (metadataImages || []).filter(img => {
      const tags = Array.isArray(img.ai_tags) ? img.ai_tags : [];
      const hasCustomerTag = tags.includes(customerTag);
      const exactFolderPath = `originals/customers/${folderName}`;
      const isInCustomerFolder = img.file_path?.startsWith(exactFolderPath);
      
      return hasCustomerTag || isInCustomerFolder;
    });

    console.log(`📦 ai_tags/file_path 필터링 후: ${filteredByTags.length}개\n`);

    // 3. Storage에서 실제 파일 조회
    const { data: storageFiles, error: storageError } = await supabase.storage
      .from('blog-images')
      .list(`originals/customers/${folderName}`, {
        limit: 1000,
        sortBy: { column: 'name', order: 'asc' }
      });

    if (storageError) {
      console.error('❌ Storage 조회 실패:', storageError);
    } else {
      const allFiles = [];
      const traverseFolder = async (path) => {
        const { data: files } = await supabase.storage
          .from('blog-images')
          .list(path, { limit: 1000 });
        
        if (files) {
          for (const file of files) {
            if (file.name.endsWith('/')) {
              // 폴더인 경우 재귀 탐색
              await traverseFolder(`${path}/${file.name.slice(0, -1)}`);
            } else {
              allFiles.push(`${path}/${file.name}`);
            }
          }
        }
      };
      
      await traverseFolder(`originals/customers/${folderName}`);
      console.log(`📁 Storage 실제 파일: ${allFiles.length}개\n`);
    }

    // 4. 각 이미지 상세 정보 출력
    console.log('📸 이미지 상세 정보:\n');
    filteredByTags.forEach((img, index) => {
      console.log(`${index + 1}. ${img.filename || '파일명 없음'}`);
      console.log(`   ID: ${img.id}`);
      console.log(`   file_path: ${img.file_path || '없음'}`);
      console.log(`   ai_tags: ${JSON.stringify(img.ai_tags || [])}`);
      console.log(`   customer-${customer.id} 태그: ${Array.isArray(img.ai_tags) && img.ai_tags.includes(customerTag) ? '✅' : '❌'}`);
      console.log('');
    });

    // 5. file_path가 없는 이미지 확인
    const withoutFilePath = filteredByTags.filter(img => !img.file_path);
    if (withoutFilePath.length > 0) {
      console.log(`⚠️ file_path가 없는 이미지: ${withoutFilePath.length}개\n`);
      withoutFilePath.forEach(img => {
        console.log(`   - ${img.filename || '파일명 없음'} (ID: ${img.id})`);
      });
    }

    // 6. ai_tags에 customer 태그가 없는 이미지 확인
    const withoutCustomerTag = filteredByTags.filter(img => {
      const tags = Array.isArray(img.ai_tags) ? img.ai_tags : [];
      return !tags.includes(customerTag);
    });
    if (withoutCustomerTag.length > 0) {
      console.log(`\n⚠️ customer-${customer.id} 태그가 없는 이미지: ${withoutCustomerTag.length}개\n`);
      withoutCustomerTag.forEach(img => {
        console.log(`   - ${img.filename || '파일명 없음'} (ID: ${img.id}, file_path: ${img.file_path?.substring(0, 80)})`);
      });
    }

  } catch (error) {
    console.error('❌ 예외 발생:', error);
  }
}

checkAhnheejaImages().catch(console.error);
