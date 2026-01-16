/**
 * 5명 고객 이미지 메타데이터 수정 및 PDF 변환
 * - 송화용, 강병부, 하종천, 조성대, 김한구
 * - english_filename, story_scene 업데이트
 * - PDF 파일 이미지로 변환
 */

const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const pdf = require('pdf-poppler');
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

const LOCAL_FOLDER = '/Users/m2/MASLABS/00.블로그_고객/2023';

const CUSTOMERS = [
  { name: '송화용', folder: '2023.08.16.송화용', dbName: '송화용', localName: '송화용' },
  { name: '강병부', folder: '2023.08.04.강병부', dbName: '강병부', localName: '강병구' },
  { name: '하종천', folder: '2023.07.13.하종천', dbName: '하종천', localName: 'VIP5458' },
  { name: '조성대', folder: '2023.06.20.조성대', dbName: '조성대', localName: '조사장' },
  { name: '김한구', folder: '2023.06.21.김한구', dbName: '김한구', localName: '김한구h' },
];

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
  '히어로': 'hero',
  '아트월': 'art-wall',
  '시타상담': 'swing-consultation',
  '측정': 'measurement',
  '시타장면': 'swing-scene',
  '시타영상_편집': 'swing-video-edited',
  '시타영상': 'swing-video',
  '사인': 'signature',
  '스윙장면': 'swing-scene-outdoor',
  '스윙영상': 'swing-video-outdoor',
  '후기캡처_카카오채널': 'review-capture-kakao-channel',
  '후기캡처_카카오톡': 'review-capture-kakao-talk',
  '후기캡처_네이버스마트스토어': 'review-capture-naver-smartstore',
  '후기캡처_문자': 'review-capture-sms',
  '후기': 'review-capture',
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
        scene: STORY_SCENE_MAP[pattern] || STORY_SCENE_MAP[pattern.split('_')[0]] || 1
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
    return null;
  }
  
  const number = extractNumber(cleanedFileName) || index;
  const initials = getCustomerInitials(customerName);
  
  const finalInitials = initials && initials !== 'unknown' ? initials : 'cus';
  
  // 동영상 파일은 원본 확장자 유지
  if (['.mp4', '.mov', '.avi', '.mkv', '.webm'].includes(ext)) {
    return `${finalInitials}_s${pattern.scene}_${pattern.english}_${String(number).padStart(2, '0')}${ext}`;
  }
  
  // 이미지 파일은 WebP로 변환
  return `${finalInitials}_s${pattern.scene}_${pattern.english}_${String(number).padStart(2, '0')}.webp`;
}

