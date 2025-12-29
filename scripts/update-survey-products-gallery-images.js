/**
 * 설문 페이지 제품 갤러리 이미지 업데이트
 * Supabase Storage의 갤러리 폴더에서 이미지를 가져와 products 테이블에 저장
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

async function updateSurveyProductsGalleryImages() {
  console.log('🔄 설문 제품 갤러리 이미지 업데이트 시작...\n');

  const results = {
    bucketHat: { success: false, images: [], errors: [] },
    golfHat: { success: false, images: [], errors: [] }
  };

  // 1. 버킷햇 갤러리 이미지 가져오기
  console.log('1️⃣ 버킷햇 갤러리 이미지 조회 중...');
  try {
    const { data: bucketFiles, error: bucketError } = await supabase.storage
      .from('blog-images')
      .list('originals/products/goods/bucket-hat-muziik/gallery', {
        limit: 100,
        sortBy: { column: 'name', order: 'asc' }
      });

    if (bucketError) {
      console.error('   ❌ 버킷햇 이미지 목록 조회 실패:', bucketError.message);
      results.bucketHat.errors.push({ step: 'list_files', error: bucketError.message });
    } else {
      // .webp 파일만 필터링하고 정렬
      const bucketImages = bucketFiles
        .filter(file => file.name.endsWith('.webp'))
        .map(file => `originals/products/goods/bucket-hat-muziik/gallery/${file.name}`)
        .sort();

      console.log(`   ✅ 버킷햇 이미지 ${bucketImages.length}개 발견`);
      console.log(`   이미지 목록:`, bucketImages.slice(0, 5).join(', '), bucketImages.length > 5 ? '...' : '');
      results.bucketHat.images = bucketImages;

      // products 테이블 업데이트
      const { data: existingBucket, error: fetchError } = await supabase
        .from('products')
        .select('id')
        .eq('slug', 'bucket-hat-muziik')
        .maybeSingle();

      if (fetchError && fetchError.code !== 'PGRST116') {
        console.error('   ❌ 제품 조회 실패:', fetchError.message);
        results.bucketHat.errors.push({ step: 'fetch_product', error: fetchError.message });
      } else {
        const bucketData = {
          name: 'MASSGOO X MUZIIK 버킷햇',
          slug: 'bucket-hat-muziik',
          sku: 'BUCKET_HAT_MUZIIK',
          category: 'bucket_hat',
          product_type: 'goods',
          is_gift: true,
          is_sellable: false,
          is_active: true,
          gallery_images: bucketImages,
          updated_at: new Date().toISOString()
        };

        if (existingBucket) {
          // 업데이트
          const { error: updateError } = await supabase
            .from('products')
            .update(bucketData)
            .eq('id', existingBucket.id);

          if (updateError) {
            console.error('   ❌ 제품 업데이트 실패:', updateError.message);
            results.bucketHat.errors.push({ step: 'update', error: updateError.message });
          } else {
            console.log('   ✅ 버킷햇 제품 업데이트 완료');
            results.bucketHat.success = true;
          }
        } else {
          // 신규 등록
          const { error: insertError } = await supabase
            .from('products')
            .insert(bucketData);

          if (insertError) {
            console.error('   ❌ 제품 등록 실패:', insertError.message);
            results.bucketHat.errors.push({ step: 'insert', error: insertError.message });
          } else {
            console.log('   ✅ 버킷햇 제품 등록 완료');
            results.bucketHat.success = true;
          }
        }
      }
    }
  } catch (error) {
    console.error('   ❌ 오류:', error.message);
    results.bucketHat.errors.push({ step: 'general', error: error.message });
  }

  // 2. 골프모자 갤러리 이미지 가져오기
  console.log('\n2️⃣ 골프모자 갤러리 이미지 조회 중...');
  try {
    const { data: golfFiles, error: golfError } = await supabase.storage
      .from('blog-images')
      .list('originals/products/goods/golf-hat-muziik/gallery', {
        limit: 100,
        sortBy: { column: 'name', order: 'asc' }
      });

    if (golfError) {
      console.error('   ❌ 골프모자 이미지 목록 조회 실패:', golfError.message);
      results.golfHat.errors.push({ step: 'list_files', error: golfError.message });
    } else {
      // .webp 파일만 필터링하고 정렬
      const golfImages = golfFiles
        .filter(file => file.name.endsWith('.webp'))
        .map(file => `originals/products/goods/golf-hat-muziik/gallery/${file.name}`)
        .sort();

      console.log(`   ✅ 골프모자 이미지 ${golfImages.length}개 발견`);
      console.log(`   이미지 목록:`, golfImages.slice(0, 5).join(', '), golfImages.length > 5 ? '...' : '');
      results.golfHat.images = golfImages;

      // products 테이블 업데이트
      const { data: existingGolf, error: fetchError } = await supabase
        .from('products')
        .select('id')
        .eq('slug', 'golf-hat-muziik')
        .maybeSingle();

      if (fetchError && fetchError.code !== 'PGRST116') {
        console.error('   ❌ 제품 조회 실패:', fetchError.message);
        results.golfHat.errors.push({ step: 'fetch_product', error: fetchError.message });
      } else {
        const golfData = {
          name: 'MASSGOO X MUZIIK 골프모자',
          slug: 'golf-hat-muziik',
          sku: 'GOLF_HAT_MUZIIK',
          category: 'cap',
          product_type: 'goods',
          is_gift: true,
          is_sellable: false,
          is_active: true,
          gallery_images: golfImages,
          updated_at: new Date().toISOString()
        };

        if (existingGolf) {
          // 업데이트
          const { error: updateError } = await supabase
            .from('products')
            .update(golfData)
            .eq('id', existingGolf.id);

          if (updateError) {
            console.error('   ❌ 제품 업데이트 실패:', updateError.message);
            results.golfHat.errors.push({ step: 'update', error: updateError.message });
          } else {
            console.log('   ✅ 골프모자 제품 업데이트 완료');
            results.golfHat.success = true;
          }
        } else {
          // 신규 등록
          const { error: insertError } = await supabase
            .from('products')
            .insert(golfData);

          if (insertError) {
            console.error('   ❌ 제품 등록 실패:', insertError.message);
            results.golfHat.errors.push({ step: 'insert', error: insertError.message });
          } else {
            console.log('   ✅ 골프모자 제품 등록 완료');
            results.golfHat.success = true;
          }
        }
      }
    }
  } catch (error) {
    console.error('   ❌ 오류:', error.message);
    results.golfHat.errors.push({ step: 'general', error: error.message });
  }

  // 결과 저장
  const outputPath = path.join(__dirname, 'survey-products-gallery-update-result.json');
  fs.writeFileSync(outputPath, JSON.stringify(results, null, 2));

  // 요약 출력
  console.log('\n' + '='.repeat(50));
  console.log('📊 작업 요약');
  console.log('='.repeat(50));
  console.log(`   - 버킷햇: ${results.bucketHat.success ? '✅ 성공' : '❌ 실패'} (${results.bucketHat.images.length}개 이미지)`);
  console.log(`   - 골프모자: ${results.golfHat.success ? '✅ 성공' : '❌ 실패'} (${results.golfHat.images.length}개 이미지)`);
  console.log(`   - 총 오류: ${results.bucketHat.errors.length + results.golfHat.errors.length}개`);

  if (results.bucketHat.errors.length > 0 || results.golfHat.errors.length > 0) {
    console.log('\n⚠️  오류 목록:');
    [...results.bucketHat.errors, ...results.golfHat.errors].forEach((err, index) => {
      console.log(`   ${index + 1}. ${err.step}: ${err.error}`);
    });
  }

  console.log(`\n✅ 결과가 ${outputPath}에 저장되었습니다.`);
  console.log('\n✅ 설문 제품 갤러리 이미지 업데이트 완료!');
}

updateSurveyProductsGalleryImages();

