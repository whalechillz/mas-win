/**
 * 실패한 파일 재업로드 스크립트
 * 마이그레이션 V3에서 실패한 3개 파일 재업로드
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

// 실패한 파일 목록
const failedFiles = [
  {
    customerName: '하종천',
    originalFileName: '하종천_시타상담.jpeg',
    expectedNewFileName: 'hajotcheon_s4_swing-consultation_02.webp'
  },
  {
    customerName: '강성동',
    originalFileName: '강성동_측정_214-3m.jpg',
    expectedNewFileName: 'kangseotdot_s4_measurement_01.webp'
  },
  {
    customerName: '김가영',
    originalFileName: '김가영_시타장면_02.jpg',
    expectedNewFileName: 'kimgayeot_s3_swing-scene_02.webp'
  }
];

/**
 * NFD(정규화된) 한글을 NFC(조합된) 형식으로 변환
 */
function normalizeKorean(text) {
  if (!text) return text;
  return text.normalize('NFC');
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
 * 파일명에서 패턴 추출
 */
function extractPattern(fileName, customerName) {
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
    '측정': 'measurement',
    '아트월': 'art-wall',
    '히어로': 'hero',
    '사인': 'signature',
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

  let nameWithoutExt = fileName.replace(/\.[^/.]+$/, '');
  nameWithoutExt = normalizeKorean(nameWithoutExt);
  
  const customerNameEn = translateKoreanToEnglish(customerName).toLowerCase();
  const customerNameKr = customerName;
  
  nameWithoutExt = nameWithoutExt
    .replace(new RegExp('^' + escapeRegex(customerNameKr) + '_', 'i'), '')
    .replace(new RegExp('^' + escapeRegex(customerNameEn) + '_', 'i'), '')
    .replace(/^_+|_+$/g, '')
    .trim();

  const sortedPatterns = Object.keys(FILENAME_PATTERN_MAP).sort((a, b) => b.length - a.length);
  
  for (const pattern of sortedPatterns) {
    if (nameWithoutExt.includes(pattern)) {
      return {
        pattern,
        english: FILENAME_PATTERN_MAP[pattern],
        scene: STORY_SCENE_MAP[pattern] || 1
      };
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
    upload_source: 'customer-migration-retry',
    metadata: {
      visitDate: imageData.visitDate,
      customerName: imageData.customerName,
      customerPhone: imageData.customerPhone,
      englishFileName: imageData.englishFileName,
      originalFileName: imageData.originalFileName,
      scene: imageData.scene || 1,
      type: imageData.type || 'unknown',
      customerNameEn: imageData.customerNameEn,
      customerInitials: imageData.customerInitials
    },
    updated_at: new Date().toISOString()
  };

  const { data, error } = await supabase
    .from('image_metadata')
    .upsert(metadataPayload, {
      onConflict: 'image_url',
      ignoreDuplicates: false
    })
    .select();

  if (error) {
    throw error;
  }

  return data;
}

/**
 * 파일 찾기
 */
function findFile(customerName, fileName) {
  const normalizedName = normalizeKorean(customerName);
  const normalizedFileName = normalizeKorean(fileName);
  
  function searchDir(dir) {
    if (!fs.existsSync(dir)) return null;
    
    const items = fs.readdirSync(dir);
    
    for (const item of items) {
      const fullPath = path.join(dir, item);
      
      try {
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory()) {
          // 날짜 폴더 패턴 확인
          const yearMatch = item.match(/^(202[2-6])\.(\d{1,2})\.(\d{1,2})\.(.+)$/);
          if (yearMatch) {
            const folderContent = yearMatch[4];
            const folderName = normalizeKorean(folderContent.replace(/[-]\s*0\d{2}[-]\d{3,4}[-]\d{4}.*$/, '').trim());
            
            // 고객 이름이 포함된 폴더인지 확인
            if (folderName === normalizedName || folderName.includes(normalizedName)) {
              const result = searchDir(fullPath);
              if (result) return result;
            }
          }
          
          // 연도 폴더는 재귀 탐색
          if (/^\d{4}$/.test(item)) {
            const result = searchDir(fullPath);
            if (result) return result;
          }
        } else if (stat.isFile()) {
          // 파일명 비교 (정규화 후)
          const itemName = normalizeKorean(item);
          if (itemName === normalizedFileName || itemName.includes(normalizedFileName.replace(/\.[^/.]+$/, ''))) {
            return {
              filePath: fullPath,
              fileName: item,
              dir: dir
            };
          }
        }
      } catch (e) {
        // 무시
      }
    }
    
    return null;
  }
  
  return searchDir(LOCAL_FOLDER);
}

/**
 * 메인 재업로드 함수
 */
async function retryFailedUploads() {
  console.log('🔄 실패한 파일 재업로드 시작...\n');
  
  let successCount = 0;
  let failCount = 0;
  
  for (let i = 0; i < failedFiles.length; i++) {
    const failedFile = failedFiles[i];
    console.log(`\n${'='.repeat(60)}`);
    console.log(`[${i + 1}/${failedFiles.length}] ${failedFile.customerName} - ${failedFile.originalFileName}`);
    console.log('='.repeat(60));
    
    try {
      // 고객 정보 조회
      const customerInfo = await findCustomerId(failedFile.customerName);
      if (!customerInfo) {
        console.log(`   ❌ 고객 정보를 찾을 수 없습니다: ${failedFile.customerName}`);
        failCount++;
        continue;
      }
      
      console.log(`   ✅ 고객 정보: ID ${customerInfo.id}, 전화번호: ${customerInfo.phone || '없음'}`);
      
      // 파일 찾기
      const fileInfo = findFile(failedFile.customerName, failedFile.originalFileName);
      if (!fileInfo) {
        console.log(`   ❌ 파일을 찾을 수 없습니다: ${failedFile.originalFileName}`);
        failCount++;
        continue;
      }
      
      console.log(`   ✅ 파일 찾음: ${fileInfo.filePath}`);
      
      // 방문일자 추출
      let visitDate = '2023-01-01';
      const pathParts = fileInfo.filePath.split(path.sep);
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
      
      console.log(`   📅 방문일자: ${visitDate}`);
      
      // 폴더명 생성
      const nameEn = customerInfo.name_en || translateKoreanToEnglish(customerInfo.name);
      const cleanNameEn = nameEn.replace(/[^a-z0-9]/g, '').toLowerCase();
      const phoneLast4 = customerInfo.phone ? customerInfo.phone.replace(/[^0-9]/g, '').slice(-4) : String(customerInfo.id).padStart(4, '0');
      const folderName = `${cleanNameEn}-${phoneLast4}`;
      
      // 패턴 추출
      const pattern = extractPattern(failedFile.originalFileName, customerInfo.name);
      const number = extractNumber(failedFile.originalFileName) || 1;
      
      // 새 파일명 생성
      const ext = path.extname(failedFile.originalFileName).toLowerCase();
      const newFileName = pattern 
        ? `${cleanNameEn}_s${pattern.scene}_${pattern.english}_${String(number).padStart(2, '0')}.webp`
        : failedFile.expectedNewFileName;
      
      console.log(`   📝 새 파일명: ${newFileName}`);
      
      // WebP 변환
      const outputDir = path.join(process.cwd(), 'migrated2', folderName, visitDate);
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }
      
      const outputPath = path.join(outputDir, newFileName);
      const convertResult = await convertToWebP(fileInfo.filePath, outputPath);
      
      if (!convertResult.success) {
        console.log(`   ❌ WebP 변환 실패: ${convertResult.error}`);
        failCount++;
        continue;
      }
      
      console.log(`   ✅ WebP 변환 완료: ${convertResult.convertedSize} bytes`);
      
      // 업로드
      const folderPath = `originals/customers/${folderName}/${visitDate}`;
      const storagePath = `${folderPath}/${newFileName}`;
      
      console.log(`   📤 업로드 중: ${storagePath}`);
      const url = await uploadImage(outputPath, storagePath);
      console.log(`   ✅ 업로드 완료: ${url}`);
      
      // 메타데이터 저장
      await saveMetadata({
        customerId: customerInfo.id,
        customerName: customerInfo.name,
        customerNameEn: nameEn,
        customerInitials: customerInfo.initials || translateKoreanToEnglish(customerInfo.name).substring(0, 2).toLowerCase(),
        customerPhone: customerInfo.phone,
        originalFileName: failedFile.originalFileName,
        englishFileName: newFileName,
        url,
        folderPath,
        visitDate,
        scene: pattern?.scene || 1,
        type: pattern?.english || 'unknown',
        fileSize: convertResult.convertedSize
      });
      
      console.log(`   ✅ 메타데이터 저장 완료`);
      successCount++;
      
    } catch (error) {
      console.log(`   ❌ 오류: ${error.message}`);
      failCount++;
    }
  }
  
  console.log(`\n${'='.repeat(60)}`);
  console.log('📊 재업로드 완료!');
  console.log(`   성공: ${successCount}개`);
  console.log(`   실패: ${failCount}개`);
  console.log('='.repeat(60));
}

// 실행
if (require.main === module) {
  retryFailedUploads().catch(console.error);
}

module.exports = { retryFailedUploads };
