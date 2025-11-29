/**
 * 고객 메시지 이력 모달 Playwright 테스트
 * 01041060273 번호의 메시지 이력 확인
 */

const { chromium } = require('playwright');
require('dotenv').config({ path: '.env.local' });

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    console.log('🔍 고객 메시지 이력 모달 테스트 시작...\n');

    // 1. 로그인
    console.log('1️⃣ 로그인 중...');
    await page.goto('http://localhost:3000/admin/customers');
    await page.waitForTimeout(2000);

    // 로그인이 필요한 경우
    const loginRequired = await page.$('input[type="email"], input[name="email"]');
    if (loginRequired) {
      console.log('   로그인 필요 - 자동 로그인 시도...');
      // 로그인 로직 추가 (필요시)
    }

    // 2. 고객 검색
    console.log('\n2️⃣ 고객 검색 중...');
    const searchInput = page.locator('input[placeholder*="검색"], input[type="search"]').first();
    if (await searchInput.count() > 0) {
      await searchInput.fill('01041060273');
      await page.waitForTimeout(1000);
      console.log('   ✅ 검색어 입력 완료');
    } else {
      console.log('   ⚠️  검색 입력 필드를 찾을 수 없습니다.');
    }

    // 3. 고객 행 찾기
    console.log('\n3️⃣ 고객 행 찾기...');
    await page.waitForTimeout(2000);

    // 전화번호로 고객 찾기
    const customerRow = page.locator('tr:has-text("010-4106-0273"), tr:has-text("01041060273")').first();
    
    if (await customerRow.count() === 0) {
      console.log('   ❌ 고객을 찾을 수 없습니다.');
      console.log('   페이지 HTML 확인 중...');
      const bodyText = await page.textContent('body');
      console.log('   페이지 내용 (처음 500자):', bodyText?.substring(0, 500));
      return;
    }

    console.log('   ✅ 고객 행 찾음');

    // 4. 메시지 버튼 클릭
    console.log('\n4️⃣ 메시지 버튼 클릭...');
    
    // 여러 방법으로 메시지 버튼 찾기
    const messageButton = customerRow.locator('button:has-text("메시지"), button:has-text("📱"), a:has-text("메시지")').first();
    
    if (await messageButton.count() === 0) {
      // 액션 컬럼의 버튼들 찾기
      const actionCell = customerRow.locator('td:last-child, [class*="action"]').first();
      const buttons = actionCell.locator('button, a');
      const buttonCount = await buttons.count();
      
      console.log(`   액션 버튼 ${buttonCount}개 발견`);
      
      for (let i = 0; i < buttonCount; i++) {
        const btn = buttons.nth(i);
        const text = await btn.textContent();
        console.log(`   버튼 [${i}]: "${text}"`);
        
        if (text && (text.includes('메시지') || text.includes('📱'))) {
          await btn.click();
          console.log('   ✅ 메시지 버튼 클릭 완료');
          break;
        }
      }
    } else {
      await messageButton.click();
      console.log('   ✅ 메시지 버튼 클릭 완료');
    }

    // 5. 모달 대기 및 확인
    console.log('\n5️⃣ 모달 대기 중...');
    await page.waitForTimeout(2000);

    // 모달 찾기
    const modal = page.locator('[role="dialog"], [class*="modal"], [class*="Modal"], div:has-text("고객 메시지 이력")').first();
    
    if (await modal.count() === 0) {
      console.log('   ❌ 모달이 열리지 않았습니다.');
      console.log('   페이지 스크린샷 저장 중...');
      await page.screenshot({ path: 'customer-messages-modal-error.png', fullPage: true });
      
      // 콘솔 로그 확인
      page.on('console', msg => console.log('   브라우저 콘솔:', msg.text()));
      
      return;
    }

    console.log('   ✅ 모달 열림');

    // 6. 모달 내용 확인
    console.log('\n6️⃣ 모달 내용 확인...');
    
    const modalText = await modal.textContent();
    console.log('   모달 텍스트 (처음 500자):');
    console.log('   ' + modalText?.substring(0, 500).replace(/\n/g, '\n   '));

    // 메시지 개수 확인
    const messageCountText = await modal.locator('text=/최근 \\d+건/, text=/0건/').first().textContent().catch(() => null);
    console.log(`\n   메시지 개수: ${messageCountText || '(찾을 수 없음)'}`);

    // "아직 발송된 메시지가 없습니다" 확인
    const noMessageText = await modal.locator('text=/아직 발송된 메시지가 없습니다/, text=/No messages/').first().textContent().catch(() => null);
    if (noMessageText) {
      console.log(`   ⚠️  "${noMessageText}" 메시지 발견`);
    }

    // 7. 네트워크 요청 확인
    console.log('\n7️⃣ 네트워크 요청 확인...');
    
    const apiRequests = [];
    page.on('request', request => {
      if (request.url().includes('/api/admin/customers/') && request.url().includes('/messages')) {
        apiRequests.push({
          url: request.url(),
          method: request.method()
        });
      }
    });

    page.on('response', async response => {
      if (response.url().includes('/api/admin/customers/') && response.url().includes('/messages')) {
        const status = response.status();
        const data = await response.json().catch(() => null);
        console.log(`   API 응답: ${status}`);
        console.log(`   응답 데이터:`, JSON.stringify(data, null, 2));
      }
    });

    // 모달이 이미 열려있으면 API 요청이 이미 발생했을 수 있으므로 잠시 대기
    await page.waitForTimeout(3000);

    // 8. 스크린샷 저장
    console.log('\n8️⃣ 스크린샷 저장...');
    await page.screenshot({ path: 'customer-messages-modal.png', fullPage: true });
    console.log('   ✅ 스크린샷 저장 완료: customer-messages-modal.png');

    // 9. 모달 닫기
    console.log('\n9️⃣ 모달 닫기...');
    const closeButton = modal.locator('button:has-text("닫기"), button[aria-label*="닫기"], button:has-text("✕"), button:has-text("×")').first();
    if (await closeButton.count() > 0) {
      await closeButton.click();
      await page.waitForTimeout(1000);
      console.log('   ✅ 모달 닫기 완료');
    } else {
      await page.keyboard.press('Escape');
      await page.waitForTimeout(1000);
      console.log('   ✅ ESC 키로 모달 닫기');
    }

    console.log('\n✅ 테스트 완료');

  } catch (error) {
    console.error('❌ 테스트 오류:', error);
    await page.screenshot({ path: 'customer-messages-error.png', fullPage: true });
  } finally {
    await page.waitForTimeout(2000);
    await browser.close();
  }
})();


