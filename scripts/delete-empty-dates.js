/**
 * 빈 날짜 데이터 삭제 스크립트
 * 11월 10일, 11일 등 이미지가 없는 날짜 삭제
 */

const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  try {
    console.log('🗑️ 빈 날짜 데이터 삭제 시작...\n');

    await page.goto('http://localhost:3000/admin/kakao-content', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    // 삭제할 날짜 목록
    const datesToDelete = ['2025-11-10', '2025-11-11'];
    const monthStr = '2025-11';

    console.log(`삭제할 날짜: ${datesToDelete.join(', ')}\n`);

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

    // 삭제할 날짜 제거
    let deletedCount = 0;

    // 프로필 데이터에서 삭제
    for (const accountKey of ['account1', 'account2']) {
      if (calendarData.profileContent?.[accountKey]?.dailySchedule) {
        const originalLength = calendarData.profileContent[accountKey].dailySchedule.length;
        calendarData.profileContent[accountKey].dailySchedule = 
          calendarData.profileContent[accountKey].dailySchedule.filter(
            schedule => !datesToDelete.includes(schedule.date)
          );
        const newLength = calendarData.profileContent[accountKey].dailySchedule.length;
        deletedCount += (originalLength - newLength);
        console.log(`Account${accountKey === 'account1' ? '1' : '2'} 프로필: ${originalLength - newLength}개 삭제`);
      }
    }

    // 피드 데이터에서 삭제
    if (calendarData.kakaoFeed?.dailySchedule) {
      const originalLength = calendarData.kakaoFeed.dailySchedule.length;
      calendarData.kakaoFeed.dailySchedule = 
        calendarData.kakaoFeed.dailySchedule.filter(
          feed => !datesToDelete.includes(feed.date)
        );
      const newLength = calendarData.kakaoFeed.dailySchedule.length;
      deletedCount += (originalLength - newLength);
      console.log(`피드: ${originalLength - newLength}개 삭제`);
    }

    console.log(`\n총 ${deletedCount}개 항목 삭제됨\n`);

    // Supabase에서 직접 삭제
    console.log('\nSupabase에서 데이터 삭제 중...');
    const deleteResponse = await page.evaluate(async (dates) => {
      const response = await fetch('/api/kakao-content/calendar-delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dates })
      });
      return {
        status: response.status,
        ok: response.ok,
        data: await response.json().catch(() => ({ error: 'JSON 파싱 실패' }))
      };
    }, datesToDelete);

    if (deleteResponse.ok && deleteResponse.data.success) {
      console.log(`✅ Supabase 삭제 완료: ${deleteResponse.data.deletedCount}개 항목 삭제`);
      console.log(`✅ 삭제된 날짜: ${datesToDelete.join(', ')}`);
    } else {
      console.error('❌ Supabase 삭제 실패:', deleteResponse.data.message);
      if (deleteResponse.data.errors) {
        console.error('   실패 항목:', deleteResponse.data.errors);
      }
    }

    // 캘린더 데이터에서도 제거 (동기화)
    console.log('\n캘린더 데이터 동기화 중...');
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
      console.log(`✅ 캘린더 데이터 동기화 완료: ${saveResponse.data.savedCount}개 항목 저장`);
    } else {
      console.error('❌ 캘린더 데이터 동기화 실패:', saveResponse.data.message);
    }

    // 스크린샷 저장
    await page.screenshot({ path: 'test-results/delete-empty-dates-result.png', fullPage: true });
    console.log('\n✅ 스크린샷 저장: test-results/delete-empty-dates-result.png\n');

    await browser.close();

  } catch (error) {
    console.error('❌ 오류 발생:', error);
    await page.screenshot({ path: 'test-results/delete-empty-dates-error.png', fullPage: true });
    process.exit(1);
  }
})();


 * 11월 10일, 11일 등 이미지가 없는 날짜 삭제
 */

