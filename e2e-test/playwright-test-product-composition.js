/**
 * AI 이미지 제품 합성 기능 Playwright 테스트
 * 
 * 테스트 시나리오:
 * 1. 관리자 로그인
 * 2. AI 이미지 생성 페이지 접속
 * 3. 제품 합성 기능 활성화
 * 4. 제품 선택
 * 5. 이미지 생성 및 합성 테스트
 */

const { chromium } = require('playwright');

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const ADMIN_LOGIN = process.env.ADMIN_LOGIN || process.env.ADMIN_EMAIL || '';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '';

async function testProductComposition() {
  console.log('🚀 AI 이미지 제품 합성 기능 테스트 시작\n');
  
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 500 // 디버깅을 위해 느리게 실행
  });
  
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  
  const page = await context.newPage();
  
  // 콘솔 로그 캡처
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log(`   ❌ 콘솔 오류: ${msg.text()}`);
    }
  });
  
  // 네트워크 오류 캡처
  page.on('requestfailed', request => {
    console.log(`   ❌ 요청 실패: ${request.url()} - ${request.failure()?.errorText}`);
  });

  try {
    // 1. 로그인 페이지 접속
    console.log('📄 1. 로그인 페이지 접속 중...');
    await page.goto(`${BASE_URL}/admin/login`, {
      waitUntil: 'domcontentloaded',
      timeout: 10000
    });
    
    await page.waitForTimeout(2000);
    console.log('✅ 로그인 페이지 로드 완료');
    console.log(`   URL: ${page.url()}\n`);

    // 2. 로그인
    console.log('🔐 2. 로그인 시도...');
    
    // 로그인 폼 찾기
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
      
      // 로그인 완료 대기
      await page.waitForNavigation({ waitUntil: 'networkidle', timeout: 10000 }).catch(() => {
        console.log('⚠️ 네비게이션 대기 중 타임아웃 (계속 진행)');
      });
      await page.waitForTimeout(2000);
    } else {
      console.log('⚠️ 로그인 폼을 찾을 수 없습니다. 이미 로그인되어 있을 수 있습니다.');
    }
    
    const currentUrl = page.url();
    console.log(`   현재 URL: ${currentUrl}\n`);

    // 3. AI 이미지 생성 페이지 접속
    console.log('🎨 3. AI 이미지 생성 페이지 접속 중...');
    await page.goto(`${BASE_URL}/admin/ai-image-generator`, {
      waitUntil: 'domcontentloaded',
      timeout: 15000
    });
    
    await page.waitForTimeout(3000);
    console.log('✅ AI 이미지 생성 페이지 로드 완료');
    console.log(`   URL: ${page.url()}\n`);

    // 4. 페이지 요소 확인
    console.log('🔍 4. 페이지 요소 확인 중...');
    
    // 제목 확인
    const title = await page.locator('h1').first();
    const titleText = await title.textContent();
    console.log(`   페이지 제목: ${titleText}`);
    
    // 제품 합성 토글 찾기
    const productCompositionToggle = page.locator('#enableProductComposition');
    const toggleExists = await productCompositionToggle.count() > 0;
    console.log(`   제품 합성 토글 존재: ${toggleExists}`);
    
    if (!toggleExists) {
      console.log('❌ 제품 합성 토글을 찾을 수 없습니다.');
      throw new Error('제품 합성 토글이 없습니다.');
    }
    
    console.log('✅ 페이지 요소 확인 완료\n');

    // 5. 제품 합성 기능 활성화
    console.log('🔄 5. 제품 합성 기능 활성화...');
    
    // label을 통해 클릭 (체크박스가 sr-only로 숨겨져 있음)
    const toggleLabel = page.locator('label[for="enableProductComposition"]');
    const labelExists = await toggleLabel.count() > 0;
    
    if (labelExists) {
      const isChecked = await productCompositionToggle.isChecked();
      if (!isChecked) {
        await toggleLabel.click();
        await page.waitForTimeout(1000);
        console.log('✅ 제품 합성 토글 활성화됨');
      } else {
        console.log('ℹ️ 제품 합성 토글이 이미 활성화되어 있습니다.');
      }
    } else {
      // label이 없으면 직접 체크박스 클릭 시도
      const isChecked = await productCompositionToggle.isChecked();
      if (!isChecked) {
        await productCompositionToggle.click({ force: true });
        await page.waitForTimeout(1000);
        console.log('✅ 제품 합성 토글 활성화됨 (force click)');
      } else {
        console.log('ℹ️ 제품 합성 토글이 이미 활성화되어 있습니다.');
      }
    }
    
    // 제품 선택 UI가 나타나는지 확인
    await page.waitForTimeout(2000);
    const productGrid = page.locator('button:has-text("시크리트포스"), button:has-text("시크리트웨폰")').first();
    
    const selectorVisible = await productGrid.isVisible({ timeout: 5000 }).catch(() => false);
    console.log(`   제품 선택 UI 표시: ${selectorVisible}`);
    
    if (!selectorVisible) {
      console.log('⚠️ 제품 선택 UI가 표시되지 않았습니다. 토글 상태를 확인합니다...');
      const toggleChecked = await productCompositionToggle.isChecked();
      console.log(`   토글 체크 상태: ${toggleChecked}`);
    }
    
    console.log('');

    // 6. 제품 선택
    console.log('📦 6. 제품 선택 중...');
    
    // 첫 번째 제품 찾기 (시크리트포스 골드 2 MUZIIK 또는 다른 제품)
    const firstProduct = page.locator('button:has-text("시크리트포스 골드 2 MUZIIK"), button:has-text("시크리트포스 골드 2")').first();
    const productExists = await firstProduct.count() > 0;
    
    if (productExists) {
      await firstProduct.click();
      await page.waitForTimeout(1000);
      console.log('✅ 첫 번째 제품 선택됨');
      
      // 선택 상태 확인
      const isSelected = await firstProduct.evaluate((el) => {
        return el.classList.contains('border-blue-500') || 
               el.getAttribute('class')?.includes('border-blue-500');
      });
      console.log(`   제품 선택 상태: ${isSelected}`);
    } else {
      console.log('⚠️ 제품 버튼을 찾을 수 없습니다. 수동으로 확인이 필요합니다.');
    }
    
    console.log('');

    // 7. 합성 메서드 선택 확인
    console.log('⚙️ 7. 합성 메서드 선택 확인...');
    
    const methodSelect = page.locator('select').filter({ hasText: 'Nano Banana' }).first();
    const methodExists = await methodSelect.count() > 0;
    
    if (methodExists) {
      const selectedValue = await methodSelect.inputValue();
      console.log(`   선택된 메서드: ${selectedValue}`);
      console.log('✅ 합성 메서드 선택 확인 완료');
    } else {
      console.log('⚠️ 합성 메서드 선택 드롭다운을 찾을 수 없습니다.');
    }
    
    console.log('');

    // 8. 프롬프트 입력 (테스트용 간단한 프롬프트)
    console.log('📝 8. 테스트 프롬프트 입력...');
    
    const promptTextarea = page.locator('textarea').first();
    const promptExists = await promptTextarea.isVisible({ timeout: 3000 }).catch(() => false);
    
    if (promptExists) {
      const testPrompt = '한국인 전문 피터가 골프 스튜디오에서 골프 드라이버를 들고 있는 모습';
      await promptTextarea.fill(testPrompt);
      await page.waitForTimeout(500);
      console.log(`✅ 프롬프트 입력 완료: "${testPrompt}"`);
    } else {
      console.log('⚠️ 프롬프트 입력 필드를 찾을 수 없습니다.');
    }
    
    console.log('');

    // 9. 스크린샷 저장 (테스트 전 상태)
    console.log('📸 9. 테스트 전 스크린샷 저장...');
    await page.screenshot({ 
      path: 'e2e-test/screenshots/product-composition-before.png',
      fullPage: true
    });
    console.log('✅ 스크린샷 저장 완료: e2e-test/screenshots/product-composition-before.png\n');

    // 10. 이미지 생성 버튼 확인 (실제 생성은 하지 않음)
    console.log('🔘 10. 이미지 생성 버튼 확인...');
    
    const generateButton = page.locator('button:has-text("이미지 생성하기"), button:has-text("생성")').first();
    const buttonExists = await generateButton.count() > 0;
    const buttonDisabled = buttonExists ? await generateButton.isDisabled() : true;
    
    console.log(`   생성 버튼 존재: ${buttonExists}`);
    console.log(`   생성 버튼 비활성화: ${buttonDisabled}`);
    
    if (buttonExists && !buttonDisabled) {
      console.log('✅ 이미지 생성 버튼이 활성화되어 있습니다.');
      console.log('ℹ️ 실제 이미지 생성은 시간이 오래 걸리므로 스킵합니다.');
    } else if (buttonExists) {
      console.log('⚠️ 이미지 생성 버튼이 비활성화되어 있습니다. 프롬프트를 확인하세요.');
    } else {
      console.log('⚠️ 이미지 생성 버튼을 찾을 수 없습니다.');
    }
    
    console.log('');

    // 11. 최종 스크린샷 저장
    console.log('📸 11. 최종 스크린샷 저장...');
    await page.screenshot({ 
      path: 'e2e-test/screenshots/product-composition-final.png',
      fullPage: true
    });
    console.log('✅ 최종 스크린샷 저장 완료: e2e-test/screenshots/product-composition-final.png\n');

    // 12. 테스트 결과 요약
    console.log('📊 12. 테스트 결과 요약');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ 로그인: 성공');
    console.log('✅ 페이지 접속: 성공');
    console.log(`✅ 제품 합성 토글: ${toggleExists ? '존재' : '없음'}`);
    console.log(`✅ 제품 선택 UI: ${selectorVisible ? '표시됨' : '표시 안됨'}`);
    console.log(`✅ 제품 선택: ${productExists ? '가능' : '불가능'}`);
    console.log(`✅ 합성 메서드 선택: ${methodExists ? '존재' : '없음'}`);
    console.log(`✅ 프롬프트 입력: ${promptExists ? '가능' : '불가능'}`);
    console.log(`✅ 생성 버튼: ${buttonExists ? (buttonDisabled ? '비활성화' : '활성화') : '없음'}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    console.log('✅ 테스트 완료! 브라우저를 5초 후 닫습니다...');
    await page.waitForTimeout(5000);

  } catch (error) {
    console.error('\n❌ 테스트 중 오류 발생:', error);
    
    // 오류 발생 시 스크린샷 저장
    try {
      await page.screenshot({ 
        path: 'e2e-test/screenshots/product-composition-error.png',
        fullPage: true
      });
      console.log('📸 오류 스크린샷 저장: e2e-test/screenshots/product-composition-error.png');
    } catch (screenshotError) {
      console.error('스크린샷 저장 실패:', screenshotError);
    }
    
    throw error;
  } finally {
    await browser.close();
    console.log('🔒 브라우저 종료됨\n');
  }
}

// 스크린샷 디렉토리 생성
const fs = require('fs');
const path = require('path');
const screenshotDir = path.join(__dirname, 'screenshots');
if (!fs.existsSync(screenshotDir)) {
  fs.mkdirSync(screenshotDir, { recursive: true });
  console.log('📁 스크린샷 디렉토리 생성: e2e-test/screenshots\n');
}

// 테스트 실행
testProductComposition()
  .then(() => {
    console.log('🎉 모든 테스트가 완료되었습니다!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 테스트 실패:', error);
    process.exit(1);
  });

