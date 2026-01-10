/**
 * 모든 제품 마이그레이션 상태 확인
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

const EXPECTED_SLUGS = {
  'secret-weapon-black-muziik': 'black-beryl',
  'secret-weapon-black': 'black-weapon',
  'secret-weapon-gold-4-1': 'gold-weapon4',
  'secret-force-gold-2': 'gold2',
  'secret-force-gold-2-muziik': 'gold2-sapphire',
  'secret-force-pro-3-muziik': 'pro3-muziik',
  'secret-force-pro-3': 'pro3',
  'secret-force-v3': 'v3',
};

async function verifyMigrations() {
  console.log('🔍 모든 제품 마이그레이션 상태 확인\n');

  const results = {
    products: {},
    compositions: {},
    storage: {},
  };

  // 1. products 테이블 확인
  console.log('📊 products 테이블:');
  for (const [newSlug, oldSlug] of Object.entries(EXPECTED_SLUGS)) {
    const { data, error } = await supabase
      .from('products')
      .select('id, name, slug, detail_images')
      .or(`slug.eq.${newSlug},slug.eq.${oldSlug}`)
      .eq('product_type', 'driver')
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error(`   ❌ ${newSlug}: 조회 오류`, error);
      results.products[newSlug] = { status: 'error', error: error.message };
    } else if (data) {
      const status = data.slug === newSlug ? '✅ 업데이트됨' : '⚠️ 아직 업데이트 안됨';
      console.log(`   ${status}: ${data.slug} - ${data.name}`);
      results.products[newSlug] = {
        status: data.slug === newSlug ? 'updated' : 'needs_update',
        currentSlug: data.slug,
        name: data.name,
        hasImages: Array.isArray(data.detail_images) && data.detail_images.length > 0,
      };
    } else {
      console.log(`   ❌ ${newSlug}: 제품 없음`);
      results.products[newSlug] = { status: 'not_found' };
    }
  }

  // 2. product_composition 테이블 확인
  console.log('\n📊 product_composition 테이블:');
  for (const [newSlug, oldSlug] of Object.entries(EXPECTED_SLUGS)) {
    const { data, error } = await supabase
      .from('product_composition')
      .select('id, name, slug')
      .or(`slug.eq.${newSlug},slug.eq.${oldSlug}`)
      .eq('category', 'driver')
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error(`   ❌ ${newSlug}: 조회 오류`, error);
      results.compositions[newSlug] = { status: 'error', error: error.message };
    } else if (data) {
      const status = data.slug === newSlug ? '✅ 업데이트됨' : '⚠️ 아직 업데이트 안됨';
      console.log(`   ${status}: ${data.slug} - ${data.name}`);
      results.compositions[newSlug] = {
        status: data.slug === newSlug ? 'updated' : 'needs_update',
        currentSlug: data.slug,
        name: data.name,
      };
    } else {
      console.log(`   ❌ ${newSlug}: 제품 없음`);
      results.compositions[newSlug] = { status: 'not_found' };
    }
  }

  // 3. Storage 폴더 확인
  console.log('\n📁 Supabase Storage 폴더:');
  for (const [newSlug, oldSlug] of Object.entries(EXPECTED_SLUGS)) {
    // 새 폴더 확인
    const { data: newFolder, error: newError } = await supabase.storage
      .from('blog-images')
      .list(`originals/products/${newSlug}`, { limit: 1 });

    // 기존 폴더 확인
    const { data: oldFolder, error: oldError } = await supabase.storage
      .from('blog-images')
      .list(`originals/products/${oldSlug}`, { limit: 1 });

    if (!newError && newFolder) {
      console.log(`   ✅ ${newSlug}: 새 폴더 존재`);
      results.storage[newSlug] = { status: 'new_folder_exists' };
    } else if (!oldError && oldFolder) {
      console.log(`   ⚠️ ${newSlug}: 기존 폴더(${oldSlug})만 존재`);
      results.storage[newSlug] = { status: 'old_folder_exists', oldSlug };
    } else {
      console.log(`   ❌ ${newSlug}: 폴더 없음`);
      results.storage[newSlug] = { status: 'not_found' };
    }
  }

  // 요약
  console.log('\n📊 요약:');
  const productsUpdated = Object.values(results.products).filter(r => r.status === 'updated').length;
  const productsNeedsUpdate = Object.values(results.products).filter(r => r.status === 'needs_update').length;
  const compsUpdated = Object.values(results.compositions).filter(r => r.status === 'updated').length;
  const compsNeedsUpdate = Object.values(results.compositions).filter(r => r.status === 'needs_update').length;
  const storageUpdated = Object.values(results.storage).filter(r => r.status === 'new_folder_exists').length;

  console.log(`   products: ${productsUpdated}개 업데이트됨, ${productsNeedsUpdate}개 업데이트 필요`);
  console.log(`   product_composition: ${compsUpdated}개 업데이트됨, ${compsNeedsUpdate}개 업데이트 필요`);
  console.log(`   Storage: ${storageUpdated}개 새 폴더 존재`);

  return results;
}

verifyMigrations().catch(console.error);
