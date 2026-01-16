/**
 * 2022년, 2023년 누락된 이미지/영상 찾기 및 마이그레이션
 */

const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const { createClient } = require('@supabase/supabase-js');
const { translateKoreanToEnglish } = require('../lib/korean-to-english-translator');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const bucketName = 'blog-images';

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Supabase 환경 변수가 설정되지 않았습니다.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const LOCAL_FOLDER = '/Users/m2/MASLABS/00.블로그_고객';

// migrate-all-customers.js에서 필요한 함수들 가져오기
function normalizeKorean(text) {
  return text.normalize('NFC');
}

function getCustomerInitials(name) {
  const nameEn = translateKoreanToEnglish(name);
  if (!nameEn) return 'unknown';
  
  const parts = nameEn.split('-');
  if (parts.length >= 2) {
    return (parts[0].charAt(0) + parts[1].charAt(0)).toLowerCase();
  }
  return nameEn.substring(0, 2).toLowerCase();
}

const FILENAME_PATTERN_MAP = {
  '히어로': 'hero',
  '아트월': 'art-wall',
  '시타상담': 'swing-consultation',
  '측정': 'measurement',
  '시타장면': 'swing-scene',
  '시타영상_편집': 'swing-video-edited',
  '사인': 'signature',
  '스윙장면': 'swing-scene-outdoor',
  '스윙영상': 'swing-video-outdoor',
  '후기캡처_카카오채널': 'review-capture-kakao-channel',
  '후기캡처_카카오톡': 'review-capture-kakao-talk',
  '후기캡처_네이버스마트스토어': 'review-capture-naver-smartstore',
  '후기캡처_문자': 'review-capture-sms',
  '시타영상': 'swing-video',
};

const STORY_SCENE_MAP = {
  '히어로': 1,
  '아트월': 5,
  '시타상담': 4,
  '측정': 4,
  '시타장면': 3,
  '시타영상_편집': 3,
  '사인': 6,
  '스윙장면': 6,
  '스윙영상': 6,
  '후기캡처_카카오채널': 7,
  '후기캡처_카카오톡': 7,
  '후기캡처_네이버스마트스토어': 7,
  '후기캡처_문자': 7,
  '시타영상': 3,
};

function extractPattern(fileName, customerName) {
  let nameWithoutExt = path.basename(fileName, path.extname(fileName));
  nameWithoutExt = nameWithoutExt.normalize('NFC');
  
  // _ok 제거
  nameWithoutExt = nameWithoutExt.replace(/_ok/g, '');
  
  // 고객 이름 제거
  const normalizedCustomerName = normalizeKorean(customerName);
  const customerNameEn = translateKoreanToEnglish(customerName).toLowerCase();
  
  nameWithoutExt = nameWithoutExt.replace(new RegExp(`^${normalizedCustomerName}_`, 'i'), '');
  nameWithoutExt = nameWithoutExt.replace(new RegExp(`^${customerNameEn}_`, 'i'), '');
  
  // 패턴 찾기
  for (const [pattern, english] of Object.entries(FILENAME_PATTERN_MAP)) {
    if (nameWithoutExt.includes(pattern)) {
      return {
        pattern,
        english,
        scene: STORY_SCENE_MAP[pattern] || STORY_SCENE_MAP[pattern.split('_')[0]] || 1
      };
    }
  }
  
  return null;
}

function extractNumber(fileName) {
  const match = fileName.match(/(\d{2})/);
  return match ? parseInt(match[1], 10) : null;
}

