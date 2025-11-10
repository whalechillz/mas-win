const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  try {
    console.log('🔍 블로그 포스트 렌더링 및 이미지 링크 문제 확인...\n');
    
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
    
    // 첫 번째 게시물 찾기 (ID: 309)
    console.log('3. 첫 번째 게시물 (ID: 309) 찾기...');
    const post309 = page.locator('text=가을 골프 시즌 특가').first();
    if (await post309.count() === 0) {
      throw new Error('게시물을 찾을 수 없습니다.');
    }
    console.log('✅ 게시물 찾기 완료\n');
    
    // 게시물 보기 버튼 클릭
    console.log('4. 게시물 보기 버튼 클릭...');
    const viewButton = post309.locator('..').locator('button:has-text("보기")').first();
    await viewButton.click();
    await page.waitForTimeout(3000);
    console.log('✅ 게시물 보기 페이지 로드 완료\n');
    
    // 현재 URL 확인
    const currentUrl = page.url();
    console.log(`현재 URL: ${currentUrl}\n`);
    
    // 페이지 내용 확인
    console.log('5. 페이지 내용 확인...');
    const pageContent = await page.content();
    
    // 마크다운이 raw로 표시되는지 확인
    const hasRawMarkdown = pageContent.includes('# 가을 골프 시즌 특가') || 
                          pageContent.includes('! [가을 골프 시즌 이미지]');
    
    if (hasRawMarkdown) {
      console.log('❌ 마크다운이 raw로 표시되고 있습니다!');
    } else {
      console.log('✅ 마크다운이 제대로 렌더링되고 있습니다.');
    }
    
    // 이미지 링크 확인
    console.log('\n6. 이미지 링크 확인...');
    const images = await page.locator('img').all();
    console.log(`이미지 개수: ${images.length}`);
    
    for (let i = 0; i < images.length; i++) {
      const img = images[i];
      const src = await img.getAttribute('src');
      console.log(`  이미지 ${i + 1}: ${src}`);
      
      // 이미지가 로드되는지 확인
      try {
        const isVisible = await img.isVisible();
        const naturalWidth = await img.evaluate(el => el.naturalWidth);
        if (naturalWidth === 0) {
          console.log(`    ❌ 이미지 ${i + 1}가 로드되지 않았습니다 (naturalWidth: 0)`);
        } else {
          console.log(`    ✅ 이미지 ${i + 1}가 정상적으로 로드되었습니다 (width: ${naturalWidth})`);
        }
      } catch (error) {
        console.log(`    ❌ 이미지 ${i + 1} 확인 중 오류: ${error.message}`);
      }
    }
    
    // 깨진 이미지 링크 확인
    const brokenImageLinks = pageContent.match(/! \[.*?\] \(https?:\/\/[^)]*\/or[^)]*\)/g);
    if (brokenImageLinks && brokenImageLinks.length > 0) {
      console.log('\n❌ 깨진 이미지 링크 발견:');
      brokenImageLinks.forEach((link, idx) => {
        console.log(`  ${idx + 1}. ${link}`);
      });
    } else {
      console.log('\n✅ 깨진 이미지 링크가 없습니다.');
    }
    
    // 스크린샷 저장
    await page.screenshot({ path: 'test-blog-rendering-issue.png', fullPage: true });
    console.log('\n📸 스크린샷 저장: test-blog-rendering-issue.png');
    
    // 편집 페이지로 이동하여 내용 확인
    console.log('\n7. 편집 페이지로 이동하여 내용 확인...');
    await page.goto('http://localhost:3000/admin/blog');
    await page.waitForTimeout(2000);
    
    // 수정 버튼 찾기
    let editButton = null;
    const selectors = [
      'button:has-text("수정")',
      'button:has-text("편집")',
      'button[title*="수정"]',
      'button[title*="편집"]',
    ];
    
    for (const selector of selectors) {
      const buttons = await page.locator(selector).all();
      for (const btn of buttons) {
        const text = await btn.textContent();
        if (text && (text.includes('수정') || text.includes('편집'))) {
          // ID 309 게시물의 수정 버튼인지 확인
          const parent = await btn.evaluateHandle(el => el.closest('tr, div'));
          const parentText = await parent.textContent();
          if (parentText && parentText.includes('309')) {
            editButton = btn;
            break;
          }
        }
      }
      if (editButton) break;
    }
    
    if (editButton) {
      await editButton.click();
      await page.waitForTimeout(2000);
      console.log('✅ 편집 페이지 로드 완료');
      
      // 에디터 내용 확인
      const editor = page.locator('.ProseMirror, [contenteditable="true"]').first();
      if (await editor.count() > 0) {
        const editorContent = await editor.textContent();
        console.log(`\n에디터 내용 (처음 500자):\n${editorContent.substring(0, 500)}`);
        
        // HTML 내용 확인
        const editorHTML = await editor.innerHTML();
        console.log(`\n에디터 HTML (처음 500자):\n${editorHTML.substring(0, 500)}`);
        
        // 깨진 이미지 링크 확인
        if (editorContent.includes('/or') || editorHTML.includes('/or')) {
          console.log('\n❌ 에디터에 깨진 이미지 링크가 있습니다!');
        } else {
          console.log('\n✅ 에디터에 깨진 이미지 링크가 없습니다.');
        }
      }
    } else {
      console.log('⚠️ 수정 버튼을 찾을 수 없습니다.');
    }
    
    console.log('\n✅ 테스트 완료');
    
  } catch (error) {
    console.error('❌ 테스트 중 오류 발생:', error);
    await page.screenshot({ path: 'test-blog-rendering-error.png', fullPage: true });
  } finally {
    await browser.close();
  }
})();



