/**
 * black-beryl의 불필요한 500 관련 파일 삭제
 * composition 폴더에는 secret-weapon-black-sole-500.webp만 유지
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

async function removeUnnecessary500Files() {
  console.log('🗑️  불필요한 500 관련 파일 삭제 시작...\n');

  const filesToDelete = [
    'originals/products/black-beryl/detail/500.webp',
    'originals/products/black-beryl/detail/500-long.webp'
  ];

  const results = {
    deleted: [],
    errors: []
  };

  for (const filePath of filesToDelete) {
    const fileName = filePath.split('/').pop();
    console.log(`🗑️  삭제 중: ${fileName}`);
    
    const { error: deleteError } = await supabase.storage
      .from('blog-images')
      .remove([filePath]);
    
    if (deleteError) {
      console.error(`   ❌ 삭제 실패: ${deleteError.message}`);
      results.errors.push({ file: fileName, error: deleteError.message });
    } else {
      console.log(`   ✅ 삭제 완료`);
      results.deleted.push({ fileName, path: filePath });
    }
  }

  // 데이터베이스에서도 제거
  console.log('\n📝 데이터베이스 업데이트 중...');
  const { data: product, error: productError } = await supabase
    .from('products')
    .select('id, detail_images')
    .eq('slug', 'black-beryl')
    .single();

  if (!productError && product && Array.isArray(product.detail_images)) {
    const updatedImages = product.detail_images.filter(img => 
      !img.includes('500.webp') && !img.includes('500-long.webp')
    );
    
    const { error: updateError } = await supabase
      .from('products')
      .update({ detail_images: updatedImages })
      .eq('id', product.id);
    
    if (updateError) {
      console.error('❌ 데이터베이스 업데이트 실패:', updateError);
      results.errors.push({ step: 'update_db', error: updateError.message });
    } else {
      console.log(`✅ 데이터베이스 업데이트 완료 (${updatedImages.length}개 이미지 유지)`);
    }
  }

  // 결과 저장
  const outputPath = path.join(__dirname, 'remove-500-files-result.json');
  fs.writeFileSync(outputPath, JSON.stringify(results, null, 2));
  console.log(`\n✅ 결과가 ${outputPath}에 저장되었습니다.`);

  console.log('\n📊 삭제 요약:');
  console.log(`   - 삭제된 파일: ${results.deleted.length}개`);
  console.log(`   - 오류: ${results.errors.length}개`);

  console.log('\n✅ 완료!');
  console.log('\n📋 최종 상태:');
  console.log('   - composition/ 폴더: secret-weapon-black-sole-500.webp만 유지');
  console.log('   - detail/ 폴더: 500 관련 파일 제거됨');
}

removeUnnecessary500Files();

