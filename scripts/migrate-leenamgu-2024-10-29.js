/**
 * 이남구 고객 이미지 마이그레이션 스크립트 (2024.10.29)
 * 
 * 1. 이미지 (WebP 90% 품질):
 *    - 시타 4장 (장면 5)
 *    - 아트월 3장 (장면 5)
 *    - 측정 2장 (장면 5)
 *    - 사인 1장 (장면 7)
 * 2. 시타영상 2개 (장면 5)
 * 표준 로마자 표기법: 이남구 -> leenamgu
 */

const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
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
  name: '이남구',
  phone: '010-9170-8768',
  visitDate: '2024-10-29',
  nameEn: 'leenamgu', // 표준 로마자 표기법: 이 -> Lee, 남 -> Nam, 구 -> Gu
  initials: 'LNG'
};

// 로컬 폴더 경로
const LOCAL_FOLDER_PATH = path.join(
  process.env.HOME || '/Users/m2',
  'MASLABS',
  '00.blog_customers',
  '2024',
  '2024.10.29.이남구'
);

// 이미지 파일 매핑 (실제 파일명 확인 후 조정 필요)
const IMAGE_MAPPING = {
  // 시타 4장 (장면 5, swing)
  'silver-golfer-204m-drive-shot-00002.jpeg': { scene: 5, imageType: 'swing' },
  'silver-golfer-204m-drive-shot-00004.jpeg': { scene: 5, imageType: 'swing' },
  'silver-golfer-204m-drive-shot-00006.jpeg': { scene: 5, imageType: 'swing' },
  'silver-golfer-204m-drive-shot-00007.jpeg': { scene: 5, imageType: 'swing' },
  
  // 아트월 2장 (장면 5, art-wall)
  'silver-golfer-204m-drive-shot-00008.jpeg': { scene: 5, imageType: 'art-wall' },
  'silver-golfer-204m-drive-shot-00009.jpeg': { scene: 5, imageType: 'art-wall' },
  
  // 측정 2장 (장면 5, measurement)
  'silver-golfer-204m-drive-shot-00011.jpeg': { scene: 5, imageType: 'measurement' },
  'silver-golfer-204m-drive-shot-00012.jpeg': { scene: 5, imageType: 'measurement' },
  
  // 사인 1장 (장면 7, signature)
  'silver-golfer-204m-drive-shot-00013.jpeg': { scene: 7, imageType: 'signature' },
  
  // 아트월 1장 (장면 5, art-wall) - 총 아트월 3장
  'silver-golfer-204m-drive-shot-00015.jpeg': { scene: 5, imageType: 'art-wall' }
};

/**
 * 고객 ID 조회
 */
async function findCustomerId() {
  const { data, error } = await supabase
    .from('customers')
    .select('id, name, phone, folder_name, name_en')
    .or(`name.eq.${CUSTOMER_INFO.name},phone.eq.${CUSTOMER_INFO.phone}`)
    .limit(1)
    .single();

  if (error || !data) {
    console.error('❌ 고객 정보를 찾을 수 없습니다:', error);
    return null;
  }

  // 폴더명이 있으면 사용, 없으면 생성
  if (data.folder_name) {
    CUSTOMER_INFO.folderName = data.folder_name;
  } else {
    // 전화번호 마지막 4자리로 폴더명 생성
    const phoneLast4 = CUSTOMER_INFO.phone.replace(/[^0-9]/g, '').slice(-4);
    CUSTOMER_INFO.folderName = `${CUSTOMER_INFO.nameEn}-${phoneLast4}`;
  }

  // 영문 이름이 있으면 사용 (표준 로마자 표기법 우선)
  if (data.name_en && data.name_en !== 'inalgu') {
    // 기존에 잘못된 표기가 있으면 표준 표기로 업데이트
    CUSTOMER_INFO.nameEn = 'leenamgu';
  }

  console.log(`✅ 고객 정보 확인: ${data.name} (ID: ${data.id}, 폴더: ${CUSTOMER_INFO.folderName})`);
  return data;
}

/**
 * 파일명을 영문으로 변환 (WebP)
 */
function generateEnglishFileName(customerNameEn, scene, imageType, index) {
  const ext = '.webp';
  const paddedIndex = String(index).padStart(2, '0');
  
  return `${customerNameEn}_s${scene}_${imageType}_${paddedIndex}${ext}`;
}

/**
 * 영상 파일명 생성
 */
function generateVideoFileName(customerNameEn, index) {
  const ext = '.mov';
  const paddedIndex = String(index).padStart(2, '0');
  
  return `${customerNameEn}_s5_swing-video_${paddedIndex}${ext}`;
}

