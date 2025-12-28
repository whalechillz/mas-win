/**
 * black-beryl 제품 이미지 상태 점검 스크립트
 * 
 * 1. product_composition 테이블의 reference_images 확인
 * 2. products 테이블의 detail_images 확인
 * 3. Supabase Storage의 실제 파일 목록 확인
 * 4. 불일치 사항 리포트
 */

require('dotenv').config({ path: '.env.local' });

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ 환경 변수가 설정되지 않았습니다.');
  console.error('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '설정됨' : '없음');
  console.error('SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? '설정됨' : '없음');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkBlackBerylImages() {
  console.log('🔍 black-beryl 제품 이미지 상태 점검 시작...\n');

  const results = {
    productComposition: null,
    products: null,
    storageFiles: {
      root: [],
      detail: [],
      composition: []
    },
    issues: []
  };

  try {
    // 1. product_composition 테이블에서 black-beryl 제품 조회
    console.log('1️⃣ product_composition 테이블 조회 중...');
    const { data: compositionProduct, error: compositionError } = await supabase
      .from('product_composition')
      .select('*')
      .eq('slug', 'black-beryl')
      .single();

    if (compositionError) {
      console.error('❌ product_composition 조회 오류:', compositionError);
      results.issues.push(`product_composition 조회 실패: ${compositionError.message}`);
    } else if (compositionProduct) {
      results.productComposition = compositionProduct;
      console.log('✅ product_composition 데이터 발견:');
      console.log('   - ID:', compositionProduct.id);
      console.log('   - 이름:', compositionProduct.name);
      console.log('   - image_url:', compositionProduct.image_url);
      console.log('   - reference_images:', JSON.stringify(compositionProduct.reference_images, null, 2));
      console.log('   - reference_images 타입:', Array.isArray(compositionProduct.reference_images) ? '배열' : typeof compositionProduct.reference_images);
      console.log('   - reference_images 개수:', Array.isArray(compositionProduct.reference_images) ? compositionProduct.reference_images.length : 'N/A');
      
      if (!Array.isArray(compositionProduct.reference_images)) {
        results.issues.push('⚠️ reference_images가 배열이 아닙니다!');
      } else if (compositionProduct.reference_images.length === 0) {
        results.issues.push('⚠️ reference_images가 비어있습니다.');
      }
    } else {
      console.log('⚠️ product_composition에서 black-beryl 제품을 찾을 수 없습니다.');
      results.issues.push('product_composition에 black-beryl 제품이 없습니다.');
    }

    console.log('');

    // 2. products 테이블에서 black-beryl 제품 조회
    console.log('2️⃣ products 테이블 조회 중...');
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('*')
      .eq('slug', 'black-beryl')
      .single();

    if (productError) {
      console.error('❌ products 조회 오류:', productError);
      results.issues.push(`products 조회 실패: ${productError.message}`);
    } else if (product) {
      results.products = product;
      console.log('✅ products 데이터 발견:');
      console.log('   - ID:', product.id);
      console.log('   - 이름:', product.name);
      console.log('   - detail_images:', JSON.stringify(product.detail_images, null, 2));
      console.log('   - detail_images 타입:', Array.isArray(product.detail_images) ? '배열' : typeof product.detail_images);
      console.log('   - detail_images 개수:', Array.isArray(product.detail_images) ? product.detail_images.length : 'N/A');
      
      if (!Array.isArray(product.detail_images)) {
        results.issues.push('⚠️ detail_images가 배열이 아닙니다!');
      } else {
        // massgoo_sw_black_muz_01_n.webp 파일이 있는지 확인
        const has01N = product.detail_images.some(img => 
          img.includes('massgoo_sw_black_muz_01_n.webp') || 
          img.includes('massgoo_sw_black_muz_01_n')
        );
        if (!has01N) {
          results.issues.push('⚠️ detail_images에 massgoo_sw_black_muz_01_n.webp가 없습니다.');
        }
      }
    } else {
      console.log('⚠️ products에서 black-beryl 제품을 찾을 수 없습니다.');
      results.issues.push('products에 black-beryl 제품이 없습니다.');
    }

    console.log('');

    // 3. Supabase Storage의 실제 파일 목록 확인
    console.log('3️⃣ Supabase Storage 파일 목록 확인 중...');

    // 루트 폴더 (blog-images/black-beryl/)
    try {
      const { data: rootFiles, error: rootError } = await supabase.storage
        .from('blog-images')
        .list('black-beryl', {
          limit: 100,
          sortBy: { column: 'name', order: 'asc' }
        });

      if (rootError) {
        console.error('❌ 루트 폴더 조회 오류:', rootError);
        results.issues.push(`Storage 루트 폴더 조회 실패: ${rootError.message}`);
      } else {
        results.storageFiles.root = rootFiles || [];
        console.log(`✅ 루트 폴더 파일 ${results.storageFiles.root.length}개 발견:`);
        results.storageFiles.root.forEach(file => {
          console.log(`   - ${file.name} (${file.metadata?.size ? (file.metadata.size / 1024).toFixed(2) + ' KB' : '크기 정보 없음'})`);
        });
      }
    } catch (err) {
      console.error('❌ 루트 폴더 조회 예외:', err);
    }

    console.log('');

    // detail 폴더 (originals/products/black-beryl/detail/)
    try {
      const { data: detailFiles, error: detailError } = await supabase.storage
        .from('blog-images')
        .list('originals/products/black-beryl/detail', {
          limit: 100,
          sortBy: { column: 'name', order: 'asc' }
        });

      if (detailError) {
        console.error('❌ detail 폴더 조회 오류:', detailError);
        results.issues.push(`Storage detail 폴더 조회 실패: ${detailError.message}`);
      } else {
        results.storageFiles.detail = detailFiles || [];
        console.log(`✅ detail 폴더 파일 ${results.storageFiles.detail.length}개 발견:`);
        results.storageFiles.detail.forEach(file => {
          console.log(`   - ${file.name} (${file.metadata?.size ? (file.metadata.size / 1024).toFixed(2) + ' KB' : '크기 정보 없음'})`);
        });
      }
    } catch (err) {
      console.error('❌ detail 폴더 조회 예외:', err);
    }

    console.log('');

    // composition 폴더 (originals/products/black-beryl/composition/)
    try {
      const { data: compositionFiles, error: compositionError } = await supabase.storage
        .from('blog-images')
        .list('originals/products/black-beryl/composition', {
          limit: 100,
          sortBy: { column: 'name', order: 'asc' }
        });

      if (compositionError) {
        console.error('❌ composition 폴더 조회 오류:', compositionError);
        results.issues.push(`Storage composition 폴더 조회 실패: ${compositionError.message}`);
      } else {
        results.storageFiles.composition = compositionFiles || [];
        console.log(`✅ composition 폴더 파일 ${results.storageFiles.composition.length}개 발견:`);
        results.storageFiles.composition.forEach(file => {
          console.log(`   - ${file.name} (${file.metadata?.size ? (file.metadata.size / 1024).toFixed(2) + ' KB' : '크기 정보 없음'})`);
        });
      }
    } catch (err) {
      console.error('❌ composition 폴더 조회 예외:', err);
    }

    console.log('');

    // 4. 불일치 사항 분석
    console.log('4️⃣ 불일치 사항 분석...\n');

    if (results.products && Array.isArray(results.products.detail_images)) {
      const dbDetailImages = results.products.detail_images;
      const storageDetailFiles = results.storageFiles.detail.map(f => f.name);
      
      // 데이터베이스에 있지만 Storage에 없는 파일
      const missingInStorage = dbDetailImages.filter(dbPath => {
        const fileName = dbPath.split('/').pop();
        return !storageDetailFiles.includes(fileName);
      });
      
      if (missingInStorage.length > 0) {
        console.log('⚠️ 데이터베이스에 있지만 Storage에 없는 파일:');
        missingInStorage.forEach(path => console.log(`   - ${path}`));
        results.issues.push(`${missingInStorage.length}개 파일이 데이터베이스에만 있습니다.`);
      }

      // Storage에 있지만 데이터베이스에 없는 파일
      const missingInDB = storageDetailFiles.filter(fileName => {
        return !dbDetailImages.some(dbPath => dbPath.includes(fileName));
      });
      
      if (missingInDB.length > 0) {
        console.log('⚠️ Storage에 있지만 데이터베이스에 없는 파일:');
        missingInDB.forEach(file => console.log(`   - ${file}`));
        results.issues.push(`${missingInDB.length}개 파일이 Storage에만 있습니다.`);
      }

      // massgoo_sw_black_muz_01_n.webp 확인
      const has01NInStorage = storageDetailFiles.some(f => f.includes('massgoo_sw_black_muz_01_n'));
      const has01NInDB = dbDetailImages.some(p => p.includes('massgoo_sw_black_muz_01_n'));
      
      console.log('');
      console.log('📋 massgoo_sw_black_muz_01_n.webp 상태:');
      console.log(`   - Storage에 존재: ${has01NInStorage ? '✅' : '❌'}`);
      console.log(`   - DB에 존재: ${has01NInDB ? '✅' : '❌'}`);
      
      if (has01NInStorage && !has01NInDB) {
        results.issues.push('⚠️ massgoo_sw_black_muz_01_n.webp가 Storage에는 있지만 DB에 없습니다.');
      }
    }

    // 루트 파일들이 데이터베이스에서 참조되는지 확인
    if (results.storageFiles.root.length > 0) {
      console.log('');
      console.log('📋 루트 폴더 파일 참조 확인:');
      const rootFileNames = results.storageFiles.root.map(f => f.name);
      let referencedCount = 0;
      let unreferencedFiles = [];

      rootFileNames.forEach(fileName => {
        let isReferenced = false;
        
        // product_composition에서 참조 확인
        if (results.productComposition) {
          if (results.productComposition.image_url && results.productComposition.image_url.includes(fileName)) {
            isReferenced = true;
          }
          if (Array.isArray(results.productComposition.reference_images)) {
            if (results.productComposition.reference_images.some(img => img.includes(fileName))) {
              isReferenced = true;
            }
          }
        }
        
        // products에서 참조 확인
        if (results.products && Array.isArray(results.products.detail_images)) {
          if (results.products.detail_images.some(img => img.includes(fileName))) {
            isReferenced = true;
          }
        }

        if (isReferenced) {
          referencedCount++;
        } else {
          unreferencedFiles.push(fileName);
        }
      });

      console.log(`   - 참조되는 파일: ${referencedCount}개`);
      console.log(`   - 참조되지 않는 파일: ${unreferencedFiles.length}개`);
      
      if (unreferencedFiles.length > 0) {
        console.log('   - 참조되지 않는 파일 목록:');
        unreferencedFiles.forEach(file => console.log(`     * ${file}`));
        results.issues.push(`루트 폴더에 참조되지 않는 파일 ${unreferencedFiles.length}개가 있습니다.`);
      }
    }

    // 결과 저장
    const outputPath = path.join(__dirname, 'black-beryl-images-check-result.json');
    fs.writeFileSync(outputPath, JSON.stringify(results, null, 2));
    console.log(`\n✅ 결과가 ${outputPath}에 저장되었습니다.`);

    // 요약 출력
    console.log('\n📊 요약:');
    console.log(`   - 발견된 문제: ${results.issues.length}개`);
    if (results.issues.length > 0) {
      results.issues.forEach((issue, index) => {
        console.log(`   ${index + 1}. ${issue}`);
      });
    } else {
      console.log('   ✅ 문제가 발견되지 않았습니다!');
    }

  } catch (error) {
    console.error('❌ 스크립트 실행 오류:', error);
    process.exit(1);
  }
}

checkBlackBerylImages();

