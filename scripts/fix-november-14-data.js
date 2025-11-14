/**
 * 11월 14일 테스트 데이터 삭제/수정 스크립트
 */

const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  try {
    console.log('🔧 11월 14일 테스트 데이터 수정 중...\n');

    await page.goto('http://localhost:3000/admin/kakao-content', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    const date = '2025-11-14';
    const monthStr = '2025-11';

    // 데이터 로드
    const loadResponse = await page.evaluate(async (month) => {
      const response = await fetch(`/api/kakao-content/calendar-load?month=${month}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });
      return {
        status: response.status,
        ok: response.ok,
        data: await response.json().catch(() => ({ error: 'JSON 파싱 실패' }))
      };
    }, monthStr);

    if (!loadResponse.ok || !loadResponse.data.success) {
      console.error('❌ 데이터 로드 실패');
      process.exit(1);
    }

    const calendarData = loadResponse.data.calendarData;

    // Account1 프로필 수정
    const account1ProfileIndex = calendarData.profileContent.account1.dailySchedule.findIndex((s) => s.date === date);
    if (account1ProfileIndex >= 0) {
      const profile = calendarData.profileContent.account1.dailySchedule[account1ProfileIndex];
      
      // 테스트 데이터 제거
      if ((profile.background?.prompt && profile.background.prompt.includes('테스트')) || 
          (profile.background?.basePrompt && profile.background.basePrompt.includes('테스트'))) {
        profile.background.prompt = null;
        profile.background.basePrompt = null;
        console.log('✅ Account1 배경 테스트 프롬프트 제거');
      }
      
      if ((profile.profile?.prompt && profile.profile.prompt.includes('테스트')) || 
          (profile.profile?.basePrompt && profile.profile.basePrompt.includes('테스트'))) {
        profile.profile.prompt = null;
        profile.profile.basePrompt = null;
        console.log('✅ Account1 프로필 테스트 프롬프트 제거');
      }
    }

    // Account2 프로필 수정
    const account2ProfileIndex = calendarData.profileContent.account2.dailySchedule.findIndex((s) => s.date === date);
    if (account2ProfileIndex >= 0) {
      const profile = calendarData.profileContent.account2.dailySchedule[account2ProfileIndex];
      
      // 테스트 메시지 제거
      if (profile.message && profile.message.includes('테스트')) {
        profile.message = '';
        console.log('✅ Account2 테스트 메시지 제거');
      }
      
      // 테스트 프롬프트 제거
      if ((profile.background?.prompt && profile.background.prompt.includes('테스트')) || 
          (profile.background?.basePrompt && profile.background.basePrompt.includes('테스트'))) {
        profile.background.prompt = null;
        profile.background.basePrompt = null;
        console.log('✅ Account2 배경 테스트 프롬프트 제거');
      }
      
      if ((profile.profile?.prompt && profile.profile.prompt.includes('테스트')) || 
          (profile.profile?.basePrompt && profile.profile.basePrompt.includes('테스트'))) {
        profile.profile.prompt = null;
        profile.profile.basePrompt = null;
        console.log('✅ Account2 프로필 테스트 프롬프트 제거');
      }
    }

    // 피드 데이터 수정
    const feedIndex = calendarData.kakaoFeed.dailySchedule.findIndex((f) => f.date === date);
    if (feedIndex >= 0) {
      const feed = calendarData.kakaoFeed.dailySchedule[feedIndex];
      
      // Account1 피드
      if (feed.account1) {
        if (feed.account1.caption && feed.account1.caption.includes('테스트')) {
          feed.account1.caption = '';
          console.log('✅ Account1 피드 테스트 캡션 제거');
        }
        if (feed.account1.imageCategory && feed.account1.imageCategory.includes('테스트')) {
          feed.account1.imageCategory = null;
          console.log('✅ Account1 피드 테스트 카테고리 제거');
        }
        if (feed.account1.imagePrompt && feed.account1.imagePrompt.includes('테스트')) {
          feed.account1.imagePrompt = null;
          console.log('✅ Account1 피드 테스트 프롬프트 제거');
        }
      }
      
      // Account2 피드
      if (feed.account2) {
        if (feed.account2.caption && feed.account2.caption.includes('테스트')) {
          feed.account2.caption = '';
          console.log('✅ Account2 피드 테스트 캡션 제거');
        }
        if (feed.account2.imageCategory && feed.account2.imageCategory.includes('테스트')) {
          feed.account2.imageCategory = null;
          console.log('✅ Account2 피드 테스트 카테고리 제거');
        }
        if (feed.account2.imagePrompt && feed.account2.imagePrompt.includes('테스트')) {
          feed.account2.imagePrompt = null;
          console.log('✅ Account2 피드 테스트 프롬프트 제거');
        }
      }
    }

    // 수정된 데이터 저장
    console.log('\n💾 수정된 데이터 저장 중...');
    const saveResponse = await page.evaluate(async (data) => {
      const response = await fetch('/api/kakao-content/calendar-save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      return {
        status: response.status,
        ok: response.ok,
        data: await response.json().catch(() => ({ error: 'JSON 파싱 실패' }))
      };
    }, { month: monthStr, calendarData });

    if (saveResponse.ok && saveResponse.data.success) {
      console.log(`✅ 저장 완료: ${saveResponse.data.savedCount}개 항목 저장`);
      console.log('\n✅ 11월 14일 테스트 데이터가 제거되었습니다.');
    } else {
      console.error('❌ 저장 실패:', saveResponse.data.message);
    }

    // 스크린샷 저장
    await page.screenshot({ path: 'test-results/fix-november-14-data-result.png', fullPage: true });
    console.log('\n✅ 스크린샷 저장: test-results/fix-november-14-data-result.png\n');

    await browser.close();

  } catch (error) {
    console.error('❌ 오류 발생:', error);
    await page.screenshot({ path: 'test-results/fix-november-14-data-error.png', fullPage: true });
    process.exit(1);
  }
})();


 */

const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  try {
    console.log('🔧 11월 14일 테스트 데이터 수정 중...\n');

    await page.goto('http://localhost:3000/admin/kakao-content', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    const date = '2025-11-14';
    const monthStr = '2025-11';

    // 데이터 로드
    const loadResponse = await page.evaluate(async (month) => {
      const response = await fetch(`/api/kakao-content/calendar-load?month=${month}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });
      return {
        status: response.status,
        ok: response.ok,
        data: await response.json().catch(() => ({ error: 'JSON 파싱 실패' }))
      };
    }, monthStr);

    if (!loadResponse.ok || !loadResponse.data.success) {
      console.error('❌ 데이터 로드 실패');
      process.exit(1);
    }

    const calendarData = loadResponse.data.calendarData;

    // Account1 프로필 수정
    const account1ProfileIndex = calendarData.profileContent.account1.dailySchedule.findIndex((s) => s.date === date);
    if (account1ProfileIndex >= 0) {
      const profile = calendarData.profileContent.account1.dailySchedule[account1ProfileIndex];
      
      // 테스트 데이터 제거
      if ((profile.background?.prompt && profile.background.prompt.includes('테스트')) || 
          (profile.background?.basePrompt && profile.background.basePrompt.includes('테스트'))) {
        profile.background.prompt = null;
        profile.background.basePrompt = null;
        console.log('✅ Account1 배경 테스트 프롬프트 제거');
      }
      
      if ((profile.profile?.prompt && profile.profile.prompt.includes('테스트')) || 
          (profile.profile?.basePrompt && profile.profile.basePrompt.includes('테스트'))) {
        profile.profile.prompt = null;
        profile.profile.basePrompt = null;
        console.log('✅ Account1 프로필 테스트 프롬프트 제거');
      }
    }

    // Account2 프로필 수정
    const account2ProfileIndex = calendarData.profileContent.account2.dailySchedule.findIndex((s) => s.date === date);
    if (account2ProfileIndex >= 0) {
      const profile = calendarData.profileContent.account2.dailySchedule[account2ProfileIndex];
      
      // 테스트 메시지 제거
      if (profile.message && profile.message.includes('테스트')) {
        profile.message = '';
        console.log('✅ Account2 테스트 메시지 제거');
      }
      
      // 테스트 프롬프트 제거
      if ((profile.background?.prompt && profile.background.prompt.includes('테스트')) || 
          (profile.background?.basePrompt && profile.background.basePrompt.includes('테스트'))) {
        profile.background.prompt = null;
        profile.background.basePrompt = null;
        console.log('✅ Account2 배경 테스트 프롬프트 제거');
      }
      
      if ((profile.profile?.prompt && profile.profile.prompt.includes('테스트')) || 
          (profile.profile?.basePrompt && profile.profile.basePrompt.includes('테스트'))) {
        profile.profile.prompt = null;
        profile.profile.basePrompt = null;
        console.log('✅ Account2 프로필 테스트 프롬프트 제거');
      }
    }

    // 피드 데이터 수정
    const feedIndex = calendarData.kakaoFeed.dailySchedule.findIndex((f) => f.date === date);
    if (feedIndex >= 0) {
      const feed = calendarData.kakaoFeed.dailySchedule[feedIndex];
      
      // Account1 피드
      if (feed.account1) {
        if (feed.account1.caption && feed.account1.caption.includes('테스트')) {
          feed.account1.caption = '';
          console.log('✅ Account1 피드 테스트 캡션 제거');
        }
        if (feed.account1.imageCategory && feed.account1.imageCategory.includes('테스트')) {
          feed.account1.imageCategory = null;
          console.log('✅ Account1 피드 테스트 카테고리 제거');
        }
        if (feed.account1.imagePrompt && feed.account1.imagePrompt.includes('테스트')) {
          feed.account1.imagePrompt = null;
          console.log('✅ Account1 피드 테스트 프롬프트 제거');
        }
      }
      
      // Account2 피드
      if (feed.account2) {
        if (feed.account2.caption && feed.account2.caption.includes('테스트')) {
          feed.account2.caption = '';
          console.log('✅ Account2 피드 테스트 캡션 제거');
        }
        if (feed.account2.imageCategory && feed.account2.imageCategory.includes('테스트')) {
          feed.account2.imageCategory = null;
          console.log('✅ Account2 피드 테스트 카테고리 제거');
        }
        if (feed.account2.imagePrompt && feed.account2.imagePrompt.includes('테스트')) {
          feed.account2.imagePrompt = null;
          console.log('✅ Account2 피드 테스트 프롬프트 제거');
        }
      }
    }

    // 수정된 데이터 저장
    console.log('\n💾 수정된 데이터 저장 중...');
    const saveResponse = await page.evaluate(async (data) => {
      const response = await fetch('/api/kakao-content/calendar-save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      return {
        status: response.status,
        ok: response.ok,
        data: await response.json().catch(() => ({ error: 'JSON 파싱 실패' }))
      };
    }, { month: monthStr, calendarData });

    if (saveResponse.ok && saveResponse.data.success) {
      console.log(`✅ 저장 완료: ${saveResponse.data.savedCount}개 항목 저장`);
      console.log('\n✅ 11월 14일 테스트 데이터가 제거되었습니다.');
    } else {
      console.error('❌ 저장 실패:', saveResponse.data.message);
    }

    // 스크린샷 저장
    await page.screenshot({ path: 'test-results/fix-november-14-data-result.png', fullPage: true });
    console.log('\n✅ 스크린샷 저장: test-results/fix-november-14-data-result.png\n');

    await browser.close();

  } catch (error) {
    console.error('❌ 오류 발생:', error);
    await page.screenshot({ path: 'test-results/fix-november-14-data-error.png', fullPage: true });
    process.exit(1);
  }
})();


 */

