/**
 * originals/products/ 아래의 공통 폴더를 삭제하는 스크립트
 * (originals/components/로 마이그레이션 완료 후 원본 삭제)
 * 
 * 실행 방법:
 * node scripts/delete-original-common-folders.js
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

// 삭제할 공통 폴더 목록
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
 * 폴더 삭제
 */
async function deleteFolder(folderName) {
  console.log(`\n🗑️  폴더 삭제 시작: ${folderName}`);
  
  const basePath = `originals/products/${folderName}`;
  const subFolders = ['composition', 'detail', 'gallery'];

  for (const subFolder of subFolders) {
    const folderPath = `${basePath}/${subFolder}`;

    console.log(`  📂 ${subFolder} 폴더 처리 중...`);

    // 파일 목록 조회
    const files = await listFilesInFolder(folderPath);
    
    if (files.length === 0) {
      console.log(`    ℹ️  파일이 없습니다.`);
      continue;
    }

    console.log(`    📄 ${files.length}개 파일 발견`);

    // 각 파일 삭제
    const filePaths = files.map(file => `${folderPath}/${file.name}`);
    
    const { error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .remove(filePaths);

    if (error) {
      console.error(`    ❌ 파일 삭제 실패:`, error);
    } else {
      console.log(`    ✅ ${files.length}개 파일 삭제 완료`);
    }
  }

  console.log(`✅ 폴더 삭제 완료: ${folderName}`);
}

/**
 * 메인 실행 함수
 */
async function main() {
  console.log('🗑️  원본 공통 폴더 삭제 시작\n');
  console.log(`삭제 대상: ${COMMON_FOLDERS.length}개 폴더`);
  console.log(`삭제 경로: originals/products/{folder-name}\n`);

  // 사용자 확인
  const readline = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout
  });

  const answer = await new Promise(resolve => {
    readline.question('⚠️  원본 폴더를 삭제하시겠습니까? (y/n): ', resolve);
  });

  readline.close();

  if (answer.toLowerCase() !== 'y') {
    console.log('❌ 삭제가 취소되었습니다.');
    return;
  }

  // 각 폴더 삭제
  for (const folderName of COMMON_FOLDERS) {
    await deleteFolder(folderName);
  }

  console.log('\n✅ 모든 원본 폴더 삭제 완료!');
}

// 스크립트 실행
main().catch(error => {
  console.error('❌ 삭제 중 오류 발생:', error);
  process.exit(1);
});
