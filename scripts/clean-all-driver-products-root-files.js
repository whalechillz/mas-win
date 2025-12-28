/**
 * 모든 드라이버 제품 루트 폴더 정리 스크립트
 * black-beryl 패턴을 모든 제품에 적용
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

// 드라이버 제품 목록 (black-beryl 제외)
const driverProducts = [
  { folder: 'black-weapon', slug: 'secret-weapon-black', name: '시크리트웨폰 블랙' },
  { folder: 'gold-weapon4', slug: 'secret-weapon-4-1', name: '시크리트웨폰 골드 4.1' },
  { folder: 'gold2', slug: 'secret-force-gold-2', name: '시크리트포스 골드 2' },
  { folder: 'gold2-sapphire', slug: 'gold2-sapphire', name: '시크리트포스 골드 2 MUZIIK' },
  { folder: 'pro3', slug: 'secret-force-pro-3', name: '시크리트포스 PRO 3' },
  { folder: 'pro3-muziik', slug: 'pro3-muziik', name: '시크리트포스 PRO 3 MUZIIK' },
  { folder: 'v3', slug: 'secret-force-v3', name: '시크리트포스 V3' },
];

/**
 * 파일명으로 이미지 타입 결정
 */
function determineImageType(fileName) {
  const lowerName = fileName.toLowerCase();
  
  // composition: 합성용 이미지
  if (
    lowerName.includes('-sole-') ||
    lowerName.includes('-500') ||
    lowerName.startsWith('500') ||
    lowerName.includes('composition') ||
    lowerName.includes('composed')
  ) {
    return 'composition';
  }
  
  // gallery: 갤러리 이미지
  if (lowerName.includes('gallery-')) {
    return 'gallery';
  }
  
  // detail: 기본값 (상세페이지용)
  return 'detail';
}

