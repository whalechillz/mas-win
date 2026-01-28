/**
 * 김진권 고객의 중복 cdn_url 확인 스크립트
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

async function checkDuplicateCdnUrl() {
  console.log('🔍 김진권 고객의 중복 cdn_url 확인...\n');

  try {
    // 김진권 고객 정보 조회
    const { data: customers } = await supabase
      .from('customers')
      .select('id, name, folder_name')
      .ilike('name', '%김진권%')
      .limit(1);

    if (!customers || customers.length === 0) {
      console.error('❌ 김진권 고객을 찾을 수 없습니다.');
      return;
    }

    const customer = customers[0];
    const folderName = customer.folder_name || `customer-${String(customer.id).padStart(3, '0')}`;
    
    console.log(`✅ 고객: ${customer.name} (ID: ${customer.id}, 폴더: ${folderName})\n`);

    // 해당 이미지 조회
    const imageId = '34843983-26c2-4d0f-9aeb-bbcdb4ad6dfa';
    const { data: image, error: imageError } = await supabase
      .from('image_assets')
      .select('id, filename, file_path, cdn_url, ai_tags')
      .eq('id', imageId)
      .maybeSingle();

    if (imageError || !image) {
      console.error('❌ 이미지 조회 실패:', imageError);
      return;
    }

    console.log('📸 대상 이미지 정보:');
    console.log(`   ID: ${image.id}`);
    console.log(`   file_path: ${image.file_path || '없음'}`);
    console.log(`   cdn_url: ${image.cdn_url ? image.cdn_url.substring(0, 100) + '...' : '없음'}\n`);

    // file_path로부터 생성될 cdn_url 확인
    if (image.file_path) {
      const { data: { publicUrl } } = supabase.storage
        .from('blog-images')
        .getPublicUrl(image.file_path);
      
      console.log(`📝 생성될 cdn_url: ${publicUrl.substring(0, 100)}...\n`);

      // 같은 cdn_url을 가진 다른 이미지 확인
      const { data: duplicates, error: dupError } = await supabase
        .from('image_assets')
        .select('id, filename, file_path, cdn_url')
        .eq('cdn_url', publicUrl)
        .neq('id', imageId);

      if (dupError) {
        console.error('❌ 중복 확인 실패:', dupError);
        return;
      }

      if (duplicates && duplicates.length > 0) {
        console.log(`⚠️ 중복된 cdn_url을 가진 이미지: ${duplicates.length}개\n`);
        duplicates.forEach((dup, index) => {
          console.log(`${index + 1}. ID: ${dup.id}`);
          console.log(`   filename: ${dup.filename || '없음'}`);
          console.log(`   file_path: ${dup.file_path?.substring(0, 100) || '없음'}`);
          console.log(`   cdn_url: ${dup.cdn_url?.substring(0, 100) || '없음'}...\n`);
        });
      } else {
        console.log('✅ 중복된 cdn_url 없음\n');
      }
    }

  } catch (error) {
    console.error('❌ 예외 발생:', error);
  }
}

checkDuplicateCdnUrl().catch(console.error);
