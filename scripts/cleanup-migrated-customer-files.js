/**
 * migrated 폴더에서 고객 관련 이미지/영상/PDF만 삭제
 * 함수/기획 파일(.js, .md, .json, .log 등)은 유지
 */

const fs = require('fs');
const path = require('path');

const MIGRATED_FOLDER = path.join(process.cwd(), 'migrated');

// 유지할 파일 확장자
const KEEP_EXTENSIONS = ['.js', '.ts', '.md', '.json', '.log', '.txt', '.sh', '.sql'];

// 삭제할 파일 확장자
const DELETE_EXTENSIONS = ['.webp', '.jpg', '.jpeg', '.png', '.gif', '.bmp', '.heic', '.heif', '.pdf', '.mp4', '.mov', '.avi', '.mkv', '.webm'];

// 고객 관련 폴더 패턴
const CUSTOMER_FOLDER_PATTERNS = [
  /^customer-/,
  /^jang-/,
  /^kim-/,
  /^lee-/,
  /^park-/,
  /^choi-/,
  /^sothwayot/,
  /^gatbyeotbu/,
  /^hajotcheon/,
  /^joseotdae/,
  /^kimhangu/,
  /^unmatched/,
  /^anyeotho/,
  /^bakbotsu/,
  /^bakdotryeot/,
  /^bakjinuk/,
  /^bakjutjin/,
  /^bakseotwon/,
  /^bakyeotgu/,
  /^bakyeotgwan/,
  /^bakyotok/,
  /^batgwatseot/,
  /^chaemunseok/,
  /^chaeyeottae/,
  /^choebeolgyu/,
  /^gatsathwi/,
  /^gatseotdot/,
  /^gatwonsik/,
  /^gatyeotgit/,
  /^gwonseotsu/,
  /^hangwiyot/,
  /^hotgibot/,
  /^hwatinseok/,
  /^igatseok/,
  /^igyeotmin/,
  /^ijotsu/,
  /^ijunhui/,
  /^iokhyeot/,
  /^isatcheon/,
  /^isungit/,
  /^isuwon/,
  /^iyunhui/,
  /^jang-ga-ban/,
  /^jang-jinsu/,
  /^janggeunsu/,
  /^jedothwan/,
  /^jeonjinyot/,
  /^jeothaeseon/,
  /^jeothyeotpyo/,
  /^jeottaeut/,
  /^jobohyeon/,
  /^jobyeotseom/,
  /^joyathyeon/,
  /^joyeotsu/,
  /^kim-suhwan/,
  /^kimbothyeon/,
  /^kimchangi/,
  /^kimgayeot/,
  /^kimhakgyu/,
  /^kimhotchat/,
  /^kimjaehui/,
  /^kimjeotseok/,
  /^kimjotan/,
  /^kimsabin/,
  /^kimsathyeon/,
  /^kimseokgu/,
  /^kimseonae/,
  /^kimseonok/,
  /^kimseotmuk/,
  /^kimseuthun/,
  /^kimsunbok/,
  /^kimwonputun/,
  /^kimyeotjin/,
  /^kimyeotpit/,
  /^kimyotseok/,
  /^lee-hee-ik/,
  /^lee-ju-dong/,
  /^minhosik/,
  /^mukhyeonsat/,
  /^mungwatbae/,
  /^silwonseom/,
  /^sinhuigam/,
  /^wonjotmun/,
  /^yeonjaehwa/,
  /^yu-jae-young/,
  /^yubyeotmuk/,
  /^yuhotgeun/,
  /^yunjotdeok/,
];

function isCustomerFolder(folderName) {
  return CUSTOMER_FOLDER_PATTERNS.some(pattern => pattern.test(folderName));
}

function shouldDeleteFile(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  
  // 유지할 확장자는 삭제하지 않음
  if (KEEP_EXTENSIONS.includes(ext)) {
    return false;
  }
  
  // 삭제할 확장자면 삭제
  if (DELETE_EXTENSIONS.includes(ext)) {
    return true;
  }
  
  // 기타 파일은 유지
  return false;
}

