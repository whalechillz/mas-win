/**
 * 한글 파일명을 영문으로 변환하여 Supabase Storage에 업로드
 */

require('dotenv').config({ path: '.env.local' });

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Supabase 환경 변수가 설정되지 않았습니다.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

/**
 * 한글 파일명을 영문으로 변환하는 매핑
 * 실제 파일명 기준으로 작성
 */
const koreanToEnglishMap = {
  // black-beryl
  '마쓰구_시크릿웨폰_블랙_500.png': 'massgoo-secret-weapon-black-500.png',
  '마쓰구_시크릿웨폰_블랙_500_long.png': 'massgoo-secret-weapon-black-500-long.png',
  '마쓰구_시크릿웨폰_블랙_공홈_01.png': 'massgoo-secret-weapon-black-official-01.png',
  
  // black-weapon
  '마쓰구_시크릿웨폰_블랙_500.png': 'massgoo-secret-weapon-black-500.png',
  '마쓰구_시크릿웨폰_블랙_500_long.png': 'massgoo-secret-weapon-black-500-long.png',
  '마쓰구_시크릿웨폰_블랙_500_long.webp': 'massgoo-secret-weapon-black-500-long.webp',
  '마쓰구_시크릿웨폰_블랙_공홈_00_01.jpg': 'massgoo-secret-weapon-black-official-00-01.jpg',
  '마쓰구_시크릿웨폰_블랙_공홈_01.jpg': 'massgoo-secret-weapon-black-official-01.jpg',
  '마쓰구_시크릿웨폰_블랙_공홈_01.png': 'massgoo-secret-weapon-black-official-01.png',
  '마쓰구_시크릿웨폰_블랙_공홈_02.jpg': 'massgoo-secret-weapon-black-official-02.jpg',
  '마쓰구_시크릿웨폰_블랙_공홈_03.jpg': 'massgoo-secret-weapon-black-official-03.jpg',
  '마쓰구_시크릿웨폰_블랙_공홈_04.jpg': 'massgoo-secret-weapon-black-official-04.jpg',
  '마쓰구_시크릿웨폰_블랙_공홈_05.jpg': 'massgoo-secret-weapon-black-official-05.jpg',
  '마쓰구_시크릿웨폰_블랙_공홈_06.jpg': 'massgoo-secret-weapon-black-official-06.jpg',
  '마쓰구_시크릿웨폰_블랙_공홈_07.jpg': 'massgoo-secret-weapon-black-official-07.jpg',
  '마쓰구_시크릿웨폰_블랙_공홈_08_01.jpg': 'massgoo-secret-weapon-black-official-08-01.jpg',
  
  // gold-weapon4
  '마쓰구_시크릿웨폰_4.1_500.png': 'massgoo-secret-weapon-4-1-500.png',
  '마쓰구_시크릿웨폰_4.1_공홈_00_01.webp': 'massgoo-secret-weapon-4-1-official-00-01.webp',
  '마쓰구_시크릿웨폰_4.1_공홈_01.jpg': 'massgoo-secret-weapon-4-1-official-01.jpg',
  '마쓰구_시크릿웨폰_4.1_공홈_01.webp': 'massgoo-secret-weapon-4-1-official-01.webp',
  '마쓰구_시크릿웨폰_4.1_공홈_02.webp': 'massgoo-secret-weapon-4-1-official-02.webp',
  '마쓰구_시크릿웨폰_4.1_공홈_03.webp': 'massgoo-secret-weapon-4-1-official-03.webp',
  '마쓰구_시크릿웨폰_4.1_공홈_04.webp': 'massgoo-secret-weapon-4-1-official-04.webp',
  '마쓰구_시크릿웨폰_4.1_공홈_05.webp': 'massgoo-secret-weapon-4-1-official-05.webp',
  '마쓰구_시크릿웨폰_4.1_공홈_06.webp': 'massgoo-secret-weapon-4-1-official-06.webp',
  '마쓰구_시크릿웨폰_4.1_공홈_07.webp': 'massgoo-secret-weapon-4-1-official-07.webp',
  '마쓰구_시크릿웨폰_4.1_공홈_08_01.webp': 'massgoo-secret-weapon-4-1-official-08-01.webp',
  
  // gold2
  '마쓰구_시크릿포스_골드_2_350_long.png': 'massgoo-secret-force-gold-2-350-long.png',
  '마쓰구_시크릿포스_골드_2_500.png': 'massgoo-secret-force-gold-2-500.png',
  '마쓰구_시크릿포스_골드_2_공홈_01.png': 'massgoo-secret-force-gold-2-official-01.png',
  
  // gold2-sapphire
  '마쓰구_시크릿포스_골드_2_350_long.png': 'massgoo-secret-force-gold-2-350-long.png',
  '마쓰구_시크릿포스_골드_2_500.png': 'massgoo-secret-force-gold-2-500.png',
  '마쓰구_시크릿포스_골드_2_공홈_01.png': 'massgoo-secret-force-gold-2-official-01.png',
  
  // pro3
  '마쓰구_시크릿포스_PRO_1000.png': 'massgoo-secret-force-pro-1000.png',
  '마쓰구_시크릿포스_PRO_1000.webp': 'massgoo-secret-force-pro-1000.webp',
  '마쓰구_시크릿포스_PRO_350_long.png': 'massgoo-secret-force-pro-350-long.png',
  '마쓰구_시크릿포스_PRO_350_long.webp': 'massgoo-secret-force-pro-350-long.webp',
  '마쓰구_시크릿포스_PRO_3_공홈_00.jpg': 'massgoo-secret-force-pro-3-official-00.jpg',
  '마쓰구_시크릿포스_PRO_3_공홈_01.jpg': 'massgoo-secret-force-pro-3-official-01.jpg',
  '마쓰구_시크릿포스_PRO_3_공홈_02.jpg': 'massgoo-secret-force-pro-3-official-02.jpg',
  '마쓰구_시크릿포스_PRO_3_공홈_03.jpg': 'massgoo-secret-force-pro-3-official-03.jpg',
  '마쓰구_시크릿포스_PRO_3_공홈_04.jpg': 'massgoo-secret-force-pro-3-official-04.jpg',
  '마쓰구_시크릿포스_PRO_3_공홈_05.jpg': 'massgoo-secret-force-pro-3-official-05.jpg',
  '마쓰구_시크릿포스_PRO_3_공홈_06.jpg': 'massgoo-secret-force-pro-3-official-06.jpg',
  '마쓰구_시크릿포스_PRO_3_공홈_07.jpg': 'massgoo-secret-force-pro-3-official-07.jpg',
  '마쓰구_시크릿포스_PRO_3_공홈_08.jpg': 'massgoo-secret-force-pro-3-official-08.jpg',
  '마쓰구_시크릿포스_PRO_500.png': 'massgoo-secret-force-pro-500.png',
  
  // v3
  '마쓰구_시크릿포스_V3_05_00.jpg': 'massgoo-secret-force-v3-05-00.jpg',
  '마쓰구_시크릿포스_V3_350_bg.png': 'massgoo-secret-force-v3-350-bg.png',
  '마쓰구_시크릿포스_V3_350_long.png': 'massgoo-secret-force-v3-350-long.png',
  '마쓰구_시크릿포스_V3_350_long.webp': 'massgoo-secret-force-v3-350-long.webp',
  '마쓰구_시크릿포스_V3_공홈_01.png': 'massgoo-secret-force-v3-official-01.png',
  '마쓰구_시크릿포스_V3_공홈_01.webp': 'massgoo-secret-force-v3-official-01.webp',
  '마쓰구_시크릿포스_V3_공홈_02.jpg': 'massgoo-secret-force-v3-official-02.jpg',
  '마쓰구_시크릿포스_V3_공홈_03.jpg': 'massgoo-secret-force-v3-official-03.jpg',
  '마쓰구_시크릿포스_V3_공홈_04.jpg': 'massgoo-secret-force-v3-official-04.jpg',
  '마쓰구_시크릿포스_V3_공홈_05.jpg': 'massgoo-secret-force-v3-official-05.jpg',
  '마쓰구_시크릿포스_V3_공홈_06.jpg': 'massgoo-secret-force-v3-official-06.jpg',
  '마쓰구_시크릿포스_V3_공홈_07.jpg': 'massgoo-secret-force-v3-official-07.jpg',
  '마쓰구_시크릿포스_V3_공홈_08.jpg': 'massgoo-secret-force-v3-official-08.jpg',
  '마쓰구_시크릿포스_V3_공홈_08.webp': 'massgoo-secret-force-v3-official-08.webp',
};