/**
 * JPG를 WebP로 변환 (90% 품질)
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
  try {
    const fileBuffer = fs.readFileSync(filePath);
    const fileExt = path.extname(filePath).toLowerCase();
    const contentType = fileExt === '.webp' ? 'image/webp' :
                       fileExt === '.jpg' || fileExt === '.jpeg' ? 'image/jpeg' :
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
 * 이미지 메타데이터 저장
 */
async function saveImageMetadata(imageData, customerInfo) {
  const metadataPayload = {
    image_url: imageData.url,
    folder_path: imageData.folderPath,
    date_folder: CUSTOMER_INFO.visitDate,
    source: 'customer',
    channel: 'customer',
    title: `${customerInfo.name} - ${CUSTOMER_INFO.visitDate}`,
    alt_text: `${customerInfo.name} 고객 이미지 (${CUSTOMER_INFO.visitDate}) - ${imageData.imageType}`,
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
 * 이미지 마이그레이션
 */
async function migrateImages(customerInfo) {
  console.log('\n📸 이미지 마이그레이션 시작...\n');

  // 출력 디렉토리 생성
  const outputDir = path.join(process.cwd(), 'migrated3', CUSTOMER_INFO.folderName, CUSTOMER_INFO.visitDate);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // 실제 파일 목록 확인
  const files = fs.readdirSync(LOCAL_FOLDER_PATH)
    .filter(file => {
      const ext = path.extname(file).toLowerCase();
      return ['.jpg', '.jpeg', '.png'].includes(ext);
    })
    .sort();

  console.log(`📋 발견된 이미지 파일: ${files.length}개`);
  files.forEach(file => console.log(`   - ${file}`));
  console.log('');

  // 이미지 파일 매핑
  const imageFiles = Object.keys(IMAGE_MAPPING);
  const typeCounts = {
    'swing': 0,
    'art-wall': 0,
    'measurement': 0,
    'signature': 0
  };

  let successCount = 0;
  let failCount = 0;

  for (const originalFileName of imageFiles) {
    // 대소문자 구분 없이 파일 찾기
    const actualFileName = files.find(f => 
      f.toLowerCase() === originalFileName.toLowerCase()
    );

    if (!actualFileName) {
      console.warn(`⚠️  파일을 찾을 수 없습니다: ${originalFileName}`);
      failCount++;
      continue;
    }

    const localFilePath = path.join(LOCAL_FOLDER_PATH, actualFileName);

    try {
      const mapping = IMAGE_MAPPING[originalFileName];
      const { scene, imageType } = mapping;

      console.log(`\n📤 처리 중: ${actualFileName}`);
      console.log(`   장면: ${scene}, 이미지 타입: ${imageType}`);

      // 영문 파일명 생성
      typeCounts[imageType] = (typeCounts[imageType] || 0) + 1;
      const englishFileName = generateEnglishFileName(
        CUSTOMER_INFO.nameEn,
        scene,
        imageType,
        typeCounts[imageType]
      );

      // WebP 변환 (90% 품질)
      const outputPath = path.join(outputDir, englishFileName);
      console.log(`   🔄 WebP 변환 중 (90% 품질)...`);
      const convertResult = await convertToWebP(localFilePath, outputPath, 90);

      if (!convertResult.success) {
        console.error(`   ❌ 변환 실패: ${convertResult.error}`);
        failCount++;
        continue;
      }

      console.log(`   ✅ WebP 변환 완료: ${englishFileName} (${(convertResult.convertedSize / 1024).toFixed(2)}KB)`);

      // Storage 경로 생성
      const dateFolder = CUSTOMER_INFO.visitDate.replace(/-/g, '.');
      const storagePath = `originals/customers/${CUSTOMER_INFO.folderName}/${dateFolder}/${englishFileName}`;
      const folderPath = `originals/customers/${CUSTOMER_INFO.folderName}/${dateFolder}`;

      // 파일 업로드
      const publicUrl = await uploadImage(outputPath, storagePath);
      console.log(`   ✅ 업로드 완료: ${publicUrl}`);

      // 메타데이터 저장
      const imageData = {
        url: publicUrl,
        folderPath: folderPath,
        fileSize: convertResult.convertedSize,
        originalFileName: actualFileName,
        englishFileName: englishFileName,
        type: 'image',
        scene: scene,
        imageType: imageType
      };

      const metadata = await saveImageMetadata(imageData, customerInfo);
      console.log(`   ✅ 메타데이터 저장 완료 (ID: ${metadata.id})`);

      successCount++;
    } catch (error) {
      console.error(`   ❌ 처리 실패: ${error.message}`);
      failCount++;
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('📊 이미지 마이그레이션 결과');
  console.log('='.repeat(60));
  console.log(`✅ 성공: ${successCount}개`);
  console.log(`❌ 실패: ${failCount}개`);
  console.log(`📁 타입별:`);
  console.log(`   - 시타: ${typeCounts['swing']}개`);
  console.log(`   - 아트월: ${typeCounts['art-wall']}개`);
  console.log(`   - 측정: ${typeCounts['measurement']}개`);
  console.log(`   - 사인: ${typeCounts['signature']}개`);
  console.log('='.repeat(60));
}

/**
 * 영상 마이그레이션
 */
async function migrateVideos(customerInfo) {
  console.log('\n🎥 영상 마이그레이션 시작...\n');

  // 영상 파일 찾기
  const videoFiles = fs.readdirSync(LOCAL_FOLDER_PATH)
    .filter(file => {
      const ext = path.extname(file).toLowerCase();
      return ['.mov', '.mp4', '.avi', '.webm'].includes(ext);
    })
    .sort();

  if (videoFiles.length === 0) {
    console.log('⚠️  영상 파일을 찾을 수 없습니다.');
    return;
  }

  console.log(`📋 발견된 영상 파일: ${videoFiles.length}개`);
  videoFiles.forEach(file => console.log(`   - ${file}`));
  console.log('');

  let successCount = 0;
  let failCount = 0;

  for (let i = 0; i < videoFiles.length; i++) {
    const videoFileName = videoFiles[i];
    const localFilePath = path.join(LOCAL_FOLDER_PATH, videoFileName);

    try {
      console.log(`\n📤 [${i + 1}/${videoFiles.length}] 처리 중: ${videoFileName}`);

      // 영문 파일명 생성
      const englishFileName = generateVideoFileName(CUSTOMER_INFO.nameEn, i + 1);

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
      const videoData = {
        url: publicUrl,
        folderPath: folderPath,
        fileSize: fileStats.size,
        originalFileName: videoFileName,
        englishFileName: englishFileName,
        type: 'video',
        scene: 5,
        imageType: 'swing-video'
      };

      const metadata = await saveImageMetadata(videoData, customerInfo);
      console.log(`   ✅ 메타데이터 저장 완료 (ID: ${metadata.id})`);

      successCount++;
    } catch (error) {
      console.error(`   ❌ 처리 실패: ${error.message}`);
      failCount++;
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('📊 영상 마이그레이션 결과');
  console.log('='.repeat(60));
  console.log(`✅ 성공: ${successCount}개`);
  console.log(`❌ 실패: ${failCount}개`);
  console.log('='.repeat(60));
}

/**
 * 메인 마이그레이션 함수
 */
async function migrateLeenamgu() {
  console.log('🚀 이남구 고객 이미지 마이그레이션 시작...\n');
  console.log(`📁 로컬 폴더: ${LOCAL_FOLDER_PATH}\n`);

  // 폴더 확인
  if (!fs.existsSync(LOCAL_FOLDER_PATH)) {
    console.error(`❌ 폴더를 찾을 수 없습니다: ${LOCAL_FOLDER_PATH}`);
    return;
  }

  // 고객 정보 조회
  const customerInfo = await findCustomerId();
  if (!customerInfo) {
    console.error('❌ 고객 정보를 찾을 수 없어 마이그레이션을 중단합니다.');
    return;
  }

  // 1. 이미지 마이그레이션
  await migrateImages(customerInfo);

  // 2. 영상 마이그레이션
  await migrateVideos(customerInfo);

  // 3. 고객 정보 업데이트
  await updateCustomerInfo(
    customerInfo.id,
    CUSTOMER_INFO.nameEn,
    CUSTOMER_INFO.initials,
    CUSTOMER_INFO.folderName
  );

  // 최종 요약
  console.log('\n' + '='.repeat(60));
  console.log('✅ 이남구 고객 이미지 마이그레이션 완료!');
  console.log('='.repeat(60));
  console.log(`📅 방문일: ${CUSTOMER_INFO.visitDate}`);
  console.log(`📁 폴더명: ${CUSTOMER_INFO.folderName}`);
  console.log(`📝 영문 이름: ${CUSTOMER_INFO.nameEn} (표준 로마자 표기법)`);
  console.log('='.repeat(60));
}

// 실행
migrateLeenamgu()
  .then(() => {
    console.log('\n✅ 마이그레이션 완료');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ 마이그레이션 중 오류 발생:', error);
    process.exit(1);
  });
