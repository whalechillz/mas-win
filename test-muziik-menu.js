// Muziik 사이트 서브 메뉴 테스트 스크립트
const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    console.log('🔍 Muziik 사이트 서브 메뉴 테스트 시작...');

    // 1. 홈 페이지 접근
    console.log('1️⃣ 홈 페이지 접근...');
    await page.goto('https://muziik.masgolf.co.kr');
    await page.waitForTimeout(3000);

    // 2. Navigation 메뉴 확인
    console.log('2️⃣ Navigation 메뉴 확인...');
    const navMenu = page.locator('nav, header nav, [role="navigation"]').first();
    if (await navMenu.count() > 0) {
      console.log('✅ Navigation 메뉴 발견');
    } else {
      console.log('⚠️ Navigation 메뉴를 찾을 수 없음');
    }

    // 3. 각 메뉴 링크 테스트
    const menus = [
      { name: '홈', href: '/', expected: '/muziik' },
      { name: 'Sapphire', href: '/sapphire', expected: '/muziik/sapphire' },
      { name: 'Beryl', href: '/beryl', expected: '/muziik/beryl' },
      { name: '기술소개', href: '/technology', expected: '/muziik/technology' },
      { name: '회사소개', href: '/about', expected: '/muziik/about' },
      { name: '문의하기', href: '/contact', expected: '/muziik/contact' }
    ];

    console.log('3️⃣ 각 메뉴 링크 테스트...');
    for (const menu of menus) {
      try {
        console.log(`\n  📍 ${menu.name} 메뉴 테스트...`);
        
        // 메뉴 링크 찾기
        const menuLink = page.locator(`a[href="${menu.href}"], a:has-text("${menu.name}")`).first();
        
        if (await menuLink.count() > 0) {
          console.log(`  ✅ ${menu.name} 링크 발견`);
          
          // 링크 클릭
          await menuLink.click();
          console.log(`  ✅ ${menu.name} 링크 클릭`);
          await page.waitForTimeout(2000);
          
          // URL 확인
          const currentUrl = page.url();
          console.log(`  📍 현재 URL: ${currentUrl}`);
          
          // 페이지 로딩 확인
          try {
            await page.waitForLoadState('networkidle', { timeout: 5000 });
            console.log(`  ✅ ${menu.name} 페이지 로딩 완료`);
            
            // 404 에러 확인
            const pageContent = await page.content();
            const is404 = pageContent.includes('404') || 
                         pageContent.includes('Not Found') || 
                         pageContent.includes('페이지를 찾을 수 없습니다');
            
            if (is404) {
              console.log(`  ❌ ${menu.name} 페이지 404 에러 발생`);
            } else {
              console.log(`  ✅ ${menu.name} 페이지 정상 로드`);
            }
            
            // 홈으로 돌아가기 (다음 메뉴 테스트)
            if (menu.name !== '홈') {
              await page.goto('https://muziik.masgolf.co.kr');
              await page.waitForTimeout(2000);
            }
          } catch (error) {
            console.log(`  ⚠️ ${menu.name} 페이지 로딩 타임아웃 또는 오류: ${error.message}`);
          }
        } else {
          console.log(`  ⚠️ ${menu.name} 링크를 찾을 수 없음`);
        }
      } catch (error) {
        console.error(`  ❌ ${menu.name} 메뉴 테스트 오류:`, error.message);
      }
    }

    console.log('\n4️⃣ 언어 전환 테스트...');
    try {
      // 일본어/한국어 버튼 찾기
      const langButtons = page.locator('button:has-text("🇯🇵"), button:has-text("🇰🇷"), button:has-text("日本語"), button:has-text("한국어")');
      const langButtonCount = await langButtons.count();
      
      if (langButtonCount > 0) {
        console.log(`  ✅ 언어 전환 버튼 ${langButtonCount}개 발견`);
        
        // 첫 번째 언어 버튼 클릭
        await langButtons.first().click();
        await page.waitForTimeout(2000);
        console.log('  ✅ 언어 전환 버튼 클릭 완료');
      } else {
        console.log('  ⚠️ 언어 전환 버튼을 찾을 수 없음');
      }
    } catch (error) {
      console.log(`  ⚠️ 언어 전환 테스트 오류: ${error.message}`);
    }

    console.log('\n✅ 모든 테스트 완료!');
    await page.waitForTimeout(2000);

  } catch (error) {
    console.error('❌ 테스트 중 오류:', error);
    await page.screenshot({ path: 'test-muziik-menu-error.png' });
  } finally {
    await browser.close();
  }
})();

