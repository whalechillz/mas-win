/**
 * 카카오톡 콘텐츠 데이터 상태 확인 및 미생성 날짜 체크
 */

const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  try {
    console.log('🔍 카카오톡 콘텐츠 데이터 상태 확인 중...\n');

    await page.goto('http://localhost:3000/admin/kakao-content', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    // 11월 데이터 로드
    const monthStr = '2025-11';
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
    
    // 날짜별 상태 확인
    const dateStatus = {};
    const dates = new Set();

    // 프로필 데이터 확인
    if (calendarData.profileContent) {
      for (const accountKey of ['account1', 'account2']) {
        const accountData = calendarData.profileContent[accountKey];
        if (accountData && accountData.dailySchedule) {
          for (const schedule of accountData.dailySchedule) {
            const date = schedule.date;
            dates.add(date);
            
            if (!dateStatus[date]) {
              dateStatus[date] = {
                date,
                account1: { profile: false, feed: false },
                account2: { profile: false, feed: false }
              };
            }

            const hasBackground = schedule.background?.imageUrl || schedule.background?.image;
            const hasProfile = schedule.profile?.imageUrl || schedule.profile?.image;
            const hasMessage = schedule.message;
            const isCreated = schedule.created || (hasBackground && hasProfile && hasMessage);

            if (accountKey === 'account1') {
              dateStatus[date].account1.profile = isCreated;
            } else {
              dateStatus[date].account2.profile = isCreated;
            }
          }
        }
      }
    }

    // 피드 데이터 확인
    if (calendarData.kakaoFeed && calendarData.kakaoFeed.dailySchedule) {
      for (const feed of calendarData.kakaoFeed.dailySchedule) {
        const date = feed.date;
        dates.add(date);
        
        if (!dateStatus[date]) {
          dateStatus[date] = {
            date,
            account1: { profile: false, feed: false },
            account2: { profile: false, feed: false }
          };
        }

        for (const accountKey of ['account1', 'account2']) {
          const feedData = feed[accountKey];
          if (feedData) {
            const hasImage = feedData.imageUrl || feedData.imageCategory;
            const hasCaption = feedData.caption;
            const isCreated = feedData.created || (hasImage && hasCaption);

            if (accountKey === 'account1') {
              dateStatus[date].account1.feed = isCreated;
            } else {
              dateStatus[date].account2.feed = isCreated;
            }
          }
        }
      }
    }

    // 결과 정리
    const sortedDates = Array.from(dates).sort();
    const completeDates = [];
    const incompleteDates = [];
    const emptyDates = [];

    for (const date of sortedDates) {
      const status = dateStatus[date];
      if (!status) {
        emptyDates.push(date);
        continue;
      }

      const account1Complete = status.account1.profile && status.account1.feed;
      const account2Complete = status.account2.profile && status.account2.feed;
      const bothComplete = account1Complete && account2Complete;
      const bothEmpty = !status.account1.profile && !status.account1.feed && 
                       !status.account2.profile && !status.account2.feed;

      if (bothEmpty) {
        emptyDates.push(date);
      } else if (bothComplete) {
        completeDates.push(date);
      } else {
        incompleteDates.push({
          date,
          account1: { profile: status.account1.profile, feed: status.account1.feed },
          account2: { profile: status.account2.profile, feed: status.account2.feed }
        });
      }
    }

    // 결과 출력
    console.log('📊 11월 데이터 상태 요약:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`전체 날짜: ${sortedDates.length}개`);
    console.log(`완료된 날짜: ${completeDates.length}개`);
    console.log(`미완성 날짜: ${incompleteDates.length}개`);
    console.log(`빈 날짜 (데이터 없음): ${emptyDates.length}개`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    if (emptyDates.length > 0) {
      console.log('📅 빈 날짜 (삭제 가능):');
      emptyDates.forEach(date => console.log(`   - ${date}`));
      console.log('');
    }

    if (incompleteDates.length > 0) {
      console.log('⚠️ 미완성 날짜:');
      incompleteDates.forEach(({ date, account1, account2 }) => {
        console.log(`   ${date}:`);
        console.log(`     Account1: 프로필 ${account1.profile ? '✅' : '❌'}, 피드 ${account1.feed ? '✅' : '❌'}`);
        console.log(`     Account2: 프로필 ${account2.profile ? '✅' : '❌'}, 피드 ${account2.feed ? '✅' : '❌'}`);
      });
      console.log('');
    }

    // 스크린샷 저장
    await page.screenshot({ path: 'test-results/kakao-data-status-check.png', fullPage: true });
    console.log('✅ 스크린샷 저장: test-results/kakao-data-status-check.png\n');

    // 삭제 가능한 날짜 확인
    if (emptyDates.length > 0) {
      console.log('🗑️ 삭제 가능한 날짜 목록:');
      console.log(JSON.stringify(emptyDates, null, 2));
    }

    await browser.close();

  } catch (error) {
    console.error('❌ 오류 발생:', error);
    await page.screenshot({ path: 'test-results/kakao-data-status-error.png', fullPage: true });
    process.exit(1);
  }
})();


 * 카카오톡 콘텐츠 데이터 상태 확인 및 미생성 날짜 체크
 */

const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  try {
    console.log('🔍 카카오톡 콘텐츠 데이터 상태 확인 중...\n');

    await page.goto('http://localhost:3000/admin/kakao-content', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    // 11월 데이터 로드
    const monthStr = '2025-11';
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
    
    // 날짜별 상태 확인
    const dateStatus = {};
    const dates = new Set();

    // 프로필 데이터 확인
    if (calendarData.profileContent) {
      for (const accountKey of ['account1', 'account2']) {
        const accountData = calendarData.profileContent[accountKey];
        if (accountData && accountData.dailySchedule) {
          for (const schedule of accountData.dailySchedule) {
            const date = schedule.date;
            dates.add(date);
            
            if (!dateStatus[date]) {
              dateStatus[date] = {
                date,
                account1: { profile: false, feed: false },
                account2: { profile: false, feed: false }
              };
            }

            const hasBackground = schedule.background?.imageUrl || schedule.background?.image;
            const hasProfile = schedule.profile?.imageUrl || schedule.profile?.image;
            const hasMessage = schedule.message;
            const isCreated = schedule.created || (hasBackground && hasProfile && hasMessage);

            if (accountKey === 'account1') {
              dateStatus[date].account1.profile = isCreated;
            } else {
              dateStatus[date].account2.profile = isCreated;
            }
          }
        }
      }
    }

    // 피드 데이터 확인
    if (calendarData.kakaoFeed && calendarData.kakaoFeed.dailySchedule) {
      for (const feed of calendarData.kakaoFeed.dailySchedule) {
        const date = feed.date;
        dates.add(date);
        
        if (!dateStatus[date]) {
          dateStatus[date] = {
            date,
            account1: { profile: false, feed: false },
            account2: { profile: false, feed: false }
          };
        }

        for (const accountKey of ['account1', 'account2']) {
          const feedData = feed[accountKey];
          if (feedData) {
            const hasImage = feedData.imageUrl || feedData.imageCategory;
            const hasCaption = feedData.caption;
            const isCreated = feedData.created || (hasImage && hasCaption);

            if (accountKey === 'account1') {
              dateStatus[date].account1.feed = isCreated;
            } else {
              dateStatus[date].account2.feed = isCreated;
            }
          }
        }
      }
    }

    // 결과 정리
    const sortedDates = Array.from(dates).sort();
    const completeDates = [];
    const incompleteDates = [];
    const emptyDates = [];

    for (const date of sortedDates) {
      const status = dateStatus[date];
      if (!status) {
        emptyDates.push(date);
        continue;
      }

      const account1Complete = status.account1.profile && status.account1.feed;
      const account2Complete = status.account2.profile && status.account2.feed;
      const bothComplete = account1Complete && account2Complete;
      const bothEmpty = !status.account1.profile && !status.account1.feed && 
                       !status.account2.profile && !status.account2.feed;

      if (bothEmpty) {
        emptyDates.push(date);
      } else if (bothComplete) {
        completeDates.push(date);
      } else {
        incompleteDates.push({
          date,
          account1: { profile: status.account1.profile, feed: status.account1.feed },
          account2: { profile: status.account2.profile, feed: status.account2.feed }
        });
      }
    }

    // 결과 출력
    console.log('📊 11월 데이터 상태 요약:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`전체 날짜: ${sortedDates.length}개`);
    console.log(`완료된 날짜: ${completeDates.length}개`);
    console.log(`미완성 날짜: ${incompleteDates.length}개`);
    console.log(`빈 날짜 (데이터 없음): ${emptyDates.length}개`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    if (emptyDates.length > 0) {
      console.log('📅 빈 날짜 (삭제 가능):');
      emptyDates.forEach(date => console.log(`   - ${date}`));
      console.log('');
    }

    if (incompleteDates.length > 0) {
      console.log('⚠️ 미완성 날짜:');
      incompleteDates.forEach(({ date, account1, account2 }) => {
        console.log(`   ${date}:`);
        console.log(`     Account1: 프로필 ${account1.profile ? '✅' : '❌'}, 피드 ${account1.feed ? '✅' : '❌'}`);
        console.log(`     Account2: 프로필 ${account2.profile ? '✅' : '❌'}, 피드 ${account2.feed ? '✅' : '❌'}`);
      });
      console.log('');
    }

    // 스크린샷 저장
    await page.screenshot({ path: 'test-results/kakao-data-status-check.png', fullPage: true });
    console.log('✅ 스크린샷 저장: test-results/kakao-data-status-check.png\n');

    // 삭제 가능한 날짜 확인
    if (emptyDates.length > 0) {
      console.log('🗑️ 삭제 가능한 날짜 목록:');
      console.log(JSON.stringify(emptyDates, null, 2));
    }

    await browser.close();

  } catch (error) {
    console.error('❌ 오류 발생:', error);
    await page.screenshot({ path: 'test-results/kakao-data-status-error.png', fullPage: true });
    process.exit(1);
  }
})();


 * 카카오톡 콘텐츠 데이터 상태 확인 및 미생성 날짜 체크
 */

const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  try {
    console.log('🔍 카카오톡 콘텐츠 데이터 상태 확인 중...\n');

    await page.goto('http://localhost:3000/admin/kakao-content', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    // 11월 데이터 로드
    const monthStr = '2025-11';
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
    
    // 날짜별 상태 확인
    const dateStatus = {};
    const dates = new Set();

    // 프로필 데이터 확인
    if (calendarData.profileContent) {
      for (const accountKey of ['account1', 'account2']) {
        const accountData = calendarData.profileContent[accountKey];
        if (accountData && accountData.dailySchedule) {
          for (const schedule of accountData.dailySchedule) {
            const date = schedule.date;
            dates.add(date);
            
            if (!dateStatus[date]) {
              dateStatus[date] = {
                date,
                account1: { profile: false, feed: false },
                account2: { profile: false, feed: false }
              };
            }

            const hasBackground = schedule.background?.imageUrl || schedule.background?.image;
            const hasProfile = schedule.profile?.imageUrl || schedule.profile?.image;
            const hasMessage = schedule.message;
            const isCreated = schedule.created || (hasBackground && hasProfile && hasMessage);

            if (accountKey === 'account1') {
              dateStatus[date].account1.profile = isCreated;
            } else {
              dateStatus[date].account2.profile = isCreated;
            }
          }
        }
      }
    }

    // 피드 데이터 확인
    if (calendarData.kakaoFeed && calendarData.kakaoFeed.dailySchedule) {
      for (const feed of calendarData.kakaoFeed.dailySchedule) {
        const date = feed.date;
        dates.add(date);
        
        if (!dateStatus[date]) {
          dateStatus[date] = {
            date,
            account1: { profile: false, feed: false },
            account2: { profile: false, feed: false }
          };
        }

        for (const accountKey of ['account1', 'account2']) {
          const feedData = feed[accountKey];
          if (feedData) {
            const hasImage = feedData.imageUrl || feedData.imageCategory;
            const hasCaption = feedData.caption;
            const isCreated = feedData.created || (hasImage && hasCaption);

            if (accountKey === 'account1') {
              dateStatus[date].account1.feed = isCreated;
            } else {
              dateStatus[date].account2.feed = isCreated;
            }
          }
        }
      }
    }

    // 결과 정리
    const sortedDates = Array.from(dates).sort();
    const completeDates = [];
    const incompleteDates = [];
    const emptyDates = [];

    for (const date of sortedDates) {
      const status = dateStatus[date];
      if (!status) {
        emptyDates.push(date);
        continue;
      }

      const account1Complete = status.account1.profile && status.account1.feed;
      const account2Complete = status.account2.profile && status.account2.feed;
      const bothComplete = account1Complete && account2Complete;
      const bothEmpty = !status.account1.profile && !status.account1.feed && 
                       !status.account2.profile && !status.account2.feed;

      if (bothEmpty) {
        emptyDates.push(date);
      } else if (bothComplete) {
        completeDates.push(date);
      } else {
        incompleteDates.push({
          date,
          account1: { profile: status.account1.profile, feed: status.account1.feed },
          account2: { profile: status.account2.profile, feed: status.account2.feed }
        });
      }
    }

    // 결과 출력
    console.log('📊 11월 데이터 상태 요약:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`전체 날짜: ${sortedDates.length}개`);
    console.log(`완료된 날짜: ${completeDates.length}개`);
    console.log(`미완성 날짜: ${incompleteDates.length}개`);
    console.log(`빈 날짜 (데이터 없음): ${emptyDates.length}개`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    if (emptyDates.length > 0) {
      console.log('📅 빈 날짜 (삭제 가능):');
      emptyDates.forEach(date => console.log(`   - ${date}`));
      console.log('');
    }

    if (incompleteDates.length > 0) {
      console.log('⚠️ 미완성 날짜:');
      incompleteDates.forEach(({ date, account1, account2 }) => {
        console.log(`   ${date}:`);
        console.log(`     Account1: 프로필 ${account1.profile ? '✅' : '❌'}, 피드 ${account1.feed ? '✅' : '❌'}`);
        console.log(`     Account2: 프로필 ${account2.profile ? '✅' : '❌'}, 피드 ${account2.feed ? '✅' : '❌'}`);
      });
      console.log('');
    }

    // 스크린샷 저장
    await page.screenshot({ path: 'test-results/kakao-data-status-check.png', fullPage: true });
    console.log('✅ 스크린샷 저장: test-results/kakao-data-status-check.png\n');

    // 삭제 가능한 날짜 확인
    if (emptyDates.length > 0) {
      console.log('🗑️ 삭제 가능한 날짜 목록:');
      console.log(JSON.stringify(emptyDates, null, 2));
    }

    await browser.close();

  } catch (error) {
    console.error('❌ 오류 발생:', error);
    await page.screenshot({ path: 'test-results/kakao-data-status-error.png', fullPage: true });
    process.exit(1);
  }
})();


 * 카카오톡 콘텐츠 데이터 상태 확인 및 미생성 날짜 체크
 */

const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  try {
    console.log('🔍 카카오톡 콘텐츠 데이터 상태 확인 중...\n');

    await page.goto('http://localhost:3000/admin/kakao-content', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    // 11월 데이터 로드
    const monthStr = '2025-11';
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
    
    // 날짜별 상태 확인
    const dateStatus = {};
    const dates = new Set();

    // 프로필 데이터 확인
    if (calendarData.profileContent) {
      for (const accountKey of ['account1', 'account2']) {
        const accountData = calendarData.profileContent[accountKey];
        if (accountData && accountData.dailySchedule) {
          for (const schedule of accountData.dailySchedule) {
            const date = schedule.date;
            dates.add(date);
            
            if (!dateStatus[date]) {
              dateStatus[date] = {
                date,
                account1: { profile: false, feed: false },
                account2: { profile: false, feed: false }
              };
            }

            const hasBackground = schedule.background?.imageUrl || schedule.background?.image;
            const hasProfile = schedule.profile?.imageUrl || schedule.profile?.image;
            const hasMessage = schedule.message;
            const isCreated = schedule.created || (hasBackground && hasProfile && hasMessage);

            if (accountKey === 'account1') {
              dateStatus[date].account1.profile = isCreated;
            } else {
              dateStatus[date].account2.profile = isCreated;
            }
          }
        }
      }
    }

    // 피드 데이터 확인
    if (calendarData.kakaoFeed && calendarData.kakaoFeed.dailySchedule) {
      for (const feed of calendarData.kakaoFeed.dailySchedule) {
        const date = feed.date;
        dates.add(date);
        
        if (!dateStatus[date]) {
          dateStatus[date] = {
            date,
            account1: { profile: false, feed: false },
            account2: { profile: false, feed: false }
          };
        }

        for (const accountKey of ['account1', 'account2']) {
          const feedData = feed[accountKey];
          if (feedData) {
            const hasImage = feedData.imageUrl || feedData.imageCategory;
            const hasCaption = feedData.caption;
            const isCreated = feedData.created || (hasImage && hasCaption);

            if (accountKey === 'account1') {
              dateStatus[date].account1.feed = isCreated;
            } else {
              dateStatus[date].account2.feed = isCreated;
            }
          }
        }
      }
    }

    // 결과 정리
    const sortedDates = Array.from(dates).sort();
    const completeDates = [];
    const incompleteDates = [];
    const emptyDates = [];

    for (const date of sortedDates) {
      const status = dateStatus[date];
      if (!status) {
        emptyDates.push(date);
        continue;
      }

      const account1Complete = status.account1.profile && status.account1.feed;
      const account2Complete = status.account2.profile && status.account2.feed;
      const bothComplete = account1Complete && account2Complete;
      const bothEmpty = !status.account1.profile && !status.account1.feed && 
                       !status.account2.profile && !status.account2.feed;

      if (bothEmpty) {
        emptyDates.push(date);
      } else if (bothComplete) {
        completeDates.push(date);
      } else {
        incompleteDates.push({
          date,
          account1: { profile: status.account1.profile, feed: status.account1.feed },
          account2: { profile: status.account2.profile, feed: status.account2.feed }
        });
      }
    }

    // 결과 출력
    console.log('📊 11월 데이터 상태 요약:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`전체 날짜: ${sortedDates.length}개`);
    console.log(`완료된 날짜: ${completeDates.length}개`);
    console.log(`미완성 날짜: ${incompleteDates.length}개`);
    console.log(`빈 날짜 (데이터 없음): ${emptyDates.length}개`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    if (emptyDates.length > 0) {
      console.log('📅 빈 날짜 (삭제 가능):');
      emptyDates.forEach(date => console.log(`   - ${date}`));
      console.log('');
    }

    if (incompleteDates.length > 0) {
      console.log('⚠️ 미완성 날짜:');
      incompleteDates.forEach(({ date, account1, account2 }) => {
        console.log(`   ${date}:`);
        console.log(`     Account1: 프로필 ${account1.profile ? '✅' : '❌'}, 피드 ${account1.feed ? '✅' : '❌'}`);
        console.log(`     Account2: 프로필 ${account2.profile ? '✅' : '❌'}, 피드 ${account2.feed ? '✅' : '❌'}`);
      });
      console.log('');
    }

    // 스크린샷 저장
    await page.screenshot({ path: 'test-results/kakao-data-status-check.png', fullPage: true });
    console.log('✅ 스크린샷 저장: test-results/kakao-data-status-check.png\n');

    // 삭제 가능한 날짜 확인
    if (emptyDates.length > 0) {
      console.log('🗑️ 삭제 가능한 날짜 목록:');
      console.log(JSON.stringify(emptyDates, null, 2));
    }

    await browser.close();

  } catch (error) {
    console.error('❌ 오류 발생:', error);
    await page.screenshot({ path: 'test-results/kakao-data-status-error.png', fullPage: true });
    process.exit(1);
  }
})();


 * 카카오톡 콘텐츠 데이터 상태 확인 및 미생성 날짜 체크
 */

const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  try {
    console.log('🔍 카카오톡 콘텐츠 데이터 상태 확인 중...\n');

    await page.goto('http://localhost:3000/admin/kakao-content', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    // 11월 데이터 로드
    const monthStr = '2025-11';
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
    
    // 날짜별 상태 확인
    const dateStatus = {};
    const dates = new Set();

    // 프로필 데이터 확인
    if (calendarData.profileContent) {
      for (const accountKey of ['account1', 'account2']) {
        const accountData = calendarData.profileContent[accountKey];
        if (accountData && accountData.dailySchedule) {
          for (const schedule of accountData.dailySchedule) {
            const date = schedule.date;
            dates.add(date);
            
            if (!dateStatus[date]) {
              dateStatus[date] = {
                date,
                account1: { profile: false, feed: false },
                account2: { profile: false, feed: false }
              };
            }

            const hasBackground = schedule.background?.imageUrl || schedule.background?.image;
            const hasProfile = schedule.profile?.imageUrl || schedule.profile?.image;
            const hasMessage = schedule.message;
            const isCreated = schedule.created || (hasBackground && hasProfile && hasMessage);

            if (accountKey === 'account1') {
              dateStatus[date].account1.profile = isCreated;
            } else {
              dateStatus[date].account2.profile = isCreated;
            }
          }
        }
      }
    }

    // 피드 데이터 확인
    if (calendarData.kakaoFeed && calendarData.kakaoFeed.dailySchedule) {
      for (const feed of calendarData.kakaoFeed.dailySchedule) {
        const date = feed.date;
        dates.add(date);
        
        if (!dateStatus[date]) {
          dateStatus[date] = {
            date,
            account1: { profile: false, feed: false },
            account2: { profile: false, feed: false }
          };
        }

        for (const accountKey of ['account1', 'account2']) {
          const feedData = feed[accountKey];
          if (feedData) {
            const hasImage = feedData.imageUrl || feedData.imageCategory;
            const hasCaption = feedData.caption;
            const isCreated = feedData.created || (hasImage && hasCaption);

            if (accountKey === 'account1') {
              dateStatus[date].account1.feed = isCreated;
            } else {
              dateStatus[date].account2.feed = isCreated;
            }
          }
        }
      }
    }

    // 결과 정리
    const sortedDates = Array.from(dates).sort();
    const completeDates = [];
    const incompleteDates = [];
    const emptyDates = [];

    for (const date of sortedDates) {
      const status = dateStatus[date];
      if (!status) {
        emptyDates.push(date);
        continue;
      }

      const account1Complete = status.account1.profile && status.account1.feed;
      const account2Complete = status.account2.profile && status.account2.feed;
      const bothComplete = account1Complete && account2Complete;
      const bothEmpty = !status.account1.profile && !status.account1.feed && 
                       !status.account2.profile && !status.account2.feed;

      if (bothEmpty) {
        emptyDates.push(date);
      } else if (bothComplete) {
        completeDates.push(date);
      } else {
        incompleteDates.push({
          date,
          account1: { profile: status.account1.profile, feed: status.account1.feed },
          account2: { profile: status.account2.profile, feed: status.account2.feed }
        });
      }
    }

    // 결과 출력
    console.log('📊 11월 데이터 상태 요약:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`전체 날짜: ${sortedDates.length}개`);
    console.log(`완료된 날짜: ${completeDates.length}개`);
    console.log(`미완성 날짜: ${incompleteDates.length}개`);
    console.log(`빈 날짜 (데이터 없음): ${emptyDates.length}개`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    if (emptyDates.length > 0) {
      console.log('📅 빈 날짜 (삭제 가능):');
      emptyDates.forEach(date => console.log(`   - ${date}`));
      console.log('');
    }

    if (incompleteDates.length > 0) {
      console.log('⚠️ 미완성 날짜:');
      incompleteDates.forEach(({ date, account1, account2 }) => {
        console.log(`   ${date}:`);
        console.log(`     Account1: 프로필 ${account1.profile ? '✅' : '❌'}, 피드 ${account1.feed ? '✅' : '❌'}`);
        console.log(`     Account2: 프로필 ${account2.profile ? '✅' : '❌'}, 피드 ${account2.feed ? '✅' : '❌'}`);
      });
      console.log('');
    }

    // 스크린샷 저장
    await page.screenshot({ path: 'test-results/kakao-data-status-check.png', fullPage: true });
    console.log('✅ 스크린샷 저장: test-results/kakao-data-status-check.png\n');

    // 삭제 가능한 날짜 확인
    if (emptyDates.length > 0) {
      console.log('🗑️ 삭제 가능한 날짜 목록:');
      console.log(JSON.stringify(emptyDates, null, 2));
    }

    await browser.close();

  } catch (error) {
    console.error('❌ 오류 발생:', error);
    await page.screenshot({ path: 'test-results/kakao-data-status-error.png', fullPage: true });
    process.exit(1);
  }
})();


 * 카카오톡 콘텐츠 데이터 상태 확인 및 미생성 날짜 체크
 */

const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  try {
    console.log('🔍 카카오톡 콘텐츠 데이터 상태 확인 중...\n');

    await page.goto('http://localhost:3000/admin/kakao-content', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    // 11월 데이터 로드
    const monthStr = '2025-11';
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
    
    // 날짜별 상태 확인
    const dateStatus = {};
    const dates = new Set();

    // 프로필 데이터 확인
    if (calendarData.profileContent) {
      for (const accountKey of ['account1', 'account2']) {
        const accountData = calendarData.profileContent[accountKey];
        if (accountData && accountData.dailySchedule) {
          for (const schedule of accountData.dailySchedule) {
            const date = schedule.date;
            dates.add(date);
            
            if (!dateStatus[date]) {
              dateStatus[date] = {
                date,
                account1: { profile: false, feed: false },
                account2: { profile: false, feed: false }
              };
            }

            const hasBackground = schedule.background?.imageUrl || schedule.background?.image;
            const hasProfile = schedule.profile?.imageUrl || schedule.profile?.image;
            const hasMessage = schedule.message;
            const isCreated = schedule.created || (hasBackground && hasProfile && hasMessage);

            if (accountKey === 'account1') {
              dateStatus[date].account1.profile = isCreated;
            } else {
              dateStatus[date].account2.profile = isCreated;
            }
          }
        }
      }
    }

    // 피드 데이터 확인
    if (calendarData.kakaoFeed && calendarData.kakaoFeed.dailySchedule) {
      for (const feed of calendarData.kakaoFeed.dailySchedule) {
        const date = feed.date;
        dates.add(date);
        
        if (!dateStatus[date]) {
          dateStatus[date] = {
            date,
            account1: { profile: false, feed: false },
            account2: { profile: false, feed: false }
          };
        }

        for (const accountKey of ['account1', 'account2']) {
          const feedData = feed[accountKey];
          if (feedData) {
            const hasImage = feedData.imageUrl || feedData.imageCategory;
            const hasCaption = feedData.caption;
            const isCreated = feedData.created || (hasImage && hasCaption);

            if (accountKey === 'account1') {
              dateStatus[date].account1.feed = isCreated;
            } else {
              dateStatus[date].account2.feed = isCreated;
            }
          }
        }
      }
    }

    // 결과 정리
    const sortedDates = Array.from(dates).sort();
    const completeDates = [];
    const incompleteDates = [];
    const emptyDates = [];

    for (const date of sortedDates) {
      const status = dateStatus[date];
      if (!status) {
        emptyDates.push(date);
        continue;
      }

      const account1Complete = status.account1.profile && status.account1.feed;
      const account2Complete = status.account2.profile && status.account2.feed;
      const bothComplete = account1Complete && account2Complete;
      const bothEmpty = !status.account1.profile && !status.account1.feed && 
                       !status.account2.profile && !status.account2.feed;

      if (bothEmpty) {
        emptyDates.push(date);
      } else if (bothComplete) {
        completeDates.push(date);
      } else {
        incompleteDates.push({
          date,
          account1: { profile: status.account1.profile, feed: status.account1.feed },
          account2: { profile: status.account2.profile, feed: status.account2.feed }
        });
      }
    }

    // 결과 출력
    console.log('📊 11월 데이터 상태 요약:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`전체 날짜: ${sortedDates.length}개`);
    console.log(`완료된 날짜: ${completeDates.length}개`);
    console.log(`미완성 날짜: ${incompleteDates.length}개`);
    console.log(`빈 날짜 (데이터 없음): ${emptyDates.length}개`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    if (emptyDates.length > 0) {
      console.log('📅 빈 날짜 (삭제 가능):');
      emptyDates.forEach(date => console.log(`   - ${date}`));
      console.log('');
    }

    if (incompleteDates.length > 0) {
      console.log('⚠️ 미완성 날짜:');
      incompleteDates.forEach(({ date, account1, account2 }) => {
        console.log(`   ${date}:`);
        console.log(`     Account1: 프로필 ${account1.profile ? '✅' : '❌'}, 피드 ${account1.feed ? '✅' : '❌'}`);
        console.log(`     Account2: 프로필 ${account2.profile ? '✅' : '❌'}, 피드 ${account2.feed ? '✅' : '❌'}`);
      });
      console.log('');
    }

    // 스크린샷 저장
    await page.screenshot({ path: 'test-results/kakao-data-status-check.png', fullPage: true });
    console.log('✅ 스크린샷 저장: test-results/kakao-data-status-check.png\n');

    // 삭제 가능한 날짜 확인
    if (emptyDates.length > 0) {
      console.log('🗑️ 삭제 가능한 날짜 목록:');
      console.log(JSON.stringify(emptyDates, null, 2));
    }

    await browser.close();

  } catch (error) {
    console.error('❌ 오류 발생:', error);
    await page.screenshot({ path: 'test-results/kakao-data-status-error.png', fullPage: true });
    process.exit(1);
  }
})();


 * 카카오톡 콘텐츠 데이터 상태 확인 및 미생성 날짜 체크
 */

const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  try {
    console.log('🔍 카카오톡 콘텐츠 데이터 상태 확인 중...\n');

    await page.goto('http://localhost:3000/admin/kakao-content', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    // 11월 데이터 로드
    const monthStr = '2025-11';
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
    
    // 날짜별 상태 확인
    const dateStatus = {};
    const dates = new Set();

    // 프로필 데이터 확인
    if (calendarData.profileContent) {
      for (const accountKey of ['account1', 'account2']) {
        const accountData = calendarData.profileContent[accountKey];
        if (accountData && accountData.dailySchedule) {
          for (const schedule of accountData.dailySchedule) {
            const date = schedule.date;
            dates.add(date);
            
            if (!dateStatus[date]) {
              dateStatus[date] = {
                date,
                account1: { profile: false, feed: false },
                account2: { profile: false, feed: false }
              };
            }

            const hasBackground = schedule.background?.imageUrl || schedule.background?.image;
            const hasProfile = schedule.profile?.imageUrl || schedule.profile?.image;
            const hasMessage = schedule.message;
            const isCreated = schedule.created || (hasBackground && hasProfile && hasMessage);

            if (accountKey === 'account1') {
              dateStatus[date].account1.profile = isCreated;
            } else {
              dateStatus[date].account2.profile = isCreated;
            }
          }
        }
      }
    }

    // 피드 데이터 확인
    if (calendarData.kakaoFeed && calendarData.kakaoFeed.dailySchedule) {
      for (const feed of calendarData.kakaoFeed.dailySchedule) {
        const date = feed.date;
        dates.add(date);
        
        if (!dateStatus[date]) {
          dateStatus[date] = {
            date,
            account1: { profile: false, feed: false },
            account2: { profile: false, feed: false }
          };
        }

        for (const accountKey of ['account1', 'account2']) {
          const feedData = feed[accountKey];
          if (feedData) {
            const hasImage = feedData.imageUrl || feedData.imageCategory;
            const hasCaption = feedData.caption;
            const isCreated = feedData.created || (hasImage && hasCaption);

            if (accountKey === 'account1') {
              dateStatus[date].account1.feed = isCreated;
            } else {
              dateStatus[date].account2.feed = isCreated;
            }
          }
        }
      }
    }

    // 결과 정리
    const sortedDates = Array.from(dates).sort();
    const completeDates = [];
    const incompleteDates = [];
    const emptyDates = [];

    for (const date of sortedDates) {
      const status = dateStatus[date];
      if (!status) {
        emptyDates.push(date);
        continue;
      }

      const account1Complete = status.account1.profile && status.account1.feed;
      const account2Complete = status.account2.profile && status.account2.feed;
      const bothComplete = account1Complete && account2Complete;
      const bothEmpty = !status.account1.profile && !status.account1.feed && 
                       !status.account2.profile && !status.account2.feed;

      if (bothEmpty) {
        emptyDates.push(date);
      } else if (bothComplete) {
        completeDates.push(date);
      } else {
        incompleteDates.push({
          date,
          account1: { profile: status.account1.profile, feed: status.account1.feed },
          account2: { profile: status.account2.profile, feed: status.account2.feed }
        });
      }
    }

    // 결과 출력
    console.log('📊 11월 데이터 상태 요약:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`전체 날짜: ${sortedDates.length}개`);
    console.log(`완료된 날짜: ${completeDates.length}개`);
    console.log(`미완성 날짜: ${incompleteDates.length}개`);
    console.log(`빈 날짜 (데이터 없음): ${emptyDates.length}개`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    if (emptyDates.length > 0) {
      console.log('📅 빈 날짜 (삭제 가능):');
      emptyDates.forEach(date => console.log(`   - ${date}`));
      console.log('');
    }

    if (incompleteDates.length > 0) {
      console.log('⚠️ 미완성 날짜:');
      incompleteDates.forEach(({ date, account1, account2 }) => {
        console.log(`   ${date}:`);
        console.log(`     Account1: 프로필 ${account1.profile ? '✅' : '❌'}, 피드 ${account1.feed ? '✅' : '❌'}`);
        console.log(`     Account2: 프로필 ${account2.profile ? '✅' : '❌'}, 피드 ${account2.feed ? '✅' : '❌'}`);
      });
      console.log('');
    }

    // 스크린샷 저장
    await page.screenshot({ path: 'test-results/kakao-data-status-check.png', fullPage: true });
    console.log('✅ 스크린샷 저장: test-results/kakao-data-status-check.png\n');

    // 삭제 가능한 날짜 확인
    if (emptyDates.length > 0) {
      console.log('🗑️ 삭제 가능한 날짜 목록:');
      console.log(JSON.stringify(emptyDates, null, 2));
    }

    await browser.close();

  } catch (error) {
    console.error('❌ 오류 발생:', error);
    await page.screenshot({ path: 'test-results/kakao-data-status-error.png', fullPage: true });
    process.exit(1);
  }
})();


 * 카카오톡 콘텐츠 데이터 상태 확인 및 미생성 날짜 체크
 */

const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  try {
    console.log('🔍 카카오톡 콘텐츠 데이터 상태 확인 중...\n');

    await page.goto('http://localhost:3000/admin/kakao-content', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    // 11월 데이터 로드
    const monthStr = '2025-11';
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
    
    // 날짜별 상태 확인
    const dateStatus = {};
    const dates = new Set();

    // 프로필 데이터 확인
    if (calendarData.profileContent) {
      for (const accountKey of ['account1', 'account2']) {
        const accountData = calendarData.profileContent[accountKey];
        if (accountData && accountData.dailySchedule) {
          for (const schedule of accountData.dailySchedule) {
            const date = schedule.date;
            dates.add(date);
            
            if (!dateStatus[date]) {
              dateStatus[date] = {
                date,
                account1: { profile: false, feed: false },
                account2: { profile: false, feed: false }
              };
            }

            const hasBackground = schedule.background?.imageUrl || schedule.background?.image;
            const hasProfile = schedule.profile?.imageUrl || schedule.profile?.image;
            const hasMessage = schedule.message;
            const isCreated = schedule.created || (hasBackground && hasProfile && hasMessage);

            if (accountKey === 'account1') {
              dateStatus[date].account1.profile = isCreated;
            } else {
              dateStatus[date].account2.profile = isCreated;
            }
          }
        }
      }
    }

    // 피드 데이터 확인
    if (calendarData.kakaoFeed && calendarData.kakaoFeed.dailySchedule) {
      for (const feed of calendarData.kakaoFeed.dailySchedule) {
        const date = feed.date;
        dates.add(date);
        
        if (!dateStatus[date]) {
          dateStatus[date] = {
            date,
            account1: { profile: false, feed: false },
            account2: { profile: false, feed: false }
          };
        }

        for (const accountKey of ['account1', 'account2']) {
          const feedData = feed[accountKey];
          if (feedData) {
            const hasImage = feedData.imageUrl || feedData.imageCategory;
            const hasCaption = feedData.caption;
            const isCreated = feedData.created || (hasImage && hasCaption);

            if (accountKey === 'account1') {
              dateStatus[date].account1.feed = isCreated;
            } else {
              dateStatus[date].account2.feed = isCreated;
            }
          }
        }
      }
    }

    // 결과 정리
    const sortedDates = Array.from(dates).sort();
    const completeDates = [];
    const incompleteDates = [];
    const emptyDates = [];

    for (const date of sortedDates) {
      const status = dateStatus[date];
      if (!status) {
        emptyDates.push(date);
        continue;
      }

      const account1Complete = status.account1.profile && status.account1.feed;
      const account2Complete = status.account2.profile && status.account2.feed;
      const bothComplete = account1Complete && account2Complete;
      const bothEmpty = !status.account1.profile && !status.account1.feed && 
                       !status.account2.profile && !status.account2.feed;

      if (bothEmpty) {
        emptyDates.push(date);
      } else if (bothComplete) {
        completeDates.push(date);
      } else {
        incompleteDates.push({
          date,
          account1: { profile: status.account1.profile, feed: status.account1.feed },
          account2: { profile: status.account2.profile, feed: status.account2.feed }
        });
      }
    }

    // 결과 출력
    console.log('📊 11월 데이터 상태 요약:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`전체 날짜: ${sortedDates.length}개`);
    console.log(`완료된 날짜: ${completeDates.length}개`);
    console.log(`미완성 날짜: ${incompleteDates.length}개`);
    console.log(`빈 날짜 (데이터 없음): ${emptyDates.length}개`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    if (emptyDates.length > 0) {
      console.log('📅 빈 날짜 (삭제 가능):');
      emptyDates.forEach(date => console.log(`   - ${date}`));
      console.log('');
    }

    if (incompleteDates.length > 0) {
      console.log('⚠️ 미완성 날짜:');
      incompleteDates.forEach(({ date, account1, account2 }) => {
        console.log(`   ${date}:`);
        console.log(`     Account1: 프로필 ${account1.profile ? '✅' : '❌'}, 피드 ${account1.feed ? '✅' : '❌'}`);
        console.log(`     Account2: 프로필 ${account2.profile ? '✅' : '❌'}, 피드 ${account2.feed ? '✅' : '❌'}`);
      });
      console.log('');
    }

    // 스크린샷 저장
    await page.screenshot({ path: 'test-results/kakao-data-status-check.png', fullPage: true });
    console.log('✅ 스크린샷 저장: test-results/kakao-data-status-check.png\n');

    // 삭제 가능한 날짜 확인
    if (emptyDates.length > 0) {
      console.log('🗑️ 삭제 가능한 날짜 목록:');
      console.log(JSON.stringify(emptyDates, null, 2));
    }

    await browser.close();

  } catch (error) {
    console.error('❌ 오류 발생:', error);
    await page.screenshot({ path: 'test-results/kakao-data-status-error.png', fullPage: true });
    process.exit(1);
  }
})();



 * 카카오톡 콘텐츠 데이터 상태 확인 및 미생성 날짜 체크
 */

const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  try {
    console.log('🔍 카카오톡 콘텐츠 데이터 상태 확인 중...\n');

    await page.goto('http://localhost:3000/admin/kakao-content', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    // 11월 데이터 로드
    const monthStr = '2025-11';
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
    
    // 날짜별 상태 확인
    const dateStatus = {};
    const dates = new Set();

    // 프로필 데이터 확인
    if (calendarData.profileContent) {
      for (const accountKey of ['account1', 'account2']) {
        const accountData = calendarData.profileContent[accountKey];
        if (accountData && accountData.dailySchedule) {
          for (const schedule of accountData.dailySchedule) {
            const date = schedule.date;
            dates.add(date);
            
            if (!dateStatus[date]) {
              dateStatus[date] = {
                date,
                account1: { profile: false, feed: false },
                account2: { profile: false, feed: false }
              };
            }

            const hasBackground = schedule.background?.imageUrl || schedule.background?.image;
            const hasProfile = schedule.profile?.imageUrl || schedule.profile?.image;
            const hasMessage = schedule.message;
            const isCreated = schedule.created || (hasBackground && hasProfile && hasMessage);

            if (accountKey === 'account1') {
              dateStatus[date].account1.profile = isCreated;
            } else {
              dateStatus[date].account2.profile = isCreated;
            }
          }
        }
      }
    }

    // 피드 데이터 확인
    if (calendarData.kakaoFeed && calendarData.kakaoFeed.dailySchedule) {
      for (const feed of calendarData.kakaoFeed.dailySchedule) {
        const date = feed.date;
        dates.add(date);
        
        if (!dateStatus[date]) {
          dateStatus[date] = {
            date,
            account1: { profile: false, feed: false },
            account2: { profile: false, feed: false }
          };
        }

        for (const accountKey of ['account1', 'account2']) {
          const feedData = feed[accountKey];
          if (feedData) {
            const hasImage = feedData.imageUrl || feedData.imageCategory;
            const hasCaption = feedData.caption;
            const isCreated = feedData.created || (hasImage && hasCaption);

            if (accountKey === 'account1') {
              dateStatus[date].account1.feed = isCreated;
            } else {
              dateStatus[date].account2.feed = isCreated;
            }
          }
        }
      }
    }

    // 결과 정리
    const sortedDates = Array.from(dates).sort();
    const completeDates = [];
    const incompleteDates = [];
    const emptyDates = [];

    for (const date of sortedDates) {
      const status = dateStatus[date];
      if (!status) {
        emptyDates.push(date);
        continue;
      }

      const account1Complete = status.account1.profile && status.account1.feed;
      const account2Complete = status.account2.profile && status.account2.feed;
      const bothComplete = account1Complete && account2Complete;
      const bothEmpty = !status.account1.profile && !status.account1.feed && 
                       !status.account2.profile && !status.account2.feed;

      if (bothEmpty) {
        emptyDates.push(date);
      } else if (bothComplete) {
        completeDates.push(date);
      } else {
        incompleteDates.push({
          date,
          account1: { profile: status.account1.profile, feed: status.account1.feed },
          account2: { profile: status.account2.profile, feed: status.account2.feed }
        });
      }
    }

    // 결과 출력
    console.log('📊 11월 데이터 상태 요약:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`전체 날짜: ${sortedDates.length}개`);
    console.log(`완료된 날짜: ${completeDates.length}개`);
    console.log(`미완성 날짜: ${incompleteDates.length}개`);
    console.log(`빈 날짜 (데이터 없음): ${emptyDates.length}개`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    if (emptyDates.length > 0) {
      console.log('📅 빈 날짜 (삭제 가능):');
      emptyDates.forEach(date => console.log(`   - ${date}`));
      console.log('');
    }

    if (incompleteDates.length > 0) {
      console.log('⚠️ 미완성 날짜:');
      incompleteDates.forEach(({ date, account1, account2 }) => {
        console.log(`   ${date}:`);
        console.log(`     Account1: 프로필 ${account1.profile ? '✅' : '❌'}, 피드 ${account1.feed ? '✅' : '❌'}`);
        console.log(`     Account2: 프로필 ${account2.profile ? '✅' : '❌'}, 피드 ${account2.feed ? '✅' : '❌'}`);
      });
      console.log('');
    }

    // 스크린샷 저장
    await page.screenshot({ path: 'test-results/kakao-data-status-check.png', fullPage: true });
    console.log('✅ 스크린샷 저장: test-results/kakao-data-status-check.png\n');

    // 삭제 가능한 날짜 확인
    if (emptyDates.length > 0) {
      console.log('🗑️ 삭제 가능한 날짜 목록:');
      console.log(JSON.stringify(emptyDates, null, 2));
    }

    await browser.close();

  } catch (error) {
    console.error('❌ 오류 발생:', error);
    await page.screenshot({ path: 'test-results/kakao-data-status-error.png', fullPage: true });
    process.exit(1);
  }
})();


 * 카카오톡 콘텐츠 데이터 상태 확인 및 미생성 날짜 체크
 */

const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  try {
    console.log('🔍 카카오톡 콘텐츠 데이터 상태 확인 중...\n');

    await page.goto('http://localhost:3000/admin/kakao-content', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    // 11월 데이터 로드
    const monthStr = '2025-11';
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
    
    // 날짜별 상태 확인
    const dateStatus = {};
    const dates = new Set();

    // 프로필 데이터 확인
    if (calendarData.profileContent) {
      for (const accountKey of ['account1', 'account2']) {
        const accountData = calendarData.profileContent[accountKey];
        if (accountData && accountData.dailySchedule) {
          for (const schedule of accountData.dailySchedule) {
            const date = schedule.date;
            dates.add(date);
            
            if (!dateStatus[date]) {
              dateStatus[date] = {
                date,
                account1: { profile: false, feed: false },
                account2: { profile: false, feed: false }
              };
            }

            const hasBackground = schedule.background?.imageUrl || schedule.background?.image;
            const hasProfile = schedule.profile?.imageUrl || schedule.profile?.image;
            const hasMessage = schedule.message;
            const isCreated = schedule.created || (hasBackground && hasProfile && hasMessage);

            if (accountKey === 'account1') {
              dateStatus[date].account1.profile = isCreated;
            } else {
              dateStatus[date].account2.profile = isCreated;
            }
          }
        }
      }
    }

    // 피드 데이터 확인
    if (calendarData.kakaoFeed && calendarData.kakaoFeed.dailySchedule) {
      for (const feed of calendarData.kakaoFeed.dailySchedule) {
        const date = feed.date;
        dates.add(date);
        
        if (!dateStatus[date]) {
          dateStatus[date] = {
            date,
            account1: { profile: false, feed: false },
            account2: { profile: false, feed: false }
          };
        }

        for (const accountKey of ['account1', 'account2']) {
          const feedData = feed[accountKey];
          if (feedData) {
            const hasImage = feedData.imageUrl || feedData.imageCategory;
            const hasCaption = feedData.caption;
            const isCreated = feedData.created || (hasImage && hasCaption);

            if (accountKey === 'account1') {
              dateStatus[date].account1.feed = isCreated;
            } else {
              dateStatus[date].account2.feed = isCreated;
            }
          }
        }
      }
    }

    // 결과 정리
    const sortedDates = Array.from(dates).sort();
    const completeDates = [];
    const incompleteDates = [];
    const emptyDates = [];

    for (const date of sortedDates) {
      const status = dateStatus[date];
      if (!status) {
        emptyDates.push(date);
        continue;
      }

      const account1Complete = status.account1.profile && status.account1.feed;
      const account2Complete = status.account2.profile && status.account2.feed;
      const bothComplete = account1Complete && account2Complete;
      const bothEmpty = !status.account1.profile && !status.account1.feed && 
                       !status.account2.profile && !status.account2.feed;

      if (bothEmpty) {
        emptyDates.push(date);
      } else if (bothComplete) {
        completeDates.push(date);
      } else {
        incompleteDates.push({
          date,
          account1: { profile: status.account1.profile, feed: status.account1.feed },
          account2: { profile: status.account2.profile, feed: status.account2.feed }
        });
      }
    }

    // 결과 출력
    console.log('📊 11월 데이터 상태 요약:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`전체 날짜: ${sortedDates.length}개`);
    console.log(`완료된 날짜: ${completeDates.length}개`);
    console.log(`미완성 날짜: ${incompleteDates.length}개`);
    console.log(`빈 날짜 (데이터 없음): ${emptyDates.length}개`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    if (emptyDates.length > 0) {
      console.log('📅 빈 날짜 (삭제 가능):');
      emptyDates.forEach(date => console.log(`   - ${date}`));
      console.log('');
    }

    if (incompleteDates.length > 0) {
      console.log('⚠️ 미완성 날짜:');
      incompleteDates.forEach(({ date, account1, account2 }) => {
        console.log(`   ${date}:`);
        console.log(`     Account1: 프로필 ${account1.profile ? '✅' : '❌'}, 피드 ${account1.feed ? '✅' : '❌'}`);
        console.log(`     Account2: 프로필 ${account2.profile ? '✅' : '❌'}, 피드 ${account2.feed ? '✅' : '❌'}`);
      });
      console.log('');
    }

    // 스크린샷 저장
    await page.screenshot({ path: 'test-results/kakao-data-status-check.png', fullPage: true });
    console.log('✅ 스크린샷 저장: test-results/kakao-data-status-check.png\n');

    // 삭제 가능한 날짜 확인
    if (emptyDates.length > 0) {
      console.log('🗑️ 삭제 가능한 날짜 목록:');
      console.log(JSON.stringify(emptyDates, null, 2));
    }

    await browser.close();

  } catch (error) {
    console.error('❌ 오류 발생:', error);
    await page.screenshot({ path: 'test-results/kakao-data-status-error.png', fullPage: true });
    process.exit(1);
  }
})();


 * 카카오톡 콘텐츠 데이터 상태 확인 및 미생성 날짜 체크
 */

const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  try {
    console.log('🔍 카카오톡 콘텐츠 데이터 상태 확인 중...\n');

    await page.goto('http://localhost:3000/admin/kakao-content', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    // 11월 데이터 로드
    const monthStr = '2025-11';
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
    
    // 날짜별 상태 확인
    const dateStatus = {};
    const dates = new Set();

    // 프로필 데이터 확인
    if (calendarData.profileContent) {
      for (const accountKey of ['account1', 'account2']) {
        const accountData = calendarData.profileContent[accountKey];
        if (accountData && accountData.dailySchedule) {
          for (const schedule of accountData.dailySchedule) {
            const date = schedule.date;
            dates.add(date);
            
            if (!dateStatus[date]) {
              dateStatus[date] = {
                date,
                account1: { profile: false, feed: false },
                account2: { profile: false, feed: false }
              };
            }

            const hasBackground = schedule.background?.imageUrl || schedule.background?.image;
            const hasProfile = schedule.profile?.imageUrl || schedule.profile?.image;
            const hasMessage = schedule.message;
            const isCreated = schedule.created || (hasBackground && hasProfile && hasMessage);

            if (accountKey === 'account1') {
              dateStatus[date].account1.profile = isCreated;
            } else {
              dateStatus[date].account2.profile = isCreated;
            }
          }
        }
      }
    }

    // 피드 데이터 확인
    if (calendarData.kakaoFeed && calendarData.kakaoFeed.dailySchedule) {
      for (const feed of calendarData.kakaoFeed.dailySchedule) {
        const date = feed.date;
        dates.add(date);
        
        if (!dateStatus[date]) {
          dateStatus[date] = {
            date,
            account1: { profile: false, feed: false },
            account2: { profile: false, feed: false }
          };
        }

        for (const accountKey of ['account1', 'account2']) {
          const feedData = feed[accountKey];
          if (feedData) {
            const hasImage = feedData.imageUrl || feedData.imageCategory;
            const hasCaption = feedData.caption;
            const isCreated = feedData.created || (hasImage && hasCaption);

            if (accountKey === 'account1') {
              dateStatus[date].account1.feed = isCreated;
            } else {
              dateStatus[date].account2.feed = isCreated;
            }
          }
        }
      }
    }

    // 결과 정리
    const sortedDates = Array.from(dates).sort();
    const completeDates = [];
    const incompleteDates = [];
    const emptyDates = [];

    for (const date of sortedDates) {
      const status = dateStatus[date];
      if (!status) {
        emptyDates.push(date);
        continue;
      }

      const account1Complete = status.account1.profile && status.account1.feed;
      const account2Complete = status.account2.profile && status.account2.feed;
      const bothComplete = account1Complete && account2Complete;
      const bothEmpty = !status.account1.profile && !status.account1.feed && 
                       !status.account2.profile && !status.account2.feed;

      if (bothEmpty) {
        emptyDates.push(date);
      } else if (bothComplete) {
        completeDates.push(date);
      } else {
        incompleteDates.push({
          date,
          account1: { profile: status.account1.profile, feed: status.account1.feed },
          account2: { profile: status.account2.profile, feed: status.account2.feed }
        });
      }
    }

    // 결과 출력
    console.log('📊 11월 데이터 상태 요약:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`전체 날짜: ${sortedDates.length}개`);
    console.log(`완료된 날짜: ${completeDates.length}개`);
    console.log(`미완성 날짜: ${incompleteDates.length}개`);
    console.log(`빈 날짜 (데이터 없음): ${emptyDates.length}개`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    if (emptyDates.length > 0) {
      console.log('📅 빈 날짜 (삭제 가능):');
      emptyDates.forEach(date => console.log(`   - ${date}`));
      console.log('');
    }

    if (incompleteDates.length > 0) {
      console.log('⚠️ 미완성 날짜:');
      incompleteDates.forEach(({ date, account1, account2 }) => {
        console.log(`   ${date}:`);
        console.log(`     Account1: 프로필 ${account1.profile ? '✅' : '❌'}, 피드 ${account1.feed ? '✅' : '❌'}`);
        console.log(`     Account2: 프로필 ${account2.profile ? '✅' : '❌'}, 피드 ${account2.feed ? '✅' : '❌'}`);
      });
      console.log('');
    }

    // 스크린샷 저장
    await page.screenshot({ path: 'test-results/kakao-data-status-check.png', fullPage: true });
    console.log('✅ 스크린샷 저장: test-results/kakao-data-status-check.png\n');

    // 삭제 가능한 날짜 확인
    if (emptyDates.length > 0) {
      console.log('🗑️ 삭제 가능한 날짜 목록:');
      console.log(JSON.stringify(emptyDates, null, 2));
    }

    await browser.close();

  } catch (error) {
    console.error('❌ 오류 발생:', error);
    await page.screenshot({ path: 'test-results/kakao-data-status-error.png', fullPage: true });
    process.exit(1);
  }
})();


 * 카카오톡 콘텐츠 데이터 상태 확인 및 미생성 날짜 체크
 */

const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  try {
    console.log('🔍 카카오톡 콘텐츠 데이터 상태 확인 중...\n');

    await page.goto('http://localhost:3000/admin/kakao-content', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    // 11월 데이터 로드
    const monthStr = '2025-11';
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
    
    // 날짜별 상태 확인
    const dateStatus = {};
    const dates = new Set();

    // 프로필 데이터 확인
    if (calendarData.profileContent) {
      for (const accountKey of ['account1', 'account2']) {
        const accountData = calendarData.profileContent[accountKey];
        if (accountData && accountData.dailySchedule) {
          for (const schedule of accountData.dailySchedule) {
            const date = schedule.date;
            dates.add(date);
            
            if (!dateStatus[date]) {
              dateStatus[date] = {
                date,
                account1: { profile: false, feed: false },
                account2: { profile: false, feed: false }
              };
            }

            const hasBackground = schedule.background?.imageUrl || schedule.background?.image;
            const hasProfile = schedule.profile?.imageUrl || schedule.profile?.image;
            const hasMessage = schedule.message;
            const isCreated = schedule.created || (hasBackground && hasProfile && hasMessage);

            if (accountKey === 'account1') {
              dateStatus[date].account1.profile = isCreated;
            } else {
              dateStatus[date].account2.profile = isCreated;
            }
          }
        }
      }
    }

    // 피드 데이터 확인
    if (calendarData.kakaoFeed && calendarData.kakaoFeed.dailySchedule) {
      for (const feed of calendarData.kakaoFeed.dailySchedule) {
        const date = feed.date;
        dates.add(date);
        
        if (!dateStatus[date]) {
          dateStatus[date] = {
            date,
            account1: { profile: false, feed: false },
            account2: { profile: false, feed: false }
          };
        }

        for (const accountKey of ['account1', 'account2']) {
          const feedData = feed[accountKey];
          if (feedData) {
            const hasImage = feedData.imageUrl || feedData.imageCategory;
            const hasCaption = feedData.caption;
            const isCreated = feedData.created || (hasImage && hasCaption);

            if (accountKey === 'account1') {
              dateStatus[date].account1.feed = isCreated;
            } else {
              dateStatus[date].account2.feed = isCreated;
            }
          }
        }
      }
    }

    // 결과 정리
    const sortedDates = Array.from(dates).sort();
    const completeDates = [];
    const incompleteDates = [];
    const emptyDates = [];

    for (const date of sortedDates) {
      const status = dateStatus[date];
      if (!status) {
        emptyDates.push(date);
        continue;
      }

      const account1Complete = status.account1.profile && status.account1.feed;
      const account2Complete = status.account2.profile && status.account2.feed;
      const bothComplete = account1Complete && account2Complete;
      const bothEmpty = !status.account1.profile && !status.account1.feed && 
                       !status.account2.profile && !status.account2.feed;

      if (bothEmpty) {
        emptyDates.push(date);
      } else if (bothComplete) {
        completeDates.push(date);
      } else {
        incompleteDates.push({
          date,
          account1: { profile: status.account1.profile, feed: status.account1.feed },
          account2: { profile: status.account2.profile, feed: status.account2.feed }
        });
      }
    }

    // 결과 출력
    console.log('📊 11월 데이터 상태 요약:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`전체 날짜: ${sortedDates.length}개`);
    console.log(`완료된 날짜: ${completeDates.length}개`);
    console.log(`미완성 날짜: ${incompleteDates.length}개`);
    console.log(`빈 날짜 (데이터 없음): ${emptyDates.length}개`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    if (emptyDates.length > 0) {
      console.log('📅 빈 날짜 (삭제 가능):');
      emptyDates.forEach(date => console.log(`   - ${date}`));
      console.log('');
    }

    if (incompleteDates.length > 0) {
      console.log('⚠️ 미완성 날짜:');
      incompleteDates.forEach(({ date, account1, account2 }) => {
        console.log(`   ${date}:`);
        console.log(`     Account1: 프로필 ${account1.profile ? '✅' : '❌'}, 피드 ${account1.feed ? '✅' : '❌'}`);
        console.log(`     Account2: 프로필 ${account2.profile ? '✅' : '❌'}, 피드 ${account2.feed ? '✅' : '❌'}`);
      });
      console.log('');
    }

    // 스크린샷 저장
    await page.screenshot({ path: 'test-results/kakao-data-status-check.png', fullPage: true });
    console.log('✅ 스크린샷 저장: test-results/kakao-data-status-check.png\n');

    // 삭제 가능한 날짜 확인
    if (emptyDates.length > 0) {
      console.log('🗑️ 삭제 가능한 날짜 목록:');
      console.log(JSON.stringify(emptyDates, null, 2));
    }

    await browser.close();

  } catch (error) {
    console.error('❌ 오류 발생:', error);
    await page.screenshot({ path: 'test-results/kakao-data-status-error.png', fullPage: true });
    process.exit(1);
  }
})();


 * 카카오톡 콘텐츠 데이터 상태 확인 및 미생성 날짜 체크
 */

const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  try {
    console.log('🔍 카카오톡 콘텐츠 데이터 상태 확인 중...\n');

    await page.goto('http://localhost:3000/admin/kakao-content', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    // 11월 데이터 로드
    const monthStr = '2025-11';
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
    
    // 날짜별 상태 확인
    const dateStatus = {};
    const dates = new Set();

    // 프로필 데이터 확인
    if (calendarData.profileContent) {
      for (const accountKey of ['account1', 'account2']) {
        const accountData = calendarData.profileContent[accountKey];
        if (accountData && accountData.dailySchedule) {
          for (const schedule of accountData.dailySchedule) {
            const date = schedule.date;
            dates.add(date);
            
            if (!dateStatus[date]) {
              dateStatus[date] = {
                date,
                account1: { profile: false, feed: false },
                account2: { profile: false, feed: false }
              };
            }

            const hasBackground = schedule.background?.imageUrl || schedule.background?.image;
            const hasProfile = schedule.profile?.imageUrl || schedule.profile?.image;
            const hasMessage = schedule.message;
            const isCreated = schedule.created || (hasBackground && hasProfile && hasMessage);

            if (accountKey === 'account1') {
              dateStatus[date].account1.profile = isCreated;
            } else {
              dateStatus[date].account2.profile = isCreated;
            }
          }
        }
      }
    }

    // 피드 데이터 확인
    if (calendarData.kakaoFeed && calendarData.kakaoFeed.dailySchedule) {
      for (const feed of calendarData.kakaoFeed.dailySchedule) {
        const date = feed.date;
        dates.add(date);
        
        if (!dateStatus[date]) {
          dateStatus[date] = {
            date,
            account1: { profile: false, feed: false },
            account2: { profile: false, feed: false }
          };
        }

        for (const accountKey of ['account1', 'account2']) {
          const feedData = feed[accountKey];
          if (feedData) {
            const hasImage = feedData.imageUrl || feedData.imageCategory;
            const hasCaption = feedData.caption;
            const isCreated = feedData.created || (hasImage && hasCaption);

            if (accountKey === 'account1') {
              dateStatus[date].account1.feed = isCreated;
            } else {
              dateStatus[date].account2.feed = isCreated;
            }
          }
        }
      }
    }

    // 결과 정리
    const sortedDates = Array.from(dates).sort();
    const completeDates = [];
    const incompleteDates = [];
    const emptyDates = [];

    for (const date of sortedDates) {
      const status = dateStatus[date];
      if (!status) {
        emptyDates.push(date);
        continue;
      }

      const account1Complete = status.account1.profile && status.account1.feed;
      const account2Complete = status.account2.profile && status.account2.feed;
      const bothComplete = account1Complete && account2Complete;
      const bothEmpty = !status.account1.profile && !status.account1.feed && 
                       !status.account2.profile && !status.account2.feed;

      if (bothEmpty) {
        emptyDates.push(date);
      } else if (bothComplete) {
        completeDates.push(date);
      } else {
        incompleteDates.push({
          date,
          account1: { profile: status.account1.profile, feed: status.account1.feed },
          account2: { profile: status.account2.profile, feed: status.account2.feed }
        });
      }
    }

    // 결과 출력
    console.log('📊 11월 데이터 상태 요약:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`전체 날짜: ${sortedDates.length}개`);
    console.log(`완료된 날짜: ${completeDates.length}개`);
    console.log(`미완성 날짜: ${incompleteDates.length}개`);
    console.log(`빈 날짜 (데이터 없음): ${emptyDates.length}개`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    if (emptyDates.length > 0) {
      console.log('📅 빈 날짜 (삭제 가능):');
      emptyDates.forEach(date => console.log(`   - ${date}`));
      console.log('');
    }

    if (incompleteDates.length > 0) {
      console.log('⚠️ 미완성 날짜:');
      incompleteDates.forEach(({ date, account1, account2 }) => {
        console.log(`   ${date}:`);
        console.log(`     Account1: 프로필 ${account1.profile ? '✅' : '❌'}, 피드 ${account1.feed ? '✅' : '❌'}`);
        console.log(`     Account2: 프로필 ${account2.profile ? '✅' : '❌'}, 피드 ${account2.feed ? '✅' : '❌'}`);
      });
      console.log('');
    }

    // 스크린샷 저장
    await page.screenshot({ path: 'test-results/kakao-data-status-check.png', fullPage: true });
    console.log('✅ 스크린샷 저장: test-results/kakao-data-status-check.png\n');

    // 삭제 가능한 날짜 확인
    if (emptyDates.length > 0) {
      console.log('🗑️ 삭제 가능한 날짜 목록:');
      console.log(JSON.stringify(emptyDates, null, 2));
    }

    await browser.close();

  } catch (error) {
    console.error('❌ 오류 발생:', error);
    await page.screenshot({ path: 'test-results/kakao-data-status-error.png', fullPage: true });
    process.exit(1);
  }
})();


 * 카카오톡 콘텐츠 데이터 상태 확인 및 미생성 날짜 체크
 */

const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  try {
    console.log('🔍 카카오톡 콘텐츠 데이터 상태 확인 중...\n');

    await page.goto('http://localhost:3000/admin/kakao-content', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    // 11월 데이터 로드
    const monthStr = '2025-11';
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
    
    // 날짜별 상태 확인
    const dateStatus = {};
    const dates = new Set();

    // 프로필 데이터 확인
    if (calendarData.profileContent) {
      for (const accountKey of ['account1', 'account2']) {
        const accountData = calendarData.profileContent[accountKey];
        if (accountData && accountData.dailySchedule) {
          for (const schedule of accountData.dailySchedule) {
            const date = schedule.date;
            dates.add(date);
            
            if (!dateStatus[date]) {
              dateStatus[date] = {
                date,
                account1: { profile: false, feed: false },
                account2: { profile: false, feed: false }
              };
            }

            const hasBackground = schedule.background?.imageUrl || schedule.background?.image;
            const hasProfile = schedule.profile?.imageUrl || schedule.profile?.image;
            const hasMessage = schedule.message;
            const isCreated = schedule.created || (hasBackground && hasProfile && hasMessage);

            if (accountKey === 'account1') {
              dateStatus[date].account1.profile = isCreated;
            } else {
              dateStatus[date].account2.profile = isCreated;
            }
          }
        }
      }
    }

    // 피드 데이터 확인
    if (calendarData.kakaoFeed && calendarData.kakaoFeed.dailySchedule) {
      for (const feed of calendarData.kakaoFeed.dailySchedule) {
        const date = feed.date;
        dates.add(date);
        
        if (!dateStatus[date]) {
          dateStatus[date] = {
            date,
            account1: { profile: false, feed: false },
            account2: { profile: false, feed: false }
          };
        }

        for (const accountKey of ['account1', 'account2']) {
          const feedData = feed[accountKey];
          if (feedData) {
            const hasImage = feedData.imageUrl || feedData.imageCategory;
            const hasCaption = feedData.caption;
            const isCreated = feedData.created || (hasImage && hasCaption);

            if (accountKey === 'account1') {
              dateStatus[date].account1.feed = isCreated;
            } else {
              dateStatus[date].account2.feed = isCreated;
            }
          }
        }
      }
    }

    // 결과 정리
    const sortedDates = Array.from(dates).sort();
    const completeDates = [];
    const incompleteDates = [];
    const emptyDates = [];

    for (const date of sortedDates) {
      const status = dateStatus[date];
      if (!status) {
        emptyDates.push(date);
        continue;
      }

      const account1Complete = status.account1.profile && status.account1.feed;
      const account2Complete = status.account2.profile && status.account2.feed;
      const bothComplete = account1Complete && account2Complete;
      const bothEmpty = !status.account1.profile && !status.account1.feed && 
                       !status.account2.profile && !status.account2.feed;

      if (bothEmpty) {
        emptyDates.push(date);
      } else if (bothComplete) {
        completeDates.push(date);
      } else {
        incompleteDates.push({
          date,
          account1: { profile: status.account1.profile, feed: status.account1.feed },
          account2: { profile: status.account2.profile, feed: status.account2.feed }
        });
      }
    }

    // 결과 출력
    console.log('📊 11월 데이터 상태 요약:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`전체 날짜: ${sortedDates.length}개`);
    console.log(`완료된 날짜: ${completeDates.length}개`);
    console.log(`미완성 날짜: ${incompleteDates.length}개`);
    console.log(`빈 날짜 (데이터 없음): ${emptyDates.length}개`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    if (emptyDates.length > 0) {
      console.log('📅 빈 날짜 (삭제 가능):');
      emptyDates.forEach(date => console.log(`   - ${date}`));
      console.log('');
    }

    if (incompleteDates.length > 0) {
      console.log('⚠️ 미완성 날짜:');
      incompleteDates.forEach(({ date, account1, account2 }) => {
        console.log(`   ${date}:`);
        console.log(`     Account1: 프로필 ${account1.profile ? '✅' : '❌'}, 피드 ${account1.feed ? '✅' : '❌'}`);
        console.log(`     Account2: 프로필 ${account2.profile ? '✅' : '❌'}, 피드 ${account2.feed ? '✅' : '❌'}`);
      });
      console.log('');
    }

    // 스크린샷 저장
    await page.screenshot({ path: 'test-results/kakao-data-status-check.png', fullPage: true });
    console.log('✅ 스크린샷 저장: test-results/kakao-data-status-check.png\n');

    // 삭제 가능한 날짜 확인
    if (emptyDates.length > 0) {
      console.log('🗑️ 삭제 가능한 날짜 목록:');
      console.log(JSON.stringify(emptyDates, null, 2));
    }

    await browser.close();

  } catch (error) {
    console.error('❌ 오류 발생:', error);
    await page.screenshot({ path: 'test-results/kakao-data-status-error.png', fullPage: true });
    process.exit(1);
  }
})();


 * 카카오톡 콘텐츠 데이터 상태 확인 및 미생성 날짜 체크
 */

const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  try {
    console.log('🔍 카카오톡 콘텐츠 데이터 상태 확인 중...\n');

    await page.goto('http://localhost:3000/admin/kakao-content', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    // 11월 데이터 로드
    const monthStr = '2025-11';
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
    
    // 날짜별 상태 확인
    const dateStatus = {};
    const dates = new Set();

    // 프로필 데이터 확인
    if (calendarData.profileContent) {
      for (const accountKey of ['account1', 'account2']) {
        const accountData = calendarData.profileContent[accountKey];
        if (accountData && accountData.dailySchedule) {
          for (const schedule of accountData.dailySchedule) {
            const date = schedule.date;
            dates.add(date);
            
            if (!dateStatus[date]) {
              dateStatus[date] = {
                date,
                account1: { profile: false, feed: false },
                account2: { profile: false, feed: false }
              };
            }

            const hasBackground = schedule.background?.imageUrl || schedule.background?.image;
            const hasProfile = schedule.profile?.imageUrl || schedule.profile?.image;
            const hasMessage = schedule.message;
            const isCreated = schedule.created || (hasBackground && hasProfile && hasMessage);

            if (accountKey === 'account1') {
              dateStatus[date].account1.profile = isCreated;
            } else {
              dateStatus[date].account2.profile = isCreated;
            }
          }
        }
      }
    }

    // 피드 데이터 확인
    if (calendarData.kakaoFeed && calendarData.kakaoFeed.dailySchedule) {
      for (const feed of calendarData.kakaoFeed.dailySchedule) {
        const date = feed.date;
        dates.add(date);
        
        if (!dateStatus[date]) {
          dateStatus[date] = {
            date,
            account1: { profile: false, feed: false },
            account2: { profile: false, feed: false }
          };
        }

        for (const accountKey of ['account1', 'account2']) {
          const feedData = feed[accountKey];
          if (feedData) {
            const hasImage = feedData.imageUrl || feedData.imageCategory;
            const hasCaption = feedData.caption;
            const isCreated = feedData.created || (hasImage && hasCaption);

            if (accountKey === 'account1') {
              dateStatus[date].account1.feed = isCreated;
            } else {
              dateStatus[date].account2.feed = isCreated;
            }
          }
        }
      }
    }

    // 결과 정리
    const sortedDates = Array.from(dates).sort();
    const completeDates = [];
    const incompleteDates = [];
    const emptyDates = [];

    for (const date of sortedDates) {
      const status = dateStatus[date];
      if (!status) {
        emptyDates.push(date);
        continue;
      }

      const account1Complete = status.account1.profile && status.account1.feed;
      const account2Complete = status.account2.profile && status.account2.feed;
      const bothComplete = account1Complete && account2Complete;
      const bothEmpty = !status.account1.profile && !status.account1.feed && 
                       !status.account2.profile && !status.account2.feed;

      if (bothEmpty) {
        emptyDates.push(date);
      } else if (bothComplete) {
        completeDates.push(date);
      } else {
        incompleteDates.push({
          date,
          account1: { profile: status.account1.profile, feed: status.account1.feed },
          account2: { profile: status.account2.profile, feed: status.account2.feed }
        });
      }
    }

    // 결과 출력
    console.log('📊 11월 데이터 상태 요약:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`전체 날짜: ${sortedDates.length}개`);
    console.log(`완료된 날짜: ${completeDates.length}개`);
    console.log(`미완성 날짜: ${incompleteDates.length}개`);
    console.log(`빈 날짜 (데이터 없음): ${emptyDates.length}개`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    if (emptyDates.length > 0) {
      console.log('📅 빈 날짜 (삭제 가능):');
      emptyDates.forEach(date => console.log(`   - ${date}`));
      console.log('');
    }

    if (incompleteDates.length > 0) {
      console.log('⚠️ 미완성 날짜:');
      incompleteDates.forEach(({ date, account1, account2 }) => {
        console.log(`   ${date}:`);
        console.log(`     Account1: 프로필 ${account1.profile ? '✅' : '❌'}, 피드 ${account1.feed ? '✅' : '❌'}`);
        console.log(`     Account2: 프로필 ${account2.profile ? '✅' : '❌'}, 피드 ${account2.feed ? '✅' : '❌'}`);
      });
      console.log('');
    }

    // 스크린샷 저장
    await page.screenshot({ path: 'test-results/kakao-data-status-check.png', fullPage: true });
    console.log('✅ 스크린샷 저장: test-results/kakao-data-status-check.png\n');

    // 삭제 가능한 날짜 확인
    if (emptyDates.length > 0) {
      console.log('🗑️ 삭제 가능한 날짜 목록:');
      console.log(JSON.stringify(emptyDates, null, 2));
    }

    await browser.close();

  } catch (error) {
    console.error('❌ 오류 발생:', error);
    await page.screenshot({ path: 'test-results/kakao-data-status-error.png', fullPage: true });
    process.exit(1);
  }
})();


 * 카카오톡 콘텐츠 데이터 상태 확인 및 미생성 날짜 체크
 */

const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  try {
    console.log('🔍 카카오톡 콘텐츠 데이터 상태 확인 중...\n');

    await page.goto('http://localhost:3000/admin/kakao-content', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    // 11월 데이터 로드
    const monthStr = '2025-11';
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
    
    // 날짜별 상태 확인
    const dateStatus = {};
    const dates = new Set();

    // 프로필 데이터 확인
    if (calendarData.profileContent) {
      for (const accountKey of ['account1', 'account2']) {
        const accountData = calendarData.profileContent[accountKey];
        if (accountData && accountData.dailySchedule) {
          for (const schedule of accountData.dailySchedule) {
            const date = schedule.date;
            dates.add(date);
            
            if (!dateStatus[date]) {
              dateStatus[date] = {
                date,
                account1: { profile: false, feed: false },
                account2: { profile: false, feed: false }
              };
            }

            const hasBackground = schedule.background?.imageUrl || schedule.background?.image;
            const hasProfile = schedule.profile?.imageUrl || schedule.profile?.image;
            const hasMessage = schedule.message;
            const isCreated = schedule.created || (hasBackground && hasProfile && hasMessage);

            if (accountKey === 'account1') {
              dateStatus[date].account1.profile = isCreated;
            } else {
              dateStatus[date].account2.profile = isCreated;
            }
          }
        }
      }
    }

    // 피드 데이터 확인
    if (calendarData.kakaoFeed && calendarData.kakaoFeed.dailySchedule) {
      for (const feed of calendarData.kakaoFeed.dailySchedule) {
        const date = feed.date;
        dates.add(date);
        
        if (!dateStatus[date]) {
          dateStatus[date] = {
            date,
            account1: { profile: false, feed: false },
            account2: { profile: false, feed: false }
          };
        }

        for (const accountKey of ['account1', 'account2']) {
          const feedData = feed[accountKey];
          if (feedData) {
            const hasImage = feedData.imageUrl || feedData.imageCategory;
            const hasCaption = feedData.caption;
            const isCreated = feedData.created || (hasImage && hasCaption);

            if (accountKey === 'account1') {
              dateStatus[date].account1.feed = isCreated;
            } else {
              dateStatus[date].account2.feed = isCreated;
            }
          }
        }
      }
    }

    // 결과 정리
    const sortedDates = Array.from(dates).sort();
    const completeDates = [];
    const incompleteDates = [];
    const emptyDates = [];

    for (const date of sortedDates) {
      const status = dateStatus[date];
      if (!status) {
        emptyDates.push(date);
        continue;
      }

      const account1Complete = status.account1.profile && status.account1.feed;
      const account2Complete = status.account2.profile && status.account2.feed;
      const bothComplete = account1Complete && account2Complete;
      const bothEmpty = !status.account1.profile && !status.account1.feed && 
                       !status.account2.profile && !status.account2.feed;

      if (bothEmpty) {
        emptyDates.push(date);
      } else if (bothComplete) {
        completeDates.push(date);
      } else {
        incompleteDates.push({
          date,
          account1: { profile: status.account1.profile, feed: status.account1.feed },
          account2: { profile: status.account2.profile, feed: status.account2.feed }
        });
      }
    }

    // 결과 출력
    console.log('📊 11월 데이터 상태 요약:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`전체 날짜: ${sortedDates.length}개`);
    console.log(`완료된 날짜: ${completeDates.length}개`);
    console.log(`미완성 날짜: ${incompleteDates.length}개`);
    console.log(`빈 날짜 (데이터 없음): ${emptyDates.length}개`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    if (emptyDates.length > 0) {
      console.log('📅 빈 날짜 (삭제 가능):');
      emptyDates.forEach(date => console.log(`   - ${date}`));
      console.log('');
    }

    if (incompleteDates.length > 0) {
      console.log('⚠️ 미완성 날짜:');
      incompleteDates.forEach(({ date, account1, account2 }) => {
        console.log(`   ${date}:`);
        console.log(`     Account1: 프로필 ${account1.profile ? '✅' : '❌'}, 피드 ${account1.feed ? '✅' : '❌'}`);
        console.log(`     Account2: 프로필 ${account2.profile ? '✅' : '❌'}, 피드 ${account2.feed ? '✅' : '❌'}`);
      });
      console.log('');
    }

    // 스크린샷 저장
    await page.screenshot({ path: 'test-results/kakao-data-status-check.png', fullPage: true });
    console.log('✅ 스크린샷 저장: test-results/kakao-data-status-check.png\n');

    // 삭제 가능한 날짜 확인
    if (emptyDates.length > 0) {
      console.log('🗑️ 삭제 가능한 날짜 목록:');
      console.log(JSON.stringify(emptyDates, null, 2));
    }

    await browser.close();

  } catch (error) {
    console.error('❌ 오류 발생:', error);
    await page.screenshot({ path: 'test-results/kakao-data-status-error.png', fullPage: true });
    process.exit(1);
  }
})();


