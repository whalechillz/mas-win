import { NextApiRequest, NextApiResponse } from 'next';
import { GoogleAdsApi } from 'google-ads-api';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // 1단계: 환경변수 확인
    const envVars = {
      client_id: process.env.GOOGLE_ADS_CLIENT_ID,
      client_secret: process.env.GOOGLE_ADS_CLIENT_SECRET,
      developer_token: process.env.GOOGLE_ADS_DEVELOPER_TOKEN,
      customer_id: process.env.GOOGLE_ADS_CUSTOMER_ID || process.env.GOOGLE_ADS_MCC_ID,
      refresh_token: process.env.GOOGLE_ADS_REFRESH_TOKEN,
    };

    // 환경변수 상태 확인
    const envStatus = {
      client_id: { exists: !!envVars.client_id, valid: !!(envVars.client_id && !envVars.client_id.includes('your_')) },
      client_secret: { exists: !!envVars.client_secret, valid: !!(envVars.client_secret && !envVars.client_secret.includes('your_')) },
      developer_token: { exists: !!envVars.developer_token, valid: !!(envVars.developer_token && !envVars.developer_token.includes('your_')) },
      customer_id: { exists: !!envVars.customer_id, valid: !!(envVars.customer_id && !envVars.customer_id.includes('your_')) },
      refresh_token: { exists: !!envVars.refresh_token, valid: !!(envVars.refresh_token && !envVars.refresh_token.includes('your_')) }
    };

    const allValid = Object.values(envStatus).every(v => v.valid);
    
    if (!allValid) {
      return res.status(200).json({
        step: '환경변수 확인',
        status: '실패',
        message: '일부 환경변수가 설정되지 않았습니다.',
        details: envStatus,
        nextStep: '모든 환경변수를 올바르게 설정하세요.'
      });
    }

    // 2단계: Google Ads API 클라이언트 초기화
    let client;
    try {
      client = new GoogleAdsApi({
        client_id: envVars.client_id!,
        client_secret: envVars.client_secret!,
        developer_token: envVars.developer_token!,
      });
    } catch (error) {
      return res.status(200).json({
        step: 'API 클라이언트 초기화',
        status: '실패',
        message: 'Google Ads API 클라이언트 초기화에 실패했습니다.',
        error: error instanceof Error ? error.message : 'Unknown error',
        details: envStatus
      });
    }

    // 3단계: Customer 객체 생성
    let customer;
    try {
      customer = client.Customer({
        customer_id: envVars.customer_id!,
        refresh_token: envVars.refresh_token!,
      });
    } catch (error) {
      return res.status(200).json({
        step: 'Customer 객체 생성',
        status: '실패',
        message: 'Customer 객체 생성에 실패했습니다.',
        error: error instanceof Error ? error.message : 'Unknown error',
        details: envStatus
      });
    }

    // 4단계: 더 간단한 쿼리 테스트
    try {
      const testQuery = `
        SELECT 
          customer.id
        FROM customer 
        LIMIT 1
      `;
      
      console.log('Google Ads API 쿼리 실행 중...', {
        customer_id: envVars.customer_id,
        query: testQuery
      });
      
      const response = await customer.query(testQuery);
      
      return res.status(200).json({
        step: 'API 쿼리 테스트',
        status: '성공',
        message: 'Google Ads API 연결이 성공했습니다!',
        customerInfo: response[0] ? {
          id: response[0].customer.id
        } : null,
        details: envStatus,
        nextStep: '이제 실제 캠페인 데이터를 가져올 수 있습니다.'
      });
      
    } catch (error) {
      console.error('Google Ads API 오류 상세:', {
        error: error,
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      });
      
      return res.status(200).json({
        step: 'API 쿼리 테스트',
        status: '실패',
        message: 'API 쿼리 실행에 실패했습니다.',
        error: error instanceof Error ? error.message : 'Unknown error',
        errorDetails: {
          name: error instanceof Error ? error.name : 'Unknown',
          stack: error instanceof Error ? error.stack : undefined,
          fullError: JSON.stringify(error, Object.getOwnPropertyNames(error))
        },
        details: envStatus,
        nextStep: 'Developer Token과 API 권한을 확인하세요.'
      });
    }

  } catch (error) {
    res.status(500).json({
      step: '전체 프로세스',
      status: '오류',
      message: '예상치 못한 오류가 발생했습니다.',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
