/**
 * 스킵된 고객 - 임태희 마이그레이션 스크립트
 * 2024.09.29.임태희 폴더의 이미지 및 블로그 마이그레이션
 * 방문일: 2024-09-29
 */

const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const { createClient } = require('@supabase/supabase-js');
const { translateKoreanToEnglish } = require('../lib/korean-to-english-translator');
const iconv = require('iconv-lite');
const chardet = require('chardet');
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
const CUSTOMER_NAME = '임태희';
const FOLDER_PATH = '/Users/m2/MASLABS/00.blog_customers/2024/2024.09.29.임태희';
const VISIT_DATE = '2024-09-29'; // 방문일: 9월 29일

// 파일명 매핑 (수동 분류)
// massgoo-golf-review-01.jpeg ~ 06.jpeg 중:
// 01, 02: 고객 사진 (hero)
// 03, 04: 사인 (signature)
// 05: 매장 사진 (store/art-wall)
// 06: 시타 사진 (swing-consultation)
const FILE_MAPPING = {
  'massgoo-golf-review-01.jpeg': { type: 'hero', scene: 1 }, // 고객 사진 1
  'massgoo-golf-review-02.jpeg': { type: 'hero', scene: 1 }, // 고객 사진 2
  'massgoo-golf-review-03.jpeg': { type: 'signature', scene: 7 }, // 사인 1
  'massgoo-golf-review-04.jpeg': { type: 'signature', scene: 7 }, // 사인 2
  'massgoo-golf-review-05.jpeg': { type: 'art-wall', scene: 5 }, // 매장 사진
  'massgoo-golf-review-06.jpeg': { type: 'swing-consultation', scene: 4 }, // 시타 사진
};

// 블로그 MD 파일 목록
const BLOG_FILES = [
  '2024.10.04.massgoo-golf-blog-post.md',
  '2024.10.04.naver-blog-post-jeypro-revised.md'
];

/**
 * NFD(정규화된) 한글을 NFC(조합된) 형식으로 변환
 */
function normalizeKorean(text) {
  if (!text) return text;
  return text.normalize('NFC');
}

/**
 * 파일명에서 번호 추출
 */
