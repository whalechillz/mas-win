// 블로그 게시물 발행일 저장 상세 확인 테스트
import { chromium } from 'playwright';

(async () => {
  console.log('🔍 블로그 게시물 발행일 저장 상세 확인 테스트 시작...\n');

  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  // 콘솔 로그 캡처
  const consoleLogs = [];
  page.on('console', msg => {
    const text = msg.text();
    consoleLogs.push(text);
    if (text.includes('저장') || text.includes('published') || text.includes('포스트')) {
      console.log(`📝 콘솔: ${text}`);
    }
  });

  // 네트워크 요청/응답 상세 캡처
  const networkData = [];
  
  page.on('request', async request => {
    if (request.url().includes('/api/admin/blog/') && request.method() === 'PUT') {
      try {
        const postData = request.postData();
        if (postData) {
          const data = JSON.parse(postData);
          networkData.push({
            type: 'request',
            url: request.url(),
            method: request.method(),
            published_at: data.published_at,
            created_at: data.created_at,
            fullData: data
          });
          console.log(`\n📤 PUT 요청:`);
          console.log(`   URL: ${request.url()}`);
          console.log(`   published_at: ${data.published_at || '없음'}`);
          console.log(`   created_at: ${data.created_at || '없음'}`);
        }
      } catch (e) {
        console.log(`   ⚠️ 요청 본문 파싱 실패: ${e.message}`);
      }
    }
  });

  page.on('response', async response => {
    if (response.url().includes('/api/admin/blog/') && response.request().method() === 'PUT') {
      try {
        const body = await response.json();
        networkData.push({
          type: 'response',
          url: response.url(),
          status: response.status(),
          published_at: body.post?.published_at,
          created_at: body.post?.created_at,
          fullData: body
        });
        console.log(`\n📥 PUT 응답:`);
        console.log(`   Status: ${response.status()}`);
        console.log(`   published_at: ${body.post?.published_at || '없음'}`);
        console.log(`   created_at: ${body.post?.created_at || '없음'}`);
      } catch (e) {
        console.log(`   ⚠️ 응답 본문 파싱 실패: ${e.message}`);
      }
    }
    
    // GET 요청도 캡처 (게시물 로드 시)
    if (response.url().includes('/api/admin/blog/') && response.request().method() === 'GET') {
      try {
        const body = await response.json();
        if (body.post) {
          console.log(`\n📥 GET 응답 (게시물 로드):`);
          console.log(`   published_at: ${body.post.published_at || '없음'}`);
          console.log(`   created_at: ${body.post.created_at || '없음'}`);
        }
      } catch (e) {
        // 무시
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
      await page.fill('input[name="email"], input[type="text"]', '010-6669-9000');
      await page.fill('input[name="password"], input[type="password"]', '66699000');
      await page.click('button[type="submit"], button:has-text("로그인")');
      await page.waitForTimeout(3000);
      console.log('   ✅ 로그인 완료\n');
    }

    // 2. 블로그 관리 페이지 접속
    console.log('2️⃣ 블로그 관리 페이지 접속...');
    await page.goto('http://localhost:3000/admin/blog');
    await page.waitForTimeout(3000);
    console.log('   ✅ 페이지 로드 완료\n');

    // 3. 첫 번째 게시물 수정 버튼 클릭
    console.log('3️⃣ 첫 번째 게시물 수정 버튼 클릭...');
    await page.waitForTimeout(2000);

    const editButton = await page.locator('button:has-text("수정")').first();
    if (await editButton.isVisible({ timeout: 10000 })) {
      await editButton.click();
      await page.waitForTimeout(3000);
      console.log('   ✅ 수정 모드 진입\n');
    }

    // 4. 발행일 필드 찾기 및 현재 값 확인
    console.log('4️⃣ 발행일 필드 확인...');
    await page.waitForTimeout(2000);

    // 발행일 라벨 찾기
    const publishedAtLabel = await page.locator('label:has-text("발행일")').first();
    if (!(await publishedAtLabel.isVisible({ timeout: 5000 }))) {
      throw new Error('발행일 라벨을 찾을 수 없습니다.');
    }

    // 발행일 입력 필드 찾기 (라벨 다음 형제 요소)
    const publishedAtInput = await publishedAtLabel.locator('..').locator('input[type="date"]').first();
    
    if (!(await publishedAtInput.isVisible({ timeout: 5000 }))) {
      // 다른 방법으로 찾기
      const allDateInputs = await page.locator('input[type="date"]').all();
      console.log(`   📅 발견된 날짜 입력 필드: ${allDateInputs.length}개`);
      
      for (let i = 0; i < allDateInputs.length; i++) {
        const input = allDateInputs[i];
        const value = await input.inputValue();
        const placeholder = await input.getAttribute('placeholder') || '';
        console.log(`   입력 필드 ${i + 1}: value="${value}", placeholder="${placeholder}"`);
      }
      
      throw new Error('발행일 입력 필드를 찾을 수 없습니다.');
    }

    const currentValue = await publishedAtInput.inputValue();
    console.log(`   📅 현재 발행일 값: ${currentValue || '(비어있음)'}\n`);

    // 5. 발행일 변경
    console.log('5️⃣ 발행일 변경...');
    const newDate = '2025-11-20';
    
    // 입력 필드 클릭 및 값 입력
    await publishedAtInput.click();
    await page.waitForTimeout(500);
    await publishedAtInput.fill(newDate);
    await page.waitForTimeout(500);
    
    // 값이 제대로 입력되었는지 확인
    const afterFillValue = await publishedAtInput.inputValue();
    console.log(`   📅 입력 후 값: ${afterFillValue}`);
    
    if (afterFillValue !== newDate) {
      console.log(`   ⚠️ 값이 제대로 입력되지 않음. 다시 시도...`);
      await publishedAtInput.clear();
      await page.waitForTimeout(300);
      await publishedAtInput.type(newDate, { delay: 100 });
      await page.waitForTimeout(500);
      
      const retryValue = await publishedAtInput.inputValue();
      console.log(`   📅 재시도 후 값: ${retryValue}`);
    }
    
    console.log(`   ✅ 발행일 변경 완료: ${currentValue} → ${newDate}\n`);

    // 6. formData 상태 확인 (JavaScript 실행)
    console.log('6️⃣ formData 상태 확인...');
    const formDataCheck = await page.evaluate(() => {
      // 모든 label 요소를 찾아서 "발행일" 텍스트를 가진 것 찾기
      const labels = Array.from(document.querySelectorAll('label'));
      const publishedAtLabel = labels.find(label => label.textContent.includes('발행일'));
      
      if (publishedAtLabel) {
        const dateInput = publishedAtLabel.parentElement?.querySelector('input[type="date"]');
        return {
          inputValue: dateInput?.value || null,
          inputExists: !!dateInput,
          labelText: publishedAtLabel.textContent
        };
      }
      
      return {
        inputValue: null,
        inputExists: false,
        labelText: null
      };
    });
    console.log(`   formData 확인:`, formDataCheck);
    
    // 7. 수정 버튼 클릭
    console.log('\n7️⃣ 수정 버튼 클릭...');
    await page.waitForTimeout(1000);
    
    // 상단 수정 버튼 찾기
    const topSubmitButton = await page.locator('button[type="submit"]:has-text("수정")').first();
    let buttonClicked = false;
    
    if (await topSubmitButton.isVisible({ timeout: 3000 })) {
      console.log('   ✅ 상단 수정 버튼 발견');
      await topSubmitButton.click();
      buttonClicked = true;
    } else {
      // 하단 수정 버튼 찾기
      const bottomSubmitButton = await page.locator('button[type="submit"]:has-text("수정")').last();
      if (await bottomSubmitButton.isVisible({ timeout: 3000 })) {
        console.log('   ✅ 하단 수정 버튼 발견');
        await bottomSubmitButton.click();
        buttonClicked = true;
      }
    }
    
    if (!buttonClicked) {
      throw new Error('수정 버튼을 찾을 수 없습니다.');
    }
    
    console.log('   ✅ 수정 버튼 클릭 완료\n');

    // 8. 네트워크 요청/응답 대기 및 확인
    console.log('8️⃣ 네트워크 요청/응답 확인...');
    await page.waitForTimeout(5000); // 충분한 시간 대기
    
    console.log('\n📋 네트워크 데이터 분석:');
    const requests = networkData.filter(d => d.type === 'request');
    const responses = networkData.filter(d => d.type === 'response');
    
    if (requests.length > 0) {
      console.log(`\n   📤 요청 ${requests.length}개:`);
      requests.forEach((req, i) => {
        console.log(`   요청 ${i + 1}:`);
        console.log(`      published_at: ${req.published_at || '없음'}`);
        console.log(`      created_at: ${req.created_at || '없음'}`);
        
        if (req.published_at && req.published_at.includes('2025-11-20')) {
          console.log(`      ✅ published_at 값이 정상적으로 전송됨`);
        } else {
          console.log(`      ❌ published_at 값이 예상과 다름`);
        }
      });
    } else {
      console.log(`   ⚠️ PUT 요청을 찾을 수 없습니다.`);
    }
    
    if (responses.length > 0) {
      console.log(`\n   📥 응답 ${responses.length}개:`);
      responses.forEach((res, i) => {
        console.log(`   응답 ${i + 1} (Status: ${res.status}):`);
        console.log(`      published_at: ${res.published_at || '없음'}`);
        console.log(`      created_at: ${res.created_at || '없음'}`);
        
        if (res.status === 200 && res.published_at) {
          if (res.published_at.includes('2025-11-20')) {
            console.log(`      ✅ published_at 값이 정상적으로 저장됨`);
          } else {
            console.log(`      ❌ published_at 값이 예상과 다름`);
          }
        }
      });
    } else {
      console.log(`   ⚠️ PUT 응답을 찾을 수 없습니다.`);
    }

    // 9. 저장 후 페이지 새로고침 및 재확인
    console.log('\n9️⃣ 저장 후 재확인...');
    await page.waitForTimeout(3000);
    
    // 목록으로 돌아가기
    await page.goto('http://localhost:3000/admin/blog');
    await page.waitForTimeout(3000);
    
    // 다시 수정 버튼 클릭
    const editButton2 = await page.locator('button:has-text("수정")').first();
    if (await editButton2.isVisible({ timeout: 5000 })) {
      await editButton2.click();
      await page.waitForTimeout(3000);
      
      const publishedAtInput2 = await page.locator('label:has-text("발행일")').locator('..').locator('input[type="date"]').first();
      if (await publishedAtInput2.isVisible({ timeout: 5000 })) {
        const savedValue = await publishedAtInput2.inputValue();
        console.log(`   📅 저장된 발행일 값: ${savedValue || '(비어있음)'}`);
        
        // 날짜 형식 변환 (2025-11-20T00:00:00+00:00 -> 2025-11-20)
        const expectedDate = '2025-11-20';
        const savedDateOnly = savedValue ? savedValue.split('T')[0] : '';
        
        if (savedDateOnly === expectedDate) {
          console.log(`   ✅ 발행일이 정상적으로 저장됨: ${savedValue}`);
        } else {
          console.log(`   ❌ 발행일이 저장되지 않음: 예상 ${expectedDate}, 실제 ${savedDateOnly}`);
          console.log(`   ⚠️ 원본 값: ${savedValue}`);
        }
      }
    }

    // 최종 스크린샷
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'test-blog-published-at-debug-result.png', fullPage: true });
    console.log('\n   📸 스크린샷 저장: test-blog-published-at-debug-result.png');
    
    console.log('\n✅ 테스트 완료!');
    
  } catch (error) {
    console.error(`❌ 테스트 실패: ${error.message}`);
    console.error(error.stack);
    await page.screenshot({ path: 'test-blog-published-at-debug-failure.png', fullPage: true });
    throw error;
  } finally {
    await page.close();
    await browser.close();
  }
})();

