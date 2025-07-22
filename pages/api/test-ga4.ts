// pages/api/test-ga4.ts
import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // 환경변수 확인
    const hasEmail = !!process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
    const hasKey = !!process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
    const hasPropertyId = !!process.env.GA4_PROPERTY_ID;
    
    res.status(200).json({
      status: 'GA4 설정 확인',
      serviceAccountEmail: hasEmail ? '✅ 설정됨' : '❌ 없음',
      serviceAccountKey: hasKey ? '✅ 설정됨' : '❌ 없음',
      propertyId: hasPropertyId ? process.env.GA4_PROPERTY_ID : '❌ 없음 (497433231 사용)',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}