/**
 * golf-hat-muziik 폴더 확인 및 정리 스크립트
 * 1. originals/goods/golf-hat-muziik 폴더에 남아있는 파일 확인
 * 2. 남아있는 파일을 색상별 폴더로 이동
 * 3. 폴더가 비어있으면 삭제
 */

require('dotenv').config({ path: '.env.local' });

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Supabase 환경 변수가 설정되지 않았습니다.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);
const STORAGE_BUCKET = 'blog-images';

const results = {
  gallery: { found: [], moved: [], errors: [] },
  composition: { found: [], moved: [], errors: [] },
  other: { found: [], moved: [], errors: [] }
};

/**
 * 파일 이동 (복사 후 원본 삭제)
 */
async function moveFile(fromPath, toPath) {
  try {
    // 1. 파일 다운로드
    const { data: fileData, error: downloadError } = await supabase.storage
      .from(STORAGE_BUCKET)
      .download(fromPath);

    if (downloadError) {
      throw new Error(`다운로드 실패: ${downloadError.message}`);
    }

    // 2. 새 위치에 업로드
    const { error: uploadError } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(toPath, fileData, {
        contentType: 'image/webp',
        upsert: true
      });

    if (uploadError) {
      throw new Error(`업로드 실패: ${uploadError.message}`);
    }

    // 3. 원본 삭제
    const { error: deleteError } = await supabase.storage
      .from(STORAGE_BUCKET)
      .remove([fromPath]);

    if (deleteError) {
      console.warn(`⚠️ 원본 삭제 실패 (이미 이동됨): ${fromPath} - ${deleteError.message}`);
    }

    return { success: true, fromPath, toPath };
  } catch (error) {
    return { success: false, fromPath, toPath, error: error.message };
  }
}

/**
 * 색상 추출 (파일명 기반)
 */
function extractColor(fileName) {
  const lowerName = fileName.toLowerCase();
  if (lowerName.includes('black')) return 'black';
  if (lowerName.includes('white')) return 'white';
  if (lowerName.includes('navy')) return 'navy';
  if (lowerName.includes('beige')) return 'beige';
  
  // 파일명 패턴 기반 (golf-hat-muziik-1.webp → beige, golf-hat-muziik-2.webp → white 등)
  const match = fileName.match(/golf-hat-muziik-(\d+)\./);
  if (match) {
    const num = parseInt(match[1]);
    if (num === 1 || num === 6) return 'beige';
    if (num === 2 || num === 3 || num === 4 || num === 5 || num === 7) return 'white';
  }
  
  return null;
}

/**
 * 폴더의 모든 파일 조회 (재귀적)
 */
