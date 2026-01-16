/**
 * 2022-2023년 마이그레이션 1:1 파일 점검
 * - 로컬 파일과 DB 메타데이터 비교
 * - PDF 파일 확인 및 처리
 * - 영상 파일 확인 및 처리
 * - 누락된 파일 목록 생성
 */

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const bucketName = 'blog-images';

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Supabase 환경 변수가 설정되지 않았습니다.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const LOCAL_FOLDER = '/Users/m2/MASLABS/00.블로그_고객';

function normalizeKorean(text) {
  return text.normalize('NFC');
}

function findLocalFiles(year) {
  const localFiles = [];
  const yearFolder = path.join(LOCAL_FOLDER, year);
  
  if (!fs.existsSync(yearFolder)) {
    return localFiles;
  }
  
  const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp', '.heic', '.heif'];
  const videoExtensions = ['.mp4', '.mov', '.avi', '.mkv', '.webm'];
  const allExtensions = [...imageExtensions, ...videoExtensions, '.pdf'];
  
  function scanDir(dir, customerName = null, visitDate = null) {
    const items = fs.readdirSync(dir);
    
    for (const item of items) {
      const fullPath = path.join(dir, item);
      
      try {
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory()) {
          // YYYY.MM.DD.고객이름 형식 파싱
          const match = item.match(/^(\d{4})\.(\d{1,2})\.(\d{1,2})\.(.+)$/);
          if (match) {
            const folderYear = match[1];
            const month = match[2].padStart(2, '0');
            const day = match[3].padStart(2, '0');
            const folderCustomerName = match[4].split('-')[0].split('(')[0].trim();
            const folderVisitDate = `${folderYear}-${month}-${day}`;
            
            if (folderYear === year) {
              scanDir(fullPath, folderCustomerName, folderVisitDate);
            }
          } else if (item === year) {
            scanDir(fullPath, null, null);
          } else if (!item.startsWith('.') && !item.includes('_temp')) {
            scanDir(fullPath, customerName, visitDate);
          }
        } else if (stat.isFile()) {
          const ext = path.extname(item).toLowerCase();
          if (allExtensions.includes(ext)) {
            localFiles.push({
              path: fullPath,
              fileName: item,
              ext,
              size: stat.size,
              customerName: customerName || 'unknown',
              visitDate: visitDate || `${year}-01-01`,
              isPDF: ext === '.pdf',
              isVideo: videoExtensions.includes(ext),
              isImage: imageExtensions.includes(ext)
            });
          }
        }
      } catch (e) {
        // 무시
      }
    }
  }
  
  scanDir(yearFolder);
  return localFiles;
}

async function getUploadedFiles(year) {
  const { data, error } = await supabase
    .from('image_metadata')
    .select('english_filename, original_filename, date_folder, folder_path, image_url')
    .like('date_folder', `${year}%`)
    .or(`source.eq.customer,source.is.null`);
  
  if (error) {
    console.error('업로드된 파일 조회 오류:', error);
    return [];
  }
  
  return data || [];
}

function extractCustomerNameFromPath(filePath) {
  const parts = filePath.split(path.sep);
  for (const part of parts) {
    const match = part.match(/^(\d{4})\.(\d{1,2})\.(\d{1,2})\.(.+)$/);
    if (match) {
      return match[4].split('-')[0].split('(')[0].trim();
    }
  }
  return null;
}

