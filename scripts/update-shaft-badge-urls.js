/**
 * 샤프트 및 배지 이미지 URL 업데이트 스크립트
 * product_composition 테이블의 각 제품에 샤프트/배지 이미지 URL 설정
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

async function updateShaftBadgeUrls() {
  console.log('🚀 샤프트 및 배지 이미지 URL 업데이트 시작\n');

  const updates = [
    {
      slug: 'secret-force-v3',
      shaft_image_url: 'originals/products/secret-force-v3/composition/secret-force-v3-shaft.webp',
      badge_image_url: 'originals/products/secret-force-v3/composition/secret-force-v3-badge.webp',
      name: '시크리트포스 V3'
    },
    {
      slug: 'secret-force-pro-3',
      shaft_image_url: 'originals/products/secret-force-pro-3/composition/secret-force-pro-3-shaft.webp',
      badge_image_url: 'originals/products/secret-force-pro-3/composition/secret-force-pro-3-badge.webp',
      name: '시크리트포스 PRO 3'
    },
    {
      slug: 'secret-force-pro-3-muziik',
      shaft_image_url: 'originals/products/secret-force-pro-3/composition/secret-force-pro-3-shaft.webp',
      badge_image_url: 'originals/products/secret-force-pro-3-muziik/composition/secret-force-pro-3-badge.webp',
      name: '시크리트포스 PRO 3 MUZIIK'
    }
  ];

  const results = [];
  let successCount = 0;
  let errorCount = 0;

  for (const update of updates) {
    console.log(`📝 업데이트 중: ${update.name} (${update.slug})`);
    
    const { data, error } = await supabase
      .from('product_composition')
      .update({
        shaft_image_url: update.shaft_image_url,
        badge_image_url: update.badge_image_url
      })
      .eq('slug', update.slug)
      .select();

    if (error) {
      console.error(`  ❌ 업데이트 실패: ${error.message}`);
      errorCount++;
      results.push({
        slug: update.slug,
        success: false,
        error: error.message
      });
    } else {
      if (data && data.length > 0) {
        console.log(`  ✅ 업데이트 완료`);
        console.log(`     샤프트: ${update.shaft_image_url}`);
        console.log(`     배지: ${update.badge_image_url}`);
        successCount++;
        results.push({
          slug: update.slug,
          success: true,
          data: data[0]
        });
      } else {
        console.warn(`  ⚠️ 제품을 찾을 수 없습니다: ${update.slug}`);
        errorCount++;
        results.push({
          slug: update.slug,
          success: false,
          error: 'Product not found'
        });
      }
    }
    console.log('');
  }

  // 결과 확인
  console.log('📊 업데이트 결과 확인:\n');
  const { data: verifyData, error: verifyError } = await supabase
    .from('product_composition')
    .select('slug, name, shaft_image_url, badge_image_url')
    .in('slug', ['secret-force-v3', 'secret-force-pro-3', 'secret-force-pro-3-muziik'])
    .order('slug');

  if (verifyError) {
    console.error('❌ 결과 확인 오류:', verifyError);
  } else {
    console.log('✅ 업데이트된 제품 목록:');
    verifyData?.forEach(product => {
      console.log(`\n  📦 ${product.name} (${product.slug})`);
      console.log(`     샤프트: ${product.shaft_image_url || '(없음)'}`);
      console.log(`     배지: ${product.badge_image_url || '(없음)'}`);
    });
  }

  console.log('\n' + '='.repeat(60));
  console.log('📊 최종 요약:');
  console.log(`  - 성공: ${successCount}개`);
  console.log(`  - 실패: ${errorCount}개`);
  console.log('='.repeat(60));

  if (errorCount > 0) {
    console.log('\n❌ 실패한 업데이트:');
    results.filter(r => !r.success).forEach(r => {
      console.log(`  - ${r.slug}: ${r.error}`);
    });
    process.exit(1);
  }
}

// 실행
updateShaftBadgeUrls().catch(console.error);
