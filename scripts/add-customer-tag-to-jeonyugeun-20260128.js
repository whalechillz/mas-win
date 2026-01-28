/**
 * 전유근 고객의 2026-01-28 이미지에 customer 태그 추가
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

async function addCustomerTag() {
  console.log('🔍 전유근 고객의 2026-01-28 이미지에 customer 태그 추가...\n');

  try {
    // 1. 전유근 고객 정보 조회
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
    const customerTag = `customer-${customer.id}`;
    console.log(`✅ 고객: ${customer.name} (ID: ${customer.id}, 폴더: ${customer.folder_name})\n`);

    // 2. jeonyugeun-S1-20260128-01.webp 이미지 조회
    const { data: images, error: imageError } = await supabase
      .from('image_assets')
      .select('id, filename, file_path, ai_tags')
      .or(`filename.ilike.%jeonyugeun-S1-20260128-01.webp%,filename.ilike.%jeonyugeun_s1_20260128_01.webp%`)
      .limit(10);

    if (imageError) {
      console.error('❌ 이미지 조회 오류:', imageError);
      return;
    }

    if (!images || images.length === 0) {
      console.log('❌ 이미지를 찾을 수 없습니다.');
      return;
    }

    for (const img of images) {
      console.log(`📸 ${img.filename || '파일명 없음'}`);
      console.log(`   ID: ${img.id}`);
      console.log(`   현재 ai_tags: ${JSON.stringify(img.ai_tags || [])}`);
      
      const currentTags = Array.isArray(img.ai_tags) ? img.ai_tags : [];
      const hasCustomerTag = currentTags.includes(customerTag);
      
      if (hasCustomerTag) {
        console.log(`   ✅ 이미 customer 태그가 있습니다.`);
        continue;
      }
      
      // customer 태그 추가
      const updatedTags = [...currentTags, customerTag];
      
      console.log(`   📝 customer 태그 추가 중...`);
      console.log(`   업데이트될 ai_tags: ${JSON.stringify(updatedTags)}`);
      
      const { data: updatedImage, error: updateError } = await supabase
        .from('image_assets')
        .update({
          ai_tags: updatedTags,
          updated_at: new Date().toISOString()
        })
        .eq('id', img.id)
        .select()
        .single();
      
      if (updateError) {
        console.error(`   ❌ 업데이트 실패:`, updateError);
      } else {
        console.log(`   ✅ 업데이트 완료!`);
        console.log(`   업데이트된 ai_tags: ${JSON.stringify(updatedImage.ai_tags)}`);
      }
      console.log('');
    }

    console.log('✅ 작업 완료');
  } catch (error) {
    console.error('❌ 예외 발생:', error);
  }
}

addCustomerTag().catch(console.error);
