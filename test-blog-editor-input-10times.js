const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  const testResults = [];
  
  try {
    console.log('🔍 블로그 에디터 입력 테스트 시작 (10회 반복)...\n');
    
    // 로그인
    console.log('1. 로그인 중...');
    await page.goto('http://localhost:3000/admin/login');
    await page.fill('input[name="login"]', '010-6669-9000');
    await page.fill('input[name="password"]', '66699000');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/admin**', { timeout: 10000 });
    console.log('✅ 로그인 완료\n');
    
    // 블로그 관리 페이지로 이동
    console.log('2. 블로그 관리 페이지로 이동...');
    await page.goto('http://localhost:3000/admin/blog');
    await page.waitForTimeout(2000);
    console.log('✅ 블로그 관리 페이지 로드 완료\n');
    
    // 첫 번째 게시물 수정 버튼 클릭
    console.log('3. 첫 번째 게시물 수정 버튼 찾기...');
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
      await page.screenshot({ path: 'test-edit-button-not-found.png', fullPage: true });
      throw new Error('수정 버튼을 찾을 수 없습니다.');
    }
    
    await editButton.click();
    await page.waitForTimeout(2000);
    console.log('✅ 편집 모드 진입\n');
    
    // 에디터 찾기
    console.log('4. 에디터 찾기...');
    const editor = page.locator('.ProseMirror, [contenteditable="true"]').first();
    await editor.waitFor({ state: 'visible', timeout: 5000 });
    console.log('✅ 에디터 찾기 완료\n');
    
    // 10번 테스트 반복
    for (let testNum = 1; testNum <= 10; testNum++) {
      console.log(`\n${'='.repeat(50)}`);
      console.log(`📝 테스트 ${testNum}/10 시작`);
      console.log('='.repeat(50));
      
      const testResult = {
        testNum,
        passed: true,
        errors: []
      };
      
      try {
        // 에디터 클릭하여 포커스
        await editor.click();
        await page.waitForTimeout(300);
        
        // 테스트 1: 한글 입력 (가나다라~)
        console.log(`\n  테스트 ${testNum}-1: 한글 입력 (가나다라마바사아자차카타파하)`);
        await editor.clear();
        await page.waitForTimeout(200);
        await editor.type('가나다라마바사아자차카타파하', { delay: 50 });
        await page.waitForTimeout(500);
        const koreanContent = await editor.textContent();
        console.log(`    입력된 내용: "${koreanContent}"`);
        if (koreanContent && koreanContent.includes('가나다라마바사아자차카타파하')) {
          console.log('    ✅ 한글 입력 성공');
        } else {
          console.log('    ❌ 한글 입력 실패');
          testResult.passed = false;
          testResult.errors.push('한글 입력 실패');
        }
        
        // 테스트 2: 영문 대문자 입력 (A~Z)
        console.log(`\n  테스트 ${testNum}-2: 영문 대문자 입력 (A~Z)`);
        await editor.clear();
        await page.waitForTimeout(200);
        // Shift 키를 누른 상태로 A~Z 입력
        for (let i = 0; i < 26; i++) {
          const char = String.fromCharCode(65 + i); // A=65, Z=90
          await editor.press(`Shift+${char}`);
          await page.waitForTimeout(50);
        }
        await page.waitForTimeout(500);
        const upperContent = await editor.textContent();
        console.log(`    입력된 내용: "${upperContent}"`);
        if (upperContent && upperContent.length >= 26) {
          const allUpper = upperContent.split('').every(c => c >= 'A' && c <= 'Z');
          if (allUpper) {
            console.log('    ✅ 영문 대문자 입력 성공');
          } else {
            console.log('    ❌ 영문 대문자 입력 실패 (일부 소문자 포함)');
            testResult.passed = false;
            testResult.errors.push('영문 대문자 입력 실패');
          }
        } else {
          console.log('    ❌ 영문 대문자 입력 실패 (길이 부족)');
          testResult.passed = false;
          testResult.errors.push('영문 대문자 입력 실패');
        }
        
        // 테스트 3: 영문 소문자 입력 (a~z)
        console.log(`\n  테스트 ${testNum}-3: 영문 소문자 입력 (a~z)`);
        await editor.clear();
        await page.waitForTimeout(200);
        await editor.type('abcdefghijklmnopqrstuvwxyz', { delay: 50 });
        await page.waitForTimeout(500);
        const lowerContent = await editor.textContent();
        console.log(`    입력된 내용: "${lowerContent}"`);
        if (lowerContent && lowerContent.includes('abcdefghijklmnopqrstuvwxyz')) {
          console.log('    ✅ 영문 소문자 입력 성공');
        } else {
          console.log('    ❌ 영문 소문자 입력 실패');
          testResult.passed = false;
          testResult.errors.push('영문 소문자 입력 실패');
        }
        
        // 테스트 4: 스페이스바 입력
        console.log(`\n  테스트 ${testNum}-4: 스페이스바 입력`);
        await editor.press('End');
        await page.waitForTimeout(200);
        await editor.press('Space');
        await page.waitForTimeout(300);
        const spaceContent = await editor.textContent();
        if (spaceContent && spaceContent.endsWith(' ')) {
          console.log('    ✅ 스페이스바 입력 성공');
        } else {
          console.log('    ❌ 스페이스바 입력 실패');
          testResult.passed = false;
          testResult.errors.push('스페이스바 입력 실패');
        }
        
        // 테스트 5: 엔터 입력
        console.log(`\n  테스트 ${testNum}-5: 엔터 입력`);
        await editor.press('Enter');
        await page.waitForTimeout(300);
        await editor.type('New Line', { delay: 50 });
        await page.waitForTimeout(500);
        const enterContent = await editor.textContent();
        if (enterContent && enterContent.includes('New Line')) {
          console.log('    ✅ 엔터 입력 성공');
        } else {
          console.log('    ❌ 엔터 입력 실패');
          testResult.passed = false;
          testResult.errors.push('엔터 입력 실패');
        }
        
        // 테스트 6: 키를 쉬었다가 누르기 (단일 입력)
        console.log(`\n  테스트 ${testNum}-6: 키를 쉬었다가 누르기 (단일 입력)`);
        await editor.press('End');
        await page.waitForTimeout(1000); // 1초 대기
        await editor.type('X', { delay: 200 });
        await page.waitForTimeout(500);
        const singleContent = await editor.textContent();
        if (singleContent && singleContent.includes('X')) {
          console.log('    ✅ 단일 입력 성공');
        } else {
          console.log('    ❌ 단일 입력 실패');
          testResult.passed = false;
          testResult.errors.push('단일 입력 실패');
        }
        
        // 테스트 7: 연속 입력
        console.log(`\n  테스트 ${testNum}-7: 연속 입력`);
        await editor.press('End');
        await page.waitForTimeout(200);
        await editor.type('ABC', { delay: 50 });
        await page.waitForTimeout(500);
        const continuousContent = await editor.textContent();
        if (continuousContent && continuousContent.includes('ABC')) {
          console.log('    ✅ 연속 입력 성공');
        } else {
          console.log('    ❌ 연속 입력 실패');
          testResult.passed = false;
          testResult.errors.push('연속 입력 실패');
        }
        
        // 테스트 8: 혼합 입력 (한글 + 영문)
        console.log(`\n  테스트 ${testNum}-8: 혼합 입력 (한글 + 영문)`);
        await editor.clear();
        await page.waitForTimeout(200);
        await editor.type('안녕하세요 Hello World', { delay: 50 });
        await page.waitForTimeout(500);
        const mixedContent = await editor.textContent();
        if (mixedContent && mixedContent.includes('안녕하세요') && mixedContent.includes('Hello World')) {
          console.log('    ✅ 혼합 입력 성공');
        } else {
          console.log('    ❌ 혼합 입력 실패');
          testResult.passed = false;
          testResult.errors.push('혼합 입력 실패');
        }
        
        // 테스트 9: 숫자 입력
        console.log(`\n  테스트 ${testNum}-9: 숫자 입력`);
        await editor.press('End');
        await page.waitForTimeout(200);
        await editor.type('1234567890', { delay: 50 });
        await page.waitForTimeout(500);
        const numberContent = await editor.textContent();
        if (numberContent && numberContent.includes('1234567890')) {
          console.log('    ✅ 숫자 입력 성공');
        } else {
          console.log('    ❌ 숫자 입력 실패');
          testResult.passed = false;
          testResult.errors.push('숫자 입력 실패');
        }
        
        // 테스트 10: 특수문자 입력
        console.log(`\n  테스트 ${testNum}-10: 특수문자 입력`);
        await editor.press('End');
        await page.waitForTimeout(200);
        await editor.type('!@#$%^&*()', { delay: 50 });
        await page.waitForTimeout(500);
        const specialContent = await editor.textContent();
        if (specialContent && specialContent.includes('!@#$%^&*()')) {
          console.log('    ✅ 특수문자 입력 성공');
        } else {
          console.log('    ❌ 특수문자 입력 실패');
          testResult.passed = false;
          testResult.errors.push('특수문자 입력 실패');
        }
        
        console.log(`\n  ✅ 테스트 ${testNum}/10 완료`);
        
      } catch (error) {
        console.error(`\n  ❌ 테스트 ${testNum}/10 중 오류 발생:`, error);
        testResult.passed = false;
        testResult.errors.push(`테스트 중 오류: ${error.message}`);
        await page.screenshot({ path: `test-error-${testNum}.png` });
      }
      
      testResults.push(testResult);
      
      // 다음 테스트 전 대기
      if (testNum < 10) {
        await page.waitForTimeout(1000);
      }
    }
    
    // 최종 결과 출력
    console.log('\n\n' + '='.repeat(50));
    console.log('📊 최종 테스트 결과');
    console.log('='.repeat(50));
    
    const passedTests = testResults.filter(r => r.passed).length;
    const failedTests = testResults.filter(r => !r.passed).length;
    
    console.log(`\n✅ 성공: ${passedTests}/10`);
    console.log(`❌ 실패: ${failedTests}/10\n`);
    
    if (failedTests > 0) {
      console.log('실패한 테스트:');
      testResults.forEach(result => {
        if (!result.passed) {
          console.log(`  - 테스트 ${result.testNum}: ${result.errors.join(', ')}`);
        }
      });
    }
    
    // 최종 내용 확인
    const finalContent = await editor.textContent();
    console.log(`\n📄 최종 에디터 내용:\n"${finalContent}"\n`);
    
  } catch (error) {
    console.error('❌ 테스트 중 오류 발생:', error);
    await page.screenshot({ path: 'test-keyboard-error.png' });
  } finally {
    await browser.close();
  }
})();