async function convertPDFToWebP(inputPath, outputPath, quality = 90) {
  try {
    // pdf-poppler를 사용하여 PDF의 첫 페이지를 PNG로 변환
    const options = {
      format: 'png',
      out_dir: path.dirname(outputPath),
      out_prefix: path.basename(outputPath, path.extname(outputPath)),
      page: 1, // 첫 페이지만
    };
    
    await pdf.convert(inputPath, options);
    
    // 변환된 PNG 파일 경로
    const pngPath = path.join(
      path.dirname(outputPath),
      `${options.out_prefix}-1.png`
    );
    
    if (!fs.existsSync(pngPath)) {
      throw new Error('PDF 변환 후 PNG 파일을 찾을 수 없습니다.');
    }
    
    // PNG를 WebP로 변환
    await sharp(pngPath)
      .webp({ quality })
      .toFile(outputPath);
    
    // 임시 PNG 파일 삭제
    if (fs.existsSync(pngPath)) {
      fs.unlinkSync(pngPath);
    }
    
    const inputStats = fs.statSync(inputPath);
    const outputStats = fs.statSync(outputPath);
    
    return {
      success: true,
      originalSize: inputStats.size,
      convertedSize: outputStats.size,
      isPDF: false
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
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
    return {
      success: false,
      error: error.message
    };
  }
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

async function updateImageMetadata(imageId, englishFileName, storyScene, imageType) {
  const { data, error } = await supabase
    .from('image_metadata')
    .update({
      english_filename: englishFileName,
      story_scene: storyScene,
      image_type: imageType,
      updated_at: new Date().toISOString()
    })
    .eq('id', imageId)
    .select()
    .single();
  
  if (error) {
    throw error;
  }
  
  return data;
}

async function fixCustomer(customerInfo) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`고객: ${customerInfo.dbName}`);
  console.log(`${'='.repeat(60)}`);
  
  // 고객 ID 찾기
  const { data: customerData, error: customerError } = await supabase
    .from('customers')
    .select('id, name, phone, folder_name, name_en, initials')
    .eq('name', customerInfo.dbName)
    .limit(1)
    .single();
  
  if (customerError || !customerData) {
    console.log(`   ❌ DB에 고객이 없습니다`);
    return;
  }
  
  console.log(`   ✅ 고객 ID: ${customerData.id}`);
  console.log(`   📁 폴더명: ${customerData.folder_name || '(없음)'}`);
  
  // 로컬 폴더 확인
  const localFolderPath = path.join(LOCAL_FOLDER, customerInfo.folder);
  if (!fs.existsSync(localFolderPath)) {
    console.log(`   ⚠️  로컬 폴더가 없습니다: ${localFolderPath}`);
    return;
  }
  
  // 로컬 파일 목록
  const localFiles = fs.readdirSync(localFolderPath)
    .map(f => path.join(localFolderPath, f))
    .filter(f => {
      const stat = fs.statSync(f);
      return stat.isFile();
    });
  
  console.log(`   📸 로컬 파일: ${localFiles.length}개`);
  
  // DB 이미지 메타데이터 조회
  const { data: dbImages, error: imageError } = await supabase
    .from('image_metadata')
    .select('id, image_url, original_filename, english_filename, story_scene, image_type, date_folder')
    .contains('tags', [`customer-${customerData.id}`])
    .order('date_folder', { ascending: false });
  
  if (imageError) {
    console.error(`   ❌ 이미지 조회 오류: ${imageError.message}`);
    return;
  }
  
  console.log(`   📊 DB 이미지: ${dbImages?.length || 0}개`);
  
  // 방문일자 추출
  const visitDateMatch = customerInfo.folder.match(/^(\d{4})\.(\d{1,2})\.(\d{1,2})\./);
  const visitDate = visitDateMatch 
    ? `${visitDateMatch[1]}-${visitDateMatch[2].padStart(2, '0')}-${visitDateMatch[3].padStart(2, '0')}`
    : '2023-01-01';
  
  const customerNameEn = translateKoreanToEnglish(customerInfo.dbName);
  const initials = getCustomerInitials(customerInfo.dbName);
  const folderName = customerData.folder_name || `${customerNameEn}-${customerData.phone?.replace(/-/g, '').slice(-4) || customerData.id}`;
  
  let updateCount = 0;
  let pdfConvertCount = 0;
  let newUploadCount = 0;
  let pdfDeletedCount = 0;
  
  // 1. 기존 이미지 메타데이터 수정
  if (dbImages && dbImages.length > 0) {
    console.log(`\n   🔄 기존 이미지 메타데이터 수정 중...`);
    
    for (const dbImage of dbImages) {
      if (!dbImage.original_filename) {
        continue;
      }
      
      // 원본 파일명에서 새 파일명 생성
      const newFileName = generateNewFileName(dbImage.original_filename, customerInfo.dbName, 1);
      if (!newFileName) {
        console.log(`   ⚠️  패턴을 찾을 수 없음: ${dbImage.original_filename}`);
        continue;
      }
      
      // 패턴 추출
      const pattern = extractPattern(dbImage.original_filename, customerInfo.dbName);
      
      // 메타데이터 업데이트
      try {
        await updateImageMetadata(
          dbImage.id,
          newFileName,
          pattern?.scene || 1,
          pattern?.english || 'unknown'
        );
        console.log(`   ✅ 업데이트: ${dbImage.original_filename} → ${newFileName} (장면 ${pattern?.scene || 1})`);
        updateCount++;
      } catch (error) {
        console.error(`   ❌ 업데이트 실패: ${dbImage.original_filename} - ${error.message}`);
      }
    }
  }
  
  // 2. 로컬 파일 처리 (PDF 변환 및 누락 파일 업로드)
  console.log(`\n   📁 로컬 파일 처리 중...`);
  
  const outputDir = path.join(process.cwd(), 'migrated', folderName, visitDate);
  fs.mkdirSync(outputDir, { recursive: true });
  
  for (let i = 0; i < localFiles.length; i++) {
    const localFile = localFiles[i];
    const originalFileName = path.basename(localFile);
    const ext = path.extname(originalFileName).toLowerCase();
    
    console.log(`\n   [${i + 1}/${localFiles.length}] ${originalFileName}`);
    
    // PDF 파일 처리
    if (ext === '.pdf') {
      console.log(`   📄 PDF 파일 발견: ${originalFileName}`);
      
      // 새 파일명 생성
      const newFileName = generateNewFileName(originalFileName, customerInfo.dbName, i + 1);
      if (!newFileName) {
        console.log(`   ⚠️  패턴을 찾을 수 없어 스킵`);
        continue;
      }
      
      const outputPath = path.join(outputDir, newFileName);
      
      // PDF -> WebP 변환
      const convertResult = await convertPDFToWebP(localFile, outputPath);
      if (!convertResult.success) {
        console.error(`   ❌ PDF 변환 실패: ${convertResult.error}`);
        continue;
      }
      
      // Supabase Storage 경로
      const storagePath = `originals/customers/${folderName}/${visitDate}/${newFileName}`;
      
      // 업로드
      try {
        const url = await uploadFile(outputPath, storagePath, 'image/webp');
        
        // 패턴 추출
        const pattern = extractPattern(originalFileName, customerInfo.dbName);
        
        // 메타데이터 저장
        const { data, error } = await supabase
          .from('image_metadata')
          .upsert({
            image_url: url,
            folder_path: `originals/customers/${folderName}/${visitDate}`,
            date_folder: visitDate,
            source: 'customer',
            channel: 'customer',
            title: `${customerInfo.dbName} - ${visitDate}`,
            alt_text: `${customerInfo.dbName} 고객 이미지 (${visitDate})`,
            file_size: convertResult.convertedSize,
            tags: [`customer-${customerData.id}`, `visit-${visitDate}`],
            story_scene: pattern?.scene || 1,
            image_type: pattern?.english || 'unknown',
            original_filename: originalFileName,
            english_filename: newFileName,
            customer_name_en: customerNameEn,
            customer_initials: initials,
            image_quality: 'final',
            upload_source: 'customer-migration',
            updated_at: new Date().toISOString(),
            metadata: {
              visitDate: visitDate,
              customerName: customerInfo.dbName,
              customerPhone: customerData.phone,
              englishFileName: newFileName,
              originalFileName: originalFileName,
              scene: pattern?.scene || 1,
              type: pattern?.english || 'unknown',
              customerNameEn: customerNameEn,
              customerInitials: initials
            }
          }, { onConflict: 'image_url' })
          .select()
          .single();
        
        if (error) {
          throw error;
        }
        
        // 원본 PDF 삭제
        fs.unlinkSync(localFile);
        
        console.log(`   ✅ PDF 변환 및 업로드 완료: ${newFileName}`);
        pdfConvertCount++;
        pdfDeletedCount++;
      } catch (error) {
        console.error(`   ❌ 업로드 실패: ${error.message}`);
      }
      continue;
    }
    
    // 이미지/동영상 파일 처리 (이미 업로드된 파일인지 확인)
    const existingImage = dbImages?.find(img => 
      img.original_filename === originalFileName ||
      img.image_url.includes(originalFileName.replace(/\.[^/.]+$/, ''))
    );
    
    if (existingImage) {
      // 이미 업로드된 파일이면 메타데이터만 업데이트
      const newFileName = generateNewFileName(originalFileName, customerInfo.dbName, i + 1);
      if (newFileName) {
        const pattern = extractPattern(originalFileName, customerInfo.dbName);
        try {
          await updateImageMetadata(
            existingImage.id,
            newFileName,
            pattern?.scene || 1,
            pattern?.english || 'unknown'
          );
          console.log(`   ✅ 메타데이터 업데이트: ${newFileName}`);
          updateCount++;
        } catch (error) {
          console.error(`   ❌ 업데이트 실패: ${error.message}`);
        }
      }
      continue;
    }
    
    // 새 파일 업로드
    const newFileName = generateNewFileName(originalFileName, customerInfo.dbName, i + 1);
    if (!newFileName) {
      console.log(`   ⚠️  패턴을 찾을 수 없어 스킵`);
      continue;
    }
    
    try {
      let outputPath;
      let contentType;
      let fileSize;
      
      // 동영상 파일 처리
      if (['.mp4', '.mov', '.avi', '.mkv', '.webm'].includes(ext)) {
        outputPath = path.join(outputDir, newFileName);
        fs.copyFileSync(localFile, outputPath);
        contentType = `video/${ext.slice(1)}`;
        const stats = fs.statSync(outputPath);
        fileSize = stats.size;
      } else {
        // 이미지 파일 처리
        outputPath = path.join(outputDir, newFileName);
        const convertResult = await convertToWebP(localFile, outputPath);
        if (!convertResult.success) {
          throw new Error(`WebP 변환 실패: ${convertResult.error}`);
        }
        contentType = 'image/webp';
        fileSize = convertResult.convertedSize;
      }
      
      // Supabase Storage 경로
      const storagePath = `originals/customers/${folderName}/${visitDate}/${newFileName}`;
      
      // 업로드
      const url = await uploadFile(outputPath, storagePath, contentType);
      
      // 패턴 추출
      const pattern = extractPattern(originalFileName, customerInfo.dbName);
      
      // 메타데이터 저장
      const { data, error } = await supabase
        .from('image_metadata')
        .upsert({
          image_url: url,
          folder_path: `originals/customers/${folderName}/${visitDate}`,
          date_folder: visitDate,
          source: 'customer',
          channel: 'customer',
          title: `${customerInfo.dbName} - ${visitDate}`,
          alt_text: `${customerInfo.dbName} 고객 이미지 (${visitDate})`,
          file_size: fileSize,
          tags: [`customer-${customerData.id}`, `visit-${visitDate}`],
          story_scene: pattern?.scene || 1,
          image_type: pattern?.english || 'unknown',
          original_filename: originalFileName,
          english_filename: newFileName,
          customer_name_en: customerNameEn,
          customer_initials: initials,
          image_quality: 'final',
          upload_source: 'customer-migration',
          updated_at: new Date().toISOString(),
          metadata: {
            visitDate: visitDate,
            customerName: customerInfo.dbName,
            customerPhone: customerData.phone,
            englishFileName: newFileName,
            originalFileName: originalFileName,
            scene: pattern?.scene || 1,
            type: pattern?.english || 'unknown',
            customerNameEn: customerNameEn,
            customerInitials: initials
          }
        }, { onConflict: 'image_url' })
        .select()
        .single();
      
      if (error) {
        throw error;
      }
      
      console.log(`   ✅ 새 파일 업로드: ${newFileName}`);
      newUploadCount++;
    } catch (error) {
      console.error(`   ❌ 실패: ${originalFileName} - ${error.message}`);
    }
  }
  
  console.log(`\n   📊 완료:`);
  console.log(`      - 메타데이터 업데이트: ${updateCount}개`);
  console.log(`      - PDF 변환 및 업로드: ${pdfConvertCount}개`);
  console.log(`      - 새 파일 업로드: ${newUploadCount}개`);
  console.log(`      - PDF 삭제: ${pdfDeletedCount}개`);
}

async function fixAllCustomers() {
  console.log('🔄 5명 고객 이미지 메타데이터 수정 및 PDF 변환 시작...\n');
  
  for (const customerInfo of CUSTOMERS) {
    await fixCustomer(customerInfo);
  }
  
  console.log(`\n${'='.repeat(60)}`);
  console.log(`✅ 전체 작업 완료!`);
  console.log(`${'='.repeat(60)}`);
}

if (require.main === module) {
  fixAllCustomers().catch(console.error);
}
