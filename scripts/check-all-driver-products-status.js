/**
 * 모든 드라이버 제품의 현재 상태 확인 스크립트
 * 각 제품별로 루트 폴더, detail, composition, gallery 폴더 상태 확인
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

// 드라이버 제품 목록 (폴더명 → slug 매핑)
const driverProducts = [
  { folder: 'black-beryl', slug: 'black-beryl', name: '시크리트웨폰 블랙 MUZIIK' },
  { folder: 'black-weapon', slug: 'secret-weapon-black', name: '시크리트웨폰 블랙' },
  { folder: 'gold-weapon4', slug: 'secret-weapon-4-1', name: '시크리트웨폰 골드 4.1' },
  { folder: 'gold2', slug: 'secret-force-gold-2', name: '시크리트포스 골드 2' },
  { folder: 'gold2-sapphire', slug: 'gold2-sapphire', name: '시크리트포스 골드 2 MUZIIK' },
  { folder: 'pro3', slug: 'secret-force-pro-3', name: '시크리트포스 PRO 3' },
  { folder: 'pro3-muziik', slug: 'pro3-muziik', name: '시크리트포스 PRO 3 MUZIIK' },
  { folder: 'v3', slug: 'secret-force-v3', name: '시크리트포스 V3' },
];

async function checkAllDriverProductsStatus() {
  console.log('🔍 모든 드라이버 제품 상태 확인 시작...\n');

  const allResults = {};

  for (const product of driverProducts) {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`📦 ${product.name} (${product.folder})`);
    console.log(`${'='.repeat(60)}`);

    const result = {
      folder: product.folder,
      slug: product.slug,
      name: product.name,
      rootFiles: [],
      detailFiles: [],
      compositionFiles: [],
      galleryFiles: [],
      needsCleanup: false,
      issues: []
    };

    try {
      // 루트 폴더 확인
      const { data: rootFiles, error: rootError } = await supabase.storage
        .from('blog-images')
        .list(`originals/products/${product.folder}`, {
          limit: 100,
          sortBy: { column: 'name', order: 'asc' }
        });

      if (!rootError && rootFiles) {
        const rootFileList = rootFiles.filter(item => 
          item.id && 
          item.name !== 'detail' && 
          item.name !== 'composition' && 
          item.name !== 'gallery' &&
          !item.name.endsWith('/')
        );
        result.rootFiles = rootFileList.map(f => f.name);
        
        if (result.rootFiles.length > 0) {
          result.needsCleanup = true;
          console.log(`   ⚠️  루트 폴더에 ${result.rootFiles.length}개 파일 존재:`);
          result.rootFiles.forEach(f => console.log(`      - ${f}`));
        } else {
          console.log(`   ✅ 루트 폴더: 정리됨 (0개 파일)`);
        }
      }

      // detail 폴더 확인
      const { data: detailFiles, error: detailError } = await supabase.storage
        .from('blog-images')
        .list(`originals/products/${product.folder}/detail`, {
          limit: 100,
          sortBy: { column: 'name', order: 'asc' }
        });

      if (!detailError && detailFiles) {
        result.detailFiles = detailFiles.map(f => f.name);
        console.log(`   📁 detail/ 폴더: ${result.detailFiles.length}개 파일`);
      }

      // composition 폴더 확인
      const { data: compositionFiles, error: compositionError } = await supabase.storage
        .from('blog-images')
        .list(`originals/products/${product.folder}/composition`, {
          limit: 100,
          sortBy: { column: 'name', order: 'asc' }
        });

      if (!compositionError && compositionFiles) {
        result.compositionFiles = compositionFiles.map(f => f.name);
        console.log(`   📁 composition/ 폴더: ${result.compositionFiles.length}개 파일`);
        
        // 500 관련 파일 확인
        const files500 = result.compositionFiles.filter(f => 
          f.includes('500') || f.includes('sole')
        );
        if (files500.length > 1) {
          result.issues.push(`composition 폴더에 500 관련 파일이 ${files500.length}개 있습니다 (1개만 필요)`);
          console.log(`      ⚠️  500 관련 파일: ${files500.join(', ')}`);
        } else if (files500.length === 1) {
          console.log(`      ✅ 500 파일: ${files500[0]}`);
        }
      }

      // gallery 폴더 확인
      const { data: galleryFiles, error: galleryError } = await supabase.storage
        .from('blog-images')
        .list(`originals/products/${product.folder}/gallery`, {
          limit: 100,
          sortBy: { column: 'name', order: 'asc' }
        });

      if (!galleryError && galleryFiles) {
        result.galleryFiles = galleryFiles.map(f => f.name);
        console.log(`   📁 gallery/ 폴더: ${result.galleryFiles.length}개 파일`);
      }

      // 데이터베이스 확인
      const { data: dbProduct, error: dbError } = await supabase
        .from('products')
        .select('id, name, detail_images, composition_images, gallery_images')
        .eq('slug', product.slug)
        .single();

      if (!dbError && dbProduct) {
        console.log(`   💾 데이터베이스:`);
        console.log(`      - detail_images: ${Array.isArray(dbProduct.detail_images) ? dbProduct.detail_images.length : 0}개`);
        console.log(`      - composition_images: ${Array.isArray(dbProduct.composition_images) ? dbProduct.composition_images.length : 0}개`);
        console.log(`      - gallery_images: ${Array.isArray(dbProduct.gallery_images) ? dbProduct.gallery_images.length : 0}개`);
      }

    } catch (error) {
      console.error(`   ❌ 오류 발생: ${error.message}`);
      result.issues.push(`오류: ${error.message}`);
    }

    allResults[product.folder] = result;
  }

  // 결과 저장
  const outputPath = path.join(__dirname, 'all-driver-products-status.json');
  fs.writeFileSync(outputPath, JSON.stringify(allResults, null, 2));
  console.log(`\n\n✅ 결과가 ${outputPath}에 저장되었습니다.`);

  // 요약 출력
  console.log('\n📊 정리 필요 제품 요약:');
  const needsCleanup = Object.values(allResults).filter(r => r.needsCleanup || r.issues.length > 0);
  
  if (needsCleanup.length === 0) {
    console.log('   ✅ 모든 제품이 정리되어 있습니다!');
  } else {
    needsCleanup.forEach(product => {
      console.log(`\n   📦 ${product.name} (${product.folder}):`);
      if (product.needsCleanup) {
        console.log(`      - 루트 폴더 정리 필요: ${product.rootFiles.length}개 파일`);
      }
      if (product.issues.length > 0) {
        product.issues.forEach(issue => console.log(`      - ⚠️  ${issue}`));
      }
    });
  }

  console.log('\n✅ 확인 완료!');
}

checkAllDriverProductsStatus();

