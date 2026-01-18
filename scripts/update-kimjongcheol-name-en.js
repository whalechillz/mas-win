/**
 * 김종철 고객 영문 이름 업데이트 스크립트
 * kimjotcheot -> kimjongchull
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Supabase 환경 변수가 설정되지 않았습니다.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const CUSTOMER_ID = 15203;
const OLD_NAME_EN = 'kimjotcheot';
const NEW_NAME_EN = 'kimjongchull';

async function updateCustomerNameEn() {
  console.log('🔄 김종철 고객 영문 이름 업데이트 시작...\n');

  // 1. customers 테이블 업데이트
  console.log('1️⃣ customers 테이블 업데이트...');
  const { data: customerData, error: customerError } = await supabase
    .from('customers')
    .update({ name_en: NEW_NAME_EN })
    .eq('id', CUSTOMER_ID)
    .select()
    .single();

  if (customerError) {
    console.error('❌ customers 테이블 업데이트 실패:', customerError);
    return;
  }

  console.log(`✅ customers 테이블 업데이트 완료: ${customerData.name} (name_en: ${NEW_NAME_EN})`);

  // 2. image_metadata 테이블 업데이트 (tags 배열로 조회)
  console.log('\n2️⃣ image_metadata 테이블 업데이트...');
  const { data: imagesData, error: imagesError } = await supabase
    .from('image_metadata')
    .update({ customer_name_en: NEW_NAME_EN })
    .contains('tags', [`customer-${CUSTOMER_ID}`])
    .select();

  if (imagesError) {
    console.error('❌ image_metadata 테이블 업데이트 실패:', imagesError);
    return;
  }

  console.log(`✅ image_metadata 테이블 업데이트 완료: ${imagesData.length}개 레코드`);

  // 3. english_filename 업데이트 (파일명에 영문 이름이 포함된 경우)
  console.log('\n3️⃣ english_filename 업데이트...');
  const { data: allImages, error: fetchError } = await supabase
    .from('image_metadata')
    .select('id, english_filename, story_scene, image_type')
    .contains('tags', [`customer-${CUSTOMER_ID}`]);

  if (fetchError) {
    console.error('❌ 이미지 목록 조회 실패:', fetchError);
    return;
  }

  let updatedCount = 0;
  for (const image of allImages) {
    if (image.english_filename && image.english_filename.includes(OLD_NAME_EN)) {
      const newFileName = image.english_filename.replace(OLD_NAME_EN, NEW_NAME_EN);
      
      const { error: updateError } = await supabase
        .from('image_metadata')
        .update({ english_filename: newFileName })
        .eq('id', image.id);

      if (updateError) {
        console.warn(`⚠️  파일명 업데이트 실패 (ID: ${image.id}):`, updateError.message);
      } else {
        console.log(`   ✅ ${image.english_filename} -> ${newFileName}`);
        updatedCount++;
      }
    }
  }

  console.log(`✅ 파일명 업데이트 완료: ${updatedCount}개`);

  console.log('\n' + '='.repeat(60));
  console.log('✅ 김종철 고객 영문 이름 업데이트 완료!');
  console.log('='.repeat(60));
  console.log(`이전: ${OLD_NAME_EN}`);
  console.log(`변경: ${NEW_NAME_EN}`);
  console.log(`업데이트된 레코드:`);
  console.log(`  - customers: 1개`);
  console.log(`  - image_metadata: ${imagesData.length}개`);
  console.log(`  - 파일명: ${updatedCount}개`);
  console.log('='.repeat(60));
}

updateCustomerNameEn()
  .then(() => {
    console.log('\n✅ 업데이트 완료');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ 업데이트 중 오류 발생:', error);
    process.exit(1);
  });
