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

    // 5단계: Developer Token 검증
    try {
      // 먼저 간단한 쿼리로 Developer Token 유효성 검증
      const tokenValidation = await customer.query(`
        SELECT 
          customer.id
        FROM customer 
        LIMIT 1
      `);
      
      // Developer Token이 유효한 경우에만 계정 정보 조회
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
      // 더 자세한 오류 정보 수집
      const errorInfo = {
        message: error.message,
        name: error.name,
        code: error.code,
        status: error.status,
        details: error.details,
        stack: error.stack?.split('\n').slice(0, 5), // 스택 트레이스 일부만
        response: error.response?.data,
        request: {
          url: error.request?.url,
          method: error.request?.method,
          headers: error.request?.headers
        },
        // Google Ads API 특화 오류 정보
        googleAdsError: {
          errorCode: error.code,
          errorMessage: error.message,
          errorDetails: error.details,
          requestId: error.requestId,
          errors: error.errors
        }
      };

      // Customer ID 검증을 위한 추가 정보
      const customerIdInfo = {
        provided: envVars.customer_id,
        format: /^\d{10}$/.test(envVars.customer_id || '') ? 'valid' : 'invalid',
        withHyphens: envVars.customer_id ? `${envVars.customer_id.slice(0,3)}-${envVars.customer_id.slice(3,6)}-${envVars.customer_id.slice(6)}` : 'N/A'
      };

      // 오류 유형별 구체적인 분석
      let specificError = '알 수 없는 오류';
      let specificNextStep = 'Google Ads API 문서를 확인하세요.';
      
      if (error.message?.includes('DEVELOPER_TOKEN_INVALID')) {
        specificError = 'Developer Token이 유효하지 않습니다.';
        specificNextStep = 'Google Ads API Center에서 Developer Token 상태를 확인하고 재승인을 요청하세요.';
      } else if (error.message?.includes('CUSTOMER_NOT_FOUND')) {
        specificError = 'Customer ID를 찾을 수 없습니다.';
        specificNextStep = '올바른 10자리 Customer ID를 사용하고 있는지 확인하세요.';
      } else if (error.message?.includes('AUTHENTICATION_ERROR')) {
        specificError = '인증 오류가 발생했습니다.';
        specificNextStep = 'Refresh Token이 유효한지 확인하고 필요시 재발급하세요.';
      } else if (error.message?.includes('PERMISSION_DENIED')) {
        specificError = '권한이 거부되었습니다.';
        specificNextStep = 'Google Ads 계정에서 API 접근 권한을 확인하세요.';
      }

      return res.status(200).json({
        step: 'API 쿼리 테스트',
        status: '실패',
        message: specificError,
        originalError: error.message,
        errorDetails: errorInfo,
        customerIdInfo,
        envValidation,
        nextStep: specificNextStep
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
