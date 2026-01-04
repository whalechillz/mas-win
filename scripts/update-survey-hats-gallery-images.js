/**
 * Survey 페이지용 모자 제품 gallery_images 업데이트
 * 색상별 폴더에서 이미지를 가져와서 products 테이블의 gallery_images 업데이트
 */

require('dotenv').config({ path: '.env.local' });

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Supabase 환경 변수가 설정되지 않았습니다.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);
const STORAGE_BUCKET = 'blog-images';

const results = {
  bucketHatBlack: { found: 0, updated: false, images: [] },
  bucketHatWhite: { found: 0, updated: false, images: [] },
  golfHatBlack: { found: 0, updated: false, images: [] },
  golfHatWhite: { found: 0, updated: false, images: [] },
  golfHatNavy: { found: 0, updated: false, images: [] },
  golfHatBeige: { found: 0, updated: false, images: [] },
  errors: []
};

/**
 * 폴더의 모든 이미지 파일 조회
 */
async function listGalleryImages(folderPath) {
  try {
    const allFiles = [];
    let offset = 0;
    const batchSize = 1000;

    while (true) {
      const { data: files, error } = await supabase.storage
        .from(STORAGE_BUCKET)
        .list(folderPath, {
          limit: batchSize,
          offset: offset,
          sortBy: { column: 'name', order: 'asc' }
        });

      if (error) {
        throw error;
      }

      if (!files || files.length === 0) {
        break;
      }

      // 이미지 파일만 필터링 (폴더 제외, .keep.png 제외)
      const imageFiles = files
        .filter(file => file.id !== null) // 폴더 제외
        .filter(file => {
          const ext = file.name.toLowerCase();
          return (ext.endsWith('.webp') || ext.endsWith('.png') || ext.endsWith('.jpg') || ext.endsWith('.jpeg')) &&
                 !file.name.toLowerCase().includes('.keep');
        })
        .map(file => `${folderPath}/${file.name}`);

      allFiles.push(...imageFiles);
      offset += batchSize;

      if (files.length < batchSize) {
        break;
      }
    }

    return allFiles.sort();
  } catch (error) {
    console.error(`❌ 폴더 조회 실패: ${folderPath}`, error.message);
    return [];
  }
}

/**
 * 제품의 gallery_images 업데이트
 */
async function updateProductGalleryImages(sku, folderPath, productName) {
  try {
    console.log(`\n📦 ${productName} (${sku}) 업데이트 중...`);
    console.log(`   📁 폴더: ${folderPath}`);

    // 1. 폴더에서 이미지 목록 가져오기
    const images = await listGalleryImages(folderPath);
    console.log(`   📋 발견된 이미지: ${images.length}개`);

    if (images.length === 0) {
      console.log(`   ⚠️ 이미지가 없습니다.`);
      return { success: false, reason: 'no_images' };
    }

    // 2. products 테이블에서 제품 찾기
    const { data: product, error: findError } = await supabase
      .from('products')
      .select('id, name, sku, slug, gallery_images')
      .eq('sku', sku)
      .eq('is_active', true)
      .maybeSingle();

    if (findError) {
      throw findError;
    }

    if (!product) {
      console.log(`   ⚠️ 제품을 찾을 수 없습니다: ${sku}`);
      return { success: false, reason: 'product_not_found' };
    }

    console.log(`   ✅ 제품 발견: ${product.name} (ID: ${product.id})`);

    // 3. gallery_images 업데이트
    const { error: updateError } = await supabase
      .from('products')
      .update({
        gallery_images: images,
        updated_at: new Date().toISOString()
      })
      .eq('id', product.id);

    if (updateError) {
      throw updateError;
    }

    console.log(`   ✅ gallery_images 업데이트 완료: ${images.length}개 이미지`);

    return { success: true, images, productId: product.id };
  } catch (error) {
    console.error(`   ❌ 업데이트 실패:`, error.message);
    return { success: false, error: error.message };
  }
}

/**
 * 메인 실행 함수
 */
