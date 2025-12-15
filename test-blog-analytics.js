const { chromium } = require('playwright');

async function testBlogAnalytics() {
  console.log('🚀 블로그 분석 기능 테스트 시작...');
  
  const browser = await chromium.launch({ 
    headless: false,
    channel: 'chrome-canary' // Chrome Canary 사용
  });
  
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 },
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  });
  
  const page = await context.newPage();
  
  try {
    console.log('📝 1. 관리자 페이지 접속...');
    await page.goto('https://win.masgolf.co.kr/admin/blog', { 
      waitUntil: 'networkidle',
      timeout: 30000 
    });
    
    // 로그인 확인
    const loginForm = await page.locator('input[type="password"]').isVisible();
    if (loginForm) {
      console.log('🔐 로그인 필요 - 비밀번호 입력...');
      const password = process.env.ADMIN_PASSWORD || ''; await page.fill('input[type="password"]', password);
      await page.click('button[type="submit"]');
      await page.waitForLoadState('networkidle');
    }
    
    console.log('✅ 관리자 페이지 로드 완료');
    
    // 페이지 로드 완료 대기
    await page.waitForTimeout(2000);
    
    // 블로그 수정 페이지로 이동 (첫 번째 블로그의 수정 버튼 클릭)
    console.log('🔍 2. 블로그 수정 페이지로 이동...');
    const editButtons = page.locator('button:has-text("수정")');
    const editButtonCount = await editButtons.count();
    
    if (editButtonCount > 0) {
      console.log(`📝 ${editButtonCount}개의 수정 버튼 발견 - 첫 번째 클릭`);
      await editButtons.first().click();
      await page.waitForLoadState('networkidle');
      console.log('✅ 블로그 수정 페이지로 이동 완료');
    } else {
      console.log('❌ 수정 버튼을 찾을 수 없음');
      return;
    }
    
    // 페이지 로드 완료 대기
    await page.waitForTimeout(2000);
    
    // 블로그 분석 버튼 찾기
    console.log('🔍 3. 블로그 분석 버튼 찾기...');
    let analyticsButton = null;
    
    // 방법 1: 정확한 텍스트로 찾기
    analyticsButton = page.locator('button:has-text("📊 블로그 분석")');
    if (await analyticsButton.isVisible()) {
      console.log('✅ 방법 1: 정확한 텍스트로 블로그 분석 버튼 발견');
    } else {
      // 방법 2: 부분 텍스트로 찾기
      analyticsButton = page.locator('button:has-text("블로그 분석")');
      if (await analyticsButton.isVisible()) {
        console.log('✅ 방법 2: 부분 텍스트로 블로그 분석 버튼 발견');
      } else {
        console.log('❌ 블로그 분석 버튼을 찾을 수 없음');
        
        // 현재 페이지의 모든 버튼 텍스트 확인
        console.log('🔍 현재 페이지의 모든 버튼 확인...');
        const allButtons = await page.locator('button').all();
        console.log(`📝 총 ${allButtons.length}개의 버튼 발견`);
        
        for (let i = 0; i < Math.min(allButtons.length, 20); i++) {
          const buttonText = await allButtons[i].textContent();
          console.log(`  버튼 ${i + 1}: "${buttonText}"`);
        }
      }
    }
    
    if (analyticsButton && await analyticsButton.isVisible()) {
      console.log('✅ 블로그 분석 버튼 발견');
      
      // 블로그 분석 버튼 클릭
      console.log('📊 4. 블로그 분석 버튼 클릭...');
      await analyticsButton.click();
      
      // 분석 결과 로딩 대기
      console.log('⏳ 5. 분석 결과 로딩 대기...');
      await page.waitForTimeout(5000);
      
      // 분석 대시보드 확인
      console.log('📈 6. 분석 대시보드 확인...');
      const dashboard = page.locator('text=블로그 분석 대시보드');
      
      if (await dashboard.isVisible()) {
        console.log('✅ 블로그 분석 대시보드 표시됨');
        
        // 총 조회수 확인
        const totalViews = page.locator('text=총 조회수').locator('..').locator('p');
        if (await totalViews.isVisible()) {
          const viewsText = await totalViews.textContent();
          console.log(`📊 총 조회수: ${viewsText}`);
        }
        
        // 트래픽 소스 확인
        const trafficSources = page.locator('text=🚦 트래픽 소스');
        if (await trafficSources.isVisible()) {
          console.log('✅ 트래픽 소스 섹션 표시됨');
        }
        
        // 검색어 확인
        const searchKeywords = page.locator('text=🔍 검색어');
        if (await searchKeywords.isVisible()) {
          console.log('✅ 검색어 섹션 표시됨');
        }
        
        // UTM 캠페인 확인
        const utmCampaigns = page.locator('text=📢 UTM 캠페인');
        if (await utmCampaigns.isVisible()) {
          console.log('✅ UTM 캠페인 섹션 표시됨');
        }
        
        // 블로그별 조회수 확인
        const blogViews = page.locator('text=📝 블로그별 조회수');
        if (await blogViews.isVisible()) {
          console.log('✅ 블로그별 조회수 섹션 표시됨');
        }
        
        console.log('🎉 블로그 분석 기능이 정상적으로 작동합니다!');
        
      } else {
        console.log('❌ 블로그 분석 대시보드가 표시되지 않음');
      }
      
    } else {
      console.log('❌ 블로그 분석 버튼을 찾을 수 없음');
    }
    
    // 스크린샷 촬영
    console.log('📸 7. 스크린샷 촬영...');
    await page.screenshot({ 
      path: 'blog-analytics-test-result.png',
      fullPage: true 
    });
    console.log('✅ 스크린샷 저장: blog-analytics-test-result.png');
    
    // 네트워크 요청 확인
    console.log('🌐 8. API 요청 확인...');
    const requests = [];
    page.on('request', request => {
      if (request.url().includes('/api/admin/blog-analytics')) {
        requests.push({
          url: request.url(),
          method: request.method()
        });
      }
    });
    
    page.on('response', response => {
      if (response.url().includes('/api/admin/blog-analytics')) {
        console.log(`📡 API 응답: ${response.status()} - ${response.url()}`);
      }
    });
    
    // 잠시 대기하여 네트워크 요청 확인
    await page.waitForTimeout(2000);
    
    if (requests.length > 0) {
      console.log('✅ 블로그 분석 API 요청 확인됨');
      requests.forEach(req => {
        console.log(`  - ${req.method} ${req.url}`);
      });
    } else {
      console.log('⚠️ 블로그 분석 API 요청이 감지되지 않음');
    }
    
  } catch (error) {
    console.error('❌ 테스트 중 오류 발생:', error.message);
    await page.screenshot({ 
      path: 'blog-analytics-test-error.png',
      fullPage: true 
    });
    console.log('📸 에러 스크린샷 저장: blog-analytics-test-error.png');
  } finally {
    console.log('🔚 9. 브라우저 종료...');
    await browser.close();
    console.log('✅ 테스트 완료');
  }
}

// 테스트 실행
testBlogAnalytics().catch(console.error);
