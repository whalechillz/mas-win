/**
 * 언매칭 고객 이미지 마이그레이션 스크립트
 * - 2024년: 김수환, 유재영 (유재형->유재영)
 * - 2025년: 이희익, 이주동 (아주동->이주동), 장가반 (장선필->장가반), 블러거 (unmatched)
 * - PDF -> WebP 변환
 * - 동영상 이름 변경
 */

const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const pdf = require('pdf-poppler');
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

const LOCAL_FOLDER = '/Users/m2/MASLABS/00.블로그_고객';

// 고객 정보 매핑
const CUSTOMER_MAPPING = {
  // 2024년
  '김수환': {
    year: '2024',
    dbName: '김수환', // 공백 제거된 이름
    localName: '김수환', // 로컬 폴더 이름 (공백 포함 가능)
    isUnmatched: false, // DB에 있음
  },
  '유재영': {
    year: '2024',
    dbName: '유재영',
    localName: '유재영', // 로컬 폴더도 유재영 (이미 수정됨)
    isUnmatched: false,
  },
  // 2025년
  '이희익': {
    year: '2025',
    dbName: '이희익',
    localName: '이희익',
    isUnmatched: false,
  },
  '이주동': {
    year: '2025',
    dbName: '이주동',
    localName: '이주동', // 로컬 폴더도 이주동 (이미 수정됨)
    isUnmatched: false,
  },
  '장가반': {
    year: '2025',
    dbName: '장가반',
    localName: '장가반', // 로컬 폴더도 장가반 (이미 수정됨)
    isUnmatched: false,
  },
  '블러거': {
    year: '2025',
    dbName: null, // DB에 없음
    localName: '블러거',
    isUnmatched: true, // unmatched 폴더에 저장
    initials: 'blogger', // 이니셜
  },
};

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
  return text ? text.normalize('NFC') : '';
}

function translateKoreanToEnglish(text) {
  if (!text || typeof text !== 'string') return '';
  
  const koreanToEnglishMap = {
    '김수환': 'kim-suhwan',
    '유재영': 'yu-jae-young',
    '유재형': 'yu-jae-young',
    '이희익': 'lee-hee-ik',
    '이주동': 'lee-ju-dong',
    '아주동': 'lee-ju-dong',
    '장가반': 'jang-ga-ban',
    '장선필': 'jang-ga-ban',
    '블러거': 'blogger',
  };
  
  return koreanToEnglishMap[text] || text.toLowerCase().replace(/[^a-z0-9]/g, '-');
}

function getCustomerInitials(name) {
  if (!name) return 'unknown';
  
  const nameEn = translateKoreanToEnglish(name);
  if (nameEn && nameEn.includes('-')) {
    const parts = nameEn.split('-');
    return parts.map(p => p.charAt(0)).join('').toLowerCase();
  }
  
  return nameEn.charAt(0).toLowerCase() || 'unknown';
}

function extractPattern(fileName, customerName) {
  let nameWithoutExt = fileName.replace(/\.[^/.]+$/, '');
  nameWithoutExt = normalizeKorean(nameWithoutExt);
  
  // 고객 이름 제거 (한글, 영문 모두)
  const customerNameKr = customerName;
  const customerNameEn = translateKoreanToEnglish(customerName);
  
  nameWithoutExt = nameWithoutExt
    .replace(new RegExp('^' + customerNameKr.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '_', 'i'), '')
    .replace(new RegExp('^' + customerNameEn.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '_', 'i'), '')
    .replace(/^_+|_+$/g, '')
    .replace(/_ok/g, '')
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
  return match ? parseInt(match[1], 10) : null;
}

/**
 * 모든 파일 찾기 (이미지, PDF, 동영상)
 */
