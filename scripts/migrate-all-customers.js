/**
 * 모든 고객 이미지 마이그레이션 스크립트
 * - 로컬 폴더에서 모든 고객 이미지 찾기
 * - 파일명 영문 변환
 * - WebP 90% 품질로 변환
 * - Supabase 업로드
 * - 진행 상황 추적
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

// 로컬 폴더 경로
const LOCAL_FOLDER = '/Users/m2/MASLABS/00.blog_customers';

// 연도 필터 (빈 배열이면 모든 연도 처리)
const YEAR_FILTER = []; // 모든 연도 처리 (2022~2026)

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
 * 고객 이름에서 이니셜 추출 (영문만 반환)
 */
function getCustomerInitials(name) {
  if (!name) return 'unknown';
  
  // 한글 이름인 경우
  if (/[가-힣]/.test(name)) {
    // 한글 이름을 영문으로 변환 시도
    const nameEn = translateKoreanToEnglish(name);
    
    if (nameEn && nameEn.trim() !== '') {
      // 하이픈으로 분리된 경우 (예: jang-jinsu)
      const parts = nameEn.split(/[\s-]+/);
      const initials = parts.map(part => part.charAt(0)).join('').toLowerCase();
      if (initials && initials.length > 0 && /^[a-z]+$/.test(initials)) {
        return initials;
      }
    }
    
    // 영문 변환이 실패하면 한글 이름의 각 글자 초성 사용 (영문만)
    const initials = name.split('').map(char => {
      if (/[가-힣]/.test(char)) {
        // 한글 초성 추출 (가-힣 범위)
        const code = char.charCodeAt(0) - 0xAC00;
        if (code >= 0 && code < 11172) {
          const initialIndex = Math.floor(code / 588);
          const initialChars = ['g', 'n', 'd', 'r', 'm', 'b', 's', 'o', 'j', 'c', 'k', 't', 'p', 'h'];
          if (initialIndex >= 0 && initialIndex < initialChars.length) {
            return initialChars[initialIndex];
          }
        }
      }
      return '';
    }).filter(c => c !== '').join('');
    
    return initials && /^[a-z]+$/.test(initials) ? initials : 'unknown';
  }
  
  // 영문 이름인 경우
  const parts = name.split(/[\s-]+/);
  const initials = parts.map(part => part.charAt(0)).join('').toLowerCase();
  return /^[a-z]+$/.test(initials) ? initials : 'unknown';
}

/**
 * 조합형 한글을 완성형으로 정규화
 */
function normalizeKorean(text) {
  return text.normalize('NFC');
}

/**
 * 파일명에서 패턴 추출
 */
function extractPattern(fileName, customerName) {
  let nameWithoutExt = fileName.replace(/\.[^/.]+$/, '');
  nameWithoutExt = normalizeKorean(nameWithoutExt);
  
  // 고객 이름 제거 (한글 및 영문 모두)
  const customerNameEn = translateKoreanToEnglish(customerName).toLowerCase();
  const customerNameKr = customerName;
  
  nameWithoutExt = nameWithoutExt
    .replace(new RegExp('^' + escapeRegex(customerNameKr) + '_', 'i'), '')
    .replace(new RegExp('^' + escapeRegex(customerNameEn) + '_', 'i'), '')
    .replace(/^_+|_+$/g, '')
    .trim();
  
  nameWithoutExt = normalizeKorean(nameWithoutExt);
  
  // 한글 파일명인 경우 영문으로 변환하여 패턴 매칭 시도
  let nameWithoutExtEn = nameWithoutExt;
  if (/[가-힣]/.test(nameWithoutExt)) {
    nameWithoutExtEn = translateKoreanToEnglish(nameWithoutExt)
      .replace(/[가-힣]/g, '') // 남은 한글 제거
      .replace(/[^a-z0-9-_]/g, '-') // 특수문자 제거
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
      .toLowerCase();
  }
  
  // 패턴 찾기 (한글 원본과 영문 변환본 모두 시도)
  const sortedPatterns = Object.keys(FILENAME_PATTERN_MAP).sort((a, b) => b.length - a.length);
  
  // 1차: 한글 원본에서 패턴 찾기
  for (const pattern of sortedPatterns) {
    if (nameWithoutExt.includes(pattern)) {
      return {
        pattern,
        english: FILENAME_PATTERN_MAP[pattern],
        scene: STORY_SCENE_MAP[pattern] || STORY_SCENE_MAP[pattern.split('_')[0]] || 1
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
        scene: STORY_SCENE_MAP[pattern] || STORY_SCENE_MAP[pattern.split('_')[0]] || 1
      };
    }
  }
  
  return null;
}

