/**
 * 데이터베이스에서 구식 경로 확인
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

const OLD_PATHS = [
  'black-beryl',
  'black-weapon',
  'gold-weapon4',
  'gold2',
  'gold2-sapphire',
  'pro3-muziik',
  'pro3',
  'v3',
];

async function checkOldPaths() {
  console.log('🔍 데이터베이스에서 구식 경로 확인\n');

  // 1. products 테이블 확인
  console.log('1️⃣ products 테이블 확인');
  for (const oldPath of OLD_PATHS) {
    const { data, count } = await supabase
      .from('products')
      .select('id, name, slug, detail_images, gallery_images, composition_images', { count: 'exact' })
      .or(`detail_images::text.ilike.%${oldPath}%,gallery_images::text.ilike.%${oldPath}%,composition_images::text.ilike.%${oldPath}%`);

    if (count > 0) {
      console.log(`⚠️ ${oldPath}: ${count}개 제품에서 발견`);
      data?.forEach(p => {
        console.log(`   - ${p.name} (${p.slug})`);
        if (p.detail_images && JSON.stringify(p.detail_images).includes(oldPath)) {
          console.log(`     detail_images에 구식 경로 포함`);
        }
        if (p.gallery_images && JSON.stringify(p.gallery_images).includes(oldPath)) {
          console.log(`     gallery_images에 구식 경로 포함`);
        }
        if (p.composition_images && JSON.stringify(p.composition_images).includes(oldPath)) {
          console.log(`     composition_images에 구식 경로 포함`);
        }
      });
    }
  }

  // 2. product_composition 테이블 확인
  console.log('\n2️⃣ product_composition 테이블 확인');
  for (const oldPath of OLD_PATHS) {
    const { data, count } = await supabase
      .from('product_composition')
      .select('id, name, slug, image_url, reference_images', { count: 'exact' })
      .or(`image_url.ilike.%${oldPath}%,reference_images::text.ilike.%${oldPath}%`);

    if (count > 0) {
      console.log(`⚠️ ${oldPath}: ${count}개 제품에서 발견`);
      data?.forEach(p => {
        console.log(`   - ${p.name} (${p.slug})`);
        if (p.image_url && p.image_url.includes(oldPath)) {
          console.log(`     image_url: ${p.image_url.substring(0, 100)}...`);
        }
        if (p.reference_images && JSON.stringify(p.reference_images).includes(oldPath)) {
          console.log(`     reference_images에 구식 경로 포함`);
        }
      });
    }
  }

  console.log('\n✅ 확인 완료!');
}

checkOldPaths().catch(console.error);
