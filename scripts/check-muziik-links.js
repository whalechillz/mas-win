const playwright = require('playwright');

async function checkMuziikLinks() {
  const browser = await playwright.chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  console.log('🔍 MUZIIK 페이지 링크 확인 시작...\n');

  const baseUrl = 'https://masgolf.co.kr/muziik';
  const pagesToCheck = [
    { path: '', name: '메인 페이지' },
    { path: '/sapphire', name: 'Sapphire 제품 페이지' },
    { path: '/beryl', name: 'Beryl 제품 페이지' },
    { path: '/technology', name: '기술소개 페이지' },
    { path: '/about', name: '회사소개 페이지' },
    { path: '/contact', name: '문의하기 페이지' },
  ];

  const allLinks = new Map(); // 페이지별 링크 저장
  const brokenLinks = [];
  const workingLinks = [];

  for (const pageInfo of pagesToCheck) {
    const url = `${baseUrl}${pageInfo.path}`;
    console.log(`\n📄 페이지 확인: ${pageInfo.name}`);
    console.log(`   URL: ${url}`);

    try {
      await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
      await page.waitForTimeout(2000); // 페이지 로딩 대기

      // 네비게이션 링크 추출
      const navLinks = await page.evaluate(() => {
        const links = [];
        const nav = document.querySelector('nav') || document.querySelector('header nav');
        if (nav) {
          const anchorTags = nav.querySelectorAll('a[href]');
          anchorTags.forEach((a) => {
            links.push({
              text: a.textContent.trim(),
              href: a.getAttribute('href'),
              absolute: a.href,
            });
          });
        }
        return links;
      });

      // 페이지 내 모든 링크 추출
      const allPageLinks = await page.evaluate(() => {
        const links = [];
        const anchorTags = document.querySelectorAll('a[href]');
        anchorTags.forEach((a) => {
          const href = a.getAttribute('href');
          // 외부 링크는 제외 (http://, https://, mailto:, tel:)
          if (href && !href.startsWith('http') && !href.startsWith('mailto:') && !href.startsWith('tel:')) {
            links.push({
              text: a.textContent.trim().substring(0, 50),
              href: href,
              absolute: a.href,
            });
          }
        });
        return links;
      });

      console.log(`   네비게이션 링크: ${navLinks.length}개`);
      navLinks.forEach((link) => {
        console.log(`     - ${link.text}: ${link.href}`);
      });

      console.log(`   페이지 내부 링크: ${allPageLinks.length}개`);
      const uniqueLinks = new Map();
      allPageLinks.forEach((link) => {
        if (!uniqueLinks.has(link.href)) {
          uniqueLinks.set(link.href, link);
        }
      });

      allLinks.set(pageInfo.path, {
        navLinks: navLinks,
        pageLinks: Array.from(uniqueLinks.values()),
      });

      // 각 링크 테스트
      for (const link of [...navLinks, ...Array.from(uniqueLinks.values())]) {
        const linkUrl = link.absolute || link.href;
        if (linkUrl && linkUrl.includes('masgolf.co.kr')) {
          try {
            const response = await page.goto(linkUrl, { waitUntil: 'networkidle', timeout: 10000 });
            const status = response.status();
            const finalUrl = page.url();

            if (status >= 200 && status < 400) {
              workingLinks.push({
                page: pageInfo.name,
                text: link.text,
                href: link.href,
                status: status,
                finalUrl: finalUrl,
              });
              console.log(`     ✅ ${link.text}: ${link.href} (${status})`);
            } else {
              brokenLinks.push({
                page: pageInfo.name,
                text: link.text,
                href: link.href,
                status: status,
                finalUrl: finalUrl,
              });
              console.log(`     ❌ ${link.text}: ${link.href} (${status})`);
            }
          } catch (error) {
            brokenLinks.push({
              page: pageInfo.name,
              text: link.text,
              href: link.href,
              error: error.message,
            });
            console.log(`     ❌ ${link.text}: ${link.href} (에러: ${error.message})`);
          }

          // 원래 페이지로 돌아가기
          await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
          await page.waitForTimeout(1000);
        }
      }
    } catch (error) {
      console.error(`   ❌ 페이지 로드 실패: ${error.message}`);
      brokenLinks.push({
        page: pageInfo.name,
        url: url,
        error: error.message,
      });
    }
  }

  console.log('\n============================================================');
  console.log('📊 링크 확인 결과:');
  console.log('============================================================');
  console.log(`✅ 정상 링크: ${workingLinks.length}개`);
  console.log(`❌ 문제 링크: ${brokenLinks.length}개`);

  if (brokenLinks.length > 0) {
    console.log('\n❌ 문제가 있는 링크:');
    brokenLinks.forEach((link) => {
      console.log(`   - [${link.page}] ${link.text || link.href}`);
      if (link.status) {
        console.log(`     상태 코드: ${link.status}`);
      }
      if (link.error) {
        console.log(`     에러: ${link.error}`);
      }
    });
  }

  // 페이지별 링크 구조 출력
  console.log('\n============================================================');
  console.log('📋 페이지별 링크 구조:');
  console.log('============================================================');
  allLinks.forEach((links, path) => {
    console.log(`\n${path || '/'}:`);
    console.log('  네비게이션 링크:');
    links.navLinks.forEach((link) => {
      console.log(`    - ${link.text}: ${link.href}`);
    });
    console.log('  페이지 내부 링크:');
    links.pageLinks.forEach((link) => {
      console.log(`    - ${link.text}: ${link.href}`);
    });
  });

  await browser.close();

  return {
    workingLinks,
    brokenLinks,
    allLinks: Object.fromEntries(allLinks),
  };
}

checkMuziikLinks()
  .then((results) => {
    console.log('\n✅ 링크 확인 완료');
    process.exit(results.brokenLinks.length === 0 ? 0 : 1);
  })
  .catch((error) => {
    console.error('링크 확인 중 에러:', error);
    process.exit(1);
  });

