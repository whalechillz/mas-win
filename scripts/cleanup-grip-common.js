/**
 * grip-common/composition/ 폴더 정리
 * 불필요한 파일 삭제 및 secret-force-common-grip.webp → stm-grip-35g.webp 리네임
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Supabase 환경 변수가 설정되지 않았습니다.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const GRIP_COMMON_FOLDER = 'originals/products/grip-common/composition';

// 삭제할 파일 목록
const FILES_TO_DELETE = [
  'secret-force-common-back-01.webp',
  'secret-force-common-back-02.webp',
  'secret-force-common-back-03.webp',
  'secret-force-common-crown-01.webp',
  'secret-force-common-front-face-01.webp',
  'secret-force-common-sole-01.webp',
  'secret-force-common-sole-02.webp',
  'secret-force-common-sole-03.webp',
  'secret-force-common-toe-01.webp',
  'secret-force-common-shaft-01.webp',
  'secret-force-common-shaft-02.webp',
];

/**
 * 파일 삭제
 */
async function deleteFile(fileName) {
  try {
    const filePath = `${GRIP_COMMON_FOLDER}/${fileName}`;
    const { error } = await supabase.storage
      .from('blog-images')
      .remove([filePath]);

    if (error) {
      throw error;
    }

    return { success: true };
  } catch (error) {
    return { success: false, error };
  }
}

/**
 * 파일 리네임 (복사 후 삭제)
 */
async function renameFile(oldName, newName) {
  try {
    const oldPath = `${GRIP_COMMON_FOLDER}/${oldName}`;
    const newPath = `${GRIP_COMMON_FOLDER}/${newName}`;

    // 파일 다운로드
    const { data: fileData, error: downloadError } = await supabase.storage
      .from('blog-images')
      .download(oldPath);

    if (downloadError) {
      throw downloadError;
    }

    // 새 이름으로 업로드
    const { error: uploadError } = await supabase.storage
      .from('blog-images')
      .upload(newPath, fileData, {
        contentType: 'image/webp',
        cacheControl: '3600',
        upsert: true,
      });

    if (uploadError) {
      throw uploadError;
    }

    // 원본 파일 삭제
    const { error: deleteError } = await supabase.storage
      .from('blog-images')
      .remove([oldPath]);

    if (deleteError) {
      console.warn(`⚠️ 원본 파일 삭제 실패 (계속 진행): ${deleteError.message}`);
    }

    return { success: true };
  } catch (error) {
    return { success: false, error };
  }
}

async function main() {
  console.log('🚀 grip-common/composition/ 폴더 정리 시작\n');

  const results = [];
  let successCount = 0;
  let errorCount = 0;

  // 1. 불필요한 파일 삭제
  console.log('📋 1단계: 불필요한 파일 삭제');
  for (const fileName of FILES_TO_DELETE) {
    console.log(`   🗑️ 삭제 중: ${fileName}`);
    const result = await deleteFile(fileName);

    if (result.success) {
      console.log(`   ✅ 삭제 완료: ${fileName}`);
      successCount++;
    } else {
      // 파일이 없을 수도 있으므로 경고만 표시
      if (result.error?.message?.includes('not found') || result.error?.statusCode === 404) {
        console.log(`   ℹ️ 파일이 이미 없습니다: ${fileName}`);
        successCount++; // 이미 없으면 성공으로 간주
      } else {
        console.error(`   ❌ 삭제 실패: ${fileName}`, result.error);
        errorCount++;
      }
    }

    results.push({
      action: 'delete',
      fileName: fileName,
      success: result.success,
      error: result.error,
    });
  }

  // 2. 그립 파일 리네임
  console.log('\n📋 2단계: 그립 파일 리네임');
  console.log(`   📝 리네임 중: secret-force-common-grip.webp → stm-grip-35g.webp`);

  const renameResult = await renameFile('secret-force-common-grip.webp', 'stm-grip-35g.webp');

  if (renameResult.success) {
    console.log(`   ✅ 리네임 완료: stm-grip-35g.webp`);
    successCount++;
  } else {
    // 파일이 없으면 다운로드 폴더에서 업로드 시도
    if (renameResult.error?.message?.includes('not found') || renameResult.error?.statusCode === 404) {
      console.log(`   ℹ️ 기존 파일이 없습니다. 다운로드 폴더에서 업로드를 시도합니다.`);
      // 이 경우 별도 스크립트에서 처리하도록 안내
    } else {
      console.error(`   ❌ 리네임 실패:`, renameResult.error);
      errorCount++;
    }
  }

  results.push({
    action: 'rename',
    oldName: 'secret-force-common-grip.webp',
    newName: 'stm-grip-35g.webp',
    success: renameResult.success,
    error: renameResult.error,
  });

  // 결과 저장
  const resultPath = path.join(__dirname, 'cleanup-grip-common-result.json');
  fs.writeFileSync(resultPath, JSON.stringify(results, null, 2));
  console.log(`\n✅ 결과 파일 저장: ${resultPath}`);
  console.log(`\n📊 최종 요약:`);
  console.log(`   - 성공: ${successCount}개`);
  console.log(`   - 실패: ${errorCount}개`);
}

main().catch(console.error);