const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  try {
    console.log('🗑️ 빈 날짜 데이터 삭제 시작...\n');

    await page.goto('http://localhost:3000/admin/kakao-content', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    // 삭제할 날짜 목록
    const datesToDelete = ['2025-11-10', '2025-11-11'];
    const monthStr = '2025-11';

    console.log(`삭제할 날짜: ${datesToDelete.join(', ')}\n`);

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

    // 삭제할 날짜 제거
    let deletedCount = 0;

    // 프로필 데이터에서 삭제
    for (const accountKey of ['account1', 'account2']) {
      if (calendarData.profileContent?.[accountKey]?.dailySchedule) {
        const originalLength = calendarData.profileContent[accountKey].dailySchedule.length;
        calendarData.profileContent[accountKey].dailySchedule = 
          calendarData.profileContent[accountKey].dailySchedule.filter(
            schedule => !datesToDelete.includes(schedule.date)
          );
        const newLength = calendarData.profileContent[accountKey].dailySchedule.length;
        deletedCount += (originalLength - newLength);
        console.log(`Account${accountKey === 'account1' ? '1' : '2'} 프로필: ${originalLength - newLength}개 삭제`);
      }
    }

    // 피드 데이터에서 삭제
    if (calendarData.kakaoFeed?.dailySchedule) {
      const originalLength = calendarData.kakaoFeed.dailySchedule.length;
      calendarData.kakaoFeed.dailySchedule = 
        calendarData.kakaoFeed.dailySchedule.filter(
          feed => !datesToDelete.includes(feed.date)
        );
      const newLength = calendarData.kakaoFeed.dailySchedule.length;
      deletedCount += (originalLength - newLength);
      console.log(`피드: ${originalLength - newLength}개 삭제`);
    }

    console.log(`\n총 ${deletedCount}개 항목 삭제됨\n`);

    // Supabase에서 직접 삭제
    console.log('\nSupabase에서 데이터 삭제 중...');
    const deleteResponse = await page.evaluate(async (dates) => {
      const response = await fetch('/api/kakao-content/calendar-delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dates })
      });
      return {
        status: response.status,
        ok: response.ok,
        data: await response.json().catch(() => ({ error: 'JSON 파싱 실패' }))
      };
    }, datesToDelete);

    if (deleteResponse.ok && deleteResponse.data.success) {
      console.log(`✅ Supabase 삭제 완료: ${deleteResponse.data.deletedCount}개 항목 삭제`);
      console.log(`✅ 삭제된 날짜: ${datesToDelete.join(', ')}`);
    } else {
      console.error('❌ Supabase 삭제 실패:', deleteResponse.data.message);
      if (deleteResponse.data.errors) {
        console.error('   실패 항목:', deleteResponse.data.errors);
      }
    }

    // 캘린더 데이터에서도 제거 (동기화)
    console.log('\n캘린더 데이터 동기화 중...');
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
      console.log(`✅ 캘린더 데이터 동기화 완료: ${saveResponse.data.savedCount}개 항목 저장`);
    } else {
      console.error('❌ 캘린더 데이터 동기화 실패:', saveResponse.data.message);
    }

    // 스크린샷 저장
    await page.screenshot({ path: 'test-results/delete-empty-dates-result.png', fullPage: true });
    console.log('\n✅ 스크린샷 저장: test-results/delete-empty-dates-result.png\n');

    await browser.close();

  } catch (error) {
    console.error('❌ 오류 발생:', error);
    await page.screenshot({ path: 'test-results/delete-empty-dates-error.png', fullPage: true });
    process.exit(1);
  }
})();


 * 11월 10일, 11일 등 이미지가 없는 날짜 삭제
 */

