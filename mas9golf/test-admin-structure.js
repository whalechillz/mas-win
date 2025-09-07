const { chromium } = require('playwright');

async function testAdminStructure() {
  console.log('🚀 Chrome Canary로 관리자 페이지 구조 확인...');
  
  const browser = await chromium.launch({
    headless: false,
    channel: 'chrome-canary'
  });
  
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 }
  });
  
  const page = await context.newPage();
  
  try {
    // 관리자 페이지로 이동
    console.log('📱 관리자 페이지로 이동...');
    await page.goto('https://masgolf.co.kr/admin/blog/', { 
      waitUntil: 'domcontentloaded',
      timeout: 60000 
    });
    
    await page.waitForTimeout(3000);
    
    // 페이지 제목 확인
    const pageTitle = await page.title();
    console.log('📄 페이지 제목:', pageTitle);
    
    // 모든 입력 필드 찾기
    const allInputs = await page.locator('input').count();
    console.log(`📝 총 입력 필드 개수: ${allInputs}`);
    
    for (let i = 0; i < allInputs; i++) {
      const input = page.locator('input').nth(i);
      const inputType = await input.getAttribute('type').catch(() => 'type 없음');
      const inputName = await input.getAttribute('name').catch(() => 'name 없음');
      const inputPlaceholder = await input.getAttribute('placeholder').catch(() => 'placeholder 없음');
      const inputValue = await input.inputValue().catch(() => '값 없음');
      
      console.log(`   입력 필드 ${i + 1}:`);
      console.log(`     타입: ${inputType}`);
      console.log(`     이름: ${inputName}`);
      console.log(`     플레이스홀더: ${inputPlaceholder}`);
      console.log(`     값: ${inputValue}`);
    }
    
    // 모든 버튼 찾기
    const allButtons = await page.locator('button').count();
    console.log(`🔘 총 버튼 개수: ${allButtons}`);
    
    for (let i = 0; i < allButtons; i++) {
      const button = page.locator('button').nth(i);
      const buttonText = await button.textContent().catch(() => '텍스트 없음');
      const buttonType = await button.getAttribute('type').catch(() => 'type 없음');
      
      console.log(`   버튼 ${i + 1}: "${buttonText}" (타입: ${buttonType})`);
    }
    
    // 폼 요소 찾기
    const allForms = await page.locator('form').count();
    console.log(`📋 총 폼 개수: ${allForms}`);
    
    // 텍스트 영역 찾기
    const allTextareas = await page.locator('textarea').count();
    console.log(`📄 총 텍스트 영역 개수: ${allTextareas}`);
    
    // 페이지 내용 확인
    const pageContent = await page.textContent('body').catch(() => '내용 없음');
    console.log(`📄 페이지 내용 길이: ${pageContent.length} 문자`);
    
    // 특정 텍스트 찾기
    const hasTitle = pageContent.includes('제목');
    const hasSlug = pageContent.includes('슬러그');
    const hasAI = pageContent.includes('AI');
    
    console.log(`🔍 특정 텍스트 확인:`);
    console.log(`   "제목": ${hasTitle ? '있음' : '없음'}`);
    console.log(`   "슬러그": ${hasSlug ? '있음' : '없음'}`);
    console.log(`   "AI": ${hasAI ? '있음' : '없음'}`);
    
    // 추가 대기 시간
    console.log('\n⏳ 추가 확인을 위해 10초 더 대기합니다...');
    await page.waitForTimeout(10000);
    
  } catch (error) {
    console.error('❌ 에러 발생:', error.message);
  } finally {
    await browser.close();
    console.log('🔚 브라우저를 종료합니다.');
  }
}

// 스크립트 실행
testAdminStructure().catch(console.error);
