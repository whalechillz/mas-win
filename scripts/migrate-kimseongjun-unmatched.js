/**
 * 김성준 고객 이미지 마이그레이션 (DB에 없는 경우)
 * - originals/customers/unmatched/김성준/ 폴더에 저장
 * - 나중에 매칭할 수 있도록 메타데이터에 원본 이름 저장
 */

const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const bucketName = 'blog-images';

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Supabase 환경 변수가 설정되지 않았습니다.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const CUSTOMER_NAME = '김성준';
const LOCAL_FOLDER = '/Users/m2/MASLABS/00.블로그_고객';

// 파일명 패턴 매핑
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

function normalizeKorean(text) {
  return text.normalize('NFC');
}

function extractPattern(fileName, customerName) {
  let nameWithoutExt = fileName.replace(/\.[^/.]+$/, '');
  nameWithoutExt = normalizeKorean(nameWithoutExt);
  nameWithoutExt = nameWithoutExt
    .replace(new RegExp('^' + customerName + '_', 'i'), '')
    .replace(/^_+|_+$/g, '')
    .trim();
  nameWithoutExt = normalizeKorean(nameWithoutExt);
  
  const sortedPatterns = Object.keys(FILENAME_PATTERN_MAP).sort((a, b) => b.length - a.length);
  for (const pattern of sortedPatterns) {
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

function extractNumber(fileName) {
  const match = fileName.match(/(\d{2})/);
  return match ? parseInt(match[1], 10) : 1;
}

function findImageFiles(folderPath, customerName) {
  const imageFiles = [];
  const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp', '.heic', '.heif'];
  if (!fs.existsSync(folderPath)) return imageFiles;
  
  const normalizedCustomerName = normalizeKorean(customerName);
  
  function scanDir(dir) {
    const items = fs.readdirSync(dir);
    for (const item of items) {
      const fullPath = path.join(dir, item);
      try {
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
          if (!item.startsWith('.') && !item.includes('_temp')) {
            scanDir(fullPath);
          }
        } else if (stat.isFile()) {
          const ext = path.extname(item).toLowerCase();
          if (imageExtensions.includes(ext)) {
            const normalizedItem = normalizeKorean(item);
            if (normalizedItem.includes(normalizedCustomerName)) {
              imageFiles.push(fullPath);
            }
          }
        }
      } catch (e) {}
    }
  }
  
  scanDir(folderPath);
  return imageFiles;
}

async function convertToWebP(inputPath, outputPath, quality = 90) {
  try {
    await sharp(inputPath)
      .webp({ quality })
      .toFile(outputPath);
    const inputStats = fs.statSync(inputPath);
    const outputStats = fs.statSync(outputPath);
    return {
      success: true,
      originalSize: inputStats.size,
      convertedSize: outputStats.size
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

async function uploadImage(filePath, storagePath) {
  const fileBuffer = fs.readFileSync(filePath);
  const { data, error } = await supabase.storage
    .from(bucketName)
    .upload(storagePath, fileBuffer, {
      contentType: 'image/webp',
      upsert: true
    });
  if (error) throw error;
  const { data: { publicUrl } } = supabase.storage
    .from(bucketName)
    .getPublicUrl(storagePath);
  return publicUrl;
}

async function saveMetadata(imageData) {
  const metadataPayload = {
    image_url: imageData.url,
    folder_path: imageData.folderPath,
    date_folder: imageData.visitDate,
    source: 'customer',
    channel: 'customer',
    title: `${CUSTOMER_NAME} (미매칭) - ${imageData.visitDate}`,
    alt_text: `${CUSTOMER_NAME} 고객 이미지 (미매칭, ${imageData.visitDate})`,
    file_size: imageData.fileSize,
    tags: ['unmatched-customer', `unmatched-${CUSTOMER_NAME}`, `visit-${imageData.visitDate}`],
    story_scene: imageData.scene,
    image_type: imageData.type,
    original_filename: imageData.originalFileName,
    english_filename: imageData.englishFileName,
    customer_name_en: null, // DB에 없으므로 null
    customer_initials: null,
    image_quality: 'final',
    metadata: {
      unmatchedCustomerName: CUSTOMER_NAME,
      visitDate: imageData.visitDate,
      originalFileName: imageData.originalFileName,
      scene: imageData.scene,
      type: imageData.type,
      note: 'DB에 고객 정보가 없어 unmatched 폴더에 저장됨. 나중에 매칭 필요.'
    }
  };
  
  const { data, error } = await supabase
    .from('image_metadata')
    .upsert(metadataPayload, { onConflict: 'image_url' })
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

async function migrateUnmatchedCustomer() {
  console.log(`🔄 미매칭 고객 이미지 마이그레이션: ${CUSTOMER_NAME}\n`);
  
  // 이미지 파일 찾기
  const imageFiles = findImageFiles(LOCAL_FOLDER, CUSTOMER_NAME);
  console.log(`📸 발견된 이미지: ${imageFiles.length}개\n`);
  
  if (imageFiles.length === 0) {
    console.log('❌ 이미지 파일을 찾을 수 없습니다.');
    return;
  }
  
  const outputDir = path.join(process.cwd(), 'migrated', 'unmatched', CUSTOMER_NAME);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  let successCount = 0;
  let failCount = 0;
  
  for (let i = 0; i < imageFiles.length; i++) {
    const imageFile = imageFiles[i];
    const originalFileName = path.basename(imageFile);
    
    try {
      // 방문일자 추출
      let visitDate = '2023-01-01';
      const pathParts = imageFile.split(path.sep);
      for (const part of pathParts) {
        const dateMatch = part.match(/^(\d{4})\.(\d{1,2})\.(\d{1,2})\./);
        if (dateMatch) {
          const year = dateMatch[1];
          const month = dateMatch[2].padStart(2, '0');
          const day = dateMatch[3].padStart(2, '0');
          visitDate = `${year}-${month}-${day}`;
          break;
        }
        if (/^\d{4}$/.test(part) && parseInt(part) >= 2020 && parseInt(part) <= 2030) {
          visitDate = `${part}-01-01`;
        }
      }
      
      // 패턴 추출
      const pattern = extractPattern(originalFileName, CUSTOMER_NAME);
      const number = extractNumber(originalFileName) || (i + 1);
      
      // 새 파일명 생성
      const scene = pattern?.scene || 1;
      const type = pattern?.english || 'unknown';
      const newFileName = `unmatched_s${scene}_${type}_${String(number).padStart(2, '0')}.webp`;
      
      // WebP 변환
      const outputPath = path.join(outputDir, visitDate, newFileName);
      fs.mkdirSync(path.dirname(outputPath), { recursive: true });
      
      const convertResult = await convertToWebP(imageFile, outputPath);
      if (!convertResult.success) {
        throw new Error(`WebP 변환 실패: ${convertResult.error}`);
      }
      
      // Supabase Storage 경로 (이니셜 사용)
      // 김성준 -> kss
      const initials = 'kss'; // 김성준 이니셜
      const folderPath = `originals/customers/unmatched/${initials}/${visitDate}`;
      const storagePath = `${folderPath}/${newFileName}`;
      
      // 업로드
      const url = await uploadImage(outputPath, storagePath);
      
      // 메타데이터 저장
      await saveMetadata({
        originalFileName,
        englishFileName: newFileName,
        url,
        folderPath,
        visitDate,
        scene,
        type,
        fileSize: convertResult.convertedSize
      });
      
      successCount++;
      console.log(`   ✅ ${i + 1}/${imageFiles.length}: ${newFileName}`);
      
    } catch (error) {
      failCount++;
      console.error(`   ❌ 업로드 실패: ${originalFileName} - ${error.message}`);
    }
  }
  
  console.log(`\n${'='.repeat(60)}`);
  console.log('📊 마이그레이션 완료!');
  console.log('='.repeat(60));
  console.log(`총 이미지: ${imageFiles.length}개`);
  console.log(`성공: ${successCount}개`);
  console.log(`실패: ${failCount}개`);
  console.log(`\n저장 위치: originals/customers/unmatched/kss/`);
  console.log(`나중에 고객 정보를 찾으면 매칭할 수 있습니다.`);
}

if (require.main === module) {
  migrateUnmatchedCustomer().catch(console.error);
}

module.exports = { migrateUnmatchedCustomer };
