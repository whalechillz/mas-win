/**
 * 공통 폴더를 originals/components/로 마이그레이션하는 스크립트
 * 
 * 실행 방법:
 * node scripts/migrate-common-folders-to-components.js
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Supabase 환경 변수가 설정되지 않았습니다.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);
const STORAGE_BUCKET = 'blog-images';

// 마이그레이션할 공통 폴더 목록
const COMMON_FOLDERS = [
  'grip-common',
  'muziik-common',
  'ngs-common',
  'secret-force-common',
  'secret-force-gold-common',
  'secret-weapon-black-common',
  'secret-weapon-gold-common',
];

/**
 * 폴더의 모든 파일 목록 조회
 */
async function listFilesInFolder(folderPath) {
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
      console.error(`❌ 폴더 조회 에러 (${folderPath}):`, error);
      break;
    }

    if (!files || files.length === 0) {
      break;
    }

    // 파일만 필터링 (id가 있는 항목)
    const fileItems = files.filter(item => item.id);
    allFiles.push(...fileItems);

    offset += batchSize;
    if (files.length < batchSize) {
      break;
    }
  }

  return allFiles;
}

/**
 * 파일을 새 위치로 복사
 */
async function copyFile(sourcePath, destPath) {
  try {
    // 파일 다운로드
    const { data: fileData, error: downloadError } = await supabase.storage
      .from(STORAGE_BUCKET)
      .download(sourcePath);

    if (downloadError) {
      throw downloadError;
    }

    // 새 위치에 업로드
    const { error: uploadError } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(destPath, fileData, {
        contentType: 'image/webp',
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) {
      throw uploadError;
    }

    return true;
  } catch (error) {
    console.error(`❌ 파일 복사 실패 (${sourcePath} → ${destPath}):`, error);
    return false;
  }
}

/**
 * 폴더 마이그레이션
 */
async function migrateFolder(folderName) {
  console.log(`\n📁 폴더 마이그레이션 시작: ${folderName}`);
  
  const sourceBasePath = `originals/products/${folderName}`;
  const destBasePath = `originals/components/${folderName}`;

  // 하위 폴더 목록 (composition, detail, gallery 등)
  const subFolders = ['composition', 'detail', 'gallery'];

  for (const subFolder of subFolders) {
    const sourcePath = `${sourceBasePath}/${subFolder}`;
    const destPath = `${destBasePath}/${subFolder}`;

    console.log(`  📂 ${subFolder} 폴더 처리 중...`);

    // 파일 목록 조회
    const files = await listFilesInFolder(sourcePath);
    
    if (files.length === 0) {
      console.log(`    ℹ️  파일이 없습니다.`);
      continue;
    }

    console.log(`    📄 ${files.length}개 파일 발견`);

    // 각 파일 복사
    let successCount = 0;
    let failCount = 0;

    for (const file of files) {
      const sourceFilepath = `${sourcePath}/${file.name}`;
      const destFilepath = `${destPath}/${file.name}`;

      const success = await copyFile(sourceFilepath, destFilepath);
      if (success) {
        successCount++;
        console.log(`    ✅ ${file.name}`);
      } else {
        failCount++;
        console.log(`    ❌ ${file.name}`);
      }
    }

    console.log(`    📊 결과: 성공 ${successCount}개, 실패 ${failCount}개`);
  }

  console.log(`✅ 폴더 마이그레이션 완료: ${folderName}`);
}

/**
 * 메인 실행 함수
 */
async function main() {
  console.log('🚀 공통 폴더 마이그레이션 시작\n');
  console.log(`마이그레이션 대상: ${COMMON_FOLDERS.length}개 폴더`);
  console.log(`원본 경로: originals/products/{folder-name}`);
  console.log(`대상 경로: originals/components/{folder-name}\n`);

  // 사용자 확인 (--yes 옵션이 있으면 자동 실행)
  const autoConfirm = process.argv.includes('--yes') || process.argv.includes('-y');
  
  if (!autoConfirm) {
    const readline = require('readline').createInterface({
      input: process.stdin,
      output: process.stdout
    });

    const answer = await new Promise(resolve => {
      readline.question('계속하시겠습니까? (y/n): ', resolve);
    });

    readline.close();

    if (answer.toLowerCase() !== 'y') {
      console.log('❌ 마이그레이션이 취소되었습니다.');
      return;
    }
  } else {
    console.log('✅ 자동 확인 모드로 실행합니다.\n');
  }

  // 각 폴더 마이그레이션
  for (const folderName of COMMON_FOLDERS) {
    await migrateFolder(folderName);
  }

  console.log('\n✅ 모든 폴더 마이그레이션 완료!');
  console.log('\n⚠️  주의: 원본 폴더(originals/products/)는 수동으로 삭제하거나 백업 후 삭제하세요.');
}

// 스크립트 실행
main().catch(error => {
  console.error('❌ 마이그레이션 중 오류 발생:', error);
  process.exit(1);
});