const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  try {
    console.log('🗑️ 빈 날짜 데이터 삭제 시작...\n');

    await page.goto('http://localhost:3000/admin/kakao-content', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    // 삭제할 날짜 목록
    const datesToDelete = ['2025-11-10', '2025-11-11'];
    const monthStr = '2025-11';

    console.log(`삭제할 날짜: ${datesToDelete.join(', ')}\n`);

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

    // 삭제할 날짜 제거
    let deletedCount = 0;

    // 프로필 데이터에서 삭제
    for (const accountKey of ['account1', 'account2']) {
      if (calendarData.profileContent?.[accountKey]?.dailySchedule) {
        const originalLength = calendarData.profileContent[accountKey].dailySchedule.length;
        calendarData.profileContent[accountKey].dailySchedule = 
          calendarData.profileContent[accountKey].dailySchedule.filter(
            schedule => !datesToDelete.includes(schedule.date)
          );
        const newLength = calendarData.profileContent[accountKey].dailySchedule.length;
        deletedCount += (originalLength - newLength);
        console.log(`Account${accountKey === 'account1' ? '1' : '2'} 프로필: ${originalLength - newLength}개 삭제`);
      }
    }

    // 피드 데이터에서 삭제
    if (calendarData.kakaoFeed?.dailySchedule) {
      const originalLength = calendarData.kakaoFeed.dailySchedule.length;
      calendarData.kakaoFeed.dailySchedule = 
        calendarData.kakaoFeed.dailySchedule.filter(
          feed => !datesToDelete.includes(feed.date)
        );
      const newLength = calendarData.kakaoFeed.dailySchedule.length;
      deletedCount += (originalLength - newLength);
      console.log(`피드: ${originalLength - newLength}개 삭제`);
    }

    console.log(`\n총 ${deletedCount}개 항목 삭제됨\n`);

    // Supabase에서 직접 삭제
    console.log('\nSupabase에서 데이터 삭제 중...');
    const deleteResponse = await page.evaluate(async (dates) => {
      const response = await fetch('/api/kakao-content/calendar-delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dates })
      });
      return {
        status: response.status,
        ok: response.ok,
        data: await response.json().catch(() => ({ error: 'JSON 파싱 실패' }))
      };
    }, datesToDelete);

    if (deleteResponse.ok && deleteResponse.data.success) {
      console.log(`✅ Supabase 삭제 완료: ${deleteResponse.data.deletedCount}개 항목 삭제`);
      console.log(`✅ 삭제된 날짜: ${datesToDelete.join(', ')}`);
    } else {
      console.error('❌ Supabase 삭제 실패:', deleteResponse.data.message);
      if (deleteResponse.data.errors) {
        console.error('   실패 항목:', deleteResponse.data.errors);
      }
    }

    // 캘린더 데이터에서도 제거 (동기화)
    console.log('\n캘린더 데이터 동기화 중...');
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
      console.log(`✅ 캘린더 데이터 동기화 완료: ${saveResponse.data.savedCount}개 항목 저장`);
    } else {
      console.error('❌ 캘린더 데이터 동기화 실패:', saveResponse.data.message);
    }

    // 스크린샷 저장
    await page.screenshot({ path: 'test-results/delete-empty-dates-result.png', fullPage: true });
    console.log('\n✅ 스크린샷 저장: test-results/delete-empty-dates-result.png\n');

    await browser.close();

  } catch (error) {
    console.error('❌ 오류 발생:', error);
    await page.screenshot({ path: 'test-results/delete-empty-dates-error.png', fullPage: true });
    process.exit(1);
  }
})();


 * 11월 10일, 11일 등 이미지가 없는 날짜 삭제
 */