const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  try {
    console.log('🔧 11월 14일 테스트 데이터 수정 중...\n');

    await page.goto('http://localhost:3000/admin/kakao-content', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    const date = '2025-11-14';
    const monthStr = '2025-11';

    // 데이터 로드
    const loadResponse = await page.evaluate(async (month) => {
      const response = await fetch(`/api/kakao-content/calendar-load?month=${month}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });
      return {
        status: response.status,
        ok: response.ok,
        data: await response.json().catch(() => ({ error: 'JSON 파싱 실패' }))
      };
    }, monthStr);

    if (!loadResponse.ok || !loadResponse.data.success) {
      console.error('❌ 데이터 로드 실패');
      process.exit(1);
    }

    const calendarData = loadResponse.data.calendarData;

    // Account1 프로필 수정
    const account1ProfileIndex = calendarData.profileContent.account1.dailySchedule.findIndex((s) => s.date === date);
    if (account1ProfileIndex >= 0) {
      const profile = calendarData.profileContent.account1.dailySchedule[account1ProfileIndex];
      
      // 테스트 데이터 제거
      if ((profile.background?.prompt && profile.background.prompt.includes('테스트')) || 
          (profile.background?.basePrompt && profile.background.basePrompt.includes('테스트'))) {
        profile.background.prompt = null;
        profile.background.basePrompt = null;
        console.log('✅ Account1 배경 테스트 프롬프트 제거');
      }
      
      if ((profile.profile?.prompt && profile.profile.prompt.includes('테스트')) || 
          (profile.profile?.basePrompt && profile.profile.basePrompt.includes('테스트'))) {
        profile.profile.prompt = null;
        profile.profile.basePrompt = null;
        console.log('✅ Account1 프로필 테스트 프롬프트 제거');
      }
    }

    // Account2 프로필 수정
    const account2ProfileIndex = calendarData.profileContent.account2.dailySchedule.findIndex((s) => s.date === date);
    if (account2ProfileIndex >= 0) {
      const profile = calendarData.profileContent.account2.dailySchedule[account2ProfileIndex];
      
      // 테스트 메시지 제거
      if (profile.message && profile.message.includes('테스트')) {
        profile.message = '';
        console.log('✅ Account2 테스트 메시지 제거');
      }
      
      // 테스트 프롬프트 제거
      if ((profile.background?.prompt && profile.background.prompt.includes('테스트')) || 
          (profile.background?.basePrompt && profile.background.basePrompt.includes('테스트'))) {
        profile.background.prompt = null;
        profile.background.basePrompt = null;
        console.log('✅ Account2 배경 테스트 프롬프트 제거');
      }
      
      if ((profile.profile?.prompt && profile.profile.prompt.includes('테스트')) || 
          (profile.profile?.basePrompt && profile.profile.basePrompt.includes('테스트'))) {
        profile.profile.prompt = null;
        profile.profile.basePrompt = null;
        console.log('✅ Account2 프로필 테스트 프롬프트 제거');
      }
    }

    // 피드 데이터 수정
    const feedIndex = calendarData.kakaoFeed.dailySchedule.findIndex((f) => f.date === date);
    if (feedIndex >= 0) {
      const feed = calendarData.kakaoFeed.dailySchedule[feedIndex];
      
      // Account1 피드
      if (feed.account1) {
        if (feed.account1.caption && feed.account1.caption.includes('테스트')) {
          feed.account1.caption = '';
          console.log('✅ Account1 피드 테스트 캡션 제거');
        }
        if (feed.account1.imageCategory && feed.account1.imageCategory.includes('테스트')) {
          feed.account1.imageCategory = null;
          console.log('✅ Account1 피드 테스트 카테고리 제거');
        }
        if (feed.account1.imagePrompt && feed.account1.imagePrompt.includes('테스트')) {
          feed.account1.imagePrompt = null;
          console.log('✅ Account1 피드 테스트 프롬프트 제거');
        }
      }
      
      // Account2 피드
      if (feed.account2) {
        if (feed.account2.caption && feed.account2.caption.includes('테스트')) {
          feed.account2.caption = '';
          console.log('✅ Account2 피드 테스트 캡션 제거');
        }
        if (feed.account2.imageCategory && feed.account2.imageCategory.includes('테스트')) {
          feed.account2.imageCategory = null;
          console.log('✅ Account2 피드 테스트 카테고리 제거');
        }
        if (feed.account2.imagePrompt && feed.account2.imagePrompt.includes('테스트')) {
          feed.account2.imagePrompt = null;
          console.log('✅ Account2 피드 테스트 프롬프트 제거');
        }
      }
    }

    // 수정된 데이터 저장
    console.log('\n💾 수정된 데이터 저장 중...');
    const saveResponse = await page.evaluate(async (data) => {
      const response = await fetch('/api/kakao-content/calendar-save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      return {
        status: response.status,
        ok: response.ok,
        data: await response.json().catch(() => ({ error: 'JSON 파싱 실패' }))
      };
    }, { month: monthStr, calendarData });

    if (saveResponse.ok && saveResponse.data.success) {
      console.log(`✅ 저장 완료: ${saveResponse.data.savedCount}개 항목 저장`);
      console.log('\n✅ 11월 14일 테스트 데이터가 제거되었습니다.');
    } else {
      console.error('❌ 저장 실패:', saveResponse.data.message);
    }

    // 스크린샷 저장
    await page.screenshot({ path: 'test-results/fix-november-14-data-result.png', fullPage: true });
    console.log('\n✅ 스크린샷 저장: test-results/fix-november-14-data-result.png\n');

    await browser.close();

  } catch (error) {
    console.error('❌ 오류 발생:', error);
    await page.screenshot({ path: 'test-results/fix-november-14-data-error.png', fullPage: true });
    process.exit(1);
  }
})();


 */

const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  try {
    console.log('🔧 11월 14일 테스트 데이터 수정 중...\n');

    await page.goto('http://localhost:3000/admin/kakao-content', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    const date = '2025-11-14';
    const monthStr = '2025-11';

    // 데이터 로드
    const loadResponse = await page.evaluate(async (month) => {
      const response = await fetch(`/api/kakao-content/calendar-load?month=${month}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });
      return {
        status: response.status,
        ok: response.ok,
        data: await response.json().catch(() => ({ error: 'JSON 파싱 실패' }))
      };
    }, monthStr);

    if (!loadResponse.ok || !loadResponse.data.success) {
      console.error('❌ 데이터 로드 실패');
      process.exit(1);
    }

    const calendarData = loadResponse.data.calendarData;

    // Account1 프로필 수정
    const account1ProfileIndex = calendarData.profileContent.account1.dailySchedule.findIndex((s) => s.date === date);
    if (account1ProfileIndex >= 0) {
      const profile = calendarData.profileContent.account1.dailySchedule[account1ProfileIndex];
      
      // 테스트 데이터 제거
      if ((profile.background?.prompt && profile.background.prompt.includes('테스트')) || 
          (profile.background?.basePrompt && profile.background.basePrompt.includes('테스트'))) {
        profile.background.prompt = null;
        profile.background.basePrompt = null;
        console.log('✅ Account1 배경 테스트 프롬프트 제거');
      }
      
      if ((profile.profile?.prompt && profile.profile.prompt.includes('테스트')) || 
          (profile.profile?.basePrompt && profile.profile.basePrompt.includes('테스트'))) {
        profile.profile.prompt = null;
        profile.profile.basePrompt = null;
        console.log('✅ Account1 프로필 테스트 프롬프트 제거');
      }
    }

    // Account2 프로필 수정
    const account2ProfileIndex = calendarData.profileContent.account2.dailySchedule.findIndex((s) => s.date === date);
    if (account2ProfileIndex >= 0) {
      const profile = calendarData.profileContent.account2.dailySchedule[account2ProfileIndex];
      
      // 테스트 메시지 제거
      if (profile.message && profile.message.includes('테스트')) {
        profile.message = '';
        console.log('✅ Account2 테스트 메시지 제거');
      }
      
      // 테스트 프롬프트 제거
      if ((profile.background?.prompt && profile.background.prompt.includes('테스트')) || 
          (profile.background?.basePrompt && profile.background.basePrompt.includes('테스트'))) {
        profile.background.prompt = null;
        profile.background.basePrompt = null;
        console.log('✅ Account2 배경 테스트 프롬프트 제거');
      }
      
      if ((profile.profile?.prompt && profile.profile.prompt.includes('테스트')) || 
          (profile.profile?.basePrompt && profile.profile.basePrompt.includes('테스트'))) {
        profile.profile.prompt = null;
        profile.profile.basePrompt = null;
        console.log('✅ Account2 프로필 테스트 프롬프트 제거');
      }
    }

    // 피드 데이터 수정
    const feedIndex = calendarData.kakaoFeed.dailySchedule.findIndex((f) => f.date === date);
    if (feedIndex >= 0) {
      const feed = calendarData.kakaoFeed.dailySchedule[feedIndex];
      
      // Account1 피드
      if (feed.account1) {
        if (feed.account1.caption && feed.account1.caption.includes('테스트')) {
          feed.account1.caption = '';
          console.log('✅ Account1 피드 테스트 캡션 제거');
        }
        if (feed.account1.imageCategory && feed.account1.imageCategory.includes('테스트')) {
          feed.account1.imageCategory = null;
          console.log('✅ Account1 피드 테스트 카테고리 제거');
        }
        if (feed.account1.imagePrompt && feed.account1.imagePrompt.includes('테스트')) {
          feed.account1.imagePrompt = null;
          console.log('✅ Account1 피드 테스트 프롬프트 제거');
        }
      }
      
      // Account2 피드
      if (feed.account2) {
        if (feed.account2.caption && feed.account2.caption.includes('테스트')) {
          feed.account2.caption = '';
          console.log('✅ Account2 피드 테스트 캡션 제거');
        }
        if (feed.account2.imageCategory && feed.account2.imageCategory.includes('테스트')) {
          feed.account2.imageCategory = null;
          console.log('✅ Account2 피드 테스트 카테고리 제거');
        }
        if (feed.account2.imagePrompt && feed.account2.imagePrompt.includes('테스트')) {
          feed.account2.imagePrompt = null;
          console.log('✅ Account2 피드 테스트 프롬프트 제거');
        }
      }
    }

    // 수정된 데이터 저장
    console.log('\n💾 수정된 데이터 저장 중...');
    const saveResponse = await page.evaluate(async (data) => {
      const response = await fetch('/api/kakao-content/calendar-save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      return {
        status: response.status,
        ok: response.ok,
        data: await response.json().catch(() => ({ error: 'JSON 파싱 실패' }))
      };
    }, { month: monthStr, calendarData });

    if (saveResponse.ok && saveResponse.data.success) {
      console.log(`✅ 저장 완료: ${saveResponse.data.savedCount}개 항목 저장`);
      console.log('\n✅ 11월 14일 테스트 데이터가 제거되었습니다.');
    } else {
      console.error('❌ 저장 실패:', saveResponse.data.message);
    }

    // 스크린샷 저장
    await page.screenshot({ path: 'test-results/fix-november-14-data-result.png', fullPage: true });
    console.log('\n✅ 스크린샷 저장: test-results/fix-november-14-data-result.png\n');

    await browser.close();

  } catch (error) {
    console.error('❌ 오류 발생:', error);
    await page.screenshot({ path: 'test-results/fix-november-14-data-error.png', fullPage: true });
    process.exit(1);
  }
})();




 */

