/**
 * Playwright 셀렉트 박스 테스트 스크립트
 */

const { chromium } = require('playwright');

const LOCAL_URL = 'http://localhost:3000';
const ADMIN_LOGIN = process.env.ADMIN_LOGIN || '010-6669-9000';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '66699000';

async function testSelectBoxes() {
  console.log('🚀 셀렉트 박스 테스트 시작...\n');
  
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 500
  });
  
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  
  const page = await context.newPage();
  
  // 콘솔 에러 캡처
  const consoleErrors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
      console.log(`🔴 콘솔 오류: ${msg.text()}`);
    }
  });
  
  try {
    // 1. 로그인
    console.log('1️⃣ 로그인 중...');
    await page.goto(`${LOCAL_URL}/api/auth/signin`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    
    const phoneInput = await page.locator('input[type="tel"], input[name="phone"], input[type="text"]').first();
    const passwordInput = await page.locator('input[type="password"]').first();
    const loginButton = await page.locator('button[type="submit"], button:has-text("로그인")').first();
    
    if (await phoneInput.isVisible({ timeout: 5000 })) {
      await phoneInput.fill(ADMIN_LOGIN);
      await passwordInput.fill(ADMIN_PASSWORD);
      await loginButton.click();
      await page.waitForTimeout(3000);
      console.log('   ✅ 로그인 완료');
    }
    
    // 2. 카카오톡 콘텐츠 페이지로 이동
    console.log('\n2️⃣ 카카오톡 콘텐츠 페이지로 이동...');
    await page.goto(`${LOCAL_URL}/admin/kakao-content`);
    await page.waitForTimeout(3000);
    
    // 3. "목록" 보기 모드로 전환
    console.log('\n3️⃣ "목록" 보기 모드로 전환...');
    const listViewButton = await page.locator('button:has-text("목록")').first();
    if (await listViewButton.isVisible({ timeout: 5000 })) {
      await listViewButton.click();
      await page.waitForTimeout(2000);
      console.log('   ✅ "목록" 보기 모드로 전환 완료');
    }
    
    // 4. 셀렉트 박스 찾기 및 테스트
    console.log('\n4️⃣ 셀렉트 박스 테스트...');
    
    // 계정 필터
    console.log('\n   📋 계정 필터 테스트:');
    const accountSelect = page.locator('#filter-account');
    if (await accountSelect.isVisible({ timeout: 5000 })) {
      console.log('   ✅ 계정 필터 발견');
      const currentValue = await accountSelect.inputValue();
      console.log(`   현재 값: ${currentValue}`);
      
      // 옵션 확인
      const accountOptions = await accountSelect.locator('option').all();
      console.log(`   옵션 수: ${accountOptions.length}`);
      for (const opt of accountOptions) {
        const value = await opt.getAttribute('value');
        const text = await opt.textContent();
        console.log(`     - ${value}: ${text}`);
      }
      
      // 값 변경 테스트
      await accountSelect.selectOption('account1');
      await page.waitForTimeout(1000);
      const newValue = await accountSelect.inputValue();
      console.log(`   변경 후 값: ${newValue}`);
      
      // 원래대로 복원
      await accountSelect.selectOption('all');
      await page.waitForTimeout(1000);
    } else {
      console.log('   ❌ 계정 필터를 찾을 수 없습니다.');
    }
    
    // 타입 필터
    console.log('\n   📋 타입 필터 테스트:');
    const typeSelect = page.locator('#filter-type');
    if (await typeSelect.isVisible({ timeout: 5000 })) {
      console.log('   ✅ 타입 필터 발견');
      const currentValue = await typeSelect.inputValue();
      console.log(`   현재 값: ${currentValue}`);
      
      // 옵션 확인
      const typeOptions = await typeSelect.locator('option').all();
      console.log(`   옵션 수: ${typeOptions.length}`);
      for (const opt of typeOptions) {
        const value = await opt.getAttribute('value');
        const text = await opt.textContent();
        console.log(`     - ${value}: ${text}`);
      }
      
      // 각 옵션 테스트
      for (const optionValue of ['all', 'profile', 'feed']) {
        console.log(`   테스트: ${optionValue} 선택...`);
        await typeSelect.selectOption(optionValue);
        await page.waitForTimeout(1500);
        const selectedValue = await typeSelect.inputValue();
        console.log(`     선택된 값: ${selectedValue}`);
        
        // 테이블 행 수 확인
        const tableRows = await page.locator('table tbody tr').count();
        console.log(`     테이블 행 수: ${tableRows}`);
      }
      
      // 원래대로 복원
      await typeSelect.selectOption('all');
      await page.waitForTimeout(1000);
    } else {
      console.log('   ❌ 타입 필터를 찾을 수 없습니다.');
    }
    
    // 상태 필터
    console.log('\n   📋 상태 필터 테스트:');
    const statusSelect = page.locator('#filter-status');
    if (await statusSelect.isVisible({ timeout: 5000 })) {
      console.log('   ✅ 상태 필터 발견');
      const currentValue = await statusSelect.inputValue();
      console.log(`   현재 값: ${currentValue}`);
      
      // 옵션 확인
      const statusOptions = await statusSelect.locator('option').all();
      console.log(`   옵션 수: ${statusOptions.length}`);
      for (const opt of statusOptions) {
        const value = await opt.getAttribute('value');
        const text = await opt.textContent();
        console.log(`     - ${value}: ${text}`);
      }
      
      // 각 옵션 테스트
      for (const optionValue of ['all', 'created', 'published', 'planned']) {
        console.log(`   테스트: ${optionValue} 선택...`);
        await statusSelect.selectOption(optionValue);
        await page.waitForTimeout(1500);
        const selectedValue = await statusSelect.inputValue();
        console.log(`     선택된 값: ${selectedValue}`);
        
        // 테이블 행 수 확인
        const tableRows = await page.locator('table tbody tr').count();
        console.log(`     테이블 행 수: ${tableRows}`);
      }
      
      // 원래대로 복원
      await statusSelect.selectOption('all');
      await page.waitForTimeout(1000);
    } else {
      console.log('   ❌ 상태 필터를 찾을 수 없습니다.');
    }
    
    // 5. 콘솔 에러 확인
    console.log('\n5️⃣ 콘솔 에러 확인...');
    await page.waitForTimeout(2000);
    if (consoleErrors.length === 0) {
      console.log('   ✅ 콘솔 에러 없음');
    } else {
      console.log(`   ⚠️ 총 ${consoleErrors.length}개의 콘솔 에러 발견`);
    }
    
    // 6. 스크린샷
    console.log('\n6️⃣ 스크린샷 촬영...');
    await page.screenshot({
      path: 'playwright-select-box-test.png',
      fullPage: true
    });
    console.log('   ✅ 스크린샷 저장: playwright-select-box-test.png');
    
    console.log('\n✅ 테스트 완료');
    await page.waitForTimeout(3000);
    
  } catch (error) {
    console.error('\n❌ 테스트 중 오류 발생:', error);
    await page.screenshot({
      path: 'playwright-select-box-error.png',
      fullPage: true
    });
  } finally {
    console.log('\n💡 브라우저를 수동으로 닫아주세요.');
  }
}

testSelectBoxes().catch(console.error);





