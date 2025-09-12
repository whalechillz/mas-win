const { GoogleAdsApi } = require('google-ads-api');
require('dotenv').config({ path: '.env.local' });

async function testGoogleAdsAPI() {
  try {
    console.log('🔍 Google Ads API 테스트 시작...');
    
    // 환경변수 확인
    const envVars = {
      client_id: process.env.GOOGLE_ADS_CLIENT_ID,
      client_secret: process.env.GOOGLE_ADS_CLIENT_SECRET,
      developer_token: process.env.GOOGLE_ADS_DEVELOPER_TOKEN,
      customer_id: process.env.GOOGLE_ADS_CUSTOMER_ID,
      refresh_token: process.env.GOOGLE_ADS_REFRESH_TOKEN,
    };

    console.log('📋 환경변수 확인:');
    console.log('- client_id:', envVars.client_id ? '✅ 설정됨' : '❌ 없음');
    console.log('- client_secret:', envVars.client_secret ? '✅ 설정됨' : '❌ 없음');
    console.log('- developer_token:', envVars.developer_token ? '✅ 설정됨' : '❌ 없음');
    console.log('- customer_id:', envVars.customer_id ? `✅ 설정됨 (${envVars.customer_id})` : '❌ 없음');
    console.log('- refresh_token:', envVars.refresh_token ? '✅ 설정됨' : '❌ 없음');

    // API 클라이언트 초기화
    console.log('\n🔧 API 클라이언트 초기화...');
    const client = new GoogleAdsApi({
      client_id: envVars.client_id,
      client_secret: envVars.client_secret,
      developer_token: envVars.developer_token,
    });

    // Customer 객체 생성
    console.log('👤 Customer 객체 생성...');
    const customer = client.Customer({
      customer_id: envVars.customer_id,
      refresh_token: envVars.refresh_token,
    });

    // 간단한 쿼리 테스트
    console.log('📊 API 쿼리 테스트...');
    const accountInfo = await customer.query(`
      SELECT 
        customer.id,
        customer.descriptive_name,
        customer.currency_code,
        customer.time_zone
      FROM customer 
      LIMIT 1
    `);

    console.log('✅ API 연결 성공!');
    console.log('📋 계정 정보:', accountInfo[0]);

  } catch (error) {
    console.log('❌ 오류 발생:');
    console.log('- 메시지:', error.message);
    console.log('- 코드:', error.code);
    console.log('- 상태:', error.status);
    console.log('- 상세:', error.details);
    
    if (error.response) {
      console.log('- 응답 데이터:', error.response.data);
    }
    
    if (error.request) {
      console.log('- 요청 URL:', error.request.url);
      console.log('- 요청 메서드:', error.request.method);
    }
  }
}

testGoogleAdsAPI();
