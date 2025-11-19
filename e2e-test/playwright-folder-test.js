const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  try {
    console.log('🌐 갤러리 페이지 접속 중...');
    await page.goto('https://www.masgolf.co.kr/admin/gallery', { waitUntil: 'networkidle' });
    
    // 자동 로그인
    console.log('🔐 로그인 페이지로 리다이렉트 확인...');
    const currentUrl = page.url();
    if (currentUrl.includes('/admin/login')) {
      console.log('📝 로그인 정보 입력 중...');
      await page.fill('input[name="phone"]', '010-6669-9000');
      await page.fill('input[name="password"]', '66699000');
      await page.click('button[type="submit"]');
      await page.waitForURL('**/admin/gallery', { timeout: 10000 });
      console.log('✅ 로그인 성공');
    }
    
    await page.waitForTimeout(2000);
    
    // 폴더 드롭다운 찾기
    console.log('📁 폴더 드롭다운 찾기...');
    const folderSelect = page.locator('select').filter({ hasText: '폴더' }).or(page.locator('select').first());
    await folderSelect.waitFor({ timeout: 5000 });
    
    // 드롭다운 열기 및 옵션 확인
    console.log('📋 폴더 옵션 확인 중...');
    const options = await folderSelect.locator('option').all();
    console.log(`✅ 총 ${options.length}개의 폴더 옵션 발견`);
    
    const folderOptions = [];
    for (let i = 0; i < options.length; i++) {
      const text = await options[i].textContent();
      const value = await options[i].getAttribute('value');
      folderOptions.push({ text: text?.trim(), value });
      console.log(`  ${i + 1}. ${text?.trim()} (value: ${value})`);
    }
    
    // 하위 폴더 포함 체크박스 확인
    console.log('\n☑️ "하위 폴더 포함" 체크박스 확인...');
    const checkbox = page.locator('input[type="checkbox"]').filter({ hasText: '하위 폴더 포함' }).or(
      page.locator('input[type="checkbox"]').nth(0)
    );
    const isChecked = await checkbox.isChecked();
    console.log(`  체크박스 상태: ${isChecked ? '체크됨' : '체크 안됨'}`);
    
    // Storage에 실제로 존재하는 폴더들
    const expectedFolders = ['derived', 'duplicated', 'originals', 'scraped-images'];
    console.log('\n🔍 예상되는 폴더:', expectedFolders);
    
    // 드롭다운에 실제 폴더가 있는지 확인
    const foundFolders = folderOptions
      .filter(opt => opt.value !== 'all' && opt.value !== 'root')
      .map(opt => opt.value);
    
    console.log('\n📊 발견된 폴더:', foundFolders);
    
    const missingFolders = expectedFolders.filter(folder => !foundFolders.includes(folder));
    if (missingFolders.length > 0) {
      console.log('⚠️ 누락된 폴더:', missingFolders);
      console.log('\n❌ 문제: 폴더 드롭다운에 하위 폴더들이 표시되지 않습니다!');
    } else {
      console.log('✅ 모든 예상 폴더가 드롭다운에 표시됩니다.');
    }
    
    // 스크린샷
    await page.screenshot({ path: 'folder-dropdown.png', fullPage: true });
    console.log('\n📸 스크린샷 저장: folder-dropdown.png');
    
    await page.waitForTimeout(2000);
    
  } catch (error) {
    console.error('❌ 오류 발생:', error);
    await page.screenshot({ path: 'error-folder-test.png', fullPage: true });
  } finally {
    await browser.close();
  }
})();


