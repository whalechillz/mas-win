/**
 * secret-force-common 폴더를 grip-common으로 이름 변경 및 파일 이동
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

const OLD_FOLDER = 'originals/products/secret-force-common/composition';
const NEW_FOLDER = 'originals/products/grip-common/composition';

/**
 * 폴더 내 모든 파일 목록 가져오기 (재귀)
 */
async function listAllFiles(folderPath) {
  const files = [];
  
  async function listRecursive(currentPath) {
    const { data, error } = await supabase.storage
      .from('blog-images')
      .list(currentPath, { 
        limit: 1000,
        sortBy: { column: 'name', order: 'asc' },
      });

    if (error) {
      // 폴더가 없으면 스킵
      if (error.message?.includes('not found') || error.statusCode === 404) {
        return;
      }
      console.error(`❌ 폴더 조회 오류 (${currentPath}):`, error);
      return;
    }

    if (!data || data.length === 0) {
      return;
    }

    for (const item of data) {
      const itemPath = currentPath ? `${currentPath}/${item.name}` : item.name;
      
      // 파일인 경우 (metadata.size가 있으면 파일)
      if (item.metadata && item.metadata.size !== undefined) {
        files.push({
          path: itemPath,
          name: item.name,
          size: item.metadata.size,
        });
      } else if (item.id) {
        // 폴더인 경우 (id가 있으면 폴더) - 재귀적으로 탐색
        await listRecursive(itemPath);
      }
    }
  }

  await listRecursive(folderPath);
  return files;
}

/**
 * 파일 복사
 */
async function copyFile(sourcePath, targetPath) {
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
  console.log('🚀 secret-force-common → grip-common 마이그레이션 시작\n');

  // 1. 기존 폴더의 모든 파일 목록 가져오기
  console.log('📋 1단계: 기존 폴더 파일 목록 조회');
  const oldFiles = await listAllFiles(OLD_FOLDER);
  console.log(`   ✅ ${oldFiles.length}개 파일 발견\n`);

  if (oldFiles.length === 0) {
    console.log('⚠️ 이동할 파일이 없습니다.');
    return;
  }

  // 2. 새 폴더로 파일 복사
  console.log('📋 2단계: 새 폴더로 파일 복사');
  const results = [];
  let successCount = 0;
  let errorCount = 0;

  for (const file of oldFiles) {
    const relativePath = file.path.replace(OLD_FOLDER + '/', '');
    const newPath = `${NEW_FOLDER}/${relativePath}`;

    console.log(`   📤 복사 중: ${file.name}`);
    const result = await copyFile(file.path, newPath);

    if (result.success) {
      console.log(`   ✅ 복사 완료: ${newPath}`);
      successCount++;
    } else {
      console.error(`   ❌ 복사 실패: ${file.path}`, result.error);
      errorCount++;
    }

    results.push({
      oldPath: file.path,
      newPath: newPath,
      success: result.success,
      error: result.error,
    });
  }

  console.log(`\n   📊 복사 결과: 성공 ${successCount}개, 실패 ${errorCount}개\n`);

  // 3. 기존 폴더 삭제 (선택사항 - 주석 처리)
  // console.log('📋 3단계: 기존 폴더 삭제');
  // console.log('   ⚠️ 기존 폴더는 수동으로 삭제하거나 백업 후 삭제하세요.');
  // console.log('   💡 Supabase Storage에서 직접 삭제하거나 다음 명령으로 삭제:');
  // console.log(`   ${OLD_FOLDER} 폴더 전체 삭제\n`);

  // 결과 저장
  const resultPath = path.join(__dirname, 'migrate-secret-force-common-to-grip-common-result.json');
  fs.writeFileSync(resultPath, JSON.stringify(results, null, 2));
  console.log(`✅ 결과 파일 저장: ${resultPath}`);
  console.log(`\n📊 최종 요약:`);
  console.log(`   - 성공: ${successCount}개`);
  console.log(`   - 실패: ${errorCount}개`);
  console.log(`\n⚠️ 기존 폴더(${OLD_FOLDER})는 수동으로 삭제하세요.`);
}

main().catch(console.error);
