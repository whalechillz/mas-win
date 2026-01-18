/**
 * 스킵된 고객 - 이용복 마이그레이션 스크립트
 * 2024.09.10.이용복 폴더의 이미지 마이그레이션
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

// 고객 정보
const CUSTOMER_NAME = '이용복';
const FOLDER_PATH = '/Users/m2/MASLABS/00.blog_customers/2024/2024.09.10.이용복';
const VISIT_DATE = '2024-09-10';

// 파일명 패턴 매핑 (추가 패턴)
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
  'customer_review': 'review-capture',
  'review': 'review-capture',
  'fitting': 'review-capture',
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
  'review-capture': 7,
  'review': 7,
  'fitting': 7,
};

/**
 * NFD(정규화된) 한글을 NFC(조합된) 형식으로 변환
 */
function normalizeKorean(text) {
  if (!text) return text;
  return text.normalize('NFC');
}

/**
 * 파일명에서 패턴 추출
 */
function extractPattern(fileName, customerName) {
  let nameWithoutExt = fileName.replace(/\.[^/.]+$/, '');
  nameWithoutExt = normalizeKorean(nameWithoutExt);
  
  // 고객 이름 제거
  const customerNameEn = translateKoreanToEnglish(customerName).toLowerCase();
  const customerNameKr = customerName;
  
  nameWithoutExt = nameWithoutExt
    .replace(new RegExp('^' + escapeRegex(customerNameKr) + '_', 'i'), '')
    .replace(new RegExp('^' + escapeRegex(customerNameEn) + '_', 'i'), '')
    .replace(/^massgoo_/, '') // massgoo_ 접두사 제거
    .replace(/^IMG_/, '') // IMG_ 접두사 제거
    .replace(/_fix$/, '') // _fix 접미사 제거
    .replace(/^_+|_+$/g, '')
    .trim();

  // 영문으로 변환
  let nameWithoutExtEn = nameWithoutExt;
  if (/[가-힣]/.test(nameWithoutExt)) {
    nameWithoutExtEn = translateKoreanToEnglish(nameWithoutExt)
      .replace(/[가-힣]/g, '')
      .replace(/[^a-z0-9-_]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
      .toLowerCase();
  }

  // 패턴 찾기
  const sortedPatterns = Object.keys(FILENAME_PATTERN_MAP).sort((a, b) => b.length - a.length);
  
  // 1차: 한글 원본에서 패턴 찾기
  for (const pattern of sortedPatterns) {
    if (nameWithoutExt.includes(pattern)) {
      return {
        pattern,
        english: FILENAME_PATTERN_MAP[pattern],
        scene: STORY_SCENE_MAP[pattern] || STORY_SCENE_MAP[FILENAME_PATTERN_MAP[pattern]] || 1
      };
    }
  }
  
  // 2차: 영문 변환본에서 패턴 찾기
  for (const pattern of sortedPatterns) {
    const patternEn = FILENAME_PATTERN_MAP[pattern];
    if (nameWithoutExtEn.includes(patternEn) || nameWithoutExtEn.includes(pattern.toLowerCase())) {
      return {
        pattern,
        english: patternEn,
        scene: STORY_SCENE_MAP[pattern] || STORY_SCENE_MAP[patternEn] || 1
      };
    }
  }
  
  // 3차: 영문 키워드 직접 매칭
  const keywordMap = {
    'review': { english: 'review-capture', scene: 7 },
    'fitting': { english: 'review-capture', scene: 7 },
    'customer': { english: 'review-capture', scene: 7 },
  };
  
  for (const [keyword, mapping] of Object.entries(keywordMap)) {
    if (nameWithoutExtEn.includes(keyword)) {
      return mapping;
    }
  }
  
  return null;
}

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * 파일명에서 번호 추출
 */
function extractNumber(fileName) {
  // IMG_3256 형식에서 숫자 추출
  const imgMatch = fileName.match(/IMG_(\d+)/);
  if (imgMatch) {
    return parseInt(imgMatch[1].slice(-2), 10) || 1;
  }
  
  // 일반적인 숫자 패턴
  const match = fileName.match(/(\d{2})/);
  return match ? parseInt(match[1], 10) : 1;
}

/**
 * WebP 변환
 */
async function convertToWebP(inputPath, outputPath, quality = 90) {
  try {
    const stats = await sharp(inputPath)
      .webp({ quality })
      .toFile(outputPath);
    
    return {
      success: true,
      convertedSize: stats.size
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * 이미지 업로드
 */
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

/**
 * 메타데이터 저장
 */
async function saveMetadata(imageData) {
  const metadataPayload = {
    image_url: imageData.url,
    folder_path: imageData.folderPath,
    date_folder: imageData.visitDate,
    source: 'customer',
    channel: 'customer',
    title: `${imageData.customerName} - ${imageData.visitDate}`,
    alt_text: `${imageData.customerName} 고객 이미지 (${imageData.visitDate})`,
    file_size: imageData.fileSize || null,
    tags: [`customer-${imageData.customerId}`, `visit-${imageData.visitDate}`],
    story_scene: imageData.scene || null,
    image_type: imageData.type || null,
    original_filename: imageData.originalFileName || null,
    english_filename: imageData.englishFileName || null,
    customer_name_en: imageData.customerNameEn || null,
    customer_initials: imageData.customerInitials || null,
    image_quality: 'final',
    upload_source: 'customer-migration-skipped',
    updated_at: new Date().toISOString(),
    metadata: {
      visitDate: imageData.visitDate,
      customerName: imageData.customerName,
      customerPhone: imageData.customerPhone || null,
      englishFileName: imageData.englishFileName,
      originalFileName: imageData.originalFileName,
      scene: imageData.scene || 1,
      type: imageData.type || 'unknown',
      customerNameEn: imageData.customerNameEn,
      customerInitials: imageData.customerInitials
    }
  };

  const { data, error } = await supabase
    .from('image_metadata')
    .upsert(metadataPayload, {
      onConflict: 'image_url',
      ignoreDuplicates: false
    })
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}

/**
 * 고객 ID 찾기
 */
async function findCustomerId(customerName) {
  const normalizedName = normalizeKorean(customerName);
  
  const { data, error } = await supabase
    .from('customers')
    .select('id, name, phone, name_en, initials')
    .eq('name', normalizedName)
    .order('updated_at', { ascending: false })
    .limit(1)
    .single();

  if (error || !data) {
    return null;
  }

  return data;
}

/**
 * 고객 정보 업데이트
 */
async function updateCustomerInfo(customerId, nameEn, initials, folderName) {
  const { error } = await supabase
    .from('customers')
    .update({
      name_en: nameEn,
      initials: initials,
      folder_name: folderName,
      updated_at: new Date().toISOString()
    })
    .eq('id', customerId);

  if (error) {
    console.error(`   ⚠️  고객 정보 업데이트 실패: ${error.message}`);
  }
}

/**
 * 메인 마이그레이션 함수
 */
async function migrateLeeyotbok() {
  console.log('🔄 이용복 고객 이미지 마이그레이션 시작...\n');
  
  // 폴더 확인
  if (!fs.existsSync(FOLDER_PATH)) {
    console.error(`❌ 폴더를 찾을 수 없습니다: ${FOLDER_PATH}`);
    return;
  }
  
  // 고객 정보 조회
  const customerInfo = await findCustomerId(CUSTOMER_NAME);
  if (!customerInfo) {
    console.error(`❌ 고객 정보를 찾을 수 없습니다: ${CUSTOMER_NAME}`);
    return;
  }
  
  console.log(`✅ 고객 정보: ID ${customerInfo.id}, 전화번호: ${customerInfo.phone || '없음'}`);
  
  // 폴더명 생성
  const nameEn = customerInfo.name_en || translateKoreanToEnglish(CUSTOMER_NAME);
  const cleanNameEn = nameEn.replace(/[^a-z0-9]/g, '').toLowerCase();
  const phoneLast4 = customerInfo.phone ? customerInfo.phone.replace(/[^0-9]/g, '').slice(-4) : String(customerInfo.id).padStart(4, '0');
  const folderName = `${cleanNameEn}-${phoneLast4}`;
  
  console.log(`📁 폴더명: ${folderName}`);
  
  // 이니셜 생성
  const initials = customerInfo.initials || getCustomerInitials(CUSTOMER_NAME);
  
  // 고객 정보 업데이트
  await updateCustomerInfo(customerInfo.id, cleanNameEn, initials, folderName);
  
  // 파일 목록 가져오기
  const files = fs.readdirSync(FOLDER_PATH)
    .filter(file => {
      const ext = path.extname(file).toLowerCase();
      return ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp', '.heic', '.heif'].includes(ext);
    })
    .sort();
  
  console.log(`\n📸 발견된 이미지: ${files.length}개\n`);
  
  if (files.length === 0) {
    console.log('⏭️  이미지가 없어 스킵');
    return;
  }
  
  // 출력 디렉토리 생성
  const outputDir = path.join(process.cwd(), 'migrated2', folderName, VISIT_DATE);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  let uploadCount = 0;
  let failCount = 0;
  
  // 각 파일 처리
  for (let i = 0; i < files.length; i++) {
    const originalFileName = files[i];
    const originalFilePath = path.join(FOLDER_PATH, originalFileName);
    const ext = path.extname(originalFileName).toLowerCase();
    
    console.log(`\n[${i + 1}/${files.length}] ${originalFileName}`);
    
    try {
      // 패턴 추출
      const pattern = extractPattern(originalFileName, CUSTOMER_NAME);
      const number = extractNumber(originalFileName) || (i + 1);
      
      // 새 파일명 생성
      let newFileName;
      if (pattern) {
        newFileName = `${cleanNameEn}_s${pattern.scene}_${pattern.english}_${String(number).padStart(2, '0')}.webp`;
      } else {
        // 패턴이 없으면 기본 타입 사용 (일반 이미지)
        newFileName = `${cleanNameEn}_s1_hero_${String(i + 1).padStart(2, '0')}.webp`;
        console.log(`   ⚠️  패턴을 찾을 수 없어 기본 파일명 사용: ${newFileName}`);
      }
      
      // WebP 변환
      const outputPath = path.join(outputDir, newFileName);
      const convertResult = await convertToWebP(originalFilePath, outputPath);
      
      if (!convertResult.success) {
        console.log(`   ❌ 변환 실패: ${convertResult.error}`);
        failCount++;
        continue;
      }
      
      // 업로드
      const folderPath = `originals/customers/${folderName}/${VISIT_DATE}`;
      const storagePath = `${folderPath}/${newFileName}`;
      
      const url = await uploadImage(outputPath, storagePath);
      
      // 메타데이터 저장
      await saveMetadata({
        customerId: customerInfo.id,
        customerName: CUSTOMER_NAME,
        customerNameEn: cleanNameEn,
        customerInitials: initials,
        customerPhone: customerInfo.phone,
        originalFileName,
        englishFileName: newFileName,
        url,
        folderPath,
        visitDate: VISIT_DATE,
        scene: pattern?.scene || 1,
        type: pattern?.english || 'hero',
        fileSize: convertResult.convertedSize
      });
      
      uploadCount++;
      console.log(`   ✅ 업로드 완료: ${newFileName}`);
      
    } catch (error) {
      console.log(`   ❌ 오류: ${error.message}`);
      failCount++;
    }
  }
  
  console.log(`\n${'='.repeat(60)}`);
  console.log('📊 마이그레이션 완료!');
  console.log(`   성공: ${uploadCount}개`);
  console.log(`   실패: ${failCount}개`);
  console.log('='.repeat(60));
}

/**
 * 고객 이름에서 이니셜 추출
 */
function getCustomerInitials(name) {
  if (!name) return 'unknown';
  
  if (/[가-힣]/.test(name)) {
    const nameEn = translateKoreanToEnglish(name);
    const parts = nameEn.split(/[\s-]+/);
    return parts.map(part => part.charAt(0)).join('').toLowerCase();
  }
  
  const parts = name.split(/[\s-]+/);
  return parts.map(part => part.charAt(0)).join('').toLowerCase();
}

// 실행
if (require.main === module) {
  migrateLeeyotbok().catch(console.error);
}

module.exports = { migrateLeeyotbok };
