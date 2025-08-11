// pages/api/test-google-ads-connection.ts
import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // 환경변수 확인
    const hasClientId = !!process.env.GOOGLE_ADS_CLIENT_ID;
    const hasClientSecret = !!process.env.GOOGLE_ADS_CLIENT_SECRET;
    const hasDeveloperToken = !!process.env.GOOGLE_ADS_DEVELOPER_TOKEN;
    const hasRefreshToken = !!process.env.GOOGLE_ADS_REFRESH_TOKEN;
    const hasManagerId = !!process.env.GOOGLE_ADS_MANAGER_CUSTOMER_ID;
    
    const isFullyConfigured = hasClientId && hasClientSecret && hasDeveloperToken && hasRefreshToken;
    
    res.status(isFullyConfigured ? 200 : 500).json({
      status: isFullyConfigured ? '✅ Google Ads 연결 준비 완료' : '❌ Google Ads 설정 필요',
      configuration: {
        clientId: hasClientId ? '✅ 설정됨' : '❌ 없음',
        clientSecret: hasClientSecret ? '✅ 설정됨' : '❌ 없음',
        developerToken: hasDeveloperToken ? '✅ 설정됨' : '❌ 없음',
        refreshToken: hasRefreshToken ? '✅ 설정됨' : '❌ 없음',
        managerCustomerId: hasManagerId ? process.env.GOOGLE_ADS_MANAGER_CUSTOMER_ID : '❌ 없음'
      },
      accounts: hasManagerId ? {
        mcc: process.env.GOOGLE_ADS_MANAGER_CUSTOMER_ID,
        masgolf1: process.env.GOOGLE_ADS_MASGOLF1_ID,
        masgolf2: process.env.GOOGLE_ADS_MASGOLF2_ID,
        singsing: process.env.GOOGLE_ADS_SINGSING_ID
      } : null,
      setupProgress: `${[hasClientId, hasClientSecret, hasDeveloperToken, hasRefreshToken, hasManagerId].filter(Boolean).length}/5`,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ 
      error: error.message,
      status: '❌ Google Ads 연결 확인 실패'
    });
  }
}