/**
 * 정규식 특수문자 이스케이프
 */
function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
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
 * @param {string} originalFileName - 원본 파일명
 * @param {string} customerName - 고객 이름 (한글)
 * @param {number} index - 순번
 * @param {string} folderName - 폴더명 (예: jangjinsu-8189)
 */
function generateNewFileName(originalFileName, customerName, index, folderName = null) {
  let cleanedFileName = originalFileName.replace(/_ok/g, '');
  const ext = path.extname(originalFileName).toLowerCase();
  const pattern = extractPattern(cleanedFileName, customerName);
  
  if (!pattern) {
    return null;
  }
  
  const number = extractNumber(cleanedFileName) || index;
  
  // 폴더명에서 영문 이름 추출 (전화번호/ID 제거)
  let nameEn = '';
  if (folderName) {
    // 폴더명 형식: jangjinsu-8189 또는 jangjinsu-0001
    // 마지막 하이픈 이후를 제거
    const lastHyphenIndex = folderName.lastIndexOf('-');
    if (lastHyphenIndex > 0) {
      nameEn = folderName.substring(0, lastHyphenIndex);
    } else {
      nameEn = folderName;
    }
  }
  
  // 폴더명이 없거나 추출 실패 시 영문 이름 생성
  if (!nameEn || nameEn.trim() === '') {
    const translatedName = translateKoreanToEnglish(customerName);
    nameEn = translatedName.replace(/[가-힣]/g, '').replace(/[^a-z0-9]/g, '').toLowerCase();
    
    if (!nameEn || nameEn.trim() === '') {
      // 최후의 수단: 이니셜 사용
      const initials = getCustomerInitials(customerName);
      nameEn = initials && initials !== 'unknown' ? initials : 'cus';
    }
  }
  
  // 동영상 파일은 원본 확장자 유지
  if (['.mp4', '.mov', '.avi', '.mkv', '.webm'].includes(ext)) {
    return `${nameEn}_s${pattern.scene}_${pattern.english}_${String(number).padStart(2, '0')}${ext}`;
  }
  
  // 이미지 파일은 WebP로 변환
  return `${nameEn}_s${pattern.scene}_${pattern.english}_${String(number).padStart(2, '0')}.webp`;
}

/**
 * 이미지 파일 찾기 (재귀적, 고객별 폴더 구조 지원)
 */
