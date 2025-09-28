const { chromium } = require('playwright');

async function testContentDisplay() {
  console.log('🚀 콘텐츠 표시 테스트 시작...');
  
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 1000 
  });
  
  const context = await browser.newContext();
  const page = await context.newPage();
  
  // 콘솔 로그 캡처
  page.on('console', msg => {
    console.log(`🔍 브라우저 콘솔: ${msg.text()}`);
  });
  
  try {
    // 1. 로컬 관리자 페이지로 이동
    console.log('📝 로컬 관리자 페이지로 이동...');
    await page.goto('http://localhost:3000/admin/blog', { waitUntil: 'networkidle' });
    await page.waitForTimeout(3000);
    
    // 2. 새 게시물 작성 탭 클릭
    console.log('✍️ 새 게시물 작성 탭 클릭...');
    const createTab = page.locator('button').filter({ hasText: '새 게시물 작성' }).first();
    await createTab.click();
    await page.waitForTimeout(2000);
    
    // 3. 제목 입력
    console.log('📝 제목 입력...');
    const titleField = page.locator('input[placeholder*="제목"]').first();
    await titleField.fill('테스트 포스트');
    
    // 4. 콘텐츠 입력
    console.log('📄 콘텐츠 입력...');
    const contentField = page.locator('textarea').first();
    await contentField.fill('안녕하세요, 고반발 드라이버의 프리미엄 브랜드 MASSGOO(마쓰구)입니다. 무더운 여름, 기다리던 휴가철이 다가왔습니다. 이번 여름, 골프와 함께하는 특별한 순간을 만들어보세요. MASSGOO 드라이버는 최고의 퍼포먼스를 제공합니다.');
    
    // 5. 콘텐츠 확인
    console.log('🔍 콘텐츠 확인...');
    const contentValue = await contentField.inputValue();
    console.log(`📄 입력된 콘텐츠 길이: ${contentValue.length}자`);
    console.log(`📄 콘텐츠 미리보기: "${contentValue.substring(0, 100)}..."`);
    
    if (contentValue.length > 0) {
      console.log('✅ 콘텐츠가 정상적으로 입력되었습니다!');
    } else {
      console.log('❌ 콘텐츠가 입력되지 않았습니다.');
    }
    
    // 6. WYSIWYG 모드 확인
    console.log('🎨 WYSIWYG 모드 확인...');
    const wysiwygTab = page.locator('button').filter({ hasText: 'WYSIWYG' }).first();
    if (await wysiwygTab.isVisible()) {
      await wysiwygTab.click();
      await page.waitForTimeout(1000);
      
      // WYSIWYG 에디터에서 콘텐츠 확인
      const quillEditor = page.locator('.ql-editor').first();
      if (await quillEditor.isVisible()) {
        const quillContent = await quillEditor.textContent();
        console.log(`📄 WYSIWYG 콘텐츠 길이: ${quillContent.length}자`);
        console.log(`📄 WYSIWYG 콘텐츠 미리보기: "${quillContent.substring(0, 100)}..."`);
        
        if (quillContent.length > 0) {
          console.log('✅ WYSIWYG 에디터에서 콘텐츠가 정상적으로 표시됩니다!');
        } else {
          console.log('❌ WYSIWYG 에디터에서 콘텐츠가 표시되지 않습니다.');
        }
      }
    }
    
    console.log('✅ 콘텐츠 표시 테스트 완료!');
    
  } catch (error) {
    console.error('❌ 테스트 중 오류 발생:', error);
  } finally {
    await browser.close();
  }
}

testContentDisplay().catch(console.error);