function findCustomerFiles(folderPath, customerName) {
  const files = [];
  const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp', '.heic', '.heif'];
  const videoExtensions = ['.mp4', '.mov', '.avi', '.mkv', '.webm'];
  const pdfExtensions = ['.pdf'];
  
  if (!fs.existsSync(folderPath)) return files;
  
  const normalizedCustomerName = normalizeKorean(customerName);
  
  function scanDir(dir) {
    if (!fs.existsSync(dir)) return;
    
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
          const normalizedItem = normalizeKorean(item);
          
          // 고객 이름이 포함된 파일만
          if (normalizedItem.includes(normalizedCustomerName) || 
              item.includes(customerName)) {
            if (imageExtensions.includes(ext) || 
                pdfExtensions.includes(ext) || 
                videoExtensions.includes(ext)) {
              files.push(fullPath);
            }
          }
        }
      } catch (e) {
        // 무시
      }
    }
  }
  
  scanDir(folderPath);
  return files;
}

/**
 * PDF를 WebP로 변환 (첫 페이지만)
 */
async function convertPDFToWebP(inputPath, outputPath, quality = 90) {
  try {
    // pdf-poppler를 사용하여 PDF의 첫 페이지를 PNG로 변환
    const options = {
      format: 'png',
      out_dir: path.dirname(outputPath),
      out_prefix: path.basename(outputPath, path.extname(outputPath)),
      page: 1, // 첫 페이지만
    };
    
    await pdf.convert(inputPath, options);
    
    // 변환된 PNG 파일 경로
    const pngPath = path.join(
      path.dirname(outputPath),
      `${options.out_prefix}-1.png`
    );
    
    if (!fs.existsSync(pngPath)) {
      throw new Error('PDF 변환 후 PNG 파일을 찾을 수 없습니다.');
    }
    
    // PNG를 WebP로 변환
    await sharp(pngPath)
      .webp({ quality })
      .toFile(outputPath);
    
    // 임시 PNG 파일 삭제
    if (fs.existsSync(pngPath)) {
      fs.unlinkSync(pngPath);
    }
    
    const inputStats = fs.statSync(inputPath);
    const outputStats = fs.statSync(outputPath);
    
    return {
      success: true,
      originalSize: inputStats.size,
      convertedSize: outputStats.size
    };
  } catch (error) {
    // PDF 변환이 실패하면 원본 PDF를 그대로 복사 (WebP 변환 없이)
    try {
      const pdfPath = outputPath.replace('.webp', '.pdf');
      fs.copyFileSync(inputPath, pdfPath);
      const inputStats = fs.statSync(inputPath);
      return {
        success: true,
        originalSize: inputStats.size,
        convertedSize: inputStats.size,
        isPDF: true // PDF로 저장됨을 표시
      };
    } catch (copyError) {
      return { success: false, error: `PDF 변환 및 복사 실패: ${error.message}` };
    }
  }
}

/**
 * 이미지를 WebP로 변환
 */
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

/**
 * 동영상 이름 변경 (영문으로)
 */
function generateVideoFileName(originalFileName, customerName, index) {
  const pattern = extractPattern(originalFileName, customerName);
  const number = extractNumber(originalFileName) || index;
  const initials = getCustomerInitials(customerName);
  
  const type = pattern?.english || 'video';
  const ext = path.extname(originalFileName).toLowerCase();
  
  return `${initials}_s${pattern?.scene || 1}_${type}_${String(number).padStart(2, '0')}${ext}`;
}

/**
 * Supabase에 업로드
 */
async function uploadFile(filePath, storagePath, contentType) {
  const fileBuffer = fs.readFileSync(filePath);
  const { data, error } = await supabase.storage
    .from(bucketName)
    .upload(storagePath, fileBuffer, {
      contentType,
      upsert: true
    });
  
  if (error) throw error;
  
  const { data: { publicUrl } } = supabase.storage
    .from(bucketName)
    .getPublicUrl(storagePath);
  
  return publicUrl;
}

/**
 * 고객 ID 찾기
 */
async function findCustomerId(customerName) {
  const { data, error } = await supabase
    .from('customers')
    .select('id, name, phone')
    .eq('name', customerName)
    .limit(1)
    .single();
  
  if (error || !data) {
    return null;
  }
  
  return data;
}

/**
 * 메타데이터 저장
 */