const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  try {
    console.log('🗑️ 빈 날짜 데이터 삭제 시작...\n');

    await page.goto('http://localhost:3000/admin/kakao-content', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    // 삭제할 날짜 목록
    const datesToDelete = ['2025-11-10', '2025-11-11'];
    const monthStr = '2025-11';

    console.log(`삭제할 날짜: ${datesToDelete.join(', ')}\n`);

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

    // 삭제할 날짜 제거
    let deletedCount = 0;

    // 프로필 데이터에서 삭제
    for (const accountKey of ['account1', 'account2']) {
      if (calendarData.profileContent?.[accountKey]?.dailySchedule) {
        const originalLength = calendarData.profileContent[accountKey].dailySchedule.length;
        calendarData.profileContent[accountKey].dailySchedule = 
          calendarData.profileContent[accountKey].dailySchedule.filter(
            schedule => !datesToDelete.includes(schedule.date)
          );
        const newLength = calendarData.profileContent[accountKey].dailySchedule.length;
        deletedCount += (originalLength - newLength);
        console.log(`Account${accountKey === 'account1' ? '1' : '2'} 프로필: ${originalLength - newLength}개 삭제`);
      }
    }

    // 피드 데이터에서 삭제
    if (calendarData.kakaoFeed?.dailySchedule) {
      const originalLength = calendarData.kakaoFeed.dailySchedule.length;
      calendarData.kakaoFeed.dailySchedule = 
        calendarData.kakaoFeed.dailySchedule.filter(
          feed => !datesToDelete.includes(feed.date)
        );
      const newLength = calendarData.kakaoFeed.dailySchedule.length;
      deletedCount += (originalLength - newLength);
      console.log(`피드: ${originalLength - newLength}개 삭제`);
    }

    console.log(`\n총 ${deletedCount}개 항목 삭제됨\n`);

    // Supabase에서 직접 삭제
    console.log('\nSupabase에서 데이터 삭제 중...');
    const deleteResponse = await page.evaluate(async (dates) => {
      const response = await fetch('/api/kakao-content/calendar-delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dates })
      });
      return {
        status: response.status,
        ok: response.ok,
        data: await response.json().catch(() => ({ error: 'JSON 파싱 실패' }))
      };
    }, datesToDelete);

    if (deleteResponse.ok && deleteResponse.data.success) {
      console.log(`✅ Supabase 삭제 완료: ${deleteResponse.data.deletedCount}개 항목 삭제`);
      console.log(`✅ 삭제된 날짜: ${datesToDelete.join(', ')}`);
    } else {
      console.error('❌ Supabase 삭제 실패:', deleteResponse.data.message);
      if (deleteResponse.data.errors) {
        console.error('   실패 항목:', deleteResponse.data.errors);
      }
    }

    // 캘린더 데이터에서도 제거 (동기화)
    console.log('\n캘린더 데이터 동기화 중...');
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
      console.log(`✅ 캘린더 데이터 동기화 완료: ${saveResponse.data.savedCount}개 항목 저장`);
    } else {
      console.error('❌ 캘린더 데이터 동기화 실패:', saveResponse.data.message);
    }

    // 스크린샷 저장
    await page.screenshot({ path: 'test-results/delete-empty-dates-result.png', fullPage: true });
    console.log('\n✅ 스크린샷 저장: test-results/delete-empty-dates-result.png\n');

    await browser.close();

  } catch (error) {
    console.error('❌ 오류 발생:', error);
    await page.screenshot({ path: 'test-results/delete-empty-dates-error.png', fullPage: true });
    process.exit(1);
  }
})();




 * 11월 10일, 11일 등 이미지가 없는 날짜 삭제
 */

const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  try {
    console.log('🗑️ 빈 날짜 데이터 삭제 시작...\n');

    await page.goto('http://localhost:3000/admin/kakao-content', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    // 삭제할 날짜 목록
    const datesToDelete = ['2025-11-10', '2025-11-11'];
    const monthStr = '2025-11';

    console.log(`삭제할 날짜: ${datesToDelete.join(', ')}\n`);

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

    // 삭제할 날짜 제거
    let deletedCount = 0;

    // 프로필 데이터에서 삭제
    for (const accountKey of ['account1', 'account2']) {
      if (calendarData.profileContent?.[accountKey]?.dailySchedule) {
        const originalLength = calendarData.profileContent[accountKey].dailySchedule.length;
        calendarData.profileContent[accountKey].dailySchedule = 
          calendarData.profileContent[accountKey].dailySchedule.filter(
            schedule => !datesToDelete.includes(schedule.date)
          );
        const newLength = calendarData.profileContent[accountKey].dailySchedule.length;
        deletedCount += (originalLength - newLength);
        console.log(`Account${accountKey === 'account1' ? '1' : '2'} 프로필: ${originalLength - newLength}개 삭제`);
      }
    }

    // 피드 데이터에서 삭제
    if (calendarData.kakaoFeed?.dailySchedule) {
      const originalLength = calendarData.kakaoFeed.dailySchedule.length;
      calendarData.kakaoFeed.dailySchedule = 
        calendarData.kakaoFeed.dailySchedule.filter(
          feed => !datesToDelete.includes(feed.date)
        );
      const newLength = calendarData.kakaoFeed.dailySchedule.length;
      deletedCount += (originalLength - newLength);
      console.log(`피드: ${originalLength - newLength}개 삭제`);
    }

    console.log(`\n총 ${deletedCount}개 항목 삭제됨\n`);

    // Supabase에서 직접 삭제
    console.log('\nSupabase에서 데이터 삭제 중...');
    const deleteResponse = await page.evaluate(async (dates) => {
      const response = await fetch('/api/kakao-content/calendar-delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dates })
      });
      return {
        status: response.status,
        ok: response.ok,
        data: await response.json().catch(() => ({ error: 'JSON 파싱 실패' }))
      };
    }, datesToDelete);

    if (deleteResponse.ok && deleteResponse.data.success) {
      console.log(`✅ Supabase 삭제 완료: ${deleteResponse.data.deletedCount}개 항목 삭제`);
      console.log(`✅ 삭제된 날짜: ${datesToDelete.join(', ')}`);
    } else {
      console.error('❌ Supabase 삭제 실패:', deleteResponse.data.message);
      if (deleteResponse.data.errors) {
        console.error('   실패 항목:', deleteResponse.data.errors);
      }
    }

    // 캘린더 데이터에서도 제거 (동기화)
    console.log('\n캘린더 데이터 동기화 중...');
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
      console.log(`✅ 캘린더 데이터 동기화 완료: ${saveResponse.data.savedCount}개 항목 저장`);
    } else {
      console.error('❌ 캘린더 데이터 동기화 실패:', saveResponse.data.message);
    }

    // 스크린샷 저장
    await page.screenshot({ path: 'test-results/delete-empty-dates-result.png', fullPage: true });
    console.log('\n✅ 스크린샷 저장: test-results/delete-empty-dates-result.png\n');

    await browser.close();

  } catch (error) {
    console.error('❌ 오류 발생:', error);
    await page.screenshot({ path: 'test-results/delete-empty-dates-error.png', fullPage: true });
    process.exit(1);
  }
})();


 * 11월 10일, 11일 등 이미지가 없는 날짜 삭제
 */

