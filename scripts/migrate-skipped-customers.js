/**
 * 스킵된 고객만 재마이그레이션 스크립트
 * - 이름 매핑 적용
 * - 김성준 제외
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

// 스킵된 고객 목록 (로컬 파일명 → DB 이름 매핑)
const SKIPPED_CUSTOMERS = [
  { localName: '조사장', dbName: '조성대' },
  { localName: '김한구h', dbName: '김한구' },
  { localName: 'VIP5458', dbName: '하종천' },
  { localName: '강병구', dbName: '강병부' },
  { localName: 'VIP8385', dbName: '송화용' },
  // 김성준은 별도 처리 (unmatched 폴더에 저장)
];

const LOCAL_FOLDER = '/Users/m2/MASLABS/00.블로그_고객/2023';

// 파일명 패턴 매핑 (기존과 동일)
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
    const initials = name.split('').map(char => {
      if (/[가-힣]/.test(char)) {
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
  const parts = name.split(/[\s-]+/);
  const initials = parts.map(part => part.charAt(0)).join('').toLowerCase();
  return /^[a-z]+$/.test(initials) ? initials : 'unknown';
}

function extractPattern(fileName, customerName) {
  let nameWithoutExt = fileName.replace(/\.[^/.]+$/, '');
  nameWithoutExt = normalizeKorean(nameWithoutExt);
  const customerNameEn = translateKoreanToEnglish(customerName).toLowerCase();
  const customerNameKr = customerName;
  nameWithoutExt = nameWithoutExt
    .replace(new RegExp('^' + customerNameKr + '_', 'i'), '')
    .replace(new RegExp('^' + customerNameEn + '_', 'i'), '')
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

function findImageFiles(folderPath, customerName, recursive = true) {
  const imageFiles = [];
  const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp', '.heic', '.heif'];
  if (!fs.existsSync(folderPath)) return imageFiles;
  const normalizedCustomerName = normalizeKorean(customerName);
  const customerNameEn = translateKoreanToEnglish(customerName).toLowerCase();
  function scanDir(dir) {
    const items = fs.readdirSync(dir);
    for (const item of items) {
      const fullPath = path.join(dir, item);
      try {
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
          if (item.startsWith('2023.')) {
            const parts = item.split('.');
            if (parts.length >= 4) {
              const folderCustomerName = parts.slice(3).join('.');
              const normalizedFolderName = normalizeKorean(folderCustomerName);
              if (normalizedFolderName === normalizedCustomerName) {
                if (recursive && !item.startsWith('.') && !item.includes('_temp')) {
                  scanDir(fullPath);
                }
              }
            }
          } else if (recursive && !item.startsWith('.') && !item.includes('_temp')) {
            scanDir(fullPath);
          }
        } else if (stat.isFile()) {
          const ext = path.extname(item).toLowerCase();
          if (imageExtensions.includes(ext)) {
            const normalizedItem = normalizeKorean(item);
            if (normalizedItem.startsWith(normalizedCustomerName + '_') ||
                normalizedItem.startsWith(customerNameEn + '_') ||
                normalizedItem.includes('_' + normalizedCustomerName + '_') ||
                normalizedItem.includes('_' + customerNameEn + '_')) {
              imageFiles.push(fullPath);
            }
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
    const reduction = ((1 - outputStats.size / inputStats.size) * 100).toFixed(1);
    return {
      success: true,
      originalSize: inputStats.size,
      convertedSize: outputStats.size,
      reduction: parseFloat(reduction)
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
  let { data, error } = await supabase
    .from('image_metadata')
    .upsert(metadataPayload, { onConflict: 'image_url' })
    .select()
    .single();
  if (error && error.message.includes('file_name')) {
    const { data: retryData, error: retryError } = await supabase
      .from('image_metadata')
      .upsert(metadataPayload, { onConflict: 'image_url' })
      .select()
      .single();
    if (retryError) throw retryError;
    return retryData;
  }
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

async function migrateSkippedCustomers() {
  console.log('🔄 스킵된 고객 재마이그레이션 시작...\n');
  
  const results = {
    total: SKIPPED_CUSTOMERS.length,
    success: 0,
    failed: 0,
    details: []
  };
  
  for (let i = 0; i < SKIPPED_CUSTOMERS.length; i++) {
    const { localName, dbName } = SKIPPED_CUSTOMERS[i];
    console.log(`\n${'='.repeat(60)}`);
    console.log(`[${i + 1}/${SKIPPED_CUSTOMERS.length}] 고객: ${localName} → ${dbName}`);
    console.log('='.repeat(60));
    
    try {
      // 고객 ID 찾기 (DB 이름으로)
      const customerInfo = await findCustomerId(dbName);
      
      if (!customerInfo) {
        console.log(`   ❌ DB에 고객이 없음: ${dbName}`);
        results.failed++;
        results.details.push({
          localName,
          dbName,
          status: 'failed',
          reason: `DB에 고객이 없음: ${dbName}`
        });
        continue;
      }
      
      console.log(`   ✅ 고객 찾음: ${dbName} (ID: ${customerInfo.id})`);
      
      // 폴더명 생성
      const folderName = generateFolderName(dbName, customerInfo.phone, customerInfo.id);
      let nameEn = customerInfo.name_en || translateKoreanToEnglish(dbName);
      let initials = customerInfo.initials || getCustomerInitials(dbName);
      
      if (!initials || initials === 'unknown' || initials === 'cus') {
        const { data: customerFull } = await supabase
          .from('customers')
          .select('id, name, phone, name_en, initials')
          .eq('id', customerInfo.id)
          .single();
        if (customerFull) {
          if (customerFull.initials) initials = customerFull.initials;
          if (customerFull.name_en) nameEn = customerFull.name_en;
        }
        if (!initials || initials === 'unknown') {
          initials = getCustomerInitials(dbName);
        }
      }
      
      // 고객 정보 업데이트
      await updateCustomerInfo(customerInfo.id, nameEn, initials, folderName);
      console.log(`   📁 폴더명: ${folderName}`);
      
      // 이미지 파일 찾기 (로컬 이름으로)
      const imageFiles = findImageFiles(LOCAL_FOLDER, localName, true);
      console.log(`   📸 발견된 이미지: ${imageFiles.length}개`);
      
      if (imageFiles.length === 0) {
        console.log(`   ⏭️  이미지가 없어 스킵`);
        results.failed++;
        continue;
      }
      
      // 변환 및 업로드
      const outputDir = path.join(process.cwd(), 'migrated', folderName);
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }
      
      let uploadCount = 0;
      let failCount = 0;
      
      for (let j = 0; j < imageFiles.length; j++) {
        const imageFile = imageFiles[j];
        const originalFileName = path.basename(imageFile);
        
        try {
          // 새 파일명 생성 (DB 이름 사용)
          let newFileName = generateNewFileName(originalFileName, dbName, j + 1);
          
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
            console.log(`   ❌ 변환 실패: ${originalFileName}`);
            failCount++;
            continue;
          }
          
          // 방문일자 추출
          let visitDate = '2023-01-01';
          const pathParts = imageFile.split(path.sep);
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
          
          const folderPath = `originals/customers/${folderName}/${visitDate}`;
          const storagePath = `${folderPath}/${newFileName}`;
          
          // 업로드
          const url = await uploadImage(outputPath, storagePath);
          
          // 패턴 추출
          const pattern = extractPattern(originalFileName, localName);
          
          // 메타데이터 저장
          await saveMetadata({
            customerId: customerInfo.id,
            customerName: dbName,
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
          console.log(`   ❌ 업로드 실패: ${originalFileName} - ${error.message}`);
          failCount++;
        }
      }
      
      console.log(`   📊 완료: 성공 ${uploadCount}개, 실패 ${failCount}개`);
      
      results.success++;
      results.details.push({
        localName,
        dbName,
        customerId: customerInfo.id,
        status: 'success',
        uploaded: uploadCount,
        failed: failCount
      });
      
    } catch (error) {
      console.error(`   ❌ 오류: ${error.message}`);
      results.failed++;
      results.details.push({
        localName,
        dbName,
        status: 'failed',
        error: error.message
      });
    }
  }
  
  console.log(`\n${'='.repeat(60)}`);
  console.log('📊 재마이그레이션 완료!');
  console.log('='.repeat(60));
  console.log(`총 고객: ${results.total}명`);
  console.log(`성공: ${results.success}명`);
  console.log(`실패: ${results.failed}명`);
  
  const resultsFile = path.join(process.cwd(), 'migrated', 'skipped-customers-results.json');
  fs.writeFileSync(resultsFile, JSON.stringify(results, null, 2));
  console.log(`\n상세 결과: ${resultsFile}`);
}

if (require.main === module) {
  migrateSkippedCustomers().catch(console.error);
}

module.exports = { migrateSkippedCustomers };
