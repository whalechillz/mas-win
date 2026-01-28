/**
 * 안희자 고객의 2026-01-28 이미지에 customer 태그 추가
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
  console.log('🔍 안희자 고객의 2026-01-28 이미지에 customer 태그 추가...\n');

  try {
    // 1. 안희자 고객 정보 조회
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
    const customerTag = `customer-${customer.id}`;
    console.log(`✅ 고객: ${customer.name} (ID: ${customer.id}, 폴더: ${customer.folder_name})\n`);

    // 2. 2026-01-28 이미지 중 customer 태그가 없는 이미지 조회
    const folderName = customer.folder_name || `customer-${String(customer.id).padStart(3, '0')}`;
    const expectedPath = `originals/customers/${folderName}/2026-01-28`;
    
    const { data: images, error: imageError } = await supabase
      .from('image_assets')
      .select('id, filename, file_path, ai_tags')
      .ilike('file_path', `${expectedPath}%`)
      .limit(100);

    if (imageError) {
      console.error('❌ 이미지 조회 오류:', imageError);
      return;
    }

    if (!images || images.length === 0) {
      console.log('❌ 2026-01-28 이미지를 찾을 수 없습니다.');
      return;
    }

    console.log(`✅ 2026-01-28 이미지 ${images.length}개 발견\n`);

    let updatedCount = 0;
    for (const img of images) {
      const currentTags = Array.isArray(img.ai_tags) ? img.ai_tags : [];
      const hasCustomerTag = currentTags.includes(customerTag);
      
      if (hasCustomerTag) {
        console.log(`   ✅ ${img.filename || '파일명 없음'}: 이미 customer 태그가 있습니다.`);
        continue;
      }
      
      // customer 태그 추가
      const updatedTags = [...currentTags, customerTag];
      
      console.log(`   📝 ${img.filename || '파일명 없음'} (ID: ${img.id})`);
      console.log(`      현재 ai_tags: ${JSON.stringify(currentTags)}`);
      console.log(`      업데이트될 ai_tags: ${JSON.stringify(updatedTags)}`);
      
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
        console.error(`      ❌ 업데이트 실패:`, updateError);
      } else {
        console.log(`      ✅ 업데이트 완료!`);
        updatedCount++;
      }
      console.log('');
    }

    console.log(`✅ 작업 완료: ${updatedCount}개 이미지에 customer 태그 추가`);
  } catch (error) {
    console.error('❌ 예외 발생:', error);
  }
}

addCustomerTag().catch(console.error);
