const { chromium } = require('playwright');

async function testMuziikLinksDebug() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  console.log('🔍 MUZIIK 링크 디버깅 테스트 시작...\n');

  try {
    // 1. 메인 페이지 로드 (천천히)
    console.log('📌 1. MUZIIK 메인 페이지 로드 중...');
    await page.goto('https://muziik.masgolf.co.kr/muziik', { 
      waitUntil: 'domcontentloaded',
      timeout: 30000 
    });
    
    await page.waitForLoadState('networkidle', { timeout: 30000 });
    await page.waitForTimeout(5000); // 충분한 대기
    
    const currentUrl = page.url();
    console.log(`   ✅ 현재 URL: ${currentUrl}\n`);

    // 2. 모든 "자세히 보기" 버튼 찾기 및 상세 정보 출력
    console.log('📌 2. 모든 "자세히 보기" 버튼 찾기 및 상세 정보...\n');
    await page.waitForTimeout(2000);
    
    // 모든 링크 찾기
    const allLinks = await page.locator('a').all();
    console.log(`   총 ${allLinks.length}개의 링크 발견\n`);
    
    const detailButtons = [];
    for (let i = 0; i < allLinks.length; i++) {
      const link = allLinks[i];
      const text = await link.textContent();
      const href = await link.getAttribute('href');
      
      if (text && text.includes('자세히 보기')) {
        const outerHTML = await link.evaluate(el => el.outerHTML);
        const computedHref = await link.evaluate(el => el.href);
        const isVisible = await link.isVisible();
        
        detailButtons.push({
          text: text.trim(),
          href,
          computedHref,
          outerHTML,
          isVisible
        });
        
        console.log(`   버튼 ${detailButtons.length}:`);
        console.log(`     - 텍스트: "${text.trim()}"`);
        console.log(`     - href 속성: "${href}"`);
        console.log(`     - 실제 href (computed): "${computedHref}"`);
        console.log(`     - 표시 여부: ${isVisible ? '표시됨' : '숨김'}`);
        console.log(`     - HTML: ${outerHTML.substring(0, 100)}...`);
        console.log('');
      }
    }

    // 3. 페이지 소스에서 직접 확인
    console.log('📌 3. 페이지 소스에서 직접 확인...\n');
    const pageContent = await page.content();
    
    // href="/muziik/sapphire" 패턴 찾기
    const muziikSapphireMatches = pageContent.match(/href=["']\/muziik\/sapphire["']/g);
    const sapphireMatches = pageContent.match(/href=["']\/sapphire["']/g);
    
    console.log(`   href="/muziik/sapphire" 패턴: ${muziikSapphireMatches ? muziikSapphireMatches.length : 0}개 발견`);
    console.log(`   href="/sapphire" 패턴: ${sapphireMatches ? sapphireMatches.length : 0}개 발견`);
    
    if (sapphireMatches) {
      console.log(`   ⚠️  문제: href="/sapphire" 패턴이 발견됨!`);
      // 주변 컨텍스트 확인
      const contextMatches = pageContent.match(/href=["']\/sapphire["'][^>]*>([^<]*)</g);
      if (contextMatches) {
        console.log(`   발견된 컨텍스트:`);
        contextMatches.forEach((match, index) => {
          console.log(`     ${index + 1}. ${match.substring(0, 100)}`);
        });
      }
    }
    console.log('');

    // 4. Next.js Link 컴포넌트의 실제 동작 확인
    console.log('📌 4. Next.js Link 컴포넌트의 실제 동작 확인...\n');
    
    // React DevTools를 통해 확인할 수 없으므로, 실제 클릭 동작 확인
    const sapphireButton = detailButtons.find(b => b.href && b.href.includes('sapphire'));
    if (sapphireButton) {
      console.log(`   Sapphire 버튼 발견:`);
      console.log(`     - href 속성: "${sapphireButton.href}"`);
      console.log(`     - 실제 href: "${sapphireButton.computedHref}"`);
      
      // 버튼 클릭 테스트
      console.log(`   클릭 테스트 중...`);
      await page.waitForTimeout(1000);
      
      const button = await page.locator(`a[href="${sapphireButton.href}"]:has-text("자세히 보기")`).first();
      await button.click({ timeout: 10000 });
      
      await page.waitForLoadState('domcontentloaded', { timeout: 30000 });
      await page.waitForLoadState('networkidle', { timeout: 30000 });
      await page.waitForTimeout(3000);
      
      const finalUrl = page.url();
      console.log(`   최종 URL: ${finalUrl}`);
      
      const bodyText = await page.textContent('body');
      const has404 = bodyText.includes('404') || 
                     bodyText.includes('페이지를 찾을 수 없습니다');
      const hasSapphire = bodyText.includes('Sapphire') || bodyText.includes('サファイア');
      
      if (has404) {
        console.log(`   ❌ 404 오류 발생!`);
        console.log(`   원인: href="${sapphireButton.href}"가 잘못된 경로로 이어짐`);
      } else if (hasSapphire) {
        console.log(`   ✅ Sapphire 페이지 정상 로드`);
        if (finalUrl.includes('/muziik/sapphire')) {
          console.log(`   ✅ 올바른 경로로 이동됨`);
        } else {
          console.log(`   ⚠️  다른 경로로 이동: ${finalUrl}`);
        }
      }
    }

  } catch (error) {
    console.error('❌ 테스트 중 오류 발생:', error);
  } finally {
    console.log('\n✅ 테스트 완료');
    await browser.close();
  }
}

testMuziikLinksDebug()
  .then(() => {
    console.log('\n✅ 모든 테스트 완료');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ 테스트 실패:', error);
    process.exit(1);
  });
































