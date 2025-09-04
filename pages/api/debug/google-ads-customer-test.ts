import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // 플레이라이트에서 확인한 Customer ID들
    const customerIds = [
      '7398653521', // 마쓰구 1
      '4495437776', // 싱싱골프
      '7571427013', // 광교골프 관리자
      '6417483168', // MASGOLF2
      '6386852846'  // 마쓰구 3 (취소됨)
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
    for (const customerId of customerIds) {
      try {
        const customer = client.Customer({
          customer_id: customerId,
          refresh_token: envVars.refresh_token,
        });

        const accountInfo = await customer.query(`
          SELECT 
            customer.id,
            customer.descriptive_name,
            customer.currency_code,
            customer.time_zone
          FROM customer 
          LIMIT 1
        `);

        results.push({
          customerId,
          customerIdWithHyphens: `${customerId.slice(0,3)}-${customerId.slice(3,6)}-${customerId.slice(6)}`,
          status: '성공',
          data: accountInfo[0]
        });

      } catch (error) {
        results.push({
          customerId,
          customerIdWithHyphens: `${customerId.slice(0,3)}-${customerId.slice(3,6)}-${customerId.slice(6)}`,
          status: '실패',
          error: error.message,
          errorCode: error.code
        });
      }
    }

    return res.status(200).json({
      status: '완료',
      message: '모든 Customer ID 테스트 완료',
      results,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    return res.status(500).json({
      status: '오류',
      message: '예상치 못한 오류가 발생했습니다.',
      error: error.message
    });
  }
}
