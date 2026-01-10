/**
 * 모든 제품 폴더 마이그레이션 스크립트
 * 기존 폴더명을 새 slug로 변경
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
  'gold2': 'secret-force-gold-2',
  'gold2-sapphire': 'secret-force-gold-2-muziik',
  'pro3-muziik': 'secret-force-pro-3-muziik',
  'pro3': 'secret-force-pro-3',
  'v3': 'secret-force-v3',
};

const SUBFOLDERS = ['detail', 'composition', 'gallery'];

/**
 * 폴더 내 모든 파일 목록 가져오기 (하위 폴더 포함)
 */
async function listAllFiles(folderPath) {
  const allFiles = [];
  
  // 하위 폴더 목록
  const subfolders = ['detail', 'composition', 'gallery'];
  
  // 각 하위 폴더의 파일 가져오기
  for (const subfolder of subfolders) {
    const subfolderPath = `${folderPath}/${subfolder}`;
    
    const { data, error } = await supabase.storage
      .from('blog-images')
      .list(subfolderPath, {
        limit: 1000,
        sortBy: { column: 'name', order: 'asc' },
      });

    if (error) {
      // 폴더가 없으면 스킵
      if (error.message.includes('not found') || error.statusCode === 404) {
        continue;
      }
      continue;
    }

    if (!data || data.length === 0) continue;

    // 파일만 필터링 (metadata.size가 있는 것만)
    const files = data.filter(item => item.metadata && item.metadata.size !== undefined);
    
    for (const file of files) {
      allFiles.push({
        path: `${subfolderPath}/${file.name}`,
        name: file.name,
        size: file.metadata?.size,
      });
    }
  }
  
  // 루트 폴더의 파일도 확인
  const { data: rootData, error: rootError } = await supabase.storage
    .from('blog-images')
    .list(folderPath, {
      limit: 1000,
      sortBy: { column: 'name', order: 'asc' },
    });

  if (!rootError && rootData) {
    const rootFiles = rootData.filter(item => item.metadata && item.metadata.size !== undefined);
    for (const file of rootFiles) {
      allFiles.push({
        path: `${folderPath}/${file.name}`,
        name: file.name,
        size: file.metadata?.size,
      });
    }
  }

  return allFiles;
}

/**
 * 단일 제품 폴더 마이그레이션
 */
async function migrateProductFolder(oldFolder, newFolder) {
  console.log(`\n📦 ${oldFolder} → ${newFolder} 마이그레이션 시작...`);

  const oldPath = `originals/products/${oldFolder}`;
  const newPath = `originals/products/${newFolder}`;

  // 1. 기존 폴더 확인
  const { data: oldItems } = await supabase.storage
    .from('blog-images')
    .list(oldPath, { limit: 1 });

  if (!oldItems || oldItems.length === 0) {
    console.log(`   ⚠️ 기존 폴더가 없습니다: ${oldPath}`);
    return { success: false, reason: '기존 폴더 없음' };
  }

  // 2. 모든 파일 목록 가져오기
  console.log(`   📋 파일 목록 수집 중...`);
  const allFiles = await listAllFiles(oldPath);
  
  if (allFiles.length === 0) {
    console.log(`   ⚠️ 이동할 파일이 없습니다.`);
    return { success: false, reason: '파일 없음' };
  }

  console.log(`   📁 총 ${allFiles.length}개 파일 발견`);

  // 3. 파일 이동
  let successCount = 0;
  let failCount = 0;

  for (const file of allFiles) {
    const oldFilePath = file.path;
    const relativePath = oldFilePath.replace(`${oldPath}/`, '');
    const newFilePath = `${newPath}/${relativePath}`;

    try {
      // 파일 다운로드
      const { data: fileData, error: downloadError } = await supabase.storage
        .from('blog-images')
        .download(oldFilePath);

      if (downloadError) {
        console.error(`   ❌ 다운로드 실패: ${oldFilePath}`, downloadError.message);
        failCount++;
        continue;
      }

      // ArrayBuffer를 Buffer로 변환
      const arrayBuffer = await fileData.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      // Content-Type 추론
      const path = require('path');
      const ext = path.extname(oldFilePath).toLowerCase();
      const contentTypeMap = {
        '.webp': 'image/webp',
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.png': 'image/png',
      };
      const contentType = contentTypeMap[ext] || 'image/webp';

      // 새 위치에 업로드
      const { error: uploadError } = await supabase.storage
        .from('blog-images')
        .upload(newFilePath, buffer, {
          contentType,
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) {
        // 이미 존재하는 경우 스킵
        if (uploadError.message.includes('already exists') || uploadError.message.includes('duplicate')) {
          console.log(`   ⚠️ 이미 존재함: ${newFilePath}`);
          successCount++;
          continue;
        }
        console.error(`   ❌ 업로드 실패: ${newFilePath}`, uploadError.message);
        failCount++;
        continue;
      }

      // 기존 파일 삭제
      const { error: deleteError } = await supabase.storage
        .from('blog-images')
        .remove([oldFilePath]);

      if (deleteError) {
        console.warn(`   ⚠️ 기존 파일 삭제 실패 (무시): ${oldFilePath}`, deleteError.message);
      }

      successCount++;
      if (successCount % 5 === 0) {
        process.stdout.write(`   ✅ ${successCount}/${allFiles.length}개 이동 완료...\r`);
      }
    } catch (error) {
      console.error(`   ❌ 오류: ${oldFilePath}`, error.message);
      failCount++;
    }
  }

  console.log(`\n   ✅ 완료: ${successCount}개 성공, ${failCount}개 실패`);

  return {
    success: failCount === 0,
    successCount,
    failCount,
    totalFiles: allFiles.length,
  };
}

/**
 * 모든 제품 폴더 마이그레이션 실행
 */
async function migrateAllFolders() {
  console.log('🚀 모든 제품 폴더 마이그레이션 시작\n');
  console.log(`총 ${Object.keys(FOLDER_MAPPINGS).length}개 제품 폴더 처리 예정\n`);

  const results = [];

  for (const [oldFolder, newFolder] of Object.entries(FOLDER_MAPPINGS)) {
    const result = await migrateProductFolder(oldFolder, newFolder);
    results.push({
      oldFolder,
      newFolder,
      ...result,
    });

    // API 제한 방지를 위한 짧은 대기
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  // 최종 요약
  console.log('\n' + '='.repeat(60));
  console.log('📊 마이그레이션 최종 결과');
  console.log('='.repeat(60));

  let totalSuccess = 0;
  let totalFail = 0;
  let totalFiles = 0;

  results.forEach(result => {
    const status = result.success ? '✅' : '❌';
    console.log(`${status} ${result.oldFolder} → ${result.newFolder}`);
    if (result.totalFiles !== undefined) {
      console.log(`   파일: ${result.successCount}/${result.totalFiles}개 성공`);
      totalSuccess += result.successCount;
      totalFail += result.failCount || 0;
      totalFiles += result.totalFiles;
    } else {
      console.log(`   ${result.reason || '처리 안됨'}`);
    }
  });

  console.log('\n' + '='.repeat(60));
  console.log(`총 ${totalFiles}개 파일 중 ${totalSuccess}개 성공, ${totalFail}개 실패`);
  console.log('='.repeat(60));
}

// 실행
migrateAllFolders().catch(console.error);
