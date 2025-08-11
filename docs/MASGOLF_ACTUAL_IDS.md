# MASGOLF 실제 추적 ID 설정 가이드

## 📊 현재 확인된 ID들

### Google Analytics 4
```env
GA4_MEASUREMENT_ID=G-SMJWL2TRM7
GA4_PROPERTY_ID=properties/[GA4에서 확인 필요]
```

### Google Ads  
```env
GOOGLE_ADS_CUSTOMER_ID=1475194272
GOOGLE_ADS_CONVERSION_ID=AW-[전환 설정에서 확인 필요]
```

### Google Tag Manager
```env
GTM_CONTAINER_ID=GTM-WPBX97JG
```

---

## 🔍 ID 찾는 방법

### 1. GA4 Property ID 찾기
1. [Google Analytics](https://analytics.google.com) 접속
2. 관리 → 속성 → 속성 세부정보
3. 속성 ID 복사 (숫자만, 예: 123456789)

### 2. Google Ads 전환 ID 찾기  
1. [Google Ads](https://ads.google.com) 접속
2. 도구 및 설정 → 측정 → 전환
3. 전환 액션 생성 또는 기존 것 클릭
4. 태그 설정에서 AW- 형태의 ID 확인

---

## 📝 API 구현 예시

### Google Analytics Data API
```typescript
// pages/api/analytics/realtime.ts
import { BetaAnalyticsDataClient } from '@google-analytics/data';

const analyticsDataClient = new BetaAnalyticsDataClient({
  credentials: {
    client_email: process.env.GA_CLIENT_EMAIL,
    private_key: process.env.GA_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  },
});

export default async function handler(req, res) {
  try {
    const [response] = await analyticsDataClient.runRealtimeReport({
      property: 'properties/YOUR_PROPERTY_ID', // 실제 숫자 ID 입력
      metrics: [
        { name: 'activeUsers' },
        { name: 'screenPageViews' }
      ],
      dimensions: [
        { name: 'country' },
        { name: 'deviceCategory' }
      ]
    });
    
    res.status(200).json(response);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
```

### Google Ads API
```typescript
// pages/api/googleads/campaigns.ts
import { GoogleAdsApi } from 'google-ads-api';

const client = new GoogleAdsApi({
  client_id: process.env.GOOGLE_ADS_CLIENT_ID,
  client_secret: process.env.GOOGLE_ADS_CLIENT_SECRET,
  developer_token: process.env.GOOGLE_ADS_DEVELOPER_TOKEN,
});

export default async function handler(req, res) {
  try {
    const customer = client.Customer({
      customer_id: '1475194272', // 확인된 Customer ID
      refresh_token: process.env.GOOGLE_ADS_REFRESH_TOKEN,
    });
    
    const campaigns = await customer.query(`
      SELECT 
        campaign.id,
        campaign.name,
        metrics.impressions,
        metrics.clicks,
        metrics.cost_micros
      FROM campaign 
      WHERE segments.date DURING LAST_7_DAYS
    `);
    
    res.status(200).json(campaigns);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
```

---

## ⚠️ 환경 변수 설정

### .env.local 파일
```env
# Google Analytics
GA_MEASUREMENT_ID=G-SMJWL2TRM7
GA_PROPERTY_ID=properties/[숫자입력]
GA_CLIENT_EMAIL=your-service-account@project.iam.gserviceaccount.com
GA_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

# Google Ads  
GOOGLE_ADS_CUSTOMER_ID=1475194272
GOOGLE_ADS_CLIENT_ID=your-client-id
GOOGLE_ADS_CLIENT_SECRET=your-client-secret
GOOGLE_ADS_DEVELOPER_TOKEN=your-developer-token
GOOGLE_ADS_REFRESH_TOKEN=your-refresh-token

# Google Tag Manager
GTM_CONTAINER_ID=GTM-WPBX97JG
```

---

## 🚀 다음 단계

1. **GA4 Property ID 확인** - analytics.google.com에서
2. **Google Ads 전환 설정** - ads.google.com에서  
3. **서비스 계정 생성** - console.cloud.google.com에서
4. **API 키 발급** - developers.google.com에서
5. **환경 변수 설정** - .env.local 파일에