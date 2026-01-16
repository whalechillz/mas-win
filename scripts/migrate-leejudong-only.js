/**
 * 이주동 고객만 마이그레이션 (PNG 파일 사용)
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

const CUSTOMER_NAME = '이주동';
const CUSTOMER_FOLDER = '/Users/m2/MASLABS/00.블로그_고객/2025/2025.10.17.이주동';

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
  const map = { '이주동': 'lee-ju-dong' };
  return map[text] || text.toLowerCase().replace(/[^a-z0-9]/g, '-');
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

async function saveMetadata(imageData, customerInfo) {
  const metadataPayload = {
    image_url: imageData.url,
    folder_path: imageData.folderPath,
    date_folder: imageData.visitDate,
    source: 'customer',
    channel: 'customer',
    title: `${customerInfo.name} - ${imageData.visitDate}`,
    alt_text: `${customerInfo.name} 고객 이미지 (${imageData.visitDate})`,
    file_size: imageData.fileSize,
    tags: [`customer-${customerInfo.customerId}`, `visit-${imageData.visitDate}`],
    upload_source: 'customer-migration',
    updated_at: new Date().toISOString(),
    metadata: {
      visitDate: imageData.visitDate,
      customerName: customerInfo.name,
      story_scene: imageData.scene,
      image_type: imageData.type,
      original_filename: imageData.originalFileName,
      english_filename: imageData.englishFileName,
      customer_name_en: customerInfo.nameEn || null,
      customer_initials: customerInfo.initials || null,
      image_quality: 'final'
    }
  };
  
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
  
  let { data, error } = await supabase
    .from('image_metadata')
    .upsert(metadataPayload, { onConflict: 'image_url' })
    .select()
    .single();
  
  if (error && error.message.includes('file_name')) {
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

async function migrateLeeJuDong() {
  console.log(`🔄 이주동 고객 이미지 마이그레이션 시작...\n`);
  
  if (!fs.existsSync(CUSTOMER_FOLDER)) {
    console.error(`❌ 폴더가 없습니다: ${CUSTOMER_FOLDER}`);
    return;
  }
  
  // 고객 정보 조회
  const customerData = await findCustomerId(CUSTOMER_NAME);
  if (!customerData) {
    console.error(`❌ DB에서 고객을 찾을 수 없습니다: ${CUSTOMER_NAME}`);
    return;
  }
  
  console.log(`✅ 고객 ID: ${customerData.id}, 전화번호: ${customerData.phone || '(없음)'}`);
  
  const customerInfo = {
    name: CUSTOMER_NAME,
    nameEn: translateKoreanToEnglish(CUSTOMER_NAME),
    initials: getCustomerInitials(CUSTOMER_NAME),
    customerId: customerData.id,
    phone: customerData.phone || null,
    isUnmatched: false,
  };
  
  // 폴더명 생성
  let folderName;
  if (customerInfo.phone) {
    const phoneLast4 = customerInfo.phone.replace(/-/g, '').slice(-4);
    folderName = `${customerInfo.nameEn}-${phoneLast4}`;
  } else if (customerInfo.customerId) {
    folderName = `${customerInfo.nameEn}-${String(customerInfo.customerId).padStart(4, '0')}`;
  } else {
    folderName = `${customerInfo.nameEn}-unknown`;
  }
  
  console.log(`📁 Supabase 폴더: originals/customers/${folderName}`);
  
  // 방문일자
  const visitDate = '2025-10-17';
  console.log(`📅 방문일자: ${visitDate}`);
  
  // 파일 찾기 (PNG만)
  const files = fs.readdirSync(CUSTOMER_FOLDER)
    .filter(file => {
      const ext = path.extname(file).toLowerCase();
      return ['.png', '.jpg', '.jpeg'].includes(ext) && 
             normalizeKorean(file).includes(normalizeKorean(CUSTOMER_NAME));
    })
    .map(file => path.join(CUSTOMER_FOLDER, file));
  
  console.log(`📸 발견된 파일: ${files.length}개\n`);
  
  if (files.length === 0) {
    console.log('⚠️  파일이 없습니다.');
    return;
  }
  
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
      // 패턴 추출
      const pattern = extractPattern(originalFileName, CUSTOMER_NAME);
      const number = extractNumber(originalFileName) || (i + 1);
      const initials = customerInfo.initials;
      const type = pattern?.english || 'image';
      const scene = pattern?.scene || 1;
      
      // 새 파일명 생성
      const newFileName = `${initials}_s${scene}_${type}_${String(number).padStart(2, '0')}.webp`;
      const outputPath = path.join(outputDir, newFileName);
      
      // WebP 변환
      const convertResult = await convertToWebP(filePath, outputPath);
      if (!convertResult.success) {
        throw new Error(`WebP 변환 실패: ${convertResult.error}`);
      }
      
      // Supabase Storage 경로
      const storagePath = `originals/customers/${folderName}/${visitDate}/${newFileName}`;
      
      // 업로드
      const url = await uploadFile(outputPath, storagePath, 'image/webp');
      
      // 메타데이터 저장
      await saveMetadata({
        originalFileName,
        englishFileName: newFileName,
        url,
        folderPath: `originals/customers/${folderName}/${visitDate}`,
        visitDate,
        scene,
        type,
        fileSize: convertResult.convertedSize
      }, customerInfo);
      
      successCount++;
      console.log(`   ✅ ${i + 1}/${files.length}: ${newFileName}`);
      
    } catch (error) {
      failCount++;
      console.error(`   ❌ 실패: ${originalFileName} - ${error.message}`);
    }
  }
  
  console.log(`\n📊 완료: 성공 ${successCount}개, 실패 ${failCount}개`);
}

if (require.main === module) {
  migrateLeeJuDong().catch(console.error);
}

module.exports = { migrateLeeJuDong };
