/**
 * 제품 추가 기능 Playwright 테스트
 * 카테고리 체크 제약 조건 오류 확인 및 수정
 */

const { chromium } = require('playwright');

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const ADMIN_LOGIN = process.env.ADMIN_LOGIN || process.env.ADMIN_EMAIL || '010-6669-9000';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '66699000';

async function testProductAdd() {
  console.log('🚀 제품 추가 기능 테스트 시작\n');
  
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 500
  });
  
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  
  const page = await context.newPage();
  
  // 콘솔 로그 캡처
  page.on('console', msg => {
    const text = msg.text();
    if (text.includes('카테고리 매핑') || text.includes('최종 카테고리') || text.includes('합성 데이터') || text.includes('ERROR')) {
      console.log(`   📝 콘솔: ${text}`);
    }
    if (msg.type() === 'error') {
      console.log(`   ❌ 콘솔 오류: ${text}`);
    }
  });
  
  // 네트워크 요청/응답 캡처
  page.on('response', async response => {
    const url = response.url();
    if (url.includes('/api/admin/products') && response.request().method() === 'POST') {
      const status = response.status();
      const responseText = await response.text().catch(() => '');
      console.log(`   📡 POST 응답 (${status}): ${url}`);
      if (status !== 201) {
        console.log(`   ❌ 응답 내용: ${responseText.substring(0, 500)}`);
      } else {
        try {
          const json = JSON.parse(responseText);
          if (json.compositionError) {
            console.log(`   ⚠️ 합성 데이터 생성 실패: ${json.compositionError}`);
          }
        } catch (e) {
          // JSON 파싱 실패 무시
        }
      }
    }
  });

  try {
    // 1. 로그인 페이지 접속
    console.log('📄 1. 로그인 페이지 접속 중...');
    await page.goto(`${BASE_URL}/admin/login`, {
      waitUntil: 'domcontentloaded',
      timeout: 10000
    });
    
    await page.waitForTimeout(2000);
    console.log('✅ 로그인 페이지 로드 완료\n');

    // 2. 로그인
    console.log('🔐 2. 로그인 시도...');
    const loginInput = page.locator('input[type="text"], input[name="login"], input#login').first();
    const passwordInput = page.locator('input[type="password"], input[name="password"], input#password').first();
    const submitButton = page.locator('button[type="submit"]').first();
    
    const loginVisible = await loginInput.isVisible({ timeout: 5000 }).catch(() => false);
    
    if (loginVisible) {
      await loginInput.fill(ADMIN_LOGIN);
      await page.waitForTimeout(500);
      await passwordInput.fill(ADMIN_PASSWORD);
      await page.waitForTimeout(500);
      await submitButton.click();
      console.log('✅ 로그인 버튼 클릭됨');
      
      await page.waitForNavigation({ waitUntil: 'networkidle', timeout: 10000 }).catch(() => {});
      await page.waitForTimeout(2000);
    }
    
    console.log(`   현재 URL: ${page.url()}\n`);

    // 3. 제품 관리 페이지 접속
    console.log('📦 3. 제품 관리 페이지 접속 중...');
    await page.goto(`${BASE_URL}/admin/products`, {
      waitUntil: 'domcontentloaded',
      timeout: 15000
    });
    
    await page.waitForTimeout(3000);
    console.log('✅ 제품 관리 페이지 로드 완료\n');

    // 4. 제품 추가 버튼 클릭
    console.log('➕ 4. 제품 추가 버튼 클릭...');
    // 여러 방법으로 버튼 찾기
    let addButton = null;
    const buttonSelectors = [
      'button:has-text("상품 추가")',
      'button:has-text("제품 추가")',
      'button:has-text("추가")',
      '[role="button"]:has-text("상품 추가")',
      '[role="button"]:has-text("제품 추가")'
    ];
    
    for (const selector of buttonSelectors) {
      try {
        const btn = page.locator(selector).first();
        if (await btn.isVisible({ timeout: 2000 }).catch(() => false)) {
          addButton = btn;
          break;
        }
      } catch (e) {
        // 계속 시도
      }
    }
    
    if (!addButton) {
      // 페이지의 모든 버튼 확인
      const allButtons = await page.locator('button').all();
      console.log(`   페이지의 버튼 수: ${allButtons.length}`);
      for (let i = 0; i < Math.min(allButtons.length, 10); i++) {
        const text = await allButtons[i].textContent();
        console.log(`   버튼 ${i}: "${text}"`);
        if (text && (text.includes('추가') || text.includes('상품'))) {
          addButton = allButtons[i];
          break;
        }
      }
    }
    
    if (addButton) {
      await addButton.click();
      await page.waitForTimeout(1000);
      console.log('✅ 제품 추가 모달 열림\n');
    } else {
      console.log('   ⚠️ 제품 추가 버튼을 찾을 수 없음. 모달이 이미 열려있을 수 있습니다.\n');
    }

    // 5. 제품 정보 입력
    console.log('✍️ 5. 제품 정보 입력...');
    
    // 모달이 열렸는지 확인
    await page.waitForTimeout(1000);
    
    // 제품명 입력 필드 찾기 (라벨로 찾기)
    const nameLabel = page.locator('label:has-text("제품명")').first();
    if (await nameLabel.isVisible({ timeout: 2000 }).catch(() => false)) {
      const nameInput = page.locator('input[type="text"]').first();
      await nameInput.fill('캘빈클라인 모자 테스트');
      console.log('   ✅ 제품명 입력 완료');
    } else {
      // 직접 input 찾기
      const inputs = page.locator('input[type="text"]');
      const count = await inputs.count();
      if (count > 0) {
        await inputs.nth(0).fill('캘빈클라인 모자 테스트');
        console.log('   ✅ 제품명 입력 완료 (직접 찾기)');
      }
    }
    await page.waitForTimeout(500);
    
    // SKU 입력 필드 찾기
    const skuInputs = page.locator('input[placeholder*="MAS"], input[placeholder*="SKU"]');
    const skuCount = await skuInputs.count();
    if (skuCount > 0) {
      await skuInputs.nth(0).fill('CALVIN_TEST');
      console.log('   ✅ SKU 입력 완료');
    }
    await page.waitForTimeout(500);
    
    // 카테고리 입력 필드 찾기
    const categoryInputs = page.locator('input[placeholder*="cap"], input[placeholder*="카테고리"]');
    const categoryCount = await categoryInputs.count();
    if (categoryCount > 0) {
      await categoryInputs.nth(0).fill('cap');
      console.log('   ✅ 카테고리 입력 완료');
    }
    await page.waitForTimeout(500);
    
    console.log('✅ 제품 정보 입력 완료\n');

    // 6. 합성 데이터 생성 체크박스 확인
    console.log('☑️ 6. 합성 데이터 생성 체크박스 확인...');
    const compositionCheckbox = page.locator('input[type="checkbox"]').filter({ 
      has: page.locator('text=/합성 관리/') 
    }).first();
    
    const checkboxVisible = await compositionCheckbox.isVisible({ timeout: 2000 }).catch(() => false);
    if (checkboxVisible) {
      const isChecked = await compositionCheckbox.isChecked();
      console.log(`   체크박스 상태: ${isChecked ? '체크됨' : '체크 안됨'}`);
      if (!isChecked) {
        await compositionCheckbox.check();
        console.log('   ✅ 체크박스 체크됨');
      }
    } else {
      console.log('   ⚠️ 합성 데이터 생성 체크박스를 찾을 수 없음');
    }
    await page.waitForTimeout(500);

    // 7. 제품 추가 버튼 클릭 (모달 내부)
    console.log('💾 7. 제품 추가 버튼 클릭...');
    // 모달 내부의 "추가" 버튼 찾기
    const modal = page.locator('.fixed.inset-0, [role="dialog"], .modal').first();
    const submitAddButton = modal.locator('button:has-text("추가"), button[type="submit"]').filter({ 
      hasText: /추가/ 
    }).first();
    
    const buttonVisible = await submitAddButton.isVisible({ timeout: 5000 }).catch(() => false);
    if (buttonVisible) {
      await submitAddButton.click({ force: true });
      console.log('✅ 제품 추가 버튼 클릭됨\n');
    } else {
      // 다른 방법으로 찾기
      const allButtons = await page.locator('button').all();
      for (const btn of allButtons) {
        const text = await btn.textContent();
        if (text && text.trim() === '추가' && text !== '➕ 상품 추가') {
          await btn.click({ force: true });
          console.log('✅ 제품 추가 버튼 클릭됨 (대체 방법)\n');
          break;
        }
      }
    }

    // 8. 응답 대기 및 확인
    console.log('⏳ 8. 응답 대기 중...');
    await page.waitForTimeout(3000);
    
    // 알림 메시지 확인
    const alertText = await page.evaluate(() => {
      // alert나 모달에서 메시지 추출 시도
      return document.body.innerText;
    }).catch(() => '');
    
    if (alertText.includes('합성 관리 데이터 생성에 실패')) {
      console.log('   ❌ 합성 데이터 생성 실패 감지');
      console.log(`   메시지: ${alertText.substring(0, 200)}`);
    } else if (alertText.includes('제품이 생성되었습니다')) {
      console.log('   ✅ 제품 생성 성공');
    }
    
    // 페이지 스크린샷 저장
    await page.screenshot({ path: 'test-product-add-result.png', fullPage: true });
    console.log('   📸 스크린샷 저장: test-product-add-result.png\n');

    // 9. 서버 콘솔 로그 확인을 위해 잠시 대기
    console.log('⏳ 9. 서버 로그 확인을 위해 5초 대기...');
    await page.waitForTimeout(5000);

    console.log('✅ 테스트 완료\n');
    
  } catch (error) {
    console.error('❌ 테스트 중 오류 발생:', error);
    await page.screenshot({ path: 'test-product-add-error.png', fullPage: true });
    console.log('   📸 오류 스크린샷 저장: test-product-add-error.png');
  } finally {
    await browser.close();
  }
}

testProductAdd().catch(console.error);

