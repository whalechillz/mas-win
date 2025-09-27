const { chromium } = require('playwright');

async function testBlogCardFixesV2() {
  let browser;
  try {
    console.log('🚀 블로그 카드 수정사항 테스트 v2 시작...');
    browser = await chromium.launch({ headless: false });
    const page = await browser.newPage();

    // 1. 관리자 페이지 접속 (캐시 무시)
    console.log('📝 1. 관리자 페이지 접속 (캐시 무시)...');
    await page.goto('http://localhost:3000/admin/blog', { 
      waitUntil: 'networkidle',
      timeout: 30000 
    });

    // 로그인 처리 (필요한 경우)
    const currentUrl = page.url();
    if (currentUrl.includes('/admin/login')) {
      console.log('🔑 로그인 페이지 감지, 로그인 시도...');
      await page.fill('input[type="email"]', 'admin@example.com');
      await page.fill('input[type="password"]', '1234');
      await page.click('button[type="submit"]');
      await page.waitForLoadState('networkidle');
    }
    
    console.log('✅ 관리자 페이지 로드 완료');
    
    // 강제 새로고침
    console.log('🔄 강제 새로고침...');
    await page.reload({ waitUntil: 'networkidle' });
    await page.waitForTimeout(3000);
    
    // 2. 발행 상태 표시 확인 (더 정확한 선택자 사용)
    console.log('📊 2. 발행 상태 표시 확인...');
    
    // 더 구체적인 선택자로 발행 상태 라벨 찾기
    const publishedLabels = page.locator('span:has-text("📢 발행됨")');
    const draftLabels = page.locator('span:has-text("📝 초안")');
    
    const publishedCount = await publishedLabels.count();
    const draftCount = await draftLabels.count();
    
    console.log(`✅ 발행된 글: ${publishedCount}개`);
    console.log(`✅ 초안 글: ${draftCount}개`);
    
    if (publishedCount > 0 || draftCount > 0) {
      console.log('✅ 발행 상태 표시가 정상적으로 작동합니다!');
      
      // 실제 라벨 텍스트 확인
      if (publishedCount > 0) {
        const firstPublished = publishedLabels.first();
        const text = await firstPublished.textContent();
        console.log(`📢 첫 번째 발행 라벨: "${text}"`);
      }
      
      if (draftCount > 0) {
        const firstDraft = draftLabels.first();
        const text = await firstDraft.textContent();
        console.log(`📝 첫 번째 초안 라벨: "${text}"`);
      }
    } else {
      console.log('⚠️ 발행 상태 라벨을 찾을 수 없습니다.');
      
      // 모든 span 요소 확인
      const allSpans = page.locator('span');
      const spanCount = await allSpans.count();
      console.log(`🔍 총 ${spanCount}개의 span 요소가 있습니다.`);
      
      // 처음 10개 span의 텍스트 확인
      for (let i = 0; i < Math.min(spanCount, 10); i++) {
        const span = allSpans.nth(i);
        const text = await span.textContent();
        if (text && (text.includes('발행') || text.includes('초안'))) {
          console.log(`📋 span ${i}: "${text}"`);
        }
      }
    }
    
    // 3. 개별 체크박스 선택 테스트
    console.log('🔘 3. 개별 체크박스 선택 테스트...');
    
    // 첫 번째 카드의 체크박스 찾기
    const firstCheckbox = page.locator('input[type="checkbox"]').first();
    
    if (await firstCheckbox.isVisible()) {
      console.log('✅ 첫 번째 체크박스 발견');
      
      // 체크박스 클릭 전 상태 확인
      const initialChecked = await firstCheckbox.isChecked();
      console.log(`📋 체크박스 초기 상태: ${initialChecked ? '체크됨' : '체크 안됨'}`);
      
      // 체크박스 클릭
      console.log('🖱️ 체크박스 클릭...');
      await firstCheckbox.click();
      await page.waitForTimeout(1000);
      
      // 클릭 후 상태 확인
      const afterClickChecked = await firstCheckbox.isChecked();
      console.log(`📋 체크박스 클릭 후 상태: ${afterClickChecked ? '체크됨' : '체크 안됨'}`);
      
      if (initialChecked !== afterClickChecked) {
        console.log('✅ 개별 체크박스 선택이 정상적으로 작동합니다!');
      } else {
        console.log('❌ 개별 체크박스 선택이 작동하지 않습니다.');
      }
      
    } else {
      console.log('❌ 체크박스를 찾을 수 없습니다.');
    }
    
    // 4. 스크린샷 촬영
    console.log('📸 4. 스크린샷 촬영...');
    await page.screenshot({ 
      path: 'blog-card-fixes-test-v2-result.png',
      fullPage: true 
    });
    console.log('✅ 스크린샷 저장: blog-card-fixes-test-v2-result.png');
    
  } catch (error) {
    console.error('❌ 테스트 중 오류 발생:', error);
    if (browser) {
      const page = await browser.newPage();
      await page.screenshot({ 
        path: 'blog-card-fixes-test-v2-error.png',
        fullPage: true 
      });
      console.log('📸 에러 스크린샷 저장: blog-card-fixes-test-v2-error.png');
    }
  } finally {
    console.log('🔚 5. 브라우저 종료...');
    await browser.close();
    console.log('✅ 블로그 카드 수정사항 테스트 v2 완료');
  }
}

// 테스트 실행
testBlogCardFixesV2().catch(console.error);
