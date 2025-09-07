import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // 플레이라이트에서 확인한 정확한 정보
    const testConfigs = [
      {
        name: 'MASGOLF2 (현재 활성 계정)',
        customerId: '6417483168',
        customerIdWithHyphens: '641-748-3168',
        description: '플레이라이트에서 확인한 활성 계정'
      },
      {
        name: '광교골프 관리자',
        customerId: '7571427013', 
        customerIdWithHyphens: '757-142-7013',
        description: '관리자 계정 (API 센터 접근 가능)'
      },
      {
        name: '마쓰구 1',
        customerId: '7398653521',
        customerIdWithHyphens: '739-865-3521',
        description: '마쓰구 1 계정'
      }
    ];

    const envVars = {
      client_id: process.env.GOOGLE_ADS_CLIENT_ID,
      client_secret: process.env.GOOGLE_ADS_CLIENT_SECRET,
      developer_token: process.env.GOOGLE_ADS_DEVELOPER_TOKEN,
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

    const results = [];

    // 각 Customer ID로 테스트
    for (const config of testConfigs) {
      try {
        console.log(`Testing ${config.name} (${config.customerIdWithHyphens})...`);
        
        const customer = client.Customer({
          customer_id: config.customerId,
          refresh_token: envVars.refresh_token,
        });

        // 간단한 쿼리 테스트
        const accountInfo = await customer.query(`
          SELECT 
            customer.id,
            customer.descriptive_name,
            customer.currency_code,
            customer.time_zone,
            customer.manager
          FROM customer 
          LIMIT 1
        `);

        results.push({
          name: config.name,
          customerId: config.customerId,
          customerIdWithHyphens: config.customerIdWithHyphens,
          description: config.description,
          status: '성공',
          data: accountInfo[0],
          recommendation: '이 Customer ID를 사용하세요!'
        });

        console.log(`✅ ${config.name} 성공!`);

      } catch (error) {
        results.push({
          name: config.name,
          customerId: config.customerId,
          customerIdWithHyphens: config.customerIdWithHyphens,
          description: config.description,
          status: '실패',
          error: error.message,
          errorCode: error.code,
          errorStatus: error.status,
          recommendation: '이 Customer ID는 사용할 수 없습니다.'
        });

        console.log(`❌ ${config.name} 실패: ${error.message}`);
      }
    }

    // 성공한 계정이 있는지 확인
    const successfulAccounts = results.filter(r => r.status === '성공');
    const recommendedAccount = successfulAccounts.length > 0 ? successfulAccounts[0] : null;

    return res.status(200).json({
      status: '완료',
      message: 'Customer ID 테스트 완료',
      summary: {
        total: testConfigs.length,
        successful: successfulAccounts.length,
        failed: results.length - successfulAccounts.length
      },
      recommendedAccount,
      results,
      nextSteps: successfulAccounts.length > 0 ? [
        `환경변수 GOOGLE_ADS_CUSTOMER_ID를 ${recommendedAccount.customerId}로 설정하세요`,
        'Vercel 대시보드에서 환경변수를 업데이트하세요',
        '업데이트 후 Google Ads 관리 탭에서 데이터를 확인하세요'
      ] : [
        '모든 Customer ID 테스트가 실패했습니다',
        'Refresh Token이 올바른지 확인하세요',
        'Developer Token 권한을 확인하세요'
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