function extractNumber(fileName) {
  const match = fileName.match(/-(\d{2})\./);
  if (match) {
    return parseInt(match[1], 10);
  }
  return 1;
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
    upload_source: imageData.uploadSource || 'customer-migration-skipped',
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

/**
 * 블로그 MD 파일 읽기 (인코딩 자동 감지)
 */
function readBlogFile(filePath) {
  try {
    if (!fs.existsSync(filePath)) {
      console.warn(`   ⚠️  파일 없음: ${filePath}`);
      return null;
    }
    
    const buffer = fs.readFileSync(filePath);
    const detected = chardet.detect(buffer);
    const encoding = detected?.encoding || 'utf-8';
    
    console.log(`   📝 인코딩 감지: ${encoding}`);
    
    let content;
    if (encoding.toLowerCase().includes('euc-kr') || encoding.toLowerCase().includes('windows-949')) {
      content = iconv.decode(buffer, 'euc-kr');
    } else {
      content = buffer.toString('utf-8');
    }
    
    return normalizeKorean(content.trim());
  } catch (error) {
    console.error(`   ❌ 파일 읽기 오류 (${filePath}):`, error.message);
    return null;
  }
}

/**
 * 블로그 MD 파일을 customer_consultations에 저장
 */
async function saveBlogPost(customerId, filePath, fileName, blogDate) {
  const content = readBlogFile(filePath);
  
  if (!content) {
    return null;
  }
  
  // 파일명에서 제목 추출 (확장자 제거)
  const title = fileName.replace(/\.md$/, '').replace(/^\d{4}\.\d{2}\.\d{2}\./, '');
  
  // 첫 줄을 제목으로 사용 (마크다운 헤더 제거)
  const firstLine = content.split('\n')[0];
  const extractedTitle = firstLine.replace(/^#+\s*/, '').trim() || title;
  
  // 요약 추출 (첫 200자)
  const summary = content.split('\n').slice(0, 5).join(' ').substring(0, 200) + '...';
  
  const consultationData = {
    customer_id: customerId,
    consultation_date: blogDate,
    consultation_type: 'review',
    review_type: 'blog',
    topic: `블로그: ${title}`,
    content: content,
    review_rating: null,
    is_blog_ready: true,
    tags: ['블로그', '후기', '마이그레이션'],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
  
  const { data, error } = await supabase
    .from('customer_consultations')
    .insert(consultationData)
    .select()
    .single();
  
  if (error) {
    console.error(`   ❌ 블로그 저장 실패: ${error.message}`);
    return null;
  }
  
  return data;
}

/**
 * 메인 마이그레이션 함수
 */
async function migrateImtaehee() {
  console.log('🔄 임태희 고객 이미지 및 블로그 마이그레이션 시작...\n');
  
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
  
  // ========== 이미지 마이그레이션 ==========
  console.log('\n📸 이미지 마이그레이션 시작...\n');
  
  let uploadCount = 0;
  let failCount = 0;
  
  // 파일 목록 가져오기 (이미지만)
  const files = fs.readdirSync(FOLDER_PATH)
    .filter(file => {
      const ext = path.extname(file).toLowerCase();
      return ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp', '.heic', '.heif'].includes(ext);
    })
    .sort();
  
  console.log(`📸 발견된 이미지: ${files.length}개\n`);
  
  if (files.length === 0) {
    console.log('⏭️  이미지가 없어 스킵');
  } else {
    // 출력 디렉토리 생성
    const outputDir = path.join(process.cwd(), 'migrated3', folderName, VISIT_DATE);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    // 각 파일 처리
    for (let i = 0; i < files.length; i++) {
      const originalFileName = files[i];
      const originalFilePath = path.join(FOLDER_PATH, originalFileName);
      const ext = path.extname(originalFileName).toLowerCase();
      
      console.log(`\n[${i + 1}/${files.length}] ${originalFileName}`);
      
      try {
        // 파일명 정규화 (NFD -> NFC)
        const normalizedFileName = normalizeKorean(originalFileName);
        
        // 파일 매핑 확인
        let fileMapping = FILE_MAPPING[originalFileName] || FILE_MAPPING[normalizedFileName];
        
        // 매핑이 없으면 스킵
        if (!fileMapping) {
          console.log(`   ⚠️  매핑 정보가 없어 스킵: ${originalFileName}`);
          continue;
        }
        
        const { type, scene } = fileMapping;
        const number = extractNumber(originalFileName) || (i + 1);
        
        // 새 파일명 생성
        let newFileName;
        if (type === 'hero') {
          newFileName = `${cleanNameEn}_s${scene}_${type}_${String(number).padStart(2, '0')}.webp`;
        } else if (type === 'signature') {
          newFileName = `${cleanNameEn}_s${scene}_signature_${String(number).padStart(2, '0')}.webp`;
        } else if (type === 'art-wall') {
          newFileName = `${cleanNameEn}_s${scene}_art-wall_${String(number).padStart(2, '0')}.webp`;
        } else if (type === 'swing-consultation') {
          newFileName = `${cleanNameEn}_s${scene}_swing-consultation_${String(number).padStart(2, '0')}.webp`;
        } else {
          newFileName = `${cleanNameEn}_s${scene}_${type}_${String(number).padStart(2, '0')}.webp`;
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
          scene,
          type,
          fileSize: convertResult.convertedSize,
          uploadSource: 'customer-migration-skipped'
        });
        
        uploadCount++;
        console.log(`   ✅ 업로드 완료: ${newFileName} (${type}, scene ${scene})`);
        
      } catch (error) {
        console.log(`   ❌ 오류: ${error.message}`);
        failCount++;
      }
    }
    
    console.log(`\n📊 이미지 마이그레이션 완료!`);
    console.log(`   성공: ${uploadCount}개`);
    console.log(`   실패: ${failCount}개`);
  }
  
  // ========== 블로그 마이그레이션 ==========
  console.log('\n📝 블로그 마이그레이션 시작...\n');
  
  let blogCount = 0;
  let blogFailCount = 0;
  
  for (const blogFile of BLOG_FILES) {
    const blogFilePath = path.join(FOLDER_PATH, blogFile);
    
    console.log(`\n[${blogCount + 1}/${BLOG_FILES.length}] ${blogFile}`);
    
    try {
      // 블로그 날짜는 파일명에서 추출 (2024.10.04 -> 2024-10-04)
      const dateMatch = blogFile.match(/(\d{4})\.(\d{2})\.(\d{2})/);
      const blogDate = dateMatch ? `${dateMatch[1]}-${dateMatch[2]}-${dateMatch[3]}` : VISIT_DATE;
      
      const result = await saveBlogPost(customerInfo.id, blogFilePath, blogFile, blogDate);
      
      if (result) {
        blogCount++;
        console.log(`   ✅ 블로그 저장 완료: ${blogFile}`);
      } else {
        blogFailCount++;
      }
    } catch (error) {
      console.log(`   ❌ 블로그 저장 오류: ${error.message}`);
      blogFailCount++;
    }
  }
  
  console.log(`\n📊 블로그 마이그레이션 완료!`);
  console.log(`   성공: ${blogCount}개`);
  console.log(`   실패: ${blogFailCount}개`);
  
  // ========== 최종 요약 ==========
  console.log(`\n${'='.repeat(60)}`);
  console.log('✅ 임태희 고객 마이그레이션 완료!');
  console.log('='.repeat(60));
  console.log(`📸 이미지: 성공 ${uploadCount}개, 실패 ${failCount}개`);
  console.log(`📝 블로그: 성공 ${blogCount}개, 실패 ${blogFailCount}개`);
  console.log(`📁 폴더명: ${folderName}`);
  console.log(`📅 방문일: ${VISIT_DATE}`);
  console.log('='.repeat(60));
}

if (require.main === module) {
  migrateImtaehee().catch(console.error);
}

module.exports = { migrateImtaehee };
