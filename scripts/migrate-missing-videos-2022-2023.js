/**
 * 2022-2023년 누락된 동영상 파일 마이그레이션
 */

const fs = require('fs');
const path = require('path');
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

const MISSING_FILES_JSON = path.join(process.cwd(), 'migrated', 'missing-sign-video-2022-2023.json');

const NAME_MAPPING = {
  '조사장': '조성대',
  '김한구h': '김한구',
  'VIP5458': '하종천',
  '강병구': '강병부',
  'VIP8385': '송화용',
};

function normalizeKorean(text) {
  return text.normalize('NFC');
}

function getCustomerInitials(name) {
  const nameEn = translateKoreanToEnglish(name);
  if (!nameEn) return 'unknown';
  
  const parts = nameEn.split('-');
  if (parts.length >= 2) {
    return (parts[0].charAt(0) + parts[1].charAt(0)).toLowerCase();
  }
  return nameEn.substring(0, 2).toLowerCase();
}

const FILENAME_PATTERN_MAP = {
  '시타영상_편집': 'swing-video-edited',
  '시타영상': 'swing-video',
  '스윙영상': 'swing-video-outdoor',
};

const STORY_SCENE_MAP = {
  '시타영상_편집': 3,
  '시타영상': 3,
  '스윙영상': 6,
};

function extractPattern(fileName, customerName) {
  let nameWithoutExt = path.basename(fileName, path.extname(fileName));
  nameWithoutExt = nameWithoutExt.normalize('NFC');
  
  // _ok 제거
  nameWithoutExt = nameWithoutExt.replace(/_ok/g, '');
  
  // 고객 이름 제거
  const normalizedCustomerName = normalizeKorean(customerName);
  const customerNameEn = translateKoreanToEnglish(customerName).toLowerCase();
  
  nameWithoutExt = nameWithoutExt.replace(new RegExp(`^${normalizedCustomerName}_`, 'i'), '');
  nameWithoutExt = nameWithoutExt.replace(new RegExp(`^${customerNameEn}_`, 'i'), '');
  
  // 패턴 찾기
  for (const [pattern, english] of Object.entries(FILENAME_PATTERN_MAP)) {
    if (nameWithoutExt.includes(pattern)) {
      return {
        pattern,
        english,
        scene: STORY_SCENE_MAP[pattern] || 3
      };
    }
  }
  
  return null;
}

function extractNumber(fileName) {
  const match = fileName.match(/(\d{2})/);
  return match ? parseInt(match[1], 10) : null;
}

