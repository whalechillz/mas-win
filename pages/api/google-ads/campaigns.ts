import { NextApiRequest, NextApiResponse } from 'next';
import { GoogleAdsApi } from 'google-ads-api';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // 환경 변수 확인
    const requiredEnvVars = {
      client_id: process.env.GOOGLE_ADS_CLIENT_ID,
      client_secret: process.env.GOOGLE_ADS_CLIENT_SECRET,
      developer_token: process.env.GOOGLE_ADS_DEVELOPER_TOKEN,
      customer_id: process.env.GOOGLE_ADS_CUSTOMER_ID || process.env.GOOGLE_ADS_MCC_ID,
      refresh_token: process.env.GOOGLE_ADS_REFRESH_TOKEN,
    };

    // 필수 환경 변수 확인
    const missingVars = Object.entries(requiredEnvVars)
      .filter(([key, value]) => !value || value.includes('your_'))
      .map(([key]) => key);

    if (missingVars.length > 0) {
      throw new Error(`Missing or invalid environment variables: ${missingVars.join(', ')}`);
    }

    // Google Ads API 클라이언트 초기화
    const client = new GoogleAdsApi({
      client_id: requiredEnvVars.client_id!,
      client_secret: requiredEnvVars.client_secret!,
      developer_token: requiredEnvVars.developer_token!,
    });

    const customer = client.Customer({
      customer_id: requiredEnvVars.customer_id!,
      refresh_token: requiredEnvVars.refresh_token!,
    });

    // 현재 월 데이터 조회 (8월)
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth() + 1;
    const startDate = `${currentYear}-${String(currentMonth).padStart(2, '0')}-01`;
    const endDate = currentDate.toISOString().split('T')[0];

    // 캠페인 데이터 조회 (현재 월)
    const query = `
      SELECT 
        campaign.id,
        campaign.name,
        campaign.status,
        campaign.start_date,
        campaign.end_date,
        metrics.impressions,
        metrics.clicks,
        metrics.cost_micros,
        metrics.conversions,
        metrics.conversions_value
      FROM campaign 
      WHERE campaign.status != 'REMOVED'
        AND segments.date >= '${startDate}'
        AND segments.date <= '${endDate}'
      ORDER BY campaign.start_date DESC
    `;

    const response = await customer.query(query);
    
    const campaigns = response.map((row: any) => ({
      id: row.campaign.id,
      name: row.campaign.name,
      status: row.campaign.status,
      startDate: row.campaign.startDate,
      endDate: row.campaign.endDate,
      impressions: parseInt(row.metrics.impressions || '0'),
      clicks: parseInt(row.metrics.clicks || '0'),
      cost: parseFloat(row.metrics.costMicros || '0') / 1000000, // micros to dollars
      conversions: parseFloat(row.metrics.conversions || '0'),
      conversionValue: parseFloat(row.metrics.conversionsValue || '0'),
      ctr: row.metrics.clicks && row.metrics.impressions 
        ? (parseFloat(row.metrics.clicks) / parseFloat(row.metrics.impressions) * 100).toFixed(2)
        : '0.00',
      cpc: row.metrics.clicks && row.metrics.costMicros
        ? (parseFloat(row.metrics.costMicros) / 1000000 / parseFloat(row.metrics.clicks)).toFixed(2)
        : '0.00',
    }));

    res.status(200).json({
      campaigns,
      dataSource: 'google_ads_api',
      period: `${startDate} ~ ${endDate}`,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Google Ads API Error:', error);
    
    // 오류 발생 시 모의 데이터로 폴백
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth() + 1;
    const startDate = `${currentYear}-${String(currentMonth).padStart(2, '0')}-01`;
    const endDate = currentDate.toISOString().split('T')[0];
    
    const fallbackData = {
      campaigns: [
        {
          id: '123456789',
          name: 'MASGOLF 현재 월 캠페인',
          status: 'ENABLED',
          startDate: startDate,
          endDate: endDate,
          impressions: 15420,
          clicks: 892,
          cost: 2345.67,
          conversions: 45,
          conversionValue: 12500,
          ctr: '5.79',
          cpc: '2.63'
        },
        {
          id: '987654321',
          name: '골프 클럽 특가 캠페인',
          status: 'ENABLED',
          startDate: startDate,
          endDate: endDate,
          impressions: 8920,
          clicks: 567,
          cost: 1890.45,
          conversions: 23,
          conversionValue: 8900,
          ctr: '6.36',
          cpc: '3.33'
        }
      ],
      dataSource: 'fallback_data',
      period: `${startDate} ~ ${endDate} (모의 데이터)`,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    };
    
    res.status(200).json(fallbackData);
  }
}