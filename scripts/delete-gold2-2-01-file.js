/**
 * gold2 제품의 detail 폴더에서 2_01.webp 파일 삭제
 */

require('dotenv').config({ path: '.env.local' });

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ 환경 변수가 설정되지 않았습니다.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const product = {
  folder: 'gold2',
  slug: 'gold2',
  name: '시크리트포스 골드 2'
};

async function deleteGold2File() {
  console.log(`🗑️  ${product.name} detail 폴더에서 2_01.webp 삭제...\n`);

  const fileName = '2_01.webp';
  const filePath = `originals/products/${product.folder}/detail/${fileName}`;

  try {
    // 파일 삭제
    console.log(`   🗑️  삭제 중: ${fileName}`);
    const { error: deleteError } = await supabase.storage
      .from('blog-images')
      .remove([filePath]);

    if (deleteError) {
      console.error(`   ❌ 삭제 실패: ${deleteError.message}`);
      return;
    }

    console.log(`   ✅ 파일 삭제 완료`);

    // 데이터베이스 업데이트
    console.log('\n📝 데이터베이스 업데이트 중...');
    const { data: dbProduct, error: dbError } = await supabase
      .from('products')
      .select('id, detail_images')
      .eq('slug', product.slug)
      .single();

    if (dbError || !dbProduct) {
      console.error(`   ❌ 제품 조회 실패: ${dbError?.message}`);
      return;
    }

    if (Array.isArray(dbProduct.detail_images)) {
      const updatedImages = dbProduct.detail_images.filter(img => 
        !img.includes(fileName)
      );

      const { error: updateError } = await supabase
        .from('products')
        .update({ detail_images: updatedImages })
        .eq('id', dbProduct.id);

      if (updateError) {
        console.error(`   ❌ 데이터베이스 업데이트 실패: ${updateError.message}`);
      } else {
        console.log(`   ✅ 데이터베이스 업데이트 완료 (${updatedImages.length}개 이미지 유지)`);
      }
    }

    console.log('\n✅ 작업 완료!');

  } catch (error) {
    console.error('❌ 스크립트 실행 오류:', error);
  }
}

deleteGold2File();

