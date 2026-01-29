/**
 * 메인 페이지 시크리트포스 PRO 3 MUZIIK 이미지 404 원인 파악
 * - localhost:3000 접속 후 프리미엄 드라이버 그리드에서 PRO 3 카드 이미지 URL·실패 요청 수집
 *
 * 사용법: node e2e-test/playwright-main-pro3-image-404.js
 */

const { chromium } = require('playwright');

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  const failedRequests = [];
  const allImageRequests = [];

  page.on('requestfailed', (request) => {
    const url = request.url();
    const failure = request.failure();
    failedRequests.push({ url, error: failure?.errorText || 'unknown' });
    console.log('[FAIL]', url);
  });

  page.on('request', (request) => {
    const url = request.url();
    if (url.includes('/_next/image') || url.includes('supabase.co') || url.includes('originals/')) {
      allImageRequests.push({ url, resourceType: request.resourceType() });
    }
  });

  try {
    console.log('1. 메인 페이지 로드:', BASE_URL);
    await page.goto(BASE_URL, { waitUntil: 'networkidle', timeout: 20000 });
    await page.waitForTimeout(3000);

    console.log('\n2. 프리미엄 드라이버 섹션 대기');
    await page.waitForSelector('section#products, h2:has-text("프리미엄 드라이버")', { timeout: 10000 });
    await page.waitForTimeout(2000);

    console.log('\n3. PRO 3 MUZIIK 카드 찾기');
    const pro3Card = await page.locator('div:has-text("시크리트포스 PRO 3 MUZIIK")').first();
    const cardCount = await pro3Card.count();
    if (cardCount === 0) {
      console.log('   PRO 3 카드를 찾을 수 없음. 제품 그리드 내 카드 수 확인.');
      const cards = await page.locator('section#products [class*="rounded-lg"]').count();
      console.log('   #products 내 카드 수:', cards);
    } else {
      const parent = pro3Card.locator('xpath=ancestor::div[.//div[contains(@class,"min-h-80") or contains(@class,"md:h-72")]]').first();
      const img = parent.locator('img').first();
      const imgCount = await img.count();
      if (imgCount > 0) {
        const src = await img.getAttribute('src');
        console.log('   PRO 3 카드 내 img src:', src || '(없음)');
        const naturalWidth = await img.evaluate((el) => el.naturalWidth);
        console.log('   naturalWidth (0이면 로드 실패):', naturalWidth);
      } else {
        console.log('   PRO 3 카드 내 img 없음 (이미지 없음 영역일 수 있음)');
        const innerHTML = await parent.locator('div').first().innerHTML().catch(() => '');
        if (innerHTML.includes('이미지 없음')) console.log('   → "이미지 없음" fallback 표시 중');
      }
    }

    console.log('\n4. 실패한 요청 (404 등)');
    if (failedRequests.length === 0) {
      console.log('   없음');
    } else {
      failedRequests.forEach((r, i) => {
        console.log(`   [${i + 1}] ${r.url}`);
        console.log(`       error: ${r.error}`);
      });
    }

    console.log('\n5. _next/image / supabase / originals 관련 요청 (최근 20개)');
    const relevant = allImageRequests.filter((r) => r.url.includes('_next/image') || r.url.includes('originals'));
    relevant.slice(-20).forEach((r, i) => {
      console.log(`   ${i + 1}. ${r.url}`);
    });

    console.log('\n6. 페이지에서 그리드 제품 이미지 src 수집 (eval)');
    const productImageSrcs = await page.evaluate(() => {
      const section = document.querySelector('section#products');
      if (!section) return { error: 'section#products not found' };
      const imgs = section.querySelectorAll('img');
      return Array.from(imgs).slice(0, 10).map((img, i) => ({
        index: i,
        src: img.src || img.getAttribute('src'),
        alt: img.alt,
        naturalWidth: img.naturalWidth,
      }));
    });
    console.log(JSON.stringify(productImageSrcs, null, 2));

    console.log('\n✅ 재현 스크립트 완료. 브라우저는 잠시 유지됩니다 (5초 후 종료).');
    await page.waitForTimeout(5000);
  } catch (err) {
    console.error('에러:', err.message);
  } finally {
    await browser.close();
  }
})();
