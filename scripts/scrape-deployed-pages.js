const playwright = require('playwright');

async function scrapePage(url, outputPath) {
  const browser = await playwright.chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  try {
    console.log(`📄 스크래핑 중: ${url}`);
    await page.goto(url, { waitUntil: 'networkidle' });
    
    // 페이지가 완전히 로드될 때까지 대기
    await page.waitForTimeout(3000);
    
    // HTML 가져오기
    const html = await page.content();
    
    // 파일로 저장
    const fs = require('fs');
    fs.writeFileSync(outputPath, html, 'utf8');
    console.log(`✅ 저장 완료: ${outputPath}`);
    
    // 스크린샷도 저장
    const screenshotPath = outputPath.replace('.html', '.png');
    await page.screenshot({ path: screenshotPath, fullPage: true });
    console.log(`📸 스크린샷 저장: ${screenshotPath}`);
    
    return html;
  } catch (error) {
    console.error(`❌ 오류 발생 (${url}):`, error.message);
    return null;
  } finally {
    await browser.close();
  }
}

async function main() {
  const baseUrl = 'https://mas-lva3ulwew-taksoo-kims-projects.vercel.app';
  const pages = [
    { path: '/', name: 'home' },
    { path: '/about', name: 'about' },
    { path: '/contact', name: 'contact' },
  ];
  
  const outputDir = './scraped-pages';
  const fs = require('fs');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  console.log('🚀 배포된 페이지 스크래핑 시작...\n');
  
  for (const page of pages) {
    const url = `${baseUrl}${page.path}`;
    const outputPath = `${outputDir}/${page.name}.html`;
    await scrapePage(url, outputPath);
    console.log('');
  }
  
  console.log('✅ 모든 페이지 스크래핑 완료!');
}

main().catch(console.error);

