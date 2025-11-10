const { chromium } = require('playwright');

async function testMuziikDetailButtons() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  console.log('🔍 MUZIIK "자세히 보기" 버튼 테스트 시작...\n');

  try {
    // 1. MUZIIK 메인 페이지로 이동
    console.log('📌 1. MUZIIK 메인 페이지 로드 중...');
    await page.goto('https://muziik.masgolf.co.kr/muziik', { 
      waitUntil: 'networkidle',
      timeout: 15000 
    });

    const currentUrl = page.url();
    console.log(`   현재 URL: ${currentUrl}`);

    // 2. "자세히 보기" 버튼 찾기
    console.log('\n📌 2. "자세히 보기" 버튼 찾기...');
    
    // 여러 선택자로 버튼 찾기
    const buttonSelectors = [
      'text=자세히 보기',
      'a:has-text("자세히 보기")',
      'button:has-text("자세히 보기")',
      '[href*="sapphire"]',
      '[href*="beryl"]',
      'a[href="/muziik/sapphire"]',
      'a[href="/muziik/beryl"]',
    ];

    let sapphireButton = null;
    let berylButton = null;

    for (const selector of buttonSelectors) {
      try {
        const buttons = await page.locator(selector).all();
        console.log(`   선택자 "${selector}": ${buttons.length}개 버튼 발견`);
        
        for (const button of buttons) {
          const href = await button.getAttribute('href');
          const text = await button.textContent();
          console.log(`     - 텍스트: "${text?.trim()}", href: "${href}"`);
          
          if (href && href.includes('sapphire')) {
            sapphireButton = button;
            console.log(`     ✅ Sapphire 버튼 발견: ${href}`);
          }
          if (href && href.includes('beryl')) {
            berylButton = button;
            console.log(`     ✅ Beryl 버튼 발견: ${href}`);
          }
        }
      } catch (error) {
        // 선택자 실패는 무시
      }
    }

    // 3. 페이지의 모든 링크 확인
    console.log('\n📌 3. 페이지의 모든 링크 확인...');
    const allLinks = await page.locator('a[href]').all();
    console.log(`   총 ${allLinks.length}개의 링크 발견`);
    
    for (const link of allLinks) {
      const href = await link.getAttribute('href');
      const text = await link.textContent();
      if (text && text.includes('자세히') && href) {
        console.log(`   - "${text.trim()}": ${href}`);
        if (href.includes('sapphire') && !sapphireButton) {
          sapphireButton = link;
        }
        if (href.includes('beryl') && !berylButton) {
          berylButton = link;
        }
      }
    }

    // 4. Sapphire 버튼 테스트
    if (sapphireButton) {
      console.log('\n📌 4. Sapphire "자세히 보기" 버튼 클릭 테스트...');
      const sapphireHref = await sapphireButton.getAttribute('href');
      console.log(`   버튼 href: ${sapphireHref}`);
      
      try {
        // 버튼 클릭
        await sapphireButton.click({ timeout: 5000 });
        await page.waitForLoadState('networkidle', { timeout: 10000 });
        
        const finalUrl = page.url();
        console.log(`   최종 URL: ${finalUrl}`);
        
        // 페이지 내용 확인
        const pageTitle = await page.title();
        const bodyText = await page.textContent('body');
        const has404 = bodyText.includes('404') || bodyText.includes('페이지를 찾을 수 없습니다') || bodyText.includes('제품을 찾을 수 없습니다');
        const hasSapphire = bodyText.includes('Sapphire') || bodyText.includes('サファイア');
        
        if (has404) {
          console.log(`   ❌ 404 오류 발생`);
        } else if (hasSapphire) {
          console.log(`   ✅ Sapphire 페이지 정상 로드`);
          console.log(`   페이지 제목: ${pageTitle}`);
        } else {
          console.log(`   ⚠️  페이지는 로드되었지만 Sapphire 내용이 없음`);
        }
      } catch (error) {
        console.log(`   ❌ 클릭 실패: ${error.message}`);
      }
    } else {
      console.log('\n❌ Sapphire "자세히 보기" 버튼을 찾을 수 없습니다.');
    }

    // 5. Beryl 버튼 테스트 (다시 메인 페이지로 돌아가기)
    console.log('\n📌 5. 메인 페이지로 돌아가기...');
    await page.goto('https://muziik.masgolf.co.kr/muziik', { 
      waitUntil: 'networkidle',
      timeout: 15000 
    });

    if (berylButton) {
      console.log('\n📌 6. Beryl "자세히 보기" 버튼 클릭 테스트...');
      const berylHref = await berylButton.getAttribute('href');
      console.log(`   버튼 href: ${berylHref}`);
      
      try {
        // 버튼 다시 찾기 (페이지 리로드 후)
        const berylButtonReloaded = await page.locator(`a[href="${berylHref}"]`).first();
        await berylButtonReloaded.click({ timeout: 5000 });
        await page.waitForLoadState('networkidle', { timeout: 10000 });
        
        const finalUrl = page.url();
        console.log(`   최종 URL: ${finalUrl}`);
        
        // 페이지 내용 확인
        const pageTitle = await page.title();
        const bodyText = await page.textContent('body');
        const has404 = bodyText.includes('404') || bodyText.includes('페이지를 찾을 수 없습니다') || bodyText.includes('제품을 찾을 수 없습니다');
        const hasBeryl = bodyText.includes('Beryl') || bodyText.includes('ベリル');
        
        if (has404) {
          console.log(`   ❌ 404 오류 발생`);
        } else if (hasBeryl) {
          console.log(`   ✅ Beryl 페이지 정상 로드`);
          console.log(`   페이지 제목: ${pageTitle}`);
        } else {
          console.log(`   ⚠️  페이지는 로드되었지만 Beryl 내용이 없음`);
        }
      } catch (error) {
        console.log(`   ❌ 클릭 실패: ${error.message}`);
      }
    } else {
      console.log('\n❌ Beryl "자세히 보기" 버튼을 찾을 수 없습니다.');
    }

    // 6. 직접 URL 접근 테스트
    console.log('\n📌 7. 직접 URL 접근 테스트...');
    const directUrls = [
      'https://muziik.masgolf.co.kr/muziik/sapphire',
      'https://muziik.masgolf.co.kr/muziik/beryl',
    ];

    for (const url of directUrls) {
      try {
        console.log(`\n   테스트: ${url}`);
        await page.goto(url, { waitUntil: 'networkidle', timeout: 10000 });
        const finalUrl = page.url();
        const status = page.url() === url ? '✅' : '⚠️';
        console.log(`   ${status} 최종 URL: ${finalUrl}`);
        
        const bodyText = await page.textContent('body');
        const has404 = bodyText.includes('404') || bodyText.includes('페이지를 찾을 수 없습니다') || bodyText.includes('제품을 찾을 수 없습니다');
        
        if (has404) {
          console.log(`   ❌ 404 오류 발생`);
        } else {
          console.log(`   ✅ 페이지 정상 로드`);
        }
      } catch (error) {
        console.log(`   ❌ 접근 실패: ${error.message}`);
      }
    }

  } catch (error) {
    console.error('❌ 테스트 중 오류 발생:', error);
  } finally {
    console.log('\n✅ 테스트 완료');
    await browser.close();
  }
}

testMuziikDetailButtons()
  .then(() => {
    console.log('\n✅ 모든 테스트 완료');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ 테스트 실패:', error);
    process.exit(1);
  });







