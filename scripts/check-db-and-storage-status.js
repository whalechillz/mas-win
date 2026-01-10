/**
 * 데이터베이스와 Storage 상태 확인 스크립트
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

async function checkStatus() {
  console.log('🔍 데이터베이스와 Storage 상태 확인\n');

  // 1. products 테이블 확인
  console.log('📊 products 테이블:');
  const { data: products, error: productsError } = await supabase
    .from('products')
    .select('id, name, slug, detail_images, gallery_images, composition_images')
    .or('slug.eq.gold-weapon4,slug.eq.secret-weapon-4-1,slug.eq.secret-weapon-gold-4-1');

  if (productsError) {
    console.error('❌ products 조회 오류:', productsError);
  } else {
    console.log(`   총 ${products?.length || 0}개 제품 발견:`);
    products?.forEach(p => {
      console.log(`   - ${p.slug}: ${p.name}`);
      console.log(`     detail_images: ${Array.isArray(p.detail_images) ? p.detail_images.length : 0}개`);
      if (p.detail_images && p.detail_images.length > 0) {
        console.log(`       첫 번째 경로: ${p.detail_images[0]}`);
      }
    });
  }

  // 2. product_composition 테이블 확인
  console.log('\n📊 product_composition 테이블:');
  const { data: compositions, error: compError } = await supabase
    .from('product_composition')
    .select('id, name, slug')
    .or('slug.eq.gold-weapon4,slug.eq.secret-weapon-4-1,slug.eq.secret-weapon-gold-4-1');

  if (compError) {
    console.error('❌ product_composition 조회 오류:', compError);
  } else {
    console.log(`   총 ${compositions?.length || 0}개 발견:`);
    compositions?.forEach(c => {
      console.log(`   - ${c.slug}: ${c.name}`);
    });
  }

  // 3. Storage 폴더 확인
  console.log('\n📁 Supabase Storage 폴더 확인:');
  
  // 기존 폴더 확인
  const { data: oldFolder, error: oldError } = await supabase.storage
    .from('blog-images')
    .list('originals/products/gold-weapon4', { limit: 5 });

  if (oldError) {
    console.log('   ❌ gold-weapon4 폴더: 존재하지 않음 (이미 변경됨)');
  } else {
    console.log(`   ⚠️ gold-weapon4 폴더: 아직 존재함 (${oldFolder?.length || 0}개 항목)`);
  }

  // 새 폴더 확인
  const { data: newFolder, error: newError } = await supabase.storage
    .from('blog-images')
    .list('originals/products/secret-weapon-gold-4-1', { limit: 5 });

  if (newError) {
    console.log('   ❌ secret-weapon-gold-4-1 폴더: 존재하지 않음');
  } else {
    console.log(`   ✅ secret-weapon-gold-4-1 폴더: 존재함 (${newFolder?.length || 0}개 항목)`);
    
    // detail 폴더 확인
    const { data: detailFiles, error: detailError } = await supabase.storage
      .from('blog-images')
      .list('originals/products/secret-weapon-gold-4-1/detail', { limit: 10 });

    if (!detailError && detailFiles) {
      console.log(`     detail 폴더: ${detailFiles.length}개 파일`);
      detailFiles.slice(0, 3).forEach(f => {
        console.log(`       - ${f.name}`);
      });
    }
  }

  // 4. 다른 제품들도 확인
  console.log('\n📊 다른 제품 폴더 상태:');
  const otherProducts = [
    'black-beryl',
    'black-weapon',
    'gold2',
    'gold2-sapphire',
    'pro3',
    'pro3-muziik',
    'v3',
  ];

  for (const product of otherProducts) {
    const { data, error } = await supabase.storage
      .from('blog-images')
      .list(`originals/products/${product}`, { limit: 1 });

    if (error) {
      console.log(`   ❌ ${product}: 폴더 없음`);
    } else {
      console.log(`   ✅ ${product}: 폴더 존재`);
    }
  }

  console.log('\n✅ 확인 완료');
}

checkStatus().catch(console.error);
