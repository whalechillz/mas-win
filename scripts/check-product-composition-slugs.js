/**
 * product_composition 테이블의 slug 확인
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

async function checkProductCompositionSlugs() {
  console.log('🔍 product_composition 테이블 slug 확인\n');

  // 모든 드라이버 제품 조회
  const { data, error } = await supabase
    .from('product_composition')
    .select('id, name, slug, image_url, category')
    .eq('category', 'driver')
    .order('display_order', { ascending: true });

  if (error) {
    console.error('❌ 조회 오류:', error.message);
    return;
  }

  console.log('📊 드라이버 제품 목록:\n');
  
  const oldSlugs = [];
  data.forEach(product => {
    const isOld = ['black-beryl', 'black-weapon', 'gold-weapon4', 'gold2', 'gold2-sapphire', 'pro3-muziik', 'pro3', 'v3'].includes(product.slug);
    const status = isOld ? '❌' : '✅';
    console.log(`${status} ${product.name}`);
    console.log(`   Slug: ${product.slug}`);
    console.log(`   Image URL: ${product.image_url ? product.image_url.substring(0, 80) + '...' : '없음'}`);
    console.log('');
    
    if (isOld) {
      oldSlugs.push(product);
    }
  });

  if (oldSlugs.length > 0) {
    console.log('⚠️ 업데이트가 필요한 제품:');
    oldSlugs.forEach(p => {
      console.log(`   - ${p.name}: ${p.slug}`);
    });
  } else {
    console.log('✅ 모든 slug가 업데이트되었습니다!');
  }
}

checkProductCompositionSlugs().catch(console.error);