const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  try {
    console.log('🗑️ 빈 날짜 데이터 삭제 시작...\n');

    await page.goto('http://localhost:3000/admin/kakao-content', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    // 삭제할 날짜 목록
    const datesToDelete = ['2025-11-10', '2025-11-11'];
    const monthStr = '2025-11';

    console.log(`삭제할 날짜: ${datesToDelete.join(', ')}\n`);

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

    // 삭제할 날짜 제거
    let deletedCount = 0;

    // 프로필 데이터에서 삭제
    for (const accountKey of ['account1', 'account2']) {
      if (calendarData.profileContent?.[accountKey]?.dailySchedule) {
        const originalLength = calendarData.profileContent[accountKey].dailySchedule.length;
        calendarData.profileContent[accountKey].dailySchedule = 
          calendarData.profileContent[accountKey].dailySchedule.filter(
            schedule => !datesToDelete.includes(schedule.date)
          );
        const newLength = calendarData.profileContent[accountKey].dailySchedule.length;
        deletedCount += (originalLength - newLength);
        console.log(`Account${accountKey === 'account1' ? '1' : '2'} 프로필: ${originalLength - newLength}개 삭제`);
      }
    }

    // 피드 데이터에서 삭제
    if (calendarData.kakaoFeed?.dailySchedule) {
      const originalLength = calendarData.kakaoFeed.dailySchedule.length;
      calendarData.kakaoFeed.dailySchedule = 
        calendarData.kakaoFeed.dailySchedule.filter(
          feed => !datesToDelete.includes(feed.date)
        );
      const newLength = calendarData.kakaoFeed.dailySchedule.length;
      deletedCount += (originalLength - newLength);
      console.log(`피드: ${originalLength - newLength}개 삭제`);
    }

    console.log(`\n총 ${deletedCount}개 항목 삭제됨\n`);

    // Supabase에서 직접 삭제
    console.log('\nSupabase에서 데이터 삭제 중...');
    const deleteResponse = await page.evaluate(async (dates) => {
      const response = await fetch('/api/kakao-content/calendar-delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dates })
      });
      return {
        status: response.status,
        ok: response.ok,
        data: await response.json().catch(() => ({ error: 'JSON 파싱 실패' }))
      };
    }, datesToDelete);

    if (deleteResponse.ok && deleteResponse.data.success) {
      console.log(`✅ Supabase 삭제 완료: ${deleteResponse.data.deletedCount}개 항목 삭제`);
      console.log(`✅ 삭제된 날짜: ${datesToDelete.join(', ')}`);
    } else {
      console.error('❌ Supabase 삭제 실패:', deleteResponse.data.message);
      if (deleteResponse.data.errors) {
        console.error('   실패 항목:', deleteResponse.data.errors);
      }
    }

    // 캘린더 데이터에서도 제거 (동기화)
    console.log('\n캘린더 데이터 동기화 중...');
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
      console.log(`✅ 캘린더 데이터 동기화 완료: ${saveResponse.data.savedCount}개 항목 저장`);
    } else {
      console.error('❌ 캘린더 데이터 동기화 실패:', saveResponse.data.message);
    }

    // 스크린샷 저장
    await page.screenshot({ path: 'test-results/delete-empty-dates-result.png', fullPage: true });
    console.log('\n✅ 스크린샷 저장: test-results/delete-empty-dates-result.png\n');

    await browser.close();

  } catch (error) {
    console.error('❌ 오류 발생:', error);
    await page.screenshot({ path: 'test-results/delete-empty-dates-error.png', fullPage: true });
    process.exit(1);
  }
})();


 * 11월 10일, 11일 등 이미지가 없는 날짜 삭제
 */

