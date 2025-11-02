const { chromium } = require('playwright');
require('dotenv').config({ path: '.env.local' });

(async () => {
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 500 // 각 동작 사이 500ms 딜레이
  });
  
  const context = await browser.newContext();
  const page = await context.newPage();
  
  // 콘솔 로그 캡처
  page.on('console', msg => {
    const type = msg.type();
    const text = msg.text();
    if (type === 'error' || text.includes('에러') || text.includes('오류') || text.includes('불일치')) {
      console.log(`[콘솔 ${type}]: ${text}`);
    }
  });
  
  // 네트워크 오류 캡처
  page.on('response', response => {
    if (!response.ok() && response.url().includes('/api/admin/')) {
      console.log(`[API 오류]: ${response.status()} ${response.url()}`);
    }
  });
  
  try {
    console.log('🔐 로그인 페이지로 이동...');
    await page.goto('https://www.masgolf.co.kr/admin/login');
    await page.waitForTimeout(2000);
    
    // 로그인 정보
    const phoneNumber = '01066699000'; // 010-6669-9000에서 하이픈 제거
    const password = '66699000';
    
    console.log(`📱 전화번호: ${phoneNumber}`);
    console.log(`🔑 패스워드: ${password}`);
    
    // 전화번호 입력
    let phoneInput = page.locator('input[type="tel"]').first();
    if (await phoneInput.count() === 0) {
      phoneInput = page.locator('input[name="phone"]').first();
    }
    if (await phoneInput.count() === 0) {
      phoneInput = page.locator('input[placeholder*="전화번호"], input[placeholder*="010"]').first();
    }
    
    if (await phoneInput.count() > 0) {
      await phoneInput.clear();
      await phoneInput.fill(phoneNumber);
      console.log('   ✓ 전화번호 입력 완료');
      await page.waitForTimeout(1000);
    } else {
      console.log('   ❌ 전화번호 입력 필드를 찾을 수 없습니다');
    }
    
    // 패스워드 입력
    let passwordInput = page.locator('input[type="password"]').first();
    if (await passwordInput.count() === 0) {
      passwordInput = page.locator('input[name="password"]').first();
    }
    if (await passwordInput.count() === 0) {
      passwordInput = page.locator('input[placeholder*="패스워드"], input[placeholder*="비밀번호"]').first();
    }
    
    if (await passwordInput.count() > 0) {
      await passwordInput.clear();
      await passwordInput.fill(password);
      console.log('   ✓ 패스워드 입력 완료');
      await page.waitForTimeout(1000);
    } else {
      console.log('   ⚠️ 패스워드 입력 필드를 찾을 수 없습니다');
    }
    
    // 로그인 버튼 클릭
    let loginButton = page.locator('button:has-text("로그인")').first();
    if (await loginButton.count() === 0) {
      loginButton = page.locator('button[type="submit"]').first();
    }
    
    if (await loginButton.count() > 0) {
      await loginButton.click();
      console.log('   ✓ 로그인 버튼 클릭');
      await page.waitForTimeout(3000);
    } else {
      console.log('   ❌ 로그인 버튼을 찾을 수 없습니다');
    }
    
    console.log('✅ 로그인 완료');
    console.log('\n📁 갤러리 관리 페이지로 이동...');
    await page.goto('https://www.masgolf.co.kr/admin/gallery');
    await page.waitForTimeout(3000);
    
    // 페이지 로드 확인
    const pageTitle = await page.locator('h1, h2').filter({ hasText: '갤러리' }).first();
    if (await pageTitle.count() > 0) {
      console.log('✅ 갤러리 관리 페이지 로드 완료');
    }
    
    // 테스트 시나리오 1: 전체 폴더 상태에서 "해변" 검색
    console.log('\n📋 테스트 1: 전체 폴더 상태에서 "해변" 검색');
    
    // 폴더 필터 확인 (더 안전한 선택자 사용)
    const folderSelect = page.locator('select').filter({ hasText: '전체 폴더' }).first();
    if (await folderSelect.count() === 0) {
      // 다른 선택자 시도
      const folderSelectAlt = page.locator('label:has-text("폴더") + select, label:has-text("폴더") ~ select').first();
      if (await folderSelectAlt.count() > 0) {
        const folderSelect = folderSelectAlt;
      }
    }
    
    if (await folderSelect.count() > 0) {
      const currentValue = await folderSelect.inputValue();
      if (currentValue !== 'all') {
        console.log(`   폴더 필터 변경: ${currentValue} -> all`);
        await folderSelect.selectOption('all');
        await page.waitForTimeout(3000); // API 호출 대기
      } else {
        console.log('   폴더 필터: 전체 폴더 (올바름)');
      }
    } else {
      console.log('   ⚠️ 폴더 필터 선택자를 찾을 수 없음');
    }
    
    // 하위 폴더 포함 체크박스 확인
    const includeChildrenCheckbox = page.locator('input[type="checkbox"]').filter({ has: page.locator('xpath=../span[contains(text(), "하위 폴더 포함")]') }).first();
    if (await includeChildrenCheckbox.count() > 0) {
      const isChecked = await includeChildrenCheckbox.isChecked();
      console.log(`   하위 폴더 포함: ${isChecked ? '체크됨' : '체크 안 됨'}`);
    }
    
    // 검색창에 "해변" 입력
    const searchInput = page.locator('input[type="text"], input[placeholder*="파일명"], input[placeholder*="검색"]').first();
    if (await searchInput.count() > 0) {
      await searchInput.fill('해변');
      await page.waitForTimeout(2000);
      console.log('   검색어 "해변" 입력 완료');
      
      // 이미지 개수 확인
      const imageCount = await page.locator('text=/\\d+개 표시/').first().textContent().catch(() => null);
      if (imageCount) {
        console.log(`   📊 결과: ${imageCount}`);
      }
      
      // 이미지 카드 확인
      const imageCards = await page.locator('img, [class*="image"], [class*="card"]').count();
      console.log(`   📷 이미지 카드: ${imageCards}개`);
    }
    
    // 테스트 시나리오 2: originals/blog/2025-09 폴더 선택 후 "해변" 검색
    console.log('\n📋 테스트 2: originals/blog/2025-09 폴더 선택 후 "해변" 검색');
    
    // 폴더 선택
    const targetFolder = 'originals/blog/2025-09';
    await folderSelect.selectOption(targetFolder);
    await page.waitForTimeout(3000);
    console.log(`   폴더 선택: ${targetFolder}`);
    
    // 이미지 개수 확인
    const imageCount2 = await page.locator('text=/\\d+개 표시/').first().textContent().catch(() => null);
    if (imageCount2) {
      console.log(`   📊 결과: ${imageCount2}`);
    }
    
    // 검색어 다시 입력 (이미 있으면 클리어)
    await searchInput.fill('');
    await page.waitForTimeout(500);
    await searchInput.fill('해변');
    await page.waitForTimeout(2000);
    console.log('   검색어 "해변" 입력 완료');
    
    // 이미지 개수 확인
    const imageCount3 = await page.locator('text=/\\d+개 표시/').first().textContent().catch(() => null);
    if (imageCount3) {
      console.log(`   📊 결과: ${imageCount3}`);
    }
    
    // 테스트 시나리오 3: 하위 폴더 포함 체크/해제
    console.log('\n📋 테스트 3: 하위 폴더 포함 체크/해제');
    
    // 하위 폴더 포함 해제
    if (await includeChildrenCheckbox.count() > 0) {
      const isChecked2 = await includeChildrenCheckbox.isChecked();
      if (isChecked2) {
        await includeChildrenCheckbox.uncheck();
        await page.waitForTimeout(2000);
        console.log('   하위 폴더 포함: 해제');
      }
      
      // 이미지 개수 확인
      const imageCount4 = await page.locator('text=/\\d+개 표시/').first().textContent().catch(() => null);
      if (imageCount4) {
        console.log(`   📊 결과: ${imageCount4}`);
      }
      
      // 다시 체크
      await includeChildrenCheckbox.check();
      await page.waitForTimeout(2000);
      console.log('   하위 폴더 포함: 체크');
      
      // 이미지 개수 확인
      const imageCount5 = await page.locator('text=/\\d+개 표시/').first().textContent().catch(() => null);
      if (imageCount5) {
        console.log(`   📊 결과: ${imageCount5}`);
      }
    }
    
    // 테스트 시나리오 4: 전체 폴더로 돌아가기
    console.log('\n📋 테스트 4: 전체 폴더로 돌아가기');
    
    await folderSelect.selectOption('all');
    await page.waitForTimeout(3000);
    console.log('   폴더 선택: 전체 폴더');
    
    // 검색어 클리어
    await searchInput.fill('');
    await page.waitForTimeout(2000);
    console.log('   검색어 클리어');
    
    // 이미지 개수 확인
    const imageCount6 = await page.locator('text=/\\d+개 표시/').first().textContent().catch(() => null);
    if (imageCount6) {
      console.log(`   📊 결과: ${imageCount6}`);
    }
    
    // 테스트 시나리오 5: 다른 메뉴 버튼 클릭 테스트
    console.log('\n📋 테스트 5: 다른 메뉴 버튼 클릭 테스트');
    
    const buttons = [
      { text: '블로그 관리로 돌아가기', name: '블로그 관리' },
      { text: '카테고리 관리', name: '카테고리 관리' },
      { text: '폴더 관리', name: '폴더 관리' },
      { text: '메타데이터 동기화', name: '메타데이터 동기화' },
      { text: '블로그 이미지 분석', name: '블로그 이미지 분석' }
    ];
    
    for (const button of buttons) {
      try {
        const btn = page.locator(`button:has-text("${button.text}"), a:has-text("${button.text}")`).first();
        if (await btn.count() > 0) {
          console.log(`   버튼 클릭: ${button.name}`);
          await btn.click();
          await page.waitForTimeout(2000);
          
          // 모달이 열렸는지 확인
          const modal = page.locator('[role="dialog"], [class*="modal"], [class*="Modal"]').first();
          if (await modal.count() > 0) {
            console.log(`      ✅ ${button.name} 모달 열림`);
            // ESC 키로 모달 닫기
            await page.keyboard.press('Escape');
            await page.waitForTimeout(1000);
          } else {
            // 다른 페이지로 이동했는지 확인
            const currentUrl = page.url();
            if (!currentUrl.includes('/admin/gallery')) {
              console.log(`      ✅ ${button.name} 페이지로 이동: ${currentUrl}`);
              // 갤러리로 돌아가기
              await page.goto('https://www.masgolf.co.kr/admin/gallery');
              await page.waitForTimeout(2000);
            }
          }
        }
      } catch (error) {
        console.log(`   ❌ ${button.name} 버튼 클릭 오류: ${error.message}`);
      }
    }
    
    console.log('\n✅ 모든 테스트 완료');
    
  } catch (error) {
    console.error('❌ 테스트 오류:', error);
  } finally {
    await page.waitForTimeout(2000);
    await browser.close();
  }
})();

