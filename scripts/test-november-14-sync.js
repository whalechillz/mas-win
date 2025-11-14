/**
 * 11월 14일 데이터 동기화 테스트 (Playwright)
 */

const { chromium } = require('playwright');

async function testNovember14Sync() {
  console.log('🧪 11월 14일 데이터 동기화 테스트 시작...\n');

  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  try {
    // 카카오 콘텐츠 페이지로 이동
    console.log('📱 카카오 콘텐츠 페이지 로드 중...');
    await page.goto('http://localhost:3000/admin/kakao-content', {
      waitUntil: 'networkidle',
      timeout: 30000
    });

    // 날짜 선택 (11월 14일)
    console.log('📅 11월 14일 선택 중...');
    
    // 날짜 선택 버튼 찾기 (캘린더에서 14일 클릭)
    const dateButton = await page.locator('text=14').first();
    if (await dateButton.isVisible()) {
      await dateButton.click();
      await page.waitForTimeout(2000);
    } else {
      console.log('⚠️ 날짜 버튼을 찾을 수 없습니다. 수동으로 확인해주세요.');
    }

    // 스크린샷 촬영
    console.log('📸 스크린샷 촬영 중...');
    await page.screenshot({
      path: 'scripts/test-november-14-sync-result.png',
      fullPage: true
    });

    // Account1 데이터 확인
    console.log('\n📋 Account1 (MAS GOLF) 데이터 확인:');
    const account1Background = await page.locator('text=숲속 코스').first();
    const account1Profile = await page.locator('text=시니어 골퍼').first();
    const account1Message = await page.locator('text=오늘도 자신감 있게.').first();

    if (await account1Background.isVisible()) {
      console.log('  ✅ 배경: "숲속 코스" 확인됨');
    } else {
      console.log('  ❌ 배경: "숲속 코스" 찾을 수 없음');
    }

    if (await account1Profile.isVisible()) {
      console.log('  ✅ 프로필: "시니어 골퍼" 확인됨');
    } else {
      console.log('  ❌ 프로필: "시니어 골퍼" 찾을 수 없음');
    }

    if (await account1Message.isVisible()) {
      console.log('  ✅ 메시지: "오늘도 자신감 있게." 확인됨');
    } else {
      console.log('  ❌ 메시지: "오늘도 자신감 있게." 찾을 수 없음');
    }

    // Account2 데이터 확인
    console.log('\n📋 Account2 (MASGOLF Tech) 데이터 확인:');
    const account2Background = await page.locator('text=실내 피팅룸').first();
    const account2Profile = await page.locator('text=젊은 골퍼').first();
    const account2Message = await page.locator('text=AI Precision Swing.').first();

    if (await account2Background.isVisible()) {
      console.log('  ✅ 배경: "실내 피팅룸" 확인됨');
    } else {
      console.log('  ❌ 배경: "실내 피팅룸" 찾을 수 없음');
    }

    if (await account2Profile.isVisible()) {
      console.log('  ✅ 프로필: "젊은 골퍼" 확인됨');
    } else {
      console.log('  ❌ 프로필: "젊은 골퍼" 찾을 수 없음');
    }

    if (await account2Message.isVisible()) {
      console.log('  ✅ 메시지: "AI Precision Swing." 확인됨');
    } else {
      console.log('  ❌ 메시지: "AI Precision Swing." 찾을 수 없음');
    }

    // "테스트 배경", "테스트 프로필" 확인 (없어야 함)
    console.log('\n🔍 테스트 데이터 확인:');
    const testBackground = await page.locator('text=테스트 배경').first();
    const testProfile = await page.locator('text=테스트 프로필').first();

    if (await testBackground.isVisible()) {
      console.log('  ⚠️ "테스트 배경"이 여전히 표시됩니다.');
    } else {
      console.log('  ✅ "테스트 배경"이 제거되었습니다.');
    }

    if (await testProfile.isVisible()) {
      console.log('  ⚠️ "테스트 프로필"이 여전히 표시됩니다.');
    } else {
      console.log('  ✅ "테스트 프로필"이 제거되었습니다.');
    }

    console.log('\n✅ 테스트 완료!');
    console.log('📸 스크린샷 저장: scripts/test-november-14-sync-result.png');

    // 5초 대기 (확인용)
    await page.waitForTimeout(5000);

  } catch (error) {
    console.error('❌ 테스트 중 오류 발생:', error);
    await page.screenshot({
      path: 'scripts/test-november-14-sync-error.png',
      fullPage: true
    });
  } finally {
    await browser.close();
  }
}

// 실행
testNovember14Sync()
  .then(() => {
    console.log('\n✅ 테스트 완료!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ 테스트 실패:', error);
    process.exit(1);
  });