function findImageFiles(folderPath, customerName, recursive = true) {
  const imageFiles = [];
  const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp', '.heic', '.heif'];
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
          // YYYY.MM.DD.고객이름 형식 파싱
          const match = item.match(/^(\d{4})\.(\d{1,2})\.(\d{1,2})\.(.+)$/);
          if (match) {
            const folderCustomerName = match[4].split('-')[0].split('(')[0].trim();
            const normalizedFolderName = normalizeKorean(folderCustomerName);
            
            // 폴더 이름이 고객 이름과 일치하는 경우만 스캔
            if (normalizedFolderName === normalizedCustomerName) {
              if (recursive && !item.startsWith('.') && !item.includes('_temp')) {
                scanDir(fullPath);
              }
            }
          } else if (recursive && !item.startsWith('.') && !item.includes('_temp')) {
            scanDir(fullPath);
          }
        } else if (stat.isFile()) {
          const ext = path.extname(item).toLowerCase();
          // PDF는 제외 (삭제 대상)
          if (allExtensions.includes(ext)) {
            // 고객 이름이 파일명에 포함되어 있는지 확인
            const normalizedItem = normalizeKorean(item);
            
            // 파일명이 고객 이름으로 시작하는지 확인 (예: "황인석_사인.jpg")
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

/**
 * WebP로 변환
 */
async function convertToWebP(inputPath, outputPath, quality = 90) {
  try {
    await sharp(inputPath)
      .webp({ quality })
      .toFile(outputPath);
    
    const inputStats = fs.statSync(inputPath);
    const outputStats = fs.statSync(outputPath);
    const reduction = ((1 - outputStats.size / inputStats.size) * 100).toFixed(1);
    
    return {
      success: true,
      originalSize: inputStats.size,
      convertedSize: outputStats.size,
      reduction: parseFloat(reduction)
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * 이름 매핑 (로컬 파일명 -> DB 이름)
 */
const NAME_MAPPING = {
  '조사장': '조성대',
  '김한구h': '김한구',
  'VIP5458': '하종천',
  '강병구': '강병부',
  'VIP8385': '송화용',
  // '김성준': '고객정보없음' - 제외
};

/**
 * 고객 ID 찾기 (이름 매핑 지원)
 */
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

/**
 * 폴더명 생성 (영문만, 한글 제거)
 */
function generateFolderName(customerName, phone, customerId) {
  let nameEn = translateKoreanToEnglish(customerName);
  
  // 영문 변환이 실패하면 고객 ID 사용
  if (!nameEn || nameEn.trim() === '' || /[가-힣]/.test(nameEn)) {
    // 고객 ID가 있으면 사용
    if (customerId) {
      nameEn = `customer${String(customerId).padStart(4, '0')}`;
    } else {
      nameEn = 'customerunknown';
    }
  }
  
  // 한글이 포함되어 있으면 제거하고 하이픈도 제거 (영문 이름만)
  nameEn = nameEn.replace(/[가-힣]/g, '').replace(/[^a-z0-9]/g, '').toLowerCase();
  
  if (!nameEn || nameEn.trim() === '') {
    nameEn = customerId ? `customer${String(customerId).padStart(4, '0')}` : 'customerunknown';
  }
  
  if (phone && phone.trim() !== '') {
    const phoneLast4 = phone.replace(/-/g, '').slice(-4);
    if (phoneLast4.length === 4 && /^\d{4}$/.test(phoneLast4)) {
      return `${nameEn}-${phoneLast4}`; // 이름과 전화번호 사이에만 하이픈
    }
  }
  
  if (customerId) {
    return `${nameEn}-${String(customerId).padStart(4, '0')}`; // 이름과 ID 사이에만 하이픈
  }
  
  return `${nameEn}-unknown`;
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
  // 기본 메타데이터 (필수 필드만)
  // file_name 컬럼은 제거하고 english_filename만 사용
  const metadataPayload = {
    image_url: imageData.url,
    folder_path: imageData.folderPath,
    date_folder: imageData.visitDate,
    source: 'customer',
    channel: 'customer',
    title: `${imageData.customerName} - ${imageData.visitDate}`,
    alt_text: `${imageData.customerName} 고객 이미지 (${imageData.visitDate})`,
    file_size: imageData.fileSize,
    tags: [`customer-${imageData.customerId}`, `visit-${imageData.visitDate}`],
    // story_scene과 image_type을 직접 컬럼에 저장
    story_scene: imageData.scene || null,
    image_type: imageData.type || null,
    original_filename: imageData.originalFileName || null,
    english_filename: imageData.englishFileName || null,
    customer_name_en: imageData.customerNameEn || null,
    customer_initials: imageData.customerInitials || null,
    image_quality: 'final',
    upload_source: 'customer-migration',
    updated_at: new Date().toISOString(),
    metadata: {
      visitDate: imageData.visitDate,
      customerName: imageData.customerName,
      customerPhone: imageData.customerPhone || null,
      englishFileName: imageData.englishFileName,
      originalFileName: imageData.originalFileName,
      scene: imageData.scene,
      type: imageData.type,
      customerNameEn: imageData.customerNameEn,
      customerInitials: imageData.customerInitials
    }
  };
  
  // upsert 사용 (중복 시 업데이트)
  let { data, error } = await supabase
    .from('image_metadata')
    .upsert(metadataPayload, { onConflict: 'image_url' })
    .select()
    .single();
  
  if (error) {
    throw error;
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
      folder_name: folderName
    })
    .eq('id', customerId);
  
  if (error) {
    console.warn(`   ⚠️  고객 정보 업데이트 실패: ${error.message}`);
  }
}

/**
 * 로컬 폴더에서 고객 이름 추출 (연도별 폴더 구조: YYYY.MM.DD.고객이름)
 */
function extractCustomerNamesFromFiles(folderPath) {
  const customerNames = new Set();
  const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp', '.heic', '.heif', '.pdf', '.mp4'];
  
  function scanDir(dir) {
    if (!fs.existsSync(dir)) return;
    
    const items = fs.readdirSync(dir);
    
    for (const item of items) {
      const fullPath = path.join(dir, item);
      
      try {
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory()) {
          // 연도별 폴더 구조: "YYYY.MM.DD.고객이름" 형식 (2022, 2023, 2024, 2025, 2026)
          const yearMatch = item.match(/^(202[2-6])\.(\d{2})\.(\d{2})\.(.+)$/);
          if (yearMatch) {
            const year = yearMatch[1];
            // YEAR_FILTER가 설정되어 있으면 해당 연도만 처리
            if (YEAR_FILTER.length > 0 && !YEAR_FILTER.includes(year)) {
              return; // 이 연도는 스킵
            }
            const customerName = yearMatch[4];
            // "-고객정보없음" 같은 접미사 제거
            const cleanName = customerName.split('-')[0].split('(')[0].trim();
            if (/[가-힣]/.test(cleanName) && cleanName.length >= 2 && cleanName.length <= 10) {
              customerNames.add(cleanName);
            }
          }
          
          // 연도 폴더 (예: 2024, 2025, 2026) - 하위 폴더도 스캔
          if (/^\d{4}$/.test(item) && parseInt(item) >= 2022 && parseInt(item) <= 2026) {
            const year = item;
            // YEAR_FILTER가 설정되어 있으면 해당 연도만 처리
            if (YEAR_FILTER.length > 0 && !YEAR_FILTER.includes(year)) {
              continue; // 이 연도는 스킵 (return이 아니라 continue)
            }
          }
          
          if (!item.startsWith('.') && !item.includes('_temp')) {
            scanDir(fullPath);
          }
        } else if (stat.isFile()) {
          const ext = path.extname(item).toLowerCase();
          if (imageExtensions.includes(ext)) {
            // 파일명에서 고객 이름 추출 (첫 번째 언더스코어 이전)
            const nameWithoutExt = path.basename(item, ext);
            const normalized = normalizeKorean(nameWithoutExt);
            const firstUnderscore = normalized.indexOf('_');
            
            if (firstUnderscore > 0) {
              const potentialName = normalized.substring(0, firstUnderscore);
              // 한글이 포함되어 있고 길이가 2-4자인 경우만
              if (/[가-힣]/.test(potentialName) && potentialName.length >= 2 && potentialName.length <= 4) {
                customerNames.add(potentialName);
              }
            }
          }
        }
      } catch (e) {
        // 무시
      }
    }
  }
  
  scanDir(folderPath);
  return Array.from(customerNames);
}

/**
 * 메인 마이그레이션 함수
 */
async function migrateAllCustomers() {
  console.log('🔄 모든 고객 이미지 마이그레이션 시작...\n');
  
  // 1. 로컬 폴더에서 고객 이름 추출
  console.log('📂 로컬 폴더에서 고객 이름 추출 중...');
  const customerNames = extractCustomerNamesFromFiles(LOCAL_FOLDER);
  console.log(`✅ 발견된 고객: ${customerNames.length}명\n`);
  
  if (customerNames.length === 0) {
    console.log('❌ 고객 이미지를 찾을 수 없습니다.');
    return;
  }
  
  // 2. 각 고객별로 마이그레이션
  const results = {
    total: customerNames.length,
    success: 0,
    failed: 0,
    skipped: 0,
    details: []
  };
  
  for (let i = 0; i < customerNames.length; i++) {
    const customerName = customerNames[i];
    console.log(`\n${'='.repeat(60)}`);
    console.log(`[${i + 1}/${customerNames.length}] 고객: ${customerName}`);
    console.log('='.repeat(60));
    
    try {
      // 고객 ID 찾기
      const customerInfo = await findCustomerId(customerName);
      
      if (!customerInfo) {
        console.log(`   ⏭️  DB에 고객이 없어 스킵: ${customerName}`);
        results.skipped++;
        results.details.push({
          customerName,
          status: 'skipped',
          reason: '고객이 DB에 없음'
        });
        continue;
      }
      
      // 이름 매핑이 적용된 경우 표시
      if (customerInfo.dbName && customerInfo.dbName !== customerName) {
        console.log(`   📝 이름 매핑: "${customerName}" → "${customerInfo.dbName}" (ID: ${customerInfo.id})`);
      }
      
      if (customerInfo.isDuplicate) {
        console.log(`   ⚠️  중복 이름: ${customerInfo.dbName || customerName} (ID: ${customerInfo.id})`);
        console.log(`   가장 최근 업데이트된 고객을 사용합니다.`);
      }
      
      // DB 이름 사용 (매핑된 경우)
      const actualCustomerName = customerInfo.dbName || customerName;
      
      // 폴더명 생성
      const folderName = generateFolderName(actualCustomerName, customerInfo.phone, customerInfo.id);
      
      // 고객 정보에서 이니셜과 영문 이름 가져오기 (이미 있으면 사용)
      let nameEn = customerInfo.name_en || translateKoreanToEnglish(actualCustomerName);
      let initials = customerInfo.initials || getCustomerInitials(actualCustomerName);
      
      // 이니셜이 없거나 'unknown'이면 DB에서 가져온 고객 정보 사용
      if (!initials || initials === 'unknown' || initials === 'cus') {
        // 고객 정보 다시 조회 (initials 포함)
        const { data: customerFull } = await supabase
          .from('customers')
          .select('id, name, phone, name_en, initials')
          .eq('id', customerInfo.id)
          .single();
        
        if (customerFull) {
          if (customerFull.initials) {
            initials = customerFull.initials;
          }
          if (customerFull.name_en) {
            nameEn = customerFull.name_en;
          }
        }
        
        // 여전히 없으면 생성
        if (!initials || initials === 'unknown' || initials === 'cus') {
          initials = getCustomerInitials(customerName);
          if (!initials || initials === 'unknown') {
            // 이름의 첫 글자 사용 (한글인 경우)
            if (/[가-힣]/.test(customerName)) {
              initials = customerName.charAt(0).toLowerCase();
            } else {
              initials = customerName.charAt(0).toLowerCase();
            }
          }
        }
      }
      
      // 고객 정보 업데이트
      await updateCustomerInfo(customerInfo.id, nameEn, initials, folderName);
      
      // 이미지 파일 찾기
      const imageFiles = findImageFiles(LOCAL_FOLDER, customerName, true);
      console.log(`   📸 발견된 이미지: ${imageFiles.length}개`);
      
      if (imageFiles.length === 0) {
        console.log(`   ⏭️  이미지가 없어 스킵`);
        results.skipped++;
        continue;
      }
      
      // 변환 및 업로드
      const outputDir = path.join(process.cwd(), 'migrated2', folderName);
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }
      
      let uploadCount = 0;
      let failCount = 0;
      let pdfDeletedCount = 0;
      
      for (let j = 0; j < imageFiles.length; j++) {
        const imageFile = imageFiles[j];
        const originalFileName = path.basename(imageFile);
        const ext = path.extname(originalFileName).toLowerCase();
        
        // PDF 파일 삭제
        if (ext === '.pdf') {
          console.log(`   🗑️  PDF 파일 삭제: ${originalFileName}`);
          try {
            fs.unlinkSync(imageFile);
            pdfDeletedCount++;
            console.log(`   ✅ 삭제 완료`);
          } catch (error) {
            console.error(`   ❌ 삭제 실패: ${error.message}`);
            failCount++;
          }
          continue;
        }
        
        try {
          let newFileName;
          let outputPath;
          let contentType;
          let fileSize;
          
          // 동영상 파일 처리
          if (['.mp4', '.mov', '.avi', '.mkv', '.webm'].includes(ext)) {
            // 새 파일명 생성 (폴더명 포함)
            newFileName = generateNewFileName(originalFileName, actualCustomerName, j + 1, folderName);
            
            if (!newFileName) {
              // 패턴을 찾을 수 없으면 기본 파일명 사용 (한글 제거)
              const nameEn = folderName ? folderName.split('-')[0] : initials;
              let baseName = path.basename(originalFileName, ext).replace(/_ok/g, '');
              
              // 고객 이름 제거 (한글 및 영문 모두)
              const customerNameEn = translateKoreanToEnglish(actualCustomerName).toLowerCase();
              baseName = baseName
                .replace(new RegExp('^' + escapeRegex(actualCustomerName) + '_', 'i'), '')
                .replace(new RegExp('^' + escapeRegex(customerNameEn) + '_', 'i'), '')
                .replace(/^_+|_+$/g, '')
                .trim();
              
              // 한글을 영문으로 변환
              let baseNameEn = translateKoreanToEnglish(baseName)
                .replace(/[가-힣]/g, '') // 남은 한글 제거
                .replace(/[^a-z0-9-]/g, '-') // 특수문자 제거
                .replace(/-+/g, '-')
                .replace(/^-|-$/g, '')
                .toLowerCase();
              
              // 변환이 실패하면 기본값 사용
              if (!baseNameEn || baseNameEn.trim() === '') {
                baseNameEn = 'video';
              }
              
              newFileName = `${nameEn}_${baseNameEn}_${String(j + 1).padStart(2, '0')}${ext}`;
              console.log(`   ⚠️  패턴을 찾을 수 없어 기본 파일명 사용: ${newFileName}`);
            }
            
            outputPath = path.join(outputDir, newFileName);
            
            // 동영상은 복사만 (변환 없음)
            fs.copyFileSync(imageFile, outputPath);
            
            contentType = `video/${ext.slice(1)}`;
            const stats = fs.statSync(outputPath);
            fileSize = stats.size;
            
          // 이미지 파일 처리
          } else {
            // 새 파일명 생성 (폴더명 포함)
            newFileName = generateNewFileName(originalFileName, actualCustomerName, j + 1, folderName);
            
            if (!newFileName) {
              // 패턴을 찾을 수 없으면 기본 파일명 사용 (한글 제거)
              const nameEn = folderName ? folderName.split('-')[0] : initials;
              let baseName = path.basename(originalFileName, ext).replace(/_ok/g, '');
              
              // 고객 이름 제거 (한글 및 영문 모두)
              const customerNameEn = translateKoreanToEnglish(actualCustomerName).toLowerCase();
              baseName = baseName
                .replace(new RegExp('^' + escapeRegex(actualCustomerName) + '_', 'i'), '')
                .replace(new RegExp('^' + escapeRegex(customerNameEn) + '_', 'i'), '')
                .replace(/^_+|_+$/g, '')
                .trim();
              
              // 한글을 영문으로 변환
              let baseNameEn = translateKoreanToEnglish(baseName)
                .replace(/[가-힣]/g, '') // 남은 한글 제거
                .replace(/[^a-z0-9-]/g, '-') // 특수문자 제거
                .replace(/-+/g, '-')
                .replace(/^-|-$/g, '')
                .toLowerCase();
              
              // 변환이 실패하면 기본값 사용
              if (!baseNameEn || baseNameEn.trim() === '') {
                baseNameEn = 'image';
              }
              
              newFileName = `${nameEn}_${baseNameEn}_${String(j + 1).padStart(2, '0')}.webp`;
              console.log(`   ⚠️  패턴을 찾을 수 없어 기본 파일명 사용: ${newFileName}`);
            }
            
            // WebP 변환
            outputPath = path.join(outputDir, newFileName);
            const convertResult = await convertToWebP(imageFile, outputPath);
            
            if (!convertResult.success) {
              console.log(`   ❌ 변환 실패: ${originalFileName}`);
              failCount++;
              continue;
            }
            
            contentType = 'image/webp';
            fileSize = convertResult.convertedSize;
          }
          
          // 방문일자 추출 (파일 경로에서)
          let visitDate = '2023-01-01'; // 기본값
          const pathParts = imageFile.split(path.sep);
          // 경로에서 날짜 패턴 찾기
          for (const part of pathParts) {
            // 2023.05.17.황인석 형식
            const dateMatch = part.match(/^(\d{4})\.(\d{1,2})\.(\d{1,2})\./);
            if (dateMatch) {
              const year = dateMatch[1];
              const month = dateMatch[2].padStart(2, '0');
              const day = dateMatch[3].padStart(2, '0');
              visitDate = `${year}-${month}-${day}`;
              break;
            }
            // YYYY-MM-DD 또는 YYYY/MM/DD 형식
            const dateMatch2 = part.match(/(\d{4})[-\/](\d{1,2})[-\/](\d{1,2})/);
            if (dateMatch2) {
              const year = dateMatch2[1];
              const month = dateMatch2[2].padStart(2, '0');
              const day = dateMatch2[3].padStart(2, '0');
              visitDate = `${year}-${month}-${day}`;
              break;
            }
            // "2023" 같은 연도만 있는 경우
            if (/^\d{4}$/.test(part) && parseInt(part) >= 2020 && parseInt(part) <= 2030) {
              visitDate = `${part}-01-01`;
            }
          }
          
          const folderPath = `originals/customers/${folderName}/${visitDate}`;
          const storagePath = `${folderPath}/${newFileName}`;
          
          // 업로드 (동영상은 다른 함수 사용)
          let url;
          if (['.mp4', '.mov', '.avi', '.mkv', '.webm'].includes(ext)) {
            const fileBuffer = fs.readFileSync(outputPath);
            const { data: uploadData, error: uploadError } = await supabase.storage
              .from(bucketName)
              .upload(storagePath, fileBuffer, {
                contentType,
                upsert: true
              });
            
            if (uploadError) {
              throw uploadError;
            }
            
            const { data: { publicUrl } } = supabase.storage
              .from(bucketName)
              .getPublicUrl(storagePath);
            url = publicUrl;
          } else {
            url = await uploadImage(outputPath, storagePath);
          }
          
          // 패턴 추출
          const pattern = extractPattern(originalFileName, customerName);
          
          // 메타데이터 저장
          await saveMetadata({
            customerId: customerInfo.id,
            customerName: actualCustomerName, // DB 이름 사용
            customerNameEn: nameEn,
            customerInitials: initials,
            customerPhone: customerInfo.phone,
            originalFileName,
            englishFileName: newFileName,
            url,
            folderPath,
            visitDate,
            scene: pattern?.scene || 1,
            type: pattern?.english || 'unknown',
            fileSize: fileSize // 동영상과 이미지 모두 fileSize 변수 사용
          });
          
          uploadCount++;
          console.log(`   ✅ ${j + 1}/${imageFiles.length}: ${newFileName}`);
          
        } catch (error) {
          console.log(`   ❌ 업로드 실패: ${originalFileName} - ${error.message}`);
          failCount++;
        }
      }
      
      console.log(`   📊 완료: 성공 ${uploadCount}개, 실패 ${failCount}개`);
      
      results.success++;
      results.details.push({
        customerName,
        dbName: actualCustomerName,
        customerId: customerInfo.id,
        status: 'success',
        uploaded: uploadCount,
        failed: failCount
      });
      
    } catch (error) {
      console.error(`   ❌ 오류: ${error.message}`);
      results.failed++;
      results.details.push({
        customerName,
        status: 'failed',
        error: error.message
      });
    }
  }
  
  // 최종 리포트
  console.log(`\n${'='.repeat(60)}`);
  console.log('📊 마이그레이션 완료!');
  console.log('='.repeat(60));
  console.log(`총 고객: ${results.total}명`);
  console.log(`성공: ${results.success}명`);
  console.log(`실패: ${results.failed}명`);
  console.log(`스킵: ${results.skipped}명`);
  console.log(`\n상세 결과는 migrated2/all-customers-results.json에 저장되었습니다.`);
  
  // 결과 저장
  const resultsFile = path.join(process.cwd(), 'migrated2', 'all-customers-results.json');
  fs.writeFileSync(resultsFile, JSON.stringify(results, null, 2));
}

// 실행
if (require.main === module) {
  migrateAllCustomers().catch(console.error);
}

module.exports = { migrateAllCustomers };
