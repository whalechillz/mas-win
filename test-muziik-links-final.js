const { chromium } = require('playwright');

async function testMuziikLinksFinal() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  console.log('🔍 MUZIIK 링크 최종 테스트 시작...\n');

  const results = {
    success: [],
    failed: []
  };

  try {
    // 1. 메인 페이지 로드 (천천히)
    console.log('📌 1. MUZIIK 메인 페이지 로드 중...');
    await page.goto('https://muziik.masgolf.co.kr/muziik', { 
      waitUntil: 'domcontentloaded',
      timeout: 30000 
    });
    
    await page.waitForLoadState('networkidle', { timeout: 30000 });
    await page.waitForTimeout(3000); // 추가 대기
    
    const currentUrl = page.url();
    console.log(`   ✅ 현재 URL: ${currentUrl}\n`);

    // 2. "자세히 보기" 버튼 찾기 및 테스트
    console.log('📌 2. "자세히 보기" 버튼 찾기 및 테스트...\n');
    await page.waitForTimeout(1000);
    
    // Sapphire 버튼 찾기
    const sapphireButtons = await page.locator('a[href*="sapphire"]:has-text("자세히 보기")').all();
    console.log(`   발견된 Sapphire "자세히 보기" 버튼: ${sapphireButtons.length}개`);
    
    if (sapphireButtons.length > 0) {
      const sapphireButton = sapphireButtons[0];
      const sapphireHref = await sapphireButton.getAttribute('href');
      console.log(`   버튼 href: ${sapphireHref}`);
      
      if (sapphireHref === '/muziik/sapphire') {
        console.log(`   ✅ href가 올바르게 설정됨: ${sapphireHref}`);
        
        // 버튼 클릭 테스트
        console.log('   클릭 테스트 중...');
        await page.waitForTimeout(1000);
        await sapphireButton.click({ timeout: 10000 });
        
        await page.waitForLoadState('domcontentloaded', { timeout: 30000 });
        await page.waitForLoadState('networkidle', { timeout: 30000 });
        await page.waitForTimeout(3000);
        
        const finalUrl = page.url();
        const bodyText = await page.textContent('body');
        const has404 = bodyText.includes('404') || 
                       bodyText.includes('페이지를 찾을 수 없습니다') || 
                       bodyText.includes('제품을 찾을 수 없습니다');
        const hasSapphire = bodyText.includes('Sapphire') || bodyText.includes('サファイア');
        
        if (has404) {
          console.log(`   ❌ 404 오류 발생!`);
          results.failed.push({ url: finalUrl, reason: '404 오류' });
        } else if (hasSapphire) {
          console.log(`   ✅ Sapphire 페이지 정상 로드`);
          console.log(`   최종 URL: ${finalUrl}`);
          results.success.push({ url: finalUrl, type: 'Sapphire 자세히 보기 버튼' });
        } else {
          console.log(`   ⚠️  페이지는 로드되었지만 Sapphire 내용이 없음`);
          results.failed.push({ url: finalUrl, reason: 'Sapphire 내용 없음' });
        }
      } else {
        console.log(`   ❌ href가 잘못 설정됨: ${sapphireHref} (예상: /muziik/sapphire)`);
        results.failed.push({ url: sapphireHref, reason: '잘못된 href' });
      }
    } else {
      console.log(`   ❌ Sapphire "자세히 보기" 버튼을 찾을 수 없습니다.`);
      results.failed.push({ url: 'N/A', reason: '버튼을 찾을 수 없음' });
    }

    // 3. 메인 페이지로 돌아가기
    console.log('\n📌 3. 메인 페이지로 돌아가기...');
    await page.goto('https://muziik.masgolf.co.kr/muziik', { 
      waitUntil: 'domcontentloaded',
      timeout: 30000 
    });
    await page.waitForLoadState('networkidle', { timeout: 30000 });
    await page.waitForTimeout(3000);

    // 4. Beryl 버튼 찾기 및 테스트
    console.log('\n📌 4. Beryl "자세히 보기" 버튼 찾기 및 테스트...\n');
    await page.waitForTimeout(1000);
    
    const berylButtons = await page.locator('a[href*="beryl"]:has-text("자세히 보기")').all();
    console.log(`   발견된 Beryl "자세히 보기" 버튼: ${berylButtons.length}개`);
    
    if (berylButtons.length > 0) {
      const berylButton = berylButtons[0];
      const berylHref = await berylButton.getAttribute('href');
      console.log(`   버튼 href: ${berylHref}`);
      
      if (berylHref === '/muziik/beryl') {
        console.log(`   ✅ href가 올바르게 설정됨: ${berylHref}`);
        
        // 버튼 클릭 테스트
        console.log('   클릭 테스트 중...');
        await page.waitForTimeout(1000);
        await berylButton.click({ timeout: 10000 });
        
        await page.waitForLoadState('domcontentloaded', { timeout: 30000 });
        await page.waitForLoadState('networkidle', { timeout: 30000 });
        await page.waitForTimeout(3000);
        
        const finalUrl = page.url();
        const bodyText = await page.textContent('body');
        const has404 = bodyText.includes('404') || 
                       bodyText.includes('페이지를 찾을 수 없습니다') || 
                       bodyText.includes('제품을 찾을 수 없습니다');
        const hasBeryl = bodyText.includes('Beryl') || bodyText.includes('ベリル');
        
        if (has404) {
          console.log(`   ❌ 404 오류 발생!`);
          results.failed.push({ url: finalUrl, reason: '404 오류' });
        } else if (hasBeryl) {
          console.log(`   ✅ Beryl 페이지 정상 로드`);
          console.log(`   최종 URL: ${finalUrl}`);
          results.success.push({ url: finalUrl, type: 'Beryl 자세히 보기 버튼' });
        } else {
          console.log(`   ⚠️  페이지는 로드되었지만 Beryl 내용이 없음`);
          results.failed.push({ url: finalUrl, reason: 'Beryl 내용 없음' });
        }
      } else {
        console.log(`   ❌ href가 잘못 설정됨: ${berylHref} (예상: /muziik/beryl)`);
        results.failed.push({ url: berylHref, reason: '잘못된 href' });
      }
    } else {
      console.log(`   ❌ Beryl "자세히 보기" 버튼을 찾을 수 없습니다.`);
      results.failed.push({ url: 'N/A', reason: '버튼을 찾을 수 없음' });
    }

    // 5. 네비게이션 메뉴 링크 테스트
    console.log('\n📌 5. 네비게이션 메뉴 링크 테스트...\n');
    await page.goto('https://muziik.masgolf.co.kr/muziik', { 
      waitUntil: 'domcontentloaded',
      timeout: 30000 
    });
    await page.waitForLoadState('networkidle', { timeout: 30000 });
    await page.waitForTimeout(3000);

    // 네비게이션 메뉴의 Sapphire 링크 찾기
    const navSapphireLinks = await page.locator('nav a[href*="sapphire"]').all();
    console.log(`   발견된 네비게이션 Sapphire 링크: ${navSapphireLinks.length}개`);
    
    for (let i = 0; i < navSapphireLinks.length; i++) {
      const link = navSapphireLinks[i];
      const href = await link.getAttribute('href');
      const text = await link.textContent();
      console.log(`   링크 ${i + 1}: "${text?.trim()}" → href: "${href}"`);
      
      if (href === '/muziik/sapphire') {
        console.log(`   ✅ href가 올바르게 설정됨`);
      } else {
        console.log(`   ❌ href가 잘못 설정됨: ${href} (예상: /muziik/sapphire)`);
        results.failed.push({ url: href, reason: '네비게이션 링크 잘못된 href' });
      }
    }

    // 네비게이션 메뉴의 Beryl 링크 찾기
    const navBerylLinks = await page.locator('nav a[href*="beryl"]').all();
    console.log(`\n   발견된 네비게이션 Beryl 링크: ${navBerylLinks.length}개`);
    
    for (let i = 0; i < navBerylLinks.length; i++) {
      const link = navBerylLinks[i];
      const href = await link.getAttribute('href');
      const text = await link.textContent();
      console.log(`   링크 ${i + 1}: "${text?.trim()}" → href: "${href}"`);
      
      if (href === '/muziik/beryl') {
        console.log(`   ✅ href가 올바르게 설정됨`);
      } else {
        console.log(`   ❌ href가 잘못 설정됨: ${href} (예상: /muziik/beryl)`);
        results.failed.push({ url: href, reason: '네비게이션 링크 잘못된 href' });
      }
    }

    // 6. 직접 URL 접근 테스트
    console.log('\n📌 6. 직접 URL 접근 테스트...\n');
    const testUrls = [
      { url: 'https://muziik.masgolf.co.kr/muziik/sapphire', expected: 'Sapphire 페이지' },
      { url: 'https://muziik.masgolf.co.kr/muziik/beryl', expected: 'Beryl 페이지' },
      { url: 'https://muziik.masgolf.co.kr/sapphire', expected: '리라이트되어 Sapphire 페이지로 이동' },
      { url: 'https://muziik.masgolf.co.kr/beryl', expected: '리라이트되어 Beryl 페이지로 이동' },
    ];

    for (const testCase of testUrls) {
      try {
        console.log(`   테스트: ${testCase.url}`);
        console.log(`   예상: ${testCase.expected}`);
        
        await page.goto(testCase.url, { 
          waitUntil: 'domcontentloaded',
          timeout: 30000 
        });
        
        await page.waitForLoadState('networkidle', { timeout: 30000 });
        await page.waitForTimeout(3000);
        
        const finalUrl = page.url();
        const bodyText = await page.textContent('body');
        const has404 = bodyText.includes('404') || 
                       bodyText.includes('페이지를 찾을 수 없습니다') || 
                       bodyText.includes('제품을 찾을 수 없습니다');
        const hasSapphire = bodyText.includes('Sapphire') || bodyText.includes('サファイア');
        const hasBeryl = bodyText.includes('Beryl') || bodyText.includes('ベリル');
        
        if (has404) {
          console.log(`   ❌ 404 오류 발생!`);
          results.failed.push({ url: testCase.url, reason: '404 오류' });
        } else if (hasSapphire || hasBeryl) {
          console.log(`   ✅ 페이지 정상 로드`);
          console.log(`   최종 URL: ${finalUrl}`);
          results.success.push({ url: testCase.url, finalUrl: finalUrl });
        } else {
          console.log(`   ⚠️  페이지는 로드되었지만 제품 내용이 없음`);
          results.failed.push({ url: testCase.url, reason: '제품 내용 없음' });
        }
        console.log('');
      } catch (error) {
        console.log(`   ❌ 접근 실패: ${error.message}`);
        results.failed.push({ url: testCase.url, reason: error.message });
        console.log('');
      }
    }

    // 7. 결과 요약
    console.log('\n📊 테스트 결과 요약:');
    console.log('='.repeat(60));
    console.log(`✅ 성공: ${results.success.length}개`);
    results.success.forEach((item, index) => {
      console.log(`   ${index + 1}. ${item.type || item.url}`);
      if (item.finalUrl) {
        console.log(`      최종 URL: ${item.finalUrl}`);
      }
    });
    
    console.log(`\n❌ 실패: ${results.failed.length}개`);
    if (results.failed.length > 0) {
      results.failed.forEach((item, index) => {
        console.log(`   ${index + 1}. ${item.url}`);
        console.log(`      이유: ${item.reason}`);
      });
    } else {
      console.log('   실패한 테스트 없음');
    }

  } catch (error) {
    console.error('❌ 테스트 중 오류 발생:', error);
  } finally {
    console.log('\n✅ 테스트 완료');
    await browser.close();
  }
}

testMuziikLinksFinal()
  .then(() => {
    console.log('\n✅ 모든 테스트 완료');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ 테스트 실패:', error);
    process.exit(1);
  });




























