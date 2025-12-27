/**
 * Supabase Storage에 실제로 업로드된 파일명 확인
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

async function checkStorageFiles() {
  console.log('🔍 Supabase Storage 파일명 확인 중...\n');
  
  const products = [
    { slug: 'gold2-sapphire', name: '시크리트포스 골드 2 MUZIIK' },
    { slug: 'black-beryl', name: '시크리트웨폰 블랙 MUZIIK' },
    { slug: 'pro3-muziik', name: '시크리트포스 PRO 3 MUZIIK' },
    { slug: 'gold2', name: '시크리트포스 골드 2' },
    { slug: 'pro3', name: '시크리트포스 PRO 3' },
    { slug: 'v3', name: '시크리트포스 V3' },
    { slug: 'black-weapon', name: '시크리트웨폰 블랙' },
    { slug: 'gold-weapon4', name: '시크리트웨폰 골드 4.1' },
  ];
  
  const results = {};
  
  for (const product of products) {
    console.log(`\n📦 ${product.name} (${product.slug}):`);
    
    const { data, error } = await supabase.storage
      .from('blog-images')
      .list(`originals/products/${product.slug}/detail`, {
        limit: 100,
        sortBy: { column: 'name', order: 'asc' }
      });
    
    if (error) {
      console.error(`  ❌ 오류: ${error.message}`);
      results[product.slug] = { error: error.message };
      continue;
    }
    
    if (!data || data.length === 0) {
      console.log(`  ⚠️  파일 없음`);
      results[product.slug] = { files: [] };
      continue;
    }
    
    console.log(`  ✅ ${data.length}개 파일 발견:`);
    const fileNames = data.map(f => f.name);
    fileNames.forEach((fileName, index) => {
      if (index < 10) {
        console.log(`    ${index + 1}. ${fileName}`);
      }
    });
    if (fileNames.length > 10) {
      console.log(`    ... 외 ${fileNames.length - 10}개`);
    }
    
    results[product.slug] = {
      count: data.length,
      files: fileNames,
      firstFile: fileNames[0] || null
    };
  }
  
  // 결과를 JSON 파일로 저장
  const fs = require('fs');
  const path = require('path');
  fs.writeFileSync(
    path.join(process.cwd(), 'scripts/storage-files-check-result.json'),
    JSON.stringify(results, null, 2)
  );
  
  console.log('\n💾 결과가 scripts/storage-files-check-result.json에 저장되었습니다.');
  
  // 문제가 있는 제품 확인
  console.log('\n📊 요약:');
  Object.entries(results).forEach(([slug, result]) => {
    if (result.error) {
      console.log(`  ❌ ${slug}: 오류 발생`);
    } else if (result.count === 0) {
      console.log(`  ⚠️  ${slug}: 파일 없음`);
    } else {
      console.log(`  ✅ ${slug}: ${result.count}개 파일`);
      if (result.firstFile && result.firstFile.includes('_-_')) {
        console.log(`     ⚠️  첫 파일명에 이상한 문자 포함: ${result.firstFile}`);
      }
    }
  });
  
  return results;
}

checkStorageFiles()
  .then(() => {
    console.log('\n✅ 확인 완료!');
  })
  .catch((error) => {
    console.error('❌ 오류 발생:', error);
    process.exit(1);
  });

