/**
 * 클러치백 제품 이미지 정리 및 DB 업데이트
 * 1. composition 폴더 정리 (front.webp, back.webp만 유지)
 * 2. gallery 폴더 이미지 삭제
 * 3. DB 업데이트 (reference_images에서 front 제거, back만 유지)
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
  {
    slug: 'massgoo-muziik-clutch-beige',
    keepFiles: ['massgoo-muziik-clutch-beige-front.webp', 'massgoo-muziik-clutch-beige-back.webp']
  },
  {
    slug: 'massgoo-muziik-clutch-gray',
    keepFiles: ['massgoo-muziik-clutch-gray-front.webp', 'massgoo-muziik-clutch-gray-back.webp']
  }
];

async function cleanupClutchBagImages() {
  console.log('🧹 클러치백 제품 이미지 정리 시작...\n');

  const results = {
    products: {},
    summary: {
      compositionFilesDeleted: 0,
      galleryFilesDeleted: 0,
      dbUpdated: 0,
      errors: 0
    }
  };

  for (const product of products) {
    console.log(`\n📦 처리 중: ${product.slug}`);
    console.log('─'.repeat(50));

    const productResult = {
      slug: product.slug,
      compositionDeleted: [],
      galleryDeleted: [],
      dbUpdated: false,
      errors: []
    };

    // 1. composition 폴더 정리
    console.log('1️⃣ composition 폴더 정리 중...');
    try {
      const compositionPath = `originals/products/goods/${product.slug}/composition`;
      const { data: files, error } = await supabase.storage
        .from('blog-images')
        .list(compositionPath, { limit: 100 });

      if (error) {
        console.error(`   ❌ 파일 목록 조회 실패: ${error.message}`);
        productResult.errors.push({ step: 'list_composition', error: error.message });
      } else if (files) {
        for (const file of files) {
          // 유지할 파일인지 확인 (정확한 파일명 매칭)
          const shouldKeep = product.keepFiles.some(keepFile => 
            file.name === keepFile
          );

          if (!shouldKeep) {
            const filePath = `${compositionPath}/${file.name}`;
            const { error: deleteError } = await supabase.storage
              .from('blog-images')
              .remove([filePath]);

            if (deleteError) {
              console.error(`   ❌ 삭제 실패 (${file.name}): ${deleteError.message}`);
              productResult.errors.push({ file: file.name, error: deleteError.message });
              results.summary.errors++;
            } else {
              console.log(`   ✅ 삭제: ${file.name}`);
              productResult.compositionDeleted.push(file.name);
              results.summary.compositionFilesDeleted++;
            }
          } else {
            console.log(`   ✅ 유지: ${file.name}`);
          }
        }
      }
    } catch (error) {
      console.error(`   ❌ 오류: ${error.message}`);
      productResult.errors.push({ step: 'cleanup_composition', error: error.message });
      results.summary.errors++;
    }

    // 2. gallery 폴더 이미지 삭제
    console.log('\n2️⃣ gallery 폴더 이미지 삭제 중...');
    try {
      const galleryPath = `originals/products/goods/${product.slug}/gallery`;
      const { data: files, error } = await supabase.storage
        .from('blog-images')
        .list(galleryPath, { limit: 100 });

      if (error) {
        console.error(`   ❌ 파일 목록 조회 실패: ${error.message}`);
        productResult.errors.push({ step: 'list_gallery', error: error.message });
        results.summary.errors++;
      } else if (files && files.length > 0) {
        for (const file of files) {
          const filePath = `${galleryPath}/${file.name}`;
          const { error: deleteError } = await supabase.storage
            .from('blog-images')
            .remove([filePath]);

          if (deleteError) {
            console.error(`   ❌ 삭제 실패 (${file.name}): ${deleteError.message}`);
            productResult.errors.push({ file: file.name, error: deleteError.message });
            results.summary.errors++;
          } else {
            console.log(`   ✅ 삭제: ${file.name}`);
            productResult.galleryDeleted.push(file.name);
            results.summary.galleryFilesDeleted++;
          }
        }
      } else {
        console.log(`   ℹ️  gallery 폴더가 비어있거나 없습니다.`);
      }
    } catch (error) {
      console.error(`   ❌ 오류: ${error.message}`);
      productResult.errors.push({ step: 'cleanup_gallery', error: error.message });
      results.summary.errors++;
    }

    // 3. 데이터베이스 업데이트
    console.log('\n3️⃣ 데이터베이스 업데이트 중...');
    try {
      const { data: productData, error: fetchError } = await supabase
        .from('product_composition')
        .select('id, name, slug, image_url, reference_images')
        .eq('slug', product.slug)
        .maybeSingle();

      if (fetchError) {
        console.error(`   ❌ 제품 조회 실패: ${fetchError.message}`);
        productResult.errors.push({ step: 'fetch_product', error: fetchError.message });
        results.summary.errors++;
      } else if (productData) {
        // reference_images에서 front 제거 (back만 남기기)
        const currentRefs = Array.isArray(productData.reference_images) 
          ? [...productData.reference_images] 
          : [];

        // back 이미지만 필터링
        const backImage = currentRefs.find(img => 
          img && (img.includes('-back.webp') || img.includes('back.webp'))
        );

        // back 이미지 경로 생성 (확실하게)
        const backFileName = product.keepFiles.find(f => f.includes('back'));
        const backImagePath = `originals/products/goods/${product.slug}/composition/${backFileName}`;
        
        const newReferenceImages = backImagePath ? [backImagePath] : [];

        // image_url은 front로 설정
        const frontFileName = product.keepFiles.find(f => f.includes('front'));
        const newImageUrl = `originals/products/goods/${product.slug}/composition/${frontFileName}`;

        console.log(`   📝 업데이트 내용:`);
        console.log(`      - image_url: ${newImageUrl}`);
        console.log(`      - reference_images: ${newReferenceImages.length}개 (back만)`);

        const { error: updateError } = await supabase
          .from('product_composition')
          .update({
            image_url: newImageUrl,
            reference_images: newReferenceImages,
            updated_at: new Date().toISOString()
          })
          .eq('id', productData.id);

        if (updateError) {
          console.error(`   ❌ 업데이트 실패: ${updateError.message}`);
          productResult.errors.push({ step: 'update_db', error: updateError.message });
          results.summary.errors++;
        } else {
          console.log(`   ✅ 업데이트 완료`);
          productResult.dbUpdated = true;
          results.summary.dbUpdated++;
        }
      } else {
        console.log(`   ⚠️  제품을 찾을 수 없습니다.`);
        productResult.errors.push({ step: 'fetch_product', error: '제품을 찾을 수 없음' });
        results.summary.errors++;
      }
    } catch (error) {
      console.error(`   ❌ 오류: ${error.message}`);
      productResult.errors.push({ step: 'update_db', error: error.message });
      results.summary.errors++;
    }

    results.products[product.slug] = productResult;
  }

  // 결과 저장
  const outputPath = path.join(__dirname, 'clutch-bag-cleanup-result.json');
  fs.writeFileSync(outputPath, JSON.stringify(results, null, 2));

  // 요약 출력
  console.log('\n' + '='.repeat(50));
  console.log('📊 작업 요약');
  console.log('='.repeat(50));
  console.log(`   - composition 폴더 삭제: ${results.summary.compositionFilesDeleted}개`);
  console.log(`   - gallery 폴더 삭제: ${results.summary.galleryFilesDeleted}개`);
  console.log(`   - DB 업데이트: ${results.summary.dbUpdated}개`);
  console.log(`   - 오류: ${results.summary.errors}개`);
  console.log(`\n✅ 결과가 ${outputPath}에 저장되었습니다.`);
  console.log('\n✅ 클러치백 제품 정리 완료!');
}

cleanupClutchBagImages();

