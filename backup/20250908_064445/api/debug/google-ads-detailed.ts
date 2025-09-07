import { NextApiRequest, NextApiResponse } from 'next';
import { GoogleAdsApi } from 'google-ads-api';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const envVars = {
    client_id: process.env.GOOGLE_ADS_CLIENT_ID,
    client_secret: process.env.GOOGLE_ADS_CLIENT_SECRET,
    developer_token: process.env.GOOGLE_ADS_DEVELOPER_TOKEN,
    login_customer_id: process.env.GOOGLE_ADS_LOGIN_CUSTOMER_ID,
    customer_id: process.env.GOOGLE_ADS_CUSTOMER_ID,
    refresh_token: process.env.GOOGLE_ADS_REFRESH_TOKEN,
  };

  try {
    // API 클라이언트 초기화
    const client = new GoogleAdsApi({
      client_id: envVars.client_id!,
      client_secret: envVars.client_secret!,
      developer_token: envVars.developer_token!,
    });

    // Customer 객체 생성 (login-customer-id 포함)
    const customer = client.Customer({
      customer_id: envVars.customer_id!,
      refresh_token: envVars.refresh_token!,
      login_customer_id: envVars.login_customer_id,
    });

    // 1. 계정 정보 확인
    try {
      const accountQuery = `
        SELECT 
          customer.id,
          customer.descriptive_name,
          customer.currency_code,
          customer.time_zone
        FROM customer 
        LIMIT 1
      `;
      
      const accountInfo = await customer.query(accountQuery);
      
      // 2. 캠페인 수 확인
      const campaignCountQuery = `
        SELECT 
          COUNT(*) as count
        FROM campaign 
        WHERE campaign.status != 'REMOVED'
      `;
      
      const campaignCount = await customer.query(campaignCountQuery);
      
      // 3. 최근 캠페인 확인
      const recentCampaignsQuery = `
        SELECT 
          campaign.id,
          campaign.name,
          campaign.status,
          metrics.impressions,
          metrics.clicks,
          metrics.cost_micros
        FROM campaign 
        WHERE campaign.status != 'REMOVED'
        ORDER BY campaign.id DESC
        LIMIT 5
      `;
      
      const recentCampaigns = await customer.query(recentCampaignsQuery);
      
      return res.status(200).json({
        status: 'success',
        message: 'API 연결 성공!',
        accountInfo: accountInfo[0] || null,
        campaignCount: campaignCount.length,
        recentCampaigns: recentCampaigns.map((camp: any) => ({
          id: camp.campaign.id,
          name: camp.campaign.name,
          status: camp.campaign.status,
          impressions: camp.metrics?.impressions || 0,
          clicks: camp.metrics?.clicks || 0,
          cost: camp.metrics?.cost_micros ? (parseFloat(camp.metrics.cost_micros) / 1000000) : 0
        })),
        envVars: {
          login_customer_id: envVars.login_customer_id,
          customer_id: envVars.customer_id,
          has_refresh_token: !!envVars.refresh_token,
          token_preview: envVars.refresh_token ? envVars.refresh_token.substring(0, 20) + '...' : null
        }
      });
      
    } catch (queryError: any) {
      return res.status(200).json({
        status: 'query_error',
        message: 'API 연결은 성공했지만 쿼리 실행 실패',
        error: queryError.message || 'Unknown query error',
        errorDetails: queryError.errors || [],
        envVars: {
          login_customer_id: envVars.login_customer_id,
          customer_id: envVars.customer_id,
          has_refresh_token: !!envVars.refresh_token,
          token_preview: envVars.refresh_token ? envVars.refresh_token.substring(0, 20) + '...' : null
        },
        suggestion: '계정 권한, Customer ID, 또는 OAuth 토큰을 확인하세요.'
      });
    }

  } catch (error: any) {
    res.status(500).json({
      status: 'connection_error',
      message: 'API 연결 실패',
      error: error.message || 'Unknown error',
      errorStack: error.stack || '',
      envVars: {
        has_client_id: !!envVars.client_id,
        has_client_secret: !!envVars.client_secret,
        has_developer_token: !!envVars.developer_token,
        login_customer_id: envVars.login_customer_id,
        customer_id: envVars.customer_id,
        has_refresh_token: !!envVars.refresh_token
      }
    });
  }
}
