/**
 * 이남구 고객의 이미지 확인 스크립트
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

async function checkLeenamguImages() {
  console.log('🔍 이남구 고객의 이미지 확인...\n');

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
    const folderName = customer.folder_name || `customer-${String(customer.id).padStart(3, '0')}`;
    const customerTag = `customer-${customer.id}`;
    
    console.log(`✅ 고객: ${customer.name} (ID: ${customer.id}, 폴더: ${folderName})\n`);

    // 1. file_path로 조회
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

    // 2. ai_tags 필터링
    const filteredByTags = (metadataImages || []).filter(img => {
      const tags = Array.isArray(img.ai_tags) ? img.ai_tags : [];
      const hasCustomerTag = tags.includes(customerTag);
      const exactFolderPath = `originals/customers/${folderName}`;
      const isInCustomerFolder = img.file_path?.startsWith(exactFolderPath);
      
      return hasCustomerTag || isInCustomerFolder;
    });

    console.log(`📦 ai_tags/file_path 필터링 후: ${filteredByTags.length}개\n`);

    // 3. 각 이미지 상세 정보 출력
    console.log('📸 이미지 상세 정보:\n');
    filteredByTags.forEach((img, index) => {
      console.log(`${index + 1}. ${img.filename || '파일명 없음'}`);
      console.log(`   ID: ${img.id}`);
      console.log(`   file_path: ${img.file_path || '없음'}`);
      console.log(`   cdn_url: ${img.cdn_url ? img.cdn_url.substring(0, 100) + '...' : '없음'}`);
      console.log(`   ai_tags: ${JSON.stringify(img.ai_tags || [])}`);
      console.log(`   customer-${customer.id} 태그: ${Array.isArray(img.ai_tags) && img.ai_tags.includes(customerTag) ? '✅' : '❌'}`);
      
      // file_path에 파일명이 있는지 확인
      if (img.file_path) {
        const pathParts = img.file_path.split('/');
        const lastPart = pathParts[pathParts.length - 1];
        const isDateFolder = /^\d{4}-\d{2}-\d{2}$/.test(lastPart);
        const hasFilename = !isDateFolder && lastPart.includes('.');
        console.log(`   file_path에 파일명: ${hasFilename ? '✅' : '❌'}`);
        
        if (!hasFilename && img.filename) {
          const correctedPath = `${img.file_path}/${img.filename}`;
          console.log(`   수정된 file_path: ${correctedPath.substring(0, 100)}...`);
          
          // URL 생성 테스트
          const { data: { publicUrl } } = supabase.storage
            .from('blog-images')
            .getPublicUrl(correctedPath);
          console.log(`   생성된 URL: ${publicUrl.substring(0, 100)}...`);
        }
      }
      console.log('');
    });

    // 4. Storage에서 실제 파일 확인
    console.log('📁 Storage 실제 파일 확인:\n');
    const { data: storageFiles, error: storageError } = await supabase.storage
      .from('blog-images')
      .list(`originals/customers/${folderName}`, {
        limit: 1000,
        sortBy: { column: 'name', order: 'asc' }
      });

    if (storageError) {
      console.error('❌ Storage 조회 실패:', storageError);
    } else {
      console.log(`✅ Storage 파일: ${storageFiles?.length || 0}개\n`);
      
      // 하위 폴더 재귀 탐색
      const allFiles = [];
      const traverseFolder = async (path) => {
        const { data: files } = await supabase.storage
          .from('blog-images')
          .list(path, { limit: 1000 });
        
        if (files) {
          for (const file of files) {
            if (file.name.endsWith('/')) {
              await traverseFolder(`${path}/${file.name.slice(0, -1)}`);
            } else {
              allFiles.push(`${path}/${file.name}`);
            }
          }
        }
      };
      
      await traverseFolder(`originals/customers/${folderName}`);
      console.log(`✅ Storage 전체 파일: ${allFiles.length}개\n`);
      
      if (allFiles.length > 0) {
        console.log('📋 파일 목록 (처음 10개):\n');
        allFiles.slice(0, 10).forEach((file, index) => {
          console.log(`   ${index + 1}. ${file}`);
        });
      }
    }

  } catch (error) {
    console.error('❌ 예외 발생:', error);
  }
}

checkLeenamguImages().catch(console.error);
