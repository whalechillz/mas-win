/**
 * secret-force-common 폴더 및 파일 상태 확인
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

const TARGET_FOLDER = 'originals/products/secret-force-common/composition';

const EXPECTED_FILES = [
  'secret-force-common-sole-01.webp',
  'secret-force-common-sole-02.webp',
  'secret-force-common-sole-03.webp',
  'secret-force-common-front-face-01.webp',
  'secret-force-common-crown-01.webp',
  'secret-force-common-toe-01.webp',
  'secret-force-common-back-01.webp',
  'secret-force-common-back-02.webp',
  'secret-force-common-back-03.webp',
];

async function checkSecretForceCommon() {
  console.log('🔍 secret-force-common 폴더 및 파일 상태 확인\n');
  console.log(`📁 대상 폴더: ${TARGET_FOLDER}\n`);

  // 1. 폴더 존재 확인
  const { data: folderData, error: folderError } = await supabase.storage
    .from('blog-images')
    .list('originals/products/secret-force-common', { limit: 10 });

  if (folderError) {
    console.error('❌ 폴더 확인 오류:', folderError.message);
    console.log('\n📋 결론: secret-force-common 폴더가 존재하지 않습니다.');
    return;
  }

  if (!folderData || folderData.length === 0) {
    console.log('⚠️ secret-force-common 폴더는 존재하지만 비어있습니다.');
  } else {
    console.log('✅ secret-force-common 폴더 존재 확인');
    console.log(`   하위 항목: ${folderData.length}개`);
    folderData.forEach(item => {
      console.log(`   - ${item.name}${item.id ? ' (폴더)' : ' (파일)'}`);
    });
  }

  // 2. composition 폴더의 파일 확인
  console.log(`\n📂 ${TARGET_FOLDER} 폴더 확인...`);
  const { data: files, error: filesError } = await supabase.storage
    .from('blog-images')
    .list(TARGET_FOLDER, { limit: 100 });

  if (filesError) {
    console.error(`❌ 파일 목록 조회 오류:`, filesError.message);
    console.log('\n📋 결론: composition 폴더가 존재하지 않거나 접근할 수 없습니다.');
    return;
  }

  if (!files || files.length === 0) {
    console.log('❌ composition 폴더에 파일이 없습니다.');
    console.log('\n📋 결론: 파일 업로드가 진행되지 않았습니다.');
    console.log('\n💡 해결 방법:');
    console.log('   node scripts/upload-secret-force-common.js');
    return;
  }

  console.log(`✅ 파일 ${files.length}개 발견\n`);

  // 3. 예상 파일과 비교
  const existingFiles = files
    .filter(f => f.metadata && f.metadata.size !== undefined)
    .map(f => f.name);

  console.log('📊 파일 상태:');
  const missingFiles = [];
  const foundFiles = [];

  EXPECTED_FILES.forEach(expectedFile => {
    if (existingFiles.includes(expectedFile)) {
      const file = files.find(f => f.name === expectedFile);
      const sizeKB = file.metadata?.size ? (file.metadata.size / 1024).toFixed(2) : '?';
      console.log(`   ✅ ${expectedFile} (${sizeKB} KB)`);
      foundFiles.push(expectedFile);
    } else {
      console.log(`   ❌ ${expectedFile} (없음)`);
      missingFiles.push(expectedFile);
    }
  });

  // 4. 예상하지 않은 파일 확인
  const unexpectedFiles = existingFiles.filter(f => !EXPECTED_FILES.includes(f));
  if (unexpectedFiles.length > 0) {
    console.log('\n⚠️ 예상하지 않은 파일:');
    unexpectedFiles.forEach(f => {
      console.log(`   - ${f}`);
    });
  }

  // 5. 결과 요약
  console.log('\n' + '='.repeat(60));
  console.log('📊 최종 결과');
  console.log('='.repeat(60));
  console.log(`   ✅ 발견된 파일: ${foundFiles.length}/${EXPECTED_FILES.length}개`);
  console.log(`   ❌ 누락된 파일: ${missingFiles.length}개`);

  if (missingFiles.length > 0) {
    console.log('\n❌ 누락된 파일 목록:');
    missingFiles.forEach(f => console.log(`   - ${f}`));
    console.log('\n💡 해결 방법:');
    console.log('   1. 다운로드 폴더에 다음 파일들이 있는지 확인:');
    console.log('      - 마쓰구_드라이버_2000X2000 (0).webp ~ (8).webp');
    console.log('   2. 다음 명령어 실행:');
    console.log('      node scripts/upload-secret-force-common.js');
  } else {
    console.log('\n✅ 모든 파일이 정상적으로 업로드되었습니다!');
  }
}

checkSecretForceCommon().catch(console.error);
