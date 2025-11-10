const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    console.log('🔍 블로그 편집 페이지 커서 문제 확인 시작...');

    // 1. 로그인
    console.log('1️⃣ 로그인 중...');
    await page.goto('http://localhost:3000/api/auth/signin');
    await page.fill('input[name="email"]', '010-6669-9000');
    await page.fill('input[name="password"]', '66699000');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/admin/**', { timeout: 10000 });
    console.log('✅ 로그인 완료');

    // 2. 블로그 관리 페이지로 이동
    console.log('2️⃣ 블로그 관리 페이지로 이동...');
    await page.goto('http://localhost:3000/admin/blog');
    await page.waitForLoadState('networkidle');
    console.log('✅ 블로그 관리 페이지 로드 완료');

    // 3. 첫 번째 게시물의 "수정" 버튼 클릭
    console.log('3️⃣ 첫 번째 게시물 수정 버튼 클릭...');
    const editButton = page.locator('button:has-text("수정")').first();
    await editButton.waitFor({ state: 'visible', timeout: 10000 });
    await editButton.click();
    await page.waitForLoadState('networkidle');
    console.log('✅ 수정 모드 진입 완료');

    // 4. TipTap 에디터 찾기
    console.log('4️⃣ TipTap 에디터 찾기...');
    await page.waitForTimeout(2000); // 에디터 초기화 대기
    
    // TipTap 에디터의 에디터 영역 찾기 (ProseMirror 에디터)
    const editorSelector = '.ProseMirror, [contenteditable="true"]';
    const editor = page.locator(editorSelector).first();
    
    await editor.waitFor({ state: 'visible', timeout: 10000 });
    console.log('✅ 에디터 찾기 완료');

    // 5. 에디터에 포커스하고 초기 커서 위치 확인
    console.log('5️⃣ 에디터에 포커스...');
    await editor.click();
    await page.waitForTimeout(500);
    
    // 초기 스크롤 위치 확인
    const initialScrollY = await page.evaluate(() => window.scrollY);
    console.log(`📊 초기 스크롤 위치: ${initialScrollY}px`);

    // 6. 기존 내용 확인 및 커서 위치 저장
    const existingContent = await editor.textContent();
    console.log(`📝 기존 내용 길이: ${existingContent ? existingContent.length : 0}자`);
    
    // 에디터 내부에서 커서 위치 확인
    const cursorInfo = await page.evaluate(() => {
      const editor = document.querySelector('.ProseMirror, [contenteditable="true"]');
      if (!editor) return null;
      
      const selection = window.getSelection();
      if (!selection || selection.rangeCount === 0) return null;
      
      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      
      return {
        offset: range.startOffset,
        node: range.startContainer.nodeName,
        scrollY: window.scrollY,
        editorRect: editor.getBoundingClientRect(),
        cursorRect: {
          top: rect.top,
          left: rect.left,
          bottom: rect.bottom,
          right: rect.right
        }
      };
    });
    
    console.log('📊 초기 커서 정보:', JSON.stringify(cursorInfo, null, 2));

    // 7. 텍스트 입력 테스트 (한 글자씩)
    console.log('6️⃣ 텍스트 입력 테스트 시작...');
    const testText = '테스트';
    
    for (let i = 0; i < testText.length; i++) {
      const char = testText[i];
      console.log(`\n📝 "${char}" 입력 중...`);
      
      // 입력 전 상태 확인
      const beforeScrollY = await page.evaluate(() => window.scrollY);
      const beforeCursorInfo = await page.evaluate(() => {
        const selection = window.getSelection();
        if (!selection || selection.rangeCount === 0) return null;
        const range = selection.getRangeAt(0);
        return {
          offset: range.startOffset,
          scrollY: window.scrollY,
          editorTop: document.querySelector('.ProseMirror, [contenteditable="true"]')?.getBoundingClientRect().top
        };
      });
      
      console.log(`  입력 전 - 스크롤: ${beforeScrollY}px, 커서 offset: ${beforeCursorInfo?.offset || 'N/A'}`);
      
      // 문자 입력
      await editor.type(char, { delay: 100 });
      await page.waitForTimeout(300); // 리렌더링 대기
      
      // 입력 후 상태 확인
      const afterScrollY = await page.evaluate(() => window.scrollY);
      const afterCursorInfo = await page.evaluate(() => {
        const selection = window.getSelection();
        if (!selection || selection.rangeCount === 0) return null;
        const range = selection.getRangeAt(0);
        const editor = document.querySelector('.ProseMirror, [contenteditable="true"]');
        return {
          offset: range.startOffset,
          scrollY: window.scrollY,
          editorTop: editor?.getBoundingClientRect().top,
          editorVisible: editor ? window.getComputedStyle(editor).visibility !== 'hidden' : false
        };
      });
      
      console.log(`  입력 후 - 스크롤: ${afterScrollY}px, 커서 offset: ${afterCursorInfo?.offset || 'N/A'}`);
      
      // 문제 감지
      const scrollChanged = Math.abs(afterScrollY - beforeScrollY) > 10;
      const cursorLost = !afterCursorInfo || afterCursorInfo.offset === null;
      const editorMoved = beforeCursorInfo && afterCursorInfo && 
                         Math.abs((beforeCursorInfo.editorTop || 0) - (afterCursorInfo.editorTop || 0)) > 10;
      
      if (scrollChanged) {
        console.log(`  ⚠️ 경고: 스크롤 위치가 변경되었습니다! (${beforeScrollY}px → ${afterScrollY}px)`);
      }
      
      if (cursorLost) {
        console.log(`  ❌ 오류: 커서 위치를 찾을 수 없습니다!`);
      }
      
      if (editorMoved) {
        console.log(`  ⚠️ 경고: 에디터 위치가 변경되었습니다!`);
      }
      
      if (!scrollChanged && !cursorLost && !editorMoved) {
        console.log(`  ✅ 정상: 커서 위치 유지됨`);
      }
      
      // 스크롤이 상단으로 이동했는지 확인
      if (afterScrollY < beforeScrollY && afterScrollY < 100) {
        console.log(`  ❌ 심각한 오류: 페이지가 상단으로 스크롤되었습니다!`);
        console.log(`     이전 위치: ${beforeScrollY}px → 현재 위치: ${afterScrollY}px`);
      }
    }

    // 8. 최종 상태 확인
    console.log('\n7️⃣ 최종 상태 확인...');
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
    
    // 9. 스크롤 위치 비교
    const scrollDiff = Math.abs(finalScrollY - initialScrollY);
    if (scrollDiff > 50) {
      console.log(`\n❌ 문제 발견: 초기 스크롤 위치(${initialScrollY}px)와 최종 위치(${finalScrollY}px)가 크게 다릅니다!`);
      console.log(`   차이: ${scrollDiff}px`);
    } else {
      console.log(`\n✅ 스크롤 위치가 안정적으로 유지되었습니다. (차이: ${scrollDiff}px)`);
    }

    // 10. 스크린샷 저장
    console.log('\n8️⃣ 스크린샷 저장...');
    await page.screenshot({ path: 'test-blog-edit-cursor-result.png', fullPage: true });
    console.log('✅ 스크린샷 저장 완료: test-blog-edit-cursor-result.png');

    console.log('\n✅ 테스트 완료!');
    
  } catch (error) {
    console.error('❌ 테스트 중 오류 발생:', error);
    await page.screenshot({ path: 'test-blog-edit-cursor-error.png', fullPage: true });
    throw error;
  } finally {
    // 브라우저는 수동으로 닫도록 유지 (디버깅용)
    console.log('\n⚠️ 브라우저를 수동으로 닫아주세요.');
    // await browser.close();
  }
})();

