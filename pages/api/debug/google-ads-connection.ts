import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Google Ads 관련 환경변수 확인
    const googleAdsVars = {
      GOOGLE_ADS_CLIENT_ID: process.env.GOOGLE_ADS_CLIENT_ID,
      GOOGLE_ADS_CLIENT_SECRET: process.env.GOOGLE_ADS_CLIENT_SECRET,
      GOOGLE_ADS_DEVELOPER_TOKEN: process.env.GOOGLE_ADS_DEVELOPER_TOKEN,
      GOOGLE_ADS_CUSTOMER_ID: process.env.GOOGLE_ADS_CUSTOMER_ID,
      GOOGLE_ADS_MCC_ID: process.env.GOOGLE_ADS_MCC_ID,
      GOOGLE_ADS_REFRESH_TOKEN: process.env.GOOGLE_ADS_REFRESH_TOKEN,
    };

    // GA4 관련 환경변수 확인
    const ga4Vars = {
      GA4_PROPERTY_ID: process.env.GA4_PROPERTY_ID,
      GOOGLE_SERVICE_ACCOUNT_EMAIL: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      GOOGLE_SERVICE_ACCOUNT_KEY: process.env.GOOGLE_SERVICE_ACCOUNT_KEY,
    };

    // 환경변수 상태 분석
    const analysis = {
      googleAds: {
        total: Object.keys(googleAdsVars).length,
        set: Object.values(googleAdsVars).filter(v => v && !v.includes('your_')).length,
        variables: Object.entries(googleAdsVars).map(([key, value]) => ({
          name: key,
          exists: !!value,
          valid: !!(value && !value.includes('your_')),
          masked: value ? `${value.substring(0, 8)}...` : '없음'
        }))
      },
      ga4: {
        total: Object.keys(ga4Vars).length,
        set: Object.values(ga4Vars).filter(v => v && !v.includes('your_')).length,
        variables: Object.entries(ga4Vars).map(([key, value]) => ({
          name: key,
          exists: !!value,
          valid: !!(value && !value.includes('your_')),
          masked: value ? `${value.substring(0, 8)}...` : '없음'
        }))
      }
    };

    // Google Ads API 패키지 확인
    let googleAdsPackageAvailable = false;
    try {
      require('google-ads-api');
      googleAdsPackageAvailable = true;
    } catch (error) {
      googleAdsPackageAvailable = false;
    }

    res.status(200).json({
      timestamp: new Date().toISOString(),
      googleAds: {
        ...analysis.googleAds,
        packageAvailable: googleAdsPackageAvailable,
        ready: analysis.googleAds.set === analysis.googleAds.total && googleAdsPackageAvailable
      },
      ga4: {
        ...analysis.ga4,
        ready: analysis.ga4.set === analysis.ga4.total
      },
      summary: {
        googleAdsReady: analysis.googleAds.set === analysis.googleAds.total && googleAdsPackageAvailable,
        ga4Ready: analysis.ga4.set === analysis.ga4.total,
        totalVars: analysis.googleAds.total + analysis.ga4.total,
        setVars: analysis.googleAds.set + analysis.ga4.set
      }
    });

  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Unknown error',
      message: '환경변수 확인 중 오류가 발생했습니다.'
    });
  }
}
