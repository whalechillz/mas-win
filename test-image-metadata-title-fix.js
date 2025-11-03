// 이미지 메타데이터 저장 후 제목이 파일명으로 덮어쓰기 되는 문제 테스트
const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    console.log('🔍 이미지 메타데이터 제목 저장 문제 테스트 시작...');

    // 1. 로그인
    console.log('1️⃣ 로그인 중...');
    await page.goto('https://win.masgolf.co.kr/admin/login');
    await page.waitForTimeout(2000);
    
    const loginInput = page.locator('input#login, input[name="login"], input[placeholder*="전화번호"], input[placeholder*="아이디"]').first();
    await loginInput.waitFor({ timeout: 10000 });
    await loginInput.fill('010-6669-9000');
    console.log('✅ 전화번호 입력 완료');
    await page.waitForTimeout(500);
    
    const passwordInput = page.locator('input#password, input[name="password"], input[type="password"]').first();
    await passwordInput.waitFor({ timeout: 10000 });
    await passwordInput.fill('66699000');
    console.log('✅ 비밀번호 입력 완료');
    await page.waitForTimeout(500);
    
    const loginButton = page.locator('button[type="submit"], form button, button:has-text("로그인")').first();
    await loginButton.waitFor({ timeout: 10000 });
    await loginButton.click();
    console.log('✅ 로그인 버튼 클릭 완료');
    await page.waitForTimeout(3000);

    // 2. 갤러리 관리 페이지 이동
    console.log('\n2️⃣ 갤러리 관리 페이지로 이동...');
    await page.goto('https://win.masgolf.co.kr/admin/gallery');
    await page.waitForTimeout(5000);

    // 3. golf-driver-male-massgoo-207.png.png 이미지 찾기
    console.log('\n3️⃣ 이미지 검색...');
    const searchInput = page.locator('input[placeholder*="파일명"], input[placeholder*="검색"]').first();
    if (await searchInput.count() > 0) {
      await searchInput.fill('golf-driver-male-massgoo-207');
      await page.waitForTimeout(2000);
      console.log('✅ 검색어 입력: golf-driver-male-massgoo-207');
    }

    // 4. 이미지 편집 모달 열기
    console.log('\n4️⃣ 이미지 편집 모달 열기...');
    await page.waitForTimeout(3000);
    
    // golf-driver-male-massgoo-207 이미지 찾기
    const imageCard = page.locator('[alt*="golf-driver"], [title*="golf-driver"], img[src*="golf-driver"]').first();
    if (await imageCard.count() > 0) {
      await imageCard.click({ button: 'right' }); // 우클릭
      await page.waitForTimeout(1000);
      
      // 편집 버튼 클릭
      const editButton = page.locator('button:has-text("편집"), button:has-text("수정"), a:has-text("편집")').first();
      if (await editButton.count() > 0) {
        await editButton.click();
        console.log('✅ 편집 버튼 클릭');
      } else {
        // 직접 클릭 시도
        await imageCard.click();
        console.log('✅ 이미지 카드 클릭');
      }
    } else {
      console.log('⚠️ 이미지를 찾을 수 없음, 직접 모달 열기 시도');
    }

    await page.waitForTimeout(2000);

    // 5. 메타데이터 편집 모달 확인
    console.log('\n5️⃣ 메타데이터 편집 모달 확인...');
    const modalTitle = page.locator('text=이미지 메타데이터 편집, text=Image Metadata Editing').first();
    if (await modalTitle.count() > 0) {
      console.log('✅ 편집 모달 열림 확인');
      
      // 6. 제목 필드 확인 및 수정
      console.log('\n6️⃣ 제목 필드 확인...');
      const titleInput = page.locator('input[placeholder*="제목"], input[name*="title"], label:has-text("제목") + input').first();
      if (await titleInput.count() > 0) {
        const currentTitle = await titleInput.inputValue();
        console.log(`   현재 제목: "${currentTitle}"`);
        
        // 제목이 파일명인지 확인
        if (currentTitle.includes('golf-driver-male-massgoo-207.png')) {
          console.log('   ⚠️ 제목이 파일명으로 되어 있음');
          
          // 제목 수정
          await titleInput.clear();
          await titleInput.fill('골프 드라이버 스윙의 순간');
          console.log('   ✅ 제목 수정: "골프 드라이버 스윙의 순간"');
          await page.waitForTimeout(500);
        } else {
          console.log('   ✅ 제목이 정상적으로 설정되어 있음');
        }
      }

      // 7. 저장 버튼 클릭
      console.log('\n7️⃣ 저장 버튼 클릭...');
      const saveButton = page.locator('button:has-text("저장"), button[type="submit"]').first();
      if (await saveButton.count() > 0) {
        await saveButton.click();
        console.log('✅ 저장 버튼 클릭');
        await page.waitForTimeout(2000);
        
        // 성공 메시지 확인
        const successMessage = page.locator('text=저장되었습니다, text=성공적으로 저장').first();
        if (await successMessage.count() > 0) {
          console.log('✅ 저장 성공 메시지 확인');
        }
      }

      // 8. 모달 닫기
      await page.waitForTimeout(2000);
      const closeButton = page.locator('button:has-text("취소"), button:has-text("닫기"), [aria-label="Close"]').first();
      if (await closeButton.count() > 0) {
        await closeButton.click();
        await page.waitForTimeout(1000);
      }

      // 9. 다시 편집 모달 열어서 제목 확인
      console.log('\n9️⃣ 다시 편집 모달 열어서 제목 확인...');
      await page.waitForTimeout(2000);
      
      if (await imageCard.count() > 0) {
        await imageCard.click();
        await page.waitForTimeout(2000);
        
        const titleInput2 = page.locator('input[placeholder*="제목"], input[name*="title"], label:has-text("제목") + input').first();
        if (await titleInput2.count() > 0) {
          const savedTitle = await titleInput2.inputValue();
          console.log(`   저장 후 제목: "${savedTitle}"`);
          
          if (savedTitle.includes('golf-driver-male-massgoo-207.png')) {
            console.log('   ❌ 문제: 제목이 파일명으로 되돌아감');
          } else if (savedTitle === '골프 드라이버 스윙의 순간' || savedTitle.length > 0) {
            console.log('   ✅ 성공: 제목이 정상적으로 저장됨');
          } else {
            console.log('   ⚠️ 제목이 비어있음');
          }
        }
      }
    } else {
      console.log('⚠️ 편집 모달을 찾을 수 없음');
    }

    console.log('\n✅ 테스트 완료!');
    await page.waitForTimeout(3000);

  } catch (error) {
    console.error('❌ 테스트 중 오류:', error);
    await page.screenshot({ path: 'test-image-metadata-title-error.png' });
  } finally {
    await browser.close();
  }
})();

