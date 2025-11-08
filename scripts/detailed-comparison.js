const playwright = require('playwright');
const fs = require('fs');

async function comparePages(browser, referenceUrl, targetUrl, pagePath) {
  const page = await browser.newPage();
  const issues = [];

  try {
    console.log(`\n📄 비교 중: ${pagePath}`);
    
    // 참조 페이지 (원본)
    await page.goto(`${referenceUrl}${pagePath}`, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(5000);
    const referenceHTML = await page.content();
    
    // 주요 요소 추출
    const referenceData = await page.evaluate(() => {
      const getTextContent = (selector) => {
        const el = document.querySelector(selector);
        return el ? el.textContent.trim() : '';
      };
      
      const getImageSrc = (selector) => {
        const el = document.querySelector(selector);
        if (!el) return null;
        // 상대 경로를 절대 경로로 변환
        const src = el.src || el.getAttribute('src');
        if (src && src.startsWith('/')) {
          return src; // 상대 경로 반환
        }
        return src;
      };
      
      return {
        title: getTextContent('title'),
        h1: getTextContent('h1'),
        logo: getImageSrc('header img[alt*="로고"]'),
        heroImage: getImageSrc('section img[alt*="히어로"]'),
        navLinks: Array.from(document.querySelectorAll('nav a')).map(a => ({
          text: a.textContent.trim(),
          href: a.href.replace(window.location.origin, '')
        })),
        mainSections: Array.from(document.querySelectorAll('section[id]')).map(s => ({
          id: s.id,
          title: s.querySelector('h2') ? s.querySelector('h2').textContent.trim() : ''
        }))
      };
    });

    // 대상 페이지 (새로 배포된 버전)
    await page.goto(`${targetUrl}${pagePath}`, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(5000);
    const targetHTML = await page.content();
    
    // 주요 요소 추출
    const targetData = await page.evaluate(() => {
      const getTextContent = (selector) => {
        const el = document.querySelector(selector);
        return el ? el.textContent.trim() : '';
      };
      
      const getImageSrc = (selector) => {
        const el = document.querySelector(selector);
        if (!el) return null;
        const src = el.src || el.getAttribute('src');
        if (src && src.startsWith('/')) {
          return src;
        }
        return src;
      };
      
      return {
        title: getTextContent('title'),
        h1: getTextContent('h1'),
        logo: getImageSrc('header img[alt*="로고"]'),
        heroImage: getImageSrc('section img[alt*="히어로"]'),
        navLinks: Array.from(document.querySelectorAll('nav a')).map(a => ({
          text: a.textContent.trim(),
          href: a.href.replace(window.location.origin, '')
        })),
        mainSections: Array.from(document.querySelectorAll('section[id]')).map(s => ({
          id: s.id,
          title: s.querySelector('h2') ? s.querySelector('h2').textContent.trim() : ''
        }))
      };
    });

    // 비교
    if (referenceData.title !== targetData.title) {
      issues.push({
        type: 'content',
        issue: '제목 다름',
        path: pagePath,
        reference: referenceData.title,
        target: targetData.title
      });
    }

    if (referenceData.h1 !== targetData.h1) {
      issues.push({
        type: 'content',
        issue: 'H1 텍스트 다름',
        path: pagePath,
        reference: referenceData.h1,
        target: targetData.h1
      });
    }

    // 로고 이미지 경로 비교 (도메인 제외)
    const refLogoPath = referenceData.logo ? referenceData.logo.replace(referenceUrl, '') : null;
    const targetLogoPath = targetData.logo ? targetData.logo.replace(targetUrl, '') : null;
    if (refLogoPath !== targetLogoPath) {
      issues.push({
        type: 'image',
        issue: '로고 이미지 경로 다름',
        path: pagePath,
        reference: refLogoPath,
        target: targetLogoPath
      });
    }

    // 히어로 이미지 경로 비교 (도메인 제외)
    const refHeroPath = referenceData.heroImage ? referenceData.heroImage.replace(referenceUrl, '') : null;
    const targetHeroPath = targetData.heroImage ? targetData.heroImage.replace(targetUrl, '') : null;
    if (refHeroPath !== targetHeroPath) {
      issues.push({
        type: 'image',
        issue: '히어로 이미지 경로 다름',
        path: pagePath,
        reference: refHeroPath,
        target: targetHeroPath
      });
    }

    // 네비게이션 링크 비교
    if (referenceData.navLinks.length !== targetData.navLinks.length) {
      issues.push({
        type: 'link',
        issue: '네비게이션 링크 개수 다름',
        path: pagePath,
        reference: referenceData.navLinks.length,
        target: targetData.navLinks.length
      });
    } else {
      for (let i = 0; i < referenceData.navLinks.length; i++) {
        const refLink = referenceData.navLinks[i];
        const targetLink = targetData.navLinks[i];
        
        const refHref = refLink.href.replace(referenceUrl, '');
        const targetHref = targetLink.href.replace(targetUrl, '');
        
        if (refHref !== targetHref || refLink.text !== targetLink.text) {
          issues.push({
            type: 'link',
            issue: '네비게이션 링크 다름',
            path: pagePath,
            reference: { text: refLink.text, href: refHref },
            target: { text: targetLink.text, href: targetHref }
          });
        }
      }
    }

    // 섹션 비교
    if (referenceData.mainSections.length !== targetData.mainSections.length) {
      issues.push({
        type: 'content',
        issue: '섹션 개수 다름',
        path: pagePath,
        reference: referenceData.mainSections.length,
        target: targetData.mainSections.length
      });
    }

    console.log(`  ✅ 비교 완료: ${issues.length}개 이슈 발견`);

  } catch (error) {
    console.error(`  ❌ 오류 발생:`, error.message);
    issues.push({
      type: 'error',
      issue: '페이지 비교 실패',
      path: pagePath,
      error: error.message
    });
  } finally {
    await page.close();
  }

  return issues;
}

async function main() {
  const referenceUrl = 'https://mas-lva3ulwew-taksoo-kims-projects.vercel.app';
  const targetUrl = 'https://mas-dzh1suyp7-taksoo-kims-projects.vercel.app';
  
  const pages = ['/', '/about', '/contact'];

  console.log('🔍 상세 비교 시작...');
  console.log(`참조 사이트: ${referenceUrl}`);
  console.log(`대상 사이트: ${targetUrl}`);

  const browser = await playwright.chromium.launch({ headless: true });
  const allIssues = [];

  try {
    for (const pagePath of pages) {
      const issues = await comparePages(browser, referenceUrl, targetUrl, pagePath);
      allIssues.push(...issues);
    }

    // 결과 출력
    console.log('\n📊 비교 결과:');
    console.log(`총 ${allIssues.length}개의 이슈 발견`);
    
    const imageIssues = allIssues.filter(i => i.type === 'image');
    const linkIssues = allIssues.filter(i => i.type === 'link');
    const contentIssues = allIssues.filter(i => i.type === 'content');
    const errors = allIssues.filter(i => i.type === 'error');

    if (imageIssues.length > 0) {
      console.log(`\n이미지 이슈: ${imageIssues.length}개`);
      imageIssues.forEach(issue => {
        console.log(`  - [${issue.path}] ${issue.issue}`);
        if (issue.reference) console.log(`    참조: ${issue.reference}`);
        if (issue.target) console.log(`    대상: ${issue.target}`);
      });
    }

    if (linkIssues.length > 0) {
      console.log(`\n링크 이슈: ${linkIssues.length}개`);
      linkIssues.forEach(issue => {
        console.log(`  - [${issue.path}] ${issue.issue}`);
        if (issue.reference) console.log(`    참조:`, issue.reference);
        if (issue.target) console.log(`    대상:`, issue.target);
      });
    }

    if (contentIssues.length > 0) {
      console.log(`\n내용 이슈: ${contentIssues.length}개`);
      contentIssues.forEach(issue => {
        console.log(`  - [${issue.path}] ${issue.issue}`);
        if (issue.reference) console.log(`    참조: ${issue.reference}`);
        if (issue.target) console.log(`    대상: ${issue.target}`);
      });
    }

    if (errors.length > 0) {
      console.log(`\n오류: ${errors.length}개`);
      errors.forEach(issue => {
        console.log(`  - [${issue.path}] ${issue.error}`);
      });
    }

    // JSON 파일로 저장
    fs.writeFileSync('./detailed-comparison-results.json', JSON.stringify(allIssues, null, 2));
    console.log('\n✅ 결과 저장: ./detailed-comparison-results.json');

    if (allIssues.length === 0) {
      console.log('\n✅ 모든 페이지가 동일합니다!');
    }

  } catch (error) {
    console.error('❌ 비교 중 오류 발생:', error);
  } finally {
    await browser.close();
  }
}

main();

