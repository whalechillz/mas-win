const { chromium } = require('playwright');

async function findWebpageScraper() {
  let browser;
  try {
    console.log('🚀 웹페이지 이미지 수집 기능 찾기 시작...');
    browser = await chromium.launch({ headless: false });
    const page = await browser.newPage();

    // 1. 프로덕션 관리자 페이지 접속
    console.log('📝 1. 프로덕션 관리자 페이지 접속...');
    await page.goto('https://win.masgolf.co.kr/admin/blog');

    // 로그인 처리 (필요한 경우)
    const currentUrl = page.url();
    if (currentUrl.includes('/admin/login')) {
      console.log('🔑 로그인 페이지 감지, 로그인 시도...');
      await page.fill('input[type="email"]', 'admin@example.com');
      const password = process.env.ADMIN_PASSWORD || ''; await page.fill('input[type="password"]', password);
      await page.click('button[type="submit"]');
      await page.waitForLoadState('networkidle');
    }
    
    console.log('✅ 프로덕션 관리자 페이지 로드 완료');
    await page.waitForTimeout(3000);
    
    // 2. 페이지를 아래로 스크롤해서 이미지 갤러리 섹션 찾기
    console.log('📜 2. 페이지 스크롤하여 이미지 갤러리 섹션 찾기...');
    
    // 페이지 높이 확인
    const bodyHeight = await page.evaluate(() => document.body.scrollHeight);
    console.log(`📏 페이지 높이: ${bodyHeight}px`);
    
    // 이미지 갤러리 섹션 찾기
    const imageGallerySection = page.locator('text=이미지 갤러리');
    const isVisible = await imageGallerySection.isVisible();
    console.log(`🖼️ 이미지 갤러리 섹션 보임: ${isVisible}`);
    
    if (!isVisible) {
      console.log('📜 이미지 갤러리 섹션을 찾기 위해 스크롤...');
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight / 2));
      await page.waitForTimeout(2000);
    }
    
    // 3. 웹페이지 이미지 수집 관련 텍스트 찾기
    console.log('🔍 3. 웹페이지 이미지 수집 관련 텍스트 찾기...');
    
    const searchTerms = [
      '웹페이지 이미지 수집',
      '웹페이지',
      '이미지 수집',
      '수집',
      '스크래핑',
      'scrape'
    ];
    
    for (const term of searchTerms) {
      const elements = await page.locator(`text=${term}`).all();
      console.log(`📊 "${term}" 텍스트가 포함된 요소 ${elements.length}개 발견`);
      
      if (elements.length > 0) {
        for (let i = 0; i < elements.length; i++) {
          const text = await elements[i].textContent();
          const isVisible = await elements[i].isVisible();
          console.log(`  - 요소 ${i + 1}: "${text}" (보임: ${isVisible})`);
        }
      }
    }
    
    // 4. 모든 버튼에서 웹페이지 관련 텍스트 찾기
    console.log('🔍 4. 모든 버튼에서 웹페이지 관련 텍스트 찾기...');
    const buttons = await page.locator('button').all();
    
    for (let i = 0; i < buttons.length; i++) {
      const buttonText = await buttons[i].textContent();
      if (buttonText && (
        buttonText.includes('웹페이지') || 
        buttonText.includes('수집') || 
        buttonText.includes('스크래핑') ||
        buttonText.includes('🌐')
      )) {
        console.log(`🎯 관련 버튼 발견: "${buttonText}"`);
      }
    }
    
    // 5. 전체 페이지에서 웹페이지 관련 텍스트 검색
    console.log('🔍 5. 전체 페이지에서 웹페이지 관련 텍스트 검색...');
    const pageContent = await page.textContent('body');
    
    if (pageContent.includes('웹페이지 이미지 수집')) {
      console.log('✅ "웹페이지 이미지 수집" 텍스트 발견!');
    } else {
      console.log('❌ "웹페이지 이미지 수집" 텍스트를 찾을 수 없음');
    }
    
    if (pageContent.includes('🌐')) {
      console.log('✅ "🌐" 이모지 발견!');
    } else {
      console.log('❌ "🌐" 이모지를 찾을 수 없음');
    }
    
    // 6. 스크린샷 저장
    console.log('📸 6. 스크린샷 저장...');
    await page.screenshot({ path: 'find-webpage-scraper.png', fullPage: true });
    console.log('✅ 스크린샷 저장 완료: find-webpage-scraper.png');
    
    console.log('✅ 웹페이지 이미지 수집 기능 찾기 완료!');
    
  } catch (error) {
    console.error('❌ 찾기 중 오류 발생:', error);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

findWebpageScraper();
