/**
 * 5명 고객 이미지 마이그레이션 스크립트
 * - 조성대, 김한구, 하종천, 강병부, 송화용
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

// 고객 정보 (로컬 폴더명 → DB 이름)
const CUSTOMERS = [
  { localFolder: '2023.06.20.조성대', dbName: '조성대', localName: '조성대' },
  { localFolder: '2023.06.21.김한구', dbName: '김한구', localName: '김한구' },
  { localFolder: '2023.07.13.하종천', dbName: '하종천', localName: '하종천' },
  { localFolder: '2023.08.04.강병부', dbName: '강병부', localName: '강병부' },
  { localFolder: '2023.08.16.송화용', dbName: '송화용', localName: '송화용' },
];

const LOCAL_FOLDER = '/Users/m2/MASLABS/00.블로그_고객/2023';

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
  return text.normalize('NFC');
}

function getCustomerInitials(name) {
  if (!name) return 'unknown';
  if (/[가-힣]/.test(name)) {
    const nameEn = translateKoreanToEnglish(name);
    if (nameEn && nameEn.trim() !== '') {
      const parts = nameEn.split(/[\s-]+/);
      const initials = parts.map(part => part.charAt(0)).join('').toLowerCase();
      if (initials && initials.length > 0 && /^[a-z]+$/.test(initials)) {
        return initials;
      }
    }
  }
  const parts = name.split(/[\s-]+/);
  const initials = parts.map(part => part.charAt(0)).join('').toLowerCase();
  return /^[a-z]+$/.test(initials) ? initials : 'unknown';
}

function extractPattern(fileName, customerName) {
  let nameWithoutExt = fileName.replace(/\.[^/.]+$/, '');
  nameWithoutExt = normalizeKorean(nameWithoutExt);
  nameWithoutExt = nameWithoutExt
    .replace(new RegExp('^' + customerName + '_', 'i'), '')
    .replace(/^_+|_+$/g, '')
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
  return match ? parseInt(match[1], 10) : 1;
}

function generateNewFileName(originalFileName, customerName, index) {
  let cleanedFileName = originalFileName.replace(/_ok/g, '');
  const pattern = extractPattern(cleanedFileName, customerName);
  if (!pattern) return null;
  const number = extractNumber(cleanedFileName) || index;
  const initials = getCustomerInitials(customerName);
  const finalInitials = initials && initials !== 'unknown' ? initials : 'cus';
  return `${finalInitials}_s${pattern.scene}_${pattern.english}_${String(number).padStart(2, '0')}.webp`;
}

function findImageFiles(folderPath) {
  const imageFiles = [];
  const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp', '.heic', '.heif'];
  if (!fs.existsSync(folderPath)) return imageFiles;
  
  function scanDir(dir) {
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
          if (imageExtensions.includes(ext)) {
            imageFiles.push(fullPath);
          }
        }
      } catch (e) {}
    }
  }
  
  scanDir(folderPath);
  return imageFiles;
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

async function findCustomerId(dbName) {
  const { data, error } = await supabase
    .from('customers')
    .select('id, name, phone, name_en, initials')
    .eq('name', dbName)
    .order('updated_at', { ascending: false })
    .limit(1)
    .single();
  if (error || !data) return null;
  return {
    id: data.id,
    phone: data.phone,
    dbName: data.name
  };
}

function generateFolderName(customerName, phone, customerId) {
  let nameEn = translateKoreanToEnglish(customerName);
  if (!nameEn || nameEn.trim() === '' || /[가-힣]/.test(nameEn)) {
    if (customerId) {
      nameEn = `customer-${String(customerId).padStart(4, '0')}`;
    } else {
      nameEn = 'customer-unknown';
    }
  }
  nameEn = nameEn.replace(/[가-힣]/g, '').replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
  if (!nameEn || nameEn.trim() === '') {
    nameEn = customerId ? `customer-${String(customerId).padStart(4, '0')}` : 'customer-unknown';
  }
  if (phone && phone.trim() !== '') {
    const phoneLast4 = phone.replace(/-/g, '').slice(-4);
    if (phoneLast4.length === 4 && /^\d{4}$/.test(phoneLast4)) {
      return `${nameEn}-${phoneLast4}`;
    }
  }
  if (customerId) {
    return `${nameEn}-${String(customerId).padStart(4, '0')}`;
  }
  return `${nameEn}-unknown`;
}

async function uploadImage(filePath, storagePath) {
  const fileBuffer = fs.readFileSync(filePath);
  const { data, error } = await supabase.storage
    .from(bucketName)
    .upload(storagePath, fileBuffer, {
      contentType: 'image/webp',
      upsert: true
    });
  if (error) throw error;
  const { data: { publicUrl } } = supabase.storage
    .from(bucketName)
    .getPublicUrl(storagePath);
  return publicUrl;
}

async function saveMetadata(imageData) {
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
    story_scene: imageData.scene,
    image_type: imageData.type,
    original_filename: imageData.originalFileName,
    english_filename: imageData.englishFileName,
    customer_name_en: imageData.customerNameEn,
    customer_initials: imageData.customerInitials,
    image_quality: 'final',
    metadata: {
      visitDate: imageData.visitDate,
      customerName: imageData.customerName,
      customerPhone: imageData.customerPhone || null,
      englishFileName: imageData.englishFileName,
      originalFileName: imageData.originalFileName,
      scene: imageData.scene,
      type: imageData.type
    }
  };
  
  const { data, error } = await supabase
    .from('image_metadata')
    .upsert(metadataPayload, { onConflict: 'image_url' })
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

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

async function migrateCustomers() {
  console.log('🔄 5명 고객 이미지 마이그레이션 시작...\n');
  
  const results = {
    total: CUSTOMERS.length,
    success: 0,
    failed: 0,
    details: []
  };
  
  for (let i = 0; i < CUSTOMERS.length; i++) {
    const customer = CUSTOMERS[i];
    console.log(`\n${'='.repeat(60)}`);
    console.log(`[${i + 1}/${CUSTOMERS.length}] 고객: ${customer.dbName}`);
    console.log('='.repeat(60));
    
    try {
      // 고객 ID 찾기
      const customerInfo = await findCustomerId(customer.dbName);
      if (!customerInfo) {
        console.log(`   ❌ DB에 고객이 없음: ${customer.dbName}`);
        results.failed++;
        continue;
      }
      
      console.log(`   ✅ 고객 찾음: ${customer.dbName} (ID: ${customerInfo.id})`);
      
      // 폴더명 생성
      const folderName = generateFolderName(customer.dbName, customerInfo.phone, customerInfo.id);
      let nameEn = customerInfo.name_en || translateKoreanToEnglish(customer.dbName);
      let initials = customerInfo.initials || getCustomerInitials(customer.dbName);
      
      // 고객 정보 업데이트
      await updateCustomerInfo(customerInfo.id, nameEn, initials, folderName);
      console.log(`   📁 폴더명: ${folderName}`);
      
      // 이미지 파일 찾기
      const customerFolderPath = path.join(LOCAL_FOLDER, customer.localFolder);
      const imageFiles = findImageFiles(customerFolderPath);
      console.log(`   📸 발견된 이미지: ${imageFiles.length}개`);
      
      if (imageFiles.length === 0) {
        console.log(`   ⏭️  이미지가 없어 스킵`);
        results.failed++;
        continue;
      }
      
      // 방문일자 추출
      const dateMatch = customer.localFolder.match(/^(\d{4})\.(\d{1,2})\.(\d{1,2})\./);
      const visitDate = dateMatch 
        ? `${dateMatch[1]}-${dateMatch[2].padStart(2, '0')}-${dateMatch[3].padStart(2, '0')}`
        : '2023-01-01';
      
      const outputDir = path.join(process.cwd(), 'migrated', folderName, visitDate);
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }
      
      let uploadCount = 0;
      let failCount = 0;
      
      for (let j = 0; j < imageFiles.length; j++) {
        const imageFile = imageFiles[j];
        const originalFileName = path.basename(imageFile);
        
        try {
          // 새 파일명 생성
          let newFileName = generateNewFileName(originalFileName, customer.localName, j + 1);
          
          if (newFileName && newFileName.startsWith('cus_')) {
            newFileName = newFileName.replace('cus_', `${initials}_`);
          }
          
          if (!newFileName) {
            const ext = path.extname(originalFileName);
            const baseName = path.basename(originalFileName, ext).replace(/_ok/g, '');
            newFileName = `${initials}_${baseName}_${String(j + 1).padStart(2, '0')}.webp`;
          }
          
          // WebP 변환
          const outputPath = path.join(outputDir, newFileName);
          const convertResult = await convertToWebP(imageFile, outputPath);
          
          if (!convertResult.success) {
            throw new Error(`WebP 변환 실패: ${convertResult.error}`);
          }
          
          // Supabase Storage 경로
          const folderPath = `originals/customers/${folderName}/${visitDate}`;
          const storagePath = `${folderPath}/${newFileName}`;
          
          // 업로드
          const url = await uploadImage(outputPath, storagePath);
          
          // 패턴 추출
          const pattern = extractPattern(originalFileName, customer.localName);
          
          // 메타데이터 저장
          await saveMetadata({
            customerId: customerInfo.id,
            customerName: customer.dbName,
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
            fileSize: convertResult.convertedSize
          });
          
          uploadCount++;
          console.log(`   ✅ ${j + 1}/${imageFiles.length}: ${newFileName}`);
          
        } catch (error) {
          failCount++;
          console.error(`   ❌ 업로드 실패: ${originalFileName} - ${error.message}`);
        }
      }
      
      console.log(`   📊 완료: 성공 ${uploadCount}개, 실패 ${failCount}개`);
      
      results.success++;
      results.details.push({
        customerName: customer.dbName,
        customerId: customerInfo.id,
        status: 'success',
        uploaded: uploadCount,
        failed: failCount
      });
      
    } catch (error) {
      console.error(`   ❌ 오류: ${error.message}`);
      results.failed++;
    }
  }
  
  console.log(`\n${'='.repeat(60)}`);
  console.log('📊 마이그레이션 완료!');
  console.log('='.repeat(60));
  console.log(`총 고객: ${results.total}명`);
  console.log(`성공: ${results.success}명`);
  console.log(`실패: ${results.failed}명`);
}

if (require.main === module) {
  migrateCustomers().catch(console.error);
}

module.exports = { migrateCustomers };
