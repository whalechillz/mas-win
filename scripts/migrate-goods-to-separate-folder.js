/**
 * 굿즈 이미지를 originals/products/goods/* → originals/goods/* 로 이동
 * 
 * 실행 방법:
 * node scripts/migrate-goods-to-separate-folder.js
 */

require('dotenv').config({ path: '.env.local' });

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Supabase 환경 변수가 설정되지 않았습니다.');
  console.error('NEXT_PUBLIC_SUPABASE_URL과 SUPABASE_SERVICE_ROLE_KEY를 설정해주세요.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

/**
 * Storage에서 파일 목록을 재귀적으로 가져오기
 */
async function listFilesRecursive(folderPath) {
  const allFiles = [];
  let offset = 0;
  const batchSize = 1000;

  while (true) {
    const { data: files, error } = await supabase.storage
      .from('blog-images')
      .list(folderPath, {
        limit: batchSize,
        offset: offset,
        sortBy: { column: 'name', order: 'asc' }
      });

    if (error) {
      console.error(`❌ 폴더 조회 오류 (${folderPath}):`, error);
      break;
    }

    if (!files || files.length === 0) {
      break;
    }

    for (const file of files) {
      if (file.id) {
        // 파일인 경우
        allFiles.push({
          name: file.name,
          path: `${folderPath}/${file.name}`,
          metadata: file.metadata
        });
      } else {
        // 폴더인 경우 재귀적으로 탐색
        const subFolderPath = `${folderPath}/${file.name}`;
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
 * 파일을 새 경로로 이동 (복사 후 삭제)
 */
async function moveFile(oldPath, newPath) {
  try {
    // 1. 파일 다운로드
    const { data: fileData, error: downloadError } = await supabase.storage
      .from('blog-images')
      .download(oldPath);

    if (downloadError) {
      console.error(`❌ 파일 다운로드 실패 (${oldPath}):`, downloadError);
      return { success: false, error: downloadError };
    }

    // 2. 새 경로에 업로드
    const { error: uploadError } = await supabase.storage
      .from('blog-images')
      .upload(newPath, fileData, {
        contentType: fileData.type || 'image/jpeg',
        upsert: true
      });

    if (uploadError) {
      console.error(`❌ 파일 업로드 실패 (${newPath}):`, uploadError);
      return { success: false, error: uploadError };
    }

    // 3. 기존 파일 삭제
    const { error: deleteError } = await supabase.storage
      .from('blog-images')
      .remove([oldPath]);

    if (deleteError) {
      console.error(`⚠️ 기존 파일 삭제 실패 (${oldPath}):`, deleteError);
      // 업로드는 성공했으므로 경고만 출력
    }

    return { success: true };
  } catch (error) {
    console.error(`❌ 파일 이동 오류 (${oldPath} → ${newPath}):`, error);
    return { success: false, error };
  }
}

/**
 * 메인 마이그레이션 함수
 */
async function migrateGoodsImages() {
  console.log('🚀 굿즈 이미지 마이그레이션 시작...\n');

  try {
    // 1. originals/products/goods/ 폴더의 모든 파일 조회
    console.log('📁 originals/products/goods/ 폴더 스캔 중...');
    const goodsFiles = await listFilesRecursive('originals/products/goods');

    if (goodsFiles.length === 0) {
      console.log('✅ 이동할 파일이 없습니다.');
      return;
    }

    console.log(`📊 총 ${goodsFiles.length}개 파일 발견\n`);

    // 2. 각 파일을 새 경로로 이동
    let successCount = 0;
    let failCount = 0;
    const movedFiles = [];

    for (let i = 0; i < goodsFiles.length; i++) {
      const file = goodsFiles[i];
      const oldPath = file.path;
      
      // originals/products/goods/{slug}/... → originals/goods/{slug}/...
      const newPath = oldPath.replace('originals/products/goods/', 'originals/goods/');

      console.log(`[${i + 1}/${goodsFiles.length}] 이동 중: ${oldPath} → ${newPath}`);

      const result = await moveFile(oldPath, newPath);

      if (result.success) {
        successCount++;
        movedFiles.push({ oldPath, newPath });
        console.log(`  ✅ 성공`);
      } else {
        failCount++;
        console.log(`  ❌ 실패: ${result.error?.message || '알 수 없는 오류'}`);
      }

      // API 제한 방지를 위한 짧은 대기
      if ((i + 1) % 10 === 0) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    // 3. 결과 요약
    console.log('\n' + '='.repeat(60));
    console.log('📊 마이그레이션 결과');
    console.log('='.repeat(60));
    console.log(`✅ 성공: ${successCount}개`);
    console.log(`❌ 실패: ${failCount}개`);
    console.log(`📁 총 파일: ${goodsFiles.length}개`);

    if (movedFiles.length > 0) {
      console.log('\n📝 이동된 파일 목록 (처음 10개):');
      movedFiles.slice(0, 10).forEach(({ oldPath, newPath }) => {
        console.log(`  ${oldPath} → ${newPath}`);
      });
      if (movedFiles.length > 10) {
        console.log(`  ... 외 ${movedFiles.length - 10}개`);
      }
    }

    console.log('\n✅ 마이그레이션 완료!');
    console.log('\n⚠️ 다음 단계: 데이터베이스 URL 업데이트를 실행하세요.');
    console.log('   SQL 파일: database/migrate-goods-urls.sql');

  } catch (error) {
    console.error('❌ 마이그레이션 중 오류 발생:', error);
    process.exit(1);
  }
}

// 스크립트 실행
if (require.main === module) {
  migrateGoodsImages()
    .then(() => {
      console.log('\n✅ 스크립트 실행 완료');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ 스크립트 실행 실패:', error);
      process.exit(1);
    });
}

module.exports = { migrateGoodsImages };