async function saveMetadata(imageData, customerInfo) {
  // 기본 메타데이터 (필수 필드만)
  const metadataPayload = {
    image_url: imageData.url,
    folder_path: imageData.folderPath,
    date_folder: imageData.visitDate,
    source: 'customer',
    channel: 'customer',
    title: `${customerInfo.name} - ${imageData.visitDate}`,
    alt_text: `${customerInfo.name} 고객 이미지 (${imageData.visitDate})`,
    file_size: imageData.fileSize,
    tags: customerInfo.isUnmatched 
      ? [`unmatched-customer`, `unmatched-${customerInfo.name}`, `visit-${imageData.visitDate}`]
      : [`customer-${customerInfo.customerId}`, `visit-${imageData.visitDate}`],
    upload_source: 'customer-migration',
    updated_at: new Date().toISOString(),
    metadata: {
      visitDate: imageData.visitDate,
      customerName: customerInfo.name,
      isUnmatched: customerInfo.isUnmatched || false,
      story_scene: imageData.scene,
      image_type: imageData.type,
      original_filename: imageData.originalFileName,
      english_filename: imageData.englishFileName,
      customer_name_en: customerInfo.nameEn || null,
      customer_initials: customerInfo.initials || null,
      image_quality: 'final'
    }
  };
  
  // 확장 필드 추가 (있으면)
  if (imageData.scene) {
    metadataPayload.story_scene = imageData.scene;
  }
  if (imageData.type) {
    metadataPayload.image_type = imageData.type;
  }
  if (imageData.originalFileName) {
    metadataPayload.original_filename = imageData.originalFileName;
  }
  if (imageData.englishFileName) {
    metadataPayload.english_filename = imageData.englishFileName;
  }
  if (customerInfo.nameEn) {
    metadataPayload.customer_name_en = customerInfo.nameEn;
  }
  if (customerInfo.initials) {
    metadataPayload.customer_initials = customerInfo.initials;
  }
  
  // upsert 사용 (중복 시 업데이트)
  let { data, error } = await supabase
    .from('image_metadata')
    .upsert(metadataPayload, { onConflict: 'image_url' })
    .select()
    .single();
  
  // file_name 컬럼 오류면 제거하고 재시도
  if (error && error.message.includes('file_name')) {
    // 확장 필드 없이 재시도
    const { data: retryData, error: retryError } = await supabase
      .from('image_metadata')
      .upsert(metadataPayload, { onConflict: 'image_url' })
      .select()
      .single();
    
    if (retryError) {
      throw retryError;
    }
    
    return retryData;
  }
  
  if (error) {
    throw error;
  }
  
  return data;
}

/**
 * 고객별 마이그레이션
 */
