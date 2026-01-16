/**
 * 2022-2023년 마이그레이션 체크 (사인, 동영상)
 * - 블로그_고객 폴더 기준으로 로컬 파일과 DB 비교
 */

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

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
  const allExtensions = [...imageExtensions, ...videoExtensions];
  
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
            const fileName = path.basename(item);
            const normalizedFileName = normalizeKorean(fileName);
            const isSign = normalizedFileName.includes('사인') || normalizedFileName.includes('signature');
            const isVideo = videoExtensions.includes(ext);
            
            localFiles.push({
              path: fullPath,
              fileName: item,
              ext,
              size: stat.size,
              customerName: customerName || 'unknown',
              visitDate: visitDate || `${year}-01-01`,
              isSign,
              isVideo,
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
    .select('english_filename, original_filename, date_folder, folder_path, image_url, story_scene, image_type')
    .like('date_folder', `${year}%`)
    .or(`source.eq.customer,source.is.null`);
  
  if (error) {
    console.error('업로드된 파일 조회 오류:', error);
    return [];
  }
  
  return data || [];
}

async function verifyYear(year) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`${year}년 마이그레이션 체크 (사인, 동영상)`);
  console.log(`${'='.repeat(60)}\n`);
  
  // 로컬 파일 목록
  console.log('📂 로컬 파일 스캔 중...');
  const localFiles = findLocalFiles(year);
  
  const signFiles = localFiles.filter(f => f.isSign);
  const videoFiles = localFiles.filter(f => f.isVideo);
  
  console.log(`   총 파일: ${localFiles.length}개`);
  console.log(`   사인 파일: ${signFiles.length}개`);
  console.log(`   동영상 파일: ${videoFiles.length}개\n`);
  
  // 업로드된 파일 목록
  console.log('📊 DB 메타데이터 조회 중...');
  const uploadedFiles = await getUploadedFiles(year);
  
  const uploadedSignFiles = uploadedFiles.filter(f => 
    f.original_filename?.includes('사인') || 
    f.english_filename?.includes('signature') ||
    f.image_type === 'signature'
  );
  const uploadedVideoFiles = uploadedFiles.filter(f => 
    ['.mp4', '.mov', '.avi', '.mkv', '.webm'].some(ext => 
      f.english_filename?.endsWith(ext) || f.original_filename?.endsWith(ext)
    )
  );
  
  console.log(`   총 파일: ${uploadedFiles.length}개`);
  console.log(`   사인 파일: ${uploadedSignFiles.length}개`);
  console.log(`   동영상 파일: ${uploadedVideoFiles.length}개\n`);
  
  // 누락된 파일 찾기
  const missingSignFiles = [];
  const missingVideoFiles = [];
  
  // 사인 파일 체크
  signFiles.forEach(localFile => {
    const normalizedLocalName = normalizeKorean(localFile.fileName).toLowerCase();
    let found = false;
    
    for (const uploadedFile of uploadedFiles) {
      const uploadedName = (uploadedFile.original_filename || uploadedFile.english_filename || '').toLowerCase();
      if (uploadedName.includes('사인') || uploadedName.includes('signature')) {
        // 고객 이름과 날짜로 매칭
        if (uploadedFile.date_folder === localFile.visitDate) {
          found = true;
          break;
        }
      }
    }
    
    if (!found) {
      missingSignFiles.push(localFile);
    }
  });
  
  // 동영상 파일 체크
  videoFiles.forEach(localFile => {
    const normalizedLocalName = normalizeKorean(localFile.fileName).toLowerCase();
    let found = false;
    
    for (const uploadedFile of uploadedFiles) {
      const uploadedName = (uploadedFile.original_filename || uploadedFile.english_filename || '').toLowerCase();
      if (['.mp4', '.mov', '.avi'].some(ext => uploadedName.endsWith(ext))) {
        // 고객 이름과 날짜로 매칭
        if (uploadedFile.date_folder === localFile.visitDate) {
          found = true;
          break;
        }
      }
    }
    
    if (!found) {
      missingVideoFiles.push(localFile);
    }
  });
  
  // 결과 출력
  console.log(`\n${'='.repeat(60)}`);
  console.log(`📊 ${year}년 체크 결과`);
  console.log(`${'='.repeat(60)}`);
  console.log(`로컬 사인 파일: ${signFiles.length}개`);
  console.log(`업로드된 사인 파일: ${uploadedSignFiles.length}개`);
  console.log(`누락된 사인 파일: ${missingSignFiles.length}개`);
  
  if (missingSignFiles.length > 0) {
    console.log(`\n📋 누락된 사인 파일 목록:`);
    missingSignFiles.forEach((file, i) => {
      console.log(`   ${i + 1}. ${file.fileName} (${file.customerName}, ${file.visitDate})`);
    });
  }
  
  console.log(`\n로컬 동영상 파일: ${videoFiles.length}개`);
  console.log(`업로드된 동영상 파일: ${uploadedVideoFiles.length}개`);
  console.log(`누락된 동영상 파일: ${missingVideoFiles.length}개`);
  
  if (missingVideoFiles.length > 0) {
    console.log(`\n📋 누락된 동영상 파일 목록:`);
    missingVideoFiles.forEach((file, i) => {
      console.log(`   ${i + 1}. ${file.fileName} (${file.customerName}, ${file.visitDate})`);
    });
  }
  
  return {
    year,
    signFiles: signFiles.length,
    uploadedSignFiles: uploadedSignFiles.length,
    missingSignFiles: missingSignFiles.length,
    videoFiles: videoFiles.length,
    uploadedVideoFiles: uploadedVideoFiles.length,
    missingVideoFiles: missingVideoFiles.length,
    missingSignFilesList: missingSignFiles,
    missingVideoFilesList: missingVideoFiles
  };
}