const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  try {
    console.log('🔧 11월 14일 테스트 데이터 수정 중...\n');

    await page.goto('http://localhost:3000/admin/kakao-content', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    const date = '2025-11-14';
    const monthStr = '2025-11';

    // 데이터 로드
    const loadResponse = await page.evaluate(async (month) => {
      const response = await fetch(`/api/kakao-content/calendar-load?month=${month}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });
      return {
        status: response.status,
        ok: response.ok,
        data: await response.json().catch(() => ({ error: 'JSON 파싱 실패' }))
      };
    }, monthStr);

    if (!loadResponse.ok || !loadResponse.data.success) {
      console.error('❌ 데이터 로드 실패');
      process.exit(1);
    }

    const calendarData = loadResponse.data.calendarData;

    // Account1 프로필 수정
    const account1ProfileIndex = calendarData.profileContent.account1.dailySchedule.findIndex((s) => s.date === date);
    if (account1ProfileIndex >= 0) {
      const profile = calendarData.profileContent.account1.dailySchedule[account1ProfileIndex];
      
      // 테스트 데이터 제거
      if ((profile.background?.prompt && profile.background.prompt.includes('테스트')) || 
          (profile.background?.basePrompt && profile.background.basePrompt.includes('테스트'))) {
        profile.background.prompt = null;
        profile.background.basePrompt = null;
        console.log('✅ Account1 배경 테스트 프롬프트 제거');
      }
      
      if ((profile.profile?.prompt && profile.profile.prompt.includes('테스트')) || 
          (profile.profile?.basePrompt && profile.profile.basePrompt.includes('테스트'))) {
        profile.profile.prompt = null;
        profile.profile.basePrompt = null;
        console.log('✅ Account1 프로필 테스트 프롬프트 제거');
      }
    }

    // Account2 프로필 수정
    const account2ProfileIndex = calendarData.profileContent.account2.dailySchedule.findIndex((s) => s.date === date);
    if (account2ProfileIndex >= 0) {
      const profile = calendarData.profileContent.account2.dailySchedule[account2ProfileIndex];
      
      // 테스트 메시지 제거
      if (profile.message && profile.message.includes('테스트')) {
        profile.message = '';
        console.log('✅ Account2 테스트 메시지 제거');
      }
      
      // 테스트 프롬프트 제거
      if ((profile.background?.prompt && profile.background.prompt.includes('테스트')) || 
          (profile.background?.basePrompt && profile.background.basePrompt.includes('테스트'))) {
        profile.background.prompt = null;
        profile.background.basePrompt = null;
        console.log('✅ Account2 배경 테스트 프롬프트 제거');
      }
      
      if ((profile.profile?.prompt && profile.profile.prompt.includes('테스트')) || 
          (profile.profile?.basePrompt && profile.profile.basePrompt.includes('테스트'))) {
        profile.profile.prompt = null;
        profile.profile.basePrompt = null;
        console.log('✅ Account2 프로필 테스트 프롬프트 제거');
      }
    }

    // 피드 데이터 수정
    const feedIndex = calendarData.kakaoFeed.dailySchedule.findIndex((f) => f.date === date);
    if (feedIndex >= 0) {
      const feed = calendarData.kakaoFeed.dailySchedule[feedIndex];
      
      // Account1 피드
      if (feed.account1) {
        if (feed.account1.caption && feed.account1.caption.includes('테스트')) {
          feed.account1.caption = '';
          console.log('✅ Account1 피드 테스트 캡션 제거');
        }
        if (feed.account1.imageCategory && feed.account1.imageCategory.includes('테스트')) {
          feed.account1.imageCategory = null;
          console.log('✅ Account1 피드 테스트 카테고리 제거');
        }
        if (feed.account1.imagePrompt && feed.account1.imagePrompt.includes('테스트')) {
          feed.account1.imagePrompt = null;
          console.log('✅ Account1 피드 테스트 프롬프트 제거');
        }
      }
      
      // Account2 피드
      if (feed.account2) {
        if (feed.account2.caption && feed.account2.caption.includes('테스트')) {
          feed.account2.caption = '';
          console.log('✅ Account2 피드 테스트 캡션 제거');
        }
        if (feed.account2.imageCategory && feed.account2.imageCategory.includes('테스트')) {
          feed.account2.imageCategory = null;
          console.log('✅ Account2 피드 테스트 카테고리 제거');
        }
        if (feed.account2.imagePrompt && feed.account2.imagePrompt.includes('테스트')) {
          feed.account2.imagePrompt = null;
          console.log('✅ Account2 피드 테스트 프롬프트 제거');
        }
      }
    }

    // 수정된 데이터 저장
    console.log('\n💾 수정된 데이터 저장 중...');
    const saveResponse = await page.evaluate(async (data) => {
      const response = await fetch('/api/kakao-content/calendar-save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      return {
        status: response.status,
        ok: response.ok,
        data: await response.json().catch(() => ({ error: 'JSON 파싱 실패' }))
      };
    }, { month: monthStr, calendarData });

    if (saveResponse.ok && saveResponse.data.success) {
      console.log(`✅ 저장 완료: ${saveResponse.data.savedCount}개 항목 저장`);
      console.log('\n✅ 11월 14일 테스트 데이터가 제거되었습니다.');
    } else {
      console.error('❌ 저장 실패:', saveResponse.data.message);
    }

    // 스크린샷 저장
    await page.screenshot({ path: 'test-results/fix-november-14-data-result.png', fullPage: true });
    console.log('\n✅ 스크린샷 저장: test-results/fix-november-14-data-result.png\n');

    await browser.close();

  } catch (error) {
    console.error('❌ 오류 발생:', error);
    await page.screenshot({ path: 'test-results/fix-november-14-data-error.png', fullPage: true });
    process.exit(1);
  }
})();


 */

const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  try {
    console.log('🔧 11월 14일 테스트 데이터 수정 중...\n');

    await page.goto('http://localhost:3000/admin/kakao-content', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    const date = '2025-11-14';
    const monthStr = '2025-11';

    // 데이터 로드
    const loadResponse = await page.evaluate(async (month) => {
      const response = await fetch(`/api/kakao-content/calendar-load?month=${month}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });
      return {
        status: response.status,
        ok: response.ok,
        data: await response.json().catch(() => ({ error: 'JSON 파싱 실패' }))
      };
    }, monthStr);

    if (!loadResponse.ok || !loadResponse.data.success) {
      console.error('❌ 데이터 로드 실패');
      process.exit(1);
    }

    const calendarData = loadResponse.data.calendarData;

    // Account1 프로필 수정
    const account1ProfileIndex = calendarData.profileContent.account1.dailySchedule.findIndex((s) => s.date === date);
    if (account1ProfileIndex >= 0) {
      const profile = calendarData.profileContent.account1.dailySchedule[account1ProfileIndex];
      
      // 테스트 데이터 제거
      if ((profile.background?.prompt && profile.background.prompt.includes('테스트')) || 
          (profile.background?.basePrompt && profile.background.basePrompt.includes('테스트'))) {
        profile.background.prompt = null;
        profile.background.basePrompt = null;
        console.log('✅ Account1 배경 테스트 프롬프트 제거');
      }
      
      if ((profile.profile?.prompt && profile.profile.prompt.includes('테스트')) || 
          (profile.profile?.basePrompt && profile.profile.basePrompt.includes('테스트'))) {
        profile.profile.prompt = null;
        profile.profile.basePrompt = null;
        console.log('✅ Account1 프로필 테스트 프롬프트 제거');
      }
    }

    // Account2 프로필 수정
    const account2ProfileIndex = calendarData.profileContent.account2.dailySchedule.findIndex((s) => s.date === date);
    if (account2ProfileIndex >= 0) {
      const profile = calendarData.profileContent.account2.dailySchedule[account2ProfileIndex];
      
      // 테스트 메시지 제거
      if (profile.message && profile.message.includes('테스트')) {
        profile.message = '';
        console.log('✅ Account2 테스트 메시지 제거');
      }
      
      // 테스트 프롬프트 제거
      if ((profile.background?.prompt && profile.background.prompt.includes('테스트')) || 
          (profile.background?.basePrompt && profile.background.basePrompt.includes('테스트'))) {
        profile.background.prompt = null;
        profile.background.basePrompt = null;
        console.log('✅ Account2 배경 테스트 프롬프트 제거');
      }
      
      if ((profile.profile?.prompt && profile.profile.prompt.includes('테스트')) || 
          (profile.profile?.basePrompt && profile.profile.basePrompt.includes('테스트'))) {
        profile.profile.prompt = null;
        profile.profile.basePrompt = null;
        console.log('✅ Account2 프로필 테스트 프롬프트 제거');
      }
    }

    // 피드 데이터 수정
    const feedIndex = calendarData.kakaoFeed.dailySchedule.findIndex((f) => f.date === date);
    if (feedIndex >= 0) {
      const feed = calendarData.kakaoFeed.dailySchedule[feedIndex];
      
      // Account1 피드
      if (feed.account1) {
        if (feed.account1.caption && feed.account1.caption.includes('테스트')) {
          feed.account1.caption = '';
          console.log('✅ Account1 피드 테스트 캡션 제거');
        }
        if (feed.account1.imageCategory && feed.account1.imageCategory.includes('테스트')) {
          feed.account1.imageCategory = null;
          console.log('✅ Account1 피드 테스트 카테고리 제거');
        }
        if (feed.account1.imagePrompt && feed.account1.imagePrompt.includes('테스트')) {
          feed.account1.imagePrompt = null;
          console.log('✅ Account1 피드 테스트 프롬프트 제거');
        }
      }
      
      // Account2 피드
      if (feed.account2) {
        if (feed.account2.caption && feed.account2.caption.includes('테스트')) {
          feed.account2.caption = '';
          console.log('✅ Account2 피드 테스트 캡션 제거');
        }
        if (feed.account2.imageCategory && feed.account2.imageCategory.includes('테스트')) {
          feed.account2.imageCategory = null;
          console.log('✅ Account2 피드 테스트 카테고리 제거');
        }
        if (feed.account2.imagePrompt && feed.account2.imagePrompt.includes('테스트')) {
          feed.account2.imagePrompt = null;
          console.log('✅ Account2 피드 테스트 프롬프트 제거');
        }
      }
    }

    // 수정된 데이터 저장
    console.log('\n💾 수정된 데이터 저장 중...');
    const saveResponse = await page.evaluate(async (data) => {
      const response = await fetch('/api/kakao-content/calendar-save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      return {
        status: response.status,
        ok: response.ok,
        data: await response.json().catch(() => ({ error: 'JSON 파싱 실패' }))
      };
    }, { month: monthStr, calendarData });

    if (saveResponse.ok && saveResponse.data.success) {
      console.log(`✅ 저장 완료: ${saveResponse.data.savedCount}개 항목 저장`);
      console.log('\n✅ 11월 14일 테스트 데이터가 제거되었습니다.');
    } else {
      console.error('❌ 저장 실패:', saveResponse.data.message);
    }

    // 스크린샷 저장
    await page.screenshot({ path: 'test-results/fix-november-14-data-result.png', fullPage: true });
    console.log('\n✅ 스크린샷 저장: test-results/fix-november-14-data-result.png\n');

    await browser.close();

  } catch (error) {
    console.error('❌ 오류 발생:', error);
    await page.screenshot({ path: 'test-results/fix-november-14-data-error.png', fullPage: true });
    process.exit(1);
  }
})();


 */

