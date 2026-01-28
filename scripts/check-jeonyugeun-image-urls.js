/**
 * 전유근 고객의 이미지 URL 확인 스크립트
 * file_path와 실제 생성된 URL 확인
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

async function checkImageUrls() {
  console.log('🔍 전유근 고객의 이미지 URL 확인...\n');

  try {
    // 전유근 고객 정보 조회
    const { data: customers } = await supabase
      .from('customers')
      .select('id, name, folder_name')
      .ilike('name', '%전유근%')
      .limit(1);

    if (!customers || customers.length === 0) {
      console.error('❌ 전유근 고객을 찾을 수 없습니다.');
      return;
    }

    const customer = customers[0];
    const folderName = customer.folder_name || `customer-${String(customer.id).padStart(3, '0')}`;
    console.log(`✅ 고객: ${customer.name} (ID: ${customer.id}, 폴더: ${folderName})\n`);

    // 해당 고객의 이미지 조회
    const { data: images, error: imagesError } = await supabase
      .from('image_assets')
      .select('id, filename, file_path, cdn_url, ai_tags')
      .ilike('file_path', `%customers/${folderName}%`)
      .limit(20);

    if (imagesError) {
      console.error('❌ 이미지 조회 실패:', imagesError);
      return;
    }

    console.log(`✅ 총 ${images.length}개 이미지 발견\n`);

    for (const img of images) {
      console.log(`📸 ${img.filename || '파일명 없음'}`);
      console.log(`   ID: ${img.id}`);
      console.log(`   file_path: ${img.file_path || '없음'}`);
      console.log(`   cdn_url: ${img.cdn_url ? img.cdn_url.substring(0, 100) + '...' : '없음'}`);

      // file_path로부터 URL 생성
      if (img.file_path) {
        const { data: { publicUrl } } = supabase.storage
          .from('blog-images')
          .getPublicUrl(img.file_path);
        
        console.log(`   생성된 URL (file_path 기반): ${publicUrl.substring(0, 100)}...`);
        
        // URL 비교
        if (img.cdn_url && img.cdn_url !== publicUrl) {
          console.log(`   ⚠️ cdn_url과 생성된 URL이 다름!`);
          console.log(`      cdn_url: ${img.cdn_url.substring(0, 100)}...`);
          console.log(`      생성된 URL: ${publicUrl.substring(0, 100)}...`);
        }
      }

      // 실제 파일 존재 확인
      if (img.file_path) {
        const pathParts = img.file_path.split('/');
        const folderPath = pathParts.slice(0, -1).join('/');
        const fileName = pathParts[pathParts.length - 1];

        const { data: files, error: listError } = await supabase.storage
          .from('blog-images')
          .list(folderPath, {
            search: fileName
          });

        const fileExists = !listError && files && files.length > 0;
        console.log(`   Storage 파일 존재: ${fileExists ? '✅' : '❌'}`);
        if (!fileExists) {
          console.log(`      경로: ${folderPath}`);
          console.log(`      파일명: ${fileName}`);
        }
      }

      console.log('');
    }
  } catch (error) {
    console.error('❌ 예외 발생:', error);
  }
}

checkImageUrls().catch(console.error);
