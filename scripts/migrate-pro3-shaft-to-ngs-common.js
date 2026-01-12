/**
 * secret-force-pro-3-shaft.webp를 ngs-common/composition/ngs-shaft-black.webp로 이동 및 리네임
 * secret-force-pro-3-shaft-grip.webp 삭제
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

const PRO3_COMPOSITION_FOLDER = 'originals/products/secret-force-pro-3/composition';
const NGS_COMMON_FOLDER = 'originals/products/ngs-common/composition';

/**
 * 파일 복사 및 리네임
 */
async function copyAndRenameFile(sourcePath, targetPath) {
  try {
    // 파일 다운로드
    const { data: fileData, error: downloadError } = await supabase.storage
      .from('blog-images')
      .download(sourcePath);

    if (downloadError) {
      throw downloadError;
    }

    // 파일 업로드 (새 경로)
    const { error: uploadError } = await supabase.storage
      .from('blog-images')
      .upload(targetPath, fileData, {
        contentType: 'image/webp',
        cacheControl: '3600',
        upsert: true,
      });

    if (uploadError) {
      throw uploadError;
    }

    return { success: true };
  } catch (error) {
    return { success: false, error };
  }
}

/**
 * 파일 삭제
 */
async function deleteFile(filePath) {
  try {
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

async function main() {
  console.log('🚀 PRO 3 샤프트 → NGS 공통 마이그레이션 시작\n');

  const results = [];
  let successCount = 0;
  let errorCount = 0;

  // 1. secret-force-pro-3-shaft.webp → ngs-shaft-black.webp로 이동 및 리네임
  console.log('📋 1단계: secret-force-pro-3-shaft.webp → ngs-shaft-black.webp 이동');
  const sourceShaftPath = `${PRO3_COMPOSITION_FOLDER}/secret-force-pro-3-shaft.webp`;
  const targetShaftPath = `${NGS_COMMON_FOLDER}/ngs-shaft-black.webp`;

  // ngs-common/composition 폴더가 없으면 생성 (파일 업로드 시 자동 생성됨)
  console.log(`   📤 복사 중: ${sourceShaftPath} → ${targetShaftPath}`);

  const copyResult = await copyAndRenameFile(sourceShaftPath, targetShaftPath);

  if (copyResult.success) {
    console.log(`   ✅ 복사 완료: ${targetShaftPath}`);
    successCount++;

    // 원본 파일 삭제
    console.log(`   🗑️ 원본 파일 삭제 중: ${sourceShaftPath}`);
    const deleteResult = await deleteFile(sourceShaftPath);

    if (deleteResult.success) {
      console.log(`   ✅ 원본 파일 삭제 완료`);
    } else {
      console.error(`   ⚠️ 원본 파일 삭제 실패: ${deleteResult.error}`);
    }
  } else {
    console.error(`   ❌ 복사 실패: ${copyResult.error}`);
    errorCount++;
  }

  results.push({
    type: 'shaft',
    source: sourceShaftPath,
    target: targetShaftPath,
    success: copyResult.success,
    error: copyResult.error,
  });

  // 2. secret-force-pro-3-shaft-grip.webp 삭제
  console.log('\n📋 2단계: secret-force-pro-3-shaft-grip.webp 삭제');
  const gripPath = `${PRO3_COMPOSITION_FOLDER}/secret-force-pro-3-shaft-grip.webp`;

  // 파일 존재 여부 확인
  const { data: gripFile, error: checkError } = await supabase.storage
    .from('blog-images')
    .list(PRO3_COMPOSITION_FOLDER, { search: 'secret-force-pro-3-shaft-grip.webp' });

  if (checkError) {
    console.error(`   ❌ 파일 확인 오류: ${checkError}`);
    errorCount++;
  } else if (gripFile && gripFile.length > 0) {
    console.log(`   🗑️ 삭제 중: ${gripPath}`);
    const deleteGripResult = await deleteFile(gripPath);

    if (deleteGripResult.success) {
      console.log(`   ✅ 삭제 완료: ${gripPath}`);
      successCount++;
    } else {
      console.error(`   ❌ 삭제 실패: ${deleteGripResult.error}`);
      errorCount++;
    }

    results.push({
      type: 'grip',
      action: 'delete',
      path: gripPath,
      success: deleteGripResult.success,
      error: deleteGripResult.error,
    });
  } else {
    console.log(`   ℹ️ 파일이 이미 존재하지 않습니다: ${gripPath}`);
    results.push({
      type: 'grip',
      action: 'delete',
      path: gripPath,
      success: true,
      note: '파일이 이미 존재하지 않음',
    });
  }

  // 결과 저장
  const resultPath = path.join(__dirname, 'migrate-pro3-shaft-to-ngs-common-result.json');
  fs.writeFileSync(resultPath, JSON.stringify(results, null, 2));
  console.log(`\n✅ 결과 파일 저장: ${resultPath}`);
  console.log(`\n📊 최종 요약:`);
  console.log(`   - 성공: ${successCount}개`);
  console.log(`   - 실패: ${errorCount}개`);
}

main().catch(console.error);
