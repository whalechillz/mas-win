/**
 * 박성우 고객 재방문 마이그레이션 스크립트 (2024.10.15)
 * 
 * 1. 대화내용 1개 (txt)
 * 2. 블로그 md 4개
 * 3. 이미지 (WebP 변환):
 *    - 가이드 2개 (장면 4)
 *    - 시타이미지 3개 (장면 5)
 *    - 아트월/상품 4개 (장면 5)
 *    - 사인 2개 (장면 7)
 * 4. 영상 1개
 */

const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const { createClient } = require('@supabase/supabase-js');
const iconv = require('iconv-lite');
const chardet = require('chardet');
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
  visitDate: '2024-10-15',
  folderName: 'parksungwoo-6003',
  nameEn: 'parksungwoo',
  initials: 'PSW'
};

// 로컬 폴더 경로
const LOCAL_FOLDER_PATH = path.join(
  process.env.HOME || '/Users/m2',
  'MASLABS',
  '00.blog_customers',
  '2024',
  '2024.10.15.박성우'
);

// 이미지 파일 매핑
const IMAGE_MAPPING = {
  'guide_01.jpeg': { scene: 4, imageType: 'guide-meeting' },
  'guide_02.jpeg': { scene: 4, imageType: 'guide-meeting' },
  'park_seongwoo_01.jpeg': { scene: 5, imageType: 'swing' },
  'park_seongwoo_03.jpeg': { scene: 5, imageType: 'swing' },
  'park_seongwoo_04.jpeg': { scene: 5, imageType: 'swing' },
  'park_seongwoo_05.jpeg': { scene: 5, imageType: 'swing' },
  'park_seongwoo_06.jpeg': { scene: 5, imageType: 'art-wall' },
  'park_seongwoo_07.jpeg': { scene: 5, imageType: 'art-wall' },
  'park_seongwoo_08.jpeg': { scene: 5, imageType: 'product' },
  'park_seongwoo_010.jpeg': { scene: 7, imageType: 'signature' },
  'park_seongwoo_011.jpeg': { scene: 7, imageType: 'signature' }
};

// 블로그 MD 파일 목록
const BLOG_FILES = [
  'massgoo-golf-customer-review.md',
  'massgoo-golf-customer-v...revised.md', // 실제 파일명 확인 필요
  'massgoo-golf-vip-event-report.md'
];

/**
 * NFD(정규화된) 한글을 NFC(조합된) 형식으로 변환
 */
function normalizeKorean(text) {
  if (!text) return text;
  return text.normalize('NFC');
}

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
 * 파일명을 영문으로 변환 (WebP)
 */
function generateEnglishFileName(customerNameEn, scene, imageType, index) {
  const ext = '.webp';
  const paddedIndex = String(index).padStart(2, '0');
  
  return `${customerNameEn}_s${scene}_${imageType}_${paddedIndex}${ext}`;
}

/**
 * JPG를 WebP로 변환
 */
