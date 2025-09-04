import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // 1단계: 환경변수 상세 확인
    const envVars = {
      client_id: process.env.GOOGLE_ADS_CLIENT_ID,
      client_secret: process.env.GOOGLE_ADS_CLIENT_SECRET,
      developer_token: process.env.GOOGLE_ADS_DEVELOPER_TOKEN,
      customer_id: process.env.GOOGLE_ADS_CUSTOMER_ID,
      mcc_id: process.env.GOOGLE_ADS_MCC_ID,
      refresh_token: process.env.GOOGLE_ADS_REFRESH_TOKEN,
    };

    // 환경변수 유효성 검사
    const envValidation = {
      client_id: {
        exists: !!envVars.client_id,
        valid: !!(envVars.client_id && !envVars.client_id.includes('your_')),
        format: envVars.client_id?.includes('.apps.googleusercontent.com') ? 'valid' : 'invalid'
      },
      client_secret: {
        exists: !!envVars.client_secret,
        valid: !!(envVars.client_secret && !envVars.client_secret.includes('your_')),
        format: envVars.client_secret?.startsWith('GOCSPX-') ? 'valid' : 'invalid'
      },
      developer_token: {
        exists: !!envVars.developer_token,
        valid: !!(envVars.developer_token && !envVars.developer_token.includes('your_')),
        format: envVars.developer_token?.length > 10 ? 'valid' : 'invalid'
      },
      customer_id: {
        exists: !!envVars.customer_id,
        valid: !!(envVars.customer_id && !envVars.customer_id.includes('your_')),
        format: /^\d{10}$/.test(envVars.customer_id || '') ? 'valid' : 'invalid'
      },
      refresh_token: {
        exists: !!envVars.refresh_token,
        valid: !!(envVars.refresh_token && !envVars.refresh_token.includes('your_')),
        format: envVars.refresh_token?.startsWith('1//') ? 'valid' : 'invalid'
      }
    };

    // 2단계: Google Ads API 패키지 확인
    let googleAdsApi;
    try {
      googleAdsApi = require('google-ads-api');
    } catch (error) {
      return res.status(200).json({
        step: '패키지 확인',
        status: '실패',
        message: 'google-ads-api 패키지가 설치되지 않았습니다.',
        error: error.message,
        nextStep: 'npm install google-ads-api 실행하세요.'
      });
    }

    // 3단계: API 클라이언트 초기화 테스트
    let client;
    try {
      client = new googleAdsApi.GoogleAdsApi({
        client_id: envVars.client_id,
        client_secret: envVars.client_secret,
        developer_token: envVars.developer_token,
      });
    } catch (error) {
      return res.status(200).json({
        step: '클라이언트 초기화',
        status: '실패',
        message: 'Google Ads API 클라이언트 초기화 실패',
        error: error.message,
        envValidation,
        nextStep: '환경변수 형식을 확인하세요.'
      });
    }

    // 4단계: Customer 객체 생성 테스트
    let customer;
    try {
      customer = client.Customer({
        customer_id: envVars.customer_id,
        refresh_token: envVars.refresh_token,
      });
    } catch (error) {
      return res.status(200).json({
        step: 'Customer 객체 생성',
        status: '실패',
        message: 'Customer 객체 생성 실패',
        error: error.message,
        envValidation,
        nextStep: 'Customer ID와 Refresh Token을 확인하세요.'
      });
    }

    // 5단계: 간단한 쿼리 테스트 (계정 정보 조회)
    try {
      const accountInfo = await customer.query(`
        SELECT 
          customer.id,
          customer.descriptive_name,
          customer.currency_code,
          customer.time_zone
        FROM customer 
        LIMIT 1
      `);

      return res.status(200).json({
        step: 'API 쿼리 테스트',
        status: '성공',
        message: 'Google Ads API 연결 성공',
        data: {
          accountInfo: accountInfo[0],
          envValidation,
          timestamp: new Date().toISOString()
        },
        nextStep: '캠페인 데이터 조회를 진행하세요.'
      });

    } catch (error) {
      return res.status(200).json({
        step: 'API 쿼리 테스트',
        status: '실패',
        message: 'API 쿼리 실행 실패',
        error: error.message,
        errorDetails: {
          name: error.name,
          code: error.code,
          status: error.status,
          details: error.details
        },
        envValidation,
        nextStep: 'Developer Token 권한과 Customer ID를 확인하세요.'
      });
    }

  } catch (error) {
    return res.status(500).json({
      step: '전체 테스트',
      status: '오류',
      message: '예상치 못한 오류가 발생했습니다.',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
}
