// 갤러리 업스케일 이미지 저장 확인 테스트
import { chromium } from 'playwright';

(async () => {
  console.log('🔍 갤러리 업스케일 이미지 저장 확인 테스트 시작...\n');

  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  // 콘솔 로그 캡처
  const consoleLogs = [];
  page.on('console', msg => {
    const text = msg.text();
    consoleLogs.push(text);
    if (text.includes('업스케일') || text.includes('저장') || text.includes('Supabase')) {
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
        if (body.imageUrl) {
          console.log(`   ✅ 저장된 이미지 URL: ${body.imageUrl}`);
        }
        if (body.fileName) {
          console.log(`   ✅ 파일명: ${body.fileName}`);
        }
        if (body.originalUrl) {
          console.log(`   원본 URL: ${body.originalUrl}`);
        }
        if (body.error) {
          console.log(`   ❌ Error: ${body.error}`);
        }
      } catch (e) {
        const text = await response.text();
        console.log(`\n📥 업스케일 응답 (텍스트):`);
        console.log(`   Status: ${response.status()}`);
        console.log(`   Body: ${text.substring(0, 200)}...`);
      }
    }
    
    // Supabase 저장 관련 API 확인
    if (response.url().includes('/api/admin/upsert-image-metadata')) {
      try {
        const body = await response.json();
        console.log(`\n💾 메타데이터 저장 응답:`);
        console.log(`   Status: ${response.status()}`);
        console.log(`   Body:`, JSON.stringify(body, null, 2));
      } catch (e) {
        console.log(`\n💾 메타데이터 저장 응답 (텍스트):`);
        console.log(`   Status: ${response.status()}`);
      }
    }
  });

  // 페이지 에러 캡처
  page.on('pageerror', error => {
    console.error(`\n❌ 페이지 에러: ${error.message}`);
  });

  // 다이얼로그 처리 (confirm, alert 등)
  let upscaleSuccessMessage = null;
  page.on('dialog', async dialog => {
    const message = dialog.message();
    console.log(`\n📢 다이얼로그: ${dialog.type()} - ${message}`);
    
    if (dialog.type() === 'confirm') {
      await dialog.accept();
      console.log('   ✅ Confirm 다이얼로그 자동 확인');
    } else if (dialog.type() === 'alert') {
      upscaleSuccessMessage = message;
      console.log(`   📢 Alert 메시지: ${message}`);
      
      // 업스케일 성공 메시지에서 파일명 추출
      const fileNameMatch = message.match(/upscaled-[\d]+\.png/);
      if (fileNameMatch) {
        console.log(`   ✅ 추출된 파일명: ${fileNameMatch[0]}`);
      }
      
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

    const imageCard = await page.locator('div.relative.group.border-2.rounded-lg').first();
    if (await imageCard.isVisible({ timeout: 10000 })) {
      console.log('   ✅ 이미지 카드 발견');
      
      // 이미지 카드에 호버
      await imageCard.hover();
      await page.waitForTimeout(1000);
      
      // 확대 버튼 찾기
      const zoomButton = await imageCard.locator('button').filter({ hasText: /🔍|확대/ }).first();
      if (await zoomButton.isVisible({ timeout: 3000 })) {
        console.log('   ✅ 확대 버튼 발견');
        await zoomButton.click();
        await page.waitForTimeout(2000);
        console.log('   ✅ 확대 모달 열림\n');
      } else {
        const buttons = await imageCard.locator('button').all();
        if (buttons.length > 0) {
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
      
      const isDisabled = await upscaleButton.isDisabled();
      if (isDisabled) {
        console.log('   ⚠️ 업스케일 버튼이 비활성화되어 있습니다.');
      } else {
        console.log('   ✅ 업스케일 버튼 활성화됨');
      }
      
      // 업스케일 전 이미지 목록 확인
      console.log('\n   📋 업스케일 전 이미지 목록 확인...');
      const imagesBefore = await page.locator('div.relative.group.border-2.rounded-lg').all();
      console.log(`   발견된 이미지 수: ${imagesBefore.length}`);
      
      // 업스케일 버튼 클릭
      await upscaleButton.click();
      console.log('   ✅ 업스케일 버튼 클릭 완료\n');
      
      // 5. 업스케일 완료 대기 (최대 3분)
      console.log('5️⃣ 업스케일 완료 대기...');
      console.log('   ⏳ 최대 3분 대기 중...');
      
      let upscaleCompleted = false;
      const maxWaitTime = 180000; // 3분
      const startTime = Date.now();
      
      // 네트워크 응답 확인
      while (!upscaleCompleted && (Date.now() - startTime) < maxWaitTime) {
        await page.waitForTimeout(5000); // 5초마다 확인
        
        // 네트워크 응답 확인
        if (networkResponses.length > 0) {
          const lastResponse = networkResponses[networkResponses.length - 1];
          if (lastResponse.body && lastResponse.body.success) {
            console.log('   ✅ 업스케일 응답 수신!');
            upscaleCompleted = true;
            break;
          }
        }
        
        // 성공 메시지 확인
        if (upscaleSuccessMessage) {
          console.log('   ✅ 성공 메시지 수신!');
          upscaleCompleted = true;
          break;
        }
        
        // 진행 상태 확인
        const upscalingButton = await page.locator('button:has-text("업스케일링 중"), button:has-text("업스케일링 중...")').first();
        if (await upscalingButton.isVisible({ timeout: 1000 }).catch(() => false)) {
          console.log('   ⏳ 업스케일링 진행 중...');
        } else {
          // 버튼이 사라졌으면 완료된 것일 수 있음
          console.log('   ✅ 업스케일 버튼 상태 변경 (완료 가능성)');
        }
      }
      
      if (!upscaleCompleted) {
        console.log('   ⚠️ 업스케일 완료 대기 시간 초과 (3분)');
      }
      
      // 성공 메시지 확인
      if (upscaleSuccessMessage) {
        console.log(`   ✅ 성공 메시지: ${upscaleSuccessMessage}`);
        
        // 파일명 추출
        const fileNameMatch = upscaleSuccessMessage.match(/upscaled-[\d]+\.png/);
        if (fileNameMatch) {
          const upscaledFileName = fileNameMatch[0];
          console.log(`   ✅ 업스케일된 파일명: ${upscaledFileName}`);
          
          // 6. 갤러리에서 새 이미지 찾기
          console.log('\n6️⃣ 갤러리에서 새 이미지 찾기...');
          await page.waitForTimeout(3000);
          
          // 이미지 목록 새로고침 (필요시)
          await page.reload();
          await page.waitForTimeout(3000);
          
          // 업스케일된 이미지 찾기
          const allImages = await page.locator('div.relative.group.border-2.rounded-lg').all();
          console.log(`   현재 이미지 수: ${allImages.length}`);
          
          let foundUpscaledImage = false;
          for (let i = 0; i < allImages.length; i++) {
            const imageCard = allImages[i];
            const imageText = await imageCard.textContent();
            if (imageText && imageText.includes(upscaledFileName)) {
              console.log(`   ✅ 업스케일된 이미지 발견! (인덱스: ${i})`);
              foundUpscaledImage = true;
              
              // 이미지 정보 확인
              const imageInfo = await imageCard.locator('div.text-xs').first().textContent();
              console.log(`   이미지 정보: ${imageInfo}`);
              break;
            }
          }
          
          if (!foundUpscaledImage) {
            console.log(`   ⚠️ 업스케일된 이미지를 갤러리에서 찾을 수 없습니다.`);
            console.log(`   파일명으로 검색 시도: ${upscaledFileName}`);
            
            // 검색 기능 사용
            const searchInput = await page.locator('input[type="text"][placeholder*="파일명"], input[type="text"][placeholder*="검색"]').first();
            if (await searchInput.isVisible({ timeout: 3000 })) {
              await searchInput.fill(upscaledFileName);
              await page.waitForTimeout(2000);
              
              const searchResults = await page.locator('div.relative.group.border-2.rounded-lg').all();
              console.log(`   검색 결과 이미지 수: ${searchResults.length}`);
              
              if (searchResults.length > 0) {
                console.log(`   ✅ 검색으로 업스케일된 이미지 발견!`);
                foundUpscaledImage = true;
              }
            }
          }
          
          if (!foundUpscaledImage) {
            console.log(`   ⚠️ 업스케일된 이미지를 찾을 수 없습니다.`);
            console.log(`   네트워크 응답에서 저장 경로 확인 필요`);
          }
        }
      }
      
      // 7. 네트워크 응답 분석
      console.log('\n7️⃣ 네트워크 응답 분석...');
      
      if (networkResponses.length > 0) {
        console.log(`   📥 응답 ${networkResponses.length}개:`);
        networkResponses.forEach((res, i) => {
          console.log(`   응답 ${i + 1} (Status: ${res.status}):`);
          if (res.body) {
            console.log(`      Success: ${res.body.success || false}`);
            if (res.body.imageUrl) {
              console.log(`      ✅ 저장된 이미지 URL: ${res.body.imageUrl}`);
              
              // URL에서 경로 추출
              const urlMatch = res.body.imageUrl.match(/blog-images\/(.+)/);
              if (urlMatch) {
                console.log(`      ✅ 저장 경로: ${urlMatch[1]}`);
                console.log(`      ✅ 저장 폴더: originals/${urlMatch[1].split('/')[0]}/`);
                console.log(`      ✅ 파일명: ${urlMatch[1].split('/').pop()}`);
              }
            }
            if (res.body.fileName) {
              console.log(`      ✅ 파일명: ${res.body.fileName}`);
            }
            if (res.body.originalUrl) {
              console.log(`      원본 URL: ${res.body.originalUrl}`);
            }
            if (res.body.warning) {
              console.log(`      ⚠️ 경고: ${res.body.warning}`);
            }
            if (res.body.error) {
              console.log(`      ❌ 에러: ${res.body.error}`);
            }
            if (res.body.details) {
              console.log(`      상세: ${res.body.details}`);
            }
          }
        });
      } else {
        console.log(`   ⚠️ 업스케일 응답을 찾을 수 없습니다.`);
        console.log(`   ⚠️ 업스케일링이 아직 진행 중이거나 실패했을 수 있습니다.`);
      }
      
      // 8. Supabase 저장 확인
      console.log('\n8️⃣ Supabase 저장 확인...');
      const metadataResponses = [];
      page.on('response', async response => {
        if (response.url().includes('/api/admin/upsert-image-metadata')) {
          try {
            const body = await response.json();
            metadataResponses.push({
              url: response.url(),
              status: response.status(),
              body: body
            });
            console.log(`   💾 메타데이터 저장 응답:`);
            console.log(`      Status: ${response.status()}`);
            console.log(`      Body:`, JSON.stringify(body, null, 2));
          } catch (e) {
            console.log(`   💾 메타데이터 저장 응답 (텍스트):`);
            console.log(`      Status: ${response.status()}`);
          }
        }
      });
      
      if (metadataResponses.length > 0) {
        console.log(`   ✅ 메타데이터 저장 확인됨 (${metadataResponses.length}개)`);
      } else {
        console.log(`   ⚠️ 메타데이터 저장 응답을 찾을 수 없습니다.`);
      }
      
      // 최종 스크린샷
      await page.waitForTimeout(2000);
      await page.screenshot({ path: 'test-gallery-upscale-save-check-result.png', fullPage: true });
      console.log('\n   📸 스크린샷 저장: test-gallery-upscale-save-check-result.png');
      
      console.log('\n✅ 테스트 완료!');
      
    } else {
      console.log('   ⚠️ 업스케일 버튼을 찾을 수 없습니다.');
      await page.screenshot({ path: 'test-gallery-upscale-button-not-found.png', fullPage: true });
      throw new Error('업스케일 버튼을 찾을 수 없습니다.');
    }

  } catch (error) {
    console.error(`❌ 테스트 실패: ${error.message}`);
    console.error(error.stack);
    await page.screenshot({ path: 'test-gallery-upscale-save-check-failure.png', fullPage: true });
    throw error;
  } finally {
    await page.close();
    await browser.close();
  }
})();

