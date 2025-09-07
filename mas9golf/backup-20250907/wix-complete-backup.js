const { chromium } = require('playwright');
const fs = require('fs').promises;
const path = require('path');

const OUTPUT_DIR = 'mas9golf';
const PAGES_DIR = path.join(OUTPUT_DIR, 'pages');
const MENU_DIR = path.join(OUTPUT_DIR, 'menu');
const SEO_DIR = path.join(OUTPUT_DIR, 'seo');
const BLOG_DIR = path.join(OUTPUT_DIR, 'blog');
const CUSTOMERS_DIR = path.join(OUTPUT_DIR, 'customers');
const CATALOG_DIR = path.join(OUTPUT_DIR, 'catalog');
const SETTINGS_DIR = path.join(OUTPUT_DIR, 'settings');
const CRAWL_SUMMARY_FILE = path.join(OUTPUT_DIR, 'complete-backup-summary.json');

let crawlSummary = {
  startTime: new Date().toISOString(),
  endTime: null,
  pages: [],
  menu: {},
  seo: {},
  blog: [],
  customers: [],
  catalog: [],
  settings: {},
  errors: []
};

async function ensureDirs() {
  const dirs = [PAGES_DIR, MENU_DIR, SEO_DIR, BLOG_DIR, CUSTOMERS_DIR, CATALOG_DIR, SETTINGS_DIR];
  for (const dir of dirs) {
    await fs.mkdir(dir, { recursive: true });
  }
}

async function backupAllPages(page) {
  console.log('📄 1. 모든 페이지 백업 시작...');
  
  try {
    // 사이트 편집기로 이동
    await page.goto('https://editor.wix.com/html/editor/web/renderer/edit/2343aa61-07d2-4bc1-9134-4127007d39?metaSiteId=9fd66b1e-f894-49ab-9e3a-b41aac392bd7', { waitUntil: 'networkidle', timeout: 60000 });
    await page.waitForTimeout(5000);
    
    // 페이지 목록 수집
    const pages = await page.evaluate(() => {
      const pageList = [];
      
      // 페이지 메뉴에서 모든 페이지 수집
      const pageElements = document.querySelectorAll('[data-testid*="page"], [class*="page-item"], [class*="page-list"] a');
      pageElements.forEach((element, index) => {
        try {
          const title = element.textContent?.trim();
          const href = element.href;
          if (title && href) {
            pageList.push({
              title: title,
              url: href,
              index: index
            });
          }
        } catch (e) {
          console.log('페이지 요소 파싱 오류:', e);
        }
      });
      
      return pageList;
    });
    
    console.log(`📊 발견된 페이지: ${pages.length}개`);
    
    // 각 페이지 상세 정보 수집
    for (let i = 0; i < pages.length; i++) {
      const pageInfo = pages[i];
      try {
        console.log(`📖 페이지 수집: ${pageInfo.title}`);
        
        // 페이지로 이동
        await page.goto(pageInfo.url, { waitUntil: 'networkidle', timeout: 30000 });
        await page.waitForTimeout(2000);
        
        // 페이지 상세 정보 수집
        const pageDetail = await page.evaluate(() => {
          return {
            title: document.title,
            url: window.location.href,
            content: document.body.innerText,
            html: document.documentElement.outerHTML,
            images: Array.from(document.querySelectorAll('img')).map(img => ({
              src: img.src,
              alt: img.alt,
              width: img.width,
              height: img.height
            })),
            links: Array.from(document.querySelectorAll('a[href]')).map(link => ({
              text: link.textContent.trim(),
              href: link.href
            })),
            metaTags: Array.from(document.querySelectorAll('meta')).map(meta => ({
              name: meta.getAttribute('name') || meta.getAttribute('property'),
              content: meta.getAttribute('content')
            })).filter(meta => meta.name && meta.content)
          };
        });
        
        pages[i].detail = pageDetail;
        crawlSummary.pages.push(pageDetail);
        
        // 개별 페이지 파일 저장
        await fs.writeFile(
          path.join(PAGES_DIR, `page-${i + 1}-${pageInfo.title.replace(/[^a-zA-Z0-9]/g, '_')}.json`),
          JSON.stringify(pageDetail, null, 2),
          'utf8'
        );
        
        console.log(`✅ 페이지 수집 완료: ${pageInfo.title}`);
        
      } catch (e) {
        console.log(`❌ 페이지 수집 실패: ${pageInfo.title} - ${e.message}`);
        crawlSummary.errors.push({ type: 'page', title: pageInfo.title, error: e.message });
      }
    }
    
  } catch (error) {
    console.error('❌ 페이지 백업 중 오류:', error);
    crawlSummary.errors.push({ type: 'pages_backup', error: error.message });
  }
}

