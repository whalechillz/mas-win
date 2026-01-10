/**
 * image_metadata 테이블에서 구식 폴더명 확인
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

const OLD_FOLDERS = [
  'black-beryl',
  'black-weapon',
  'gold-weapon4',
  'gold2',
  'gold2-sapphire',
  'pro3-muziik',
  'pro3',
  'v3',
];

async function checkOldFolders() {
  console.log('🔍 image_metadata 테이블에서 구식 폴더명 확인\n');

  const results = {};

  for (const oldFolder of OLD_FOLDERS) {
    const oldPath = `originals/products/${oldFolder}`;
    
    // folder_path에 구식 폴더명이 포함된 이미지 조회
    const { data, error, count } = await supabase
      .from('image_metadata')
      .select('id, folder_path, image_url', { count: 'exact' })
      .or(`folder_path.ilike.%${oldPath}%,image_url.ilike.%${oldPath}%`);

    if (error) {
      console.error(`❌ 조회 오류 (${oldFolder}):`, error.message);
      continue;
    }

    const countValue = count || data?.length || 0;
    results[oldFolder] = {
      count: countValue,
      samples: data?.slice(0, 5) || [],
    };

    if (countValue > 0) {
      console.log(`⚠️ ${oldFolder}: ${countValue}개 이미지 발견`);
      if (data && data.length > 0) {
        console.log(`   샘플:`);
        data.slice(0, 3).forEach(img => {
          console.log(`   - ${img.folder_path || img.image_url}`);
        });
      }
    } else {
      console.log(`✅ ${oldFolder}: 없음`);
    }
  }

  // 요약
  console.log('\n' + '='.repeat(60));
  console.log('📊 요약');
  console.log('='.repeat(60));
  
  const totalOld = Object.values(results).reduce((sum, r) => sum + r.count, 0);
  const foldersWithOld = Object.entries(results)
    .filter(([_, r]) => r.count > 0)
    .map(([name, r]) => ({ name, count: r.count }));

  console.log(`총 구식 폴더명 참조: ${totalOld}개`);
  console.log(`구식 폴더명이 있는 폴더: ${foldersWithOld.length}개`);
  
  if (foldersWithOld.length > 0) {
    console.log('\n⚠️ 업데이트가 필요한 폴더:');
    foldersWithOld.forEach(({ name, count }) => {
      console.log(`   - ${name}: ${count}개`);
    });
    console.log('\n💡 해결 방법:');
    console.log('   image_metadata 테이블의 folder_path와 image_url을 업데이트해야 합니다.');
  } else {
    console.log('\n✅ 모든 폴더명이 업데이트되었습니다!');
  }

  return results;
}

checkOldFolders().catch(console.error);
