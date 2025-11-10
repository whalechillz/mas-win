// 블로그 게시물 발행일 저장 확인 테스트
import { chromium } from 'playwright';

(async () => {
  console.log('🔍 블로그 게시물 발행일 저장 확인 테스트 시작...\n');

  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  // 콘솔 로그 캡처
  const consoleLogs = [];
  page.on('console', msg => {
    const text = msg.text();
    consoleLogs.push(text);
    if (text.includes('저장 데이터') || text.includes('published_at')) {
      console.log(`📝 콘솔 로그: ${text}`);
    }
  });

  // 네트워크 요청 캡처
  const networkRequests = [];
  page.on('request', request => {
    if (request.url().includes('/api/admin/blog/') && request.method() === 'PUT') {
      networkRequests.push({
        url: request.url(),
        method: request.method(),
        postData: request.postData()
      });
    }
  });

  // 네트워크 응답 캡처
  const networkResponses = [];
  page.on('response', async response => {
    if (response.url().includes('/api/admin/blog/') && response.request().method() === 'PUT') {
      try {
        const body = await response.json();
        networkResponses.push({
          url: response.url(),
          status: response.status(),
          body: body
        });
      } catch (e) {
        // JSON 파싱 실패 시 무시
      }
    }
  });

  try {
    // 1. 로그인
    console.log('1️⃣ 로그인...');
    await page.goto('http://localhost:3000/admin/login');
    await page.waitForTimeout(2000);

    const loginForm = await page.locator('form').first();
    if (await loginForm.isVisible({ timeout: 5000 })) {
      console.log('   ✅ 로그인 폼 발견');
      await page.fill('input[name="email"], input[type="text"]', '010-6669-9000');
      await page.fill('input[name="password"], input[type="password"]', '66699000');
      await page.click('button[type="submit"], button:has-text("로그인")');
      await page.waitForTimeout(3000);
      console.log('   ✅ 로그인 완료\n');
    } else {
      throw new Error('로그인 폼을 찾을 수 없습니다.');
    }

    // 2. 블로그 관리 페이지 접속
    console.log('2️⃣ 블로그 관리 페이지 접속...');
    await page.goto('http://localhost:3000/admin/blog');
    await page.waitForTimeout(3000);
    console.log('   ✅ 블로그 관리 페이지 로드 완료\n');

    // 3. 첫 번째 게시물 수정 버튼 클릭
    console.log('3️⃣ 첫 번째 게시물 수정 버튼 클릭...');
    await page.waitForTimeout(2000);

    const editButton = await page.locator('button:has-text("수정")').first();
    if (await editButton.isVisible({ timeout: 10000 })) {
      console.log('   ✅ 수정 버튼 발견');
      await editButton.click();
      await page.waitForTimeout(2000);
      console.log('   ✅ 수정 버튼 클릭 완료\n');
    } else {
      throw new Error('수정 버튼을 찾을 수 없습니다.');
    }

    // 4. 발행일 필드 확인 및 수정
    console.log('4️⃣ 발행일 필드 확인 및 수정...');
    await page.waitForTimeout(2000);

    const publishedAtInput = await page.locator('input[type="date"]').filter({ hasText: /발행일/ }).or(
      page.locator('label:has-text("발행일")').locator('..').locator('input[type="date"]')
    ).first();

    // 발행일 입력 필드 찾기 (더 정확한 선택자)
    const publishedAtField = await page.locator('label:has-text("발행일")').locator('..').locator('input[type="date"]').first();
    
    if (await publishedAtField.isVisible({ timeout: 5000 })) {
      console.log('   ✅ 발행일 필드 발견');
      
      // 현재 값 확인
      const currentValue = await publishedAtField.inputValue();
      console.log(`   📅 현재 발행일 값: ${currentValue}`);
      
      // 새로운 날짜 설정 (2025-11-15)
      const newDate = '2025-11-15';
      await publishedAtField.fill(newDate);
      await page.waitForTimeout(1000);
      console.log(`   ✅ 발행일 변경: ${currentValue} → ${newDate}\n`);
      
      // 5. 수정 버튼 클릭 (상단 또는 하단)
      console.log('5️⃣ 수정 버튼 클릭...');
      await page.waitForTimeout(1000);
      
      // 상단 수정 버튼 찾기
      const topSubmitButton = await page.locator('button[type="submit"]:has-text("수정")').first();
      if (await topSubmitButton.isVisible({ timeout: 3000 })) {
        console.log('   ✅ 상단 수정 버튼 발견');
        await topSubmitButton.click();
      } else {
        // 하단 수정 버튼 찾기
        const bottomSubmitButton = await page.locator('button[type="submit"]:has-text("수정")').last();
        if (await bottomSubmitButton.isVisible({ timeout: 3000 })) {
          console.log('   ✅ 하단 수정 버튼 발견');
          await bottomSubmitButton.click();
        } else {
          throw new Error('수정 버튼을 찾을 수 없습니다.');
        }
      }
      
      console.log('   ✅ 수정 버튼 클릭 완료\n');
      
      // 6. 네트워크 요청 대기 및 확인
      console.log('6️⃣ 네트워크 요청 확인...');
      await page.waitForTimeout(3000);
      
      // 콘솔 로그에서 published_at 확인
      console.log('\n📋 콘솔 로그 분석:');
      const publishedAtLogs = consoleLogs.filter(log => 
        log.includes('published_at') || log.includes('저장 데이터')
      );
      
      if (publishedAtLogs.length > 0) {
        publishedAtLogs.forEach(log => {
          console.log(`   ${log}`);
        });
      } else {
        console.log('   ⚠️ published_at 관련 로그를 찾을 수 없습니다.');
      }
      
      // 네트워크 요청 확인
      console.log('\n📋 네트워크 요청 분석:');
      if (networkRequests.length > 0) {
        networkRequests.forEach((req, index) => {
          console.log(`\n   요청 ${index + 1}:`);
          console.log(`   URL: ${req.url}`);
          console.log(`   Method: ${req.method}`);
          
          if (req.postData) {
            try {
              const data = JSON.parse(req.postData);
              console.log(`   📦 요청 본문:`);
              console.log(`      published_at: ${data.published_at || '없음'}`);
              console.log(`      created_at: ${data.created_at || '없음'}`);
              console.log(`      updated_at: ${data.updated_at || '없음'}`);
              
              if (data.published_at) {
                console.log(`   ✅ published_at 값이 요청에 포함됨: ${data.published_at}`);
              } else {
                console.log(`   ❌ published_at 값이 요청에 포함되지 않음`);
              }
            } catch (e) {
              console.log(`   ⚠️ 요청 본문 파싱 실패: ${e.message}`);
            }
          } else {
            console.log(`   ⚠️ 요청 본문이 없습니다.`);
          }
        });
      } else {
        console.log('   ⚠️ PUT 요청을 찾을 수 없습니다.');
      }
      
      // 네트워크 응답 확인
      console.log('\n📋 네트워크 응답 분석:');
      if (networkResponses.length > 0) {
        networkResponses.forEach((res, index) => {
          console.log(`\n   응답 ${index + 1}:`);
          console.log(`   URL: ${res.url}`);
          console.log(`   Status: ${res.status}`);
          
          if (res.body && res.body.post) {
            console.log(`   📦 응답 본문:`);
            console.log(`      published_at: ${res.body.post.published_at || '없음'}`);
            console.log(`      created_at: ${res.body.post.created_at || '없음'}`);
            console.log(`      updated_at: ${res.body.post.updated_at || '없음'}`);
            
            if (res.body.post.published_at) {
              console.log(`   ✅ published_at 값이 응답에 포함됨: ${res.body.post.published_at}`);
            } else {
              console.log(`   ❌ published_at 값이 응답에 포함되지 않음`);
            }
          }
        });
      } else {
        console.log('   ⚠️ PUT 응답을 찾을 수 없습니다.');
      }
      
      // 7. 최종 확인
      console.log('\n7️⃣ 최종 확인...');
      await page.waitForTimeout(2000);
      
      // 페이지 새로고침 후 발행일 값 확인
      await page.reload();
      await page.waitForTimeout(3000);
      
      // 다시 수정 버튼 클릭하여 발행일 값 확인
      const editButton2 = await page.locator('button:has-text("수정")').first();
      if (await editButton2.isVisible({ timeout: 5000 })) {
        await editButton2.click();
        await page.waitForTimeout(2000);
        
        const publishedAtField2 = await page.locator('label:has-text("발행일")').locator('..').locator('input[type="date"]').first();
        if (await publishedAtField2.isVisible({ timeout: 5000 })) {
          const savedValue = await publishedAtField2.inputValue();
          console.log(`   📅 저장된 발행일 값: ${savedValue}`);
          
          if (savedValue === newDate) {
            console.log(`   ✅ 발행일이 정상적으로 저장됨: ${savedValue}`);
          } else {
            console.log(`   ❌ 발행일이 저장되지 않음: 예상 ${newDate}, 실제 ${savedValue}`);
          }
        }
      }
      
      // 최종 스크린샷
      await page.waitForTimeout(2000);
      await page.screenshot({ path: 'test-blog-published-at-result.png', fullPage: true });
      console.log('\n   📸 스크린샷 저장: test-blog-published-at-result.png');
      
      console.log('\n✅ 블로그 게시물 발행일 저장 확인 테스트 완료!');
      console.log('\n📋 테스트 결과 요약:');
      console.log(`   - 콘솔 로그 확인: ${publishedAtLogs.length > 0 ? '✅' : '❌'}`);
      console.log(`   - 네트워크 요청 확인: ${networkRequests.length > 0 ? '✅' : '❌'}`);
      console.log(`   - 네트워크 응답 확인: ${networkResponses.length > 0 ? '✅' : '❌'}`);
      
    } else {
      console.log('   ⚠️ 발행일 필드를 찾을 수 없습니다.');
      await page.screenshot({ path: 'test-blog-published-at-field-not-found.png', fullPage: true });
      throw new Error('발행일 필드를 찾을 수 없습니다.');
    }

  } catch (error) {
    console.error(`❌ 테스트 실패: ${error.message}`);
    await page.screenshot({ path: 'test-blog-published-at-failure.png', fullPage: true });
    throw error;
  } finally {
    await page.close();
    await browser.close();
  }
})();

