/**
 * secret-force-common 폴더 내 파일 확인 스크립트
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

async function checkFiles() {
  console.log('🔍 secret-force-common 폴더 파일 확인\n');

  const folderPath = 'originals/products/secret-force-common/composition';
  const { data: files, error } = await supabase.storage
    .from('blog-images')
    .list(folderPath);

  if (error) {
    console.error('❌ 파일 목록 조회 실패:', error);
    process.exit(1);
  }

  console.log(`📁 폴더: ${folderPath}`);
  console.log(`📄 파일 개수: ${files?.length || 0}개\n`);

  if (files && files.length > 0) {
    console.log('📋 파일 목록:');
    files.forEach((file, index) => {
      const sizeKB = (file.metadata?.size || 0) / 1024;
      console.log(`  ${index + 1}. ${file.name} (${sizeKB.toFixed(2)} KB)`);
    });

    // 샤프트 관련 파일 찾기
    const shaftFiles = files.filter(f => f.name.includes('shaft'));
    if (shaftFiles.length > 0) {
      console.log('\n🎯 샤프트 관련 파일:');
      shaftFiles.forEach(f => {
        console.log(`  - ${f.name}`);
      });
    }
  } else {
    console.log('⚠️ 폴더가 비어있습니다.');
  }
}

checkFiles().catch(console.error);
