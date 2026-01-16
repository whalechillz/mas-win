/**
 * 장진수 고객 이미지 마이그레이션 스크립트
 * - 로컬 폴더에서 이미지 찾기
 * - 파일명 영문 변환
 * - WebP 90% 품질로 변환
 * - 변환 결과 검증
 */

const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const { translateKoreanToEnglish } = require('../lib/korean-to-english-translator');

// 장진수 고객 정보
const CUSTOMER_INFO = {
  name: '장진수',
  phone: null, // 전화번호 없으면 null로 설정 (업로드 스크립트에서 이름만으로 검색)
  // phone: '010-9193-8189', // 전화번호가 있으면 이렇게 설정
  visitDate: '2022-04-18',
  // 로컬 폴더 경로 (플레이라이트 구조: 모든 하위 폴더를 자동으로 스캔)
  localFolder: '/Users/m2/MASLABS/00.블로그_고객/2022',
};

// 파일명 패턴 매핑 (긴 패턴부터 우선 매칭)
const FILENAME_PATTERN_MAP = {
  '후기캡처_네이버스마트스토어': 'review-capture-naver-smartstore',
  '후기캡처_카카오톡': 'review-capture-kakao-talk',
  '후기캡처_카카오채널': 'review-capture-kakao-channel',
  '후기캡처_문자': 'review-capture-sms',
  '후기_카카오채널': 'review-capture-kakao-channel',
  '후기_카카오톡': 'review-capture-kakao-talk',
  '후기_문자': 'review-capture-sms',
  '후기_네이버스마트스토어': 'review-capture-naver-smartstore',
  '후기캡처': 'review-capture',
  '후기': 'review-capture',
  '시타영상_편집': 'swing-video-edited',
  '스윙영상': 'swing-video-outdoor',
  '스윙장면': 'swing-scene-outdoor',
  '시타영상': 'swing-video',
  '시타상담': 'swing-consultation',
  '시타장면': 'swing-scene',
  '아트월': 'art-wall',
  '히어로': 'hero',
  '사인': 'signature',
  '측정': 'measurement',
};

// 스토리 장면 매핑
const STORY_SCENE_MAP = {
  '히어로': 1,
  '아트월': 5,
  '시타상담': 4,
  '측정': 4,
  '시타장면': 3,
  '시타영상_편집': 3,
  '시타영상': 3,
  '사인': 6,
  '스윙장면': 6,
  '스윙영상': 6,
  '후기캡처': 7,
  '후기': 7,
};

/**
 * 고객 이름에서 이니셜 추출
 */
function getCustomerInitials(name) {
  if (!name) return 'unknown';
  
  const nameEn = translateKoreanToEnglish(name);
  const parts = nameEn.split(/[\s-]+/);
  return parts.map(part => part.charAt(0)).join('').toLowerCase();
}

/**
 * 조합형 한글을 완성형으로 정규화
 */
function normalizeKorean(text) {
  // 조합형 한글(자모 분리)을 완성형으로 변환
  return text.normalize('NFC');
}

/**
 * 파일명에서 패턴 추출
 */
function extractPattern(fileName) {
  let nameWithoutExt = fileName.replace(/\.[^/.]+$/, '');
  
  // 조합형 한글을 완성형으로 정규화
  nameWithoutExt = normalizeKorean(nameWithoutExt);
  
  // 고객 이름 제거: 첫 번째 언더스코어 이후 부분만 사용
  // 예: "장진수_후기_카카오채널" → "후기_카카오채널"
  const firstUnderscoreIndex = nameWithoutExt.indexOf('_');
  if (firstUnderscoreIndex > 0) {
    nameWithoutExt = nameWithoutExt.substring(firstUnderscoreIndex + 1);
  }
  
  // 추가로 고객 이름이 남아있으면 제거
  const customerNameEn = translateKoreanToEnglish(CUSTOMER_INFO.name).toLowerCase();
  const customerNameKr = CUSTOMER_INFO.name;
  
  nameWithoutExt = nameWithoutExt
    .replace(new RegExp('^' + customerNameKr + '_', 'i'), '')
    .replace(new RegExp('^' + customerNameEn + '_', 'i'), '')
    .replace(/^_+|_+$/g, '')
    .trim();
  
  // 다시 정규화 (이름 제거 후에도)
  nameWithoutExt = normalizeKorean(nameWithoutExt);
  
  // 패턴 찾기 (긴 패턴부터)
  const sortedPatterns = Object.keys(FILENAME_PATTERN_MAP).sort((a, b) => b.length - a.length);
  for (const pattern of sortedPatterns) {
    // 패턴이 파일명에 포함되어 있는지 확인
    if (nameWithoutExt.includes(pattern)) {
      return {
        pattern,
        english: FILENAME_PATTERN_MAP[pattern],
        scene: STORY_SCENE_MAP[pattern] || STORY_SCENE_MAP[pattern.split('_')[0]] || 1
      };
    }
  }
  
  return null;
}