async function migrateCustomer(customerKey, customerInfo) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`고객: ${customerKey} (${customerInfo.localName} -> ${customerInfo.dbName || 'unmatched'})`);
  console.log('='.repeat(60));
  
  // 로컬 폴더 찾기
  const yearFolder = path.join(LOCAL_FOLDER, customerInfo.year);
  if (!fs.existsSync(yearFolder)) {
    console.error(`❌ 연도 폴더가 없습니다: ${yearFolder}`);
    return;
  }
  
  // 고객 폴더 찾기 (YYYY.MM.DD.고객이름 형식)
  const items = fs.readdirSync(yearFolder);
  let customerFolder = null;
  
  const normalizedLocalName = normalizeKorean(customerInfo.localName);
  
  for (const item of items) {
    if (item.startsWith(customerInfo.year + '.')) {
      // 폴더명에서 고객 이름 추출
      const parts = item.split(/[\.\s]+/);
      if (parts.length >= 4) {
        const folderName = parts.slice(3).join(' ').trim();
        const normalizedFolderName = normalizeKorean(folderName);
        
        // 정확히 일치하거나 포함되는 경우
        if (normalizedFolderName === normalizedLocalName || 
            folderName === customerInfo.localName ||
            normalizedFolderName.includes(normalizedLocalName) ||
            normalizedLocalName.includes(normalizedFolderName) ||
            item.includes(customerInfo.localName)) {
          customerFolder = path.join(yearFolder, item);
          console.log(`   🔍 매칭된 폴더: ${item}`);
          break;
        }
      }
    }
  }
  
  // 폴더를 찾지 못한 경우, 전체 스캔으로 재시도
  if (!customerFolder) {
    console.log(`   🔍 전체 스캔으로 재시도...`);
    for (const item of items) {
      const fullPath = path.join(yearFolder, item);
      try {
        if (fs.statSync(fullPath).isDirectory()) {
          const normalizedItem = normalizeKorean(item);
          if (normalizedItem.includes(normalizedLocalName) || 
              item.includes(customerInfo.localName)) {
            customerFolder = fullPath;
            console.log(`   ✅ 발견된 폴더: ${item}`);
            break;
          }
        }
      } catch (e) {
        // 무시
      }
    }
  }
  
  if (!customerFolder || !fs.existsSync(customerFolder)) {
    console.error(`❌ 고객 폴더를 찾을 수 없습니다: ${customerInfo.localName}`);
    return;
  }
  
  console.log(`📁 폴더: ${customerFolder}`);
  
  // 파일 찾기
  const files = findCustomerFiles(customerFolder, customerInfo.localName);
  console.log(`📸 발견된 파일: ${files.length}개`);
  
  if (files.length === 0) {
    console.log('⚠️  파일이 없습니다.');
    return;
  }
  
  // 고객 정보 조회 (unmatched가 아닌 경우)
  let customerData = null;
  if (!customerInfo.isUnmatched && customerInfo.dbName) {
    customerData = await findCustomerId(customerInfo.dbName);
    if (!customerData) {
      console.error(`❌ DB에서 고객을 찾을 수 없습니다: ${customerInfo.dbName}`);
      return;
    }
    console.log(`✅ 고객 ID: ${customerData.id}, 전화번호: ${customerData.phone || '(없음)'}`);
  }
  
  // 고객 정보 설정
  const finalCustomerInfo = {
    name: customerInfo.dbName || customerInfo.localName,
    nameEn: translateKoreanToEnglish(customerInfo.dbName || customerInfo.localName),
    initials: customerInfo.initials || getCustomerInitials(customerInfo.dbName || customerInfo.localName),
    customerId: customerData?.id || null,
    phone: customerData?.phone || null,
    isUnmatched: customerInfo.isUnmatched || false,
  };
  
  // 폴더명 생성
  let folderName;
  if (finalCustomerInfo.isUnmatched) {
    folderName = `unmatched/${finalCustomerInfo.initials}`;
  } else {
    if (finalCustomerInfo.phone) {
      const phoneLast4 = finalCustomerInfo.phone.replace(/-/g, '').slice(-4);
      folderName = `${finalCustomerInfo.nameEn}-${phoneLast4}`;
    } else if (finalCustomerInfo.customerId) {
      folderName = `${finalCustomerInfo.nameEn}-${String(finalCustomerInfo.customerId).padStart(4, '0')}`;
    } else {
      folderName = `${finalCustomerInfo.nameEn}-unknown`;
    }
  }
  
  console.log(`📁 Supabase 폴더: originals/customers/${folderName}`);
  
  // 방문일자 추출
  let visitDate = `${customerInfo.year}-01-01`;
  const pathParts = customerFolder.split(path.sep);
  for (const part of pathParts) {
    const dateMatch = part.match(/^(\d{4})\.(\d{1,2})\.(\d{1,2})\./);
    if (dateMatch) {
      const year = dateMatch[1];
      const month = dateMatch[2].padStart(2, '0');
      const day = dateMatch[3].padStart(2, '0');
      visitDate = `${year}-${month}-${day}`;
      break;
    }
  }
  
  console.log(`📅 방문일자: ${visitDate}`);
  
  // 출력 디렉토리
  const outputDir = path.join(process.cwd(), 'migrated', folderName, visitDate);
  fs.mkdirSync(outputDir, { recursive: true });
  
  let successCount = 0;
  let failCount = 0;
  
  // 각 파일 처리
  for (let i = 0; i < files.length; i++) {
    const filePath = files[i];
    const originalFileName = path.basename(filePath);
    const ext = path.extname(originalFileName).toLowerCase();
    
    try {
      let newFileName;
      let outputPath;
      let contentType;
      let fileSize;
      
      // PDF 처리 (WebP로 변환 시도, 실패 시 원본 PDF 저장)
      if (ext === '.pdf') {
        const pattern = extractPattern(originalFileName, customerInfo.localName);
        const number = extractNumber(originalFileName) || (i + 1);
        const initials = finalCustomerInfo.initials;
        const type = pattern?.english || 'document';
        const scene = pattern?.scene || 1;
        
        // PDF를 WebP로 변환 시도
        const webpPath = path.join(outputDir, `${initials}_s${scene}_${type}_${String(number).padStart(2, '0')}.webp`);
        const convertResult = await convertPDFToWebP(filePath, webpPath);
        
        if (convertResult.success && !convertResult.isPDF) {
          // WebP 변환 성공
          newFileName = path.basename(webpPath);
          outputPath = webpPath;
          contentType = 'image/webp';
          fileSize = convertResult.convertedSize;
        } else if (convertResult.success && convertResult.isPDF) {
          // PDF 변환 실패, 원본 PDF로 저장
          newFileName = `${initials}_s${scene}_${type}_${String(number).padStart(2, '0')}.pdf`;
          outputPath = path.join(outputDir, newFileName);
          contentType = 'application/pdf';
          fileSize = convertResult.originalSize;
        } else {
          throw new Error(`PDF 처리 실패: ${convertResult.error}`);
        }
        
      // 동영상 처리
      } else if (['.mp4', '.mov', '.avi', '.mkv', '.webm'].includes(ext)) {
        newFileName = generateVideoFileName(originalFileName, customerInfo.localName, i + 1);
        outputPath = path.join(outputDir, newFileName);
        
        // 동영상은 복사만 (변환 없음)
        fs.copyFileSync(filePath, outputPath);
        
        contentType = `video/${ext.slice(1)}`;
        const stats = fs.statSync(outputPath);
        fileSize = stats.size;
        
      // 이미지 처리
      } else {
        const pattern = extractPattern(originalFileName, customerInfo.localName);
        const number = extractNumber(originalFileName) || (i + 1);
        const initials = finalCustomerInfo.initials;
        const type = pattern?.english || 'image';
        const scene = pattern?.scene || 1;
        
        newFileName = `${initials}_s${scene}_${type}_${String(number).padStart(2, '0')}.webp`;
        outputPath = path.join(outputDir, newFileName);
        
        const convertResult = await convertToWebP(filePath, outputPath);
        if (!convertResult.success) {
          throw new Error(`WebP 변환 실패: ${convertResult.error}`);
        }
        
        contentType = 'image/webp';
        fileSize = convertResult.convertedSize;
      }
      
      // Supabase Storage 경로
      const storagePath = `originals/customers/${folderName}/${visitDate}/${newFileName}`;
      
      // 업로드
      const url = await uploadFile(outputPath, storagePath, contentType);
      
      // 메타데이터 저장
      const pattern = extractPattern(originalFileName, customerInfo.localName);
      await saveMetadata({
        originalFileName,
        englishFileName: newFileName,
        url,
        folderPath: `originals/customers/${folderName}/${visitDate}`,
        visitDate,
        scene: pattern?.scene || 1,
        type: pattern?.english || 'unknown',
        fileSize
      }, finalCustomerInfo);
      
      successCount++;
      console.log(`   ✅ ${i + 1}/${files.length}: ${newFileName}`);
      
    } catch (error) {
      failCount++;
      console.error(`   ❌ 실패: ${originalFileName} - ${error.message}`);
    }
  }
  
  console.log(`\n📊 완료: 성공 ${successCount}개, 실패 ${failCount}개`);
}

/**
 * 메인 실행
 */
async function migrateUnmatchedCustomers() {
  console.log('🔄 언매칭 고객 이미지 마이그레이션 시작...\n');
  
  const customers = Object.keys(CUSTOMER_MAPPING);
  
  for (const customerKey of customers) {
    const customerInfo = CUSTOMER_MAPPING[customerKey];
    await migrateCustomer(customerKey, customerInfo);
  }
  
  console.log(`\n${'='.repeat(60)}`);
  console.log('✅ 모든 언매칭 고객 마이그레이션 완료!');
  console.log('='.repeat(60));
}

if (require.main === module) {
  migrateUnmatchedCustomers().catch(console.error);
}

module.exports = { migrateUnmatchedCustomers };
