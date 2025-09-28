const { chromium } = require('playwright');

async function testDebugMigration() {
  console.log('🚀 디버깅 마이그레이션 테스트 시작...');
  
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 2000 
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
    
    // 2. 네이버 블로그 스크래퍼 탭 클릭
    console.log('🔵 네이버 블로그 스크래퍼 탭 클릭...');
    const naverScraperTab = page.locator('button').filter({ hasText: '네이버 블로그 스크래퍼' }).first();
    await naverScraperTab.click();
    await page.waitForTimeout(2000);
    
    // 3. URL 직접 입력 모드 선택
    console.log('🔄 URL 직접 입력 모드 선택...');
    const urlModeRadio = page.locator('input[value="urls"]');
    await urlModeRadio.click();
    await page.waitForTimeout(1000);
    
    // 4. 개별 포스트 URL 입력
    console.log('📝 개별 포스트 URL 입력...');
    const urlTextarea = page.locator('textarea[placeholder*="네이버 블로그 포스트 URL"]');
    await urlTextarea.waitFor({ timeout: 5000 });
    await urlTextarea.fill('https://blog.naver.com/massgoogolf/223958579134');
    
    // 5. 스크래핑 시작
    console.log('🔍 스크래핑 시작...');
    const scrapeButton = page.locator('button').filter({ hasText: '스크래핑 시작' }).first();
    await scrapeButton.click();
    
    // 6. 결과 대기
    console.log('⏳ 스크래핑 결과 대기...');
    await page.waitForTimeout(10000);
    
    // 7. 결과 확인
    const resultSection = page.locator('text=스크래핑 결과').first();
    await resultSection.waitFor({ timeout: 5000 });
    console.log('✅ 스크래핑 결과 표시됨');
    
    // 8. 포스트 체크박스 클릭
    console.log('☑️ 포스트 체크박스 클릭...');
    const checkbox = page.locator('input[type="checkbox"]').first();
    await checkbox.click();
    await page.waitForTimeout(1000);
    
    // 9. 마이그레이션 버튼 클릭
    console.log('🔄 마이그레이션 버튼 클릭...');
    const migrationButton = page.locator('button').filter({ hasText: '선택된 1개 마이그레이션' });
    await migrationButton.waitFor({ timeout: 3000 });
    await migrationButton.click();
    
    // 10. 마이그레이션 진행 대기
    console.log('⏳ 마이그레이션 진행 대기...');
    await page.waitForTimeout(5000);
    
    // 11. 수정 페이지로 이동했는지 확인
    console.log('🎯 수정 페이지 이동 확인...');
    
    // alert 대화상자 처리
    page.on('dialog', async dialog => {
      console.log(`📢 알림: ${dialog.message()}`);
      await dialog.accept();
    });
    
    // 수정 페이지가 표시되었는지 확인
    await page.waitForTimeout(3000);
    
    const editForm = page.locator('text=게시물 수정').first();
    try {
      await editForm.waitFor({ timeout: 5000 });
      console.log('✅ 수정 페이지로 성공적으로 이동했습니다!');
      
      // 제목 필드 확인
      const titleField = page.locator('input[placeholder*="제목"]').first();
      const titleValue = await titleField.inputValue();
      console.log(`📝 제목: "${titleValue}"`);
      
      // 콘텐츠 필드 확인
      const contentField = page.locator('textarea').first();
      const contentValue = await contentField.inputValue();
      console.log(`📄 콘텐츠 길이: ${contentValue.length}자`);
      console.log(`📄 콘텐츠 미리보기: "${contentValue.substring(0, 200)}..."`);
      
      // 작성일 필드 확인
      const dateField = page.locator('input[type="datetime-local"]').first();
      const dateValue = await dateField.inputValue();
      console.log(`📅 작성일: "${dateValue}"`);
      
      if (contentValue.length > 0) {
        console.log('✅ 콘텐츠가 성공적으로 추출되었습니다!');
      } else {
        console.log('⚠️ 콘텐츠가 비어있습니다.');
      }
      
    } catch (error) {
      console.log('❌ 수정 페이지로 이동하지 못했습니다:', error.message);
    }
    
    console.log('✅ 디버깅 마이그레이션 테스트 완료!');
    
  } catch (error) {
    console.error('❌ 테스트 중 오류 발생:', error);
  } finally {
    await browser.close();
  }
}

testDebugMigration().catch(console.error);
