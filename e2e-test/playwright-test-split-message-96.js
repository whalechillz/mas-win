const { chromium } = require('playwright');

(async () => {
  console.log('🚀 96번 메시지 자동 분할 저장 확인 테스트 시작...\n');
  
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 500
  });
  
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  
  const page = await context.newPage();
  
  try {
    // 1. 로그인
    console.log('📄 1. 로그인 중...');
    await page.goto('http://localhost:3000/admin/login', {
      waitUntil: 'domcontentloaded',
      timeout: 10000
    });
    
    await page.waitForTimeout(1000);
    
    // 로그인 정보 입력
    await page.waitForSelector('input[name="login"]', { timeout: 10000 });
    await page.fill('input[name="login"]', '010-6669-9000');
    await page.fill('input[name="password"]', '66699000');
    await page.click('button[type="submit"]');
    
    await page.waitForTimeout(2000);
    console.log('✅ 로그인 완료\n');
    
    // 2. SMS 리스트 페이지로 이동
    console.log('📄 2. SMS 리스트 페이지로 이동 중...');
    await page.goto('http://localhost:3000/admin/sms-list', {
      waitUntil: 'domcontentloaded',
      timeout: 10000
    });
    
    await page.waitForTimeout(2000);
    console.log('✅ SMS 리스트 페이지 로드 완료\n');
    
    // 3. 분할된 메시지 확인 (109, 110, 111)
    console.log('🔍 3. 분할된 메시지 확인 중...');
    
    const messageIds = [109, 110, 111];
    const foundMessages = [];
    
    for (const msgId of messageIds) {
      try {
        // 테이블에서 해당 ID 찾기
        const idCell = await page.locator(`text=${msgId}`).first();
        if (await idCell.isVisible({ timeout: 3000 })) {
          const row = idCell.locator('..').locator('..'); // tr 요소 찾기
          
          // 수신자 수 확인
          const recipientText = await row.locator('td').nth(4).textContent();
          const recipientCount = parseInt(recipientText.match(/\d+/)?.[0] || '0');
          
          // 메모 확인
          const memoText = await row.locator('td').nth(10).textContent();
          const hasSplitNote = memoText.includes('분할');
          
          foundMessages.push({
            id: msgId,
            recipients: recipientCount,
            hasSplitNote: hasSplitNote,
            memo: memoText
          });
          
          console.log(`   ✅ 메시지 ${msgId} 확인:`);
          console.log(`      수신자: ${recipientCount}명`);
          console.log(`      메모: ${memoText.substring(0, 50)}...`);
          console.log(`      분할 표시: ${hasSplitNote ? '✅' : '❌'}\n`);
        } else {
          console.log(`   ❌ 메시지 ${msgId}를 찾을 수 없습니다.\n`);
        }
      } catch (error) {
        console.log(`   ❌ 메시지 ${msgId} 확인 중 오류: ${error.message}\n`);
      }
    }
    
    // 4. 96번 메시지 확인 (여러 그룹 ID 표시 확인)
    console.log('🔍 4. 96번 메시지 그룹 ID 표시 확인 중...');
    
    let hasMultipleGroups = false;
    let hasSyncAllButton = false;
    
    try {
      const id96Cell = await page.locator('text=96').first();
      if (await id96Cell.isVisible({ timeout: 3000 })) {
        const row = id96Cell.locator('..').locator('..');
        
        // 솔라피 그룹 ID 열 확인
        const groupIdCell = await row.locator('td').nth(7);
        const groupIdText = await groupIdCell.textContent();
        
        // 여러 그룹 ID가 있는지 확인 (콤마로 구분)
        hasMultipleGroups = groupIdText.includes(',') || groupIdText.includes('1.') || groupIdText.includes('2.');
        hasSyncAllButton = await groupIdCell.locator('text=전체').isVisible({ timeout: 1000 }).catch(() => false);
        
        console.log(`   ✅ 96번 메시지 확인:`);
        console.log(`      그룹 ID 텍스트: ${groupIdText.substring(0, 100)}...`);
        console.log(`      여러 그룹 ID 표시: ${hasMultipleGroups ? '✅' : '❌'}`);
        console.log(`      전체 동기화 버튼: ${hasSyncAllButton ? '✅' : '❌'}\n`);
        
        if (hasMultipleGroups) {
          console.log('   ✅ 96번 메시지에 여러 그룹 ID가 정확하게 표시됩니다!\n');
        } else {
          console.log('   ⚠️  96번 메시지에 여러 그룹 ID가 표시되지 않습니다.');
          console.log('   💡 솔라피 콘솔에서 두 번째 그룹 ID를 확인하고 복구 스크립트를 실행하세요.\n');
        }
      } else {
        console.log('   ❌ 96번 메시지를 찾을 수 없습니다.\n');
      }
    } catch (error) {
      console.log(`   ❌ 96번 메시지 확인 중 오류: ${error.message}\n`);
    }
    
    // 5. 스크린샷 저장
    console.log('📸 5. 스크린샷 저장 중...');
    await page.screenshot({ 
      path: 'e2e-test/screenshots/split-message-96-test.png',
      fullPage: true
    });
    console.log('✅ 스크린샷 저장 완료: e2e-test/screenshots/split-message-96-test.png\n');
    
    // 6. 결과 요약
    console.log('📊 테스트 결과 요약:');
    console.log(`   분할된 메시지 확인: ${foundMessages.length}/${messageIds.length}개`);
    console.log(`   96번 메시지 그룹 ID 표시: ${hasMultipleGroups ? '✅' : '❌'}\n`);
    
    if (foundMessages.length === messageIds.length) {
      console.log('✅ 모든 분할 메시지가 정상적으로 생성되었습니다!');
    } else {
      console.log('⚠️  일부 분할 메시지를 찾을 수 없습니다.');
    }
    
    // 브라우저를 열어둠 (수동 확인용)
    console.log('\n💡 브라우저를 10초간 열어둡니다. 수동으로 확인하세요...');
    await page.waitForTimeout(10000);
    
  } catch (error) {
    console.error('❌ 테스트 오류:', error);
    await page.screenshot({ 
      path: 'e2e-test/screenshots/split-message-96-error.png',
      fullPage: true
    });
  } finally {
    await browser.close();
    console.log('\n✅ 테스트 완료!');
  }
})();





