const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ 
    headless: false,
    devtools: true // 개발자 도구 자동 열기
  });
  
  const context = await browser.newContext();
  const page = await context.newPage();
  
  // 콘솔 메시지 수집
  const consoleLogs = [];
  page.on('console', msg => {
    const text = msg.text();
    consoleLogs.push({
      type: msg.type(),
      text: text,
      timestamp: new Date().toISOString()
    });
    console.log(`[${msg.type()}] ${text}`);
  });
  
  try {
    console.log('🚀 갤러리 페이지 접속...');
    await page.goto('http://localhost:3000/admin/gallery', { waitUntil: 'networkidle' });
    
    // 로그인 필요 시 처리
    const currentUrl = page.url();
    if (currentUrl.includes('/admin/login')) {
      console.log('🔐 로그인 페이지로 리다이렉트됨, 로그인 시도...');
      // 로그인 정보 입력 (실제 값으로 변경 필요)
      await page.fill('input[name="login"]', 'admin'); // 실제 로그인 정보로 변경
      await page.fill('input[name="password"]', 'password'); // 실제 비밀번호로 변경
      await page.click('button[type="submit"]');
      await page.waitForURL('**/admin/gallery**', { timeout: 10000 });
    }
    
    console.log('✅ 갤러리 페이지 로드 완료');
    console.log('📍 현재 URL:', page.url());
    
    // 좋아요 필터 버튼 찾기
    console.log('\n🔍 좋아요 필터 버튼 찾기...');
    const likedButton = page.locator('button:has-text("좋아요")').first();
    await likedButton.waitFor({ timeout: 5000 });
    
    const initialButtonText = await likedButton.textContent();
    console.log('📌 초기 버튼 텍스트:', initialButtonText);
    console.log('📍 초기 URL:', page.url());
    
    // 좋아요 필터 클릭
    console.log('\n🖱️ 좋아요 필터 버튼 클릭...');
    await likedButton.click();
    await page.waitForTimeout(1000); // 상태 업데이트 대기
    
    const afterClickButtonText = await likedButton.textContent();
    const afterClickUrl = page.url();
    console.log('📌 클릭 후 버튼 텍스트:', afterClickButtonText);
    console.log('📍 클릭 후 URL:', afterClickUrl);
    
    // URL에 liked 파라미터가 있는지 확인
    const urlHasLiked = afterClickUrl.includes('liked=');
    console.log('🔍 URL에 liked 파라미터 포함:', urlHasLiked);
    
    if (urlHasLiked) {
      const urlParams = new URLSearchParams(new URL(afterClickUrl).search);
      const likedValue = urlParams.get('liked');
      console.log('📋 liked 파라미터 값:', likedValue);
    }
    
    // 브라우저 새로고침
    console.log('\n🔄 브라우저 새로고침...');
    await page.reload({ waitUntil: 'networkidle' });
    await page.waitForTimeout(2000); // 상태 복원 대기
    
    const afterReloadButtonText = await likedButton.textContent();
    const afterReloadUrl = page.url();
    console.log('📌 새로고침 후 버튼 텍스트:', afterReloadButtonText);
    console.log('📍 새로고침 후 URL:', afterReloadUrl);
    
    // 결과 분석
    console.log('\n📊 결과 분석:');
    console.log('='.repeat(50));
    console.log('초기 상태:', initialButtonText);
    console.log('클릭 후:', afterClickButtonText);
    console.log('새로고침 후:', afterReloadButtonText);
    console.log('='.repeat(50));
    
    const isPersisted = afterReloadButtonText === afterClickButtonText && 
                       afterReloadButtonText !== initialButtonText;
    
    if (isPersisted) {
      console.log('✅ 좋아요 필터 상태가 유지되었습니다!');
    } else {
      console.log('❌ 좋아요 필터 상태가 초기화되었습니다!');
      console.log('   - 초기:', initialButtonText);
      console.log('   - 클릭 후:', afterClickButtonText);
      console.log('   - 새로고침 후:', afterReloadButtonText);
    }
    
    // 콘솔 로그에서 관련 메시지 찾기
    console.log('\n📝 관련 콘솔 로그:');
    const relevantLogs = consoleLogs.filter(log => 
      log.text.includes('좋아요') || 
      log.text.includes('liked') || 
      log.text.includes('필터') ||
      log.text.includes('URL')
    );
    
    relevantLogs.forEach(log => {
      console.log(`  [${log.type}] ${log.text}`);
    });
    
    // 개발자 콘솔에서 직접 확인
    console.log('\n🔍 개발자 콘솔에서 확인할 로그:');
    const likedFilterLogs = consoleLogs.filter(log => 
      log.text.includes('좋아요 필터')
    );
    
    likedFilterLogs.forEach(log => {
      console.log(`  ${log.text}`);
    });
    
    // 5초 대기 (수동 확인용)
    console.log('\n⏳ 5초 대기 (수동 확인용)...');
    await page.waitForTimeout(5000);
    
  } catch (error) {
    console.error('❌ 오류 발생:', error);
  } finally {
    await browser.close();
  }
})();
