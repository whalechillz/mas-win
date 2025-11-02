// 트리 UI 사이드바 테스트 스크립트
const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    console.log('🔍 갤러리 트리 UI 테스트 시작...');

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

    // 2. 갤러리 페이지 이동
    console.log('2️⃣ 갤러리 페이지로 이동...');
    await page.goto('https://win.masgolf.co.kr/admin/gallery');
    await page.waitForTimeout(5000);
    
    // 로그인되지 않았을 경우 리다이렉트 대기
    const currentUrl = page.url();
    if (currentUrl.includes('/login')) {
      console.log('⚠️ 로그인 실패 또는 리다이렉트됨');
    } else {
      console.log('✅ 로그인 성공, 갤러리 페이지 접근');
    }

    // 3. 트리 사이드바 확인
    console.log('3️⃣ 트리 사이드바 확인...');
    const treeSidebar = await page.locator('.w-80, [class*="FolderTree"]').first();
    if (await treeSidebar.count() > 0) {
      console.log('✅ 트리 사이드바 발견');
      
      // 폴더 구조 확인
      const folderTree = await page.locator('text=폴더 구조').first();
      if (await folderTree.count() > 0) {
        console.log('✅ 폴더 구조 제목 확인');
      }
      
      // 전체 폴더 버튼 확인
      const allFolderBtn = await page.locator('text=전체 폴더').first();
      if (await allFolderBtn.count() > 0) {
        console.log('✅ 전체 폴더 버튼 확인');
      }
      
      // 루트 폴더 버튼 확인
      const rootFolderBtn = await page.locator('text=루트 폴더').first();
      if (await rootFolderBtn.count() > 0) {
        console.log('✅ 루트 폴더 버튼 확인');
      }
      
      // 하위 폴더 포함 체크박스 확인
      const includeChildrenCheckbox = await page.locator('text=하위 폴더 포함').first();
      if (await includeChildrenCheckbox.count() > 0) {
        console.log('✅ 하위 폴더 포함 체크박스 확인');
      }
    } else {
      console.log('❌ 트리 사이드바를 찾을 수 없음');
    }

    // 4. 폴더 클릭 테스트
    console.log('4️⃣ 폴더 클릭 테스트...');
    const folderItems = await page.locator('[class*="cursor-pointer"]:has-text("📁")').all();
    if (folderItems.length > 0) {
      console.log(`✅ ${folderItems.length}개 폴더 항목 발견`);
      
      // 첫 번째 폴더 클릭 (originals 폴더가 있다면)
      const originalsFolder = await page.locator('text=originals').first();
      if (await originalsFolder.count() > 0) {
        console.log('✅ originals 폴더 발견, 클릭...');
        await originalsFolder.click();
        await page.waitForTimeout(2000);
        console.log('✅ originals 폴더 클릭 완료');
      }
    } else {
      console.log('⚠️ 폴더 항목을 찾을 수 없음');
    }

    // 5. 이미지 그리드 확인
    console.log('5️⃣ 이미지 그리드 확인...');
    const imageGrid = await page.locator('[class*="grid"]:has([class*="rounded"])').first();
    if (await imageGrid.count() > 0) {
      console.log('✅ 이미지 그리드 확인');
    }

    // 6. 레이아웃 확인 (2단 구조)
    console.log('6️⃣ 레이아웃 확인 (2단 구조)...');
    const flexLayout = await page.locator('.flex.gap-6').first();
    if (await flexLayout.count() > 0) {
      console.log('✅ 2단 레이아웃 (flex) 확인');
      
      // 트리 사이드바 너비 확인
      const sidebar = await page.locator('.w-80').first();
      if (await sidebar.count() > 0) {
        console.log('✅ 트리 사이드바 너비 (w-80) 확인');
      }
      
      // 콘텐츠 영역 확인
      const contentArea = await page.locator('.flex-1.min-w-0').first();
      if (await contentArea.count() > 0) {
        console.log('✅ 콘텐츠 영역 (flex-1) 확인');
      }
    } else {
      console.log('❌ 2단 레이아웃을 찾을 수 없음');
    }

    // 7. 폴더 select 박스가 제거되었는지 확인
    console.log('7️⃣ 폴더 select 박스 제거 확인...');
    const folderSelect = await page.locator('select:has(option[value="all"]:has-text("전체 폴더"))').first();
    if (await folderSelect.count() === 0) {
      console.log('✅ 폴더 select 박스 제거 확인 (트리 UI로 대체됨)');
    } else {
      console.log('⚠️ 폴더 select 박스가 여전히 존재함');
    }

    console.log('\n✅ 모든 테스트 완료!');
    await page.waitForTimeout(3000);

  } catch (error) {
    console.error('❌ 테스트 중 오류:', error);
    await page.screenshot({ path: 'test-gallery-tree-ui-error.png' });
  } finally {
    await browser.close();
  }
})();

