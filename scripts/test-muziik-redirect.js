const playwright = require('playwright');

async function testMuziikRedirect() {
  const browser = await playwright.chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  console.log('🔍 MUZIIK 리다이렉트 테스트 시작...\n');

  const testCases = [
    {
      name: 'muziik.masgolf.co.kr 루트 접속',
      url: 'https://muziik.masgolf.co.kr',
      expectedRedirect: 'https://masgolf.co.kr/muziik',
    },
    {
      name: 'muziik.masgolf.co.kr/sapphire 접속',
      url: 'https://muziik.masgolf.co.kr/sapphire',
      expectedRedirect: 'https://masgolf.co.kr/muziik/sapphire',
    },
    {
      name: 'muziik.masgolf.co.kr/beryl 접속',
      url: 'https://muziik.masgolf.co.kr/beryl',
      expectedRedirect: 'https://masgolf.co.kr/muziik/beryl',
    },
    {
      name: 'masgolf.co.kr/muziik 직접 접속',
      url: 'https://masgolf.co.kr/muziik',
      expectedRedirect: null, // 리다이렉트 없음
    },
  ];

  const results = {
    passed: [],
    failed: [],
  };

  for (const testCase of testCases) {
    try {
      console.log(`\n📌 테스트: ${testCase.name}`);
      console.log(`   URL: ${testCase.url}`);

      // 리다이렉트 추적
      let finalUrl = testCase.url;
      let redirectChain = [];

      page.on('response', (response) => {
        if (response.status() >= 300 && response.status() < 400) {
          const location = response.headers()['location'];
          if (location) {
            redirectChain.push({
              from: response.url(),
              to: location,
              status: response.status(),
            });
          }
        }
      });

      const response = await page.goto(testCase.url, {
        waitUntil: 'networkidle',
        timeout: 30000,
      });

      finalUrl = page.url();
      const status = response.status();

      console.log(`   최종 URL: ${finalUrl}`);
      console.log(`   상태 코드: ${status}`);

      if (testCase.expectedRedirect) {
        if (finalUrl === testCase.expectedRedirect || finalUrl.startsWith(testCase.expectedRedirect)) {
          console.log(`   ✅ 리다이렉트 성공: ${testCase.expectedRedirect}`);
          results.passed.push({
            name: testCase.name,
            url: testCase.url,
            finalUrl: finalUrl,
            status: status,
          });
        } else {
          console.log(`   ❌ 리다이렉트 실패`);
          console.log(`      예상: ${testCase.expectedRedirect}`);
          console.log(`      실제: ${finalUrl}`);
          results.failed.push({
            name: testCase.name,
            url: testCase.url,
            expected: testCase.expectedRedirect,
            actual: finalUrl,
            status: status,
          });
        }
      } else {
        // 리다이렉트 없이 정상 로드 확인
        if (status === 200 && finalUrl === testCase.url) {
          console.log(`   ✅ 정상 로드`);
          results.passed.push({
            name: testCase.name,
            url: testCase.url,
            finalUrl: finalUrl,
            status: status,
          });
        } else {
          console.log(`   ❌ 예상치 못한 리다이렉트 또는 오류`);
          results.failed.push({
            name: testCase.name,
            url: testCase.url,
            expected: '리다이렉트 없음',
            actual: finalUrl,
            status: status,
          });
        }
      }

      // 페이지 제목 확인
      const title = await page.title();
      console.log(`   페이지 제목: ${title}`);

      // 404 에러 확인
      const pageContent = await page.content();
      if (pageContent.includes('404') || pageContent.includes('Not Found') || pageContent.includes('페이지를 찾을 수 없습니다')) {
        console.log(`   ⚠️  404 에러 감지`);
        results.failed.push({
          name: `${testCase.name} - 404 에러`,
          url: testCase.url,
          error: '404 Not Found',
        });
      }

      await page.waitForTimeout(1000); // 다음 테스트 전 대기
    } catch (error) {
      console.error(`   ❌ 에러 발생: ${error.message}`);
      results.failed.push({
        name: testCase.name,
        url: testCase.url,
        error: error.message,
      });
    }
  }

  console.log('\n============================================================');
  console.log('📊 테스트 결과:');
  console.log('============================================================');
  console.log(`✅ 성공: ${results.passed.length}개`);
  console.log(`❌ 실패: ${results.failed.length}개`);

  if (results.passed.length > 0) {
    console.log('\n✅ 성공한 테스트:');
    results.passed.forEach((result) => {
      console.log(`   - ${result.name}`);
      console.log(`     URL: ${result.url} → ${result.finalUrl}`);
    });
  }

  if (results.failed.length > 0) {
    console.log('\n❌ 실패한 테스트:');
    results.failed.forEach((result) => {
      console.log(`   - ${result.name}`);
      if (result.error) {
        console.log(`     에러: ${result.error}`);
      } else {
        console.log(`     예상: ${result.expected}`);
        console.log(`     실제: ${result.actual}`);
      }
    });
  }

  await browser.close();

  return results.failed.length === 0;
}

testMuziikRedirect()
  .then((success) => {
    if (success) {
      console.log('\n✅ 모든 테스트 통과!');
      process.exit(0);
    } else {
      console.log('\n❌ 일부 테스트 실패');
      process.exit(1);
    }
  })
  .catch((error) => {
    console.error('테스트 실행 중 에러:', error);
    process.exit(1);
  });

