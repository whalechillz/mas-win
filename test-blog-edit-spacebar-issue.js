const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    console.log('🔍 블로그 편집 페이지 스페이스바 문제 확인 시작...');

    // 1. 로그인
    console.log('1️⃣ 로그인 중...');
    await page.goto('http://localhost:3000/admin/login');
    await page.waitForLoadState('networkidle');
    
    // 로그인 입력 필드 찾기 (실제 로그인 페이지 구조에 맞게)
    const loginInput = page.locator('input[name="login"], input[id="login"], input[type="text"]').first();
    const passwordInput = page.locator('input[name="password"], input[id="password"], input[type="password"]').first();
    const submitButton = page.locator('button[type="submit"], button:has-text("로그인")').first();
    
    await loginInput.waitFor({ state: 'visible', timeout: 10000 });
    await loginInput.fill('010-6669-9000');
    
    await passwordInput.waitFor({ state: 'visible', timeout: 10000 });
    await passwordInput.fill('66699000');
    
    await submitButton.waitFor({ state: 'visible', timeout: 10000 });
    await submitButton.click();
    
    await page.waitForURL('**/admin/**', { timeout: 15000 });
    console.log('✅ 로그인 완료');

    // 2. 블로그 관리 페이지로 이동
    console.log('2️⃣ 블로그 관리 페이지로 이동...');
    await page.goto('http://localhost:3000/admin/blog');
    await page.waitForLoadState('networkidle');
    console.log('✅ 블로그 관리 페이지 로드 완료');

    // 3. 첫 번째 게시물의 "수정" 버튼 클릭
    console.log('3️⃣ 첫 번째 게시물 수정 버튼 클릭...');
    await page.waitForTimeout(2000); // 페이지 로드 대기
    
    // 여러 가능한 selector 시도
    const editButtonSelectors = [
      'button:has-text("수정")',
      'button:has-text("Edit")',
      'a:has-text("수정")',
      'button[title*="수정"]',
      'button[title*="Edit"]',
      'button',
      'a'
    ];
    
    let editButton = null;
    for (const selector of editButtonSelectors) {
      try {
        const buttons = await page.locator(selector).all();
        for (const btn of buttons) {
          const text = await btn.textContent();
          if (text && (text.includes('수정') || text.includes('Edit'))) {
            editButton = btn;
            console.log(`✅ 수정 버튼 발견: ${selector}`);
            break;
          }
        }
        if (editButton) break;
      } catch (e) {
        continue;
      }
    }
    
    if (!editButton) {
      // 스크린샷으로 현재 상태 확인
      await page.screenshot({ path: 'test-blog-edit-button-not-found.png', fullPage: true });
      throw new Error('수정 버튼을 찾을 수 없습니다. 스크린샷 저장: test-blog-edit-button-not-found.png');
    }
    
    await editButton.click();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000); // 에디터 초기화 대기
    console.log('✅ 수정 모드 진입 완료');

    // 4. TipTap 에디터 찾기
    console.log('4️⃣ TipTap 에디터 찾기...');
    const editorSelector = '.ProseMirror, [contenteditable="true"]';
    const editor = page.locator(editorSelector).first();
    
    await editor.waitFor({ state: 'visible', timeout: 10000 });
    console.log('✅ 에디터 찾기 완료');

    // 5. 에디터에 포커스하고 기존 내용 확인
    console.log('5️⃣ 에디터에 포커스...');
    await editor.click();
    await page.waitForTimeout(500);
    
    // 초기 상태 확인
    const initialScrollY = await page.evaluate(() => window.scrollY);
    const initialContent = await editor.textContent();
    console.log(`📊 초기 스크롤 위치: ${initialScrollY}px`);
    console.log(`📝 초기 내용 길이: ${initialContent ? initialContent.length : 0}자`);

    // 6. 커서를 중간 위치로 이동
    console.log('6️⃣ 커서를 중간 위치로 이동...');
    await editor.click({ position: { x: 100, y: 100 } });
    await page.waitForTimeout(300);
    
    // 커서 위치 확인
    const cursorBefore = await page.evaluate(() => {
      const selection = window.getSelection();
      if (!selection || selection.rangeCount === 0) return null;
      const range = selection.getRangeAt(0);
      return {
        offset: range.startOffset,
        nodeText: range.startContainer.textContent?.substring(0, 50),
        scrollY: window.scrollY
      };
    });
    console.log('📊 커서 위치:', JSON.stringify(cursorBefore, null, 2));

    // 7. 스페이스바 입력 테스트
    console.log('\n7️⃣ 스페이스바 입력 테스트 시작...');
    
    for (let i = 0; i < 5; i++) {
      console.log(`\n--- 스페이스바 입력 ${i + 1}/5 ---`);
      
      // 입력 전 상태
      const beforeState = await page.evaluate(() => {
        const selection = window.getSelection();
        const range = selection && selection.rangeCount > 0 ? selection.getRangeAt(0) : null;
        return {
          scrollY: window.scrollY,
          cursorOffset: range ? range.startOffset : null,
          contentLength: document.querySelector('.ProseMirror, [contenteditable="true"]')?.textContent?.length || 0,
          editorTop: document.querySelector('.ProseMirror, [contenteditable="true"]')?.getBoundingClientRect().top || 0
        };
      });
      
      console.log(`  입력 전 - 스크롤: ${beforeState.scrollY}px, 커서: ${beforeState.cursorOffset}, 내용 길이: ${beforeState.contentLength}`);
      
      // 스페이스바 입력
      await editor.press('Space');
      await page.waitForTimeout(500); // 리렌더링 대기
      
      // 입력 후 상태
      const afterState = await page.evaluate(() => {
        const selection = window.getSelection();
        const range = selection && selection.rangeCount > 0 ? selection.getRangeAt(0) : null;
        return {
          scrollY: window.scrollY,
          cursorOffset: range ? range.startOffset : null,
          contentLength: document.querySelector('.ProseMirror, [contenteditable="true"]')?.textContent?.length || 0,
          editorTop: document.querySelector('.ProseMirror, [contenteditable="true"]')?.getBoundingClientRect().top || 0,
          editorFocused: document.activeElement?.classList.contains('ProseMirror') || document.activeElement?.getAttribute('contenteditable') === 'true'
        };
      });
      
      console.log(`  입력 후 - 스크롤: ${afterState.scrollY}px, 커서: ${afterState.cursorOffset}, 내용 길이: ${afterState.contentLength}`);
      
      // 문제 감지
      const scrollChanged = Math.abs(afterState.scrollY - beforeState.scrollY) > 10;
      const scrollToTop = afterState.scrollY < 100 && beforeState.scrollY > 100;
      const cursorLost = afterState.cursorOffset === null;
      const cursorMovedToStart = afterState.cursorOffset !== null && afterState.cursorOffset < 5 && beforeState.cursorOffset > 5;
      const contentLengthChanged = afterState.contentLength !== beforeState.contentLength + 1;
      
      if (scrollToTop) {
        console.log(`  ❌ 심각한 오류: 페이지가 상단으로 스크롤되었습니다! (${beforeState.scrollY}px → ${afterState.scrollY}px)`);
      } else if (scrollChanged) {
        console.log(`  ⚠️ 경고: 스크롤 위치가 변경되었습니다! (${beforeState.scrollY}px → ${afterState.scrollY}px)`);
      }
      
      if (cursorLost) {
        console.log(`  ❌ 오류: 커서 위치를 찾을 수 없습니다!`);
      } else if (cursorMovedToStart) {
        console.log(`  ❌ 오류: 커서가 맨 처음으로 이동했습니다! (${beforeState.cursorOffset} → ${afterState.cursorOffset})`);
      }
      
      if (contentLengthChanged) {
        console.log(`  ⚠️ 경고: 내용 길이가 예상과 다릅니다! (예상: ${beforeState.contentLength + 1}, 실제: ${afterState.contentLength})`);
      }
      
      if (!scrollToTop && !cursorLost && !cursorMovedToStart && !contentLengthChanged) {
        console.log(`  ✅ 정상: 스페이스바 입력 성공`);
      }
      
      // 문제가 발생하면 중단
      if (scrollToTop || cursorMovedToStart) {
        console.log(`\n❌ 문제 재현됨! 테스트 중단.`);
        break;
      }
    }

    // 8. 일반 텍스트 입력 테스트
    console.log('\n8️⃣ 일반 텍스트 입력 테스트...');
    await editor.click({ position: { x: 100, y: 100 } });
    await page.waitForTimeout(300);
    
    const beforeText = await page.evaluate(() => window.scrollY);
    console.log(`  입력 전 스크롤: ${beforeText}px`);
    
    await editor.type('테스트', { delay: 100 });
    await page.waitForTimeout(500);
    
    const afterText = await page.evaluate(() => window.scrollY);
    console.log(`  입력 후 스크롤: ${afterText}px`);
    
    if (Math.abs(afterText - beforeText) > 10) {
      console.log(`  ❌ 경고: 텍스트 입력 시 스크롤 위치가 변경되었습니다!`);
    } else {
      console.log(`  ✅ 정상: 텍스트 입력 성공`);
    }

    // 9. 최종 상태 확인
    console.log('\n9️⃣ 최종 상태 확인...');
    const finalScrollY = await page.evaluate(() => window.scrollY);
    const finalContent = await editor.textContent();
    const finalCursorInfo = await page.evaluate(() => {
      const selection = window.getSelection();
      if (!selection || selection.rangeCount === 0) return null;
      const range = selection.getRangeAt(0);
      return {
        offset: range.startOffset,
        scrollY: window.scrollY
      };
    });
    
    console.log(`📊 최종 스크롤 위치: ${finalScrollY}px`);
    console.log(`📝 최종 내용 길이: ${finalContent ? finalContent.length : 0}자`);
    console.log(`📊 최종 커서 offset: ${finalCursorInfo?.offset || 'N/A'}`);
    
    // 10. 스크린샷 저장
    console.log('\n🔟 스크린샷 저장...');
    await page.screenshot({ path: 'test-blog-edit-spacebar-result.png', fullPage: true });
    console.log('✅ 스크린샷 저장 완료: test-blog-edit-spacebar-result.png');

    console.log('\n✅ 테스트 완료!');
    
  } catch (error) {
    console.error('❌ 테스트 중 오류 발생:', error);
    await page.screenshot({ path: 'test-blog-edit-spacebar-error.png', fullPage: true });
    throw error;
  } finally {
    console.log('\n⚠️ 브라우저를 수동으로 닫아주세요.');
    // await browser.close();
  }
})();

