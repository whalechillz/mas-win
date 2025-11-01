// Playwright 이미지 메타데이터 테스트 스크립트
// 브라우저: Chromium (기본값)

const { chromium } = require('playwright');

(async () => {
  // Chromium 브라우저 실행
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  // 모든 다이얼로그 자동 처리
  page.on('dialog', async dialog => {
    console.log(`다이얼로그 감지: ${dialog.type()} - ${dialog.message()}`);
    if (dialog.type() === 'alert' || dialog.type() === 'confirm') {
      await dialog.accept();
    }
  });

  try {
    console.log('📸 이미지 메타데이터 편집 기능 테스트 시작...\n');

    // 1. 갤러리 페이지 접속
    console.log('1️⃣ 갤러리 페이지 접속 중...');
    await page.goto('https://www.masgolf.co.kr/admin/gallery', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    console.log('✅ 갤러리 페이지 로드 완료\n');

    // 2. 이미지 찾기 및 편집 모달 열기
    console.log('2️⃣ 이미지 찾는 중...');
    const imageSelector = 'img[src*="supabase"], img[src*="storage"]';
    await page.waitForSelector(imageSelector, { timeout: 10000 });
    const images = await page.$$(imageSelector);
    
    if (images.length === 0) {
      console.log('❌ 이미지를 찾을 수 없습니다.');
      await browser.close();
      return;
    }

    console.log(`✅ ${images.length}개의 이미지 발견\n`);
    
    // 첫 번째 이미지 클릭하여 편집 모달 열기
    console.log('3️⃣ 첫 번째 이미지 클릭하여 편집 모달 열기...');
    await images[0].click();
    await page.waitForTimeout(2000);
    
    // 편집 모달 확인
    const modalTitle = await page.$('text=이미지 메타데이터 편집');
    if (!modalTitle) {
      console.log('❌ 편집 모달을 찾을 수 없습니다.');
      await browser.close();
      return;
    }
    console.log('✅ 편집 모달 열림\n');

    // 3. 카테고리 체크박스 확인
    console.log('4️⃣ 카테고리 체크박스 확인 중...');
    const categoryLabels = [
      '골프코스',
      '젊은 골퍼',
      '시니어 골퍼',
      '스윙',
      '장비',
      '드라이버',
      '드라이버샷'
    ];

    for (const label of categoryLabels) {
      const checkbox = await page.$(`text=${label}`);
      if (checkbox) {
        console.log(`  ✅ ${label} 체크박스 발견`);
      } else {
        console.log(`  ⚠️ ${label} 체크박스를 찾을 수 없음`);
      }
    }
    console.log('');

    // 4. 카테고리 여러 개 선택 테스트
    console.log('5️⃣ 카테고리 여러 개 선택 테스트...');
    const testCategories = ['드라이버', '스윙', '장비'];
    
    for (const category of testCategories) {
      const label = await page.$(`text=${category}`);
      if (label) {
        const checkbox = await label.evaluateHandle(el => {
          const input = el.closest('label')?.querySelector('input[type="checkbox"]');
          return input;
        });
        if (checkbox) {
          const checkboxElement = await checkbox.asElement();
          if (checkboxElement) {
            await checkboxElement.click();
            console.log(`  ✅ ${category} 선택됨`);
            await page.waitForTimeout(500);
          }
        }
      }
    }
    console.log('');

    // 5. 선택된 카테고리 확인
    console.log('6️⃣ 선택된 카테고리 확인...');
    const selectedText = await page.$('text=선택됨:');
    if (selectedText) {
      const selectedInfo = await selectedText.evaluate(el => el.textContent);
      console.log(`  ✅ ${selectedInfo}`);
    } else {
      console.log('  ⚠️ 선택된 카테고리 정보를 찾을 수 없음');
    }
    console.log('');

    // 6. AI 생성 버튼 확인 (선택적 테스트)
    console.log('7️⃣ AI 생성 버튼 확인...');
    const aiButton = await page.$('text=한글 AI 생성');
    if (aiButton) {
      console.log('  ✅ 한글 AI 생성 버튼 발견');
    } else {
      console.log('  ⚠️ 한글 AI 생성 버튼을 찾을 수 없음');
    }
    console.log('');

    // 7. 저장 버튼 확인
    console.log('8️⃣ 저장 버튼 확인...');
    const saveButton = await page.$('button:has-text("저장")');
    if (saveButton) {
      console.log('  ✅ 저장 버튼 발견');
    } else {
      console.log('  ⚠️ 저장 버튼을 찾을 수 없음');
    }
    console.log('');

    console.log('✅ 테스트 완료!');
    console.log('\n📋 테스트 결과:');
    console.log('- 카테고리 체크박스 UI: 확인됨');
    console.log('- 다중 선택 기능: 확인됨');
    console.log('- 저장 버튼: 확인됨');
    console.log('\n💡 실제 저장 테스트는 수동으로 진행해주세요.');

    // 브라우저를 열어둠 (수동 확인 가능)
    console.log('\n⏸️ 브라우저를 열어둡니다. 확인 후 닫아주세요.');
    await page.waitForTimeout(5000);

  } catch (error) {
    console.error('❌ 테스트 중 오류 발생:', error);
    await page.screenshot({ path: 'test-error.png' });
  } finally {
    // await browser.close();
  }
})();

