/**
 * black-weapon과 gold-weapon4의 gallery 폴더 파일 삭제
 * 이미 detail 폴더로 복사되었으므로 gallery 폴더의 원본 파일 삭제
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

const products = [
  { folder: 'black-weapon', slug: 'black-weapon', name: '시크리트웨폰 블랙' },
  { folder: 'gold-weapon4', slug: 'gold-weapon4', name: '시크리트웨폰 골드 4.1' },
];

async function deleteGalleryFiles(product) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`🗑️  ${product.name} (${product.folder}) gallery 폴더 파일 삭제...`);
  console.log(`${'='.repeat(60)}`);

  const result = {
    product: product.name,
    folder: product.folder,
    deleted: [],
    errors: []
  };

  try {
    // gallery 폴더 파일 목록
    const { data: galleryFiles, error: galleryError } = await supabase.storage
      .from('blog-images')
      .list(`originals/products/${product.folder}/gallery`, { limit: 100 });

    if (galleryError || !galleryFiles || galleryFiles.length === 0) {
      console.log(`   ℹ️  gallery 폴더가 이미 비어있습니다.`);
      return result;
    }

    const galleryFilePaths = galleryFiles.map(f => 
      `originals/products/${product.folder}/gallery/${f.name}`
    );

    console.log(`   📋 삭제 대상: ${galleryFilePaths.length}개 파일`);

    for (const filePath of galleryFilePaths) {
      const fileName = filePath.split('/').pop();
      console.log(`   🗑️  삭제: ${fileName}`);
      
      const { error: deleteError } = await supabase.storage
        .from('blog-images')
        .remove([filePath]);
      
      if (deleteError) {
        console.error(`     ❌ 삭제 실패: ${deleteError.message}`);
        result.errors.push({ file: fileName, error: deleteError.message });
      } else {
        result.deleted.push({ fileName, path: filePath });
        console.log(`     ✅ 삭제 완료`);
      }
    }

    // 데이터베이스 업데이트 (gallery_images 비우기)
    const { data: dbProduct, error: dbError } = await supabase
      .from('products')
      .select('id, gallery_images')
      .eq('slug', product.slug)
      .single();

    if (!dbError && dbProduct) {
      const { error: updateError } = await supabase
        .from('products')
        .update({ 
          gallery_images: []
        })
        .eq('id', dbProduct.id);

      if (updateError) {
        console.error(`   ❌ 데이터베이스 업데이트 실패: ${updateError.message}`);
        result.errors.push({ step: 'update_db', error: updateError.message });
      } else {
        console.log(`   💾 데이터베이스 업데이트 완료 (gallery_images 비움)`);
      }
    }

  } catch (error) {
    console.error(`   ❌ 오류: ${error.message}`);
    result.errors.push({ step: 'general', error: error.message });
  }

  return result;
}

async function deleteAllGalleryFiles() {
  console.log('🚀 black-weapon, gold-weapon4 gallery 폴더 파일 삭제 시작...\n');

  const allResults = [];

  for (const product of products) {
    const result = await deleteGalleryFiles(product);
    allResults.push(result);
  }

  // 결과 저장
  const outputPath = path.join(__dirname, 'gallery-files-deletion-result.json');
  fs.writeFileSync(outputPath, JSON.stringify(allResults, null, 2));

  console.log('\n\n📊 전체 요약:');
  console.log(`${'='.repeat(60)}`);
  allResults.forEach(r => {
    console.log(`\n   ${r.product} (${r.folder}):`);
    console.log(`      - 삭제: ${r.deleted.length}개`);
    console.log(`      - 오류: ${r.errors.length}개`);
  });

  const totalDeleted = allResults.reduce((sum, r) => sum + r.deleted.length, 0);
  const totalErrors = allResults.reduce((sum, r) => sum + r.errors.length, 0);

  console.log(`\n${'='.repeat(60)}`);
  console.log(`📊 전체 통계:`);
  console.log(`   - 총 삭제: ${totalDeleted}개`);
  console.log(`   - 총 오류: ${totalErrors}개`);
  console.log(`${'='.repeat(60)}`);

  console.log(`\n✅ 결과가 ${outputPath}에 저장되었습니다.`);
  console.log('\n✅ gallery 폴더 파일 삭제 완료!');
}

deleteAllGalleryFiles();