function generateNewFileName(originalFileName, customerName, index) {
  let cleanedFileName = originalFileName.replace(/_ok/g, '');
  const ext = path.extname(originalFileName).toLowerCase();
  const pattern = extractPattern(cleanedFileName, customerName);
  
  if (!pattern) {
    return null;
  }
  
  const number = extractNumber(cleanedFileName) || index;
  const initials = getCustomerInitials(customerName);
  
  const finalInitials = initials && initials !== 'unknown' ? initials : 'cus';
  
  // 동영상 파일은 원본 확장자 유지
  if (['.mp4', '.mov', '.avi', '.mkv', '.webm'].includes(ext)) {
    return `${finalInitials}_s${pattern.scene}_${pattern.english}_${String(number).padStart(2, '0')}${ext}`;
  }
  
  // 이미지 파일은 WebP로 변환
  return `${finalInitials}_s${pattern.scene}_${pattern.english}_${String(number).padStart(2, '0')}.webp`;
}

function findImageFiles(folderPath, customerName, year) {
  const imageFiles = [];
  const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp', '.heic', '.heif', '.pdf'];
  const videoExtensions = ['.mp4', '.mov', '.avi', '.mkv', '.webm'];
  const allExtensions = [...imageExtensions, ...videoExtensions];
  
  if (!fs.existsSync(folderPath)) {
    return imageFiles;
  }
  
  const normalizedCustomerName = normalizeKorean(customerName);
  const customerNameEn = translateKoreanToEnglish(customerName).toLowerCase();
  
  function scanDir(dir) {
    const items = fs.readdirSync(dir);
    
    for (const item of items) {
      const fullPath = path.join(dir, item);
      
      try {
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory()) {
          // 연도별 폴더 구조 확인
          if (item.startsWith(`${year}.`)) {
            const parts = item.split('.');
            if (parts.length >= 4) {
              const folderCustomerName = parts.slice(3).join('.');
              const normalizedFolderName = normalizeKorean(folderCustomerName);
              
              if (normalizedFolderName === normalizedCustomerName) {
                scanDir(fullPath);
              }
            }
          } else if (item === year.toString()) {
            scanDir(fullPath);
          } else if (!item.startsWith('.') && !item.includes('_temp')) {
            scanDir(fullPath);
          }
        } else if (stat.isFile()) {
          const ext = path.extname(item).toLowerCase();
          if (allExtensions.includes(ext)) {
            const normalizedItem = normalizeKorean(item);
            
            if (normalizedItem.startsWith(normalizedCustomerName + '_') ||
                normalizedItem.startsWith(customerNameEn + '_') ||
                normalizedItem.includes('_' + normalizedCustomerName + '_') ||
                normalizedItem.includes('_' + customerNameEn + '_')) {
              imageFiles.push(fullPath);
            }
          }
        }
      } catch (e) {
        // 무시
      }
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
    return {
      success: false,
      error: error.message
    };
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
  
  if (error) {
    throw error;
  }
  
  const { data: { publicUrl } } = supabase.storage
    .from(bucketName)
    .getPublicUrl(storagePath);
  
  return publicUrl;
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

const NAME_MAPPING = {
  '조사장': '조성대',
  '김한구h': '김한구',
  'VIP5458': '하종천',
  '강병구': '강병부',
  'VIP8385': '송화용',
};

async function findCustomerId(customerName, phone = null) {
  // 이름 매핑 확인
  const dbName = NAME_MAPPING[customerName] || customerName;
  
  // 전화번호가 있으면 이름+전화번호로 찾기
  if (phone) {
    const { data, error } = await supabase
      .from('customers')
      .select('id, name, phone')
      .eq('name', dbName)
      .eq('phone', phone)
      .single();
    
    if (!error && data) {
      return { id: data.id, phone: data.phone, isDuplicate: false, dbName: data.name };
    }
  }
  
  // 이름만으로 찾기 (이니셜과 영문 이름도 함께 가져오기)
  const { data, error } = await supabase
    .from('customers')
    .select('id, name, phone, name_en, initials')
    .eq('name', dbName)
    .order('updated_at', { ascending: false })
    .limit(1)
    .single();
  
  if (error || !data) {
    return null;
  }
  
  // 중복 확인
  const { count } = await supabase
    .from('customers')
    .select('*', { count: 'exact', head: true })
    .eq('name', dbName);
  
  return {
    id: data.id,
    phone: data.phone,
    isDuplicate: count > 1,
    dbName: data.name
  };
}

async function getUploadedFiles(customerId, year) {
  const { data, error } = await supabase
    .from('image_metadata')
    .select('english_filename, original_filename, date_folder')
    .contains('tags', [`customer-${customerId}`])
    .like('date_folder', `${year}%`);
  
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

async function saveMetadata(imageData) {
  const payload = {
    file_name: imageData.englishFileName,
    image_url: imageData.url,
    folder_path: imageData.folderPath,
    date_folder: imageData.visitDate,
    source: 'customer',
    channel: 'customer',
    title: `${imageData.customerName} - ${imageData.visitDate}`,
    alt_text: `${imageData.customerName} 고객 이미지 (${imageData.visitDate})`,
    file_size: imageData.fileSize,
    tags: [`customer-${imageData.customerId}`, `visit-${imageData.visitDate}`],
    story_scene: imageData.scene,
    image_type: imageData.type,
    original_filename: imageData.originalFileName,
    english_filename: imageData.englishFileName,
    customer_name_en: imageData.customerNameEn,
    customer_initials: imageData.customerInitials,
    image_quality: 'final',
    metadata: {
      visitDate: imageData.visitDate,
      customerName: imageData.customerName,
      customerPhone: imageData.customerPhone
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

async function migrateMissingFiles() {
  console.log('🔄 2022년, 2023년 누락된 이미지/영상 찾기 및 마이그레이션 시작...\n');
  
  const years = ['2022', '2023'];
  let totalFound = 0;
  let totalUploaded = 0;
  let totalSkipped = 0;
  
  for (const year of years) {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`${year}년 처리 시작`);
    console.log(`${'='.repeat(60)}\n`);
    
    const yearFolder = path.join(LOCAL_FOLDER, year);
    if (!fs.existsSync(yearFolder)) {
      console.log(`⚠️  ${year}년 폴더가 없습니다: ${yearFolder}`);
      continue;
    }
    
    // 고객 폴더 찾기
    const items = fs.readdirSync(yearFolder);
    const customerFolders = items.filter(item => {
      const fullPath = path.join(yearFolder, item);
      return fs.statSync(fullPath).isDirectory() && item.includes('.');
    });
    
    for (const folderItem of customerFolders) {
      // YYYY.MM.DD.고객이름 형식 파싱
      const match = folderItem.match(/^(\d{4})\.(\d{1,2})\.(\d{1,2})\.(.+)$/);
      if (!match) continue;
      
      const folderYear = match[1];
      const month = match[2].padStart(2, '0');
      const day = match[3].padStart(2, '0');
      const customerName = match[4].split('-')[0].split('(')[0].trim();
      
      if (folderYear !== year) continue;
      
      console.log(`\n📋 고객: ${customerName} (${year}.${month}.${day})`);
      
      // 고객 ID 찾기
      const customerResult = await findCustomerId(customerName);
      if (!customerResult) {
        console.log(`   ⏭️  DB에 고객이 없어 스킵: ${customerName}`);
        continue;
      }
      
      const customerId = customerResult.id;
      const customerPhone = customerResult.phone;
      
      // 이미 업로드된 파일 목록 가져오기
      const uploadedFiles = await getUploadedFiles(customerId, year);
      console.log(`   📊 이미 업로드된 파일: ${uploadedFiles.size}개`);
      
      // 로컬 파일 찾기
      const localFiles = findImageFiles(LOCAL_FOLDER, customerName, year);
      console.log(`   📸 로컬 파일: ${localFiles.length}개`);
      
      if (localFiles.length === 0) {
        continue;
      }
      
      const customerNameEn = translateKoreanToEnglish(customerName);
      const initials = getCustomerInitials(customerName);
      const folderName = customerPhone 
        ? `${customerNameEn}-${customerPhone.replace(/-/g, '').slice(-4)}`
        : `${customerNameEn}-${String(customerId).padStart(4, '0')}`;
      
      const visitDate = `${year}-${month}-${day}`;
      const outputDir = path.join(process.cwd(), 'migrated', folderName, visitDate);
      fs.mkdirSync(outputDir, { recursive: true });
      
      let uploadedCount = 0;
      let skippedCount = 0;
      
      for (let i = 0; i < localFiles.length; i++) {
        const localFile = localFiles[i];
        const originalFileName = path.basename(localFile);
        const ext = path.extname(originalFileName).toLowerCase();
        
        // 새 파일명 생성
        const newFileName = generateNewFileName(originalFileName, customerName, i + 1);
        if (!newFileName) {
          console.log(`   ⚠️  패턴을 찾을 수 없어 스킵: ${originalFileName}`);
          skippedCount++;
          continue;
        }
        
        // 이미 업로드된 파일인지 확인
        if (uploadedFiles.has(newFileName) || uploadedFiles.has(originalFileName)) {
          skippedCount++;
          continue;
        }
        
        try {
          let outputPath;
          let contentType;
          let fileSize;
          
          // 동영상 파일 처리
          if (['.mp4', '.mov', '.avi', '.mkv', '.webm'].includes(ext)) {
            outputPath = path.join(outputDir, newFileName);
            fs.copyFileSync(localFile, outputPath);
            contentType = `video/${ext.slice(1)}`;
            const stats = fs.statSync(outputPath);
            fileSize = stats.size;
          } else {
            // 이미지 파일 처리
            outputPath = path.join(outputDir, newFileName);
            const convertResult = await convertToWebP(localFile, outputPath);
            if (!convertResult.success) {
              throw new Error(`WebP 변환 실패: ${convertResult.error}`);
            }
            contentType = 'image/webp';
            fileSize = convertResult.convertedSize;
          }
          
          // Supabase Storage 경로
          const storagePath = `originals/customers/${folderName}/${visitDate}/${newFileName}`;
          
          // 업로드
          let url;
          if (['.mp4', '.mov', '.avi', '.mkv', '.webm'].includes(ext)) {
            url = await uploadFile(outputPath, storagePath, contentType);
          } else {
            url = await uploadImage(outputPath, storagePath);
          }
          
          // 패턴 추출
          const pattern = extractPattern(originalFileName, customerName);
          
          // 메타데이터 저장
          await saveMetadata({
            customerId,
            customerName,
            customerNameEn,
            customerInitials: initials,
            customerPhone,
            originalFileName,
            englishFileName: newFileName,
            url,
            folderPath: `originals/customers/${folderName}/${visitDate}`,
            visitDate,
            scene: pattern?.scene || 1,
            type: pattern?.english || 'unknown',
            fileSize
          });
          
          console.log(`   ✅ ${uploadedCount + 1}/${localFiles.length}: ${newFileName}`);
          uploadedCount++;
          totalUploaded++;
        } catch (error) {
          console.error(`   ❌ 실패: ${originalFileName} - ${error.message}`);
        }
      }
      
      console.log(`   📊 완료: 업로드 ${uploadedCount}개, 스킵 ${skippedCount}개`);
      totalFound += localFiles.length;
      totalSkipped += skippedCount;
    }
  }
  
  console.log(`\n${'='.repeat(60)}`);
  console.log(`📊 전체 마이그레이션 완료!`);
  console.log(`${'='.repeat(60)}`);
  console.log(`총 발견된 파일: ${totalFound}개`);
  console.log(`새로 업로드: ${totalUploaded}개`);
  console.log(`스킵 (이미 업로드됨): ${totalSkipped}개`);
}

if (require.main === module) {
  migrateMissingFiles().catch(console.error);
}
