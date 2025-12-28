/**
 * black-beryl 제품 이미지 문제 해결 스크립트
 * 
 * 1. products 테이블의 detail_images에 massgoo_sw_black_muz_01_n.webp 추가
 * 2. product_composition 테이블의 reference_images 경로를 새로운 형식으로 업데이트 (필요시)
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

async function fixBlackBerylImages() {
  console.log('🔧 black-beryl 제품 이미지 문제 해결 시작...\n');

  try {
    // 1. products 테이블에서 black-beryl 제품 조회
    console.log('1️⃣ products 테이블에서 black-beryl 제품 조회...');
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('*')
      .eq('slug', 'black-beryl')
      .single();

    if (productError || !product) {
      console.error('❌ products 조회 오류:', productError);
      return;
    }

    console.log('✅ 제품 발견:', product.name);
    console.log('   - 현재 detail_images 개수:', Array.isArray(product.detail_images) ? product.detail_images.length : 0);

    // massgoo_sw_black_muz_01_n.webp가 이미 있는지 확인
    const has01N = Array.isArray(product.detail_images) && 
      product.detail_images.some(img => img.includes('massgoo_sw_black_muz_01_n.webp'));

    if (has01N) {
      console.log('✅ massgoo_sw_black_muz_01_n.webp가 이미 detail_images에 있습니다.');
    } else {
      console.log('⚠️ massgoo_sw_black_muz_01_n.webp를 detail_images에 추가합니다...');
      
      // 새로운 경로 추가 (01.webp 다음에 배치)
      const currentImages = Array.isArray(product.detail_images) ? [...product.detail_images] : [];
      const newImagePath = 'originals/products/black-beryl/detail/massgoo_sw_black_muz_01_n.webp';
      
      // 01.webp 다음에 삽입 (01.webp가 있으면 그 다음, 없으면 맨 앞)
      const index01 = currentImages.findIndex(img => img.includes('massgoo_sw_black_muz_01.webp'));
      if (index01 >= 0) {
        currentImages.splice(index01 + 1, 0, newImagePath);
      } else {
        // 01.webp가 없으면 맨 앞에 추가
        currentImages.unshift(newImagePath);
      }

      // 중복 제거
      const uniqueImages = [...new Set(currentImages)];

      console.log('   - 업데이트할 detail_images:', uniqueImages.length, '개');
      
      // 데이터베이스 업데이트
      const { error: updateError } = await supabase
        .from('products')
        .update({ detail_images: uniqueImages })
        .eq('id', product.id);

      if (updateError) {
        console.error('❌ detail_images 업데이트 오류:', updateError);
        return;
      }

      console.log('✅ detail_images 업데이트 완료!');
      console.log('   - 새로운 detail_images 개수:', uniqueImages.length);
    }

    console.log('');

    // 2. product_composition 테이블의 reference_images 경로 확인 및 업데이트
    console.log('2️⃣ product_composition 테이블 확인...');
    const { data: compositionProduct, error: compositionError } = await supabase
      .from('product_composition')
      .select('*')
      .eq('slug', 'black-beryl')
      .single();

    if (compositionError || !compositionProduct) {
      console.error('❌ product_composition 조회 오류:', compositionError);
      return;
    }

    console.log('✅ 제품 합성 데이터 발견:', compositionProduct.name);
    console.log('   - 현재 image_url:', compositionProduct.image_url);
    console.log('   - 현재 reference_images:', JSON.stringify(compositionProduct.reference_images, null, 2));

    // 경로가 구식 형식(/main/products/...)인지 확인
    const needsUpdate = 
      compositionProduct.image_url?.startsWith('/main/products/') ||
      (Array.isArray(compositionProduct.reference_images) && 
       compositionProduct.reference_images.some(img => img.startsWith('/main/products/')));

    if (needsUpdate) {
      console.log('⚠️ 구식 경로를 새로운 형식으로 업데이트합니다...');
      
      // image_url 업데이트
      let newImageUrl = compositionProduct.image_url;
      if (newImageUrl?.startsWith('/main/products/black-beryl/')) {
        // composition 이미지는 composition 폴더로
        if (newImageUrl.includes('sole-500') || newImageUrl.includes('composition')) {
          newImageUrl = newImageUrl.replace('/main/products/black-beryl/', 'originals/products/black-beryl/composition/');
        } else {
          newImageUrl = newImageUrl.replace('/main/products/black-beryl/', 'originals/products/black-beryl/detail/');
        }
      }

      // reference_images 업데이트
      let newReferenceImages = Array.isArray(compositionProduct.reference_images) 
        ? [...compositionProduct.reference_images] 
        : [];
      
      newReferenceImages = newReferenceImages.map(img => {
        if (img.startsWith('/main/products/black-beryl/')) {
          return img.replace('/main/products/black-beryl/', 'originals/products/black-beryl/detail/');
        }
        return img;
      });

      console.log('   - 새로운 image_url:', newImageUrl);
      console.log('   - 새로운 reference_images:', JSON.stringify(newReferenceImages, null, 2));

      // 데이터베이스 업데이트
      const { error: updateCompError } = await supabase
        .from('product_composition')
        .update({
          image_url: newImageUrl,
          reference_images: newReferenceImages,
          updated_at: new Date().toISOString()
        })
        .eq('id', compositionProduct.id);

      if (updateCompError) {
        console.error('❌ product_composition 업데이트 오류:', updateCompError);
        return;
      }

      console.log('✅ product_composition 경로 업데이트 완료!');
    } else {
      console.log('✅ 경로가 이미 새로운 형식입니다.');
    }

    console.log('');

    // 3. 루트 폴더 파일 확인 (이미 정리되었는지 확인)
    console.log('3️⃣ 루트 폴더 파일 확인...');
    const { data: rootFiles, error: rootError } = await supabase.storage
      .from('blog-images')
      .list('black-beryl', {
        limit: 100
      });

    if (rootError) {
      console.error('❌ 루트 폴더 조회 오류:', rootError);
    } else {
      const rootFileList = rootFiles || [];
      console.log(`   - 루트 폴더 파일 개수: ${rootFileList.length}개`);
      
      if (rootFileList.length > 0) {
        console.log('   ⚠️ 루트 폴더에 파일이 있습니다:');
        rootFileList.forEach(file => {
          console.log(`     * ${file.name}`);
        });
        console.log('   💡 이 파일들은 데이터베이스에서 참조되지 않으면 삭제할 수 있습니다.');
      } else {
        console.log('   ✅ 루트 폴더가 비어있습니다 (이미 정리됨).');
      }
    }

    console.log('\n✅ 모든 작업 완료!');

  } catch (error) {
    console.error('❌ 스크립트 실행 오류:', error);
    process.exit(1);
  }
}

fixBlackBerylImages();

