/**
 * 데이터베이스에서 샤프트 및 배지 이미지 URL 확인 스크립트
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Supabase 환경 변수가 설정되지 않았습니다.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function verifyShaftBadgeInDB() {
  console.log('🔍 데이터베이스에서 샤프트 및 배지 이미지 URL 확인\n');

  const { data: products, error } = await supabase
    .from('product_composition')
    .select('id, name, slug, shaft_image_url, badge_image_url, reference_images')
    .in('slug', ['secret-force-v3', 'secret-force-pro-3', 'secret-force-pro-3-muziik'])
    .order('slug');

  if (error) {
    console.error('❌ 조회 오류:', error);
    process.exit(1);
  }

  console.log(`📊 조회된 제품: ${products?.length || 0}개\n`);

  for (const product of products || []) {
    console.log(`📦 ${product.name} (${product.slug})`);
    console.log(`   샤프트 URL: ${product.shaft_image_url || '❌ 없음'}`);
    console.log(`   배지 URL: ${product.badge_image_url || '❌ 없음'}`);
    
    // 참조 이미지에 샤프트/배지가 포함되어 있는지 확인
    const refImages = product.reference_images || [];
    const hasShaft = refImages.some((img) => 
      img.includes('shaft') || img.includes('샤프트')
    );
    const hasBadge = refImages.some((img) => 
      img.includes('badge') || img.includes('배지')
    );
    
    console.log(`   참조 이미지 개수: ${refImages.length}개`);
    if (hasShaft) {
      console.log(`   ✅ 참조 이미지에 샤프트 포함됨`);
    }
    if (hasBadge) {
      console.log(`   ✅ 참조 이미지에 배지 포함됨`);
    }
    console.log('');
  }

  // Supabase Storage에서 파일 존재 확인
  console.log('📁 Supabase Storage 파일 확인:\n');

  const storageChecks = [
    { slug: 'secret-force-v3', files: ['secret-force-v3-shaft.webp', 'secret-force-v3-badge.webp'] },
    { slug: 'secret-force-pro-3', files: ['secret-force-pro-3-shaft.webp', 'secret-force-pro-3-badge.webp'] },
    { slug: 'secret-force-pro-3-muziik', files: ['secret-force-pro-3-badge.webp'] },
  ];

  for (const check of storageChecks) {
    console.log(`📂 ${check.slug}/composition/`);
    for (const fileName of check.files) {
      const { data, error: listError } = await supabase.storage
        .from('blog-images')
        .list(`originals/products/${check.slug}/composition`, {
          search: fileName
        });

      if (listError) {
        console.log(`   ❌ ${fileName} - 조회 오류: ${listError.message}`);
      } else if (data && data.some(f => f.name === fileName)) {
        console.log(`   ✅ ${fileName}`);
      } else {
        console.log(`   ❌ ${fileName} - 파일 없음`);
      }
    }
    console.log('');
  }
}

verifyShaftBadgeInDB().catch(console.error);