function cleanupCustomerFiles() {
  console.log('🔄 migrated 폴더 고객 관련 파일 정리 시작...\n');
  
  if (!fs.existsSync(MIGRATED_FOLDER)) {
    console.error(`❌ migrated 폴더가 없습니다: ${MIGRATED_FOLDER}`);
    return;
  }
  
  let deletedFiles = 0;
  let deletedFolders = 0;
  let keptFiles = 0;
  const errors = [];
  
  // 1단계: 고객 폴더 내의 이미지/영상/PDF 파일 삭제
  console.log('📁 1단계: 고객 폴더 내 파일 삭제 중...\n');
  
  const items = fs.readdirSync(MIGRATED_FOLDER);
  
  for (const item of items) {
    const itemPath = path.join(MIGRATED_FOLDER, item);
    
    try {
      const stat = fs.statSync(itemPath);
      
      if (stat.isDirectory()) {
        // 고객 폴더인지 확인
        if (isCustomerFolder(item)) {
          console.log(`📁 고객 폴더 발견: ${item}`);
          
          // 폴더 내 모든 파일 재귀적으로 삭제
          function deleteFilesInDir(dir) {
            const files = fs.readdirSync(dir);
            
            for (const file of files) {
              const filePath = path.join(dir, file);
              const fileStat = fs.statSync(filePath);
              
              if (fileStat.isDirectory()) {
                deleteFilesInDir(filePath);
                // 빈 폴더 삭제 시도
                try {
                  fs.rmdirSync(filePath);
                } catch (e) {
                  // 폴더가 비어있지 않으면 무시
                }
              } else if (fileStat.isFile()) {
                if (shouldDeleteFile(filePath)) {
                  fs.unlinkSync(filePath);
                  deletedFiles++;
                } else {
                  keptFiles++;
                }
              }
            }
          }
          
          deleteFilesInDir(itemPath);
          
          // 폴더가 비어있으면 삭제
          try {
            const remainingFiles = fs.readdirSync(itemPath);
            if (remainingFiles.length === 0) {
              fs.rmdirSync(itemPath);
              deletedFolders++;
              console.log(`   ✅ 폴더 삭제: ${item}`);
            } else {
              console.log(`   ⚠️  폴더에 파일이 남아있음: ${item} (${remainingFiles.length}개)`);
            }
          } catch (e) {
            // 폴더 삭제 실패 (파일이 남아있음)
          }
        }
      } else if (stat.isFile()) {
        // 루트 레벨 파일 처리
        if (shouldDeleteFile(itemPath)) {
          fs.unlinkSync(itemPath);
          deletedFiles++;
          console.log(`   🗑️  파일 삭제: ${item}`);
        } else {
          keptFiles++;
        }
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
  
  if (errors.length > 0) {
    console.log(`\n📋 오류 목록:`);
    errors.forEach(e => {
      console.log(`   - ${e.item}: ${e.error}`);
    });
  }
  
  // 2단계: 빈 고객 폴더 정리
  console.log(`\n📁 2단계: 빈 폴더 정리 중...\n`);
  
  function removeEmptyDirs(dir) {
    let removed = 0;
    
    try {
      const items = fs.readdirSync(dir);
      
      for (const item of items) {
        const itemPath = path.join(dir, item);
        
        try {
          const stat = fs.statSync(itemPath);
          
          if (stat.isDirectory()) {
            // 재귀적으로 하위 폴더 정리
            const subRemoved = removeEmptyDirs(itemPath);
            removed += subRemoved;
            
            // 폴더가 비어있는지 확인
            const remaining = fs.readdirSync(itemPath);
            if (remaining.length === 0) {
              fs.rmdirSync(itemPath);
              removed++;
            }
          }
        } catch (e) {
          // 무시
        }
      }
    } catch (e) {
      // 무시
    }
    
    return removed;
  }
  
  const removedEmptyDirs = removeEmptyDirs(MIGRATED_FOLDER);
  console.log(`   ✅ 빈 폴더 ${removedEmptyDirs}개 삭제 완료`);
  
  console.log(`\n✅ 전체 정리 완료!`);
}

if (require.main === module) {
  cleanupCustomerFiles();
}
