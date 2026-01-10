/**
 * 모든 제품 폴더 마이그레이션 상태 확인
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

const FOLDER_MAPPINGS = {
  'black-beryl': 'secret-weapon-black-muziik',
  'black-weapon': 'secret-weapon-black',
  'gold-weapon4': 'secret-weapon-gold-4-1',
  'gold2': 'secret-force-gold-2',
  'gold2-sapphire': 'secret-force-gold-2-muziik',
  'pro3-muziik': 'secret-force-pro-3-muziik',
  'pro3': 'secret-force-pro-3',
  'v3': 'secret-force-v3',
};

async function checkAllFolders() {
  console.log('🔍 모든 제품 폴더 마이그레이션 상태 확인\n');

  const results = [];

  for (const [oldFolder, newFolder] of Object.entries(FOLDER_MAPPINGS)) {
    const oldPath = `originals/products/${oldFolder}`;
    const newPath = `originals/products/${newFolder}`;

    // 기존 폴더 확인
    const { data: oldData, error: oldError } = await supabase.storage
      .from('blog-images')
      .list(oldPath, { limit: 1 });

    // 새 폴더 확인
    const { data: newData, error: newError } = await supabase.storage
      .from('blog-images')
      .list(newPath, { limit: 1 });

    const oldExists = !oldError && oldData && oldData.length > 0;
    const newExists = !newError && newData && newData.length > 0;

    let status = '';
    if (newExists && !oldExists) {
      status = '✅ 완료';
    } else if (newExists && oldExists) {
      status = '⚠️ 둘 다 존재';
    } else if (!newExists && oldExists) {
      status = '❌ 아직 변경 안됨';
    } else {
      status = '❓ 둘 다 없음';
    }

    console.log(`${status}: ${oldFolder} → ${newFolder}`);
    if (oldExists) {
      const { data: oldFiles } = await supabase.storage
        .from('blog-images')
        .list(oldPath, { limit: 10 });
      console.log(`   기존 폴더: ${oldFiles?.length || 0}개 항목`);
    }
    if (newExists) {
      const { data: newFiles } = await supabase.storage
        .from('blog-images')
        .list(newPath, { limit: 10 });
      console.log(`   새 폴더: ${newFiles?.length || 0}개 항목`);
    }

    results.push({
      oldFolder,
      newFolder,
      oldExists,
      newExists,
      status,
    });
  }

  console.log('\n📊 요약:');
  const completed = results.filter(r => r.status === '✅ 완료').length;
  const needsMigration = results.filter(r => r.status === '❌ 아직 변경 안됨').length;
  const bothExist = results.filter(r => r.status === '⚠️ 둘 다 존재').length;

  console.log(`   ✅ 완료: ${completed}개`);
  console.log(`   ❌ 변경 필요: ${needsMigration}개`);
  console.log(`   ⚠️ 둘 다 존재: ${bothExist}개`);

  if (needsMigration > 0 || bothExist > 0) {
    console.log('\n⚠️ 마이그레이션이 필요한 제품:');
    results
      .filter(r => r.status !== '✅ 완료')
      .forEach(r => {
        console.log(`   - ${r.oldFolder} → ${r.newFolder}`);
      });
  }

  return results;
}

checkAllFolders().catch(console.error);
