/**
 * 박성우 고객 이미지 마이그레이션 스크립트
 * 
 * 방문일: 2024.09.09
 * 파일:
 * - 가이드와 만남 1장 (HEIC)
 * - 아트월 3장 (HEIC)
 * 총 4개 파일
 * WebP 변환 후 업로드
 */

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

// 환경 변수
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const bucketName = 'blog-images';

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Supabase 환경 변수가 설정되지 않았습니다.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// 고객 정보
const CUSTOMER_INFO = {
  name: '박성우',
  phone: '010-9068-6003',
  visitDate: '2024-09-09',
  folderName: 'parksungwoo-6003',
  nameEn: 'parksungwoo',
  initials: 'PSW'
};

// 파일 정보 (폴더에서 확인된 파일명 기준)
const FILES = [
  {
    originalFileName: 'park_seongwoo_0909_01.HEIC',
    type: 'image',
    scene: 4, // 가이드와 만남
    imageType: 'guide-meeting'
  },
  {
    originalFileName: 'park_seongwoo_0909_02.HEIC',
    type: 'image',
    scene: 5, // 아트월
    imageType: 'art-wall'
  },
  {
    originalFileName: 'park_seongwoo_0909_03.HEIC',
    type: 'image',
    scene: 5, // 아트월
    imageType: 'art-wall'
  },
  {
    originalFileName: 'park_seongwoo_0909_04.HEIC',
    type: 'image',
    scene: 5, // 아트월
    imageType: 'art-wall'
  }
];

// 로컬 폴더 경로
const LOCAL_FOLDER_PATH = path.join(
  process.env.HOME || '/Users/m2',
  'MASLABS',
  '00.blog_customers',
  '2024',
  '2024.09.09.박성우'
);

/**
 * 고객 ID 조회
 */
async function findCustomerId() {
  const { data, error } = await supabase
    .from('customers')
    .select('id, name, phone, folder_name')
    .or(`name.eq.${CUSTOMER_INFO.name},phone.eq.${CUSTOMER_INFO.phone}`)
    .limit(1)
    .single();

  if (error || !data) {
    console.error('❌ 고객 정보를 찾을 수 없습니다:', error);
    return null;
  }

  console.log(`✅ 고객 정보 확인: ${data.name} (ID: ${data.id}, 폴더: ${data.folder_name || '없음'})`);
  return data;
}

/**
 * 파일명을 영문으로 변환
 */
function generateEnglishFileName(originalFileName, customerNameEn, type, imageType, index) {
  // HEIC 파일은 원본 확장자 유지 (WebP 변환 실패 시)
  const ext = path.extname(originalFileName).toLowerCase();
  const baseName = path.basename(originalFileName, ext);
  
  // 파일명 생성: {customerNameEn}_s{scene}_{imageType}_{index}.{ext}
  // 예: parksungwoo_s4_guide-meeting_01.heic, parksungwoo_s5_art-wall_01.heic
  const scene = imageType === 'guide-meeting' ? 4 : 5;
  const paddedIndex = String(index).padStart(2, '0');
  
  return `${customerNameEn}_s${scene}_${imageType}_${paddedIndex}${ext}`;
}

/**
 * 이미지 업로드
 */
async function uploadImage(filePath, storagePath) {
  try {
    const fileBuffer = fs.readFileSync(filePath);
    const fileExt = path.extname(filePath).toLowerCase();
    const contentType = fileExt === '.heic' || fileExt === '.heif' ? 'image/heic' :
                       fileExt === '.jpeg' || fileExt === '.jpg' ? 'image/jpeg' :
                       fileExt === '.png' ? 'image/png' :
                       fileExt === '.mov' ? 'video/quicktime' :
                       fileExt === '.mp4' ? 'video/mp4' :
                       'application/octet-stream';

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
  } catch (error) {
    console.error(`❌ 업로드 실패 (${path.basename(filePath)}):`, error.message);
    throw error;
  }
}

/**
 * 메타데이터 저장
 */
async function saveMetadata(imageData, customerInfo) {
  const metadataPayload = {
    image_url: imageData.url,
    folder_path: imageData.folderPath,
    date_folder: CUSTOMER_INFO.visitDate,
    source: 'customer',
    channel: 'customer',
    title: `${customerInfo.name} - ${CUSTOMER_INFO.visitDate}`,
    alt_text: `${customerInfo.name} 고객 이미지 (${CUSTOMER_INFO.visitDate}) - ${imageData.imageType === 'guide-meeting' ? '가이드와 만남' : '아트월'}`,
    file_size: imageData.fileSize || null,
    tags: [`customer-${customerInfo.id}`, `visit-${CUSTOMER_INFO.visitDate}`],
    story_scene: imageData.scene || null,
    image_type: imageData.imageType || null,
    original_filename: imageData.originalFileName || null,
    english_filename: imageData.englishFileName || null,
    customer_name_en: CUSTOMER_INFO.nameEn || null,
    customer_initials: CUSTOMER_INFO.initials || null,
    image_quality: 'final',
    upload_source: 'customer-migration',
    updated_at: new Date().toISOString(),
    metadata: {
      visitDate: CUSTOMER_INFO.visitDate,
      customerName: customerInfo.name,
      customerPhone: customerInfo.phone || null,
      englishFileName: imageData.englishFileName,
      originalFileName: imageData.originalFileName,
      scene: imageData.scene,
      type: imageData.imageType,
      customerNameEn: CUSTOMER_INFO.nameEn,
      customerInitials: CUSTOMER_INFO.initials
    }
  };

  const { data, error } = await supabase
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
  const updateData = {};
  if (nameEn) updateData.name_en = nameEn;
  if (initials) updateData.initials = initials;
  if (folderName) updateData.folder_name = folderName;

  if (Object.keys(updateData).length === 0) {
    return;
  }

  const { error } = await supabase
    .from('customers')
    .update(updateData)
    .eq('id', customerId);

  if (error) {
    console.warn('⚠️ 고객 정보 업데이트 실패:', error.message);
  } else {
    console.log(`✅ 고객 정보 업데이트 완료: ${JSON.stringify(updateData)}`);
  }
}

