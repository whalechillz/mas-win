// Playwright 테스트: 메타데이터 동기화 기능 테스트
const { chromium } = require('playwright');

const BASE_URL = 'https://masgolf.co.kr';
const ADMIN_GALLERY_URL = `${BASE_URL}/admin/gallery`;
const LOGIN_PHONE = '01066699000';
const LOGIN_PASSWORD = '66699000';

async function runMetadataSyncTest() {
  console.log('🎭 Playwright 메타데이터 동기화 테스트 시작...\n');
  
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  try {
    // 1. 로그인
    console.log('📝 1단계: 로그인...');
    await page.goto(`${BASE_URL}/auth/signin`);
    await page.waitForTimeout(2000);
    
    // 전화번호 입력
    const phoneInput = page.locator('input[type="tel"], input[name*="phone"], input[placeholder*="전화"]').first();
    if (await phoneInput.count() > 0) {
      await phoneInput.fill(LOGIN_PHONE);
      await page.waitForTimeout(1000);
    }
    
    // 비밀번호 입력
    const passwordInput = page.locator('input[type="password"]').first();
    if (await passwordInput.count() > 0) {
      await passwordInput.fill(LOGIN_PASSWORD);
      await page.waitForTimeout(1000);
    }
    
    // 로그인 버튼 클릭
    const loginButton = page.locator('button:has-text("로그인"), button[type="submit"]').first();
    if (await loginButton.count() > 0) {
      await loginButton.click();
      await page.waitForTimeout(3000);
    }
    
    console.log('✅ 로그인 완료\n');
    
    // 2. 갤러리 페이지 이동
    console.log('📁 2단계: 갤러리 페이지 이동...');
    await page.goto(ADMIN_GALLERY_URL);
    await page.waitForTimeout(3000);
    
    // 페이지 로딩 확인
    const galleryTitle = page.locator('text=이미지 갤러리 관리').first();
    await galleryTitle.waitFor({ timeout: 10000 });
    console.log('✅ 갤러리 페이지 로드 완료\n');
    
    // 3. 메타데이터 동기화 버튼 찾기 및 클릭
    console.log('🔄 3단계: 메타데이터 동기화 버튼 클릭...');
    const syncButton = page.locator('button:has-text("메타데이터 동기화"), button:has-text("동기화")').first();
    
    if (await syncButton.count() === 0) {
      throw new Error('메타데이터 동기화 버튼을 찾을 수 없습니다.');
    }
    
    await syncButton.click();
    console.log('✅ 메타데이터 동기화 버튼 클릭 완료');
    await page.waitForTimeout(2000);
    
    // 4. 동기화 진행 확인
    console.log('\n📊 4단계: 동기화 진행 확인...');
    
    // 진행 상태 메시지 확인
    let syncStatus = '';
    const statusSelectors = [
      'text=누락된 메타데이터 확인 중',
      'text=동기화 중',
      'text=메타데이터 동기화 중',
      '[class*="sync"], [class*="status"]'
    ];
    
    for (const selector of statusSelectors) {
      const element = page.locator(selector).first();
      if (await element.count() > 0) {
        syncStatus = await element.textContent();
        console.log(`✅ 진행 상태 확인: ${syncStatus}`);
        break;
      }
    }
    
    // 확인 다이얼로그 처리 (누락된 메타데이터 발견 시)
    await page.waitForTimeout(3000);
    
    const dialogHandled = await page.evaluate(() => {
      return new Promise((resolve) => {
        // 확인 다이얼로그를 자동으로 처리
        window.confirm = () => true;  // 확인 클릭
        resolve(true);
      });
    });
    
    // 다이얼로그 확인 버튼 클릭 시도
    try {
      page.on('dialog', async dialog => {
        console.log(`📋 다이얼로그 메시지: ${dialog.message()}`);
        if (dialog.type() === 'confirm') {
          await dialog.accept();
          console.log('✅ 확인 다이얼로그 수락');
        }
      });
    } catch (error) {
      console.log('⚠️ 다이얼로그 처리 중 오류 (무시):', error.message);
    }
    
    // 5. 동기화 완료 대기 (최대 60초)
    console.log('\n⏳ 5단계: 동기화 완료 대기 (최대 60초)...');
    const maxWaitTime = 60000;  // 60초
    const startTime = Date.now();
    
    while (Date.now() - startTime < maxWaitTime) {
      await page.waitForTimeout(2000);
      
      // 완료 메시지 확인
      const successSelectors = [
        'text=동기화 완료',
        'text=메타데이터 동기화 완료',
        'text=처리된 이미지'
      ];
      
      for (const selector of successSelectors) {
        const element = page.locator(selector).first();
        if (await element.count() > 0) {
          const message = await element.textContent();
          console.log(`✅ 동기화 완료 메시지: ${message}`);
          break;
        }
      }
      
      // 에러 메시지 확인
      const errorSelectors = [
        'text=오류가 발생했습니다',
        'text=동기화 중 오류',
        '[class*="error"]'
      ];
      
      for (const selector of errorSelectors) {
        const element = page.locator(selector).first();
        if (await element.count() > 0) {
          const errorMessage = await element.textContent();
          console.error(`❌ 에러 메시지 발견: ${errorMessage}`);
          throw new Error(`동기화 실패: ${errorMessage}`);
        }
      }
      
      // 동기화 버튼이 다시 활성화되면 완료로 간주
      const syncButtonActive = await syncButton.evaluate(btn => !btn.disabled);
      if (syncButtonActive && (Date.now() - startTime) > 5000) {
        console.log('✅ 동기화 버튼이 다시 활성화됨 (완료로 간주)');
        break;
      }
    }
    
    // 6. 결과 확인
    console.log('\n🔍 6단계: 동기화 결과 확인...');
    await page.waitForTimeout(3000);
    
    // 페이지 새로고침으로 최신 상태 확인
    await page.reload({ waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    
    // 메타데이터 없는 이미지 확인
    const noMetadataBadge = page.locator('text=메타데이터 없음').first();
    const noMetadataCount = await noMetadataBadge.count();
    
    if (noMetadataCount > 0) {
      console.log(`⚠️ 아직 메타데이터 없는 이미지: ${noMetadataCount}개 발견`);
    } else {
      console.log('✅ 메타데이터 없는 이미지 없음 (모두 동기화 완료)');
    }
    
    // 콘솔 로그 확인
    const consoleMessages = [];
    page.on('console', msg => {
      const text = msg.text();
      if (text.includes('메타데이터') || text.includes('동기화') || text.includes('Storage')) {
        consoleMessages.push(text);
      }
    });
    
    console.log('\n📋 콘솔 메시지 샘플:');
    consoleMessages.slice(0, 10).forEach(msg => console.log(`  - ${msg}`));
    
    console.log('\n✅ 메타데이터 동기화 테스트 완료!');
    
  } catch (error) {
    console.error('\n❌ 테스트 실패:', error.message);
    console.error('스택:', error.stack);
    
    // 스크린샷 저장
    await page.screenshot({ path: 'metadata-sync-error.png', fullPage: true });
    console.log('📸 에러 스크린샷 저장: metadata-sync-error.png');
    
    throw error;
  } finally {
    await browser.close();
  }
}

// 테스트 실행
runMetadataSyncTest()
  .then(() => {
    console.log('\n🎉 모든 테스트 통과!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 테스트 실패:', error);
    process.exit(1);
  });

