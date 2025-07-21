// GA4 데이터 가져오기 API
import { NextApiRequest, NextApiResponse } from 'next';
import { google } from 'googleapis';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // 서비스 계정 인증 설정
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
        private_key: process.env.GOOGLE_SERVICE_ACCOUNT_KEY?.replace(/\\n/g, '\n'),
      },
      scopes: ['https://www.googleapis.com/auth/analytics.readonly'],
    });

    const analyticsData = google.analyticsdata('v1beta');
    const propertyId = process.env.GA4_PROPERTY_ID;

    if (!propertyId) {
      return res.status(500).json({ error: 'GA4_PROPERTY_ID not configured' });
    }

    // 캠페인별 데이터 가져오기
    const response = await analyticsData.properties.runReport({
      property: `properties/${propertyId}`,
      auth,
      requestBody: {
        dateRanges: [
          {
            startDate: '2025-07-01',
            endDate: 'today',
          },
        ],
        dimensions: [
          { name: 'customEvent:campaign_id' }, // 캠페인 ID
          { name: 'pagePath' }, // 페이지 경로
        ],
        metrics: [
          { name: 'screenPageViews' }, // 페이지 조회수
          { name: 'activeUsers' }, // 활성 사용자
          { name: 'newUsers' }, // 신규 사용자
          { name: 'eventCount' }, // 이벤트 수
        ],
        dimensionFilter: {
          filter: {
            fieldName: 'pagePath',
            stringFilter: {
              matchType: 'CONTAINS',
              value: 'funnel',
            },
          },
        },
      },
    });

    // 데이터 처리
    const rows = response.data.rows || [];
    const campaignMetrics = {};

    rows.forEach((row) => {
      const campaignId = row.dimensionValues?.[0]?.value || '2025-07';
      const views = parseInt(row.metricValues?.[0]?.value || '0');
      const activeUsers = parseInt(row.metricValues?.[1]?.value || '0');
      const newUsers = parseInt(row.metricValues?.[2]?.value || '0');
      const events = parseInt(row.metricValues?.[3]?.value || '0');

      if (!campaignMetrics[campaignId]) {
        campaignMetrics[campaignId] = {
          campaign_id: campaignId,
          views: 0,
          unique_visitors: 0,
          new_users: 0,
          events: 0,
        };
      }

      campaignMetrics[campaignId].views += views;
      campaignMetrics[campaignId].unique_visitors += activeUsers;
      campaignMetrics[campaignId].new_users += newUsers;
      campaignMetrics[campaignId].events += events;
    });

    // 전화 클릭 이벤트 가져오기
    const phoneClickResponse = await analyticsData.properties.runReport({
      property: `properties/${propertyId}`,
      auth,
      requestBody: {
        dateRanges: [{ startDate: '2025-07-01', endDate: 'today' }],
        dimensions: [{ name: 'customEvent:campaign_id' }],
        metrics: [{ name: 'eventCount' }],
        dimensionFilter: {
          filter: {
            fieldName: 'eventName',
            stringFilter: {
              matchType: 'EXACT',
              value: 'phone_click',
            },
          },
        },
      },
    });

    // 전화 클릭 데이터 병합
    (phoneClickResponse.data.rows || []).forEach((row) => {
      const campaignId = row.dimensionValues?.[0]?.value || '2025-07';
      const phoneClicks = parseInt(row.metricValues?.[0]?.value || '0');
      
      if (campaignMetrics[campaignId]) {
        campaignMetrics[campaignId].phone_clicks = phoneClicks;
      }
    });

    // Supabase에 업데이트
    if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
      const { createClient } = await import('@supabase/supabase-js');
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
      );

      // 각 캠페인 메트릭 업데이트
      for (const [campaignId, metrics] of Object.entries(campaignMetrics)) {
        await supabase
          .from('campaign_metrics')
          .upsert({
            campaign_id: campaignId,
            views: metrics.views,
            unique_visitors: metrics.unique_visitors,
            phone_clicks: metrics.phone_clicks || 0,
            updated_at: new Date().toISOString(),
          })
          .eq('campaign_id', campaignId);
      }
    }

    return res.status(200).json({
      success: true,
      data: campaignMetrics,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('GA4 API Error:', error);
    return res.status(500).json({ 
      error: 'Failed to fetch GA4 data',
      details: error.message 
    });
  }
}