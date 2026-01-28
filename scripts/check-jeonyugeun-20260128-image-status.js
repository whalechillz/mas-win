/**
 * 전유근 고객의 2026-01-28 이미지 상태 확인
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

async function checkImageStatus() {
  console.log('🔍 전유근 고객의 2026-01-28 이미지 상태 확인...\n');

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

    // jeonyugeun-S1-20260128-01.webp 이미지 조회
    const { data: images, error: imagesError } = await supabase
      .from('image_assets')
      .select('id, filename, file_path, cdn_url, ai_tags')
      .ilike('filename', '%jeonyugeun-S1-20260128-01%')
      .limit(10);

    if (imagesError) {
      console.error('❌ 이미지 조회 실패:', imagesError);
      return;
    }

    console.log(`✅ ${images.length}개 이미지 발견\n`);

    for (const img of images) {
      console.log(`📸 ${img.filename || '파일명 없음'}`);
      console.log(`   ID: ${img.id}`);
      console.log(`   file_path: ${img.file_path || '없음'}`);
      console.log(`   cdn_url: ${img.cdn_url ? img.cdn_url.substring(0, 100) + '...' : '없음'}`);
      console.log(`   ai_tags: ${JSON.stringify(img.ai_tags || [])}`);

      // file_path에서 날짜 추출
      const dateMatch = img.file_path ? img.file_path.match(/\/(\d{4}-\d{2}-\d{2})\//) : null;
      const dateInPath = dateMatch ? dateMatch[1] : null;

      // ai_tags에서 visit-{date} 추출
      const visitTag = Array.isArray(img.ai_tags) ? img.ai_tags.find((tag) => tag.startsWith('visit-')) : null;
      const dateInTag = visitTag ? visitTag.replace('visit-', '') : null;

      console.log(`   file_path 날짜: ${dateInPath || '없음'}`);
      console.log(`   ai_tags 날짜: ${dateInTag || '없음'}`);

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
          console.log(`   경로: ${folderPath}`);
          console.log(`   파일명: ${fileName}`);
        }
      }

      console.log('');
    }
  } catch (error) {
    console.error('❌ 예외 발생:', error);
  }
}

checkImageStatus().catch(console.error);
