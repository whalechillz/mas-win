const { chromium } = require('playwright');

async function testAdminRedirect() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  // 리다이렉트 추적
  const redirects = [];
  page.on('request', request => {
    if (request.redirectedFrom()) {
      redirects.push({
        from: request.redirectedFrom()?.url(),
        to: request.url(),
        timestamp: new Date().toISOString()
      });
    }
  });

  const tests = [
    {
      name: 'masgolf.co.kr/admin/dashboard (www 없음)',
      url: 'https://masgolf.co.kr/admin/dashboard',
      expectedRedirects: [
        'https://www.masgolf.co.kr/admin/dashboard',
        'https://www.masgolf.co.kr/admin/login'
      ],
      expectedFinalUrl: 'https://www.masgolf.co.kr/admin/login',
      expectedTitle: '관리자 로그인'
    },
    {
      name: 'www.masgolf.co.kr/admin/dashboard (세션 없음)',
      url: 'https://www.masgolf.co.kr/admin/dashboard',
      expectedRedirects: [
        'https://www.masgolf.co.kr/admin/login'
      ],
      expectedFinalUrl: 'https://www.masgolf.co.kr/admin/login',
      expectedTitle: '관리자 로그인'
    },
    {
      name: 'masgolf.co.kr/admin (루트)',
      url: 'https://masgolf.co.kr/admin',
      expectedRedirects: [
        'https://www.masgolf.co.kr/admin',
        'https://www.masgolf.co.kr/admin/login'
      ],
      expectedFinalUrl: 'https://www.masgolf.co.kr/admin/login',
      expectedTitle: '관리자 로그인'
    }
  ];

  console.log('🚀 Admin 리다이렉트 테스트 시작\n');

  for (const test of tests) {
    try {
      console.log(`\n📋 테스트: ${test.name}`);
      console.log(`   시작 URL: ${test.url}`);
      
      // 리다이렉트 추적 초기화
      redirects.length = 0;
      
      const response = await page.goto(test.url, { 
        waitUntil: 'networkidle',
        timeout: 30000 
      });

      // 최종 URL 확인
      const finalUrl = page.url();
      const title = await page.title();
      const statusCode = response?.status();

      console.log(`   최종 URL: ${finalUrl}`);
      console.log(`   페이지 제목: ${title}`);
      console.log(`   상태 코드: ${statusCode}`);

      // 리다이렉트 체인 확인
      console.log(`\n   🔄 리다이렉트 체인:`);
      if (redirects.length > 0) {
        redirects.forEach((redirect, index) => {
          console.log(`      ${index + 1}. ${redirect.from} → ${redirect.to}`);
        });
      } else {
        console.log(`      (리다이렉트 없음 - 직접 접근)`);
      }

      // 최종 URL 확인
      if (finalUrl === test.expectedFinalUrl || finalUrl.includes(test.expectedFinalUrl.replace('https://', ''))) {
        console.log(`   ✅ 최종 URL 확인 성공: ${test.expectedFinalUrl}`);
      } else {
        console.log(`   ❌ 최종 URL 확인 실패`);
        console.log(`      예상: ${test.expectedFinalUrl}`);
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

      // 리다이렉트 루프 확인
      const uniqueUrls = new Set(redirects.map(r => r.to));
      if (uniqueUrls.size < redirects.length) {
        console.log(`   ⚠️  리다이렉트 루프 감지! (같은 URL로 반복 리다이렉트)`);
      } else {
        console.log(`   ✅ 리다이렉트 루프 없음`);
      }

      // 페이지 내용 확인 (로딩 화면이 아닌지)
      const pageContent = await page.content();
      if (pageContent.includes('리다이렉트 중...') || pageContent.includes('로딩 중...')) {
        console.log(`   ⚠️  페이지가 여전히 로딩 중이거나 리다이렉트 중입니다`);
      } else {
        console.log(`   ✅ 페이지 로딩 완료`);
      }

      // 스크린샷 저장
      const screenshotName = test.name.replace(/\s+/g, '-').replace(/[()]/g, '');
      await page.screenshot({ 
        path: `test-results/admin-redirect-${screenshotName}.png`,
        fullPage: true 
      });
      console.log(`   📸 스크린샷 저장: test-results/admin-redirect-${screenshotName}.png`);

      await page.waitForTimeout(2000);
    } catch (error) {
      console.log(`   ❌ 오류 발생: ${error.message}`);
      console.log(`   스택: ${error.stack}`);
    }
  }

  console.log('\n\n✅ 테스트 완료');
  console.log('스크린샷은 test-results/ 폴더에 저장되었습니다.');

  await browser.close();
}

// test-results 폴더 생성
const fs = require('fs');
const path = require('path');
const testResultsDir = path.join(__dirname, '..', 'test-results');
if (!fs.existsSync(testResultsDir)) {
  fs.mkdirSync(testResultsDir, { recursive: true });
}

testAdminRedirect().catch(console.error);