async function convertToWebP(inputPath, outputPath, quality = 85) {
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
 * 텍스트 파일 읽기 (인코딩 자동 감지)
 */
function readTextFile(filePath) {
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
 * 대화내용 저장
 */
async function saveConversation(customerId, filePath, fileName) {
  const content = readTextFile(filePath);
  
  if (!content) {
    return null;
  }
  
  const consultationData = {
    customer_id: customerId,
    consultation_date: CUSTOMER_INFO.visitDate,
    consultation_type: 'phone',
    topic: '대화내용',
    content: content,
    tags: ['대화내용', '마이그레이션'],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
  
  const { data, error } = await supabase
    .from('customer_consultations')
    .insert(consultationData)
    .select()
    .single();
  
  if (error) {
    console.error(`   ❌ 대화내용 저장 실패: ${error.message}`);
    return null;
  }
  
  return data;
}

/**
 * 블로그 MD 파일 저장
 */
async function saveBlogPost(customerId, filePath, fileName) {
  const content = readTextFile(filePath);
  
  if (!content) {
    return null;
  }
  
  // 파일명에서 제목 추출
  const title = fileName.replace(/\.md$/, '').replace(/^massgoo-golf-/, '');
  
  // 첫 줄을 제목으로 사용
  const firstLine = content.split('\n')[0];
  const extractedTitle = firstLine.replace(/^#+\s*/, '').trim() || title;
  
  // 요약 추출
  const summary = content.split('\n').slice(0, 5).join(' ').substring(0, 200) + '...';
  
  const consultationData = {
    customer_id: customerId,
    consultation_date: CUSTOMER_INFO.visitDate,
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
 * 이미지 마이그레이션
 */
async function migrateImages(customerInfo) {
  console.log('\n📸 이미지 마이그레이션 시작...\n');

  // 출력 디렉토리 생성
  const outputDir = path.join(process.cwd(), 'migrated3', CUSTOMER_INFO.folderName, CUSTOMER_INFO.visitDate);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // 이미지 파일 찾기
  const imageFiles = Object.keys(IMAGE_MAPPING);
  const typeCounts = {
    'guide-meeting': 0,
    'swing': 0,
    'art-wall': 0,
    'product': 0,
    'signature': 0
  };

  let successCount = 0;
  let failCount = 0;

  for (const originalFileName of imageFiles) {
    const localFilePath = path.join(LOCAL_FOLDER_PATH, originalFileName);

    if (!fs.existsSync(localFilePath)) {
      console.warn(`⚠️  파일을 찾을 수 없습니다: ${originalFileName}`);
      failCount++;
      continue;
    }

    try {
      const mapping = IMAGE_MAPPING[originalFileName];
      const { scene, imageType } = mapping;

      console.log(`\n📤 처리 중: ${originalFileName}`);
      console.log(`   장면: ${scene}, 이미지 타입: ${imageType}`);

      // 영문 파일명 생성
      typeCounts[imageType] = (typeCounts[imageType] || 0) + 1;
      const englishFileName = generateEnglishFileName(
        CUSTOMER_INFO.nameEn,
        scene,
        imageType,
        typeCounts[imageType]
      );

      // WebP 변환
      const outputPath = path.join(outputDir, englishFileName);
      console.log(`   🔄 WebP 변환 중...`);
      const convertResult = await convertToWebP(localFilePath, outputPath);

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
        originalFileName: originalFileName,
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
  console.log(`   - 가이드: ${typeCounts['guide-meeting']}개`);
  console.log(`   - 시타: ${typeCounts['swing']}개`);
  console.log(`   - 아트월: ${typeCounts['art-wall']}개`);
  console.log(`   - 상품: ${typeCounts['product']}개`);
  console.log(`   - 사인: ${typeCounts['signature']}개`);
  console.log('='.repeat(60));
}

/**
 * 영상 마이그레이션
 */
async function migrateVideo(customerInfo) {
  console.log('\n🎥 영상 마이그레이션 시작...\n');

  // 영상 파일 찾기
  const videoFiles = fs.readdirSync(LOCAL_FOLDER_PATH)
    .filter(file => {
      const ext = path.extname(file).toLowerCase();
      return ['.mov', '.mp4', '.avi', '.webm'].includes(ext);
    });

  if (videoFiles.length === 0) {
    console.log('⚠️  영상 파일을 찾을 수 없습니다.');
    return;
  }

  const videoFile = videoFiles[0]; // 첫 번째 영상 파일
  const localFilePath = path.join(LOCAL_FOLDER_PATH, videoFile);

  try {
    console.log(`📤 처리 중: ${videoFile}`);

    // 영문 파일명 생성 (영상은 원본 확장자 유지)
    const ext = path.extname(videoFile).toLowerCase();
    const englishFileName = `${CUSTOMER_INFO.nameEn}_s5_swing-video_01${ext}`;

    // Storage 경로 생성
    const dateFolder = CUSTOMER_INFO.visitDate.replace(/-/g, '.');
    const storagePath = `originals/customers/${CUSTOMER_INFO.folderName}/${dateFolder}/${englishFileName}`;
    const folderPath = `originals/customers/${CUSTOMER_INFO.folderName}/${dateFolder}`;

    // 파일 업로드
    const fileStats = fs.statSync(localFilePath);
    const publicUrl = await uploadImage(localFilePath, storagePath);
    console.log(`   ✅ 업로드 완료: ${publicUrl}`);

    // 메타데이터 저장
    const videoData = {
      url: publicUrl,
      folderPath: folderPath,
      fileSize: fileStats.size,
      originalFileName: videoFile,
      englishFileName: englishFileName,
      type: 'video',
      scene: 5,
      imageType: 'swing-video'
    };

    const metadata = await saveImageMetadata(videoData, customerInfo);
    console.log(`   ✅ 메타데이터 저장 완료 (ID: ${metadata.id})`);

    console.log('\n✅ 영상 마이그레이션 완료');
  } catch (error) {
    console.error(`❌ 영상 처리 실패: ${error.message}`);
  }
}

/**
 * 대화내용 마이그레이션
 */
async function migrateConversation(customerId) {
  console.log('\n💬 대화내용 마이그레이션 시작...\n');

  const conversationFile = '박성우-대화내용.txt';
  const filePath = path.join(LOCAL_FOLDER_PATH, conversationFile);

  if (!fs.existsSync(filePath)) {
    console.log('⚠️  대화내용 파일을 찾을 수 없습니다.');
    return;
  }

  try {
    console.log(`📤 처리 중: ${conversationFile}`);
    const result = await saveConversation(customerId, filePath, conversationFile);
    
    if (result) {
      console.log(`   ✅ 대화내용 저장 완료 (ID: ${result.id})`);
    }
  } catch (error) {
    console.error(`❌ 대화내용 처리 실패: ${error.message}`);
  }
}

/**
 * 블로그 MD 파일 마이그레이션
 */
async function migrateBlogPosts(customerId) {
  console.log('\n📝 블로그 마이그레이션 시작...\n');

  // 실제 MD 파일 찾기
  const mdFiles = fs.readdirSync(LOCAL_FOLDER_PATH)
    .filter(file => file.toLowerCase().endsWith('.md'));

  if (mdFiles.length === 0) {
    console.log('⚠️  블로그 MD 파일을 찾을 수 없습니다.');
    return;
  }

  console.log(`📋 발견된 MD 파일: ${mdFiles.length}개\n`);

  let successCount = 0;
  let failCount = 0;

  for (const mdFile of mdFiles) {
    const filePath = path.join(LOCAL_FOLDER_PATH, mdFile);
    
    try {
      console.log(`📤 처리 중: ${mdFile}`);
      const result = await saveBlogPost(customerId, filePath, mdFile);
      
      if (result) {
        successCount++;
        console.log(`   ✅ 블로그 저장 완료 (ID: ${result.id})`);
      } else {
        failCount++;
      }
    } catch (error) {
      console.error(`   ❌ 블로그 저장 오류: ${error.message}`);
      failCount++;
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('📊 블로그 마이그레이션 결과');
  console.log('='.repeat(60));
  console.log(`✅ 성공: ${successCount}개`);
  console.log(`❌ 실패: ${failCount}개`);
  console.log('='.repeat(60));
}

/**
 * 메인 마이그레이션 함수
 */
async function migrateParksungwoo() {
  console.log('🚀 박성우 고객 재방문 마이그레이션 시작...\n');
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
  await migrateVideo(customerInfo);

  // 3. 대화내용 마이그레이션
  await migrateConversation(customerInfo.id);

  // 4. 블로그 마이그레이션
  await migrateBlogPosts(customerInfo.id);

  // 최종 요약
  console.log('\n' + '='.repeat(60));
  console.log('✅ 박성우 고객 재방문 마이그레이션 완료!');
  console.log('='.repeat(60));
  console.log(`📅 방문일: ${CUSTOMER_INFO.visitDate}`);
  console.log(`📁 폴더명: ${CUSTOMER_INFO.folderName}`);
  console.log('='.repeat(60));
}

// 실행
migrateParksungwoo()
  .then(() => {
    console.log('\n✅ 마이그레이션 완료');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ 마이그레이션 중 오류 발생:', error);
    process.exit(1);
  });
