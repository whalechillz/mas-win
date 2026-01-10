/**
 * 모든 수정사항 확인 스크립트
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

async function verifyAllFixes() {
  console.log('🔍 모든 수정사항 확인\n');
  console.log('='.repeat(60));

  // 1. product_composition 테이블 slug 확인
  console.log('\n1️⃣ product_composition 테이블 slug 확인');
  const { data: products, error: productsError } = await supabase
    .from('product_composition')
    .select('id, name, slug, image_url')
    .eq('category', 'driver')
    .order('display_order', { ascending: true });

  if (productsError) {
    console.error('❌ 조회 오류:', productsError.message);
  } else {
    const oldSlugs = products.filter(p => 
      ['black-beryl', 'black-weapon', 'gold-weapon4', 'gold2', 'gold2-sapphire', 'pro3-muziik', 'pro3', 'v3'].includes(p.slug.trim())
    );
    
    if (oldSlugs.length > 0) {
      console.log('⚠️ 아직 업데이트되지 않은 slug:');
      oldSlugs.forEach(p => {
        console.log(`   - ${p.name}: "${p.slug}"`);
      });
    } else {
      console.log('✅ 모든 slug가 업데이트되었습니다!');
      products.forEach(p => {
        console.log(`   ✅ ${p.name}: ${p.slug}`);
      });
    }
  }

  // 2. image_url 경로 확인
  console.log('\n2️⃣ image_url 경로 확인');
  const { data: productsWithOldPaths, error: pathsError } = await supabase
    .from('product_composition')
    .select('id, name, image_url')
    .eq('category', 'driver')
    .or('image_url.ilike.%gold-weapon4%,image_url.ilike.%/main/products/gold-weapon4%');

  if (pathsError) {
    console.error('❌ 조회 오류:', pathsError.message);
  } else if (productsWithOldPaths && productsWithOldPaths.length > 0) {
    console.log('⚠️ 구식 경로가 남아있는 제품:');
    productsWithOldPaths.forEach(p => {
      console.log(`   - ${p.name}: ${p.image_url?.substring(0, 80)}...`);
    });
  } else {
    console.log('✅ 모든 image_url이 업데이트되었습니다!');
  }

  // 3. reference_images 경로 확인
  console.log('\n3️⃣ reference_images 경로 확인');
  const { data: productsWithRefImages, error: refError } = await supabase
    .from('product_composition')
    .select('id, name, reference_images')
    .eq('category', 'driver')
    .not('reference_images', 'is', null);

  if (refError) {
    console.error('❌ 조회 오류:', refError.message);
  } else if (productsWithRefImages) {
    let hasOldPaths = false;
    productsWithRefImages.forEach(p => {
      if (p.reference_images && Array.isArray(p.reference_images)) {
        const oldPaths = p.reference_images.filter(url => 
          url.includes('gold-weapon4') || url.includes('/main/products/gold-weapon4')
        );
        if (oldPaths.length > 0) {
          hasOldPaths = true;
          console.log(`⚠️ ${p.name}: ${oldPaths.length}개 구식 경로 발견`);
        }
      }
    });
    if (!hasOldPaths) {
      console.log('✅ 모든 reference_images가 업데이트되었습니다!');
    }
  }

  // 4. secret-force-common 폴더 확인
  console.log('\n4️⃣ secret-force-common 폴더 확인');
  const { data: commonFiles, error: commonError } = await supabase.storage
    .from('blog-images')
    .list('originals/products/secret-force-common/composition', { limit: 10 });

  if (commonError) {
    console.error('❌ 폴더 확인 오류:', commonError.message);
  } else if (commonFiles && commonFiles.length > 0) {
    const fileCount = commonFiles.filter(f => f.metadata && f.metadata.size !== undefined).length;
    console.log(`✅ secret-force-common 폴더에 ${fileCount}개 파일 존재`);
  } else {
    console.log('⚠️ secret-force-common 폴더가 비어있습니다.');
  }

  console.log('\n' + '='.repeat(60));
  console.log('✅ 확인 완료!');
}

verifyAllFixes().catch(console.error);
