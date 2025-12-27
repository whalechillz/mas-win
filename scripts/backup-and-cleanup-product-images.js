/**
 * 제품 이미지 백업 및 삭제 스크립트
 * 마이그레이션 완료 후 원본 파일을 백업 폴더로 이동 후 삭제
 */

require('dotenv').config({ path: '.env.local' });

const fs = require('fs');
const path = require('path');

/**
 * 백업 및 삭제 실행
 */
async function backupAndCleanup() {
  console.log('🔄 제품 이미지 백업 및 삭제 시작...\n');

  const productsDir = path.join(process.cwd(), 'public/main/products');
  const backupDir = path.join(process.cwd(), 'backup/product-images', new Date().toISOString().split('T')[0]);

  if (!fs.existsSync(productsDir)) {
    console.error(`❌ 제품 폴더를 찾을 수 없습니다: ${productsDir}`);
    process.exit(1);
  }

  // 백업 디렉토리 생성
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
    console.log(`📁 백업 디렉토리 생성: ${backupDir}\n`);
  }

  const migrationLogPath = path.join(process.cwd(), 'migration-log-product-images.json');
  if (!fs.existsSync(migrationLogPath)) {
    console.error(`❌ 마이그레이션 로그를 찾을 수 없습니다: ${migrationLogPath}`);
    console.error('   먼저 마이그레이션 스크립트를 실행해주세요.');
    process.exit(1);
  }

  const migrationLog = JSON.parse(fs.readFileSync(migrationLogPath, 'utf8'));
  const successFiles = migrationLog.success || [];

  console.log(`📊 마이그레이션 성공 파일: ${successFiles.length}개\n`);

  let backedUp = 0;
  let deleted = 0;
  let failed = 0;
  const errors = [];

  // 성공적으로 마이그레이션된 파일만 백업 및 삭제
  for (const fileInfo of successFiles) {
    const originalPath = fileInfo.original;
    
    if (!fs.existsSync(originalPath)) {
      console.log(`⚠️  파일 없음 (이미 삭제됨?): ${originalPath}`);
      continue;
    }

    try {
      // 백업 경로 생성
      const relativePath = path.relative(productsDir, originalPath);
      const backupPath = path.join(backupDir, relativePath);
      const backupFolder = path.dirname(backupPath);

      // 백업 폴더 생성
      if (!fs.existsSync(backupFolder)) {
        fs.mkdirSync(backupFolder, { recursive: true });
      }

      // 파일 복사 (백업)
      fs.copyFileSync(originalPath, backupPath);
      console.log(`✅ 백업: ${relativePath}`);

      // 원본 파일 삭제
      fs.unlinkSync(originalPath);
      console.log(`🗑️  삭제: ${relativePath}`);

      backedUp++;
      deleted++;
    } catch (error) {
      console.error(`❌ 오류: ${originalPath} - ${error.message}`);
      errors.push({ file: originalPath, error: error.message });
      failed++;
    }
  }

  // 빈 폴더 정리
  console.log('\n🧹 빈 폴더 정리 중...');
  cleanupEmptyFolders(productsDir);

  // 요약 출력
  console.log('\n📊 백업 및 삭제 요약:');
  console.log(`  ✅ 백업 완료: ${backedUp}개`);
  console.log(`  🗑️  삭제 완료: ${deleted}개`);
  console.log(`  ❌ 실패: ${failed}개`);
  console.log(`\n📁 백업 위치: ${backupDir}`);

  if (errors.length > 0) {
    console.log('\n❌ 오류 목록:');
    errors.forEach(({ file, error }) => {
      console.log(`  - ${file}: ${error}`);
    });
  }

  // 백업 로그 저장
  const backupLog = {
    date: new Date().toISOString(),
    backupDir: backupDir,
    summary: {
      backedUp,
      deleted,
      failed
    },
    errors
  };

  const backupLogPath = path.join(backupDir, 'backup-log.json');
  fs.writeFileSync(backupLogPath, JSON.stringify(backupLog, null, 2));
  console.log(`\n📝 백업 로그 저장: ${backupLogPath}`);

  console.log('\n🎉 백업 및 삭제 완료!');
}

/**
 * 빈 폴더 재귀적으로 삭제
 */
function cleanupEmptyFolders(dir) {
  if (!fs.existsSync(dir)) {
    return;
  }

  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      cleanupEmptyFolders(filePath);
      
      // 폴더가 비어있으면 삭제
      const remainingFiles = fs.readdirSync(filePath);
      if (remainingFiles.length === 0) {
        fs.rmdirSync(filePath);
        console.log(`  🗑️  빈 폴더 삭제: ${path.relative(process.cwd(), filePath)}`);
      }
    }
  });
}

// 실행
backupAndCleanup().catch(error => {
  console.error('❌ 백업 및 삭제 중 오류 발생:', error);
  process.exit(1);
});

