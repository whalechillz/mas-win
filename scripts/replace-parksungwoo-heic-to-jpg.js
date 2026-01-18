/**
 * 박성우 고객 HEIC 이미지 삭제 후 JPG 재업로드 스크립트
 * 
 * 1. 기존 HEIC 이미지 삭제 (Storage + 메타데이터)
 * 2. 로컬 JPG 파일 확인 및 업로드
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
  initials: 'PSW',
  customerId: 2398
};

// 삭제할 HEIC 이미지 메타데이터 ID
const HEIC_IMAGE_IDS = [64662, 64663, 64664, 64665];

// 로컬 폴더 경로
const LOCAL_FOLDER_PATH = path.join(
  process.env.HOME || '/Users/m2',
  'MASLABS',
  '00.blog_customers',
  '2024',
  '2024.09.09.박성우'
);

/**
 * HEIC 이미지 삭제 (Storage + 메타데이터)
 */
async function deleteHeicImages() {
  console.log('🗑️  HEIC 이미지 삭제 시작...\n');

  for (const imageId of HEIC_IMAGE_IDS) {
    try {
      // 메타데이터 조회
      const { data: imageData, error: fetchError } = await supabase
        .from('image_metadata')
        .select('image_url, folder_path, english_filename')
        .eq('id', imageId)
        .single();

      if (fetchError || !imageData) {
        console.warn(`⚠️  이미지 메타데이터를 찾을 수 없습니다 (ID: ${imageId})`);
        continue;
      }

      console.log(`📋 삭제 대상: ${imageData.english_filename || '알 수 없음'}`);

      // Storage에서 파일 삭제
      const storagePath = imageData.image_url.replace(
        `${supabaseUrl}/storage/v1/object/public/${bucketName}/`,
        ''
      );

      const { error: storageError } = await supabase.storage
        .from(bucketName)
        .remove([storagePath]);

      if (storageError) {
        console.warn(`⚠️  Storage 삭제 실패 (${storagePath}): ${storageError.message}`);
      } else {
        console.log(`   ✅ Storage 삭제 완료: ${storagePath}`);
      }

      // 메타데이터 삭제
      const { error: deleteError } = await supabase
        .from('image_metadata')
        .delete()
        .eq('id', imageId);

      if (deleteError) {
        console.warn(`⚠️  메타데이터 삭제 실패 (ID: ${imageId}): ${deleteError.message}`);
      } else {
        console.log(`   ✅ 메타데이터 삭제 완료 (ID: ${imageId})`);
      }
    } catch (error) {
      console.error(`❌ 삭제 중 오류 (ID: ${imageId}): ${error.message}`);
    }
  }

  console.log('\n✅ HEIC 이미지 삭제 완료\n');
}

/**
 * 파일명을 영문으로 변환
 */
