/**
 * 사인 이미지를 고객 폴더로 정리
 * - 사인 폴더의 이미지를 고객별로 찾아서 해당 고객 폴더로 이동
 */

const fs = require('fs');
const path = require('path');

const SIGN_FOLDER = '/Users/m2/MASLABS/00.블로그_고객/사인';
const BLOG_CUSTOMER_FOLDER = '/Users/m2/MASLABS/00.블로그_고객';

function normalizeKorean(text) {
  return text.normalize('NFC');
}

function findCustomerFolder(customerName) {
  // 2022-2026 모든 연도 폴더에서 고객 폴더 찾기
  for (const year of ['2022', '2023', '2024', '2025', '2026']) {
    const yearFolder = path.join(BLOG_CUSTOMER_FOLDER, year);
    if (!fs.existsSync(yearFolder)) continue;
    
    const folders = fs.readdirSync(yearFolder);
    for (const folder of folders) {
      // YYYY.MM.DD.고객이름 형식
      const match = folder.match(/^(\d{4})\.(\d{1,2})\.(\d{1,2})\.(.+)$/);
      if (match) {
        const folderCustomerName = match[4].split('-')[0].split('(')[0].trim();
        const normalizedFolderName = normalizeKorean(folderCustomerName);
        const normalizedCustomerName = normalizeKorean(customerName);
        
        if (normalizedFolderName === normalizedCustomerName) {
          return path.join(yearFolder, folder);
        }
      }
    }
  }
  
  return null;
}

async function organizeSignImages() {
  console.log('🔄 사인 이미지 정리 시작...\n');
  
  if (!fs.existsSync(SIGN_FOLDER)) {
    console.error(`❌ 사인 폴더가 없습니다: ${SIGN_FOLDER}`);
    return;
  }
  
  const files = fs.readdirSync(SIGN_FOLDER)
    .map(f => path.join(SIGN_FOLDER, f))
    .filter(f => {
      const stat = fs.statSync(f);
      return stat.isFile() && f.toLowerCase().endsWith('.png');
    });
  
  console.log(`📸 사인 폴더 PNG 파일 수: ${files.length}개\n`);
  
  let successCount = 0;
  let failCount = 0;
  let notFoundCount = 0;
  
  let notFoundFiles = [];
  
  for (const file of files) {
    const fileName = path.basename(file);
    // 파일명 정규화
    const normalizedFileName = normalizeKorean(fileName);
    
    // 파일명에서 고객 이름 추출 (예: "강병부_사인.png" -> "강병부")
    // 여러 패턴 시도
    let match = normalizedFileName.match(/^(.+?)_사인\.png$/i);
    if (!match) {
      match = normalizedFileName.match(/^(.+?)_사인/);
    }
    if (!match) {
      match = normalizedFileName.match(/(.+?)_사인/);
    }
    
    if (!match) {
      console.log(`⚠️  파일명 형식 불일치: ${fileName}`);
      failCount++;
      continue;
    }
    
    const customerName = normalizeKorean(match[1]);
    const customerFolder = findCustomerFolder(customerName);
    
    if (!customerFolder) {
      console.log(`❌ 고객 폴더를 찾을 수 없음: ${customerName} (${fileName})`);
      notFoundFiles.push({ fileName, customerName });
      notFoundCount++;
      continue;
    }
    
    const targetPath = path.join(customerFolder, fileName);
    
    try {
      // 이미 존재하는 파일인지 확인
      if (fs.existsSync(targetPath)) {
        console.log(`⏭️  이미 존재: ${customerName}/${fileName}`);
        // 원본 삭제
        fs.unlinkSync(file);
        successCount++;
        continue;
      }
      
      // 파일 이동
      fs.renameSync(file, targetPath);
      console.log(`✅ 이동 완료: ${customerName}/${fileName} → ${path.basename(customerFolder)}`);
      successCount++;
    } catch (error) {
      console.error(`❌ 이동 실패: ${customerName}/${fileName} - ${error.message}`);
      failCount++;
    }
  }
  
  console.log(`\n${'='.repeat(60)}`);
  console.log(`📊 정리 완료!`);
  console.log(`${'='.repeat(60)}`);
  console.log(`✅ 성공: ${successCount}개`);
  console.log(`❌ 실패: ${failCount}개`);
  console.log(`⚠️  폴더 없음: ${notFoundCount}개`);
  
  if (notFoundFiles.length > 0) {
    console.log(`\n📋 폴더를 찾을 수 없는 파일:`);
    notFoundFiles.forEach(f => {
      console.log(`   - ${f.fileName} (고객: ${f.customerName})`);
    });
  }
}

if (require.main === module) {
  organizeSignImages().catch(console.error);
}