const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  try {
    console.log('🗑️ 빈 날짜 데이터 삭제 시작...\n');

    await page.goto('http://localhost:3000/admin/kakao-content', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    // 삭제할 날짜 목록
    const datesToDelete = ['2025-11-10', '2025-11-11'];
    const monthStr = '2025-11';

    console.log(`삭제할 날짜: ${datesToDelete.join(', ')}\n`);

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

    // 삭제할 날짜 제거
    let deletedCount = 0;

    // 프로필 데이터에서 삭제
    for (const accountKey of ['account1', 'account2']) {
      if (calendarData.profileContent?.[accountKey]?.dailySchedule) {
        const originalLength = calendarData.profileContent[accountKey].dailySchedule.length;
        calendarData.profileContent[accountKey].dailySchedule = 
          calendarData.profileContent[accountKey].dailySchedule.filter(
            schedule => !datesToDelete.includes(schedule.date)
          );
        const newLength = calendarData.profileContent[accountKey].dailySchedule.length;
        deletedCount += (originalLength - newLength);
        console.log(`Account${accountKey === 'account1' ? '1' : '2'} 프로필: ${originalLength - newLength}개 삭제`);
      }
    }

    // 피드 데이터에서 삭제
    if (calendarData.kakaoFeed?.dailySchedule) {
      const originalLength = calendarData.kakaoFeed.dailySchedule.length;
      calendarData.kakaoFeed.dailySchedule = 
        calendarData.kakaoFeed.dailySchedule.filter(
          feed => !datesToDelete.includes(feed.date)
        );
      const newLength = calendarData.kakaoFeed.dailySchedule.length;
      deletedCount += (originalLength - newLength);
      console.log(`피드: ${originalLength - newLength}개 삭제`);
    }

    console.log(`\n총 ${deletedCount}개 항목 삭제됨\n`);

    // Supabase에서 직접 삭제
    console.log('\nSupabase에서 데이터 삭제 중...');
    const deleteResponse = await page.evaluate(async (dates) => {
      const response = await fetch('/api/kakao-content/calendar-delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dates })
      });
      return {
        status: response.status,
        ok: response.ok,
        data: await response.json().catch(() => ({ error: 'JSON 파싱 실패' }))
      };
    }, datesToDelete);

    if (deleteResponse.ok && deleteResponse.data.success) {
      console.log(`✅ Supabase 삭제 완료: ${deleteResponse.data.deletedCount}개 항목 삭제`);
      console.log(`✅ 삭제된 날짜: ${datesToDelete.join(', ')}`);
    } else {
      console.error('❌ Supabase 삭제 실패:', deleteResponse.data.message);
      if (deleteResponse.data.errors) {
        console.error('   실패 항목:', deleteResponse.data.errors);
      }
    }

    // 캘린더 데이터에서도 제거 (동기화)
    console.log('\n캘린더 데이터 동기화 중...');
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
      console.log(`✅ 캘린더 데이터 동기화 완료: ${saveResponse.data.savedCount}개 항목 저장`);
    } else {
      console.error('❌ 캘린더 데이터 동기화 실패:', saveResponse.data.message);
    }

    // 스크린샷 저장
    await page.screenshot({ path: 'test-results/delete-empty-dates-result.png', fullPage: true });
    console.log('\n✅ 스크린샷 저장: test-results/delete-empty-dates-result.png\n');

    await browser.close();

  } catch (error) {
    console.error('❌ 오류 발생:', error);
    await page.screenshot({ path: 'test-results/delete-empty-dates-error.png', fullPage: true });
    process.exit(1);
  }
})();


 * 11월 10일, 11일 등 이미지가 없는 날짜 삭제
 */

