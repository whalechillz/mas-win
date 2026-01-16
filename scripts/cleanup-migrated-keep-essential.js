/**
 * migrated 폴더에서 가장 중요한 파일만 남기고 모두 삭제
 * 유지할 파일: .js, .ts, .md, .json, .sql, .sh
 * 삭제할 파일: 모든 이미지/영상/PDF 및 기타 파일
 */

const fs = require('fs');
const path = require('path');

const MIGRATED_FOLDER = path.join(process.cwd(), 'migrated');

// 유지할 파일 확장자
const KEEP_EXTENSIONS = ['.js', '.ts', '.md', '.json', '.sql', '.sh', '.txt'];

// 삭제할 파일 확장자
const DELETE_EXTENSIONS = ['.webp', '.jpg', '.jpeg', '.png', '.gif', '.bmp', '.heic', '.heif', '.pdf', '.mp4', '.mov', '.avi', '.mkv', '.webm'];

// 유지할 로그 파일 (중요한 것만)
const KEEP_LOG_FILES = [
  'all-customers-2022-2026.log',
  'organize-sign-images.log',
  'organize-sign-images-v2.log',
  'cleanup-customer-files.log',
  'delete-customers-folder.log',
];

function shouldKeepFile(filePath) {
  const fileName = path.basename(filePath);
  const ext = path.extname(filePath).toLowerCase();
  
  // 유지할 확장자는 유지
  if (KEEP_EXTENSIONS.includes(ext)) {
    return true;
  }
  
  // 로그 파일 중 중요한 것만 유지
  if (ext === '.log') {
    return KEEP_LOG_FILES.includes(fileName);
  }
  
  // 기타 파일은 삭제
  return false;
}

function cleanupMigratedFolder() {
  console.log('🔄 migrated 폴더 정리 시작 (중요 파일만 유지)...\n');
  
  if (!fs.existsSync(MIGRATED_FOLDER)) {
    console.error(`❌ migrated 폴더가 없습니다: ${MIGRATED_FOLDER}`);
    return;
  }
  
  let deletedFiles = 0;
  let deletedFolders = 0;
  let keptFiles = 0;
  const errors = [];
  const keptFileList = [];
  
  // 1단계: 루트 레벨 파일 정리
  console.log('📁 1단계: 루트 레벨 파일 정리 중...\n');
  
  const rootItems = fs.readdirSync(MIGRATED_FOLDER);
  
  for (const item of rootItems) {
    const itemPath = path.join(MIGRATED_FOLDER, item);
    
    try {
      const stat = fs.statSync(itemPath);
      
      if (stat.isFile()) {
        if (shouldKeepFile(itemPath)) {
          keptFiles++;
          keptFileList.push(item);
          console.log(`   ✅ 유지: ${item}`);
        } else {
          fs.unlinkSync(itemPath);
          deletedFiles++;
          console.log(`   🗑️  삭제: ${item}`);
        }
      } else if (stat.isDirectory()) {
        // 모든 폴더 삭제 (고객 폴더 및 기타 폴더)
        console.log(`   📁 폴더 삭제: ${item}`);
        fs.rmSync(itemPath, { recursive: true, force: true });
        deletedFolders++;
      }
    } catch (error) {
      errors.push({ item, error: error.message });
      console.error(`   ❌ 처리 실패: ${item} - ${error.message}`);
    }
  }
  
  console.log(`\n${'='.repeat(60)}`);
  console.log(`📊 정리 완료!`);
  console.log(`${'='.repeat(60)}`);
  console.log(`🗑️  삭제된 파일: ${deletedFiles}개`);
  console.log(`📁 삭제된 폴더: ${deletedFolders}개`);
  console.log(`📄 유지된 파일: ${keptFiles}개`);
  console.log(`❌ 오류: ${errors.length}개`);
  
  if (keptFileList.length > 0) {
    console.log(`\n📋 유지된 파일 목록:`);
    keptFileList.forEach(file => {
      console.log(`   - ${file}`);
    });
  }
  
  if (errors.length > 0) {
    console.log(`\n📋 오류 목록:`);
    errors.forEach(e => {
      console.log(`   - ${e.item}: ${e.error}`);
    });
  }
  
  console.log(`\n✅ 전체 정리 완료!`);
}

if (require.main === module) {
  cleanupMigratedFolder();
}
