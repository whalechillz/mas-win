const playwright = require('playwright');

async function verifyImages(url, pagePath) {
  const browser = await playwright.chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  try {
    console.log(`\n📄 확인 중: ${url}${pagePath}`);
    await page.goto(`${url}${pagePath}`, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(3000);
    
    // 이미지 로드 상태 확인
    const images = await page.$$eval('img', imgs => 
      imgs.map(img => ({
        src: img.src,
        alt: img.alt,
        complete: img.complete,
        naturalWidth: img.naturalWidth,
        naturalHeight: img.naturalHeight,
        broken: img.naturalWidth === 0 || img.naturalHeight === 0 || !img.complete
      }))
    );
    
    console.log(`  총 ${images.length}개 이미지 확인`);
    
    const brokenImages = images.filter(img => img.broken);
    if (brokenImages.length > 0) {
      console.log(`  ❌ 깨진 이미지: ${brokenImages.length}개`);
      brokenImages.forEach(img => {
        console.log(`    - ${img.src}`);
      });
    } else {
      console.log(`  ✅ 모든 이미지 정상`);
    }
    
    return { total: images.length, broken: brokenImages.length, brokenImages };
    
  } catch (error) {
    console.error(`  ❌ 오류 발생:`, error.message);
    return { total: 0, broken: 0, brokenImages: [], error: error.message };
  } finally {
    await page.close();
    await browser.close();
  }
}

async function main() {
  const referenceUrl = 'https://mas-lva3ulwew-taksoo-kims-projects.vercel.app';
  const targetUrl = 'https://mas-dzh1suyp7-taksoo-kims-projects.vercel.app';
  
  const pages = ['/', '/about', '/contact'];
  
  console.log('🔍 이미지 확인 시작...');
  
  for (const pagePath of pages) {
    console.log(`\n=== 참조 사이트 ===`);
    await verifyImages(referenceUrl, pagePath);
    
    console.log(`\n=== 대상 사이트 ===`);
    await verifyImages(targetUrl, pagePath);
  }
}

main();

