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

    // 다양한 API 쿼리 테스트
    const testResults = [];

    // 1. 기본 계정 정보 조회
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
      testResults.push({
        test: '기본 계정 정보 조회',
        status: '성공',
        data: accountInfo
      });
    } catch (error) {
      testResults.push({
        test: '기본 계정 정보 조회',
        status: '실패',
        error: {
          message: error.message,
          name: error.name,
          code: error.code,
          status: error.status,
          details: error.details
        }
      });
    }

    // 2. 캠페인 목록 조회
    try {
      const campaigns = await customer.query(`
        SELECT 
          campaign.id,
          campaign.name,
          campaign.status
        FROM campaign 
        LIMIT 5
      `);
      testResults.push({
        test: '캠페인 목록 조회',
        status: '성공',
        data: campaigns
      });
    } catch (error) {
      testResults.push({
        test: '캠페인 목록 조회',
        status: '실패',
        error: {
          message: error.message,
          name: error.name,
          code: error.code,
          status: error.status,
          details: error.details
        }
      });
    }

    // 3. 계정 접근 권한 확인
    try {
      const accessInfo = await customer.query(`
        SELECT 
          customer_client.id,
          customer_client.descriptive_name,
          customer_client.manager
        FROM customer_client 
        LIMIT 1
      `);
      testResults.push({
        test: '계정 접근 권한 확인',
        status: '성공',
        data: accessInfo
      });
    } catch (error) {
      testResults.push({
        test: '계정 접근 권한 확인',
        status: '실패',
        error: {
          message: error.message,
          name: error.name,
          code: error.code,
          status: error.status,
          details: error.details
        }
      });
    }

    // 4. 광고 그룹 조회
    try {
      const adGroups = await customer.query(`
        SELECT 
          ad_group.id,
          ad_group.name,
          ad_group.status
        FROM ad_group 
        LIMIT 3
      `);
      testResults.push({
        test: '광고 그룹 조회',
        status: '성공',
        data: adGroups
      });
    } catch (error) {
      testResults.push({
        test: '광고 그룹 조회',
        status: '실패',
        error: {
          message: error.message,
          name: error.name,
          code: error.code,
          status: error.status,
          details: error.details
        }
      });
    }

    return res.status(200).json({
      status: '진단 완료',
      customerId: envVars.customer_id,
      testResults,
      summary: {
        total: testResults.length,
        success: testResults.filter(t => t.status === '성공').length,
        failed: testResults.filter(t => t.status === '실패').length
      }
    });

  } catch (error) {
    return res.status(200).json({
      status: '진단 실패',
      message: '전체 진단 과정에서 오류 발생',
      error: {
        message: error.message,
        name: error.name,
        stack: error.stack?.split('\n').slice(0, 10)
      }
    });
  }
}
