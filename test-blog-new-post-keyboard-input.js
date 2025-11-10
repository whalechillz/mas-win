const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  // 콘솔 로그 수집
  page.on('console', msg => console.log(`[Console] ${msg.type()}: ${msg.text()}`));
  page.on('pageerror', error => console.error(`[Page Error] ${error.message}`));
  
  try {
    // 1. 로그인
    console.log('1. 로그인 중...');
    await page.goto('http://localhost:3000/admin/login');
    await page.fill('input[name="login"]', '010-6669-9000');
    await page.fill('input[name="password"]', '66699000');
    await page.click('button[type="submit"]');
    await page.waitForURL('http://localhost:3000/admin');
    console.log('✅ 로그인 성공');
    
    // 2. 블로그 관리 페이지로 이동
    console.log('\n2. 블로그 관리 페이지로 이동...');
    await page.goto('http://localhost:3000/admin/blog');
    await page.waitForTimeout(2000); // 페이지 로드 대기
    console.log('✅ 블로그 관리 페이지 이동 성공');
    
    // 3. "새 게시물 작성" 버튼 클릭
    console.log('\n3. 새 게시물 작성 버튼 클릭...');
    // 여러 방법으로 버튼 찾기 시도
    const newPostButton = page.locator('button:has-text("새 게시물 작성"), a:has-text("새 게시물 작성"), button:has-text("새"), a:has-text("새")').first();
    await newPostButton.waitFor({ state: 'visible', timeout: 10000 });
    await newPostButton.click();
    await page.waitForTimeout(3000); // 폼 로드 대기 (더 길게)
    
    // 폼이 실제로 열렸는지 확인
    const formVisible = await page.evaluate(() => {
      const form = document.querySelector('form, [class*="form"], [class*="editor"]');
      return form !== null;
    });
    console.log(`✅ 새 게시물 작성 폼 열기 성공 (폼 존재: ${formVisible})`);
    
    // 페이지 스크린샷 저장 (디버깅용)
    await page.screenshot({ path: 'test-blog-form-screenshot.png', fullPage: true });
    console.log('📸 스크린샷 저장: test-blog-form-screenshot.png');
    
    // 4. TipTapEditor 찾기 및 포커스
    console.log('\n4. TipTapEditor 찾기 및 포커스...');
    
    // 에디터가 로드될 때까지 대기 (최대 10초)
    let editorSelector = null;
    for (let i = 0; i < 20; i++) {
      await page.waitForTimeout(500);
      
      // 여러 셀렉터 시도
      const editorSelectors = [
        '.ProseMirror',
        '[contenteditable="true"]',
        '.prose',
        'div[contenteditable]',
        'div[role="textbox"]'
      ];
      
      for (const sel of editorSelectors) {
        const found = await page.evaluate((selector) => {
          return document.querySelector(selector) !== null;
        }, sel);
        
        if (found) {
          editorSelector = sel;
          console.log(`✅ 에디터 찾음: ${sel} (${i + 1}번째 시도)`);
          break;
        }
      }
      
      if (editorSelector) break;
      
      if (i === 9) {
        console.log('  에디터 로드 대기 중... (5초 경과)');
      }
    }
    
    if (!editorSelector) {
      // 페이지의 모든 contenteditable 요소 확인
      const allContentEditable = await page.evaluate(() => {
        const elements = document.querySelectorAll('[contenteditable], .ProseMirror, .prose, [class*="editor"], [class*="Editor"]');
        const result = [];
        elements.forEach((el, idx) => {
          if (idx < 20) {
            result.push({
              tag: el.tagName,
              classes: Array.from(el.classList || []),
              contenteditable: el.getAttribute('contenteditable'),
              id: el.id,
              visible: el.offsetParent !== null,
              text: el.textContent?.substring(0, 50)
            });
          }
        });
        return result;
      });
      console.log('contenteditable 요소들:', JSON.stringify(allContentEditable, null, 2));
      
      // 페이지의 모든 div 요소 확인 (에디터 컨테이너 찾기)
      const allDivs = await page.evaluate(() => {
        const elements = document.querySelectorAll('div');
        const result = [];
        for (let i = 0; i < Math.min(50, elements.length); i++) {
          const el = elements[i];
          const classes = Array.from(el.classList || []);
          if (classes.some(c => c.includes('border') && c.includes('rounded'))) {
            result.push({
              tag: el.tagName,
              classes: classes,
              contenteditable: el.getAttribute('contenteditable'),
              visible: el.offsetParent !== null,
              children: el.children.length
            });
          }
        }
        return result;
      });
      console.log('에디터 컨테이너 후보:', JSON.stringify(allDivs.slice(0, 10), null, 2));
      
      // 스크린샷 저장
      await page.screenshot({ path: 'test-blog-no-editor-screenshot.png', fullPage: true });
      console.log('📸 에디터 없음 스크린샷 저장: test-blog-no-editor-screenshot.png');
      
      throw new Error('에디터를 찾을 수 없습니다');
    }
    
    await page.click(editorSelector);
    await page.waitForTimeout(1000);
    
    // 에디터 포커스 확인
    const hasFocus = await page.evaluate((sel) => {
      const el = document.querySelector(sel);
      return el === document.activeElement;
    }, editorSelector);
    console.log(`✅ TipTapEditor 포커스: ${hasFocus}`);
    
    // 5. 키보드 입력 테스트
    console.log('\n5. 키보드 입력 테스트 시작...');
    
    // 테스트 1: 일반 문자 입력
    console.log('\n--- 테스트 1: 일반 문자 입력 ---');
    await page.keyboard.type('Hello', { delay: 100 });
    await page.waitForTimeout(500);
    const content1 = await page.evaluate((sel) => {
      const el = document.querySelector(sel);
      return {
        text: el?.textContent || '',
        html: el?.innerHTML || '',
        hasFocus: el === document.activeElement,
        scrollY: window.scrollY
      };
    }, editorSelector);
    console.log('입력 후:', content1);
    console.log(`  텍스트: "${content1.text}"`);
    console.log(`  포커스: ${content1.hasFocus}`);
    console.log(`  스크롤: ${content1.scrollY}px`);
    
    if (!content1.text.includes('Hello')) {
      console.error('  ❌ 텍스트 입력 실패!');
    } else {
      console.log('  ✅ 텍스트 입력 성공');
    }
    
    // 테스트 2: 스페이스바 입력
    console.log('\n--- 테스트 2: 스페이스바 입력 ---');
    const beforeSpace = await page.evaluate(() => window.scrollY);
    await page.keyboard.press('Space');
    await page.waitForTimeout(500);
    const afterSpace = await page.evaluate(() => window.scrollY);
    const content2 = await page.evaluate((sel) => {
      const el = document.querySelector(sel);
      return {
        text: el?.textContent || '',
        hasFocus: el === document.activeElement,
        scrollY: window.scrollY
      };
    }, editorSelector);
    console.log('스페이스바 입력 후:', content2);
    console.log(`  텍스트: "${content2.text}"`);
    console.log(`  스크롤 변화: ${afterSpace - beforeSpace}px`);
    console.log(`  포커스: ${content2.hasFocus}`);
    
    if (!content2.text.includes('Hello ')) {
      console.error('  ❌ 스페이스바 입력 실패!');
    } else {
      console.log('  ✅ 스페이스바 입력 성공');
    }
    
    if (Math.abs(afterSpace - beforeSpace) > 10) {
      console.error('  ❌ 스페이스바 입력 시 스크롤 발생!');
    } else {
      console.log('  ✅ 스크롤 없음');
    }
    
    // 테스트 3: 한글 입력
    console.log('\n--- 테스트 3: 한글 입력 ---');
    await page.keyboard.type('안녕', { delay: 100 });
    await page.waitForTimeout(500);
    const content3 = await page.evaluate((sel) => {
      const el = document.querySelector(sel);
      return {
        text: el?.textContent || '',
        hasFocus: el === document.activeElement
      };
    }, editorSelector);
    console.log('한글 입력 후:', content3);
    console.log(`  텍스트: "${content3.text}"`);
    console.log(`  포커스: ${content3.hasFocus}`);
    
    if (!content3.text.includes('안녕')) {
      console.error('  ❌ 한글 입력 실패!');
    } else {
      console.log('  ✅ 한글 입력 성공');
    }
    
    // 테스트 4: 연속 입력 (커서 사라짐 확인)
    console.log('\n--- 테스트 4: 연속 입력 (커서 사라짐 확인) ---');
    for (let i = 0; i < 5; i++) {
      await page.keyboard.type('A', { delay: 200 });
      await page.waitForTimeout(300);
      const hasFocus = await page.evaluate((sel) => {
        return document.querySelector(sel) === document.activeElement;
      }, editorSelector);
      const text = await page.evaluate((sel) => {
        return document.querySelector(sel)?.textContent || '';
      }, editorSelector);
      console.log(`  ${i + 1}번째 입력 후 - 포커스: ${hasFocus}, 텍스트 길이: ${text.length}`);
      if (!hasFocus) {
        console.error(`  ❌ ${i + 1}번째 입력 후 포커스 상실!`);
      }
    }
    
    // 테스트 5: Shift + 문자 (대문자 입력)
    console.log('\n--- 테스트 5: Shift + 문자 (대문자 입력) ---');
    await page.keyboard.press('Shift+A');
    await page.keyboard.press('Shift+B');
    await page.waitForTimeout(500);
    const content5 = await page.evaluate((sel) => {
      const el = document.querySelector(sel);
      return {
        text: el?.textContent || '',
        hasFocus: el === document.activeElement
      };
    }, editorSelector);
    console.log('Shift+A, Shift+B 입력 후:', content5);
    console.log(`  텍스트: "${content5.text}"`);
    console.log(`  포커스: ${content5.hasFocus}`);
    
    if (!content5.text.includes('AB')) {
      console.error('  ❌ 대문자 입력 실패!');
    } else {
      console.log('  ✅ 대문자 입력 성공');
    }
    
    // 테스트 6: Enter 입력
    console.log('\n--- 테스트 6: Enter 입력 ---');
    await page.keyboard.press('Enter');
    await page.waitForTimeout(500);
    const content6 = await page.evaluate((sel) => {
      const el = document.querySelector(sel);
      return {
        text: el?.textContent || '',
        html: el?.innerHTML || '',
        hasFocus: el === document.activeElement
      };
    }, editorSelector);
    console.log('Enter 입력 후:', content6);
    console.log(`  HTML: ${content6.html.substring(0, 100)}...`);
    console.log(`  포커스: ${content6.hasFocus}`);
    
    if (!content6.html.includes('<p>') || content6.html.split('<p>').length < 2) {
      console.error('  ❌ Enter 입력 실패 (새 단락 생성 안됨)!');
    } else {
      console.log('  ✅ Enter 입력 성공 (새 단락 생성)');
    }
    
    console.log('\n✅ 모든 테스트 완료');
    
  } catch (error) {
    console.error('❌ 테스트 실패:', error);
    console.error(error.stack);
  } finally {
    console.log('\n브라우저를 5초 후 종료합니다...');
    await page.waitForTimeout(5000);
    await browser.close();
  }
})();

