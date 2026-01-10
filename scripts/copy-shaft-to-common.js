/**
 * V3/PRO 3 폴더에서 secret-force-common으로 샤프트 파일 복사
 * secret-force-common-shaft-01.webp, secret-force-common-shaft-02.webp 형식으로 생성
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

/**
 * Supabase Storage에서 파일 복사
 */
async function copyFileInStorage(sourcePath, targetPath) {
  try {
    console.log(`📋 복사 중: ${sourcePath.split('/').pop()} → ${targetPath.split('/').pop()}`);

    const { data: fileData, error: downloadError } = await supabase.storage
      .from('blog-images')
      .download(sourcePath);

    if (downloadError) {
      console.error(`❌ 파일 다운로드 실패:`, downloadError);
      return { success: false, error: downloadError };
    }

    const { error: uploadError } = await supabase.storage
      .from('blog-images')
      .upload(targetPath, fileData, {
        contentType: 'image/webp',
        cacheControl: '3600',
        upsert: true,
      });

    if (uploadError) {
      console.error(`❌ 파일 업로드 실패:`, uploadError);
      return { success: false, error: uploadError };
    }

    console.log(`✅ 복사 완료: ${targetPath.split('/').pop()}`);
    return { success: true, path: targetPath };
  } catch (error) {
    console.error(`❌ 파일 복사 오류:`, error);
    return { success: false, error };
  }
}

async function main() {
  console.log('🚀 공통 샤프트 파일 복사 시작\n');

  const targetFolder = 'originals/products/secret-force-common/composition';
  const results = [];
  let successCount = 0;
  let errorCount = 0;

  // V3 또는 PRO 3 폴더에서 샤프트 파일 찾기
  const sourceFolders = [
    'originals/products/secret-force-v3/composition',
    'originals/products/secret-force-pro-3/composition',
  ];

  // 파일 매핑: 원본 파일명 → 새 파일명
  const fileMappings = [
    {
      sourcePattern: 'shaft-grip.webp', // 그립 포함
      target: 'secret-force-common-shaft-01.webp',
      description: '그립 포함 샤프트'
    },
    {
      sourcePattern: 'shaft.webp', // 그립 없음 (shaft-grip가 아닌 것)
      target: 'secret-force-common-shaft-02.webp',
      description: '그립 없음 샤프트'
    }
  ];

  // 각 소스 폴더에서 파일 찾기
  for (const sourceFolder of sourceFolders) {
    console.log(`📂 ${sourceFolder} 확인 중...\n`);
    
    const { data: files, error } = await supabase.storage
      .from('blog-images')
      .list(sourceFolder);

    if (error) {
      console.error(`❌ 폴더 목록 조회 실패:`, error);
      continue;
    }

    if (!files || files.length === 0) {
      console.log(`   ⚠️ 파일이 없습니다.\n`);
      continue;
    }

    // 샤프트 파일 찾기
    const shaftGripFile = files.find(f => f.name.includes('shaft-grip'));
    const shaftFile = files.find(f => f.name.includes('shaft') && !f.name.includes('shaft-grip'));

    // 그립 포함 샤프트 복사
    if (shaftGripFile) {
      const sourcePath = `${sourceFolder}/${shaftGripFile.name}`;
      const targetPath = `${targetFolder}/secret-force-common-shaft-01.webp`;
      
      console.log(`📝 ${fileMappings[0].description}: ${shaftGripFile.name} → ${fileMappings[0].target}`);
      const result = await copyFileInStorage(sourcePath, targetPath);
      
      if (result.success) {
        successCount++;
        results.push({ type: 'shaft-grip', ...result });
      } else {
        errorCount++;
      }
      console.log('');
    }

    // 그립 없음 샤프트 복사
    if (shaftFile) {
      const sourcePath = `${sourceFolder}/${shaftFile.name}`;
      const targetPath = `${targetFolder}/secret-force-common-shaft-02.webp`;
      
      console.log(`📝 ${fileMappings[1].description}: ${shaftFile.name} → ${fileMappings[1].target}`);
      const result = await copyFileInStorage(sourcePath, targetPath);
      
      if (result.success) {
        successCount++;
        results.push({ type: 'shaft', ...result });
      } else {
        errorCount++;
      }
      console.log('');
    }

    // 두 파일을 모두 찾았으면 중단
    if (shaftGripFile && shaftFile) {
      break;
    }
  }

  // 최종 확인
  console.log('📋 최종 파일 확인\n');
  const { data: finalFiles } = await supabase.storage
    .from('blog-images')
    .list(targetFolder);

  const newFiles = ['secret-force-common-shaft-01.webp', 'secret-force-common-shaft-02.webp'];
  const foundFiles = finalFiles?.filter(f => newFiles.includes(f.name)) || [];

  console.log(`✅ 생성된 파일: ${foundFiles.length}개`);
  foundFiles.forEach(f => {
    console.log(`   ✅ ${f.name}`);
  });

  console.log('\n' + '='.repeat(60));
  console.log('✅ 복사 완료!');
  console.log('='.repeat(60));
  console.log(`📊 요약: 성공 ${successCount}개, 실패 ${errorCount}개`);
  console.log(`📁 대상 폴더: ${targetFolder}`);
}

main().catch(console.error);
