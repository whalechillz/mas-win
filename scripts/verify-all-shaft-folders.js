/**
 * 모든 샤프트 폴더 및 파일 확인 스크립트
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Supabase 환경 변수가 설정되지 않았습니다.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function verifyAllFolders() {
  console.log('🔍 모든 샤프트 폴더 및 파일 확인\n');

  const folders = [
    {
      name: 'secret-force-common',
      path: 'originals/products/secret-force-common/composition',
      expectedFiles: ['secret-force-common-shaft-01.webp', 'secret-force-common-shaft-02.webp']
    },
    {
      name: 'muziik-common',
      path: 'originals/products/muziik-common/composition',
      expectedFiles: ['muziik-shaft-01.webp', 'muziik-shaft-02.webp', 'muziik-shaft-03.webp']
    }
  ];

  for (const folder of folders) {
    console.log(`📂 ${folder.name}/composition/`);
    
    const { data: files, error } = await supabase.storage
      .from('blog-images')
      .list(folder.path);

    if (error) {
      console.log(`   ❌ 폴더 조회 실패: ${error.message}\n`);
      continue;
    }

    if (!files || files.length === 0) {
      console.log(`   ⚠️ 폴더가 비어있습니다.\n`);
      continue;
    }

    // 샤프트 파일만 필터링
    const shaftFiles = files.filter(f => f.name.includes('shaft'));
    
    console.log(`   📄 전체 파일: ${files.length}개`);
    console.log(`   🎯 샤프트 파일: ${shaftFiles.length}개\n`);

    if (shaftFiles.length > 0) {
      console.log(`   ✅ 샤프트 파일 목록:`);
      shaftFiles.forEach(f => {
        const sizeKB = (f.metadata?.size || 0) / 1024;
        const isExpected = folder.expectedFiles.includes(f.name);
        const icon = isExpected ? '✅' : '⚠️';
        console.log(`      ${icon} ${f.name} (${sizeKB.toFixed(2)} KB)`);
      });
    } else {
      console.log(`   ⚠️ 샤프트 파일이 없습니다.`);
    }
    console.log('');
  }

  console.log('='.repeat(60));
  console.log('✅ 확인 완료!');
}

verifyAllFolders().catch(console.error);
