const playwright = require('playwright');

async function verifyImages(url, pagePath) {
  const browser = await playwright.chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  try {
    console.log(`\n📄 확인 중: ${url}${pagePath}`);
    await page.goto(`${url}${pagePath}`, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(5000); // 이미지 로드 대기
    
    // 이미지 로드 상태 확인
    const images = await page.$$eval('img', imgs => 
      imgs.map(img => ({
        src: img.src,
        alt: img.alt || '',
        complete: img.complete,
        naturalWidth: img.naturalWidth,
        naturalHeight: img.naturalHeight,
        broken: img.naturalWidth === 0 || img.naturalHeight === 0 || !img.complete
      }))
    );
    
    console.log(`  총 ${images.length}개 이미지 확인`);
    
    const brokenImages = images.filter(img => img.broken);
    const loadedImages = images.filter(img => !img.broken);
    
    if (brokenImages.length > 0) {
      console.log(`  ❌ 깨진 이미지: ${brokenImages.length}개`);
      brokenImages.forEach(img => {
        console.log(`    - ${img.src}`);
        console.log(`      alt: ${img.alt}`);
        console.log(`      complete: ${img.complete}, naturalWidth: ${img.naturalWidth}, naturalHeight: ${img.naturalHeight}`);
      });
    } else {
      console.log(`  ✅ 모든 이미지 정상 로드`);
    }
    
    console.log(`  ✅ 정상 로드된 이미지: ${loadedImages.length}개`);
    
    return { 
      total: images.length, 
      broken: brokenImages.length, 
      loaded: loadedImages.length,
      brokenImages
    };
    
  } catch (error) {
    console.error(`  ❌ 오류 발생:`, error.message);
    return { total: 0, broken: 0, loaded: 0, brokenImages: [], error: error.message };
  } finally {
    await page.close();
    await browser.close();
  }
}

async function main() {
  const targetUrl = 'https://mas-3pdmpm9g8-taksoo-kims-projects.vercel.app';
  
  const pages = ['/', '/about', '/contact'];
  
  console.log('🔍 새로 배포된 사이트 이미지 확인 시작...');
  console.log(`대상 사이트: ${targetUrl}`);
  
  const results = [];
  
  for (const pagePath of pages) {
    console.log(`\n${'='.repeat(60)}`);
    const result = await verifyImages(targetUrl, pagePath);
    results.push({ path: pagePath, ...result });
  }
  
  // 요약
  console.log(`\n${'='.repeat(60)}`);
  console.log('📊 전체 요약:');
  console.log(`${'='.repeat(60)}`);
  
  let totalImages = 0;
  let totalBroken = 0;
  let totalLoaded = 0;
  
  results.forEach(result => {
    console.log(`\n[${result.path}]`);
    console.log(`  총 이미지: ${result.total}개`);
    console.log(`  정상 로드: ${result.loaded}개`);
    console.log(`  깨진 이미지: ${result.broken}개`);
    
    totalImages += result.total;
    totalBroken += result.broken;
    totalLoaded += result.loaded;
  });
  
  console.log(`\n${'='.repeat(60)}`);
  console.log('전체 통계:');
  console.log(`  총 이미지: ${totalImages}개`);
  console.log(`  정상 로드: ${totalLoaded}개`);
  console.log(`  깨진 이미지: ${totalBroken}개`);
  console.log(`${'='.repeat(60)}`);
  
  if (totalBroken === 0) {
    console.log('\n✅ 모든 이미지가 정상적으로 로드되었습니다!');
  } else {
    console.log(`\n⚠️  ${totalBroken}개의 이미지가 깨져있습니다.`);
  }
}

main();

