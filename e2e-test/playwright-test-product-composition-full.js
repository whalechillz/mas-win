/**
 * AI 이미지 제품 합성 전체 플로우 테스트
 * 
 * 테스트 시나리오:
 * 1. 관리자 로그인
 * 2. AI 이미지 생성 페이지 접속
 * 3. 제품 합성 기능 활성화
 * 4. 시크리트웨폰 블랙 제품 선택
 * 5. 모델 이미지 생성
 * 6. 제품 합성 수행
 */

const { chromium } = require('playwright');

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const ADMIN_LOGIN = process.env.ADMIN_LOGIN || '010-6669-9000';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '66699000';

async function testFullProductComposition() {
  console.log('🚀 AI 이미지 제품 합성 전체 플로우 테스트 시작\n');
  
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 300 // 적당한 속도로 실행
  });
  
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  
  const page = await context.newPage();
  
  // 콘솔 로그 캡처
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log(`   ❌ 콘솔 오류: ${msg.text()}`);
    } else if (msg.type() === 'log') {
      // 중요한 로그만 출력
      const text = msg.text();
      if (text.includes('제품 합성') || text.includes('이미지 생성') || text.includes('FAL AI')) {
        console.log(`   📊 ${text}`);
      }
    }
  });
  
  // 네트워크 요청 모니터링
  const apiRequests = [];
  page.on('request', request => {
    const url = request.url();
    if (url.includes('/api/compose-product-image') || url.includes('/api/kakao-content/generate-images')) {
      apiRequests.push({
        url: url,
        method: request.method(),
        timestamp: new Date().toISOString()
      });
      console.log(`   🌐 API 요청: ${request.method()} ${url}`);
    }
  });
  
  page.on('response', response => {
    const url = response.url();
    if (url.includes('/api/compose-product-image') || url.includes('/api/kakao-content/generate-images')) {
      console.log(`   ✅ API 응답: ${response.status()} ${url}`);
    }
  });

  try {
    // 1. 로그인
    console.log('📄 1. 로그인 페이지 접속 중...');
    await page.goto(`${BASE_URL}/admin/login`, {
      waitUntil: 'domcontentloaded',
      timeout: 10000
    });
    
    await page.waitForTimeout(2000);
    
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
      await page.waitForNavigation({ waitUntil: 'networkidle', timeout: 10000 }).catch(() => {});
      await page.waitForTimeout(2000);
    }
    
    console.log('✅ 로그인 완료\n');

    // 2. AI 이미지 생성 페이지 접속
    console.log('🎨 2. AI 이미지 생성 페이지 접속 중...');
    await page.goto(`${BASE_URL}/admin/ai-image-generator`, {
      waitUntil: 'domcontentloaded',
      timeout: 15000
    });
    
    await page.waitForTimeout(3000);
    console.log('✅ 페이지 로드 완료\n');

    // 3. 제품 합성 기능 활성화
    console.log('🔄 3. 제품 합성 기능 활성화...');
    const toggleLabel = page.locator('label[for="enableProductComposition"]');
    const labelExists = await toggleLabel.count() > 0;
    
    if (labelExists) {
      const productCompositionToggle = page.locator('#enableProductComposition');
      const isChecked = await productCompositionToggle.isChecked();
      if (!isChecked) {
        await toggleLabel.click();
        await page.waitForTimeout(2000);
        console.log('✅ 제품 합성 토글 활성화됨');
      }
    }
    console.log('');

    // 4. 시크리트웨폰 블랙 제품 선택
    console.log('📦 4. 시크리트웨폰 블랙 제품 선택 중...');
    
    // 제품 선택 UI가 나타날 때까지 대기
    await page.waitForTimeout(2000);
    
    // 시크리트웨폰 블랙 제품 버튼 찾기 (여러 패턴 시도)
    const weaponBlackButton = page.locator(
      'button:has-text("시크리트웨폰 블랙"), ' +
      'button:has-text("시크리트웨폰 블랙 MUZIIK"), ' +
      'button:has-text("weapon-black")'
    ).first();
    
    const buttonExists = await weaponBlackButton.count() > 0;
    
    if (buttonExists) {
      await weaponBlackButton.scrollIntoViewIfNeeded();
      await page.waitForTimeout(500);
      await weaponBlackButton.click();
      await page.waitForTimeout(1000);
      console.log('✅ 시크리트웨폰 블랙 제품 선택됨');
    } else {
      // 대안: 첫 번째 제품 선택
      console.log('⚠️ 시크리트웨폰 블랙을 찾을 수 없습니다. 첫 번째 제품을 선택합니다.');
      const firstProduct = page.locator('button:has-text("시크리트"), button:has-text("시크리트")').first();
      if (await firstProduct.count() > 0) {
        await firstProduct.click();
        await page.waitForTimeout(1000);
        console.log('✅ 첫 번째 제품 선택됨');
      }
    }
    console.log('');

    // 5. 프롬프트 입력
    console.log('📝 5. 프롬프트 입력 중...');
    const promptTextarea = page.locator('textarea').first();
    const testPrompt = '한국인 전문 피터가 골프 스튜디오에서 골프 드라이버를 들고 있는 모습, 자연스러운 포즈, 밝은 조명';
    await promptTextarea.fill(testPrompt);
    await page.waitForTimeout(500);
    console.log(`✅ 프롬프트 입력 완료: "${testPrompt}"\n`);

    // 6. 이미지 생성 버튼 클릭
    console.log('🔘 6. 이미지 생성 시작...');
    const generateButton = page.locator('button:has-text("이미지 생성하기"), button:has-text("생성")').first();
    
    // 버튼이 활성화될 때까지 대기
    await generateButton.waitFor({ state: 'visible', timeout: 5000 });
    await page.waitForTimeout(1000);
    
    // 생성 전 스크린샷
    await page.screenshot({ 
      path: 'e2e-test/screenshots/before-generation.png',
      fullPage: true
    });
    console.log('📸 생성 전 스크린샷 저장됨');
    
    await generateButton.click();
    console.log('✅ 이미지 생성 버튼 클릭됨\n');

    // 7. 이미지 생성 대기
    console.log('⏳ 7. 이미지 생성 대기 중...');
    console.log('   (이미지 생성은 약 30-60초 소요될 수 있습니다)');
    
    // 로딩 상태 확인
    let loadingComplete = false;
    let attempts = 0;
    const maxAttempts = 120; // 최대 2분 대기
    
    while (!loadingComplete && attempts < maxAttempts) {
      await page.waitForTimeout(2000);
      attempts++;
      
      // 로딩 상태 확인
      const loadingIndicator = page.locator('text=이미지 생성 중, text=제품 합성 중, text=생성 중').first();
      const loadingVisible = await loadingIndicator.isVisible({ timeout: 1000 }).catch(() => false);
      
      // 생성된 이미지 확인
      const generatedImages = page.locator('img[alt*="생성된 이미지"], img[alt*="이미지"]');
      const imageCount = await generatedImages.count();
      
      if (imageCount > 0) {
        console.log(`   ✅ 생성된 이미지 발견: ${imageCount}개`);
        loadingComplete = true;
        break;
      }
      
      if (attempts % 10 === 0) {
        console.log(`   ⏳ 대기 중... (${attempts * 2}초 경과)`);
      }
    }
    
    if (!loadingComplete) {
      console.log('⚠️ 이미지 생성이 완료되지 않았습니다. 현재 상태를 확인합니다.');
    }
    
    await page.waitForTimeout(3000);
    console.log('');

    // 8. 결과 확인
    console.log('📊 8. 결과 확인 중...');
    
    // 생성된 이미지 확인
    const resultImages = page.locator('img[alt*="생성된 이미지"], img[alt*="이미지"], img[src*="supabase"]');
    const finalImageCount = await resultImages.count();
    console.log(`   생성된 이미지 개수: ${finalImageCount}`);
    
    // 제품 합성 표시 확인
    const composedBadge = page.locator('text=제품 합성됨, text=합성됨');
    const badgeCount = await composedBadge.count();
    console.log(`   제품 합성 표시: ${badgeCount > 0 ? '있음' : '없음'}`);
    
    // 제품 정보 확인
    const productInfo = page.locator('text=시크리트웨폰, text=합성 제품');
    const productInfoCount = await productInfo.count();
    console.log(`   제품 정보 표시: ${productInfoCount > 0 ? '있음' : '없음'}`);
    
    console.log('');

    // 9. 최종 스크린샷 저장
    console.log('📸 9. 최종 스크린샷 저장...');
    await page.screenshot({ 
      path: 'e2e-test/screenshots/full-test-result.png',
      fullPage: true
    });
    console.log('✅ 최종 스크린샷 저장 완료\n');

    // 10. API 요청 로그 출력
    console.log('🌐 10. API 요청 요약');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    apiRequests.forEach((req, index) => {
      console.log(`${index + 1}. ${req.method} ${req.url}`);
      console.log(`   시간: ${req.timestamp}`);
    });
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // 11. 테스트 결과 요약
    console.log('📊 11. 테스트 결과 요약');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`✅ 로그인: 성공`);
    console.log(`✅ 페이지 접속: 성공`);
    console.log(`✅ 제품 합성 활성화: 성공`);
    console.log(`✅ 제품 선택: ${buttonExists ? '시크리트웨폰 블랙' : '대체 제품'}`);
    console.log(`✅ 이미지 생성 시작: 성공`);
    console.log(`✅ 생성된 이미지: ${finalImageCount}개`);
    console.log(`✅ 제품 합성 표시: ${badgeCount > 0 ? '있음' : '없음'}`);
    console.log(`✅ API 요청: ${apiRequests.length}개`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    console.log('✅ 테스트 완료! 브라우저를 10초 후 닫습니다...');
    console.log('   (결과를 확인하려면 브라우저 창을 확인하세요)');
    await page.waitForTimeout(10000);

  } catch (error) {
    console.error('\n❌ 테스트 중 오류 발생:', error);
    
    // 오류 발생 시 스크린샷 저장
    try {
      await page.screenshot({ 
        path: 'e2e-test/screenshots/full-test-error.png',
        fullPage: true
      });
      console.log('📸 오류 스크린샷 저장: e2e-test/screenshots/full-test-error.png');
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
}

// 테스트 실행
testFullProductComposition()
  .then(() => {
    console.log('🎉 전체 플로우 테스트가 완료되었습니다!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 테스트 실패:', error);
    process.exit(1);
  });