/**
 * 한글 파일명을 영문으로 변환 (규칙 기반)
 */
function convertKoreanToEnglish(fileName) {
  // 매핑이 있으면 사용
  if (koreanToEnglishMap[fileName]) {
    return koreanToEnglishMap[fileName];
  }
  
  // 확장자 분리
  const ext = path.extname(fileName);
  const nameWithoutExt = fileName.replace(/\.[^.]+$/, '');
  
  // 한글 단어 매핑 (단어 단위로 변환)
  const koreanWordMap = {
    '마쓰구': 'massgoo',
    '시크릿웨폰': 'secret-weapon',
    '시크릿포스': 'secret-force',
    '블랙': 'black',
    '골드': 'gold',
    '공홈': 'official',
    'PRO': 'pro',
    'V3': 'v3',
    '롱': 'long',
    '백': 'bg',
    '베릴': 'beryl',
    '사파이어': 'sapphire',
  };
  
  let english = nameWithoutExt;
  
  // 한글 단어를 영문으로 치환 (긴 단어부터 먼저 매칭)
  const sortedKeys = Object.keys(koreanWordMap).sort((a, b) => b.length - a.length);
  for (const korean of sortedKeys) {
    const englishWord = koreanWordMap[korean];
    // 정규식 이스케이프 처리 (특수문자 이스케이프)
    const escapedKorean = korean.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const beforeReplace = english;
    english = english.replace(new RegExp(escapedKorean, 'g'), englishWord);
    if (beforeReplace !== english) {
      // 치환 발생
    }
  }
  
  // 언더스코어를 하이픈으로 변환
  english = english.replace(/_/g, '-');
  
  // 남은 한글 완전 제거 (가-힣, ㄱ-ㅎ, ㅏ-ㅣ 모두 포함)
  // 유니코드 범위로 한글 제거
  english = english.replace(/[\uAC00-\uD7A3\u3131-\u318E\u1100-\u11FF]/g, '');
  
  // 숫자와 점(.)은 유지하되, 연속된 점은 하이픈으로 변환
  english = english.replace(/\.+/g, '-');
  
  // 정리: 연속된 하이픈 제거, 소문자 변환
  english = english
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase();
  
  // 빈 문자열이면 기본값 사용
  if (!english) {
    english = 'image';
  }
  
  // 확장자 추가
  return english + ext;
}