/**
 * 메인 마이그레이션 함수
 */
async function migrateCustomerImages() {
  console.log('🚀 박성우 고객 이미지 마이그레이션 시작...\n');
  console.log(`📁 로컬 폴더: ${LOCAL_FOLDER_PATH}\n`);

  // 1. 고객 정보 조회
  const customerInfo = await findCustomerId();
  if (!customerInfo) {
    console.error('❌ 고객 정보를 찾을 수 없어 마이그레이션을 중단합니다.');
    return;
  }

  // 2. 폴더 존재 확인
  if (!fs.existsSync(LOCAL_FOLDER_PATH)) {
    console.error(`❌ 폴더가 존재하지 않습니다: ${LOCAL_FOLDER_PATH}`);
    return;
  }

  // 3. 파일 확인
  const existingFiles = fs.readdirSync(LOCAL_FOLDER_PATH);
  console.log(`📋 폴더 내 파일 목록 (${existingFiles.length}개):`);
  existingFiles.forEach(file => console.log(`  - ${file}`));
  console.log('');

  // 4. 각 파일 처리
  let successCount = 0;
  let failCount = 0;
  const typeCounts = { 'guide-meeting': 0, 'art-wall': 0 };

  for (let i = 0; i < FILES.length; i++) {
    const fileInfo = FILES[i];
    const localFilePath = path.join(LOCAL_FOLDER_PATH, fileInfo.originalFileName);

    // 파일 존재 확인
    if (!fs.existsSync(localFilePath)) {
      console.warn(`⚠️ 파일을 찾을 수 없습니다: ${fileInfo.originalFileName}`);
      failCount++;
      continue;
    }

    try {
      console.log(`\n📤 [${i + 1}/${FILES.length}] 처리 중: ${fileInfo.originalFileName}`);
      console.log(`   타입: ${fileInfo.type}, 장면: ${fileInfo.scene}, 이미지 타입: ${fileInfo.imageType}`);

      // 영문 파일명 생성
      typeCounts[fileInfo.imageType] = (typeCounts[fileInfo.imageType] || 0) + 1;
      const englishFileName = generateEnglishFileName(
        fileInfo.originalFileName,
        CUSTOMER_INFO.nameEn,
        fileInfo.type,
        fileInfo.imageType,
        typeCounts[fileInfo.imageType]
      );

      // Storage 경로 생성
      const dateFolder = CUSTOMER_INFO.visitDate.replace(/-/g, '.');
      const storagePath = `originals/customers/${CUSTOMER_INFO.folderName}/${dateFolder}/${englishFileName}`;
      const folderPath = `originals/customers/${CUSTOMER_INFO.folderName}/${dateFolder}`;

      console.log(`   영문 파일명: ${englishFileName}`);
      console.log(`   Storage 경로: ${storagePath}`);

      // 파일 업로드 (HEIC 원본 그대로)
      const fileStats = fs.statSync(localFilePath);
      const publicUrl = await uploadImage(localFilePath, storagePath);
      console.log(`   ✅ 업로드 완료: ${publicUrl}`);

      // 메타데이터 저장
      const imageData = {
        url: publicUrl,
        folderPath: folderPath,
        fileSize: fileStats.size,
        originalFileName: fileInfo.originalFileName,
        englishFileName: englishFileName,
        type: fileInfo.type,
        scene: fileInfo.scene,
        imageType: fileInfo.imageType
      };

      const metadata = await saveMetadata(imageData, customerInfo);
      console.log(`   ✅ 메타데이터 저장 완료 (ID: ${metadata.id})`);

      successCount++;
    } catch (error) {
      console.error(`   ❌ 처리 실패: ${error.message}`);
      failCount++;
    }
  }

  // 6. 고객 정보 업데이트
  await updateCustomerInfo(
    customerInfo.id,
    CUSTOMER_INFO.nameEn,
    CUSTOMER_INFO.initials,
    CUSTOMER_INFO.folderName
  );

  // 7. 결과 요약
  console.log('\n' + '='.repeat(60));
  console.log('📊 마이그레이션 결과 요약');
  console.log('='.repeat(60));
  console.log(`✅ 성공: ${successCount}개`);
  console.log(`❌ 실패: ${failCount}개`);
  console.log(`📁 타입별: 가이드와 만남 ${typeCounts['guide-meeting']}개, 아트월 ${typeCounts['art-wall']}개`);
  console.log('='.repeat(60));
}

// 실행
migrateCustomerImages()
  .then(() => {
    console.log('\n✅ 마이그레이션 완료');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ 마이그레이션 중 오류 발생:', error);
    process.exit(1);
  });
