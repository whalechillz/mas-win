/**
 * 제품관리 SKU, 제품합성관리 slug, 갤러리 폴더명 일치 검증 스크립트
 * 
 * 검증 항목:
 * 1. products.sku → slug 형식 변환
 * 2. product_composition.slug
 * 3. Supabase Storage의 실제 폴더명 (originals/products/, originals/goods/)
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Supabase 환경 변수가 설정되지 않았습니다.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// SKU를 slug 형식으로 변환하는 함수
function skuToSlug(sku) {
  if (!sku) return null;
  return sku
    .toLowerCase()
    .replace(/_+/g, '-') // 연속된 언더스코어를 단일 하이픈으로
    .replace(/-+/g, '-') // 연속된 하이픈을 단일 하이픈으로
    .replace(/^-|-$/g, ''); // 앞뒤 하이픈 제거
}

// slug 정규화 함수
function normalizeSlug(slug) {
  if (!slug) return null;
  return slug
    .trim() // 앞뒤 공백 제거
    .replace(/-+/g, '-') // 연속된 하이픈을 단일 하이픈으로
    .replace(/^-|-$/g, ''); // 앞뒤 하이픈 제거
}

// Supabase Storage에서 폴더 목록을 조회
async function getAllFolders() {
  const folders = new Set();
  
  // originals/products 폴더 조회
  const { data: productFolders, error: productsError } = await supabase.storage
    .from('blog-images')
    .list('originals/products', {
      limit: 1000,
      sortBy: { column: 'name', order: 'asc' }
    });

  if (productsError) {
    console.warn('⚠️  originals/products 폴더 조회 경고:', productsError.message);
  } else if (productFolders) {
    // 폴더만 필터링 (id가 없는 항목이 폴더)
    const foldersOnly = productFolders.filter(item => !item.id);
    foldersOnly.forEach(folder => {
      folders.add(`originals/products/${folder.name}`);
    });
  }

  // originals/goods 폴더 조회
  const { data: goodsFolders, error: goodsError } = await supabase.storage
    .from('blog-images')
    .list('originals/goods', {
      limit: 1000,
      sortBy: { column: 'name', order: 'asc' }
    });

  if (goodsError) {
    console.warn('⚠️  originals/goods 폴더 조회 경고:', goodsError.message);
  } else if (goodsFolders) {
    // 폴더만 필터링 (id가 없는 항목이 폴더)
    const foldersOnly = goodsFolders.filter(item => !item.id);
    foldersOnly.forEach(folder => {
      folders.add(`originals/goods/${folder.name}`);
    });
  }

  return Array.from(folders).sort();
}

// 폴더 경로에서 제품 slug 추출
function extractSlugFromFolder(folderPath) {
  // originals/products/{slug}/ 또는 originals/goods/{slug}/ 형식
  const match = folderPath.match(/originals\/(?:products|goods)\/([^\/]+)/);
  return match ? match[1] : null;
}

async function verifyConsistency() {
  console.log('🔍 SKU, Slug, Folder 일치 검증 시작...\n');

  try {
    // 1. products 테이블에서 제품 조회 (product_composition과 JOIN)
    console.log('📊 데이터베이스에서 제품 데이터 조회 중...');
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select(`
        id,
        name,
        sku,
        slug,
        category,
        product_type,
        product_composition!product_composition_product_id_fkey (
          id,
          name,
          slug,
          image_url
        )
      `)
      .order('name', { ascending: true });

    if (productsError) {
      console.error('❌ 제품 조회 실패:', productsError);
      return;
    }

    console.log(`✅ ${products.length}개 제품 조회 완료\n`);

    // 2. Supabase Storage에서 폴더 목록 조회
    console.log('📁 Supabase Storage에서 폴더 목록 조회 중...');
    const allFolders = await getAllFolders();
    
    // products와 goods 폴더만 필터링
    const productFolders = allFolders.filter(f => f.startsWith('originals/products/'));
    const goodsFolders = allFolders.filter(f => f.startsWith('originals/goods/'));
    
    console.log(`✅ ${productFolders.length}개 products 폴더, ${goodsFolders.length}개 goods 폴더 발견\n`);

    // 3. 폴더에서 slug 추출 및 매핑
    const folderSlugMap = new Map();
    
    [...productFolders, ...goodsFolders].forEach(folder => {
      const slug = extractSlugFromFolder(folder);
      if (slug) {
        if (!folderSlugMap.has(slug)) {
          folderSlugMap.set(slug, []);
        }
        folderSlugMap.get(slug).push(folder);
      }
    });

    // 4. 검증 결과 수집
    const results = {
      matched: [],
      mismatched: [],
      missingSku: [],
      missingSlug: [],
      missingFolder: [],
      multipleFolders: []
    };

    products.forEach(product => {
      const productSku = product.sku;
      const productSlug = product.slug;
      const compositionSlug = product.product_composition && 
        (Array.isArray(product.product_composition) 
          ? product.product_composition[0]?.slug 
          : product.product_composition?.slug);
      
      // 사용할 slug 결정: product_composition.slug 우선, 없으면 products.slug
      const actualSlug = compositionSlug || productSlug;
      
      // SKU를 slug 형식으로 변환
      const skuAsSlug = productSku ? skuToSlug(productSku) : null;
      const normalizedActualSlug = actualSlug ? normalizeSlug(actualSlug) : null;

      // 폴더에서 해당 slug 찾기
      const folders = folderSlugMap.get(normalizedActualSlug) || [];

      const result = {
        productId: product.id,
        productName: product.name,
        sku: productSku,
        productSlug: productSlug,
        compositionSlug: compositionSlug,
        actualSlug: normalizedActualSlug,
        skuAsSlug: skuAsSlug,
        folders: folders,
        category: product.category,
        productType: product.product_type
      };

      // 검증 로직
      if (!productSku) {
        results.missingSku.push(result);
      } else if (!normalizedActualSlug) {
        results.missingSlug.push(result);
      } else if (folders.length === 0) {
        results.missingFolder.push(result);
      } else if (folders.length > 1) {
        results.multipleFolders.push(result);
      } else if (skuAsSlug === normalizedActualSlug) {
        // SKU와 slug가 일치하고 폴더도 존재
        results.matched.push(result);
      } else {
        // SKU와 slug가 다름
        results.mismatched.push({
          ...result,
          reason: `SKU 변환값(${skuAsSlug})과 slug(${normalizedActualSlug})가 다름`
        });
      }
    });

    // 5. 결과 출력
    console.log('='.repeat(80));
    console.log('📋 검증 결과 요약');
    console.log('='.repeat(80));
    console.log(`✅ 일치: ${results.matched.length}개`);
    console.log(`⚠️  불일치: ${results.mismatched.length}개`);
    console.log(`❌ SKU 없음: ${results.missingSku.length}개`);
    console.log(`❌ Slug 없음: ${results.missingSlug.length}개`);
    console.log(`❌ 폴더 없음: ${results.missingFolder.length}개`);
    console.log(`⚠️  여러 폴더: ${results.multipleFolders.length}개`);
    console.log('='.repeat(80));
    console.log('');

    // 일치 항목 상세
    if (results.matched.length > 0) {
      console.log('✅ 일치하는 제품:');
      results.matched.forEach(r => {
        console.log(`  - ${r.productName}`);
        console.log(`    SKU: ${r.sku} → slug: ${r.skuAsSlug}`);
        console.log(`    폴더: ${r.folders[0]}`);
        console.log('');
      });
    }

    // 불일치 항목 상세
    if (results.mismatched.length > 0) {
      console.log('⚠️  SKU와 Slug가 다른 제품:');
      results.mismatched.forEach(r => {
        console.log(`  - ${r.productName} (ID: ${r.productId})`);
        console.log(`    SKU: ${r.sku} → ${r.skuAsSlug}`);
        console.log(`    Slug: ${r.actualSlug}`);
        console.log(`    폴더: ${r.folders.length > 0 ? r.folders[0] : '없음'}`);
        console.log(`    이유: ${r.reason}`);
        console.log('');
      });
    }

    // SKU 없음
    if (results.missingSku.length > 0) {
      console.log('❌ SKU가 없는 제품:');
      results.missingSku.forEach(r => {
        console.log(`  - ${r.productName} (ID: ${r.productId})`);
        console.log(`    Slug: ${r.actualSlug || '없음'}`);
        console.log('');
      });
    }

    // Slug 없음
    if (results.missingSlug.length > 0) {
      console.log('❌ Slug가 없는 제품:');
      results.missingSlug.forEach(r => {
        console.log(`  - ${r.productName} (ID: ${r.productId})`);
        console.log(`    SKU: ${r.sku || '없음'}`);
        console.log('');
      });
    }

    // 폴더 없음
    if (results.missingFolder.length > 0) {
      console.log('❌ 폴더가 없는 제품:');
      results.missingFolder.forEach(r => {
        console.log(`  - ${r.productName} (ID: ${r.productId})`);
        console.log(`    SKU: ${r.sku || '없음'} → ${r.skuAsSlug || '없음'}`);
        console.log(`    Slug: ${r.actualSlug || '없음'}`);
        console.log(`    예상 폴더: originals/${r.category === 'driver' ? 'products' : 'goods'}/${r.actualSlug}/`);
        console.log('');
      });
    }

    // 여러 폴더
    if (results.multipleFolders.length > 0) {
      console.log('⚠️  여러 폴더가 있는 제품:');
      results.multipleFolders.forEach(r => {
        console.log(`  - ${r.productName} (ID: ${r.productId})`);
        console.log(`    Slug: ${r.actualSlug}`);
        console.log(`    폴더들:`);
        r.folders.forEach(f => console.log(`      - ${f}`));
        console.log('');
      });
    }

    // 폴더는 있지만 제품이 없는 경우
    const usedSlugs = new Set();
    products.forEach(p => {
      const compSlug = p.product_composition && 
        (Array.isArray(p.product_composition) 
          ? p.product_composition[0]?.slug 
          : p.product_composition?.slug);
      const slug = normalizeSlug(compSlug || p.slug);
      if (slug) usedSlugs.add(slug);
    });

    const orphanFolders = [];
    folderSlugMap.forEach((folders, slug) => {
      if (!usedSlugs.has(slug)) {
        orphanFolders.push({ slug, folders });
      }
    });

    if (orphanFolders.length > 0) {
      console.log('⚠️  제품이 없는 폴더 (고아 폴더):');
      orphanFolders.forEach(({ slug, folders }) => {
        console.log(`  - Slug: ${slug}`);
        folders.forEach(f => console.log(`    폴더: ${f}`));
        console.log('');
      });
    }

    // 최종 요약
    console.log('='.repeat(80));
    console.log('📊 최종 통계');
    console.log('='.repeat(80));
    const total = products.length;
    const perfect = results.matched.length;
    const issues = total - perfect;
    console.log(`전체 제품: ${total}개`);
    console.log(`완벽 일치: ${perfect}개 (${((perfect/total)*100).toFixed(1)}%)`);
    console.log(`문제 있음: ${issues}개 (${((issues/total)*100).toFixed(1)}%)`);
    console.log('='.repeat(80));

  } catch (error) {
    console.error('❌ 검증 중 오류 발생:', error);
    throw error;
  }
}

// 실행
verifyConsistency()
  .then(() => {
    console.log('\n✅ 검증 완료');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ 검증 실패:', error);
    process.exit(1);
  });

