/**
 * 드라이버 제품 데이터베이스 마이그레이션 스크립트
 * pages/index.js에 하드코딩된 8개 드라이버 제품을 products 테이블에 저장
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

// 드라이버 제품 데이터 (pages/index.js에서 추출)
const driverProducts = [
  {
    name: '시크리트포스 골드 2 MUZIIK',
    slug: 'gold2-sapphire',
    product_type: 'driver',
    category: 'driver',
    subtitle: 'MUZIIK 협업 제품',
    normal_price: 2200000,
    sale_price: null,
    badge_left: 'NEW',
    badge_right: 'BEST',
    badge_left_color: 'red',
    badge_right_color: 'yellow',
    border_color: 'yellow',
    features: [
      '오토플렉스 티타늄 샤프트',
      'ONE-FLEX A200·A215',
      '무제한 2년 헤드 보증'
    ],
    detail_images: [
      'originals/products/gold2-sapphire/detail/massgoo_sf_gold2_muz_11.webp',
      'originals/products/gold2-sapphire/detail/massgoo_sf_gold2_muz_01.webp',
      'originals/products/gold2-sapphire/detail/massgoo_sf_gold2_muz_12.webp',
      'originals/products/gold2-sapphire/detail/massgoo_sf_gold2_muz_13.webp',
      'originals/products/gold2-sapphire/detail/massgoo_sf_gold2_muz_14.webp',
      'originals/products/gold2-sapphire/detail/massgoo_sf_gold2_muz_16.webp',
      'originals/products/gold2-sapphire/detail/massgoo_sf_gold2_muz_17.webp',
      'originals/products/gold2-sapphire/detail/massgoo_sf_gold2_muz_18.webp',
      'originals/products/gold2-sapphire/detail/massgoo_sf_gold2_muz_22.webp',
      'originals/products/gold2-sapphire/detail/massgoo_sf_gold2_muz_23.webp',
    ],
    composition_images: [
      'originals/products/gold2-sapphire/composition/secret-force-gold-2-sole-500.webp'
    ],
    display_order: 1,
    is_active: true,
    is_sellable: true,
    is_gift: false,
  },
  {
    name: '시크리트웨폰 블랙 MUZIIK',
    slug: 'black-beryl',
    product_type: 'driver',
    category: 'driver',
    subtitle: 'MUZIIK 협업 제품',
    normal_price: 2200000,
    sale_price: null,
    badge_left: 'NEW',
    badge_right: 'LIMITED',
    badge_left_color: 'red',
    badge_right_color: 'green',
    border_color: 'green',
    features: [
      '풀 티타늄 4X 샤프트',
      '40g대, 최대 X 플렉스',
      '2년 헤드 보증(최대 3회)'
    ],
    detail_images: [
      'originals/products/black-beryl/detail/massgoo_sw_black_muz_11.webp',
      'originals/products/black-beryl/detail/massgoo_sw_black_muz_01.webp',
      'originals/products/black-beryl/detail/massgoo_sw_black_muz_12.webp',
      'originals/products/black-beryl/detail/massgoo_sw_black_muz_13.webp',
      'originals/products/black-beryl/detail/massgoo_sw_black_muz_14_b.webp',
      'originals/products/black-beryl/detail/massgoo_sw_black_muz_15.webp',
      'originals/products/black-beryl/detail/massgoo_sw_black_muz_18.webp',
      'originals/products/black-beryl/detail/massgoo_sw_black_muz_23.webp',
    ],
    composition_images: [
      'originals/products/black-beryl/composition/secret-weapon-black-sole-500.webp'
    ],
    display_order: 2,
    is_active: true,
    is_sellable: true,
    is_gift: false,
  },
  {
    name: '시크리트포스 PRO 3 MUZIIK',
    slug: 'pro3-muziik',
    product_type: 'driver',
    category: 'driver',
    subtitle: 'MUZIIK 협업 제품',
    normal_price: 1700000,
    sale_price: null,
    badge_left: 'NEW',
    badge_right: null,
    badge_left_color: 'red',
    badge_right_color: null,
    border_color: null,
    features: [
      'MUZIIK 샤프트',
      '사파이어, 베릴 샤프트 추가',
      '업그레이드된 고반발 드라이버'
    ],
    detail_images: [
      'originals/products/pro3-muziik/detail/secret-force-pro-3-muziik-00.webp',
      'originals/products/pro3-muziik/detail/massgoo_pro3_beryl_230.webp',
      'originals/products/pro3-muziik/detail/massgoo_pro3_beryl_240.webp',
      'originals/products/pro3-muziik/detail/massgoo_pro3_beryl_250.webp',
      'originals/products/pro3-muziik/detail/massgoo_pro3_sapphire_200.webp',
      'originals/products/pro3-muziik/detail/massgoo_pro3_sapphire_215.webp',
      'originals/products/pro3-muziik/detail/secret-force-pro-3-muziik-03.webp',
    ],
    composition_images: [
      'originals/products/pro3-muziik/composition/secret-force-pro-3-sole-500.webp'
    ],
    display_order: 3,
    is_active: true,
    is_sellable: true,
    is_gift: false,
  },
  {
    name: '시크리트포스 골드 2',
    slug: 'gold2',
    product_type: 'driver',
    category: 'driver',
    subtitle: '프리미엄 드라이버',
    normal_price: 1700000,
    sale_price: null,
    badge_left: 'BEST',
    badge_right: null,
    badge_left_color: 'yellow',
    badge_right_color: null,
    border_color: 'yellow',
    features: [
      'DAT55G+ Grade 5 티타늄',
      '2.2mm 초박형 페이스',
      'COR 0.87'
    ],
    detail_images: [
      'originals/products/gold2/detail/gold2_00_01.jpg',
      'originals/products/gold2/detail/gold2_01.jpg',
      'originals/products/gold2/detail/gold2_02.jpg',
      'originals/products/gold2/detail/gold2_03.jpg',
      'originals/products/gold2/detail/gold2_04.jpg',
      'originals/products/gold2/detail/gold2_05.jpg',
      'originals/products/gold2/detail/gold2_06.jpg',
      'originals/products/gold2/detail/gold2_07.jpg',
      'originals/products/gold2/detail/gold2_08_01.jpg',
    ],
    composition_images: [
      'originals/products/gold2/composition/secret-force-gold-2-sole-500.webp'
    ],
    display_order: 4,
    is_active: true,
    is_sellable: true,
    is_gift: false,
  },
  {
    name: '시크리트포스 PRO 3',
    slug: 'pro3',
    product_type: 'driver',
    category: 'driver',
    subtitle: '고반발 드라이버',
    normal_price: 1150000,
    sale_price: null,
    badge_left: null,
    badge_right: null,
    badge_left_color: null,
    badge_right_color: null,
    border_color: null,
    features: [
      'DAT55G 티타늄',
      '2.3mm 페이스',
      'COR 0.86'
    ],
    detail_images: [
      'originals/products/pro3/detail/secret-force-pro-3-gallery-00.webp',
      'originals/products/pro3/detail/secret-force-pro-3-gallery-01.webp',
      'originals/products/pro3/detail/secret-force-pro-3-gallery-02.webp',
      'originals/products/pro3/detail/secret-force-pro-3-gallery-03.webp',
      'originals/products/pro3/detail/secret-force-pro-3-gallery-04.webp',
      'originals/products/pro3/detail/secret-force-pro-3-gallery-05.webp',
      'originals/products/pro3/detail/secret-force-pro-3-gallery-06.webp',
      'originals/products/pro3/detail/secret-force-pro-3-gallery-07.webp',
      'originals/products/pro3/detail/secret-force-pro-3-gallery-08.webp',
    ],
    composition_images: [
      'originals/products/pro3/composition/secret-force-pro-3-sole-500.webp'
    ],
    display_order: 5,
    is_active: true,
    is_sellable: true,
    is_gift: false,
  },
  {
    name: '시크리트포스 V3',
    slug: 'v3',
    product_type: 'driver',
    category: 'driver',
    subtitle: '투어 드라이버',
    normal_price: 950000,
    sale_price: null,
    badge_left: null,
    badge_right: null,
    badge_left_color: null,
    badge_right_color: null,
    border_color: null,
    features: [
      'DAT55G 티타늄',
      '2.4mm 페이스',
      'COR 0.85'
    ],
    detail_images: [
      'originals/products/v3/detail/secret-force-v3-gallery-05-00.webp',
      'originals/products/v3/detail/secret-force-v3-gallery-02.webp',
      'originals/products/v3/detail/secret-force-v3-gallery-03.webp',
      'originals/products/v3/detail/secret-force-v3-gallery-04.webp',
      'originals/products/v3/detail/secret-force-v3-gallery-05.webp',
      'originals/products/v3/detail/secret-force-v3-gallery-06.webp',
      'originals/products/v3/detail/secret-force-v3-gallery-07.webp',
    ],
    composition_images: [
      'originals/products/v3/composition/secret-force-v3-sole-350-bg.webp'
    ],
    display_order: 6,
    is_active: true,
    is_sellable: true,
    is_gift: false,
  },
  {
    name: '시크리트웨폰 블랙',
    slug: 'black-weapon',
    product_type: 'driver',
    category: 'driver',
    subtitle: '프리미엄 리미티드',
    normal_price: 1700000,
    sale_price: null,
    badge_left: 'LIMITED',
    badge_right: null,
    badge_left_color: 'purple',
    badge_right_color: null,
    border_color: 'purple',
    features: [
      'SP700 Grade 5 티타늄',
      '2.2mm 초박형 페이스',
      'COR 0.87'
    ],
    detail_images: [
      'originals/products/black-weapon/detail/secret-weapon-black-gallery-00-01.webp',
      'originals/products/black-weapon/detail/secret-weapon-black-gallery-01.webp',
      'originals/products/black-weapon/detail/secret-weapon-black-gallery-02.webp',
      'originals/products/black-weapon/detail/secret-weapon-black-gallery-03.webp',
      'originals/products/black-weapon/detail/secret-weapon-black-gallery-04.webp',
      'originals/products/black-weapon/detail/secret-weapon-black-gallery-05.webp',
      'originals/products/black-weapon/detail/secret-weapon-black-gallery-06.webp',
      'originals/products/black-weapon/detail/secret-weapon-black-gallery-07.webp',
      'originals/products/black-weapon/detail/secret-weapon-black-gallery-08-01.webp',
    ],
    composition_images: [
      'originals/products/black-weapon/composition/secret-weapon-black-sole-500.webp'
    ],
    display_order: 7,
    is_active: true,
    is_sellable: true,
    is_gift: false,
  },
  {
    name: '시크리트웨폰 골드 4.1',
    slug: 'gold-weapon4',
    product_type: 'driver',
    category: 'driver',
    subtitle: '프리미엄 드라이버',
    normal_price: 1700000,
    sale_price: null,
    badge_left: null,
    badge_right: null,
    badge_left_color: null,
    badge_right_color: null,
    border_color: null,
    features: [
      'SP700 Grade 5 티타늄',
      '2.2mm 초박형 페이스',
      'COR 0.87'
    ],
    detail_images: [
      'originals/products/gold-weapon4/detail/secret-weapon-gold-4-1-gallery-00-01.webp',
      'originals/products/gold-weapon4/detail/secret-weapon-gold-4-1-gallery-01.webp',
      'originals/products/gold-weapon4/detail/secret-weapon-gold-4-1-gallery-02.webp',
      'originals/products/gold-weapon4/detail/secret-weapon-gold-4-1-gallery-03.webp',
      'originals/products/gold-weapon4/detail/secret-weapon-gold-4-1-gallery-04.webp',
      'originals/products/gold-weapon4/detail/secret-weapon-gold-4-1-gallery-05.webp',
      'originals/products/gold-weapon4/detail/secret-weapon-gold-4-1-gallery-06.webp',
      'originals/products/gold-weapon4/detail/secret-weapon-gold-4-1-gallery-07.webp',
      'originals/products/gold-weapon4/detail/secret-weapon-gold-4-1-gallery-08-01.webp',
    ],
    composition_images: [
      'originals/products/gold-weapon4/composition/secret-weapon-gold-4-1-sole-500.webp'
    ],
    display_order: 8,
    is_active: true,
    is_sellable: true,
    is_gift: false,
  },
];

async function migrateDriverProducts() {
  console.log('🔄 드라이버 제품 데이터베이스 마이그레이션 시작...\n');

  const results = {
    success: [],
    failed: [],
    skipped: []
  };

  for (const product of driverProducts) {
    try {
      // 기존 제품 확인 (slug로)
      const { data: existing } = await supabase
        .from('products')
        .select('id, slug')
        .eq('slug', product.slug)
        .maybeSingle();

      if (existing) {
        console.log(`⏭️  건너뜀 (이미 존재): ${product.name} (slug: ${product.slug})`);
        results.skipped.push({
          name: product.name,
          slug: product.slug,
          reason: '이미 존재'
        });
        continue;
      }

      // 제품 삽입
      const { data, error } = await supabase
        .from('products')
        .insert([product])
        .select()
        .single();

      if (error) {
        console.error(`❌ 실패: ${product.name}`, error.message);
        results.failed.push({
          name: product.name,
          slug: product.slug,
          error: error.message
        });
      } else {
        console.log(`✅ 성공: ${product.name} (ID: ${data.id})`);
        results.success.push({
          name: product.name,
          slug: product.slug,
          id: data.id
        });
      }
    } catch (error) {
      console.error(`❌ 오류: ${product.name}`, error.message);
      results.failed.push({
        name: product.name,
        slug: product.slug,
        error: error.message
      });
    }
  }

  console.log('\n📊 마이그레이션 요약:');
  console.log(`  ✅ 성공: ${results.success.length}개`);
  console.log(`  ⏭️  건너뜀: ${results.skipped.length}개`);
  console.log(`  ❌ 실패: ${results.failed.length}개`);

  if (results.failed.length > 0) {
    console.log('\n❌ 실패한 제품:');
    results.failed.forEach(f => {
      console.log(`  - ${f.name}: ${f.error}`);
    });
  }

  // 로그 저장
  const fs = require('fs');
  const path = require('path');
  const logPath = path.join(process.cwd(), 'migration-log-driver-products.json');
  fs.writeFileSync(logPath, JSON.stringify(results, null, 2));
  console.log(`\n📝 로그 저장: ${logPath}`);

  console.log('\n🎉 드라이버 제품 마이그레이션 완료!');
}

migrateDriverProducts().catch(error => {
  console.error('❌ 마이그레이션 중 오류 발생:', error);
  process.exit(1);
});

