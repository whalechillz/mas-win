/**
 * bucket-hat 이미지 점검 및 composition 폴더로 이동
 * 1. 현재 파일 위치 확인
 * 2. product_composition 테이블 경로 확인
 * 3. composition 폴더로 이동
 * 4. 데이터베이스 경로 업데이트
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

const filesToCheck = [
  'black-bucket-hat.webp',
  'white-bucket-hat.webp'
];

const productSlug = 'bucket-hat-muziik';

async function findFileLocation(fileName) {
  // 여러 가능한 위치 확인
  const possiblePaths = [
    `originals/products/goods/${fileName}`,
    `originals/products/goods/${productSlug}/gallery/${fileName}`,
    `originals/products/goods/${productSlug}/detail/${fileName}`,
    `originals/products/goods/${productSlug}/composition/${fileName}`,
  ];

  for (const checkPath of possiblePaths) {
    try {
      const folderPath = checkPath.split('/').slice(0, -1).join('/');
      const { data, error } = await supabase.storage
        .from('blog-images')
        .list(folderPath, { limit: 100 });
      
      if (!error && data) {
        const found = data.find(f => f.name === fileName);
        if (found) {
          return checkPath;
        }
      }
    } catch (err) {
      // 무시
    }
  }
  return null;
}

async function checkAndMoveBucketHatImages() {
  console.log('🔍 bucket-hat 이미지 점검 및 이동 시작...\n');

  const results = {
    currentLocations: {},
    productCompositionPaths: {},
    moved: [],
    updated: [],
    errors: []
  };

  // 1. 현재 파일 위치 확인
  console.log('1️⃣ 현재 파일 위치 확인 중...');
  for (const fileName of filesToCheck) {
    const location = await findFileLocation(fileName);
    if (location) {
      results.currentLocations[fileName] = location;
      console.log(`   ✅ ${fileName}: ${location}`);
    } else {
      console.log(`   ⚠️  ${fileName} 파일을 찾을 수 없습니다.`);
    }
  }

  // 2. product_composition 테이블 경로 확인
  console.log('\n2️⃣ product_composition 테이블 경로 확인 중...');
  const { data: products, error: productsError } = await supabase
    .from('product_composition')
    .select('id, name, slug, image_url, reference_images')
    .or('image_url.ilike.%bucket-hat%,image_url.ilike.%white-bucket-hat%,image_url.ilike.%black-bucket-hat%');

  if (productsError) {
    console.error(`   ❌ 조회 오류: ${productsError.message}`);
    results.errors.push({ step: 'fetch_products', error: productsError.message });
  } else if (products && products.length > 0) {
    products.forEach(product => {
      results.productCompositionPaths[product.slug] = {
        image_url: product.image_url,
        reference_images: product.reference_images
      };
      console.log(`   📦 ${product.name} (${product.slug}):`);
      console.log(`      - image_url: ${product.image_url}`);
      if (Array.isArray(product.reference_images)) {
        console.log(`      - reference_images: ${product.reference_images.length}개`);
        product.reference_images.forEach(img => {
          if (img.includes('bucket-hat')) {
            console.log(`        * ${img}`);
          }
        });
      }
    });
  } else {
    console.log(`   ℹ️  bucket-hat 관련 제품을 찾을 수 없습니다.`);
  }

  // 3. 파일을 composition 폴더로 이동
  console.log('\n3️⃣ composition 폴더로 이동 중...');
  for (const fileName of filesToCheck) {
    const currentPath = results.currentLocations[fileName];
    if (!currentPath) {
      console.log(`   ⚠️  ${fileName} 파일을 찾을 수 없어 건너뜁니다.`);
      continue;
    }

    const targetPath = `originals/products/goods/${productSlug}/composition/${fileName}`;
    
    // 이미 올바른 위치에 있으면 스킵
    if (currentPath === targetPath) {
      console.log(`   ✅ ${fileName}는 이미 올바른 위치에 있습니다.`);
      continue;
    }

    console.log(`   📦 이동: ${fileName}`);
    console.log(`      ${currentPath} → ${targetPath}`);

    try {
      // 파일 다운로드
      const { data: fileData, error: downloadError } = await supabase.storage
        .from('blog-images')
        .download(currentPath);

      if (downloadError) {
        console.error(`     ❌ 다운로드 실패: ${downloadError.message}`);
        results.errors.push({ file: fileName, step: 'download', error: downloadError.message });
        continue;
      }

      // 새 위치에 업로드
      const { error: uploadError } = await supabase.storage
        .from('blog-images')
        .upload(targetPath, fileData, {
          contentType: 'image/webp',
          cacheControl: '3600',
          upsert: true
        });

      if (uploadError) {
        console.error(`     ❌ 업로드 실패: ${uploadError.message}`);
        results.errors.push({ file: fileName, step: 'upload', error: uploadError.message });
        continue;
      }

      // 원본 파일 삭제
      const { error: deleteError } = await supabase.storage
        .from('blog-images')
        .remove([currentPath]);

      if (deleteError) {
        console.warn(`     ⚠️  원본 삭제 실패 (무시): ${deleteError.message}`);
      }

      results.moved.push({
        fileName,
        from: currentPath,
        to: targetPath
      });

      console.log(`     ✅ 이동 완료`);

    } catch (error) {
      console.error(`     ❌ 이동 중 오류: ${error.message}`);
      results.errors.push({ file: fileName, step: 'move', error: error.message });
    }
  }

  // 4. product_composition 테이블 경로 업데이트
  console.log('\n4️⃣ product_composition 테이블 경로 업데이트 중...');
  if (products && products.length > 0) {
    for (const product of products) {
      let needsUpdate = false;
      let newImageUrl = product.image_url;
      let newReferenceImages = Array.isArray(product.reference_images) 
        ? [...product.reference_images] 
        : [];

      // image_url 업데이트
      if (product.image_url) {
        if (product.image_url.includes('black-bucket-hat')) {
          const newPath = `originals/products/goods/${productSlug}/composition/black-bucket-hat.webp`;
          if (product.image_url !== newPath) {
            newImageUrl = newPath;
            needsUpdate = true;
          }
        } else if (product.image_url.includes('white-bucket-hat')) {
          const newPath = `originals/products/goods/${productSlug}/composition/white-bucket-hat.webp`;
          if (product.image_url !== newPath) {
            newImageUrl = newPath;
            needsUpdate = true;
          }
        }
        
        // /main/products/goods/... 경로도 업데이트
        if (product.image_url.startsWith('/main/products/goods/')) {
          if (product.image_url.includes('bucket-hat')) {
            const fileName = product.image_url.split('/').pop();
            newImageUrl = `originals/products/goods/${productSlug}/composition/${fileName}`;
            needsUpdate = true;
          }
        }
      }

      // reference_images 업데이트
      const updatedRefs = newReferenceImages.map(img => {
        if (!img) return img;
        
        if (img.includes('black-bucket-hat')) {
          return `originals/products/goods/${productSlug}/composition/black-bucket-hat.webp`;
        }
        if (img.includes('white-bucket-hat')) {
          return `originals/products/goods/${productSlug}/composition/white-bucket-hat.webp`;
        }
        // /main/products/goods/... 경로도 업데이트
        if (img.startsWith('/main/products/goods/')) {
          const fileName = img.split('/').pop();
          if (fileName.includes('bucket-hat')) {
            return `originals/products/goods/${productSlug}/composition/${fileName}`;
          }
        }
        return img;
      });

      if (JSON.stringify(updatedRefs) !== JSON.stringify(newReferenceImages)) {
        newReferenceImages = updatedRefs;
        needsUpdate = true;
      }

      if (needsUpdate) {
        console.log(`   📝 업데이트: ${product.name}`);
        const { error: updateError } = await supabase
          .from('product_composition')
          .update({
            image_url: newImageUrl,
            reference_images: newReferenceImages,
            updated_at: new Date().toISOString()
          })
          .eq('id', product.id);

        if (updateError) {
          console.error(`     ❌ 업데이트 실패: ${updateError.message}`);
          results.errors.push({ product: product.name, step: 'update_db', error: updateError.message });
        } else {
          console.log(`     ✅ 업데이트 완료`);
          results.updated.push({
            product: product.name,
            slug: product.slug,
            image_url: newImageUrl,
            reference_images: newReferenceImages
          });
        }
      } else {
        console.log(`   ✅ ${product.name}는 이미 올바른 경로입니다.`);
      }
    }
  }

  // 결과 저장
  const outputPath = path.join(__dirname, 'bucket-hat-images-check-and-move-result.json');
  fs.writeFileSync(outputPath, JSON.stringify(results, null, 2));
  console.log(`\n✅ 결과가 ${outputPath}에 저장되었습니다.`);

  // 요약
  console.log('\n📊 작업 요약:');
  console.log(`   - 이동된 파일: ${results.moved.length}개`);
  console.log(`   - 업데이트된 제품: ${results.updated.length}개`);
  console.log(`   - 오류: ${results.errors.length}개`);

  if (results.errors.length > 0) {
    console.log('\n⚠️  오류 목록:');
    results.errors.forEach((err, index) => {
      console.log(`   ${index + 1}. ${err.file || err.product || err.step}: ${err.error}`);
    });
  }

  console.log('\n✅ 점검 및 수정 완료!');
}

checkAndMoveBucketHatImages();

