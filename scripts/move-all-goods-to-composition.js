/**
 * 모든 goods 제품 이미지를 composition 폴더로 이동 및 DB 업데이트
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

// 제품별 파일 매핑
const productMappings = [
  {
    slug: 'golf-hat-muziik',
    files: ['beige-golf-cap.webp', 'black-golf-cap.webp', 'navy-golf-cap.webp', 'white-golf-cap.webp'],
    searchTerms: ['golf-cap', 'golf-hat']
  },
  {
    slug: 'massgoo-white-cap',
    files: ['massgoo-white-cap-front.webp', 'massgoo-white-cap-side.webp'],
    searchTerms: ['massgoo-white-cap', 'massgoo-white']
  },
  {
    slug: 'massgoo-black-cap',
    files: ['massgoo-black-cap-front.webp', 'massgoo-black-cap-side.webp'],
    searchTerms: ['massgoo-black-cap', 'massgoo-black']
  },
  {
    slug: 'mas-limited-cap-gray',
    files: ['mas-limited-cap-gray-front.webp', 'mas-limited-cap-gray-side.webp'],
    searchTerms: ['mas-limited-cap-gray']
  },
  {
    slug: 'mas-limited-cap-black',
    files: ['mas-limited-cap-black-front.webp', 'mas-limited-cap-black-side.webp'],
    searchTerms: ['mas-limited-cap-black']
  },
  {
    slug: 'massgoo-muziik-clutch-beige',
    files: ['massgoo-muziik-clutch-beige-front.webp', 'massgoo-muziik-clutch-beige-back.webp'],
    searchTerms: ['massgoo-muziik-clutch-beige', 'clutch-beige']
  },
  {
    slug: 'massgoo-muziik-clutch-gray',
    files: ['massgoo-muziik-clutch-gray-front.webp', 'massgoo-muziik-clutch-gray-back.webp'],
    searchTerms: ['massgoo-muziik-clutch-gray', 'clutch-gray']
  }
];

async function findFileLocation(fileName, productSlug) {
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

async function moveFileToComposition(fileName, productSlug, currentPath) {
  const targetPath = `originals/products/goods/${productSlug}/composition/${fileName}`;
  
  if (currentPath === targetPath) {
    return { success: true, skipped: true };
  }

  try {
    // 파일 다운로드
    const { data: fileData, error: downloadError } = await supabase.storage
      .from('blog-images')
      .download(currentPath);

    if (downloadError) {
      return { success: false, error: `다운로드 실패: ${downloadError.message}` };
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
      return { success: false, error: `업로드 실패: ${uploadError.message}` };
    }

    // 원본 파일 삭제
    await supabase.storage
      .from('blog-images')
      .remove([currentPath]);

    return { success: true, from: currentPath, to: targetPath };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

async function updateProductCompositionPaths(productSlug, searchTerms) {
  // product_composition 테이블에서 해당 제품 찾기
  const searchQuery = searchTerms.map(term => `image_url.ilike.%${term}%`).join(',');
  
  const { data: products, error } = await supabase
    .from('product_composition')
    .select('id, name, slug, image_url, reference_images')
    .or(searchQuery);

  if (error || !products || products.length === 0) {
    return { updated: [], errors: [] };
  }

  const updated = [];
  const errors = [];

  for (const product of products) {
    let needsUpdate = false;
    let newImageUrl = product.image_url;
    let newReferenceImages = Array.isArray(product.reference_images) 
      ? [...product.reference_images] 
      : [];

    // image_url 업데이트
    if (product.image_url && product.image_url.startsWith('/main/products/goods/')) {
      const fileName = product.image_url.split('/').pop();
      newImageUrl = `originals/products/goods/${productSlug}/composition/${fileName}`;
      needsUpdate = true;
    } else if (product.image_url && !product.image_url.includes(`originals/products/goods/${productSlug}/composition/`)) {
      // 기존 경로가 올바르지 않은 경우
      const fileName = product.image_url.split('/').pop();
      newImageUrl = `originals/products/goods/${productSlug}/composition/${fileName}`;
      needsUpdate = true;
    }

    // reference_images 업데이트
    newReferenceImages = newReferenceImages.map(img => {
      if (!img) return img;
      
      if (img.startsWith('/main/products/goods/')) {
        const fileName = img.split('/').pop();
        return `originals/products/goods/${productSlug}/composition/${fileName}`;
      }
      
      // 이미 originals 경로이지만 다른 폴더에 있는 경우
      if (img.includes(`originals/products/goods/`) && !img.includes(`/${productSlug}/composition/`)) {
        const fileName = img.split('/').pop();
        return `originals/products/goods/${productSlug}/composition/${fileName}`;
      }
      
      return img;
    });

    if (needsUpdate || JSON.stringify(newReferenceImages) !== JSON.stringify(product.reference_images)) {
      const { error: updateError } = await supabase
        .from('product_composition')
        .update({
          image_url: newImageUrl,
          reference_images: newReferenceImages,
          updated_at: new Date().toISOString()
        })
        .eq('id', product.id);

      if (updateError) {
        errors.push({ product: product.name, error: updateError.message });
      } else {
        updated.push({
          product: product.name,
          slug: product.slug,
          image_url: newImageUrl,
          reference_images: newReferenceImages
        });
      }
    }
  }

  return { updated, errors };
}

async function processAllGoodsProducts() {
  console.log('🔍 모든 goods 제품 이미지 점검 및 이동 시작...\n');

  const results = {
    products: {},
    summary: {
      filesMoved: 0,
      filesSkipped: 0,
      productsUpdated: 0,
      errors: 0
    }
  };

  for (const mapping of productMappings) {
    console.log(`\n📦 처리 중: ${mapping.slug}`);
    console.log('─'.repeat(50));

    const productResult = {
      slug: mapping.slug,
      files: [],
      dbUpdates: [],
      errors: []
    };

    // 1. 파일 이동
    for (const fileName of mapping.files) {
      const currentPath = await findFileLocation(fileName, mapping.slug);
      
      if (!currentPath) {
        console.log(`   ⚠️  ${fileName} 파일을 찾을 수 없습니다.`);
        productResult.errors.push({ file: fileName, error: '파일을 찾을 수 없음' });
        continue;
      }

      const moveResult = await moveFileToComposition(fileName, mapping.slug, currentPath);
      
      if (moveResult.success) {
        if (moveResult.skipped) {
          console.log(`   ✅ ${fileName}는 이미 올바른 위치에 있습니다.`);
          productResult.files.push({ fileName, status: 'skipped' });
          results.summary.filesSkipped++;
        } else {
          console.log(`   ✅ ${fileName} 이동 완료: ${moveResult.from} → ${moveResult.to}`);
          productResult.files.push({ fileName, from: moveResult.from, to: moveResult.to });
          results.summary.filesMoved++;
        }
      } else {
        console.error(`   ❌ ${fileName} 이동 실패: ${moveResult.error}`);
        productResult.errors.push({ file: fileName, error: moveResult.error });
        results.summary.errors++;
      }
    }

    // 2. 데이터베이스 업데이트
    const dbResult = await updateProductCompositionPaths(mapping.slug, mapping.searchTerms);
    productResult.dbUpdates = dbResult.updated;
    productResult.errors.push(...dbResult.errors.map(e => ({ type: 'db', ...e })));

    if (dbResult.updated.length > 0) {
      console.log(`   ✅ DB 업데이트 완료: ${dbResult.updated.length}개 제품`);
      results.summary.productsUpdated += dbResult.updated.length;
    }

    if (dbResult.errors.length > 0) {
      console.error(`   ❌ DB 업데이트 오류: ${dbResult.errors.length}개`);
      results.summary.errors += dbResult.errors.length;
    }

    results.products[mapping.slug] = productResult;
  }

  // 결과 저장
  const outputPath = path.join(__dirname, 'all-goods-products-composition-migration-result.json');
  fs.writeFileSync(outputPath, JSON.stringify(results, null, 2));

  // 요약 출력
  console.log('\n' + '='.repeat(50));
  console.log('📊 작업 요약');
  console.log('='.repeat(50));
  console.log(`   - 이동된 파일: ${results.summary.filesMoved}개`);
  console.log(`   - 건너뛴 파일: ${results.summary.filesSkipped}개`);
  console.log(`   - 업데이트된 제품: ${results.summary.productsUpdated}개`);
  console.log(`   - 오류: ${results.summary.errors}개`);
  console.log(`\n✅ 결과가 ${outputPath}에 저장되었습니다.`);
  console.log('\n✅ 모든 goods 제품 처리 완료!');
}

processAllGoodsProducts();

