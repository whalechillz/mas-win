const { chromium } = require('playwright');
const fs = require('fs').promises;
const path = require('path');

async function crawlMas9golfComplete() {
  console.log('🚀 mas9golf.com 완전 백업 시작! (Chrome Canary 사용)');
  
  const browser = await chromium.launch({ 
    headless: false,
    executablePath: '/Applications/Google Chrome Canary.app/Contents/MacOS/Google Chrome Canary',
    args: [
      '--lang=ko-KR',
      '--disable-gpu',
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-blink-features=AutomationControlled',
      '--disable-extensions',
      '--disable-component-extensions-with-background-pages',
      '--disable-default-apps',
      '--disable-popup-blocking',
      '--disable-sync',
      '--disable-features=Translate',
      '--metrics-recording-only',
      '--mute-audio',
      '--no-first-run',
      '--disable-hang-monitor',
      '--disable-ipc-flooding-protection',
      '--disable-prompt-on-repost',
      '--disable-renderer-backgrounding',
      '--disable-background-timer-throttling',
      '--disable-backgrounding-occluded-windows',
      '--disable-breakpad',
      '--disable-client-side-phishing-detection',
      '--disable-cloud-import',
      '--disable-component-update',
      '--disable-domain-reliability',
      '--disable-field-trial-config',
      '--disable-full-form-autofill-ios',
      '--disable-gesture-requirement-for-media-playback',
      '--disable-infobars',
      '--disable-logging',
      '--disable-low-end-device-mode',
      '--disable-notifications',
      '--disable-offer-store-unmasked-wallet-cards',
      '--disable-offer-upload-credits',
      '--disable-print-preview',
      '--disable-setuid-sandbox',
      '--disable-site-specific-hsts-for-testing',
      '--disable-speech-api',
      '--disable-web-security',
      '--enable-automation',
      '--enable-blink-features=IdleDetection',
      '--enable-features=NetworkService,NetworkServiceInProcess',
      '--force-color-profile=srgb',
      '--ignore-certificate-errors',
      '--log-level=3',
      '--no-default-browser-check',
      '--no-pings',
      '--no-sandbox',
      '--no-zygote',
      '--password-store=basic',
      '--use-fake-ui-for-media-stream',
      '--use-mock-keychain',
      '--max_old_space_size=4096',
      '--memory-pressure-off'
    ]
  });
  
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36',
    locale: 'ko-KR',
    timezoneId: 'Asia/Seoul',
    userDataDir: '/tmp/playwright_user_data_canary'
  });
  
  const page = await context.newPage();
  
  // 자동화 감지 방지
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'webdriver', { get: () => false });
    window.chrome = { runtime: {}, csi: () => {}, loadTimes: () => {} };
    Object.defineProperty(navigator, 'plugins', { get: () => [1, 2, 3, 4, 5] });
    Object.defineProperty(navigator, 'languages', { get: () => ['ko-KR', 'ko'] });
    const originalPermissions = navigator.permissions;
    Object.defineProperty(navigator, 'permissions', {
      get: () => ({
        query: (parameters) =>
          parameters.name === 'notifications'
            ? Promise.resolve({ state: Notification.permission })
            : originalPermissions.query(parameters),
      }),
    });
  });
  
  try {
    console.log('🌐 mas9golf.com 사이트 분석 시작...');
    
    // 1단계: 메인 페이지 크롤링
    const mainUrl = 'https://www.mas9golf.com';
    const crawledPages = [];
    const linksToCrawl = new Set();
    const crawledUrls = new Set();
    
    linksToCrawl.add(mainUrl);
    
    console.log('📄 1단계: 모든 페이지 링크 수집...');
    
    while (linksToCrawl.size > 0) {
      const currentUrl = Array.from(linksToCrawl)[0];
      linksToCrawl.delete(currentUrl);
      
      if (crawledUrls.has(currentUrl)) continue;
      crawledUrls.add(currentUrl);
      
      try {
        console.log(`📄 크롤링 중: ${currentUrl}`);
        await page.goto(currentUrl, { waitUntil: 'networkidle', timeout: 30000 });
        await page.waitForTimeout(2000);
        
        const pageData = await page.evaluate(() => {
          const title = document.title;
          const content = document.documentElement.outerHTML;
          const text = document.body.innerText;
          const url = window.location.href;
          
          // 이미지 수집
          const images = Array.from(document.querySelectorAll('img')).map(img => ({
            src: img.src,
            alt: img.alt,
            width: img.width,
            height: img.height,
            title: img.title
          }));
          
          // CSS 파일 수집
          const stylesheets = Array.from(document.querySelectorAll('link[rel="stylesheet"]')).map(link => link.href);
          
          // JavaScript 파일 수집
          const scripts = Array.from(document.querySelectorAll('script[src]')).map(script => script.src);
          
          // 내부 링크 수집
          const links = Array.from(document.querySelectorAll('a[href]')).map(link => {
            const href = link.href;
            if (href.includes('mas9golf.com') && !href.includes('#') && !href.includes('mailto:') && !href.includes('tel:')) {
              return href;
            }
            return null;
          }).filter(Boolean);
          
          // 메타 정보 수집
          const meta = {
            description: document.querySelector('meta[name="description"]')?.content,
            keywords: document.querySelector('meta[name="keywords"]')?.content,
            author: document.querySelector('meta[name="author"]')?.content,
            viewport: document.querySelector('meta[name="viewport"]')?.content
          };
          
          return {
            url,
            title,
            content,
            text,
            images,
            stylesheets,
            scripts,
            links,
            meta,
            crawledAt: new Date().toISOString()
          };
        });
        
        crawledPages.push(pageData);
        
        // 새로운 링크들을 큐에 추가
        pageData.links.forEach(link => {
          if (!crawledUrls.has(link)) {
            linksToCrawl.add(link);
          }
        });
        
        console.log(`✅ 완료: ${currentUrl} (링크 ${pageData.links.length}개 발견, 이미지 ${pageData.images.length}개)`);
        
      } catch (error) {
        console.log(`❌ 오류: ${currentUrl} - ${error.message}`);
      }
    }
    
    console.log(`📊 총 ${crawledPages.length}개 페이지 발견`);
    
    // 2단계: 모바일 버전 크롤링
    console.log('📱 2단계: 모바일 버전 크롤링...');
    await page.setViewportSize({ width: 375, height: 667 });
    
    for (const pageData of crawledPages.slice(0, 10)) { // 처음 10개 페이지만 모바일 버전
      try {
        console.log(`📱 모바일 크롤링: ${pageData.url}`);
        await page.goto(pageData.url, { waitUntil: 'networkidle', timeout: 30000 });
        await page.waitForTimeout(2000);
        
        const mobileData = await page.evaluate(() => {
          const title = document.title;
          const content = document.documentElement.outerHTML;
          const text = document.body.innerText;
          const url = window.location.href;
          
          const images = Array.from(document.querySelectorAll('img')).map(img => ({
            src: img.src,
            alt: img.alt,
            width: img.width,
            height: img.height,
            title: img.title
          }));
          
          return {
            url: url + '?mobile=true',
            title,
            content,
            text,
            images,
            isMobile: true,
            crawledAt: new Date().toISOString()
          };
        });
        
        crawledPages.push(mobileData);
        console.log(`✅ 모바일 완료: ${pageData.url}`);
        
      } catch (error) {
        console.log(`❌ 모바일 오류: ${pageData.url} - ${error.message}`);
      }
    }
    
    // 3단계: 데이터 저장
    console.log('💾 3단계: 데이터 저장 중...');
    
    // 디렉토리 생성
    await fs.mkdir('mas9golf/pages', { recursive: true });
    await fs.mkdir('mas9golf/assets/images', { recursive: true });
    await fs.mkdir('mas9golf/assets/css', { recursive: true });
    await fs.mkdir('mas9golf/assets/js', { recursive: true });
    await fs.mkdir('mas9golf/data', { recursive: true });
    
    // 각 페이지 저장
    for (const pageData of crawledPages) {
      const url = new URL(pageData.url);
      const pathname = url.pathname === '/' ? 'index' : url.pathname.replace(/\//g, '_').replace(/^_/, '');
      const filename = pageData.isMobile ? `${pathname}_mobile` : pathname;
      
      // HTML 파일 저장
      await fs.writeFile(
        `mas9golf/pages/${filename}.html`,
        pageData.content,
        'utf8'
      );
      
      // 메타데이터 JSON 저장
      await fs.writeFile(
        `mas9golf/pages/${filename}.json`,
        JSON.stringify({
          url: pageData.url,
          title: pageData.title,
          meta: pageData.meta,
          images: pageData.images,
          stylesheets: pageData.stylesheets,
          scripts: pageData.scripts,
          text: pageData.text.substring(0, 2000), // 텍스트는 2000자까지만
          isMobile: pageData.isMobile || false,
          crawledAt: pageData.crawledAt
        }, null, 2),
        'utf8'
      );
    }
    
    // 전체 요약 데이터 저장
    const summary = {
      totalPages: crawledPages.length,
      desktopPages: crawledPages.filter(p => !p.isMobile).length,
      mobilePages: crawledPages.filter(p => p.isMobile).length,
      totalImages: crawledPages.reduce((sum, p) => sum + p.images.length, 0),
      totalStylesheets: [...new Set(crawledPages.flatMap(p => p.stylesheets))].length,
      totalScripts: [...new Set(crawledPages.flatMap(p => p.scripts))].length,
      crawledAt: new Date().toISOString(),
      pages: crawledPages.map(p => ({
        url: p.url,
        title: p.title,
        imageCount: p.images.length,
        stylesheetCount: p.stylesheets.length,
        scriptCount: p.scripts.length,
        isMobile: p.isMobile || false
      }))
    };
    
    await fs.writeFile(
      'mas9golf/data/crawl-summary.json',
      JSON.stringify(summary, null, 2),
      'utf8'
    );
    
    // 사이트맵 생성
    const sitemap = crawledPages.map(p => ({
      url: p.url,
      title: p.title,
      isMobile: p.isMobile || false
    }));
    
    await fs.writeFile(
      'mas9golf/data/sitemap.json',
      JSON.stringify(sitemap, null, 2),
      'utf8'
    );
    
    console.log(`🎉 완전 백업 완료!`);
    console.log(`📊 결과:`);
    console.log(`   - 총 페이지: ${summary.totalPages}개`);
    console.log(`   - 데스크톱: ${summary.desktopPages}개`);
    console.log(`   - 모바일: ${summary.mobilePages}개`);
    console.log(`   - 총 이미지: ${summary.totalImages}개`);
    console.log(`   - CSS 파일: ${summary.totalStylesheets}개`);
    console.log(`   - JS 파일: ${summary.totalScripts}개`);
    console.log(`📁 저장 위치: mas9golf/ 폴더`);
    
  } catch (error) {
    console.error('❌ 크롤링 중 오류 발생:', error);
  } finally {
    await browser.close();
  }
}

crawlMas9golfComplete().catch(console.error);