/**
 * 이미지를 Supabase Storage에 업로드
 */
async function uploadImageToStorage(filePath, storagePath) {
  try {
    const fileBuffer = fs.readFileSync(filePath);
    const ext = path.extname(filePath).toLowerCase();
    
    // WebP로 변환 (PNG, JPG인 경우)
    let finalBuffer = fileBuffer;
    let finalPath = storagePath;
    
    if (ext === '.png' || ext === '.jpg' || ext === '.jpeg') {
      try {
        finalBuffer = await sharp(fileBuffer)
          .webp({ quality: 85 })
          .toBuffer();
        finalPath = storagePath.replace(/\.(png|jpg|jpeg)$/i, '.webp');
      } catch (error) {
        console.warn(`  ⚠️ WebP 변환 실패, 원본 사용: ${error.message}`);
      }
    }
    
    const { data, error } = await supabase.storage
      .from('blog-images')
      .upload(finalPath, finalBuffer, {
        contentType: ext === '.webp' || finalPath.endsWith('.webp') ? 'image/webp' : `image/${ext.slice(1)}`,
        cacheControl: '3600',
        upsert: true // 이미 있으면 덮어쓰기
      });
    
    if (error) {
      console.error(`  ❌ 업로드 실패: ${error.message}`);
      return null;
    }
    
    return finalPath;
  } catch (error) {
    console.error(`  ❌ 처리 실패: ${error.message}`);
    return null;
  }
}

/**
 * 한글 파일명을 가진 파일 찾기
 */
function findKoreanFiles(dir, fileList = []) {
  try {
    const files = fs.readdirSync(dir, { encoding: 'utf8' });
    
    files.forEach(file => {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      
      if (stat.isDirectory()) {
        findKoreanFiles(filePath, fileList);
      } else {
        // 한글 문자 체크 (가-힣, ㄱ-ㅎ, ㅏ-ㅣ 포함)
        const hasKorean = /[가-힣ㄱ-ㅎㅏ-ㅣ]/.test(file);
        if (hasKorean) {
          fileList.push(filePath);
        }
      }
    });
  } catch (error) {
    console.error(`  ❌ 폴더 읽기 실패: ${dir} - ${error.message}`);
  }
  
  return fileList;
}

