// 갤러리 업스케일 버튼 오류 확인 테스트
import { chromium } from 'playwright';

(async () => {
  console.log('🔍 갤러리 업스케일 버튼 오류 확인 테스트 시작...\n');

  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  // 콘솔 로그 캡처
  const consoleLogs = [];
  page.on('console', msg => {
    const text = msg.text();
    consoleLogs.push(text);
    if (text.includes('업스케일') || text.includes('error') || text.includes('Error') || text.includes('실패')) {
      console.log(`📝 콘솔: ${text}`);
    }
  });

  // 네트워크 요청/응답 캡처
  const networkRequests = [];
  const networkResponses = [];
  
  page.on('request', request => {
    if (request.url().includes('/api/admin/upscale-image')) {
      networkRequests.push({
        url: request.url(),
        method: request.method(),
        postData: request.postData()
      });
      console.log(`\n📤 업스케일 요청:`);
      console.log(`   URL: ${request.url()}`);
      if (request.postData()) {
        try {
          const data = JSON.parse(request.postData());
          console.log(`   imageUrl: ${data.imageUrl?.substring(0, 80)}...`);
          console.log(`   model: ${data.model}`);
          console.log(`   scale: ${data.scale}`);
        } catch (e) {
          console.log(`   postData: ${request.postData()}`);
        }
      }
    }
  });

  page.on('response', async response => {
    if (response.url().includes('/api/admin/upscale-image')) {
      try {
        const body = await response.json();
        networkResponses.push({
          url: response.url(),
          status: response.status(),
          body: body
        });
        console.log(`\n📥 업스케일 응답:`);
        console.log(`   Status: ${response.status()}`);
        console.log(`   Success: ${body.success || false}`);
        if (body.error) {
          console.log(`   ❌ Error: ${body.error}`);
        }
        if (body.details) {
          console.log(`   Details: ${body.details}`);
        }
        if (body.message) {
          console.log(`   Message: ${body.message}`);
        }
      } catch (e) {
        const text = await response.text();
        console.log(`\n📥 업스케일 응답 (텍스트):`);
        console.log(`   Status: ${response.status()}`);
        console.log(`   Body: ${text.substring(0, 200)}...`);
      }
    }
  });

  // 페이지 에러 캡처
  page.on('pageerror', error => {
    console.error(`\n❌ 페이지 에러: ${error.message}`);
    console.error(`   Stack: ${error.stack}`);
  });

  // 다이얼로그 처리 (confirm, alert 등)
  page.on('dialog', async dialog => {
    const message = dialog.message();
    console.log(`\n📢 다이얼로그: ${dialog.type()} - ${message}`);
    
    if (dialog.type() === 'confirm') {
      // confirm 다이얼로그는 자동으로 확인
      await dialog.accept();
      console.log('   ✅ Confirm 다이얼로그 자동 확인');
    } else if (dialog.type() === 'alert') {
      // alert는 확인 후 닫기
      console.log(`   📢 Alert 메시지: ${message}`);
      await dialog.accept();
    }
  });

  try {
    // 1. 로그인
    console.log('1️⃣ 로그인...');
    await page.goto('http://localhost:3000/admin/login');
    await page.waitForTimeout(2000);

    const loginForm = await page.locator('form').first();
    if (await loginForm.isVisible({ timeout: 5000 })) {
      await page.fill('input[name="email"], input[type="text"]', '010-6669-9000');
      await page.fill('input[name="password"], input[type="password"]', '66699000');
      await page.click('button[type="submit"], button:has-text("로그인")');
      await page.waitForTimeout(3000);
      console.log('   ✅ 로그인 완료\n');
    }

    // 2. 갤러리 관리 페이지 접속
    console.log('2️⃣ 갤러리 관리 페이지 접속...');
    await page.goto('http://localhost:3000/admin/gallery');
    await page.waitForTimeout(3000);
    console.log('   ✅ 페이지 로드 완료\n');

    // 3. 첫 번째 이미지 카드 찾기
    console.log('3️⃣ 첫 번째 이미지 카드 찾기...');
    await page.waitForTimeout(2000);

    // 이미지 카드 찾기 (더 정확한 선택자)
    const imageCard = await page.locator('div.relative.group.border-2.rounded-lg').first();
    if (await imageCard.isVisible({ timeout: 10000 })) {
      console.log('   ✅ 이미지 카드 발견');
      
      // 이미지 카드에 호버
      await imageCard.hover();
      await page.waitForTimeout(1000);
      
      // 확대 버튼 찾기 (호버 시 나타나는 버튼)
      const zoomButton = await imageCard.locator('button').filter({ hasText: /🔍|확대/ }).first();
      if (await zoomButton.isVisible({ timeout: 3000 })) {
        console.log('   ✅ 확대 버튼 발견');
        await zoomButton.click();
        await page.waitForTimeout(2000);
        console.log('   ✅ 확대 모달 열림\n');
      } else {
        // 다른 방법으로 찾기: 이미지 카드 내의 모든 버튼 확인
        const buttons = await imageCard.locator('button').all();
        console.log(`   발견된 버튼 수: ${buttons.length}`);
        if (buttons.length > 0) {
          // 첫 번째 버튼 클릭 (보통 확대 버튼)
          await buttons[0].click();
          await page.waitForTimeout(2000);
          console.log('   ✅ 첫 번째 버튼 클릭 (확대 모달 열림)\n');
        } else {
          throw new Error('확대 버튼을 찾을 수 없습니다.');
        }
      }
    } else {
      throw new Error('이미지 카드를 찾을 수 없습니다.');
    }

    // 4. 업스케일 버튼 찾기 및 클릭
    console.log('4️⃣ 업스케일 버튼 찾기 및 클릭...');
    await page.waitForTimeout(2000);

    const upscaleButton = await page.locator('button:has-text("업스케일"), button[title*="업스케일"]').first();
    if (await upscaleButton.isVisible({ timeout: 5000 })) {
      console.log('   ✅ 업스케일 버튼 발견');
      
      // 버튼이 비활성화되어 있는지 확인
      const isDisabled = await upscaleButton.isDisabled();
      if (isDisabled) {
        console.log('   ⚠️ 업스케일 버튼이 비활성화되어 있습니다.');
        console.log('   버튼 텍스트:', await upscaleButton.textContent());
      } else {
        console.log('   ✅ 업스케일 버튼 활성화됨');
      }
      
      // 버튼 클릭
      await upscaleButton.click();
      console.log('   ✅ 업스케일 버튼 클릭 완료\n');
      
      // 5. 에러 메시지 대기 및 확인
      console.log('5️⃣ 에러 메시지 확인...');
      await page.waitForTimeout(5000);
      
      // 에러 모달 확인
      const errorModal = await page.locator('div:has-text("업스케일링 실패"), div:has-text("오류가 발생했습니다")').first();
      if (await errorModal.isVisible({ timeout: 10000 })) {
        const errorText = await errorModal.textContent();
        console.log(`   ❌ 에러 모달 발견: ${errorText}`);
      }
      
      // alert 확인
      page.on('dialog', async dialog => {
        console.log(`   📢 Alert: ${dialog.message()}`);
        await dialog.accept();
      });
      
      await page.waitForTimeout(3000);
      
      // 6. 네트워크 요청/응답 분석
      console.log('\n6️⃣ 네트워크 요청/응답 분석...');
      
      if (networkRequests.length > 0) {
        console.log(`\n   📤 요청 ${networkRequests.length}개:`);
        networkRequests.forEach((req, i) => {
          console.log(`   요청 ${i + 1}:`);
          console.log(`      URL: ${req.url}`);
          console.log(`      Method: ${req.method}`);
          if (req.postData) {
            try {
              const data = JSON.parse(req.postData);
              console.log(`      imageUrl: ${data.imageUrl?.substring(0, 80)}...`);
              console.log(`      model: ${data.model || 'fal'}`);
              console.log(`      scale: ${data.scale || 2}`);
            } catch (e) {
              console.log(`      postData: ${req.postData}`);
            }
          }
        });
      } else {
        console.log(`   ⚠️ 업스케일 요청을 찾을 수 없습니다.`);
      }
      
      if (networkResponses.length > 0) {
        console.log(`\n   📥 응답 ${networkResponses.length}개:`);
        networkResponses.forEach((res, i) => {
          console.log(`   응답 ${i + 1} (Status: ${res.status}):`);
          if (res.body) {
            console.log(`      Success: ${res.body.success || false}`);
            if (res.body.error) {
              console.log(`      ❌ Error: ${res.body.error}`);
            }
            if (res.body.details) {
              console.log(`      Details: ${res.body.details}`);
            }
            if (res.status !== 200) {
              console.log(`      ❌ HTTP Status: ${res.status}`);
            }
          }
        });
      } else {
        console.log(`   ⚠️ 업스케일 응답을 찾을 수 없습니다.`);
      }
      
      // 7. 콘솔 로그 분석
      console.log('\n7️⃣ 콘솔 로그 분석...');
      const errorLogs = consoleLogs.filter(log => 
        log.includes('업스케일') || 
        log.includes('error') || 
        log.includes('Error') || 
        log.includes('실패') ||
        log.includes('❌')
      );
      
      if (errorLogs.length > 0) {
        console.log(`   발견된 에러 로그 ${errorLogs.length}개:`);
        errorLogs.forEach((log, i) => {
          console.log(`   ${i + 1}. ${log}`);
        });
      } else {
        console.log('   ⚠️ 에러 로그를 찾을 수 없습니다.');
      }
      
      // 최종 스크린샷
      await page.waitForTimeout(2000);
      await page.screenshot({ path: 'test-gallery-upscale-error-result.png', fullPage: true });
      console.log('\n   📸 스크린샷 저장: test-gallery-upscale-error-result.png');
      
      console.log('\n✅ 테스트 완료!');
      
    } else {
      console.log('   ⚠️ 업스케일 버튼을 찾을 수 없습니다.');
      await page.screenshot({ path: 'test-gallery-upscale-button-not-found.png', fullPage: true });
      throw new Error('업스케일 버튼을 찾을 수 없습니다.');
    }

  } catch (error) {
    console.error(`❌ 테스트 실패: ${error.message}`);
    console.error(error.stack);
    await page.screenshot({ path: 'test-gallery-upscale-error-failure.png', fullPage: true });
    throw error;
  } finally {
    await page.close();
    await browser.close();
  }
})();