/**
 * 파일명에서 번호 추출
 */
function extractNumber(fileName) {
  const match = fileName.match(/(\d{2})/);
  return match ? parseInt(match[1], 10) : 1;
}

/**
 * 새 파일명 생성
 */
function generateNewFileName(originalFileName) {
  // _ok 제거
  let cleanedFileName = originalFileName.replace(/_ok/g, '');
  
  const pattern = extractPattern(cleanedFileName);
  if (!pattern) {
    console.warn(`⚠️  패턴을 찾을 수 없음: ${originalFileName}`);
    return null;
  }
  
  const number = extractNumber(cleanedFileName);
  const initials = getCustomerInitials(CUSTOMER_INFO.name);
  const scene = pattern.scene;
  const type = pattern.english;
  
  return `${initials}_s${scene}_${type}_${String(number).padStart(2, '0')}.webp`;
}

/**
 * 이미지 파일 찾기 (플레이라이트 구조 지원)
 * 하위 폴더까지 재귀적으로 검색
 */
function findImageFiles(folderPath, recursive = true) {
  if (!fs.existsSync(folderPath)) {
    console.error(`❌ 폴더가 존재하지 않음: ${folderPath}`);
    return [];
  }
  
  const imageFiles = [];
  
  function scanDirectory(dir) {
    const items = fs.readdirSync(dir);
    
    for (const item of items) {
      const itemPath = path.join(dir, item);
      const stat = fs.statSync(itemPath);
      
      if (stat.isDirectory() && recursive) {
        // 하위 폴더 재귀 검색
        scanDirectory(itemPath);
      } else if (stat.isFile()) {
        const ext = path.extname(item).toLowerCase();
        if (['.jpg', '.jpeg', '.png', '.heic', '.webp'].includes(ext)) {
          imageFiles.push({
            originalName: item,
            path: itemPath,
            relativePath: path.relative(folderPath, itemPath)
          });
        }
      }
    }
  }
  
  scanDirectory(folderPath);
  return imageFiles;
}

/**
 * 이미지를 WebP로 변환
 */