async function listFilesRecursive(folderPath) {
  const allFiles = [];
  let offset = 0;
  const batchSize = 1000;

  while (true) {
    const { data: files, error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .list(folderPath, {
        limit: batchSize,
        offset: offset,
        sortBy: { column: 'name', order: 'asc' }
      });

    if (error) {
      console.error(`❌ 폴더 조회 에러 (${folderPath}, offset: ${offset}):`, error);
      break;
    }

    if (!files || files.length === 0) {
      break;
    }

    for (const file of files) {
      if (file.id !== null) {
        // 파일인 경우
        allFiles.push({
          name: file.name,
          path: folderPath ? `${folderPath}/${file.name}` : file.name,
          size: file.metadata?.size || 0,
          created_at: file.created_at
        });
      } else {
        // 폴더인 경우 재귀적으로 조회
        const subFolderPath = folderPath ? `${folderPath}/${file.name}` : file.name;
        const subFiles = await listFilesRecursive(subFolderPath);
        allFiles.push(...subFiles);
      }
    }

    offset += batchSize;
    if (files.length < batchSize) {
      break;
    }
  }

  return allFiles;
}

/**
 * golf-hat-muziik 폴더 확인 및 정리
 */
async function checkAndCleanupGolfHatFolder() {
  console.log('🚀 golf-hat-muziik 폴더 확인 및 정리 시작...\n');
  console.log('='.repeat(60));

  const baseFolder = 'originals/goods/golf-hat-muziik';
  
  // 1. gallery 폴더 확인
  console.log('\n1️⃣ gallery 폴더 확인 중...\n');
  const galleryPath = `${baseFolder}/gallery`;
  const galleryFiles = await listFilesRecursive(galleryPath);
  
  console.log(`   📋 발견된 파일: ${galleryFiles.length}개`);
  
  if (galleryFiles.length > 0) {
    for (const file of galleryFiles) {
      results.gallery.found.push(file);
      const color = extractColor(file.name);
      
      if (!color) {
        console.log(`   ⚠️ 색상을 확인할 수 없음: ${file.name}`);
        results.gallery.errors.push({
          fileName: file.name,
          reason: 'color_not_detected'
        });
        continue;
      }
      
      const targetPath = `originals/goods/golf-hat-muziik-${color}/gallery/${file.name}`;
      console.log(`   📦 이동 중: ${file.name} → ${color}`);
      
      const result = await moveFile(file.path, targetPath);
      
      if (result.success) {
        results.gallery.moved.push({
          fileName: file.name,
          from: file.path,
          to: targetPath,
          color
        });
        console.log(`   ✅ 이동 완료: ${file.name}`);
      } else {
        results.gallery.errors.push({
          fileName: file.name,
          error: result.error
        });
        console.error(`   ❌ 이동 실패: ${file.name} - ${result.error}`);
      }
    }
  } else {
    console.log('   ℹ️ gallery 폴더가 비어있습니다.');
  }

  // 2. composition 폴더 확인
  console.log('\n2️⃣ composition 폴더 확인 중...\n');
  const compositionPath = `${baseFolder}/composition`;
  const compositionFiles = await listFilesRecursive(compositionPath);
  
  console.log(`   📋 발견된 파일: ${compositionFiles.length}개`);
  
  if (compositionFiles.length > 0) {
    for (const file of compositionFiles) {
      results.composition.found.push(file);
      const color = extractColor(file.name);
      
      if (!color) {
        console.log(`   ⚠️ 색상을 확인할 수 없음: ${file.name}`);
        results.composition.errors.push({
          fileName: file.name,
          reason: 'color_not_detected'
        });
        continue;
      }
      
      const targetPath = `originals/goods/golf-hat-muziik-${color}/composition/${file.name}`;
      console.log(`   📦 이동 중: ${file.name} → ${color}`);
      
      const result = await moveFile(file.path, targetPath);
      
      if (result.success) {
        results.composition.moved.push({
          fileName: file.name,
          from: file.path,
          to: targetPath,
          color
        });
        console.log(`   ✅ 이동 완료: ${file.name}`);
      } else {
        results.composition.errors.push({
          fileName: file.name,
          error: result.error
        });
        console.error(`   ❌ 이동 실패: ${file.name} - ${result.error}`);
      }
    }
  } else {
    console.log('   ℹ️ composition 폴더가 비어있습니다.');
  }

  // 3. 기타 폴더/파일 확인
  console.log('\n3️⃣ 기타 폴더/파일 확인 중...\n');
  const otherFiles = await listFilesRecursive(baseFolder);
  
  // gallery와 composition을 제외한 파일만 필터링
  const filteredOtherFiles = otherFiles.filter(file => 
    !file.path.includes('/gallery/') && 
    !file.path.includes('/composition/') &&
    file.path !== baseFolder
  );
  
  console.log(`   📋 발견된 파일: ${filteredOtherFiles.length}개`);
  
  if (filteredOtherFiles.length > 0) {
    for (const file of filteredOtherFiles) {
      results.other.found.push(file);
      const color = extractColor(file.name);
      
      if (!color) {
        console.log(`   ⚠️ 색상을 확인할 수 없음: ${file.name}`);
        results.other.errors.push({
          fileName: file.name,
          reason: 'color_not_detected'
        });
        continue;
      }
      
      // 파일명에서 상대 경로 추출
      const relativePath = file.path.replace(`${baseFolder}/`, '');
      const targetPath = `originals/goods/golf-hat-muziik-${color}/${relativePath}`;
      console.log(`   📦 이동 중: ${file.name} → ${color}`);
      
      const result = await moveFile(file.path, targetPath);
      
      if (result.success) {
        results.other.moved.push({
          fileName: file.name,
          from: file.path,
          to: targetPath,
          color
        });
        console.log(`   ✅ 이동 완료: ${file.name}`);
      } else {
        results.other.errors.push({
          fileName: file.name,
          error: result.error
        });
        console.error(`   ❌ 이동 실패: ${file.name} - ${result.error}`);
      }
    }
  } else {
    console.log('   ℹ️ 기타 파일이 없습니다.');
  }

  // 4. 최종 확인: 폴더가 비어있는지 확인
  console.log('\n4️⃣ 최종 확인 중...\n');
  const finalCheck = await listFilesRecursive(baseFolder);
  
  if (finalCheck.length === 0) {
    console.log('   ✅ golf-hat-muziik 폴더가 비어있습니다.');
    console.log('   ℹ️ Supabase Storage는 빈 폴더가 자동으로 사라지므로 별도 삭제 작업이 필요하지 않습니다.');
  } else {
    console.log(`   ⚠️ 아직 ${finalCheck.length}개 파일이 남아있습니다:`);
    finalCheck.forEach(file => {
      console.log(`      - ${file.path}`);
    });
  }

  // 결과 저장
  const resultPath = path.join(__dirname, 'check-and-cleanup-golf-hat-folder-result.json');
  fs.writeFileSync(resultPath, JSON.stringify(results, null, 2));
  console.log(`\n📄 결과 저장: ${resultPath}`);

  // 최종 요약
  console.log('\n' + '='.repeat(60));
  console.log('✅ golf-hat-muziik 폴더 정리 완료!\n');
  console.log('📊 작업 요약:');
  console.log(`   gallery:`);
  console.log(`      - 발견: ${results.gallery.found.length}개`);
  console.log(`      - 이동: ${results.gallery.moved.length}개`);
  console.log(`      - 오류: ${results.gallery.errors.length}개`);
  console.log(`   composition:`);
  console.log(`      - 발견: ${results.composition.found.length}개`);
  console.log(`      - 이동: ${results.composition.moved.length}개`);
  console.log(`      - 오류: ${results.composition.errors.length}개`);
  console.log(`   기타:`);
  console.log(`      - 발견: ${results.other.found.length}개`);
  console.log(`      - 이동: ${results.other.moved.length}개`);
  console.log(`      - 오류: ${results.other.errors.length}개`);
  
  const totalErrors = 
    results.gallery.errors.length +
    results.composition.errors.length +
    results.other.errors.length;
  
  if (totalErrors > 0) {
    console.log(`\n⚠️ 오류 발생: ${totalErrors}개`);
  } else {
    console.log('\n✨ 모든 작업이 성공적으로 완료되었습니다!');
  }
}

// 실행
checkAndCleanupGolfHatFolder().catch(error => {
  console.error('\n❌ 치명적 오류:', error);
  process.exit(1);
});

