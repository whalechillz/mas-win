/**
 * 오리지널 맥의 폴더 구조 분석
 * 
 * 목표: 00.blog_customers 폴더의 구조를 분석하여 마이그레이션 계획 수립
 */

const fs = require('fs');
const path = require('path');

const ORIGINAL_MAC_FOLDER = '/Users/m2/MASLABS/00.blog_customers';

function analyzeFolderStructure() {
  console.log('🔍 오리지널 맥의 폴더 구조 분석 시작...\n');
  console.log('='.repeat(80));
  
  if (!fs.existsSync(ORIGINAL_MAC_FOLDER)) {
    console.error(`❌ 폴더가 존재하지 않습니다: ${ORIGINAL_MAC_FOLDER}`);
    return;
  }
  
  // 연도별 폴더 확인
  console.log('\n1️⃣ 연도별 폴더 확인...');
  const yearFolders = fs.readdirSync(ORIGINAL_MAC_FOLDER)
    .filter(item => {
      const itemPath = path.join(ORIGINAL_MAC_FOLDER, item);
      return fs.statSync(itemPath).isDirectory() && /^\d{4}$/.test(item);
    })
    .sort();
  
  console.log(`✅ 발견된 연도 폴더: ${yearFolders.join(', ')}\n`);
  
  // 각 연도별 고객 폴더 분석
  const folderStructure = {};
  let totalCustomerFolders = 0;
  let totalImages = 0;
  
  for (const year of yearFolders) {
    const yearPath = path.join(ORIGINAL_MAC_FOLDER, year);
    console.log(`📅 ${year}년 폴더 분석 중...`);
    
    const customerFolders = fs.readdirSync(yearPath)
      .filter(item => {
        const itemPath = path.join(yearPath, item);
        return fs.statSync(itemPath).isDirectory();
      });
    
    folderStructure[year] = {
      path: yearPath,
      customerFolders: [],
      totalImages: 0
    };
    
    for (const customerFolder of customerFolders) {
      const customerPath = path.join(yearPath, customerFolder);
      
      // 이미지 파일 개수 계산
      let imageCount = 0;
      function countImages(dir) {
        try {
          const items = fs.readdirSync(dir);
          for (const item of items) {
            const itemPath = path.join(dir, item);
            const stat = fs.statSync(itemPath);
            
            if (stat.isDirectory()) {
              countImages(itemPath);
            } else {
              const ext = path.extname(item).toLowerCase().slice(1);
              const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'heic', 'heif'];
              const videoExtensions = ['mp4', 'mov', 'avi', 'webm', 'mkv'];
              if (imageExtensions.includes(ext) || videoExtensions.includes(ext)) {
                imageCount++;
              }
            }
          }
        } catch (error) {
          // 무시
        }
      }
      
      countImages(customerPath);
      
      folderStructure[year].customerFolders.push({
        name: customerFolder,
        path: customerPath,
        imageCount
      });
      
      totalCustomerFolders++;
      totalImages += imageCount;
    }
    
    console.log(`   ✅ ${customerFolders.length}개 고객 폴더, ${folderStructure[year].totalImages}개 이미지`);
  }
  
  // 결과 요약
  console.log('\n' + '='.repeat(80));
  console.log('📊 폴더 구조 분석 결과:');
  console.log('='.repeat(80));
  console.log(`   연도 폴더: ${yearFolders.length}개`);
  console.log(`   총 고객 폴더: ${totalCustomerFolders}개`);
  console.log(`   총 이미지: ${totalImages}개`);
  console.log('='.repeat(80));
  
  // 연도별 상세 정보
  console.log('\n📋 연도별 상세 정보:\n');
  for (const year of yearFolders) {
    const yearData = folderStructure[year];
    console.log(`${year}년: ${yearData.customerFolders.length}개 고객 폴더`);
    
    // 상위 10개 고객 폴더 출력
    const sortedFolders = yearData.customerFolders
      .sort((a, b) => b.imageCount - a.imageCount)
      .slice(0, 10);
    
    if (sortedFolders.length > 0) {
      console.log(`   상위 고객 폴더 (이미지 많은 순):`);
      sortedFolders.forEach((folder, idx) => {
        console.log(`      [${idx + 1}] ${folder.name} (${folder.imageCount}개 이미지)`);
      });
    }
    console.log('');
  }
  
  // JSON 파일로 저장
  const result = {
    basePath: ORIGINAL_MAC_FOLDER,
    years: yearFolders,
    folderStructure,
    statistics: {
      totalYears: yearFolders.length,
      totalCustomerFolders,
      totalImages
    },
    timestamp: new Date().toISOString()
  };
  
  fs.writeFileSync(
    'scripts/original-mac-folder-structure.json',
    JSON.stringify(result, null, 2),
    'utf-8'
  );
  
  console.log('✅ 결과가 scripts/original-mac-folder-structure.json에 저장되었습니다.');
  console.log('\n✅ 분석 완료!');
  
  return result;
}

analyzeFolderStructure();
