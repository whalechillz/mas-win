#!/usr/bin/env node

/**
 * Phase 8: 퍼널 이미지 마이그레이션 실행 (Playwright)
 * 
 * 갤러리 페이지에서 "퍼널 이미지 마이그레이션" 버튼을 클릭하고
 * 마이그레이션 진행 상황을 모니터링합니다.
 */

const { chromium } = require('playwright');

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
const ADMIN_LOGIN = process.env.ADMIN_LOGIN || '01066699000'; // 전화번호 또는 아이디
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '66699000';

async function runMigration() {
  console.log('🚀 Phase 8: 퍼널 이미지 마이그레이션 실행 시작\n');
  console.log('='.repeat(60));

  const browser = await chromium.launch({
    headless: false, // 브라우저 창 표시
    slowMo: 500, // 동작을 천천히 (디버깅용)
  });

  try {
    const context = await browser.newContext();
    const page = await context.newPage();

    // 1. 로그인 페이지로 이동
    console.log('\n🔐 1단계: 로그인');
    const loginUrl = `${BASE_URL}/admin/login`;
    console.log(`URL: ${loginUrl}`);
    
    await page.goto(loginUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForTimeout(2000);
    
    // 입력 필드가 나타날 때까지 대기
    await page.waitForSelector('input#login', { timeout: 10000 });
    await page.waitForSelector('input#password', { timeout: 10000 });
    
    // 로그인 정보 입력
    await page.fill('input#login', ADMIN_LOGIN);
    console.log(`✅ 로그인 정보 입력: ${ADMIN_LOGIN}`);
    await page.waitForTimeout(500);
    
    await page.fill('input#password', ADMIN_PASSWORD);
    console.log('✅ 비밀번호 입력 완료');
    await page.waitForTimeout(500);
    
    // 로그인 버튼 클릭
    await page.click('button[type="submit"]');
    console.log('✅ 로그인 버튼 클릭');
    
    // 로그인 완료 대기
    await page.waitForTimeout(3000);
    
    // 로그인 성공 확인
    const currentUrl = page.url();
    if (currentUrl.includes('/admin') && !currentUrl.includes('/login')) {
      console.log('✅ 로그인 완료');
    } else {
      console.log('⚠️ 로그인 상태 확인 필요');
    }

    // 2. 갤러리 페이지로 이동
    console.log('\n📄 2단계: 갤러리 페이지로 이동');
    const galleryUrl = `${BASE_URL}/admin/gallery`;
    console.log(`URL: ${galleryUrl}`);
    
    await page.goto(galleryUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForTimeout(5000); // 초기 로드 대기
    console.log('✅ 갤러리 페이지 로드 완료');
    
    // 로그인 페이지로 리다이렉트되었는지 확인
    if (page.url().includes('/admin/login')) {
      console.log('❌ 로그인 페이지로 리다이렉트됨. 로그인이 실패했을 수 있습니다.');
      throw new Error('로그인 실패');
    }
    
    // 3. 마이그레이션 버튼 찾기
    console.log('\n🔍 3단계: 마이그레이션 버튼 찾기');
    
    // 여러 선택자로 버튼 찾기
    const buttonSelectors = [
      'button:has-text("퍼널 이미지 마이그레이션")',
      'button:has-text("마이그레이션")',
      'button[title*="퍼널"]',
      'button[title*="마이그레이션"]',
    ];
    
    let migrationButton = null;
    for (const selector of buttonSelectors) {
      try {
        const button = page.locator(selector).first();
        if (await button.count() > 0) {
          migrationButton = button;
          console.log(`✅ 마이그레이션 버튼 찾음: ${selector}`);
          break;
        }
      } catch (e) {
        // 선택자 오류 무시
      }
    }
    
    if (!migrationButton) {
      // 스크린샷 저장
      await page.screenshot({ path: 'docs/phase8-button-not-found.png', fullPage: true });
      console.log('❌ 마이그레이션 버튼을 찾을 수 없습니다.');
      console.log('스크린샷 저장: docs/phase8-button-not-found.png');
      
      // 페이지의 모든 버튼 텍스트 출력 (디버깅용)
      try {
        const allButtons = await page.locator('button').all();
        console.log('\n페이지의 모든 버튼:');
        for (let i = 0; i < Math.min(allButtons.length, 20); i++) {
          const text = await allButtons[i].textContent();
          console.log(`  ${i + 1}. ${text}`);
        }
      } catch (e) {
        console.log('버튼 목록 가져오기 실패:', e.message);
      }
      
      throw new Error('마이그레이션 버튼을 찾을 수 없습니다.');
    }
    
    // 버튼 스크롤 및 클릭
    await migrationButton.scrollIntoViewIfNeeded();
    await page.waitForTimeout(1000);
    
    // 버튼 클릭
    console.log('\n🖱️ 4단계: 마이그레이션 버튼 클릭');
    
    // 다이얼로그 리스너 설정 (버튼 클릭 전에)
    let dialogHandled = false;
    page.on('dialog', async (dialog) => {
      if (dialogHandled) return;
      dialogHandled = true;
      
      const message = dialog.message();
      console.log(`\n💬 확인 다이얼로그: ${message}`);
      if (dialog.type() === 'confirm') {
        await dialog.accept();
        console.log('✅ 확인 다이얼로그 수락');
      } else {
        await dialog.dismiss();
        console.log('❌ 다이얼로그 취소');
      }
    });
    
    await migrationButton.click();
    console.log('✅ 마이그레이션 버튼 클릭 완료');
    
    // 확인 다이얼로그가 나타날 때까지 대기
    await page.waitForTimeout(2000);

    // 5. 진행 상황 모니터링
    console.log('\n📊 6단계: 진행 상황 모니터링');
    
    let lastProgress = '';
    let progressCheckCount = 0;
    const maxProgressChecks = 300; // 최대 5분 (1초마다 체크)
    
    while (progressCheckCount < maxProgressChecks) {
      try {
        // 진행 상황 표시 영역 확인
        const progressSelectors = [
          'text=/마이그레이션|폴더 구조|이미지 마이그레이션|HTML 업데이트|블로그 업데이트|완료/',
          '[class*="progress"]',
          '[class*="migration"]',
        ];
        
        for (const selector of progressSelectors) {
          try {
            const progressElement = page.locator(selector).first();
            if (await progressElement.count() > 0) {
              const currentProgress = await progressElement.textContent();
              if (currentProgress && currentProgress !== lastProgress) {
                console.log(`📊 진행 상황: ${currentProgress.trim()}`);
                lastProgress = currentProgress;
              }
            }
          } catch (e) {
            // 선택자 오류 무시
          }
        }
        
        // 완료 메시지 확인 (alert 또는 페이지 텍스트)
        const completeSelectors = [
          'text=/마이그레이션 완료|완료!/i',
          'text=/✅/',
        ];
        
        for (const selector of completeSelectors) {
          try {
            const completeMessage = page.locator(selector).first();
            if (await completeMessage.count() > 0) {
              const message = await completeMessage.textContent();
              console.log(`\n✅ ${message}`);
              break;
            }
          } catch (e) {
            // 선택자 오류 무시
          }
        }
        
        // 버튼 상태 확인
        const button = page.locator('button:has-text("마이그레이션"), button:has-text("퍼널")').first();
        if (await button.count() > 0) {
          const isDisabled = await button.isDisabled();
          const buttonText = await button.textContent();
          
          // 버튼이 활성화되어 있고 "마이그레이션 중..."이 아니면 완료된 것으로 간주
          if (!isDisabled && buttonText && !buttonText.includes('마이그레이션 중')) {
            console.log('\n✅ 마이그레이션 완료 (버튼 상태 확인)');
            break;
          }
        }
        
        await page.waitForTimeout(2000); // 2초마다 체크
        progressCheckCount++;
        
        // 진행률 표시 (20초마다)
        if (progressCheckCount % 10 === 0) {
          console.log(`⏳ 진행 중... (${progressCheckCount * 2}초 경과)`);
        }
      } catch (e) {
        // 오류 발생 시 계속 진행
        await page.waitForTimeout(2000);
        progressCheckCount++;
      }
    }

    // 7. 결과 확인
    console.log('\n📋 8단계: 결과 확인');
    
    // 알림 메시지 확인
    await page.waitForTimeout(3000);
    
    // 콘솔 로그 확인
    const consoleMessages = [];
    page.on('console', (msg) => {
      if (msg.type() === 'log' || msg.type() === 'info') {
        const text = msg.text();
        if (text.includes('마이그레이션') || text.includes('완료') || text.includes('오류')) {
          consoleMessages.push(text);
        }
      }
    });

    // 스크린샷 저장
    const screenshotPath = `docs/phase8-migration-result-${Date.now()}.png`;
    await page.screenshot({ path: screenshotPath, fullPage: true });
    console.log(`✅ 스크린샷 저장: ${screenshotPath}`);

    // 결과 요약
    console.log('\n' + '='.repeat(60));
    console.log('📊 마이그레이션 실행 완료\n');
    console.log('결과 확인:');
    console.log(`- 스크린샷: ${screenshotPath}`);
    console.log(`- 진행 시간: ${progressCheckCount}초`);
    
    if (consoleMessages.length > 0) {
      console.log('\n콘솔 메시지:');
      consoleMessages.forEach((msg, index) => {
        console.log(`  ${index + 1}. ${msg}`);
      });
    }

    // 브라우저를 열어둠 (수동 확인용)
    console.log('\n💡 브라우저를 열어둡니다. 수동으로 확인하세요.');
    console.log('브라우저를 닫으려면 Ctrl+C를 누르세요.');
    
    // 10초 대기 후 자동 종료
    await page.waitForTimeout(10000);
    await browser.close();
    console.log('\n✅ 브라우저 종료 완료');

  } catch (error) {
    console.error('\n❌ 오류 발생:', error);
    
    // 오류 발생 시 스크린샷 저장
    try {
      if (typeof page !== 'undefined') {
        const screenshotPath = `docs/phase8-migration-error-${Date.now()}.png`;
        await page.screenshot({ path: screenshotPath, fullPage: true });
        console.log(`✅ 오류 스크린샷 저장: ${screenshotPath}`);
      }
    } catch (screenshotError) {
      console.error('스크린샷 저장 실패:', screenshotError);
    }
    
    if (typeof browser !== 'undefined') {
      await browser.close();
    }
    process.exit(1);
  }
}

// 메인 실행
if (require.main === module) {
  runMigration().catch((error) => {
    console.error('❌ 실행 오류:', error);
    process.exit(1);
  });
}

module.exports = { runMigration };








