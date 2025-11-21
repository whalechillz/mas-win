const { chromium } = require('playwright');

async function testMuziikLinks() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  console.log('🔍 MUZIIK 링크 테스트 시작...\n');

  const testCases = [
    // 기본 경로 (한국어)
    { url: 'https://muziik.masgolf.co.kr/muziik/sapphire', expected: 'sapphire', locale: 'ko' },
    { url: 'https://muziik.masgolf.co.kr/muziik/beryl', expected: 'beryl', locale: 'ko' },
    
    // 리라이트 경로 (한국어)
    { url: 'https://muziik.masgolf.co.kr/sapphire', expected: 'sapphire', locale: 'ko' },
    { url: 'https://muziik.masgolf.co.kr/beryl', expected: 'beryl', locale: 'ko' },
    
    // 일본어 로케일 경로
    { url: 'https://muziik.masgolf.co.kr/ja/muziik/sapphire', expected: 'sapphire', locale: 'ja' },
    { url: 'https://muziik.masgolf.co.kr/ja/muziik/beryl', expected: 'beryl', locale: 'ja' },
    
    // 일본어 리라이트 경로 (존재하지 않을 수 있음)
    { url: 'https://muziik.masgolf.co.kr/ja/sapphire', expected: 'sapphire', locale: 'ja' },
    { url: 'https://muziik.masgolf.co.kr/ja/beryl', expected: 'beryl', locale: 'ja' },
  ];

  const results = [];

  for (const testCase of testCases) {
    try {
      console.log(`\n📌 테스트: ${testCase.url}`);
      console.log(`   예상: ${testCase.expected} (${testCase.locale})`);
      
      const response = await page.goto(testCase.url, { 
        waitUntil: 'networkidle',
        timeout: 10000 
      });

      const status = response.status();
      const finalUrl = page.url();
      const title = await page.title();
      
      // 페이지 내용 확인
      const bodyText = await page.textContent('body');
      const has404 = bodyText.includes('404') || bodyText.includes('페이지를 찾을 수 없습니다') || bodyText.includes('제품을 찾을 수 없습니다');
      const hasProduct = bodyText.includes('Sapphire') || bodyText.includes('Beryl') || bodyText.includes('サファイア') || bodyText.includes('ベリル');
      
      const result = {
        url: testCase.url,
        expected: testCase.expected,
        locale: testCase.locale,
        status,
        finalUrl,
        title,
        has404,
        hasProduct,
        success: !has404 && hasProduct && status === 200
      };

      results.push(result);

      if (result.success) {
        console.log(`   ✅ 성공: ${status} - ${title}`);
      } else {
        console.log(`   ❌ 실패: ${status}`);
        if (has404) console.log(`      - 404 오류 감지`);
        if (!hasProduct) console.log(`      - 제품 정보 없음`);
        console.log(`      - 최종 URL: ${finalUrl}`);
      }

    } catch (error) {
      console.log(`   ❌ 에러: ${error.message}`);
      results.push({
        url: testCase.url,
        expected: testCase.expected,
        locale: testCase.locale,
        error: error.message,
        success: false
      });
    }
  }

  // 결과 요약
  console.log('\n\n📊 테스트 결과 요약:');
  console.log('='.repeat(60));
  
  const successCount = results.filter(r => r.success).length;
  const failCount = results.filter(r => !r.success).length;
  
  console.log(`✅ 성공: ${successCount}/${results.length}`);
  console.log(`❌ 실패: ${failCount}/${results.length}\n`);

  // 실패한 케이스 상세
  const failures = results.filter(r => !r.success);
  if (failures.length > 0) {
    console.log('❌ 실패한 케이스:');
    failures.forEach(f => {
      console.log(`   - ${f.url}`);
      if (f.status) console.log(`     HTTP ${f.status}`);
      if (f.has404) console.log(`     404 오류`);
      if (f.error) console.log(`     ${f.error}`);
    });
  }

  await browser.close();
  
  return results;
}

testMuziikLinks()
  .then(results => {
    console.log('\n✅ 테스트 완료');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ 테스트 실패:', error);
    process.exit(1);
  });




























