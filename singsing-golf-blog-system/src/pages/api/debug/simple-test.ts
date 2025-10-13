import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.status(200).json({
    message: 'API 서버가 정상 작동합니다',
    timestamp: new Date().toISOString(),
    envVars: {
      hasClientId: !!process.env.GOOGLE_ADS_CLIENT_ID,
      hasClientSecret: !!process.env.GOOGLE_ADS_CLIENT_SECRET,
      hasDeveloperToken: !!process.env.GOOGLE_ADS_DEVELOPER_TOKEN,
      hasRefreshToken: !!process.env.GOOGLE_ADS_REFRESH_TOKEN,
      hasCustomerId: !!process.env.GOOGLE_ADS_CUSTOMER_ID
    }
  });
}
