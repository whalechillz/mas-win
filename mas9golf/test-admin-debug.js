const { chromium } = require('playwright');

async function testAdminDebug() {
  console.log('🔍 관리자 페이지 디버깅 시작...');
  
  const browser = await chromium.launch({ 
    headless: false,
    channel: 'chrome-canary'
  });
  
  const context = await browser.newContext();
  const page = await context.newPage();
  
  try {
    // 1. 관리자 페이지 접속
    console.log('📝 관리자 페이지 접속 중...');
    await page.goto('https://www.masgolf.co.kr/admin/blog', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(5000);
    
    // 페이지 제목 확인
    const title = await page.title();
    console.log('✅ 페이지 제목:', title);
    
    // 페이지 내용 확인
    const bodyText = await page.textContent('body');
    console.log('✅ 페이지 내용 길이:', bodyText ? bodyText.length : 0, '자');
    
    // 모든 입력 필드 찾기
    const inputs = await page.$$('input');
    console.log('✅ 입력 필드 수:', inputs.length);
    
    for (let i = 0; i < inputs.length; i++) {
      const name = await inputs[i].getAttribute('name');
      const type = await inputs[i].getAttribute('type');
      const placeholder = await inputs[i].getAttribute('placeholder');
      console.log(`입력 필드 ${i}: name="${name}", type="${type}", placeholder="${placeholder}"`);
    }
    
    // 모든 버튼 찾기
    const buttons = await page.$$('button');
    console.log('✅ 버튼 수:', buttons.length);
    
    for (let i = 0; i < buttons.length; i++) {
      const text = await buttons[i].textContent();
      const className = await buttons[i].getAttribute('class');
      console.log(`버튼 ${i}: "${text}", class="${className}"`);
    }
    
    // 새 게시물 작성 버튼 클릭
    const newPostButton = await page.$('button:has-text("새 게시물 작성")');
    if (newPostButton) {
      console.log('✅ 새 게시물 작성 버튼 클릭');
      await newPostButton.click();
      await page.waitForTimeout(3000);
      
      // 클릭 후 입력 필드 다시 확인
      const inputsAfterClick = await page.$$('input');
      console.log('✅ 클릭 후 입력 필드 수:', inputsAfterClick.length);
      
      for (let i = 0; i < inputsAfterClick.length; i++) {
        const name = await inputsAfterClick[i].getAttribute('name');
        const type = await inputsAfterClick[i].getAttribute('type');
        const placeholder = await inputsAfterClick[i].getAttribute('placeholder');
        console.log(`클릭 후 입력 필드 ${i}: name="${name}", type="${type}", placeholder="${placeholder}"`);
      }
      
      // title 입력 필드 찾기
      const titleInput = await page.$('input[name="title"]');
      if (titleInput) {
        console.log('✅ title 입력 필드 발견');
        await titleInput.fill('테스트 블로그 포스트');
        console.log('✅ 제목 입력 완료');
        
        // 브랜드 전략 섹션 확인
        const brandStrategySection = await page.$('.bg-blue-50');
        if (brandStrategySection) {
          console.log('✅ 브랜드 전략 섹션 발견');
          
          // AI 버튼들 확인
          const aiButtons = await page.$$('button:has-text("🤖")');
          console.log('✅ AI 버튼 수:', aiButtons.length);
          
          for (let i = 0; i < aiButtons.length; i++) {
            const text = await aiButtons[i].textContent();
            console.log(`AI 버튼 ${i}: "${text}"`);
          }
          
          // AI 요약 버튼 클릭
          const aiSummaryButton = await page.$('button:has-text("🤖 AI 요약")');
          if (aiSummaryButton) {
            console.log('✅ AI 요약 버튼 클릭');
            await aiSummaryButton.click();
            await page.waitForTimeout(5000);
            
            // 요약 필드 확인
            const excerptField = await page.$('textarea[name="excerpt"]');
            if (excerptField) {
              const excerptValue = await excerptField.inputValue();
              console.log('✅ AI 요약 생성됨:', excerptValue);
            }
          }
          
        } else {
          console.log('❌ 브랜드 전략 섹션을 찾을 수 없음');
        }
        
      } else {
        console.log('❌ title 입력 필드를 찾을 수 없음');
      }
      
    } else {
      console.log('❌ 새 게시물 작성 버튼을 찾을 수 없음');
    }
    
    // 페이지 스크린샷
    await page.screenshot({ path: 'admin-debug.png' });
    console.log('✅ 디버그 스크린샷 저장됨');
    
    console.log('🎉 관리자 페이지 디버깅 완료!');
    
  } catch (error) {
    console.error('❌ 디버깅 중 오류 발생:', error);
    await page.screenshot({ path: 'debug-error.png' });
    console.log('❌ 오류 스크린샷 저장됨');
  } finally {
    await browser.close();
  }
}

testAdminDebug();
