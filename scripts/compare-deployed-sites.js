const playwright = require('playwright');

async function comparePages(browser, targetUrl, referenceUrl, pagePath) {
  const page = await browser.newPage();
  const issues = [];
  let pageClosed = false;

  try {
    console.log(`\n📄 확인 중: ${pagePath}`);
    
    // 참조 페이지 (원본)
    await page.goto(`${referenceUrl}${pagePath}`, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(2000);
    const referenceContent = await page.content();
    const referenceImages = await page.$$eval('img', imgs => 
      imgs.map(img => ({
        src: img.src,
        alt: img.alt,
        width: img.naturalWidth,
        height: img.naturalHeight,
        broken: img.naturalWidth === 0 || img.naturalHeight === 0
      }))
    );
    const referenceLinks = await page.$$eval('a[href]', links => 
      links.map(link => ({
        href: link.href,
        text: link.textContent.trim(),
        broken: false
      }))
    );

    // 대상 페이지 (새로 배포된 버전)
    await page.goto(`${targetUrl}${pagePath}`, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(2000);
    const targetContent = await page.content();
    const targetImages = await page.$$eval('img', imgs => 
      imgs.map(img => ({
        src: img.src,
        alt: img.alt,
        width: img.naturalWidth,
        height: img.naturalHeight,
        broken: img.naturalWidth === 0 || img.naturalHeight === 0
      }))
    );
    const targetLinks = await page.$$eval('a[href]', links => 
      links.map(link => ({
        href: link.href,
        text: link.textContent.trim(),
        broken: false
      }))
    );

    // 이미지 비교
    console.log(`  이미지 확인: 참조 ${referenceImages.length}개, 대상 ${targetImages.length}개`);
    for (let i = 0; i < Math.max(referenceImages.length, targetImages.length); i++) {
      const refImg = referenceImages[i];
      const targetImg = targetImages[i];
      
      if (!refImg && targetImg) {
        issues.push({
          type: 'image',
          issue: '추가된 이미지',
          path: pagePath,
          target: targetImg.src
        });
      } else if (refImg && !targetImg) {
        issues.push({
          type: 'image',
          issue: '누락된 이미지',
          path: pagePath,
          reference: refImg.src
        });
      } else if (refImg && targetImg) {
        if (refImg.src !== targetImg.src) {
          issues.push({
            type: 'image',
            issue: '이미지 경로 다름',
            path: pagePath,
            reference: refImg.src,
            target: targetImg.src
          });
        }
        if (refImg.broken && !targetImg.broken) {
          issues.push({
            type: 'image',
            issue: '참조 이미지 깨짐',
            path: pagePath,
            reference: refImg.src
          });
        }
        if (!refImg.broken && targetImg.broken) {
          issues.push({
            type: 'image',
            issue: '대상 이미지 깨짐',
            path: pagePath,
            target: targetImg.src
          });
        }
      }
    }

    // 링크 비교
    console.log(`  링크 확인: 참조 ${referenceLinks.length}개, 대상 ${targetLinks.length}개`);
    for (let i = 0; i < Math.max(referenceLinks.length, targetLinks.length); i++) {
      const refLink = referenceLinks[i];
      const targetLink = targetLinks[i];
      
      if (!refLink && targetLink) {
        issues.push({
          type: 'link',
          issue: '추가된 링크',
          path: pagePath,
          target: targetLink.href
        });
      } else if (refLink && !targetLink) {
        issues.push({
          type: 'link',
          issue: '누락된 링크',
          path: pagePath,
          reference: refLink.href
        });
      } else if (refLink && targetLink) {
        if (refLink.href !== targetLink.href) {
          issues.push({
            type: 'link',
            issue: '링크 경로 다름',
            path: pagePath,
            reference: refLink.href,
            target: targetLink.href,
            text: refLink.text
          });
        }
      }
    }

    // 주요 텍스트 내용 비교
    const refTitle = await page.evaluate(() => {
      const title = document.querySelector('title');
      return title ? title.textContent : '';
    });
    
    await page.goto(`${targetUrl}${pagePath}`, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(2000);
    const targetTitle = await page.evaluate(() => {
      const title = document.querySelector('title');
      return title ? title.textContent : '';
    });

    if (refTitle !== targetTitle) {
      issues.push({
        type: 'content',
        issue: '제목 다름',
        path: pagePath,
        reference: refTitle,
        target: targetTitle
      });
    }

    // 주요 섹션 텍스트 비교
    const refMainText = await page.evaluate(() => {
      const h1 = document.querySelector('h1');
      return h1 ? h1.textContent.trim() : '';
    });
    
    await page.goto(`${targetUrl}${pagePath}`, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(2000);
    const targetMainText = await page.evaluate(() => {
      const h1 = document.querySelector('h1');
      return h1 ? h1.textContent.trim() : '';
    });

    if (refMainText && targetMainText && refMainText !== targetMainText) {
      issues.push({
        type: 'content',
        issue: '메인 텍스트 다름',
        path: pagePath,
        reference: refMainText,
        target: targetMainText
      });
    }

    // 스크린샷 저장
    await page.goto(`${targetUrl}${pagePath}`, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(2000);
    const screenshotPath = `./comparison-screenshots/${pagePath.replace(/\//g, '_') || 'home'}.png`;
    await page.screenshot({ path: screenshotPath, fullPage: true });
    console.log(`  📸 스크린샷 저장: ${screenshotPath}`);

  } catch (error) {
    console.error(`  ❌ 오류 발생 (${pagePath}):`, error.message);
    issues.push({
      type: 'error',
      issue: '페이지 로드 실패',
      path: pagePath,
      error: error.message
    });
  } finally {
    if (!pageClosed) {
      await page.close();
      pageClosed = true;
    }
  }

  return issues;
}

async function main() {
  const referenceUrl = 'https://mas-lva3ulwew-taksoo-kims-projects.vercel.app';
  const targetUrl = 'https://mas-dzh1suyp7-taksoo-kims-projects.vercel.app';
  
  const pages = [
    '/',
    '/about',
    '/contact'
  ];

  console.log('🔍 배포된 사이트 비교 시작...');
  console.log(`참조 사이트: ${referenceUrl}`);
  console.log(`대상 사이트: ${targetUrl}`);

  const browser = await playwright.chromium.launch({ headless: true });
  const allIssues = [];

  try {
    // 스크린샷 디렉토리 생성
    const fs = require('fs');
    if (!fs.existsSync('./comparison-screenshots')) {
      fs.mkdirSync('./comparison-screenshots', { recursive: true });
    }

    for (const pagePath of pages) {
      const issues = await comparePages(browser, targetUrl, referenceUrl, pagePath);
      allIssues.push(...issues);
    }

    // 결과 출력
    console.log('\n📊 비교 결과:');
    console.log(`총 ${allIssues.length}개의 이슈 발견`);
    
    const imageIssues = allIssues.filter(i => i.type === 'image');
    const linkIssues = allIssues.filter(i => i.type === 'link');
    const contentIssues = allIssues.filter(i => i.type === 'content');
    const errors = allIssues.filter(i => i.type === 'error');

    console.log(`\n이미지 이슈: ${imageIssues.length}개`);
    imageIssues.forEach(issue => {
      console.log(`  - [${issue.path}] ${issue.issue}`);
      if (issue.reference) console.log(`    참조: ${issue.reference}`);
      if (issue.target) console.log(`    대상: ${issue.target}`);
    });

    console.log(`\n링크 이슈: ${linkIssues.length}개`);
    linkIssues.forEach(issue => {
      console.log(`  - [${issue.path}] ${issue.issue}`);
      if (issue.reference) console.log(`    참조: ${issue.reference}`);
      if (issue.target) console.log(`    대상: ${issue.target}`);
      if (issue.text) console.log(`    텍스트: ${issue.text}`);
    });

    console.log(`\n내용 이슈: ${contentIssues.length}개`);
    contentIssues.forEach(issue => {
      console.log(`  - [${issue.path}] ${issue.issue}`);
      if (issue.reference) console.log(`    참조: ${issue.reference}`);
      if (issue.target) console.log(`    대상: ${issue.target}`);
    });

    if (errors.length > 0) {
      console.log(`\n오류: ${errors.length}개`);
      errors.forEach(issue => {
        console.log(`  - [${issue.path}] ${issue.error}`);
      });
    }

    // JSON 파일로 저장
    fs.writeFileSync('./comparison-results.json', JSON.stringify(allIssues, null, 2));
    console.log('\n✅ 결과 저장: ./comparison-results.json');

  } catch (error) {
    console.error('❌ 비교 중 오류 발생:', error);
  } finally {
    await browser.close();
  }
}

main();

