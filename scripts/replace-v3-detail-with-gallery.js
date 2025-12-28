/**
 * v3 제품의 detail 이미지를 gallery 이미지로 교체
 * 1. detail 폴더의 모든 파일 삭제
 * 2. gallery 폴더의 모든 파일을 detail 폴더로 복사
 * 3. products 테이블의 detail_images 업데이트
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

const productSlug = 'v3';

async function replaceV3DetailWithGallery() {
  console.log('🔄 v3 제품 detail 이미지를 gallery 이미지로 교체 시작...\n');

  const results = {
    productSlug,
    detailDeleted: [],
    galleryMoved: [],
    dbUpdated: false,
    errors: []
  };

  try {
    // 1. 제품 정보 조회
    console.log('1️⃣ 제품 정보 조회 중...');
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('id, name, slug, detail_images, gallery_images')
      .eq('slug', productSlug)
      .maybeSingle();

    if (productError) {
      console.error(`   ❌ 제품 조회 실패: ${productError.message}`);
      results.errors.push({ step: 'fetch_product', error: productError.message });
      return results;
    }

    if (!product) {
      console.error(`   ❌ 제품을 찾을 수 없습니다: ${productSlug}`);
      results.errors.push({ step: 'fetch_product', error: '제품을 찾을 수 없음' });
      return results;
    }

    console.log(`   ✅ 제품 조회 완료: ${product.name}`);
    console.log(`      - 현재 detail_images: ${Array.isArray(product.detail_images) ? product.detail_images.length : 0}개`);
    console.log(`      - 현재 gallery_images: ${Array.isArray(product.gallery_images) ? product.gallery_images.length : 0}개`);

    // 2. detail 폴더의 모든 파일 삭제
    console.log('\n2️⃣ detail 폴더의 모든 파일 삭제 중...');
    const detailPath = `originals/products/${productSlug}/detail`;
    const { data: detailFiles, error: detailListError } = await supabase.storage
      .from('blog-images')
      .list(detailPath, { limit: 100 });

    if (detailListError) {
      console.error(`   ❌ detail 폴더 목록 조회 실패: ${detailListError.message}`);
      results.errors.push({ step: 'list_detail', error: detailListError.message });
    } else if (detailFiles && detailFiles.length > 0) {
      const filesToDelete = detailFiles.map(file => `${detailPath}/${file.name}`);
      const { error: deleteError } = await supabase.storage
        .from('blog-images')
        .remove(filesToDelete);

      if (deleteError) {
        console.error(`   ❌ detail 파일 삭제 실패: ${deleteError.message}`);
        results.errors.push({ step: 'delete_detail', error: deleteError.message });
      } else {
        console.log(`   ✅ detail 파일 ${detailFiles.length}개 삭제 완료`);
        results.detailDeleted = detailFiles.map(f => f.name);
      }
    } else {
      console.log(`   ℹ️  detail 폴더가 비어있습니다.`);
    }

    // 3. gallery 폴더의 파일을 detail 폴더로 복사
    console.log('\n3️⃣ gallery 폴더의 파일을 detail 폴더로 복사 중...');
    const galleryPath = `originals/products/${productSlug}/gallery`;
    const { data: galleryFiles, error: galleryListError } = await supabase.storage
      .from('blog-images')
      .list(galleryPath, { limit: 100 });

    if (galleryListError) {
      console.error(`   ❌ gallery 폴더 목록 조회 실패: ${galleryListError.message}`);
      results.errors.push({ step: 'list_gallery', error: galleryListError.message });
    } else if (galleryFiles && galleryFiles.length > 0) {
      console.log(`   📦 ${galleryFiles.length}개 파일 복사 중...`);

      for (const file of galleryFiles) {
        const sourcePath = `${galleryPath}/${file.name}`;
        const targetPath = `${detailPath}/${file.name}`;

        try {
          // 파일 다운로드
          const { data: fileData, error: downloadError } = await supabase.storage
            .from('blog-images')
            .download(sourcePath);

          if (downloadError) {
            console.error(`     ❌ 다운로드 실패 (${file.name}): ${downloadError.message}`);
            results.errors.push({ file: file.name, step: 'download', error: downloadError.message });
            continue;
          }

          // detail 폴더에 업로드
          const { error: uploadError } = await supabase.storage
            .from('blog-images')
            .upload(targetPath, fileData, {
              contentType: file.metadata?.mimetype || 'image/webp',
              cacheControl: '3600',
              upsert: true
            });

          if (uploadError) {
            console.error(`     ❌ 업로드 실패 (${file.name}): ${uploadError.message}`);
            results.errors.push({ file: file.name, step: 'upload', error: uploadError.message });
            continue;
          }

          console.log(`     ✅ 복사 완료: ${file.name}`);
          results.galleryMoved.push({
            fileName: file.name,
            from: sourcePath,
            to: targetPath
          });
        } catch (error) {
          console.error(`     ❌ 복사 중 오류 (${file.name}): ${error.message}`);
          results.errors.push({ file: file.name, step: 'copy', error: error.message });
        }
      }
    } else {
      console.log(`   ⚠️  gallery 폴더가 비어있습니다.`);
    }

    // 4. products 테이블의 detail_images 업데이트
    console.log('\n4️⃣ products 테이블의 detail_images 업데이트 중...');
    if (galleryFiles && galleryFiles.length > 0) {
      // gallery_images 경로를 detail_images 경로로 변환
      const currentGalleryImages = Array.isArray(product.gallery_images) ? product.gallery_images : [];
      const newDetailImages = currentGalleryImages.map(imgPath => {
        // gallery 경로를 detail 경로로 변경
        if (imgPath.includes(`/${productSlug}/gallery/`)) {
          return imgPath.replace(`/${productSlug}/gallery/`, `/${productSlug}/detail/`);
        }
        // 이미 detail 경로이거나 다른 형식인 경우 그대로 유지
        return imgPath;
      });

      // 또는 gallery 파일명으로 직접 경로 생성
      if (newDetailImages.length === 0) {
        newDetailImages.push(...galleryFiles.map(file => 
          `originals/products/${productSlug}/detail/${file.name}`
        ));
      }

      const { error: updateError } = await supabase
        .from('products')
        .update({
          detail_images: newDetailImages,
          updated_at: new Date().toISOString()
        })
        .eq('id', product.id);

      if (updateError) {
        console.error(`   ❌ 업데이트 실패: ${updateError.message}`);
        results.errors.push({ step: 'update_db', error: updateError.message });
      } else {
        console.log(`   ✅ 업데이트 완료`);
        console.log(`      - 새로운 detail_images: ${newDetailImages.length}개`);
        results.dbUpdated = true;
      }
    } else {
      console.log(`   ⚠️  gallery 이미지가 없어 detail_images를 업데이트할 수 없습니다.`);
    }

  } catch (error) {
    console.error(`❌ 오류 발생: ${error.message}`);
    results.errors.push({ step: 'general', error: error.message });
  }

  // 결과 저장
  const outputPath = path.join(__dirname, 'v3-detail-to-gallery-replacement-result.json');
  fs.writeFileSync(outputPath, JSON.stringify(results, null, 2));

  // 요약 출력
  console.log('\n' + '='.repeat(50));
  console.log('📊 작업 요약');
  console.log('='.repeat(50));
  console.log(`   - detail 폴더 삭제: ${results.detailDeleted.length}개`);
  console.log(`   - gallery → detail 복사: ${results.galleryMoved.length}개`);
  console.log(`   - DB 업데이트: ${results.dbUpdated ? '완료' : '실패'}`);
  console.log(`   - 오류: ${results.errors.length}개`);

  if (results.errors.length > 0) {
    console.log('\n⚠️  오류 목록:');
    results.errors.forEach((err, index) => {
      console.log(`   ${index + 1}. ${err.step || err.file || '알 수 없음'}: ${err.error}`);
    });
  }

  console.log(`\n✅ 결과가 ${outputPath}에 저장되었습니다.`);
  console.log('\n✅ v3 제품 detail 이미지 교체 완료!');

  return results;
}

replaceV3DetailWithGallery();

