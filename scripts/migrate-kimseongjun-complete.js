/**
 * 김성준 고객 이미지 완전 마이그레이션
 * - PDF 삭제, PNG -> WebP 변환
 * - 영상 파일 포함
 * - 파일명: unmatched -> kss 변경
 * - 1:1 파일 점검
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
const CUSTOMER_NAME_EN = 'kss';
const CUSTOMER_INITIALS = 'kss';
const LOCAL_FOLDER = '/Users/m2/MASLABS/00.블로그_고객/2023/2023.10.24.김성준-고객정보없음';
const VISIT_DATE = '2023-10-24';
const STORAGE_FOLDER = `originals/customers/unmatched/${CUSTOMER_NAME_EN}/${VISIT_DATE}`;

// 파일명 패턴 매핑
const FILENAME_PATTERN_MAP = {
  '사인': 'signature',
  '시타상담': 'swing-consultation',
  '시타영상': 'swing-video',
  '시타장면': 'swing-scene',
  '아트월': 'art-wall',
};

const STORY_SCENE_MAP = {
  '사인': 6,
  '시타상담': 4,
  '시타영상': 3,
  '시타장면': 3,
  '아트월': 5,
};

function normalizeKorean(text) {
  return text.normalize('NFC');
}

function extractPattern(fileName, customerName) {
  let nameWithoutExt = path.basename(fileName, path.extname(fileName));
  nameWithoutExt = nameWithoutExt.normalize('NFC');
  
  // 고객 이름 제거
  const normalizedCustomerName = normalizeKorean(customerName);
  nameWithoutExt = nameWithoutExt.replace(new RegExp(`^${normalizedCustomerName}_`, 'i'), '');
  
  // 패턴 찾기
  for (const [pattern, english] of Object.entries(FILENAME_PATTERN_MAP)) {
    if (nameWithoutExt.includes(pattern)) {
      return {
        pattern,
        english,
        scene: STORY_SCENE_MAP[pattern] || 1
      };
    }
  }
  
  return null;
}

function extractNumber(fileName) {
  const match = fileName.match(/(\d{2})/);
  return match ? parseInt(match[1], 10) : null;
}

function generateNewFileName(originalFileName, index) {
  let cleanedFileName = originalFileName.replace(/_ok/g, '');
  const ext = path.extname(originalFileName).toLowerCase();
  const pattern = extractPattern(cleanedFileName, CUSTOMER_NAME);
  
  if (!pattern) {
    return null;
  }
  
  const number = extractNumber(cleanedFileName) || index;
  
  // 동영상 파일은 원본 확장자 유지
  if (['.mp4', '.mov', '.avi', '.mkv', '.webm'].includes(ext)) {
    return `${CUSTOMER_INITIALS}_s${pattern.scene}_${pattern.english}_${String(number).padStart(2, '0')}${ext}`;
  }
  
  // 이미지 파일은 WebP로 변환
  return `${CUSTOMER_INITIALS}_s${pattern.scene}_${pattern.english}_${String(number).padStart(2, '0')}.webp`;
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
    return {
      success: false,
      error: error.message
    };
  }
}

async function uploadFile(filePath, storagePath, contentType) {
  const fileBuffer = fs.readFileSync(filePath);
  const { data, error } = await supabase.storage
    .from(bucketName)
    .upload(storagePath, fileBuffer, {
      contentType,
      upsert: true
    });
  
  if (error) {
    throw error;
  }
  
  const { data: { publicUrl } } = supabase.storage
    .from(bucketName)
    .getPublicUrl(storagePath);
  
  return publicUrl;
}

async function saveMetadata(imageData) {
  const payload = {
    image_url: imageData.url,
    folder_path: imageData.folderPath,
    date_folder: imageData.visitDate,
    source: 'customer',
    channel: 'customer',
    title: `${CUSTOMER_NAME} - ${imageData.visitDate}`,
    alt_text: `${CUSTOMER_NAME} 고객 이미지 (${imageData.visitDate})`,
    file_size: imageData.fileSize,
    tags: [`unmatched-customer`, `unmatched-${CUSTOMER_NAME}`, `visit-${imageData.visitDate}`],
    story_scene: imageData.scene,
    image_type: imageData.type,
    original_filename: imageData.originalFileName,
    english_filename: imageData.englishFileName,
    customer_name_en: CUSTOMER_NAME_EN,
    customer_initials: CUSTOMER_INITIALS,
    image_quality: 'final',
    metadata: {
      visitDate: imageData.visitDate,
      customerName: CUSTOMER_NAME,
      folderName: `unmatched/${CUSTOMER_NAME_EN}`
    }
  };
  
  const { data, error } = await supabase
    .from('image_metadata')
    .upsert(payload, { onConflict: 'image_url' })
    .select()
    .single();
  
  if (error) {
    throw error;
  }
  
  return data;
}

async function getUploadedFiles() {
  const { data, error } = await supabase
    .from('image_metadata')
    .select('english_filename, original_filename')
    .eq('customer_name_en', CUSTOMER_NAME_EN)
    .like('date_folder', `${VISIT_DATE}%`);
  
  if (error) {
    console.error('업로드된 파일 조회 오류:', error);
    return new Set();
  }
  
  const uploadedFiles = new Set();
  if (data) {
    data.forEach(img => {
      if (img.english_filename) {
        uploadedFiles.add(img.english_filename);
      }
      if (img.original_filename) {
        uploadedFiles.add(img.original_filename);
      }
    });
  }
  
  return uploadedFiles;
}

async function migrateKimSeongJun() {
  console.log('🔄 김성준 고객 이미지 완전 마이그레이션 시작...\n');
  console.log(`📁 로컬 폴더: ${LOCAL_FOLDER}`);
  console.log(`📁 Supabase 폴더: ${STORAGE_FOLDER}\n`);
  
  if (!fs.existsSync(LOCAL_FOLDER)) {
    console.error(`❌ 로컬 폴더가 없습니다: ${LOCAL_FOLDER}`);
    return;
  }
  
  // 이미 업로드된 파일 확인
  const uploadedFiles = await getUploadedFiles();
  console.log(`📊 이미 업로드된 파일: ${uploadedFiles.size}개\n`);
  
  // 로컬 파일 목록
  const files = fs.readdirSync(LOCAL_FOLDER)
    .map(f => path.join(LOCAL_FOLDER, f))
    .filter(f => {
      const stat = fs.statSync(f);
      return stat.isFile();
    });
  
  console.log(`📸 로컬 파일 목록 (${files.length}개):`);
  files.forEach((f, i) => {
    const fileName = path.basename(f);
    const ext = path.extname(fileName).toLowerCase();
    const size = (fs.statSync(f).size / 1024 / 1024).toFixed(2);
    console.log(`   ${i + 1}. ${fileName} (${ext}, ${size}MB)`);
  });
  console.log('');
  
  const outputDir = path.join(process.cwd(), 'migrated', 'unmatched', CUSTOMER_NAME_EN, VISIT_DATE);
  fs.mkdirSync(outputDir, { recursive: true });
  
  let successCount = 0;
  let failCount = 0;
  let skipCount = 0;
  let pdfDeletedCount = 0;
  
  for (let i = 0; i < files.length; i++) {
    const filePath = files[i];
    const originalFileName = path.basename(filePath);
    const ext = path.extname(originalFileName).toLowerCase();
    
    console.log(`\n[${i + 1}/${files.length}] ${originalFileName}`);
    
    // PDF 파일 삭제
    if (ext === '.pdf') {
      console.log(`   🗑️  PDF 파일 삭제: ${originalFileName}`);
      try {
        fs.unlinkSync(filePath);
        pdfDeletedCount++;
        console.log(`   ✅ 삭제 완료`);
      } catch (error) {
        console.error(`   ❌ 삭제 실패: ${error.message}`);
        failCount++;
      }
      continue;
    }
    
    // 새 파일명 생성
    const newFileName = generateNewFileName(originalFileName, i + 1);
    if (!newFileName) {
      console.log(`   ⚠️  패턴을 찾을 수 없어 스킵: ${originalFileName}`);
      skipCount++;
      continue;
    }
    
    // 이미 업로드된 파일인지 확인
    if (uploadedFiles.has(newFileName) || uploadedFiles.has(originalFileName)) {
      console.log(`   ⏭️  이미 업로드됨: ${newFileName}`);
      skipCount++;
      continue;
    }
    
    try {
      let outputPath;
      let contentType;
      let fileSize;
      
      // 동영상 파일 처리
      if (['.mp4', '.mov', '.avi', '.mkv', '.webm'].includes(ext)) {
        outputPath = path.join(outputDir, newFileName);
        fs.copyFileSync(filePath, outputPath);
        contentType = `video/${ext.slice(1)}`;
        const stats = fs.statSync(outputPath);
        fileSize = stats.size;
        console.log(`   📹 동영상 복사: ${newFileName}`);
      } 
      // PNG 파일 처리 (WebP로 변환)
      else if (ext === '.png') {
        outputPath = path.join(outputDir, newFileName);
        const convertResult = await convertToWebP(filePath, outputPath);
        if (!convertResult.success) {
          throw new Error(`WebP 변환 실패: ${convertResult.error}`);
        }
        contentType = 'image/webp';
        fileSize = convertResult.convertedSize;
        console.log(`   🖼️  PNG -> WebP 변환: ${newFileName}`);
      }
      // 기타 이미지 파일 처리 (WebP로 변환)
      else if (['.jpg', '.jpeg', '.gif', '.bmp', '.webp', '.heic', '.heif'].includes(ext)) {
        outputPath = path.join(outputDir, newFileName);
        const convertResult = await convertToWebP(filePath, outputPath);
        if (!convertResult.success) {
          throw new Error(`WebP 변환 실패: ${convertResult.error}`);
        }
        contentType = 'image/webp';
        fileSize = convertResult.convertedSize;
        console.log(`   🖼️  이미지 -> WebP 변환: ${newFileName}`);
      } else {
        console.log(`   ⚠️  지원하지 않는 파일 형식: ${ext}`);
        skipCount++;
        continue;
      }
      
      // Supabase Storage 경로
      const storagePath = `${STORAGE_FOLDER}/${newFileName}`;
      
      // 업로드
      let url;
      if (['.mp4', '.mov', '.avi', '.mkv', '.webm'].includes(ext)) {
        url = await uploadFile(outputPath, storagePath, contentType);
      } else {
        url = await uploadFile(outputPath, storagePath, contentType);
      }
      
      // 패턴 추출
      const pattern = extractPattern(originalFileName, CUSTOMER_NAME);
      
      // 메타데이터 저장
      await saveMetadata({
        originalFileName,
        englishFileName: newFileName,
        url,
        folderPath: STORAGE_FOLDER,
        visitDate: VISIT_DATE,
        scene: pattern?.scene || 1,
        type: pattern?.english || 'unknown',
        fileSize
      });
      
      console.log(`   ✅ 업로드 완료: ${newFileName}`);
      successCount++;
    } catch (error) {
      console.error(`   ❌ 실패: ${originalFileName} - ${error.message}`);
      failCount++;
    }
  }
  
  console.log(`\n${'='.repeat(60)}`);
  console.log(`📊 마이그레이션 완료!`);
  console.log(`${'='.repeat(60)}`);
  console.log(`총 파일: ${files.length}개`);
  console.log(`✅ 성공: ${successCount}개`);
  console.log(`⏭️  스킵: ${skipCount}개`);
  console.log(`🗑️  PDF 삭제: ${pdfDeletedCount}개`);
  console.log(`❌ 실패: ${failCount}개`);
}

if (require.main === module) {
  migrateKimSeongJun().catch(console.error);
}
