const playwright = require('playwright');
const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

// 이미지 다운로드 함수
function downloadImage(url, filePath) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;
    
    // 디렉토리 생성
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    const file = fs.createWriteStream(filePath);
    
    protocol.get(url, (response) => {
      if (response.statusCode === 200) {
        response.pipe(file);
        file.on('finish', () => {
          file.close();
          resolve(filePath);
        });
      } else if (response.statusCode === 301 || response.statusCode === 302) {
        // 리다이렉트 처리
        file.close();
        fs.unlinkSync(filePath);
        downloadImage(response.headers.location, filePath).then(resolve).catch(reject);
      } else {
        file.close();
        fs.unlinkSync(filePath);
        reject(new Error(`Failed to download: ${response.statusCode}`));
      }
    }).on('error', (err) => {
      file.close();
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
      reject(err);
    });
  });
}

// URL에서 파일 경로 추출
function getLocalPath(imageUrl, baseUrl) {
  try {
    const url = new URL(imageUrl);
    const pathname = url.pathname;
    
    // /main/products/gold2/로 시작하는 경로만 처리
    if (pathname.startsWith('/main/products/gold2/')) {
      return pathname.substring(1); // / 제거
    }
    
    return null;
  } catch (e) {
    return null;
  }
}

async function extractAndDownloadImages(browser, url) {
  const page = await browser.newPage();
  const allImages = new Set();
  
  try {
    console.log(`\n📄 페이지 확인: ${url}`);
    await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(5000);
    
    // 제품 섹션에서 "시크리트포스 골드 2" 제품 찾기
    const gold2Images = await page.evaluate(() => {
      const imageSet = new Set();
      
      // 모든 이미지 URL 추출
      document.querySelectorAll('img').forEach(img => {
        const src = img.src || img.getAttribute('src');
        if (src && src.includes('/main/products/gold2/')) {
          imageSet.add(src);
        }
      });
      
      // picture 태그 내부의 source와 img
      document.querySelectorAll('picture').forEach(picture => {
        const source = picture.querySelector('source');
        if (source && source.srcset) {
          const srcset = source.srcset.split(',')[0].trim().split(' ')[0];
          if (srcset && srcset.includes('/main/products/gold2/')) {
            imageSet.add(srcset);
          }
        }
        const img = picture.querySelector('img');
        if (img && img.src && img.src.includes('/main/products/gold2/')) {
          imageSet.add(img.src);
        }
      });
      
      return Array.from(imageSet);
    });
    
    console.log(`  발견된 gold2 이미지: ${gold2Images.length}개`);
    gold2Images.forEach(img => {
      if (img && !img.startsWith('data:') && !img.startsWith('blob:')) {
        allImages.add(img);
      }
    });
    
    // 모달이 열려있는 경우를 대비해 제품 카드 클릭 시도
    try {
      const productCard = await page.$('[alt*="시크리트포스 골드 2"]:not([alt*="MUZIIK"])');
      if (productCard) {
        console.log('  제품 카드 클릭하여 모달 열기 시도...');
        await productCard.click();
        await page.waitForTimeout(2000);
        
        // 모달 내부의 이미지 추출
        const modalImages = await page.evaluate(() => {
          const imageSet = new Set();
          
          // 모달 내부의 모든 이미지
          const modal = document.querySelector('[class*="modal"], [class*="Modal"], [role="dialog"]');
          if (modal) {
            modal.querySelectorAll('img').forEach(img => {
              const src = img.src || img.getAttribute('src');
              if (src && src.includes('/main/products/gold2/')) {
                imageSet.add(src);
              }
            });
          }
          
          return Array.from(imageSet);
        });
        
        console.log(`  모달 내부 gold2 이미지: ${modalImages.length}개`);
        modalImages.forEach(img => {
          if (img) {
            allImages.add(img);
          }
        });
      }
    } catch (e) {
      console.log('  모달 열기 실패 (정상일 수 있음):', e.message);
    }
    
  } catch (error) {
    console.error(`  ❌ 오류 발생:`, error.message);
  } finally {
    await page.close();
  }
  
  return Array.from(allImages);
}

async function main() {
  const referenceUrl = 'https://mas-lva3ulwew-taksoo-kims-projects.vercel.app';
  const publicDir = path.join(process.cwd(), 'public');
  
  console.log('🔍 원본 사이트에서 gold2 제품 이미지 추출 및 다운로드 시작...');
  console.log(`참조 사이트: ${referenceUrl}`);
  console.log(`저장 경로: ${publicDir}`);
  
  const browser = await playwright.chromium.launch({ headless: true });
  
  try {
    // 홈페이지에서 이미지 추출
    const images = await extractAndDownloadImages(browser, referenceUrl);
    
    console.log(`\n📊 총 발견된 gold2 이미지: ${images.length}개`);
    
    // /main/products/gold2/로 시작하는 이미지만 필터링
    const relevantImages = Array.from(images).filter(url => {
      try {
        const urlObj = new URL(url);
        return urlObj.pathname.startsWith('/main/products/gold2/');
      } catch (e) {
        return false;
      }
    });
    
    console.log(`📁 관련 이미지: ${relevantImages.length}개`);
    
    // 이미지 다운로드
    let successCount = 0;
    let failCount = 0;
    const failedImages = [];
    
    for (let i = 0; i < relevantImages.length; i++) {
      const imageUrl = relevantImages[i];
      const localPath = getLocalPath(imageUrl, referenceUrl);
      
      if (!localPath) {
        console.log(`  ⚠️  경로 추출 실패: ${imageUrl}`);
        failCount++;
        failedImages.push(imageUrl);
        continue;
      }
      
      const fullPath = path.join(publicDir, localPath);
      
      // 이미 존재하는 파일은 덮어쓰기
      if (fs.existsSync(fullPath)) {
        console.log(`  🔄 덮어쓰기: ${localPath}`);
      }
      
      try {
        console.log(`  📥 다운로드 중 (${i + 1}/${relevantImages.length}): ${localPath}`);
        await downloadImage(imageUrl, fullPath);
        console.log(`  ✅ 완료: ${localPath}`);
        successCount++;
      } catch (error) {
        console.error(`  ❌ 실패: ${localPath} - ${error.message}`);
        failCount++;
        failedImages.push({ url: imageUrl, path: localPath, error: error.message });
      }
      
      // 서버 부하 방지를 위한 딜레이
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    // 결과 출력
    console.log(`\n${'='.repeat(60)}`);
    console.log('📊 다운로드 결과:');
    console.log(`${'='.repeat(60)}`);
    console.log(`  총 이미지: ${relevantImages.length}개`);
    console.log(`  성공: ${successCount}개`);
    console.log(`  실패: ${failCount}개`);
    
    if (failedImages.length > 0) {
      console.log(`\n❌ 실패한 이미지 목록:`);
      failedImages.forEach(item => {
        if (typeof item === 'string') {
          console.log(`  - ${item}`);
        } else {
          console.log(`  - ${item.path}: ${item.error}`);
        }
      });
    }
    
    // 다운로드된 이미지 목록 저장
    const downloadedListPath = path.join(process.cwd(), 'downloaded-gold2-images.json');
    const downloadedList = relevantImages.map(url => ({
      url,
      localPath: getLocalPath(url, referenceUrl)
    })).filter(item => item.localPath);
    
    fs.writeFileSync(downloadedListPath, JSON.stringify(downloadedList, null, 2));
    console.log(`📝 다운로드된 이미지 목록 저장: ${downloadedListPath}`);
    
  } catch (error) {
    console.error('❌ 오류 발생:', error);
  } finally {
    await browser.close();
  }
}

main();

