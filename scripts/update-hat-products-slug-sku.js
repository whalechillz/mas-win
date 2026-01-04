/**
 * 모자 제품의 slug와 SKU를 Supabase Storage 폴더 기준으로 업데이트
 * 
 * 실행 방법:
 * node scripts/update-hat-products-slug-sku.js
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Supabase 환경 변수가 설정되지 않았습니다');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);
const STORAGE_BUCKET = 'blog-images';

/**
 * slug를 SKU로 변환
 */
function slugToSku(slug) {
  if (!slug) return null;
  return slug.toUpperCase().replace(/-/g, '_');
}

/**
 * Supabase Storage에서 originals/goods 폴더의 모든 하위 폴더 조회
 */
async function listGoodsFolders() {
  console.log('📁 originals/goods 폴더의 모든 제품 폴더 조회 중...\n');
  
  const folders = new Set();
  
  const listFoldersRecursive = async (prefix = '', depth = 0) => {
    if (depth > 3) return; // 최대 깊이 제한
    
    const { data: items, error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .list(prefix, {
        limit: 1000,
        sortBy: { column: 'name', order: 'asc' }
      });
    
    if (error) {
      console.error(`❌ 폴더 조회 에러 (${prefix}):`, error);
      return;
    }
    
    if (!items) return;
    
    // 폴더만 필터링 (id가 없는 항목)
    const folderItems = items.filter(item => !item.id);
    
    for (const folder of folderItems) {
      const folderPath = prefix ? `${prefix}/${folder.name}` : folder.name;
      
      // originals/goods/{slug} 패턴만 수집 (detail, gallery, composition 하위 폴더는 제외)
      if (folderPath.startsWith('originals/goods/')) {
        const parts = folderPath.split('/');
        if (parts.length === 3) {
          // originals/goods/{slug} 형태만 추가
          folders.add(folderPath);
        }
      }
      
      // 하위 폴더 재귀 조회
      await listFoldersRecursive(folderPath, depth + 1);
    }
  };
  
  await listFoldersRecursive('originals/goods');
  
  return Array.from(folders).sort();
}

/**
 * 제품명에서 slug 추출 시도 (폴더명과 매칭)
 */
function extractSlugFromProductName(productName, availableFolders) {
  if (!productName) return null;
  
  // 제품명을 소문자로 변환하고 특수문자 제거
  const normalizedName = productName
    .toLowerCase()
    .replace(/[^a-z0-9가-힣\s]/g, '')
    .replace(/\s+/g, '-')
    .trim();
  
  // 사용 가능한 폴더 중에서 매칭 시도
  for (const folder of availableFolders) {
    const folderSlug = folder.replace('originals/goods/', '');
    
    // 정확한 매칭
    if (normalizedName.includes(folderSlug) || folderSlug.includes(normalizedName)) {
      return folderSlug;
    }
    
    // 색상별 폴더 매칭 (예: "MASSGOO × MUZIIK 스타일리시 버킷햇(화이트)" → "bucket-hat-muziik-white")
    const colorMatch = productName.match(/(블랙|화이트|네이비|베이지|그레이|골드|실버)/i);
    if (colorMatch) {
      const color = colorMatch[1].toLowerCase();
      const colorMap = {
        '블랙': 'black',
        '화이트': 'white',
        '네이비': 'navy',
        '베이지': 'beige',
        '그레이': 'gray',
        '골드': 'gold',
        '실버': 'silver'
      };
      
      const colorEn = colorMap[color] || color;
      if (folderSlug.includes(colorEn)) {
        return folderSlug;
      }
    }
  }
  
  return null;
}

/**
 * 제품 업데이트
 */
async function updateProductSlugAndSku(product, slug, sku) {
  const { error } = await supabase
    .from('products')
    .update({
      slug: slug,
      sku: sku,
      updated_at: new Date().toISOString()
    })
    .eq('id', product.id);
  
  if (error) {
    console.error(`   ❌ 업데이트 실패: ${error.message}`);
    return false;
  }
  
  return true;
}

/**
 * 메인 함수
 */
async function main() {
  console.log('🚀 모자 제품 slug 및 SKU 업데이트 시작...\n');
  
  // 1. Supabase Storage에서 모든 goods 폴더 조회
  const goodsFolders = await listGoodsFolders();
  console.log(`📂 발견된 제품 폴더: ${goodsFolders.length}개\n`);
  
  // 폴더명에서 slug 추출
  const availableSlugs = goodsFolders.map(folder => folder.replace('originals/goods/', ''));
  console.log('📋 사용 가능한 slug 목록:');
  availableSlugs.forEach(slug => console.log(`   - ${slug}`));
  console.log('');
  
  // 2. products 테이블에서 모자 제품 조회 (cap, bucket_hat 카테고리)
  const { data: products, error: productsError } = await supabase
    .from('products')
    .select('id, name, sku, slug, category, product_type, detail_images, gallery_images, composition_images')
    .in('category', ['cap', 'bucket_hat', 'hat'])
    .order('name');
  
  if (productsError) {
    console.error('❌ 제품 조회 오류:', productsError);
    return;
  }
  
  if (!products || products.length === 0) {
    console.log('📭 모자 제품이 없습니다.');
    return;
  }
  
  console.log(`📦 발견된 모자 제품: ${products.length}개\n`);
  
  const results = {
    updated: [],
    skipped: [],
    errors: []
  };
  
  // 3. 각 제품에 대해 slug와 SKU 업데이트
  for (const product of products) {
    console.log(`\n📦 ${product.name} (ID: ${product.id})`);
    console.log(`   현재 SKU: ${product.sku || 'NULL'}`);
    console.log(`   현재 slug: ${product.slug || 'NULL'}`);
    console.log(`   카테고리: ${product.category}`);
    
    let slug = product.slug;
    let sku = product.sku;
    
    // 이미지 경로에서 slug 추출 시도
    const imageArrays = [
      product.detail_images || [],
      product.gallery_images || [],
      product.composition_images || []
    ];
    
    for (const imageArray of imageArrays) {
      if (Array.isArray(imageArray) && imageArray.length > 0) {
        for (const imagePath of imageArray) {
          if (imagePath && typeof imagePath === 'string') {
            const match = imagePath.match(/originals\/(?:goods|products)\/([^\/]+)\//);
            if (match) {
              slug = match[1];
              console.log(`   ✅ 이미지에서 slug 추출: ${slug}`);
              break;
            }
          }
        }
        if (slug) break;
      }
    }
    
    // 이미지에서 못 찾은 경우, 제품명에서 추출 시도
    if (!slug) {
      slug = extractSlugFromProductName(product.name, goodsFolders);
      if (slug) {
        console.log(`   ✅ 제품명에서 slug 추출: ${slug}`);
      }
    }
    
    // 여전히 못 찾은 경우, 사용 가능한 폴더 중에서 매칭 시도
    if (!slug) {
      // 제품명에 색상이 포함된 경우 색상별 폴더 매칭
      const colorMatch = product.name.match(/(블랙|화이트|네이비|베이지|그레이)/i);
      if (colorMatch) {
        const color = colorMatch[1].toLowerCase();
        const colorMap = {
          '블랙': 'black',
          '화이트': 'white',
          '네이비': 'navy',
          '베이지': 'beige',
          '그레이': 'gray'
        };
        
        const colorEn = colorMap[color];
        if (colorEn) {
          // 버킷햇인 경우
          if (product.name.includes('버킷') || product.name.includes('bucket')) {
            const bucketSlug = `bucket-hat-muziik-${colorEn}`;
            if (availableSlugs.includes(bucketSlug)) {
              slug = bucketSlug;
              console.log(`   ✅ 버킷햇 색상별 slug 매칭: ${slug}`);
            }
          }
          // 골프모자인 경우
          else if (product.name.includes('골프') || product.name.includes('golf')) {
            const golfSlug = `golf-hat-muziik-${colorEn}`;
            if (availableSlugs.includes(golfSlug)) {
              slug = golfSlug;
              console.log(`   ✅ 골프모자 색상별 slug 매칭: ${slug}`);
            }
          }
        }
      }
    }
    
    // SKU 생성
    if (slug) {
      sku = slugToSku(slug);
      console.log(`   ✅ 생성된 SKU: ${sku}`);
      
      // 업데이트 실행
      const updated = await updateProductSlugAndSku(product, slug, sku);
      if (updated) {
        results.updated.push({
          id: product.id,
          name: product.name,
          slug: slug,
          sku: sku
        });
        console.log(`   ✅ 업데이트 완료`);
      } else {
        results.errors.push({
          id: product.id,
          name: product.name,
          error: '업데이트 실패'
        });
      }
    } else {
      console.log(`   ⚠️ slug를 찾을 수 없어 건너뜀`);
      results.skipped.push({
        id: product.id,
        name: product.name,
        reason: 'slug를 찾을 수 없음'
      });
    }
  }
  
  // 4. 결과 요약
  console.log('\n\n📊 업데이트 결과 요약:');
  console.log(`   ✅ 업데이트 완료: ${results.updated.length}개`);
  console.log(`   ⚠️ 건너뜀: ${results.skipped.length}개`);
  console.log(`   ❌ 오류: ${results.errors.length}개`);
  
  if (results.updated.length > 0) {
    console.log('\n✅ 업데이트된 제품:');
    results.updated.forEach(item => {
      console.log(`   - ${item.name}: slug=${item.slug}, sku=${item.sku}`);
    });
  }
  
  if (results.skipped.length > 0) {
    console.log('\n⚠️ 건너뛴 제품:');
    results.skipped.forEach(item => {
      console.log(`   - ${item.name}: ${item.reason}`);
    });
  }
  
  if (results.errors.length > 0) {
    console.log('\n❌ 오류가 발생한 제품:');
    results.errors.forEach(item => {
      console.log(`   - ${item.name}: ${item.error}`);
    });
  }
  
  // 결과를 JSON 파일로 저장
  const fs = require('fs');
  const resultPath = 'scripts/update-hat-products-slug-sku-result.json';
  fs.writeFileSync(resultPath, JSON.stringify(results, null, 2));
  console.log(`\n💾 결과가 ${resultPath}에 저장되었습니다.`);
}

main().catch(console.error);

