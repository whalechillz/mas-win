// Solapi API 직접 호출 테스트
const crypto = require('crypto');

const SOLAPI_API_KEY = process.env.SOLAPI_API_KEY || 'NCSEBH9N1KDDCEKF';
const SOLAPI_API_SECRET = process.env.SOLAPI_API_SECRET || '6ETD0PWTTCUS8S4JC5OL5AFU0JQKDHM2';

function createSolapiSignature(apiKey, apiSecret) {
  const cleanApiKey = String(apiKey).replace(/[\s\n\r\t\f\v]/g, '').trim();
  const cleanApiSecret = String(apiSecret).replace(/[\s\n\r\t\f\v]/g, '').trim();
  
  const date = new Date().toISOString();
  const salt = Math.random().toString(36).substring(2, 15);
  const data = date + salt;
  const signature = crypto.createHmac('sha256', cleanApiSecret).update(data).digest('hex');
  
  const authHeader = `HMAC-SHA256 apiKey=${cleanApiKey}, date=${date}, salt=${salt}, signature=${signature}`.replace(/[\n\r\t\f\v]/g, '');
  
  return {
    'Authorization': authHeader,
    'Content-Type': 'application/json'
  };
}

async function testSolapiAPI() {
  console.log('🚀 Solapi API 직접 테스트 시작...\n');
  
  console.log('🔑 환경 변수 확인:');
  console.log(`   SOLAPI_API_KEY: ${SOLAPI_API_KEY ? SOLAPI_API_KEY.substring(0, 10) + '...' : '미설정'}`);
  console.log(`   SOLAPI_API_SECRET: ${SOLAPI_API_SECRET ? SOLAPI_API_SECRET.substring(0, 10) + '...' : '미설정'}`);
  
  if (!SOLAPI_API_KEY || !SOLAPI_API_SECRET) {
    console.log('\n❌ 환경 변수가 설정되지 않았습니다.');
    return;
  }
  
  // 인증 헤더 생성
  const authHeaders = createSolapiSignature(SOLAPI_API_KEY, SOLAPI_API_SECRET);
  console.log('\n📝 인증 헤더 생성 완료');
  console.log(`   Authorization: ${authHeaders.Authorization.substring(0, 80)}...`);
  
  // Solapi API 테스트 호출 (간단한 SMS 발송 테스트)
  console.log('\n📡 Solapi API 테스트 호출 (메시지 발송 API)...');
  
  const testMessage = {
    message: {
      to: '01066699000',
      from: '0312150013',
      text: '테스트 메시지',
      type: 'SMS'
    }
  };
  
  try {
    const response = await fetch('https://api.solapi.com/messages/v4/send', {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify(testMessage)
    });
    
    console.log(`   Status: ${response.status} ${response.statusText}`);
    
    let data;
    try {
      const text = await response.text();
      console.log('   Raw Response:', text.substring(0, 500));
      data = JSON.parse(text);
    } catch (parseError) {
      console.log('   ❌ JSON 파싱 실패:', parseError.message);
      return;
    }
    
    console.log('   Response:', JSON.stringify(data, null, 2));
    
    if (response.ok) {
      console.log('\n✅ Solapi API 인증 성공!');
      console.log('   환경 변수가 올바르게 설정되어 있습니다.');
    } else {
      console.log('\n❌ Solapi API 인증 실패!');
      
      if (data.errorMessage) {
        console.log(`   오류 메시지: ${data.errorMessage}`);
        
        if (data.errorMessage.includes('No valid session') || 
            data.errorMessage.includes('session') ||
            data.errorMessage.includes('인증')) {
          console.log('\n   ⚠️ "No valid session" 오류 발견!');
          console.log('   원인:');
          console.log('      - API 키/시크릿이 만료되었거나 잘못됨');
          console.log('      - Solapi 대시보드에서 API 키/시크릿 확인 필요');
          console.log('      - 환경 변수 값이 올바른지 확인 필요');
        }
      }
      
      if (data.errorCode) {
        console.log(`   오류 코드: ${data.errorCode}`);
      }
    }
    
  } catch (error) {
    console.error('\n❌ Solapi API 호출 중 오류:', error.message);
    console.error('   Stack:', error.stack);
  }
}

// Node.js 18+ 내장 fetch 사용
const fetch = globalThis.fetch || require('node-fetch');

testSolapiAPI();