function generateEnglishFileName(originalFileName, customerNameEn, imageType, index) {
  const ext = '.jpg'; // JPG로 업로드
  const baseName = path.basename(originalFileName, path.extname(originalFileName));
  
  // 파일명 생성: {customerNameEn}_s{scene}_{imageType}_{index}.jpg
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
    const contentType = fileExt === '.jpg' || fileExt === '.jpeg' ? 'image/jpeg' :
                       fileExt === '.png' ? 'image/png' :
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
async function saveMetadata(imageData) {
  const metadataPayload = {
    image_url: imageData.url,
    folder_path: imageData.folderPath,
    date_folder: CUSTOMER_INFO.visitDate,
    source: 'customer',
    channel: 'customer',
    title: `${CUSTOMER_INFO.name} - ${CUSTOMER_INFO.visitDate}`,
    alt_text: `${CUSTOMER_INFO.name} 고객 이미지 (${CUSTOMER_INFO.visitDate}) - ${imageData.imageType === 'guide-meeting' ? '가이드와 만남' : '아트월'}`,
    file_size: imageData.fileSize || null,
    tags: [`customer-${CUSTOMER_INFO.customerId}`, `visit-${CUSTOMER_INFO.visitDate}`],
    story_scene: imageData.scene || null,
    image_type: imageData.imageType || null,
    original_filename: imageData.originalFileName || null,
    english_filename: imageData.englishFileName || null,
    customer_name_en: CUSTOMER_INFO.nameEn || null,
    customer_initials: CUSTOMER_INFO.initials || null,
    image_quality: 'final',
    upload_source: 'customer-migration-replace',
    updated_at: new Date().toISOString(),
    metadata: {
      visitDate: CUSTOMER_INFO.visitDate,
      customerName: CUSTOMER_INFO.name,
      customerPhone: CUSTOMER_INFO.phone || null,
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
 * JPG 파일 업로드
 */
async function uploadJpgFiles() {
  console.log('📤 JPG 파일 업로드 시작...\n');

  // 로컬 폴더 확인
  if (!fs.existsSync(LOCAL_FOLDER_PATH)) {
    console.error(`❌ 폴더가 존재하지 않습니다: ${LOCAL_FOLDER_PATH}`);
    return;
  }

  // JPG 파일 찾기
  const files = fs.readdirSync(LOCAL_FOLDER_PATH)
    .filter(file => {
      const ext = path.extname(file).toLowerCase();
      return ['.jpg', '.jpeg'].includes(ext);
    })
    .sort();

  if (files.length === 0) {
    console.error('❌ JPG 파일을 찾을 수 없습니다.');
    console.log('💡 HEIC 파일을 JPG로 변환해야 할 수도 있습니다.');
    return;
  }

  console.log(`📋 발견된 JPG 파일: ${files.length}개\n`);

  // 파일 매핑 (순서대로)
  const fileMapping = [
    { originalFileName: files[0] || null, scene: 4, imageType: 'guide-meeting' },
    { originalFileName: files[1] || null, scene: 5, imageType: 'art-wall' },
    { originalFileName: files[2] || null, scene: 5, imageType: 'art-wall' },
    { originalFileName: files[3] || null, scene: 5, imageType: 'art-wall' }
  ];

  let successCount = 0;
  let failCount = 0;
  const typeCounts = { 'guide-meeting': 0, 'art-wall': 0 };

  for (let i = 0; i < fileMapping.length; i++) {
    const fileInfo = fileMapping[i];
    
    if (!fileInfo.originalFileName) {
      console.warn(`⚠️  파일 ${i + 1}이 없어 스킵합니다.`);
      continue;
    }

    const localFilePath = path.join(LOCAL_FOLDER_PATH, fileInfo.originalFileName);

    if (!fs.existsSync(localFilePath)) {
      console.warn(`⚠️  파일을 찾을 수 없습니다: ${fileInfo.originalFileName}`);
      failCount++;
      continue;
    }

    try {
      console.log(`\n📤 [${i + 1}/${fileMapping.length}] 처리 중: ${fileInfo.originalFileName}`);
      console.log(`   장면: ${fileInfo.scene}, 이미지 타입: ${fileInfo.imageType}`);

      // 영문 파일명 생성
      typeCounts[fileInfo.imageType] = (typeCounts[fileInfo.imageType] || 0) + 1;
      const englishFileName = generateEnglishFileName(
        fileInfo.originalFileName,
        CUSTOMER_INFO.nameEn,
        fileInfo.imageType,
        typeCounts[fileInfo.imageType]
      );

      // Storage 경로 생성
      const dateFolder = CUSTOMER_INFO.visitDate.replace(/-/g, '.');
      const storagePath = `originals/customers/${CUSTOMER_INFO.folderName}/${dateFolder}/${englishFileName}`;
      const folderPath = `originals/customers/${CUSTOMER_INFO.folderName}/${dateFolder}`;

      console.log(`   영문 파일명: ${englishFileName}`);
      console.log(`   Storage 경로: ${storagePath}`);

      // 파일 업로드
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
        type: 'image',
        scene: fileInfo.scene,
        imageType: fileInfo.imageType
      };

      const metadata = await saveMetadata(imageData);
      console.log(`   ✅ 메타데이터 저장 완료 (ID: ${metadata.id})`);

      successCount++;
    } catch (error) {
      console.error(`   ❌ 처리 실패: ${error.message}`);
      failCount++;
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('📊 업로드 결과 요약');
  console.log('='.repeat(60));
  console.log(`✅ 성공: ${successCount}개`);
  console.log(`❌ 실패: ${failCount}개`);
  console.log(`📁 타입별: 가이드와 만남 ${typeCounts['guide-meeting']}개, 아트월 ${typeCounts['art-wall']}개`);
  console.log('='.repeat(60));
}

/**
 * 메인 실행 함수
 */
async function main() {
  console.log('🚀 박성우 고객 HEIC → JPG 교체 시작...\n');
  console.log(`📁 로컬 폴더: ${LOCAL_FOLDER_PATH}\n`);

  // 1. HEIC 이미지 삭제
  await deleteHeicImages();

  // 2. JPG 파일 업로드
  await uploadJpgFiles();

  console.log('\n✅ 교체 완료');
}

// 실행
main()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ 오류 발생:', error);
    process.exit(1);
  });
