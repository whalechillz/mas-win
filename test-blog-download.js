// 블로그 다운로드 기능 테스트 스크립트
const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    console.log('🔍 블로그 다운로드 기능 테스트 시작...');

    // 1. 로그인
    console.log('1️⃣ 로그인 중...');
    await page.goto('https://win.masgolf.co.kr/admin/login');
    await page.waitForTimeout(2000);
    
    // 전화번호 입력 필드 찾기
    const loginInput = page.locator('input#login, input[name="login"], input[placeholder*="전화번호"], input[placeholder*="아이디"]').first();
    await loginInput.waitFor({ timeout: 10000 });
    await loginInput.fill('010-6669-9000');
    console.log('✅ 전화번호 입력 완료');
    await page.waitForTimeout(500);
    
    // 비밀번호 입력 필드 찾기
    const passwordInput = page.locator('input#password, input[name="password"], input[type="password"]').first();
    await passwordInput.waitFor({ timeout: 10000 });
    await passwordInput.fill('66699000');
    console.log('✅ 비밀번호 입력 완료');
    await page.waitForTimeout(500);
    
    // 로그인 버튼 클릭
    const loginButton = page.locator('button[type="submit"], form button, button:has-text("로그인")').first();
    await loginButton.waitFor({ timeout: 10000 });
    await loginButton.click();
    console.log('✅ 로그인 버튼 클릭 완료');
    await page.waitForTimeout(3000);

    // 2. 블로그 관리 페이지 이동
    console.log('2️⃣ 블로그 관리 페이지로 이동...');
    await page.goto('https://win.masgolf.co.kr/admin/blog');
    await page.waitForTimeout(5000);

    // 3. 블로그 글 목록에서 ID 확인 (중복 확인)
    console.log('3️⃣ 블로그 글 목록 ID 중복 확인...');
    
    // ID 배지 확인 (제목 옆)
    const idBadges = await page.locator('text=/ID: \\d+/').all();
    console.log(`✅ 제목 옆 ID 배지: ${idBadges.length}개 발견`);
    
    // 정보 영역의 '블로그 ID' 확인 (제거되어야 함)
    const infoAreaIds = await page.locator('text=/블로그 ID: \\d+/').all();
    if (infoAreaIds.length === 0) {
      console.log('✅ 정보 영역의 ID 제거 확인 완료 (중복 없음)');
    } else {
      console.log(`⚠️ 정보 영역에 ID가 ${infoAreaIds.length}개 발견됨 (제거 필요)`);
    }

    // 4. 다운로드 기능 테스트
    console.log('4️⃣ 다운로드 기능 테스트...');
    
    // 첫 번째 블로그 글의 다운로드 버튼 찾기
    const downloadButton = page.locator('button:has-text("다운로드")').first();
    
    if (await downloadButton.count() > 0) {
      console.log('✅ 다운로드 버튼 발견');
      
      // 다운로드 시작 (다운로드 이벤트 감지)
      const downloadPromise = page.waitForEvent('download', { timeout: 60000 });
      await downloadButton.click();
      console.log('✅ 다운로드 버튼 클릭');
      
      try {
        const download = await downloadPromise;
        console.log('✅ 다운로드 시작됨:', download.suggestedFilename());
        
        // 다운로드 완료 대기 (실제 파일 확인은 수동으로)
        await page.waitForTimeout(2000);
        console.log('✅ 다운로드 완료 대기 중...');
      } catch (error) {
        if (error.message.includes('timeout')) {
          console.log('⚠️ 다운로드 시간 초과 (60초)');
        } else {
          console.error('❌ 다운로드 오류:', error.message);
        }
      }
      
      // 다운로드 완료 알림 확인
      await page.waitForTimeout(3000);
      const alertText = await page.evaluate(() => {
        return document.querySelector('body')?.textContent || '';
      });
      if (alertText.includes('다운로드가 완료되었습니다')) {
        console.log('✅ 다운로드 완료 알림 확인');
      } else {
        console.log('⚠️ 다운로드 완료 알림 확인 실패');
      }
    } else {
      console.log('❌ 다운로드 버튼을 찾을 수 없음');
    }

    console.log('\n✅ 모든 테스트 완료!');
    await page.waitForTimeout(3000);

  } catch (error) {
    console.error('❌ 테스트 중 오류:', error);
    await page.screenshot({ path: 'test-blog-download-error.png' });
  } finally {
    await browser.close();
  }
})();

