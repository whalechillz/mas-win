/**
 * gold-weapon4 제품의 detail 폴더를 gallery 이미지로 대체
 * 1. detail 폴더의 모든 파일 삭제
 * 2. gallery 폴더의 파일들을 detail 폴더로 복사
 * 3. 데이터베이스의 detail_images를 gallery_images로 업데이트
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
  folder: 'gold-weapon4',
  slug: 'gold-weapon4',
  name: '시크리트웨폰 골드 4.1'
};

async function replaceGoldWeapon4DetailWithGallery() {
  console.log(`🔄 ${product.name} detail → gallery 이미지 대체 시작...\n`);

  const results = {
    product: product.name,
    deletedFromDetail: [],
    copiedFromGallery: [],
    errors: []
  };

  try {
    // 1. detail 폴더의 모든 파일 삭제
    console.log('1️⃣ detail 폴더 파일 삭제 중...');
    const { data: detailFiles, error: detailError } = await supabase.storage
      .from('blog-images')
      .list(`originals/products/${product.folder}/detail`, { limit: 100 });

    if (!detailError && detailFiles && detailFiles.length > 0) {
      const detailFilePaths = detailFiles.map(f => 
        `originals/products/${product.folder}/detail/${f.name}`
      );

      console.log(`   📋 삭제 대상: ${detailFilePaths.length}개 파일`);
      
      const { error: deleteError } = await supabase.storage
        .from('blog-images')
        .remove(detailFilePaths);

      if (deleteError) {
        console.error(`   ❌ 삭제 실패: ${deleteError.message}`);
        results.errors.push({ step: 'delete_detail', error: deleteError.message });
      } else {
        results.deletedFromDetail = detailFiles.map(f => f.name);
        console.log(`   ✅ detail 폴더 파일 ${detailFilePaths.length}개 삭제 완료`);
      }
    } else {
      console.log(`   ℹ️  detail 폴더가 이미 비어있습니다.`);
    }

    // 2. gallery 폴더의 파일들을 detail 폴더로 복사
    console.log('\n2️⃣ gallery 폴더 파일을 detail로 복사 중...');
    const { data: galleryFiles, error: galleryError } = await supabase.storage
      .from('blog-images')
      .list(`originals/products/${product.folder}/gallery`, { limit: 100 });

    if (galleryError || !galleryFiles || galleryFiles.length === 0) {
      console.error(`   ❌ gallery 폴더 조회 오류 또는 파일 없음: ${galleryError?.message}`);
      results.errors.push({ step: 'list_gallery', error: galleryError?.message || '파일 없음' });
      return results;
    }

    console.log(`   📋 복사 대상: ${galleryFiles.length}개 파일`);

    for (const galleryFile of galleryFiles) {
      const fileName = galleryFile.name;
      const galleryPath = `originals/products/${product.folder}/gallery/${fileName}`;
      const detailPath = `originals/products/${product.folder}/detail/${fileName}`;

      console.log(`   📦 복사: ${fileName}`);

      try {
        // gallery 파일 다운로드
        const { data: fileData, error: downloadError } = await supabase.storage
          .from('blog-images')
          .download(galleryPath);

        if (downloadError) {
          console.error(`     ❌ 다운로드 실패: ${downloadError.message}`);
          results.errors.push({ file: fileName, step: 'download', error: downloadError.message });
          continue;
        }

        // detail 폴더에 업로드
        const { error: uploadError } = await supabase.storage
          .from('blog-images')
          .upload(detailPath, fileData, {
            contentType: 'image/webp',
            cacheControl: '3600',
            upsert: true
          });

        if (uploadError) {
          console.error(`     ❌ 업로드 실패: ${uploadError.message}`);
          results.errors.push({ file: fileName, step: 'upload', error: uploadError.message });
          continue;
        }

        results.copiedFromGallery.push({
          fileName,
          galleryPath,
          detailPath
        });

        console.log(`     ✅ 복사 완료`);

      } catch (error) {
        console.error(`     ❌ 복사 중 오류: ${error.message}`);
        results.errors.push({ file: fileName, step: 'copy', error: error.message });
      }
    }

    // 3. 데이터베이스 업데이트
    console.log('\n3️⃣ 데이터베이스 업데이트 중...');
    const { data: dbProduct, error: dbError } = await supabase
      .from('products')
      .select('id, detail_images, gallery_images')
      .eq('slug', product.slug)
      .single();

    if (dbError || !dbProduct) {
      console.error(`   ❌ 제품 조회 실패: ${dbError?.message}`);
      results.errors.push({ step: 'fetch_product', error: dbError?.message });
      return results;
    }

    // gallery_images를 detail_images로 사용
    const currentGalleryImages = Array.isArray(dbProduct.gallery_images) 
      ? dbProduct.gallery_images 
      : [];

    // gallery_images 경로를 detail_images 경로로 변환
    const newDetailImages = currentGalleryImages.map(imgPath => {
      // gallery 경로를 detail 경로로 변경
      if (imgPath.includes('/gallery/')) {
        return imgPath.replace('/gallery/', '/detail/');
      }
      // 이미 detail 경로이거나 다른 형식이면 그대로 사용
      return imgPath;
    });

    // 복사된 파일 경로로 직접 생성 (gallery_images가 없을 경우 대비)
    if (newDetailImages.length === 0 && results.copiedFromGallery.length > 0) {
      results.copiedFromGallery.forEach(item => {
        newDetailImages.push(item.detailPath);
      });
    }

    const { error: updateError } = await supabase
      .from('products')
      .update({ 
        detail_images: newDetailImages
      })
      .eq('id', dbProduct.id);

    if (updateError) {
      console.error(`   ❌ 데이터베이스 업데이트 실패: ${updateError.message}`);
      results.errors.push({ step: 'update_db', error: updateError.message });
    } else {
      console.log(`   ✅ 데이터베이스 업데이트 완료`);
      console.log(`      - detail_images: ${newDetailImages.length}개 (gallery 이미지로 대체)`);
      console.log(`      - gallery_images: ${currentGalleryImages.length}개 (유지)`);
    }

    // 결과 저장
    const outputPath = path.join(__dirname, 'gold-weapon4-detail-to-gallery-replacement-result.json');
    fs.writeFileSync(outputPath, JSON.stringify(results, null, 2));
    console.log(`\n✅ 결과가 ${outputPath}에 저장되었습니다.`);

    // 요약 출력
    console.log('\n📊 작업 요약:');
    console.log(`   - detail 폴더에서 삭제: ${results.deletedFromDetail.length}개`);
    console.log(`   - gallery → detail 복사: ${results.copiedFromGallery.length}개`);
    console.log(`   - 오류: ${results.errors.length}개`);

    if (results.errors.length > 0) {
      console.log('\n⚠️  오류 목록:');
      results.errors.forEach((err, index) => {
        console.log(`   ${index + 1}. ${err.file || err.step}: ${err.error}`);
      });
    }

    console.log('\n✅ 작업 완료!');
    console.log('\n📋 최종 상태:');
    console.log('   - detail/ 폴더: gallery 이미지로 대체됨');
    console.log('   - gallery/ 폴더: 원본 유지');
    console.log('   - products.detail_images: gallery 이미지 경로로 업데이트됨');

  } catch (error) {
    console.error('❌ 스크립트 실행 오류:', error);
    results.errors.push({ step: 'general', error: error.message });
  }

  return results;
}

replaceGoldWeapon4DetailWithGallery();