const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  try {
    console.log('🗑️ 빈 날짜 데이터 삭제 시작...\n');

    await page.goto('http://localhost:3000/admin/kakao-content', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    // 삭제할 날짜 목록
    const datesToDelete = ['2025-11-10', '2025-11-11'];
    const monthStr = '2025-11';

    console.log(`삭제할 날짜: ${datesToDelete.join(', ')}\n`);

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

    // 삭제할 날짜 제거
    let deletedCount = 0;

    // 프로필 데이터에서 삭제
    for (const accountKey of ['account1', 'account2']) {
      if (calendarData.profileContent?.[accountKey]?.dailySchedule) {
        const originalLength = calendarData.profileContent[accountKey].dailySchedule.length;
        calendarData.profileContent[accountKey].dailySchedule = 
          calendarData.profileContent[accountKey].dailySchedule.filter(
            schedule => !datesToDelete.includes(schedule.date)
          );
        const newLength = calendarData.profileContent[accountKey].dailySchedule.length;
        deletedCount += (originalLength - newLength);
        console.log(`Account${accountKey === 'account1' ? '1' : '2'} 프로필: ${originalLength - newLength}개 삭제`);
      }
    }

    // 피드 데이터에서 삭제
    if (calendarData.kakaoFeed?.dailySchedule) {
      const originalLength = calendarData.kakaoFeed.dailySchedule.length;
      calendarData.kakaoFeed.dailySchedule = 
        calendarData.kakaoFeed.dailySchedule.filter(
          feed => !datesToDelete.includes(feed.date)
        );
      const newLength = calendarData.kakaoFeed.dailySchedule.length;
      deletedCount += (originalLength - newLength);
      console.log(`피드: ${originalLength - newLength}개 삭제`);
    }

    console.log(`\n총 ${deletedCount}개 항목 삭제됨\n`);

    // Supabase에서 직접 삭제
    console.log('\nSupabase에서 데이터 삭제 중...');
    const deleteResponse = await page.evaluate(async (dates) => {
      const response = await fetch('/api/kakao-content/calendar-delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dates })
      });
      return {
        status: response.status,
        ok: response.ok,
        data: await response.json().catch(() => ({ error: 'JSON 파싱 실패' }))
      };
    }, datesToDelete);

    if (deleteResponse.ok && deleteResponse.data.success) {
      console.log(`✅ Supabase 삭제 완료: ${deleteResponse.data.deletedCount}개 항목 삭제`);
      console.log(`✅ 삭제된 날짜: ${datesToDelete.join(', ')}`);
    } else {
      console.error('❌ Supabase 삭제 실패:', deleteResponse.data.message);
      if (deleteResponse.data.errors) {
        console.error('   실패 항목:', deleteResponse.data.errors);
      }
    }

    // 캘린더 데이터에서도 제거 (동기화)
    console.log('\n캘린더 데이터 동기화 중...');
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
      console.log(`✅ 캘린더 데이터 동기화 완료: ${saveResponse.data.savedCount}개 항목 저장`);
    } else {
      console.error('❌ 캘린더 데이터 동기화 실패:', saveResponse.data.message);
    }

    // 스크린샷 저장
    await page.screenshot({ path: 'test-results/delete-empty-dates-result.png', fullPage: true });
    console.log('\n✅ 스크린샷 저장: test-results/delete-empty-dates-result.png\n');

    await browser.close();

  } catch (error) {
    console.error('❌ 오류 발생:', error);
    await page.screenshot({ path: 'test-results/delete-empty-dates-error.png', fullPage: true });
    process.exit(1);
  }
})();



