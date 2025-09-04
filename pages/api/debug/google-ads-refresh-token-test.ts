import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const envVars = {
      client_id: process.env.GOOGLE_ADS_CLIENT_ID,
      client_secret: process.env.GOOGLE_ADS_CLIENT_SECRET,
      developer_token: process.env.GOOGLE_ADS_DEVELOPER_TOKEN,
      customer_id: process.env.GOOGLE_ADS_CUSTOMER_ID,
      refresh_token: process.env.GOOGLE_ADS_REFRESH_TOKEN,
    };

    // Google Ads API 패키지 확인
    let googleAdsApi;
    try {
      googleAdsApi = require('google-ads-api');
    } catch (error) {
      return res.status(200).json({
        status: '실패',
        message: 'google-ads-api 패키지가 설치되지 않았습니다.',
        error: error.message
      });
    }

    // API 클라이언트 초기화
    const client = new googleAdsApi.GoogleAdsApi({
      client_id: envVars.client_id,
      client_secret: envVars.client_secret,
      developer_token: envVars.developer_token,
    });

    // Customer 객체 생성
    const customer = client.Customer({
      customer_id: envVars.customer_id,
      refresh_token: envVars.refresh_token,
    });

    // 다양한 쿼리 테스트
    const testQueries = [
      {
        name: '기본 계정 정보 조회',
        query: `
          SELECT 
            customer.id,
            customer.descriptive_name,
            customer.currency_code,
            customer.time_zone
          FROM customer 
          LIMIT 1
        `
      },
      {
        name: '캠페인 목록 조회',
        query: `
          SELECT 
            campaign.id,
            campaign.name,
            campaign.status
          FROM campaign 
          LIMIT 5
        `
      },
      {
        name: '계정 접근 권한 확인',
        query: `
          SELECT 
            customer_client.id,
            customer_client.descriptive_name,
            customer_client.manager
          FROM customer_client 
          LIMIT 5
        `
      }
    ];

    const results = [];

    for (const test of testQueries) {
      try {
        console.log(`Testing: ${test.name}`);
        const response = await customer.query(test.query);
        
        results.push({
          name: test.name,
          status: '성공',
          data: response,
          recordCount: response.length
        });

        console.log(`✅ ${test.name} 성공: ${response.length}개 레코드`);

      } catch (error) {
        results.push({
          name: test.name,
          status: '실패',
          error: error.message,
          errorCode: error.code,
          errorStatus: error.status,
          errorDetails: {
            name: error.name,
            stack: error.stack?.split('\n').slice(0, 3)
          }
        });

        console.log(`❌ ${test.name} 실패: ${error.message}`);
      }
    }

    // 성공한 쿼리가 있는지 확인
    const successfulQueries = results.filter(r => r.status === '성공');
    const failedQueries = results.filter(r => r.status === '실패');

    return res.status(200).json({
      status: '완료',
      message: 'Google Ads API 상세 테스트 완료',
      summary: {
        total: testQueries.length,
        successful: successfulQueries.length,
        failed: failedQueries.length
      },
      customerId: envVars.customer_id,
      customerIdWithHyphens: `${envVars.customer_id.slice(0,3)}-${envVars.customer_id.slice(3,6)}-${envVars.customer_id.slice(6)}`,
      results,
      recommendations: successfulQueries.length > 0 ? [
        '일부 쿼리가 성공했습니다. API 연결은 정상입니다.',
        '실패한 쿼리는 권한이나 데이터 부족 문제일 수 있습니다.',
        '성공한 쿼리를 사용하여 데이터를 수집하세요.'
      ] : [
        '모든 쿼리가 실패했습니다.',
        'Refresh Token이 만료되었을 가능성이 있습니다.',
        'OAuth 토큰을 재발급받아야 할 수 있습니다.',
        'Customer ID에 대한 API 접근 권한을 확인하세요.'
      ],
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    return res.status(500).json({
      status: '오류',
      message: '예상치 못한 오류가 발생했습니다.',
      error: error.message,
      stack: error.stack?.split('\n').slice(0, 5)
    });
  }
}
