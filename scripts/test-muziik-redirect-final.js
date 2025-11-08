const { chromium } = require('playwright');

async function testMuziikRedirects() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  const tests = [
    {
      name: 'muziik.masgolf.co.kr 루트',
      url: 'https://muziik.masgolf.co.kr/',
      expectedUrl: 'https://www.masgolf.co.kr/muziik',
      expectedTitle: 'MUZIIK'
    },
    {
      name: 'muziik.masgolf.co.kr (www 없음)',
      url: 'https://muziik.masgolf.co.kr',
      expectedUrl: 'https://www.masgolf.co.kr/muziik',
      expectedTitle: 'MUZIIK'
    },
    {
      name: '구형 페이지 /muziik/ko',
      url: 'https://www.masgolf.co.kr/muziik/ko',
      expectedUrl: 'https://www.masgolf.co.kr/muziik',
      expectedTitle: 'MUZIIK'
    },
    {
      name: '구형 페이지 /muziik/ko/sapphire',
      url: 'https://www.masgolf.co.kr/muziik/ko/sapphire',
      expectedUrl: 'https://www.masgolf.co.kr/muziik/sapphire',
      expectedTitle: 'Sapphire'
    },
    {
      name: '구형 페이지 /muziik/ko/beryl',
      url: 'https://www.masgolf.co.kr/muziik/ko/beryl',
      expectedUrl: 'https://www.masgolf.co.kr/muziik/beryl',
      expectedTitle: 'Beryl'
    }
  ];

  console.log('🚀 MUZIIK 리다이렉트 테스트 시작\n');

  for (const test of tests) {
    try {
      console.log(`\n📋 테스트: ${test.name}`);
      console.log(`   URL: ${test.url}`);
      
      const response = await page.goto(test.url, { 
        waitUntil: 'networkidle',
        timeout: 30000 
      });

      const finalUrl = page.url();
      const title = await page.title();

      console.log(`   최종 URL: ${finalUrl}`);
      console.log(`   페이지 제목: ${title}`);
      console.log(`   상태 코드: ${response?.status()}`);

      // 리다이렉트 확인
      if (finalUrl === test.expectedUrl || finalUrl.includes(test.expectedUrl.replace('https://', ''))) {
        console.log(`   ✅ 리다이렉트 성공: ${test.expectedUrl}`);
      } else {
        console.log(`   ❌ 리다이렉트 실패`);
        console.log(`      예상: ${test.expectedUrl}`);
        console.log(`      실제: ${finalUrl}`);
      }

      // 제목 확인
      if (title.includes(test.expectedTitle)) {
        console.log(`   ✅ 제목 확인 성공: "${test.expectedTitle}" 포함`);
      } else {
        console.log(`   ⚠️  제목 확인 실패`);
        console.log(`      예상: "${test.expectedTitle}" 포함`);
        console.log(`      실제: "${title}"`);
      }

      // 스크린샷 저장
      await page.screenshot({ 
        path: `test-results/muziik-redirect-${test.name.replace(/\s+/g, '-')}.png`,
        fullPage: true 
      });

      await page.waitForTimeout(2000);
    } catch (error) {
      console.log(`   ❌ 오류 발생: ${error.message}`);
    }
  }

  console.log('\n\n✅ 테스트 완료');
  console.log('스크린샷은 test-results/ 폴더에 저장되었습니다.');

  await browser.close();
}

testMuziikRedirects().catch(console.error);