async function main() {
  console.log('🚀 Survey 페이지용 모자 제품 gallery_images 업데이트 시작...\n');
  console.log('='.repeat(60));

  try {
    // 1. 버킷햇 블랙
    const bucketBlackResult = await updateProductGalleryImages(
      'MZ_BUCKET_BLACK',
      'originals/goods/bucket-hat-muziik-black/gallery',
      'MASSGOO × MUZIIK 스타일리시 버킷햇(블랙)'
    );
    if (bucketBlackResult.success) {
      results.bucketHatBlack.found = bucketBlackResult.images.length;
      results.bucketHatBlack.updated = true;
      results.bucketHatBlack.images = bucketBlackResult.images;
    } else {
      results.errors.push({ sku: 'MZ_BUCKET_BLACK', error: bucketBlackResult.error || bucketBlackResult.reason });
    }

    // 2. 버킷햇 화이트
    const bucketWhiteResult = await updateProductGalleryImages(
      'MZ_BUCKET_WHITE',
      'originals/goods/bucket-hat-muziik-white/gallery',
      'MASSGOO × MUZIIK 스타일리시 버킷햇(화이트)'
    );
    if (bucketWhiteResult.success) {
      results.bucketHatWhite.found = bucketWhiteResult.images.length;
      results.bucketHatWhite.updated = true;
      results.bucketHatWhite.images = bucketWhiteResult.images;
    } else {
      results.errors.push({ sku: 'MZ_BUCKET_WHITE', error: bucketWhiteResult.error || bucketWhiteResult.reason });
    }

    // 3. 골프모자 블랙
    const golfBlackResult = await updateProductGalleryImages(
      'MZ_CAP_BLACK',
      'originals/goods/golf-hat-muziik-black/gallery',
      'MASSGOO × MUZIIK 콜라보 골프모자 (블랙)'
    );
    if (golfBlackResult.success) {
      results.golfHatBlack.found = golfBlackResult.images.length;
      results.golfHatBlack.updated = true;
      results.golfHatBlack.images = golfBlackResult.images;
    } else {
      results.errors.push({ sku: 'MZ_CAP_BLACK', error: golfBlackResult.error || golfBlackResult.reason });
    }

    // 4. 골프모자 화이트
    const golfWhiteResult = await updateProductGalleryImages(
      'MZ_CAP_WHITE',
      'originals/goods/golf-hat-muziik-white/gallery',
      'MASSGOO × MUZIIK 콜라보 골프모자 (화이트)'
    );
    if (golfWhiteResult.success) {
      results.golfHatWhite.found = golfWhiteResult.images.length;
      results.golfHatWhite.updated = true;
      results.golfHatWhite.images = golfWhiteResult.images;
    } else {
      results.errors.push({ sku: 'MZ_CAP_WHITE', error: golfWhiteResult.error || golfWhiteResult.reason });
    }

    // 5. 골프모자 네이비
    const golfNavyResult = await updateProductGalleryImages(
      'MZ_CAP_NAVY',
      'originals/goods/golf-hat-muziik-navy/gallery',
      'MASSGOO × MUZIIK 콜라보 골프모자 (네이비)'
    );
    if (golfNavyResult.success) {
      results.golfHatNavy.found = golfNavyResult.images.length;
      results.golfHatNavy.updated = true;
      results.golfHatNavy.images = golfNavyResult.images;
    } else {
      results.errors.push({ sku: 'MZ_CAP_NAVY', error: golfNavyResult.error || golfNavyResult.reason });
    }

    // 6. 골프모자 베이지
    const golfBeigeResult = await updateProductGalleryImages(
      'MZ_CAP_BEIGE',
      'originals/goods/golf-hat-muziik-beige/gallery',
      'MASSGOO × MUZIIK 콜라보 골프모자 (베이지)'
    );
    if (golfBeigeResult.success) {
      results.golfHatBeige.found = golfBeigeResult.images.length;
      results.golfHatBeige.updated = true;
      results.golfHatBeige.images = golfBeigeResult.images;
    } else {
      results.errors.push({ sku: 'MZ_CAP_BEIGE', error: golfBeigeResult.error || golfBeigeResult.reason });
    }

    // 결과 저장
    const resultPath = path.join(__dirname, 'update-survey-hats-gallery-images-result.json');
    fs.writeFileSync(resultPath, JSON.stringify(results, null, 2));
    console.log(`\n📄 결과 저장: ${resultPath}`);

    // 최종 요약
    console.log('\n' + '='.repeat(60));
    console.log('✅ Survey 제품 gallery_images 업데이트 완료!\n');
    console.log('📊 작업 요약:');
    console.log(`   버킷햇 블랙: ${results.bucketHatBlack.found}개 이미지 ${results.bucketHatBlack.updated ? '✅' : '❌'}`);
    console.log(`   버킷햇 화이트: ${results.bucketHatWhite.found}개 이미지 ${results.bucketHatWhite.updated ? '✅' : '❌'}`);
    console.log(`   골프모자 블랙: ${results.golfHatBlack.found}개 이미지 ${results.golfHatBlack.updated ? '✅' : '❌'}`);
    console.log(`   골프모자 화이트: ${results.golfHatWhite.found}개 이미지 ${results.golfHatWhite.updated ? '✅' : '❌'}`);
    console.log(`   골프모자 네이비: ${results.golfHatNavy.found}개 이미지 ${results.golfHatNavy.updated ? '✅' : '❌'}`);
    console.log(`   골프모자 베이지: ${results.golfHatBeige.found}개 이미지 ${results.golfHatBeige.updated ? '✅' : '❌'}`);
    
    if (results.errors.length > 0) {
      console.log(`\n⚠️ 오류 발생: ${results.errors.length}개`);
      results.errors.forEach(err => {
        console.log(`   - ${err.sku}: ${err.error}`);
      });
    } else {
      console.log('\n✨ 모든 작업이 성공적으로 완료되었습니다!');
    }

    // 총 이미지 수 계산
    const totalImages = 
      results.bucketHatBlack.found +
      results.bucketHatWhite.found +
      results.golfHatBlack.found +
      results.golfHatWhite.found +
      results.golfHatNavy.found +
      results.golfHatBeige.found;
    
    console.log(`\n📸 총 ${totalImages}개 이미지가 업데이트되었습니다.`);

  } catch (error) {
    console.error('\n❌ 치명적 오류:', error);
    process.exit(1);
  }
}

// 실행
main();

