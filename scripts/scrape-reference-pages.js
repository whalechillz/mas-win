const playwright = require('playwright');
const fs = require('fs');

async function scrapePage(browser, url, outputPath) {
  const page = await browser.newPage();
  
  try {
    console.log(`📄 스크래핑 중: ${url}`);
    await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(5000); // 이미지 로드 대기
    
    // HTML 가져오기
    const html = await page.content();
    
    // 파일로 저장
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
    await page.close();
  }
}

async function main() {
  const baseUrl = 'https://mas-lva3ulwew-taksoo-kims-projects.vercel.app';
  const pagesToScrape = [
    { url: baseUrl, outputPath: './scraped-pages/reference-home.html' },
    { url: `${baseUrl}/about`, outputPath: './scraped-pages/reference-about.html' },
    { url: `${baseUrl}/contact`, outputPath: './scraped-pages/reference-contact.html' },
  ];

  const browser = await playwright.chromium.launch({ headless: true });
  
  // 디렉토리 생성
  if (!fs.existsSync('./scraped-pages')) {
    fs.mkdirSync('./scraped-pages', { recursive: true });
  }

  for (const pageInfo of pagesToScrape) {
    await scrapePage(browser, pageInfo.url, pageInfo.outputPath);
  }
  
  await browser.close();
  console.log('\n✅ 모든 페이지 스크래핑 완료');
}

main();