async function cleanProductRootFiles(product) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`🧹 ${product.name} (${product.folder}) 정리 시작...`);
  console.log(`${'='.repeat(60)}`);

  const results = {
    product: product.name,
    folder: product.folder,
    slug: product.slug,
    rootFiles: [],
    moved: [],
    deleted: [],
    errors: []
  };

  try {
    // 1. 루트 폴더 파일 목록
    const { data: rootFiles, error: rootError } = await supabase.storage
      .from('blog-images')
      .list(`originals/products/${product.folder}`, { 
        limit: 100,
        sortBy: { column: 'name', order: 'asc' }
      });

    if (rootError) {
      console.error(`   ❌ 루트 폴더 조회 오류: ${rootError.message}`);
      results.errors.push({ step: 'list_root', error: rootError.message });
      return results;
    }

    const rootFileList = (rootFiles || []).filter(item => 
      item.id && 
      item.name !== 'detail' && 
      item.name !== 'composition' && 
      item.name !== 'gallery' &&
      !item.name.endsWith('/')
    );
    results.rootFiles = rootFileList.map(f => f.name);

    if (rootFileList.length === 0) {
      console.log('   ✅ 루트 폴더가 이미 정리되어 있습니다.');
      return results;
    }

    console.log(`   📋 루트 폴더에 ${rootFileList.length}개 파일 발견`);

    // 2. 하위 폴더 파일 목록
    const { data: detailFiles } = await supabase.storage
      .from('blog-images')
      .list(`originals/products/${product.folder}/detail`, { limit: 100 });
    const detailFileNames = (detailFiles || []).map(f => f.name);

    const { data: compositionFiles } = await supabase.storage
      .from('blog-images')
      .list(`originals/products/${product.folder}/composition`, { limit: 100 });
    const compositionFileNames = (compositionFiles || []).map(f => f.name);

    const { data: galleryFiles } = await supabase.storage
      .from('blog-images')
      .list(`originals/products/${product.folder}/gallery`, { limit: 100 });
    const galleryFileNames = (galleryFiles || []).map(f => f.name);

    // 3. 루트 파일 처리
    for (const rootFile of rootFileList) {
      const fileName = rootFile.name;
      
      // 시스템 파일 건너뛰기
      if (fileName.startsWith('.') || fileName === '.keep.png') {
        console.log(`   ⏭️  건너뛰기 (시스템 파일): ${fileName}`);
        continue;
      }

      const imageType = determineImageType(fileName);
      const targetPath = `originals/products/${product.folder}/${imageType}/${fileName}`;
      const rootPath = `originals/products/${product.folder}/${fileName}`;

      const existingFiles = imageType === 'detail' ? detailFileNames : 
                          imageType === 'composition' ? compositionFileNames : 
                          galleryFileNames;

      if (existingFiles.includes(fileName)) {
        // 중복: 루트 파일만 삭제
        const { error: deleteError } = await supabase.storage
          .from('blog-images')
          .remove([rootPath]);
        
        if (deleteError) {
          console.error(`   ❌ 삭제 실패 (중복): ${fileName} - ${deleteError.message}`);
          results.errors.push({ file: fileName, step: 'delete_duplicate', error: deleteError.message });
        } else {
          results.deleted.push({ fileName, reason: 'duplicate' });
          console.log(`   🗑️  삭제 (중복): ${fileName}`);
        }
      } else {
        // 이동
        try {
          const { data: fileData, error: downloadError } = await supabase.storage
            .from('blog-images')
            .download(rootPath);
          
          if (downloadError) {
            console.error(`   ❌ 다운로드 실패: ${fileName} - ${downloadError.message}`);
            results.errors.push({ file: fileName, step: 'download', error: downloadError.message });
            continue;
          }
          
          const { error: uploadError } = await supabase.storage
            .from('blog-images')
            .upload(targetPath, fileData, { 
              contentType: 'image/webp',
              cacheControl: '3600',
              upsert: true 
            });
          
          if (uploadError) {
            console.error(`   ❌ 업로드 실패: ${fileName} - ${uploadError.message}`);
            results.errors.push({ file: fileName, step: 'upload', error: uploadError.message });
            continue;
          }
          
          const { error: deleteError } = await supabase.storage
            .from('blog-images')
            .remove([rootPath]);
          
          if (deleteError) {
            console.warn(`   ⚠️  루트 파일 삭제 실패 (무시): ${deleteError.message}`);
          }
          
          results.moved.push({ fileName, to: targetPath, type: imageType });
          console.log(`   📦 이동: ${fileName} → ${imageType}/`);
        } catch (error) {
          console.error(`   ❌ 이동 중 오류: ${fileName} - ${error.message}`);
          results.errors.push({ file: fileName, step: 'move', error: error.message });
        }
      }
    }

    // 4. composition 폴더 정리 (500 사이즈 하나만 유지)
    const { data: compFiles } = await supabase.storage
      .from('blog-images')
      .list(`originals/products/${product.folder}/composition`, { limit: 100 });
    
    const files500 = (compFiles || []).filter(f => 
      f.name.includes('500') || f.name.includes('sole') || f.name.includes('350')
    );

    if (files500.length > 1) {
      // 메인 파일 찾기 (sole-500 또는 sole-350 패턴)
      const mainFile = files500.find(f => 
        f.name.includes('sole-500') || f.name.includes('sole-350')
      ) || files500[0];

      const filesToDelete = files500.filter(f => f.name !== mainFile.name);
      
      console.log(`   🧹 composition 폴더 정리: ${mainFile.name}만 유지`);
      
      for (const file of filesToDelete) {
        const filePath = `originals/products/${product.folder}/composition/${file.name}`;
        const { error: deleteError } = await supabase.storage
          .from('blog-images')
          .remove([filePath]);
        
        if (deleteError) {
          console.error(`   ❌ 삭제 실패: ${file.name} - ${deleteError.message}`);
          results.errors.push({ file: file.name, step: 'delete_500_extra', error: deleteError.message });
        } else {
          results.deleted.push({ fileName: file.name, reason: 'extra_500_file' });
          console.log(`   🗑️  삭제 (500 중복): ${file.name}`);
        }
      }
    }

    // 5. 데이터베이스 업데이트
    const { data: dbProduct, error: dbError } = await supabase
      .from('products')
      .select('id, detail_images, composition_images')
      .eq('slug', product.slug)
      .single();

    if (!dbError && dbProduct) {
      const movedDetail = results.moved.filter(m => m.type === 'detail');
      const movedComposition = results.moved.filter(m => m.type === 'composition');
      const movedGallery = results.moved.filter(m => m.type === 'gallery');
      
      // detail_images 업데이트
      const currentDetailImages = Array.isArray(dbProduct.detail_images) ? [...dbProduct.detail_images] : [];
      const newDetailImages = [...new Set([...currentDetailImages, ...movedDetail.map(m => m.to)])];
      
      // composition_images 업데이트 (500 파일 하나만)
      const { data: finalCompFiles } = await supabase.storage
        .from('blog-images')
        .list(`originals/products/${product.folder}/composition`, { limit: 100 });
      const finalFiles500 = (finalCompFiles || []).filter(f => 
        f.name.includes('500') || f.name.includes('sole') || f.name.includes('350')
      );
      const compositionImage = finalFiles500.length > 0 ? 
        [`originals/products/${product.folder}/composition/${finalFiles500[0].name}`] : [];
      
      // gallery_images 업데이트
      const currentGalleryImages = Array.isArray(dbProduct.gallery_images) ? [...dbProduct.gallery_images] : [];
      const newGalleryImages = [...new Set([...currentGalleryImages, ...movedGallery.map(m => m.to)])];
      
      const { error: updateError } = await supabase
        .from('products')
        .update({ 
          detail_images: newDetailImages,
          composition_images: compositionImage,
          gallery_images: newGalleryImages
        })
        .eq('id', dbProduct.id);
      
      if (updateError) {
        console.error(`   ❌ 데이터베이스 업데이트 실패: ${updateError.message}`);
        results.errors.push({ step: 'update_db', error: updateError.message });
      } else {
        console.log(`   💾 데이터베이스 업데이트 완료`);
        console.log(`      - detail_images: ${newDetailImages.length}개`);
        console.log(`      - composition_images: ${compositionImage.length}개`);
        console.log(`      - gallery_images: ${newGalleryImages.length}개`);
      }
    }

  } catch (error) {
    console.error(`   ❌ 오류: ${error.message}`);
    results.errors.push({ step: 'general', error: error.message });
  }

  return results;
}

