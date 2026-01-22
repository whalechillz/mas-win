const { chromium } = require('playwright');
require('dotenv').config({ path: '.env.local' });

(async () => {
  const browser = await chromium.launch({ 
    headless: false,
    devtools: true, // 개발자 도구 자동 열기
    channel: 'chrome-beta' // 크롬 베타 사용
  });
  
  const context = await browser.newContext();
  const page = await context.newPage();

  // 콘솔 로그 수집
  const consoleMessages = [];
  const networkRequests = [];

  page.on('console', msg => {
    const text = msg.text();
    consoleMessages.push({
      type: msg.type(),
      text: text,
      timestamp: new Date().toISOString()
    });
    console.log(`[CONSOLE ${msg.type()}]: ${text}`);
  });

  page.on('request', request => {
    if (request.url().includes('/api/admin/customers/geocoding')) {
      networkRequests.push({
        url: request.url(),
        method: request.method(),
        postData: request.postData(),
        timestamp: new Date().toISOString()
      });
      console.log(`[REQUEST]: ${request.method()} ${request.url()}`);
    }
  });

  page.on('response', async response => {
    if (response.url().includes('/api/admin/customers/geocoding')) {
      try {
        const json = await response.json();
        networkRequests[networkRequests.length - 1].response = {
          status: response.status(),
          data: json,
          timestamp: new Date().toISOString()
        };
        console.log(`[RESPONSE]: ${response.status()} ${response.url()}`);
        console.log(`[RESPONSE DATA]:`, JSON.stringify(json, null, 2));
        
        // total과 totalAll 값 확인
        if (json.data) {
          console.log(`\n📊 API 응답 데이터:`);
          console.log(`   - total (필터링된 고객 수): ${json.data.total || 0}`);
          console.log(`   - totalAll (전체 고객 수): ${json.data.totalAll || 0}`);
          console.log(`   - customers.length (반환된 고객 수): ${json.data.customers?.length || 0}`);
        }
      } catch (e) {
        console.error(`[RESPONSE ERROR]:`, e.message);
      }
    }
  });

  try {
    console.log('🌐 페이지 로딩 중...');
    
    // 로그인 페이지로 이동
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
    await page.goto(`${baseUrl}/admin/customers`, { waitUntil: 'networkidle' });

    console.log('⏳ 로그인 대기 중... (수동으로 로그인해주세요)');
    console.log('⏳ 위치 정보 관리 탭 클릭 대기 중...');
    
    // 위치 정보 관리 탭 클릭 대기
    await page.waitForSelector('button:has-text("위치 정보 관리"), a:has-text("위치 정보 관리")', { timeout: 60000 });
    
    // 위치 정보 관리 탭 클릭
    await page.click('button:has-text("위치 정보 관리"), a:has-text("위치 정보 관리")');
    console.log('✅ 위치 정보 관리 탭 클릭됨');

    // 필터가 로드될 때까지 대기
    await page.waitForSelector('select', { timeout: 10000 });
    console.log('✅ 필터 로드됨');

    // API 호출 대기 (최대 10초)
    await page.waitForTimeout(5000);

    // 페이지의 텍스트 내용 확인
    const pageContent = await page.textContent('body');
    console.log('\n📄 페이지 내용 일부:');
    console.log(pageContent?.substring(0, 500));

    // 위치 정보 고객 목록 헤더 확인
    const headerText = await page.textContent('h3, h2, .text-lg, .text-xl').catch(() => null);
    if (headerText) {
      console.log(`\n📋 헤더 텍스트: ${headerText}`);
    }

    // 콘솔에서 "1000" 관련 메시지 찾기
    const messagesWith1000 = consoleMessages.filter(msg => 
      msg.text.includes('1000') || 
      msg.text.includes('1000명') || 
      msg.text.includes('1000건')
    );

    if (messagesWith1000.length > 0) {
      console.log('\n🔍 "1000" 관련 콘솔 메시지:');
      messagesWith1000.forEach(msg => {
        console.log(`   [${msg.type}] ${msg.text}`);
      });
    }

    // 네트워크 요청 확인
    console.log('\n📡 네트워크 요청:');
    networkRequests.forEach((req, idx) => {
      console.log(`\n   요청 ${idx + 1}:`);
      console.log(`   - URL: ${req.url}`);
      console.log(`   - Method: ${req.method}`);
      if (req.response) {
        console.log(`   - Status: ${req.response.status}`);
        if (req.response.data) {
          console.log(`   - total: ${req.response.data.data?.total || 'N/A'}`);
          console.log(`   - totalAll: ${req.response.data.data?.totalAll || 'N/A'}`);
          console.log(`   - customers.length: ${req.response.data.data?.customers?.length || 'N/A'}`);
        }
      }
    });

    // 추가 디버깅: 페이지에서 직접 JavaScript 실행
    const debugInfo = await page.evaluate(() => {
      const info = {
        geocodingTotal: null,
        geocodingTotalAll: null,
        geocodingCustomersLength: null,
        pageSize: null,
        currentPage: null,
        apiCalls: [],
        headerText: null,
        allTextWithNumbers: []
      };

      // 헤더 텍스트 찾기
      const headers = document.querySelectorAll('h1, h2, h3, .text-lg, .text-xl, .text-2xl');
      headers.forEach(h => {
        const text = h.textContent || '';
        if (text.includes('고객') || text.includes('명') || text.includes('건')) {
          info.headerText = text;
        }
      });

      // 페이지의 모든 텍스트에서 숫자 찾기
      const allText = document.body.innerText;
      const matches = allText.match(/(\d{1,4})명|(\d{1,4})건|(\d{1,4})개씩/g);
      info.allTextWithNumbers = matches || [];

      // 위치 정보 관리 관련 텍스트 찾기
      const locationTexts = Array.from(document.querySelectorAll('*')).map(el => {
        const text = el.textContent || '';
        if (text.includes('전체 고객') || text.includes('주소 있는 고객') || text.includes('표시')) {
          return text.trim();
        }
        return null;
      }).filter(Boolean);

      info.locationTexts = locationTexts;

      return info;
    });

    console.log('\n🔍 페이지 디버깅 정보:');
    console.log(JSON.stringify(debugInfo, null, 2));

    console.log('\n⏳ 10초 대기 후 종료...');
    await page.waitForTimeout(10000);

  } catch (error) {
    console.error('❌ 오류 발생:', error);
  } finally {
    console.log('\n📝 최종 콘솔 메시지 요약:');
    consoleMessages.forEach(msg => {
      if (msg.text.includes('1000') || msg.text.includes('고객') || msg.text.includes('total')) {
        console.log(`   [${msg.type}] ${msg.text}`);
      }
    });

    // 브라우저를 닫지 않고 유지 (수동 확인용)
    console.log('\n✅ 디버깅 완료. 브라우저는 열려있습니다.');
    console.log('   개발자 도구 콘솔에서 추가 확인이 가능합니다.');
    // await browser.close();
  }
})();