async function verifyYear(year) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`${year}년 마이그레이션 점검 시작`);
  console.log(`${'='.repeat(60)}\n`);
  
  // 로컬 파일 목록
  console.log('📂 로컬 파일 스캔 중...');
  const localFiles = findLocalFiles(year);
  console.log(`   발견된 파일: ${localFiles.length}개\n`);
  
  // 업로드된 파일 목록
  console.log('📊 DB 메타데이터 조회 중...');
  const uploadedFiles = await getUploadedFiles(year);
  console.log(`   업로드된 파일: ${uploadedFiles.length}개\n`);
  
  // 파일명 정규화 및 비교
  const uploadedFileNames = new Set();
  uploadedFiles.forEach(file => {
    if (file.english_filename) {
      uploadedFileNames.add(file.english_filename.toLowerCase());
    }
    if (file.original_filename) {
      uploadedFileNames.add(file.original_filename.toLowerCase());
    }
  });
  
  // 누락된 파일 찾기
  const missingFiles = [];
  const pdfFiles = [];
  const videoFiles = [];
  const imageFiles = [];
  
  localFiles.forEach(localFile => {
    const normalizedLocalName = normalizeKorean(localFile.fileName).toLowerCase();
    let found = false;
    
    // 원본 파일명으로 찾기
    if (uploadedFileNames.has(normalizedLocalName)) {
      found = true;
    }
    
    // 영문 파일명 패턴으로 찾기 (예: kss_s6_signature_01.webp)
    for (const uploadedName of uploadedFileNames) {
      const baseName = path.basename(localFile.fileName, path.extname(localFile.fileName));
      const normalizedBase = normalizeKorean(baseName);
      
      // 고객 이름이 포함되어 있고 패턴이 비슷하면 찾은 것으로 간주
      if (uploadedName.includes(normalizedBase.substring(0, 5)) || 
          normalizedBase.includes(uploadedName.substring(0, 5))) {
        found = true;
        break;
      }
    }
    
    if (!found) {
      missingFiles.push(localFile);
      
      if (localFile.isPDF) {
        pdfFiles.push(localFile);
      } else if (localFile.isVideo) {
        videoFiles.push(localFile);
      } else if (localFile.isImage) {
        imageFiles.push(localFile);
      }
    }
  });
  
  // 결과 출력
  console.log(`\n${'='.repeat(60)}`);
  console.log(`📊 ${year}년 점검 결과`);
  console.log(`${'='.repeat(60)}`);
  console.log(`로컬 파일: ${localFiles.length}개`);
  console.log(`업로드된 파일: ${uploadedFiles.length}개`);
  console.log(`누락된 파일: ${missingFiles.length}개`);
  console.log(`  - PDF: ${pdfFiles.length}개`);
  console.log(`  - 동영상: ${videoFiles.length}개`);
  console.log(`  - 이미지: ${imageFiles.length}개`);
  
  if (missingFiles.length > 0) {
    console.log(`\n📋 누락된 파일 목록:`);
    missingFiles.forEach((file, i) => {
      const type = file.isPDF ? '📄 PDF' : file.isVideo ? '📹 동영상' : '🖼️  이미지';
      console.log(`   ${i + 1}. ${type}: ${file.fileName} (${file.customerName}, ${file.visitDate})`);
    });
  }
  
  return {
    year,
    localFiles: localFiles.length,
    uploadedFiles: uploadedFiles.length,
    missingFiles: missingFiles.length,
    pdfFiles: pdfFiles.length,
    videoFiles: videoFiles.length,
    imageFiles: imageFiles.length,
    missingFilesList: missingFiles
  };
}

async function verifyAll() {
  console.log('🔄 2022-2023년 마이그레이션 1:1 파일 점검 시작...\n');
  
  const results = [];
  
  for (const year of ['2022', '2023']) {
    const result = await verifyYear(year);
    results.push(result);
  }
  
  // 전체 요약
  console.log(`\n${'='.repeat(60)}`);
  console.log(`📊 전체 점검 요약`);
  console.log(`${'='.repeat(60)}`);
  
  let totalLocal = 0;
  let totalUploaded = 0;
  let totalMissing = 0;
  let totalPDF = 0;
  let totalVideo = 0;
  let totalImage = 0;
  
  results.forEach(result => {
    console.log(`\n${result.year}년:`);
    console.log(`  로컬: ${result.localFiles}개`);
    console.log(`  업로드: ${result.uploadedFiles}개`);
    console.log(`  누락: ${result.missingFiles}개 (PDF: ${result.pdfFiles}, 동영상: ${result.videoFiles}, 이미지: ${result.imageFiles})`);
    
    totalLocal += result.localFiles;
    totalUploaded += result.uploadedFiles;
    totalMissing += result.missingFiles;
    totalPDF += result.pdfFiles;
    totalVideo += result.videoFiles;
    totalImage += result.imageFiles;
  });
  
  console.log(`\n전체:`);
  console.log(`  로컬: ${totalLocal}개`);
  console.log(`  업로드: ${totalUploaded}개`);
  console.log(`  누락: ${totalMissing}개 (PDF: ${totalPDF}, 동영상: ${totalVideo}, 이미지: ${totalImage})`);
  
  // 누락된 파일 목록 저장
  const missingList = results.flatMap(r => r.missingFilesList);
  if (missingList.length > 0) {
    const outputPath = path.join(process.cwd(), 'migrated', 'missing-files-2022-2023.json');
    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    fs.writeFileSync(outputPath, JSON.stringify(missingList, null, 2));
    console.log(`\n📝 누락된 파일 목록 저장: ${outputPath}`);
  }
  
  console.log(`\n✅ 점검 완료!`);
}

if (require.main === module) {
  verifyAll().catch(console.error);
}