async function verifyAll() {
  console.log('🔄 2022-2023년 마이그레이션 체크 (사인, 동영상) 시작...\n');
  
  const results = [];
  
  for (const year of ['2022', '2023']) {
    const result = await verifyYear(year);
    results.push(result);
  }
  
  // 전체 요약
  console.log(`\n${'='.repeat(60)}`);
  console.log(`📊 전체 체크 요약`);
  console.log(`${'='.repeat(60)}`);
  
  let totalSign = 0;
  let totalUploadedSign = 0;
  let totalMissingSign = 0;
  let totalVideo = 0;
  let totalUploadedVideo = 0;
  let totalMissingVideo = 0;
  
  results.forEach(result => {
    console.log(`\n${result.year}년:`);
    console.log(`  사인: 로컬 ${result.signFiles}개, 업로드 ${result.uploadedSignFiles}개, 누락 ${result.missingSignFiles}개`);
    console.log(`  동영상: 로컬 ${result.videoFiles}개, 업로드 ${result.uploadedVideoFiles}개, 누락 ${result.missingVideoFiles}개`);
    
    totalSign += result.signFiles;
    totalUploadedSign += result.uploadedSignFiles;
    totalMissingSign += result.missingSignFiles;
    totalVideo += result.videoFiles;
    totalUploadedVideo += result.uploadedVideoFiles;
    totalMissingVideo += result.missingVideoFiles;
  });
  
  console.log(`\n전체:`);
  console.log(`  사인: 로컬 ${totalSign}개, 업로드 ${totalUploadedSign}개, 누락 ${totalMissingSign}개`);
  console.log(`  동영상: 로컬 ${totalVideo}개, 업로드 ${totalUploadedVideo}개, 누락 ${totalMissingVideo}개`);
  
  // 누락된 파일 목록 저장
  const missingList = results.flatMap(r => [
    ...r.missingSignFilesList.map(f => ({ ...f, type: 'sign' })),
    ...r.missingVideoFilesList.map(f => ({ ...f, type: 'video' }))
  ]);
  
  if (missingList.length > 0) {
    const outputPath = path.join(process.cwd(), 'migrated', 'missing-sign-video-2022-2023.json');
    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    fs.writeFileSync(outputPath, JSON.stringify(missingList, null, 2));
    console.log(`\n📝 누락된 파일 목록 저장: ${outputPath}`);
  }
  
  console.log(`\n✅ 체크 완료!`);
}

if (require.main === module) {
  verifyAll().catch(console.error);
}