const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  try {
    console.log('🔧 11월 14일 테스트 데이터 수정 중...\n');

    await page.goto('http://localhost:3000/admin/kakao-content', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    const date = '2025-11-14';
    const monthStr = '2025-11';

    // 데이터 로드
    const loadResponse = await page.evaluate(async (month) => {
      const response = await fetch(`/api/kakao-content/calendar-load?month=${month}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });
      return {
        status: response.status,
        ok: response.ok,
        data: await response.json().catch(() => ({ error: 'JSON 파싱 실패' }))
      };
    }, monthStr);

    if (!loadResponse.ok || !loadResponse.data.success) {
      console.error('❌ 데이터 로드 실패');
      process.exit(1);
    }

    const calendarData = loadResponse.data.calendarData;

    // Account1 프로필 수정
    const account1ProfileIndex = calendarData.profileContent.account1.dailySchedule.findIndex((s) => s.date === date);
    if (account1ProfileIndex >= 0) {
      const profile = calendarData.profileContent.account1.dailySchedule[account1ProfileIndex];
      
      // 테스트 데이터 제거
      if ((profile.background?.prompt && profile.background.prompt.includes('테스트')) || 
          (profile.background?.basePrompt && profile.background.basePrompt.includes('테스트'))) {
        profile.background.prompt = null;
        profile.background.basePrompt = null;
        console.log('✅ Account1 배경 테스트 프롬프트 제거');
      }
      
      if ((profile.profile?.prompt && profile.profile.prompt.includes('테스트')) || 
          (profile.profile?.basePrompt && profile.profile.basePrompt.includes('테스트'))) {
        profile.profile.prompt = null;
        profile.profile.basePrompt = null;
        console.log('✅ Account1 프로필 테스트 프롬프트 제거');
      }
    }

    // Account2 프로필 수정
    const account2ProfileIndex = calendarData.profileContent.account2.dailySchedule.findIndex((s) => s.date === date);
    if (account2ProfileIndex >= 0) {
      const profile = calendarData.profileContent.account2.dailySchedule[account2ProfileIndex];
      
      // 테스트 메시지 제거
      if (profile.message && profile.message.includes('테스트')) {
        profile.message = '';
        console.log('✅ Account2 테스트 메시지 제거');
      }
      
      // 테스트 프롬프트 제거
      if ((profile.background?.prompt && profile.background.prompt.includes('테스트')) || 
          (profile.background?.basePrompt && profile.background.basePrompt.includes('테스트'))) {
        profile.background.prompt = null;
        profile.background.basePrompt = null;
        console.log('✅ Account2 배경 테스트 프롬프트 제거');
      }
      
      if ((profile.profile?.prompt && profile.profile.prompt.includes('테스트')) || 
          (profile.profile?.basePrompt && profile.profile.basePrompt.includes('테스트'))) {
        profile.profile.prompt = null;
        profile.profile.basePrompt = null;
        console.log('✅ Account2 프로필 테스트 프롬프트 제거');
      }
    }

    // 피드 데이터 수정
    const feedIndex = calendarData.kakaoFeed.dailySchedule.findIndex((f) => f.date === date);
    if (feedIndex >= 0) {
      const feed = calendarData.kakaoFeed.dailySchedule[feedIndex];
      
      // Account1 피드
      if (feed.account1) {
        if (feed.account1.caption && feed.account1.caption.includes('테스트')) {
          feed.account1.caption = '';
          console.log('✅ Account1 피드 테스트 캡션 제거');
        }
        if (feed.account1.imageCategory && feed.account1.imageCategory.includes('테스트')) {
          feed.account1.imageCategory = null;
          console.log('✅ Account1 피드 테스트 카테고리 제거');
        }
        if (feed.account1.imagePrompt && feed.account1.imagePrompt.includes('테스트')) {
          feed.account1.imagePrompt = null;
          console.log('✅ Account1 피드 테스트 프롬프트 제거');
        }
      }
      
      // Account2 피드
      if (feed.account2) {
        if (feed.account2.caption && feed.account2.caption.includes('테스트')) {
          feed.account2.caption = '';
          console.log('✅ Account2 피드 테스트 캡션 제거');
        }
        if (feed.account2.imageCategory && feed.account2.imageCategory.includes('테스트')) {
          feed.account2.imageCategory = null;
          console.log('✅ Account2 피드 테스트 카테고리 제거');
        }
        if (feed.account2.imagePrompt && feed.account2.imagePrompt.includes('테스트')) {
          feed.account2.imagePrompt = null;
          console.log('✅ Account2 피드 테스트 프롬프트 제거');
        }
      }
    }

    // 수정된 데이터 저장
    console.log('\n💾 수정된 데이터 저장 중...');
    const saveResponse = await page.evaluate(async (data) => {
      const response = await fetch('/api/kakao-content/calendar-save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      return {
        status: response.status,
        ok: response.ok,
        data: await response.json().catch(() => ({ error: 'JSON 파싱 실패' }))
      };
    }, { month: monthStr, calendarData });

    if (saveResponse.ok && saveResponse.data.success) {
      console.log(`✅ 저장 완료: ${saveResponse.data.savedCount}개 항목 저장`);
      console.log('\n✅ 11월 14일 테스트 데이터가 제거되었습니다.');
    } else {
      console.error('❌ 저장 실패:', saveResponse.data.message);
    }

    // 스크린샷 저장
    await page.screenshot({ path: 'test-results/fix-november-14-data-result.png', fullPage: true });
    console.log('\n✅ 스크린샷 저장: test-results/fix-november-14-data-result.png\n');

    await browser.close();

  } catch (error) {
    console.error('❌ 오류 발생:', error);
    await page.screenshot({ path: 'test-results/fix-november-14-data-error.png', fullPage: true });
    process.exit(1);
  }
})();


 */

const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  try {
    console.log('🔧 11월 14일 테스트 데이터 수정 중...\n');

    await page.goto('http://localhost:3000/admin/kakao-content', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    const date = '2025-11-14';
    const monthStr = '2025-11';

    // 데이터 로드
    const loadResponse = await page.evaluate(async (month) => {
      const response = await fetch(`/api/kakao-content/calendar-load?month=${month}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });
      return {
        status: response.status,
        ok: response.ok,
        data: await response.json().catch(() => ({ error: 'JSON 파싱 실패' }))
      };
    }, monthStr);

    if (!loadResponse.ok || !loadResponse.data.success) {
      console.error('❌ 데이터 로드 실패');
      process.exit(1);
    }

    const calendarData = loadResponse.data.calendarData;

    // Account1 프로필 수정
    const account1ProfileIndex = calendarData.profileContent.account1.dailySchedule.findIndex((s) => s.date === date);
    if (account1ProfileIndex >= 0) {
      const profile = calendarData.profileContent.account1.dailySchedule[account1ProfileIndex];
      
      // 테스트 데이터 제거
      if ((profile.background?.prompt && profile.background.prompt.includes('테스트')) || 
          (profile.background?.basePrompt && profile.background.basePrompt.includes('테스트'))) {
        profile.background.prompt = null;
        profile.background.basePrompt = null;
        console.log('✅ Account1 배경 테스트 프롬프트 제거');
      }
      
      if ((profile.profile?.prompt && profile.profile.prompt.includes('테스트')) || 
          (profile.profile?.basePrompt && profile.profile.basePrompt.includes('테스트'))) {
        profile.profile.prompt = null;
        profile.profile.basePrompt = null;
        console.log('✅ Account1 프로필 테스트 프롬프트 제거');
      }
    }

    // Account2 프로필 수정
    const account2ProfileIndex = calendarData.profileContent.account2.dailySchedule.findIndex((s) => s.date === date);
    if (account2ProfileIndex >= 0) {
      const profile = calendarData.profileContent.account2.dailySchedule[account2ProfileIndex];
      
      // 테스트 메시지 제거
      if (profile.message && profile.message.includes('테스트')) {
        profile.message = '';
        console.log('✅ Account2 테스트 메시지 제거');
      }
      
      // 테스트 프롬프트 제거
      if ((profile.background?.prompt && profile.background.prompt.includes('테스트')) || 
          (profile.background?.basePrompt && profile.background.basePrompt.includes('테스트'))) {
        profile.background.prompt = null;
        profile.background.basePrompt = null;
        console.log('✅ Account2 배경 테스트 프롬프트 제거');
      }
      
      if ((profile.profile?.prompt && profile.profile.prompt.includes('테스트')) || 
          (profile.profile?.basePrompt && profile.profile.basePrompt.includes('테스트'))) {
        profile.profile.prompt = null;
        profile.profile.basePrompt = null;
        console.log('✅ Account2 프로필 테스트 프롬프트 제거');
      }
    }

    // 피드 데이터 수정
    const feedIndex = calendarData.kakaoFeed.dailySchedule.findIndex((f) => f.date === date);
    if (feedIndex >= 0) {
      const feed = calendarData.kakaoFeed.dailySchedule[feedIndex];
      
      // Account1 피드
      if (feed.account1) {
        if (feed.account1.caption && feed.account1.caption.includes('테스트')) {
          feed.account1.caption = '';
          console.log('✅ Account1 피드 테스트 캡션 제거');
        }
        if (feed.account1.imageCategory && feed.account1.imageCategory.includes('테스트')) {
          feed.account1.imageCategory = null;
          console.log('✅ Account1 피드 테스트 카테고리 제거');
        }
        if (feed.account1.imagePrompt && feed.account1.imagePrompt.includes('테스트')) {
          feed.account1.imagePrompt = null;
          console.log('✅ Account1 피드 테스트 프롬프트 제거');
        }
      }
      
      // Account2 피드
      if (feed.account2) {
        if (feed.account2.caption && feed.account2.caption.includes('테스트')) {
          feed.account2.caption = '';
          console.log('✅ Account2 피드 테스트 캡션 제거');
        }
        if (feed.account2.imageCategory && feed.account2.imageCategory.includes('테스트')) {
          feed.account2.imageCategory = null;
          console.log('✅ Account2 피드 테스트 카테고리 제거');
        }
        if (feed.account2.imagePrompt && feed.account2.imagePrompt.includes('테스트')) {
          feed.account2.imagePrompt = null;
          console.log('✅ Account2 피드 테스트 프롬프트 제거');
        }
      }
    }

    // 수정된 데이터 저장
    console.log('\n💾 수정된 데이터 저장 중...');
    const saveResponse = await page.evaluate(async (data) => {
      const response = await fetch('/api/kakao-content/calendar-save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      return {
        status: response.status,
        ok: response.ok,
        data: await response.json().catch(() => ({ error: 'JSON 파싱 실패' }))
      };
    }, { month: monthStr, calendarData });

    if (saveResponse.ok && saveResponse.data.success) {
      console.log(`✅ 저장 완료: ${saveResponse.data.savedCount}개 항목 저장`);
      console.log('\n✅ 11월 14일 테스트 데이터가 제거되었습니다.');
    } else {
      console.error('❌ 저장 실패:', saveResponse.data.message);
    }

    // 스크린샷 저장
    await page.screenshot({ path: 'test-results/fix-november-14-data-result.png', fullPage: true });
    console.log('\n✅ 스크린샷 저장: test-results/fix-november-14-data-result.png\n');

    await browser.close();

  } catch (error) {
    console.error('❌ 오류 발생:', error);
    await page.screenshot({ path: 'test-results/fix-november-14-data-error.png', fullPage: true });
    process.exit(1);
  }
})();