async function cleanAllDriverProducts() {
  console.log('🚀 모든 드라이버 제품 정리 시작...\n');

  const allResults = [];

  for (const product of driverProducts) {
    const result = await cleanProductRootFiles(product);
    allResults.push(result);
  }

  // 결과 저장
  const outputPath = path.join(__dirname, 'all-driver-products-cleanup-result.json');
  fs.writeFileSync(outputPath, JSON.stringify(allResults, null, 2));

  console.log('\n\n📊 전체 요약:');
  console.log(`${'='.repeat(60)}`);
  allResults.forEach(r => {
    console.log(`\n   ${r.product} (${r.folder}):`);
    console.log(`      - 이동: ${r.moved.length}개`);
    console.log(`      - 삭제: ${r.deleted.length}개`);
    console.log(`      - 오류: ${r.errors.length}개`);
    if (r.errors.length > 0) {
      r.errors.forEach(err => {
        console.log(`         * ${err.file || err.step}: ${err.error}`);
      });
    }
  });

  const totalMoved = allResults.reduce((sum, r) => sum + r.moved.length, 0);
  const totalDeleted = allResults.reduce((sum, r) => sum + r.deleted.length, 0);
  const totalErrors = allResults.reduce((sum, r) => sum + r.errors.length, 0);

  console.log(`\n${'='.repeat(60)}`);
  console.log(`📊 전체 통계:`);
  console.log(`   - 총 이동: ${totalMoved}개`);
  console.log(`   - 총 삭제: ${totalDeleted}개`);
  console.log(`   - 총 오류: ${totalErrors}개`);
  console.log(`${'='.repeat(60)}`);

  console.log(`\n✅ 결과가 ${outputPath}에 저장되었습니다.`);
  console.log('\n✅ 모든 제품 정리 완료!');
}

cleanAllDriverProducts();