async function convertToWebP(inputPath, outputPath, quality = 90) {
  try {
    const image = sharp(inputPath);
    const metadata = await image.metadata();
    
    await image
      .rotate() // EXIF 회전 정보 자동 적용
      .webp({ quality, effort: 6 })
      .toFile(outputPath);
    
    const inputSize = fs.statSync(inputPath).size;
    const outputSize = fs.statSync(outputPath).size;
    const reduction = ((1 - outputSize / inputSize) * 100).toFixed(1);
    
    return {
      success: true,
      inputSize,
      outputSize,
      reduction: parseFloat(reduction),
      width: metadata.width,
      height: metadata.height
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * 마이그레이션 실행
 */
async function migrateCustomerImages() {
  console.log('🔄 장진수 고객 이미지 마이그레이션 시작...\n');
  console.log(`📁 소스 폴더: ${CUSTOMER_INFO.localFolder}\n`);
  
  // 이미지 파일 찾기 (플레이라이트: 모든 하위 폴더 스캔)
  console.log('🔍 이미지 파일 검색 중... (하위 폴더 포함)\n');
  const imageFiles = findImageFiles(CUSTOMER_INFO.localFolder, true);
  
  if (imageFiles.length === 0) {
    console.log('❌ 이미지 파일을 찾을 수 없습니다.');
    console.log(`   폴더 경로를 확인해주세요: ${CUSTOMER_INFO.localFolder}`);
    return;
  }
  
  // 장진수 관련 파일만 필터링 (파일명에 고객 이름 포함 여부 확인)
  const customerFiles = imageFiles.filter(file => {
    const fileName = file.originalName.toLowerCase();
    const customerNameEn = translateKoreanToEnglish(CUSTOMER_INFO.name).toLowerCase();
    const customerNameKr = CUSTOMER_INFO.name.toLowerCase();
    
    return fileName.includes(customerNameEn) || fileName.includes(customerNameKr);
  });
  
  let filesToProcess;
  if (customerFiles.length === 0) {
    console.log(`⚠️  장진수 관련 이미지를 찾을 수 없습니다.`);
    console.log(`   전체 ${imageFiles.length}개 파일 중 장진수 관련 파일이 없습니다.`);
    console.log(`   모든 파일을 처리합니다.\n`);
    filesToProcess = imageFiles;
  } else {
    console.log(`📸 발견된 이미지: ${customerFiles.length}개 (전체 ${imageFiles.length}개 중)\n`);
    filesToProcess = customerFiles;
  }
  
  // 출력 폴더 생성
  const outputFolder = path.join(process.cwd(), 'migrated', 'jang-jinsu');
  if (!fs.existsSync(outputFolder)) {
    fs.mkdirSync(outputFolder, { recursive: true });
  }
  
  const results = [];
  let successCount = 0;
  let failCount = 0;
  
  // 각 파일 처리
  for (const file of filesToProcess) {
    const newFileName = generateNewFileName(file.originalName);
    if (!newFileName) {
      failCount++;
      results.push({
        original: file.originalName,
        new: null,
        status: 'failed',
        reason: '패턴을 찾을 수 없음'
      });
      continue;
    }
    
    const outputPath = path.join(outputFolder, newFileName);
    
    console.log(`📤 처리 중: ${file.originalName}`);
    console.log(`   → ${newFileName}`);
    
    // WebP 변환
    const convertResult = await convertToWebP(file.path, outputPath, 90);
    
    if (convertResult.success) {
      const pattern = extractPattern(file.originalName);
      results.push({
        original: file.originalName,
        new: newFileName,
        path: outputPath,
        status: 'success',
        scene: pattern.scene,
        type: pattern.english,
        size: {
          original: convertResult.inputSize,
          converted: convertResult.outputSize,
          reduction: convertResult.reduction
        },
        dimensions: {
          width: convertResult.width,
          height: convertResult.height
        }
      });
      
      console.log(`   ✅ 변환 완료 (${convertResult.reduction}% 감소)`);
      successCount++;
    } else {
      console.log(`   ❌ 변환 실패: ${convertResult.error}`);
      failCount++;
      results.push({
        original: file.originalName,
        new: newFileName,
        status: 'failed',
        reason: convertResult.error
      });
    }
    
    console.log('');
  }
  
  // 결과 저장
  const resultFile = path.join(outputFolder, 'migration-results.json');
  fs.writeFileSync(resultFile, JSON.stringify({
    customer: CUSTOMER_INFO,
    summary: {
      total: filesToProcess.length,
      success: successCount,
      failed: failCount
    },
    results
  }, null, 2));
  
  console.log('\n📊 마이그레이션 완료!');
  console.log(`   총 ${filesToProcess.length}개 파일`);
  console.log(`   성공: ${successCount}개`);
  console.log(`   실패: ${failCount}개`);
  console.log(`\n📝 결과 파일: ${resultFile}`);
  console.log(`📁 변환된 파일: ${outputFolder}\n`);
}

// 실행
if (require.main === module) {
  migrateCustomerImages().catch(console.error);
}

module.exports = { migrateCustomerImages };