/**
 * 마이그레이션 실행
 */
async function migrateKoreanFiles() {
  console.log('🔄 한글 파일명 영문 변환 및 업로드 시작...\n');

  const productsDir = path.join(process.cwd(), 'public/main/products');
  
  if (!fs.existsSync(productsDir)) {
    console.error(`❌ 제품 폴더를 찾을 수 없습니다: ${productsDir}`);
    process.exit(1);
  }

  // 드라이버 제품 폴더들
  const driverFolders = [
    'black-beryl',
    'black-weapon',
    'gold-weapon4',
    'gold2',
    'gold2-sapphire',
    'pro3',
    'v3',
  ];

  const conversionMap = new Map(); // 한글 파일명 -> 영문 파일명 매핑 저장

  for (const folderName of driverFolders) {
    const folderPath = path.join(productsDir, folderName);
    if (!fs.existsSync(folderPath)) {
      continue;
    }

    console.log(`📁 ${folderName} 폴더 처리 중...`);
    
    // 직접 파일 목록 읽기
    let allFiles = [];
    try {
      allFiles = fs.readdirSync(folderPath);
    } catch (e) {
      console.log(`  ⚠️  폴더 읽기 실패: ${e.message}\n`);
      continue;
    }
    
    // 한글 파일명 필터링 (유니코드 범위로 체크)
    const koreanFiles = allFiles.filter(file => {
      const filePath = path.join(folderPath, file);
      try {
        const stat = fs.statSync(filePath);
        if (stat.isDirectory()) return false;
        // 한글 문자 체크 (유니코드 범위: 가-힣, ㄱ-ㅎ, ㅏ-ㅣ)
        for (let i = 0; i < file.length; i++) {
          const code = file.charCodeAt(i);
          if ((code >= 0xAC00 && code <= 0xD7A3) || // 가-힣
              (code >= 0x3131 && code <= 0x318E) || // ㄱ-ㅎ, ㅏ-ㅣ
              (code >= 0x1100 && code <= 0x11FF)) { // 자모
            return true;
          }
        }
        return false;
      } catch (e) {
        return false;
      }
    }).map(file => path.join(folderPath, file));
    
    if (koreanFiles.length === 0) {
      console.log(`  ℹ️  한글 파일명 없음 (전체 ${allFiles.length}개 파일)\n`);
      continue;
    }
    
    console.log(`  🔍 한글 파일명 발견: ${koreanFiles.length}개`);
    const storageFolder = `originals/products/${folderName}`;
    
    for (const filePath of koreanFiles) {
      const fileName = path.basename(filePath);
      const englishFileName = convertKoreanToEnglish(fileName);
      
      // 변환 결과 검증
      if (/[가-힣ㄱ-ㅎㅏ-ㅣ]/.test(englishFileName)) {
        console.error(`  ❌ 변환 실패: ${fileName} → ${englishFileName} (한글 남아있음)`);
        continue;
      }
      
      if (englishFileName === fileName) {
        console.log(`  ⚠️  매핑 없음: ${fileName}`);
        continue;
      }
      
      const storagePath = `${storageFolder}/${englishFileName}`;
      const relativePath = path.relative(productsDir, filePath);
      
      console.log(`  📤 ${fileName} → ${englishFileName}`);
      console.log(`     ${relativePath} → ${storagePath}`);
      
      const uploaded = await uploadImageToStorage(filePath, storagePath);
      if (uploaded) {
        console.log(`  ✅ 성공: ${uploaded}`);
        conversionMap.set(relativePath, uploaded);
      }
    }
    console.log(`\n✅ ${folderName} 폴더 완료: ${koreanFiles.length}개 파일 처리\n`);
  }

  // 변환 매핑 저장 (SQL 생성용)
  if (conversionMap.size > 0) {
    const mappingFile = path.join(process.cwd(), 'database/korean-to-english-filename-mapping.json');
    const mapping = Object.fromEntries(conversionMap);
    fs.writeFileSync(mappingFile, JSON.stringify(mapping, null, 2));
    console.log(`\n📝 변환 매핑 저장: ${mappingFile}`);
  }

  console.log('🎉 한글 파일명 변환 및 업로드 완료!');
}

migrateKoreanFiles().catch(console.error);

