/**
 * 각 제품의 detail과 gallery 폴더 이미지 분석
 * detail에 gallery 이미지가 있는지, gallery에 detail 이미지가 있는지 확인
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

// 드라이버 제품 목록
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

/**
 * 파일명으로 이미지 타입 판단
 */
function determineImageType(fileName) {
  const lowerName = fileName.toLowerCase();
  
  // gallery 이미지: gallery- 접두사 포함
  if (lowerName.includes('gallery-')) {
    return 'gallery';
  }
  
  // composition 이미지
  if (
    lowerName.includes('-sole-') ||
    lowerName.includes('-500') ||
    lowerName.startsWith('500') ||
    lowerName.includes('composition') ||
    lowerName.includes('composed')
  ) {
    return 'composition';
  }
  
  // detail 이미지: 기본값
  return 'detail';
}

async function analyzeDetailVsGallery() {
  console.log('🔍 detail vs gallery 이미지 분석 시작...\n');

  const allResults = {};

  for (const product of driverProducts) {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`📦 ${product.name} (${product.folder})`);
    console.log(`${'='.repeat(60)}`);

    const result = {
      folder: product.folder,
      slug: product.slug,
      name: product.name,
      detailFiles: [],
      galleryFiles: [],
      misplacedInDetail: [], // detail 폴더에 있지만 gallery 이미지인 것들
      misplacedInGallery: [], // gallery 폴더에 있지만 detail 이미지인 것들
      needsFix: false
    };

    try {
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
        
        // detail 폴더에서 gallery 이미지 찾기
        result.detailFiles.forEach(fileName => {
          const imageType = determineImageType(fileName);
          if (imageType === 'gallery') {
            result.misplacedInDetail.push({
              fileName,
              currentLocation: 'detail',
              shouldBe: 'gallery'
            });
          }
        });
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
        
        // gallery 폴더에서 detail 이미지 찾기
        result.galleryFiles.forEach(fileName => {
          const imageType = determineImageType(fileName);
          if (imageType === 'detail') {
            result.misplacedInGallery.push({
              fileName,
              currentLocation: 'gallery',
              shouldBe: 'detail'
            });
          }
        });
      }

      // 문제 발견 여부
      if (result.misplacedInDetail.length > 0 || result.misplacedInGallery.length > 0) {
        result.needsFix = true;
      }

      // 결과 출력
      if (result.misplacedInDetail.length > 0) {
        console.log(`   ⚠️  detail 폴더에 gallery 이미지 ${result.misplacedInDetail.length}개 발견:`);
        result.misplacedInDetail.forEach(item => {
          console.log(`      - ${item.fileName} → gallery/로 이동 필요`);
        });
      }

      if (result.misplacedInGallery.length > 0) {
        console.log(`   ⚠️  gallery 폴더에 detail 이미지 ${result.misplacedInGallery.length}개 발견:`);
        result.misplacedInGallery.forEach(item => {
          console.log(`      - ${item.fileName} → detail/로 이동 필요`);
        });
      }

      if (!result.needsFix) {
        console.log(`   ✅ detail과 gallery 폴더가 올바르게 정리되어 있습니다.`);
      }

    } catch (error) {
      console.error(`   ❌ 오류 발생: ${error.message}`);
      result.errors = error.message;
    }

    allResults[product.folder] = result;
  }

  // 결과 저장
  const outputPath = path.join(__dirname, 'detail-vs-gallery-analysis.json');
  fs.writeFileSync(outputPath, JSON.stringify(allResults, null, 2));
  console.log(`\n\n✅ 결과가 ${outputPath}에 저장되었습니다.`);

  // 요약 출력
  console.log('\n📊 정리 필요 제품 요약:');
  const needsFix = Object.values(allResults).filter(r => r.needsFix);
  
  if (needsFix.length === 0) {
    console.log('   ✅ 모든 제품이 올바르게 정리되어 있습니다!');
  } else {
    needsFix.forEach(product => {
      console.log(`\n   📦 ${product.name} (${product.folder}):`);
      if (product.misplacedInDetail.length > 0) {
        console.log(`      - detail → gallery 이동 필요: ${product.misplacedInDetail.length}개`);
        product.misplacedInDetail.forEach(item => {
          console.log(`        * ${item.fileName}`);
        });
      }
      if (product.misplacedInGallery.length > 0) {
        console.log(`      - gallery → detail 이동 필요: ${product.misplacedInGallery.length}개`);
        product.misplacedInGallery.forEach(item => {
          console.log(`        * ${item.fileName}`);
        });
      }
    });
  }

  console.log('\n✅ 분석 완료!');
}

analyzeDetailVsGallery();

