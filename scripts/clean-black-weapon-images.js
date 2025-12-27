/**
 * black-weapon 제품 이미지 정리
 * 1. Storage에서 정상 파일명만 추출
 * 2. 중복 제거
 * 3. 데이터베이스 업데이트
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

async function cleanBlackWeaponImages() {
  console.log('🧹 black-weapon 이미지 정리 시작...\n');
  
  // 1. Storage에서 모든 파일 가져오기
  const { data: files, error: listError } = await supabase.storage
    .from('blog-images')
    .list('originals/products/black-weapon/detail', {
      limit: 100,
      sortBy: { column: 'name', order: 'asc' }
    });
  
  if (listError) {
    console.error('❌ Storage 조회 오류:', listError.message);
    process.exit(1);
  }
  
  console.log(`📁 Storage 파일: ${files.length}개`);
  
  // 2. 정상 파일명만 필터링 (이상한 파일명 제외)
  const normalFiles = files
    .filter(f => {
      // 이상한 파일명 제외
      if (f.name.startsWith('_-_')) return false;
      // webp 파일만
      if (!f.name.endsWith('.webp')) return false;
      return true;
    })
    .map(f => f.name)
    .sort();
  
  console.log(`✅ 정상 파일명: ${normalFiles.length}개`);
  normalFiles.forEach((name, index) => {
    console.log(`  ${index + 1}. ${name}`);
  });
  
  // 3. 데이터베이스 경로 형식으로 변환
  const imagePaths = normalFiles.map(name => 
    `originals/products/black-weapon/detail/${name}`
  );
  
  // 4. 데이터베이스 업데이트
  console.log(`\n📝 데이터베이스 업데이트 중...`);
  
  const { data: product } = await supabase
    .from('products')
    .select('id, name')
    .eq('slug', 'black-weapon')
    .single();
  
  if (!product) {
    console.error('❌ 제품을 찾을 수 없음: black-weapon');
    process.exit(1);
  }
  
  const { error: updateError } = await supabase
    .from('products')
    .update({
      detail_images: imagePaths,
      updated_at: new Date().toISOString()
    })
    .eq('id', product.id);
  
  if (updateError) {
    console.error('❌ 업데이트 실패:', updateError.message);
    process.exit(1);
  }
  
  console.log(`✅ 업데이트 완료: ${product.name}`);
  console.log(`   ${imagePaths.length}개 이미지 저장됨`);
  
  // 5. 결과 저장
  const fs = require('fs');
  const path = require('path');
  fs.writeFileSync(
    path.join(process.cwd(), 'scripts/black-weapon-cleanup-result.json'),
    JSON.stringify({
      product: product.name,
      imageCount: imagePaths.length,
      images: imagePaths,
      cleanedAt: new Date().toISOString()
    }, null, 2)
  );
  
  console.log('\n💾 결과가 scripts/black-weapon-cleanup-result.json에 저장되었습니다.');
}

cleanBlackWeaponImages()
  .then(() => {
    console.log('\n✅ 정리 완료!');
  })
  .catch((error) => {
    console.error('❌ 오류 발생:', error);
    process.exit(1);
  });

