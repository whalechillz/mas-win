// API를 직접 호출하여 오류 재현 테스트
// Playwright로 로그인 후 쿠키를 가져와서 API 호출

const { chromium } = require('playwright');

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const ADMIN_LOGIN = process.env.ADMIN_LOGIN || '010-6669-9000';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '66699000';

// Node.js 18+에서는 내장 fetch 사용
let fetch;
try {
  fetch = globalThis.fetch;
  if (!fetch) {
    // Node.js 18 미만에서는 node-fetch 필요
    fetch = require('node-fetch');
  }
} catch (e) {
  // node-fetch가 없으면 https 모듈 사용
  const https = require('https');
  const http = require('http');
  
  fetch = (url, options = {}) => {
    return new Promise((resolve, reject) => {
      const urlObj = new URL(url);
      const client = urlObj.protocol === 'https:' ? https : http;
      
      const req = client.request(url, {
        method: options.method || 'GET',
        headers: options.headers || {},
      }, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          const response = {
            status: res.statusCode,
            statusText: res.statusMessage,
            json: () => Promise.resolve(JSON.parse(data)),
            text: () => Promise.resolve(data),
          };
          resolve(response);
        });
      });
      
      req.on('error', reject);
      
      if (options.body) {
        req.write(options.body);
      }
      
      req.end();
    });
  };
}

async function testSurveyMessageAPI() {
  console.log('🚀 설문 조사 메시지 API 직접 테스트 시작...\n');
  
  // Playwright로 로그인하여 쿠키 가져오기
  console.log('🔐 1. Playwright로 로그인하여 세션 쿠키 가져오기...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  try {
    // 로그인
    await page.goto(`${BASE_URL}/admin/login`);
    await page.fill('input[name="login"], input[type="text"]', ADMIN_LOGIN);
    await page.fill('input[type="password"]', ADMIN_PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForURL(url => !url.includes('/admin/login'), { timeout: 10000 }).catch(() => {});
    await page.waitForTimeout(2000);
    
    // 쿠키 가져오기
    const cookies = await context.cookies();
    const cookieString = cookies.map(c => `${c.name}=${c.value}`).join('; ');
    console.log('   ✅ 로그인 완료, 쿠키 획득');
    console.log(`   쿠키 개수: ${cookies.length}개`);
    
    await browser.close();
    
    // 테스트할 설문 ID (첫 번째 설문)
    const testSurveyId = '0d8abf17-1728-4c96-9404-36c676b1b891'; // 김탁수 설문 ID
    
    // 2. 메시지 미리보기 API 테스트 (GET)
    console.log('\n📋 2. 메시지 미리보기 API 테스트 (GET)...');
    console.log(`   URL: ${BASE_URL}/api/admin/surveys/send-messages?surveyId=${testSurveyId}&messageType=thank_you`);
    
    const previewResponse = await fetch(
      `${BASE_URL}/api/admin/surveys/send-messages?surveyId=${testSurveyId}&messageType=thank_you`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': cookieString,
        },
      }
    );
    
    console.log(`   Status: ${previewResponse.status} ${previewResponse.statusText}`);
    
    const previewData = await previewResponse.json();
    console.log('   Response:', JSON.stringify(previewData, null, 2));
    
    if (!previewData.success) {
      console.log('   ❌ 미리보기 API 실패:', previewData.message);
      return;
    }
    
    console.log('   ✅ 미리보기 API 성공\n');
    
    // 3. 메시지 발송 API 테스트 (POST)
    console.log('\n📤 3. 메시지 발송 API 테스트 (POST)...');
    console.log(`   URL: ${BASE_URL}/api/admin/surveys/send-messages`);
    console.log(`   Body: { surveyIds: ['${testSurveyId}'], messageType: 'thank_you', sendToAll: false }`);
    
    const sendResponse = await fetch(
      `${BASE_URL}/api/admin/surveys/send-messages`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': cookieString,
        },
        body: JSON.stringify({
          surveyIds: [testSurveyId],
          messageType: 'thank_you',
          sendToAll: false,
        }),
      }
    );
    
    console.log(`   Status: ${sendResponse.status} ${sendResponse.statusText}`);
    
    const sendData = await sendResponse.json();
    console.log('   Response:', JSON.stringify(sendData, null, 2));
    
    // 4. 오류 분석
    console.log('\n🔍 4. 오류 분석...');
    
    if (!sendData.success) {
      console.log('   ❌ 발송 API 실패:', sendData.message);
      if (sendData.error) {
        console.log('   오류:', sendData.error);
      }
    } else {
      console.log('   ✅ 발송 API 성공 응답');
      
      if (sendData.data) {
        console.log(`   발송 성공: ${sendData.data.sent}건`);
        console.log(`   발송 실패: ${sendData.data.failed}건`);
        
        if (sendData.data.errors && sendData.data.errors.length > 0) {
          console.log('\n   ❌ 발견된 오류:');
          sendData.data.errors.forEach((error, index) => {
            console.log(`      ${index + 1}. ${error}`);
            
            if (error.includes('No valid session')) {
              console.log('         ⚠️ "No valid session" 오류 발견!');
              console.log('         원인: Solapi API 인증 문제');
            }
          });
        }
        
        if (sendData.data.failed > 0 && sendData.data.sent === 0) {
          console.log('\n   ❌ 모든 메시지 발송 실패!');
          console.log('   원인 분석:');
          console.log('      - Solapi API 인증 오류 가능성');
          console.log('      - 환경 변수 SOLAPI_API_KEY, SOLAPI_API_SECRET 확인 필요');
        }
      }
      
      if (sendData.authError) {
        console.log('\n   ❌ 인증 오류 감지!');
        console.log('   원인: Solapi API 키/시크릿 문제');
        console.log('   해결: 환경 변수 확인 필요');
      }
    }
    
    // 5. 서버 로그 확인 안내
    console.log('\n📝 5. 서버 로그 확인:');
    console.log('   서버 콘솔에서 다음 로그를 확인하세요:');
    console.log('      - [send-messages] 감사 메시지 저장 API 오류');
    console.log('      - [send-messages] SMS 발송 API 오류');
    console.log('      - Solapi API 오류');
    console.log('      - 인증 오류 감지');
    
  } catch (error) {
    console.error('\n❌ 테스트 중 오류 발생:', error);
    console.error('   Stack:', error.stack);
    await browser.close().catch(() => {});
  }
}

testSurveyMessageAPI();