async function backupMenuStructure(page) {
  console.log('📋 2. 메뉴 구조 백업 시작...');
  
  try {
    // 메인 페이지로 이동
    await page.goto('https://www.mas9golf.com', { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(3000);
    
    const menuStructure = await page.evaluate(() => {
      const menu = {
        mainMenu: [],
        footerMenu: [],
        mobileMenu: []
      };
      
      // 메인 메뉴 수집
      const mainMenuElements = document.querySelectorAll('nav a, [class*="menu"] a, [class*="navigation"] a');
      mainMenuElements.forEach(element => {
        const text = element.textContent?.trim();
        const href = element.href;
        if (text && href) {
          menu.mainMenu.push({ text, href });
        }
      });
      
      // 푸터 메뉴 수집
      const footerElements = document.querySelectorAll('footer a, [class*="footer"] a');
      footerElements.forEach(element => {
        const text = element.textContent?.trim();
        const href = element.href;
        if (text && href) {
          menu.footerMenu.push({ text, href });
        }
      });
      
      return menu;
    });
    
    crawlSummary.menu = menuStructure;
    
    // 메뉴 구조 저장
    await fs.writeFile(
      path.join(MENU_DIR, 'menu-structure.json'),
      JSON.stringify(menuStructure, null, 2),
      'utf8'
    );
    
    console.log(`✅ 메뉴 구조 백업 완료: 메인 ${menuStructure.mainMenu.length}개, 푸터 ${menuStructure.footerMenu.length}개`);
    
  } catch (error) {
    console.error('❌ 메뉴 백업 중 오류:', error);
    crawlSummary.errors.push({ type: 'menu_backup', error: error.message });
  }
}

async function backupSEO(page) {
  console.log('🔍 3. SEO 설정 백업 시작...');
  
  try {
    // 메인 페이지로 이동
    await page.goto('https://www.mas9golf.com', { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(3000);
    
    const seoData = await page.evaluate(() => {
      const seo = {
        title: document.title,
        description: '',
        keywords: '',
        ogTags: {},
        twitterTags: {},
        canonical: '',
        robots: '',
        sitemap: '',
        analytics: {}
      };
      
      // 메타 태그 수집
      const metaTags = document.querySelectorAll('meta');
      metaTags.forEach(meta => {
        const name = meta.getAttribute('name') || meta.getAttribute('property');
        const content = meta.getAttribute('content');
        
        if (name && content) {
          if (name === 'description') seo.description = content;
          else if (name === 'keywords') seo.keywords = content;
          else if (name === 'robots') seo.robots = content;
          else if (name.startsWith('og:')) seo.ogTags[name] = content;
          else if (name.startsWith('twitter:')) seo.twitterTags[name] = content;
        }
      });
      
      // 캐노니컬 링크
      const canonical = document.querySelector('link[rel="canonical"]');
      if (canonical) seo.canonical = canonical.href;
      
      // 사이트맵
      const sitemap = document.querySelector('link[rel="sitemap"]');
      if (sitemap) seo.sitemap = sitemap.href;
      
      return seo;
    });
    
    crawlSummary.seo = seoData;
    
    // SEO 데이터 저장
    await fs.writeFile(
      path.join(SEO_DIR, 'seo-data.json'),
      JSON.stringify(seoData, null, 2),
      'utf8'
    );
    
    console.log('✅ SEO 설정 백업 완료');
    
  } catch (error) {
    console.error('❌ SEO 백업 중 오류:', error);
    crawlSummary.errors.push({ type: 'seo_backup', error: error.message });
  }
}

async function backupBlog(page) {
  console.log('📝 4. 블로그 백업 시작...');
  
  try {
    // 블로그 페이지로 이동
    await page.goto('https://www.mas9golf.com/blog', { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(3000);
    
    const blogData = await page.evaluate(() => {
      const blog = {
        posts: [],
        categories: [],
        tags: []
      };
      
      // 블로그 포스트 수집
      const postElements = document.querySelectorAll('article, [class*="post"], [class*="blog"]');
      postElements.forEach((element, index) => {
        try {
          const titleElement = element.querySelector('h1, h2, h3, .title, [class*="title"]');
          const linkElement = element.querySelector('a[href]');
          const dateElement = element.querySelector('.date, [class*="date"], time');
          const contentElement = element.querySelector('.content, [class*="content"], p');
          const imageElement = element.querySelector('img');
          
          if (titleElement) {
            blog.posts.push({
              title: titleElement.textContent.trim(),
              url: linkElement ? linkElement.href : '',
              date: dateElement ? dateElement.textContent.trim() : '',
              content: contentElement ? contentElement.textContent.trim().substring(0, 1000) : '',
              image: imageElement ? imageElement.src : '',
              index: index
            });
          }
        } catch (e) {
          console.log('블로그 포스트 파싱 오류:', e);
        }
      });
      
      return blog;
    });
    
    crawlSummary.blog = blogData.posts;
    
    // 블로그 데이터 저장
    await fs.writeFile(
      path.join(BLOG_DIR, 'blog-posts.json'),
      JSON.stringify(blogData, null, 2),
      'utf8'
    );
    
    console.log(`✅ 블로그 백업 완료: ${blogData.posts.length}개 포스트`);
    
  } catch (error) {
    console.error('❌ 블로그 백업 중 오류:', error);
    crawlSummary.errors.push({ type: 'blog_backup', error: error.message });
  }
}

async function backupCustomers(page) {
  console.log('👥 5. 고객 및 잠재고객 백업 시작...');
  
  try {
    // Wix 대시보드의 고객 섹션으로 이동
    await page.goto('https://manage.wix.com/dashboard/9fd66b1e-f894-49ab-9e3a-b41aac392bd7/contacts', { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(5000);
    
    const customerData = await page.evaluate(() => {
      const customers = {
        contacts: [],
        leads: [],
        subscribers: []
      };
      
      // 고객 목록 수집 (개인정보 보호를 위해 기본 정보만)
      const contactElements = document.querySelectorAll('[class*="contact"], [class*="customer"], [data-testid*="contact"]');
      contactElements.forEach((element, index) => {
        try {
          const nameElement = element.querySelector('[class*="name"], [class*="title"]');
          const emailElement = element.querySelector('[class*="email"]');
          const phoneElement = element.querySelector('[class*="phone"]');
          
          if (nameElement) {
            customers.contacts.push({
              name: nameElement.textContent?.trim(),
              email: emailElement ? emailElement.textContent?.trim() : '',
              phone: phoneElement ? phoneElement.textContent?.trim() : '',
              index: index
            });
          }
        } catch (e) {
          console.log('고객 정보 파싱 오류:', e);
        }
      });
      
      return customers;
    });
    
    crawlSummary.customers = customerData.contacts;
    
    // 고객 데이터 저장
    await fs.writeFile(
      path.join(CUSTOMERS_DIR, 'customers.json'),
      JSON.stringify(customerData, null, 2),
      'utf8'
    );
    
    console.log(`✅ 고객 데이터 백업 완료: ${customerData.contacts.length}명`);
    
  } catch (error) {
    console.error('❌ 고객 백업 중 오류:', error);
    crawlSummary.errors.push({ type: 'customers_backup', error: error.message });
  }
}

async function backupCatalog(page) {
  console.log('🛍️ 6. 카탈로그 쇼핑몰 제품 백업 시작...');
  
  try {
    // 쇼핑몰 제품 페이지로 이동
    await page.goto('https://manage.wix.com/dashboard/9fd66b1e-f894-49ab-9e3a-b41aac392bd7/store', { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(5000);
    
    const catalogData = await page.evaluate(() => {
      const catalog = {
        products: [],
        categories: [],
        collections: []
      };
      
      // 제품 목록 수집
      const productElements = document.querySelectorAll('[class*="product"], [data-testid*="product"], [class*="item"]');
      productElements.forEach((element, index) => {
        try {
          const titleElement = element.querySelector('[class*="title"], [class*="name"], h1, h2, h3');
          const priceElement = element.querySelector('[class*="price"]');
          const imageElement = element.querySelector('img');
          const linkElement = element.querySelector('a[href]');
          
          if (titleElement) {
            catalog.products.push({
              title: titleElement.textContent?.trim(),
              price: priceElement ? priceElement.textContent?.trim() : '',
              image: imageElement ? imageElement.src : '',
              url: linkElement ? linkElement.href : '',
              index: index
            });
          }
        } catch (e) {
          console.log('제품 정보 파싱 오류:', e);
        }
      });
      
      return catalog;
    });
    
    crawlSummary.catalog = catalogData.products;
    
    // 카탈로그 데이터 저장
    await fs.writeFile(
      path.join(CATALOG_DIR, 'catalog.json'),
      JSON.stringify(catalogData, null, 2),
      'utf8'
    );
    
    console.log(`✅ 카탈로그 백업 완료: ${catalogData.products.length}개 제품`);
    
  } catch (error) {
    console.error('❌ 카탈로그 백업 중 오류:', error);
    crawlSummary.errors.push({ type: 'catalog_backup', error: error.message });
  }
}

async function backupSettings(page) {
  console.log('⚙️ 7. 사이트 설정 백업 시작...');
  
  try {
    // 사이트 설정 페이지로 이동
    await page.goto('https://manage.wix.com/dashboard/9fd66b1e-f894-49ab-9e3a-b41aac392bd7/settings', { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(5000);
    
    const settingsData = await page.evaluate(() => {
      const settings = {
        general: {},
        domain: {},
        seo: {},
        analytics: {},
        integrations: {}
      };
      
      // 사이트 기본 정보 수집
      const siteInfo = document.querySelector('[class*="site-info"], [class*="site-name"]');
      if (siteInfo) {
        settings.general.siteName = siteInfo.textContent?.trim();
      }
      
      // 도메인 정보
      const domainInfo = document.querySelector('[class*="domain"], [class*="url"]');
      if (domainInfo) {
        settings.domain.url = domainInfo.textContent?.trim();
      }
      
      return settings;
    });
    
    crawlSummary.settings = settingsData;
    
    // 설정 데이터 저장
    await fs.writeFile(
      path.join(SETTINGS_DIR, 'settings.json'),
      JSON.stringify(settingsData, null, 2),
      'utf8'
    );
    
    console.log('✅ 사이트 설정 백업 완료');
    
  } catch (error) {
    console.error('❌ 설정 백업 중 오류:', error);
    crawlSummary.errors.push({ type: 'settings_backup', error: error.message });
  }
}

async function wixCompleteBackup() {
  console.log('🚀 Wix 완전 백업 시작! (Chrome Canary 사용)');
  await ensureDirs();

  try {
    const browser = await chromium.connectOverCDP('http://localhost:9222');
    const context = browser.contexts()[0];
    const page = context.pages()[0];
    
    console.log('📍 현재 URL:', page.url());
    
    // 1. 모든 페이지 백업
    await backupAllPages(page);
    
    // 2. 메뉴 구조 백업
    await backupMenuStructure(page);
    
    // 3. SEO 설정 백업
    await backupSEO(page);
    
    // 4. 블로그 백업
    await backupBlog(page);
    
    // 5. 고객 및 잠재고객 백업
    await backupCustomers(page);
    
    // 6. 카탈로그 쇼핑몰 제품 백업
    await backupCatalog(page);
    
    // 7. 사이트 설정 백업
    await backupSettings(page);
    
    // 최종 요약 보고서 생성
    crawlSummary.endTime = new Date().toISOString();
    await fs.writeFile(CRAWL_SUMMARY_FILE, JSON.stringify(crawlSummary, null, 2));
    
    console.log(`🎉 Wix 완전 백업 완료!`);
    console.log(`📊 결과:`);
    console.log(`   - 페이지: ${crawlSummary.pages.length}개`);
    console.log(`   - 블로그 포스트: ${crawlSummary.blog.length}개`);
    console.log(`   - 고객: ${crawlSummary.customers.length}명`);
    console.log(`   - 제품: ${crawlSummary.catalog.length}개`);
    console.log(`   - 오류: ${crawlSummary.errors.length}개`);
    console.log(`📁 저장 위치: ${OUTPUT_DIR}/ 폴더`);
    console.log(`📄 요약 파일: ${CRAWL_SUMMARY_FILE}`);
    
  } catch (error) {
    console.error('❌ 완전 백업 중 오류 발생:', error);
    crawlSummary.errors.push({ type: 'main_backup', error: error.message });
    crawlSummary.endTime = new Date().toISOString();
    await fs.writeFile(CRAWL_SUMMARY_FILE, JSON.stringify(crawlSummary, null, 2));
  }
}

wixCompleteBackup().catch(console.error);
