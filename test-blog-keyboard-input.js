const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  try {
    console.log('🔍 블로그 편집 페이지 키보드 입력 테스트 시작...');
    
    // 로그인
    console.log('1. 로그인 중...');
    await page.goto('http://localhost:3000/admin/login');
    await page.fill('input[name="login"]', '010-6669-9000');
    await page.fill('input[name="password"]', '66699000');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/admin**', { timeout: 10000 });
    console.log('✅ 로그인 완료');
    
    // 블로그 관리 페이지로 이동
    console.log('2. 블로그 관리 페이지로 이동...');
    await page.goto('http://localhost:3000/admin/blog');
    await page.waitForTimeout(2000);
    console.log('✅ 블로그 관리 페이지 로드 완료');
    
    // 첫 번째 게시물 수정 버튼 클릭
    console.log('3. 첫 번째 게시물 수정 버튼 찾기...');
    // 여러 방법으로 수정 버튼 찾기
    let editButton = null;
    const selectors = [
      'button:has-text("수정")',
      'button:has-text("편집")',
      'button[title*="수정"]',
      'button[title*="편집"]',
      'tr:first-child button',
      'tbody tr:first-child button'
    ];
    
    for (const selector of selectors) {
      const buttons = await page.locator(selector).all();
      for (const btn of buttons) {
        const text = await btn.textContent();
        if (text && (text.includes('수정') || text.includes('편집'))) {
          editButton = btn;
          break;
        }
      }
      if (editButton) break;
    }
    
    if (!editButton) {
      // 스크린샷 찍기
      await page.screenshot({ path: 'test-edit-button-not-found.png', fullPage: true });
      throw new Error('수정 버튼을 찾을 수 없습니다.');
    }
    
    await editButton.click();
    await page.waitForTimeout(2000);
    console.log('✅ 편집 모드 진입');
    
    // 에디터 찾기
    console.log('4. 에디터 찾기...');
    const editor = page.locator('.ProseMirror, [contenteditable="true"]').first();
    await editor.waitFor({ state: 'visible', timeout: 5000 });
    await editor.click();
    await page.waitForTimeout(500);
    console.log('✅ 에디터 포커스 완료');
    
    // 테스트 1: 일반 텍스트 입력
    console.log('\n📝 테스트 1: 일반 텍스트 입력');
    await editor.type('Hello World', { delay: 100 });
    await page.waitForTimeout(500);
    const content1 = await editor.textContent();
    console.log(`입력된 내용: "${content1}"`);
    if (content1 && content1.includes('Hello World')) {
      console.log('✅ 일반 텍스트 입력 성공');
    } else {
      console.log('❌ 일반 텍스트 입력 실패');
    }
    
    // 테스트 2: Shift + 문자 (대문자 입력)
    console.log('\n📝 테스트 2: Shift + 문자 (대문자 입력)');
    await editor.press('Home'); // 커서를 맨 앞으로
    await page.waitForTimeout(200);
    await editor.press('Shift+A'); // 대문자 A 입력
    await page.waitForTimeout(500);
    const content2 = await editor.textContent();
    console.log(`입력된 내용: "${content2}"`);
    if (content2 && content2.includes('A')) {
      console.log('✅ 대문자 입력 성공');
    } else {
      console.log('❌ 대문자 입력 실패');
    }
    
    // 테스트 3: 스페이스바 입력
    console.log('\n📝 테스트 3: 스페이스바 입력');
    await editor.press('End'); // 커서를 맨 뒤로
    await page.waitForTimeout(200);
    await editor.press('Space');
    await page.waitForTimeout(500);
    const content3 = await editor.textContent();
    console.log(`입력된 내용: "${content3}"`);
    if (content3 && content3.endsWith(' ')) {
      console.log('✅ 스페이스바 입력 성공');
    } else {
      console.log('❌ 스페이스바 입력 실패');
    }
    
    // 테스트 4: 엔터 입력
    console.log('\n📝 테스트 4: 엔터 입력');
    await editor.press('Enter');
    await page.waitForTimeout(500);
    await editor.type('New Line', { delay: 100 });
    await page.waitForTimeout(500);
    const content4 = await editor.textContent();
    console.log(`입력된 내용: "${content4}"`);
    if (content4 && content4.includes('New Line')) {
      console.log('✅ 엔터 입력 성공');
    } else {
      console.log('❌ 엔터 입력 실패');
    }
    
    // 테스트 5: 키를 쉬었다가 누르기 (단일 입력)
    console.log('\n📝 테스트 5: 키를 쉬었다가 누르기 (단일 입력)');
    await editor.press('End');
    await page.waitForTimeout(1000); // 1초 대기
    await editor.type('X', { delay: 200 });
    await page.waitForTimeout(500);
    const content5 = await editor.textContent();
    console.log(`입력된 내용: "${content5}"`);
    if (content5 && content5.includes('X')) {
      console.log('✅ 단일 입력 성공');
    } else {
      console.log('❌ 단일 입력 실패');
    }
    
    // 테스트 6: 연속 입력
    console.log('\n📝 테스트 6: 연속 입력');
    await editor.press('End');
    await page.waitForTimeout(200);
    await editor.type('ABC', { delay: 50 });
    await page.waitForTimeout(500);
    const content6 = await editor.textContent();
    console.log(`입력된 내용: "${content6}"`);
    if (content6 && content6.includes('ABC')) {
      console.log('✅ 연속 입력 성공');
    } else {
      console.log('❌ 연속 입력 실패');
    }
    
    // 테스트 7: 커서 위치 확인
    console.log('\n📝 테스트 7: 커서 위치 확인');
    await editor.press('Home');
    await page.waitForTimeout(200);
    await editor.type('START', { delay: 100 });
    await page.waitForTimeout(500);
    const content7 = await editor.textContent();
    console.log(`입력된 내용: "${content7}"`);
    if (content7 && content7.startsWith('START')) {
      console.log('✅ 커서 위치 정상');
    } else {
      console.log('❌ 커서 위치 이상');
    }
    
    console.log('\n✅ 모든 테스트 완료');
    
    // 최종 내용 확인
    const finalContent = await editor.textContent();
    console.log(`\n📄 최종 에디터 내용:\n"${finalContent}"`);
    
  } catch (error) {
    console.error('❌ 테스트 중 오류 발생:', error);
    await page.screenshot({ path: 'test-keyboard-error.png' });
  } finally {
    await browser.close();
  }
})();