function generateNewFileName(originalFileName, customerName, index) {
  let cleanedFileName = originalFileName.replace(/_ok/g, '');
  const ext = path.extname(originalFileName).toLowerCase();
  const pattern = extractPattern(cleanedFileName, customerName);
  
  if (!pattern) {
    // 패턴을 찾을 수 없으면 기본값 사용
    const initials = getCustomerInitials(customerName);
    const finalInitials = initials && initials !== 'unknown' ? initials : 'cus';
    return `${finalInitials}_s3_swing-video_${String(index).padStart(2, '0')}${ext}`;
  }
  
  const number = extractNumber(cleanedFileName) || index;
  const initials = getCustomerInitials(customerName);
  const finalInitials = initials && initials !== 'unknown' ? initials : 'cus';
  
  return `${finalInitials}_s${pattern.scene}_${pattern.english}_${String(number).padStart(2, '0')}${ext}`;
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

async function uploadFile(filePath, storagePath, contentType) {
  const fileBuffer = fs.readFileSync(filePath);
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
}

async function findCustomerId(customerName, phone = null) {
  const dbName = NAME_MAPPING[customerName] || customerName;
  
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
  
  const { data, error } = await supabase
    .from('customers')
    .select('id, name, phone, name_en, initials')
    .eq('name', dbName)
    .order('updated_at', { ascending: false })
    .limit(1);
  
  if (error || !data || data.length === 0) {
    return null;
  }
  
  const customer = data[0];
  
  const { count } = await supabase
    .from('customers')
    .select('*', { count: 'exact', head: true })
    .eq('name', dbName);
  
  return {
    id: customer.id,
    phone: customer.phone,
    isDuplicate: count > 1,
    dbName: customer.name
  };
}

async function saveMetadata(imageData) {
  const payload = {
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
  
  const { data, error } = await supabase
    .from('image_metadata')
    .upsert(payload, { onConflict: 'image_url' })
    .select()
    .single();
  
  if (error) {
    throw error;
  }
  
  return data;
}

async function migrateMissingVideos() {
  console.log('🔄 2022-2023년 누락된 동영상 파일 마이그레이션 시작...\n');
  
  if (!fs.existsSync(MISSING_FILES_JSON)) {
    console.error(`❌ 누락된 파일 목록이 없습니다: ${MISSING_FILES_JSON}`);
    return;
  }
  
  const missingFiles = JSON.parse(fs.readFileSync(MISSING_FILES_JSON, 'utf8'));
  const videoFiles = missingFiles.filter(f => f.type === 'video');
  
  console.log(`📋 누락된 동영상 파일: ${videoFiles.length}개\n`);
  
  // 고객별로 그룹화
  const filesByCustomer = {};
  videoFiles.forEach(file => {
    const customerName = file.customerName;
    if (!filesByCustomer[customerName]) {
      filesByCustomer[customerName] = [];
    }
    filesByCustomer[customerName].push(file);
  });
  
  console.log(`📊 고객별 그룹화: ${Object.keys(filesByCustomer).length}명\n`);
  
  let totalSuccess = 0;
  let totalFail = 0;
  let totalSkipped = 0;
  
  for (const [customerName, files] of Object.entries(filesByCustomer)) {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`고객: ${customerName} (${files.length}개 파일)`);
    console.log(`${'='.repeat(60)}`);
    
    // 고객 ID 찾기
    const customerResult = await findCustomerId(customerName);
    if (!customerResult) {
      console.log(`   ⏭️  DB에 고객이 없어 스킵: ${customerName}`);
      totalSkipped += files.length;
      continue;
    }
    
    const customerId = customerResult.id;
    const customerPhone = customerResult.phone;
    const dbName = customerResult.dbName;
    
    const customerNameEn = translateKoreanToEnglish(dbName);
    const initials = getCustomerInitials(dbName);
    const folderName = generateFolderName(dbName, customerPhone, customerId);
    
    console.log(`   📁 폴더명: ${folderName}`);
    console.log(`   📞 전화번호: ${customerPhone || '(없음)'}`);
    
    let successCount = 0;
    let failCount = 0;
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const filePath = file.path;
      const originalFileName = file.fileName;
      const ext = file.ext;
      const visitDate = file.visitDate;
      
      console.log(`\n   [${i + 1}/${files.length}] ${originalFileName}`);
      
      // 파일 존재 확인
      if (!fs.existsSync(filePath)) {
        console.log(`   ⚠️  파일이 없습니다: ${filePath}`);
        failCount++;
        continue;
      }
      
      // 새 파일명 생성
      const newFileName = generateNewFileName(originalFileName, dbName, i + 1);
      
      try {
        const outputDir = path.join(process.cwd(), 'migrated', folderName, visitDate);
        fs.mkdirSync(outputDir, { recursive: true });
        
        const outputPath = path.join(outputDir, newFileName);
        
        // 동영상 파일 복사
        fs.copyFileSync(filePath, outputPath);
        const stats = fs.statSync(outputPath);
        const fileSize = stats.size;
        const contentType = `video/${ext.slice(1)}`;
        
        console.log(`   📹 동영상 복사: ${newFileName}`);
        
        // Supabase Storage 경로
        const storagePath = `originals/customers/${folderName}/${visitDate}/${newFileName}`;
        
        // 업로드
        const url = await uploadFile(outputPath, storagePath, contentType);
        
        // 패턴 추출
        const pattern = extractPattern(originalFileName, dbName);
        
        // 메타데이터 저장
        await saveMetadata({
          customerId,
          customerName: dbName,
          customerNameEn,
          customerInitials: initials,
          customerPhone,
          originalFileName,
          englishFileName: newFileName,
          url,
          folderPath: `originals/customers/${folderName}/${visitDate}`,
          visitDate,
          scene: pattern?.scene || 3,
          type: pattern?.english || 'swing-video',
          fileSize
        });
        
        console.log(`   ✅ 업로드 완료: ${newFileName}`);
        successCount++;
        totalSuccess++;
      } catch (error) {
        console.error(`   ❌ 실패: ${originalFileName} - ${error.message}`);
        failCount++;
        totalFail++;
      }
    }
    
    console.log(`\n   📊 완료: 성공 ${successCount}개, 실패 ${failCount}개`);
  }
  
  console.log(`\n${'='.repeat(60)}`);
  console.log(`📊 전체 마이그레이션 완료!`);
  console.log(`${'='.repeat(60)}`);
  console.log(`✅ 성공: ${totalSuccess}개`);
  console.log(`⏭️  스킵: ${totalSkipped}개`);
  console.log(`❌ 실패: ${totalFail}개`);
}

if (require.main === module) {
  migrateMissingVideos().catch(console.error);
}
