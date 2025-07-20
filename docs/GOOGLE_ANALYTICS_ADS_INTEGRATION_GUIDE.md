# Google Analytics & Google Ads 통합 가이드

## 📊 1. 현재 상황
- ✅ 데이터베이스 설정 완료
- ✅ API 엔드포인트 준비 완료 (`/api/track-view`)
- ❌ 퍼널 페이지에 추적 코드 미설치 → **조회수 0**

## 🚀 2. 즉시 조회수 추적 시작하기

### Step 1: 퍼널 페이지에 추적 코드 추가
```bash
# 자동 추가 스크립트 실행
chmod +x ./scripts/add-view-tracking.sh
./scripts/add-view-tracking.sh
```

또는 수동으로 `/public/versions/funnel-2025-07-complete.html`의 `</body>` 태그 앞에:
```html
<script>
window.addEventListener('load', function() {
  fetch('/api/track-view', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({
      campaign_id: '2025-07',
      page: '/funnel-2025-07'
    })
  });
});
</script>
```

### Step 2: 배포 및 확인
```bash
git add .
git commit -m "feat: 조회수 추적 코드 추가"
git push
vercel --prod
```

## 📈 3. Google Analytics 4 설정

### 3.1 GA4 계정 설정
1. [Google Analytics](https://analytics.google.com) 접속
2. **관리 → 속성 만들기**
3. 속성 이름: "MASGOLF 캠페인"
4. 시간대: 대한민국
5. 통화: KRW

### 3.2 데이터 스트림 설정
1. **데이터 스트림 → 웹 → 스트림 추가**
2. URL: `https://win.masgolf.co.kr`
3. 스트림 이름: "MASGOLF 메인"
4. **측정 ID 복사**: `G-XXXXXXXXXX`

### 3.3 환경변수 설정
```bash
# .env.local
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX
```

### 3.4 GA4 코드 추가
`/pages/_app.tsx` 또는 `/pages/_document.tsx`에:
```tsx
import Script from 'next/script'

// Google Analytics
<Script
  src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID}`}
  strategy="afterInteractive"
/>
<Script id="google-analytics" strategy="afterInteractive">
  {`
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', '${process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID}', {
      page_path: window.location.pathname,
    });
  `}
</Script>
```

### 3.5 이벤트 추적
```javascript
// 예약 버튼 클릭 추적
gtag('event', 'booking_click', {
  event_category: 'engagement',
  event_label: '7월 캠페인',
  value: 1
});

// 전화번호 클릭 추적
gtag('event', 'phone_click', {
  event_category: 'contact',
  event_label: '080-028-8888'
});
```

## 💰 4. Google Ads 전환 추적

### 4.1 Google Ads 전환 설정
1. [Google Ads](https://ads.google.com) 접속
2. **도구 및 설정 → 측정 → 전환**
3. **+ 버튼 → 웹사이트**
4. 전환 이름: "시타 예약"
5. 가치: 1,000,000원
6. **태그 설정 → Google 태그 사용**

### 4.2 전환 추적 코드
```html
<!-- 예약 완료 페이지에 추가 -->
<script>
  gtag('event', 'conversion', {
    'send_to': 'AW-XXXXXXXXX/XXXXXXXXXXXXXX',
    'value': 1000000,
    'currency': 'KRW'
  });
</script>
```

### 4.3 리마케팅 태그
```javascript
// 페이지 방문자 추적
gtag('event', 'page_view', {
  'send_to': 'AW-XXXXXXXXX',
  'value': 'golf_club',
  'items': [{
    'id': '2025-07',
    'google_business_vertical': 'retail'
  }]
});
```

## 📊 5. GA4 데이터 API 연동

### 5.1 서비스 계정 생성
1. [Google Cloud Console](https://console.cloud.google.com)
2. **API 및 서비스 → 사용자 인증 정보**
3. **서비스 계정 만들기**
4. JSON 키 다운로드

### 5.2 API 구현
```typescript
// /pages/api/analytics-data.ts
import { BetaAnalyticsDataClient } from '@google-analytics/data';

const analyticsDataClient = new BetaAnalyticsDataClient({
  credentials: {
    client_email: process.env.GA_CLIENT_EMAIL,
    private_key: process.env.GA_PRIVATE_KEY.replace(/\\n/g, '\n'),
  },
});

export default async function handler(req, res) {
  const [response] = await analyticsDataClient.runReport({
    property: `properties/${process.env.GA_PROPERTY_ID}`,
    dateRanges: [{ startDate: '7daysAgo', endDate: 'today' }],
    dimensions: [{ name: 'pagePath' }],
    metrics: [
      { name: 'activeUsers' },
      { name: 'screenPageViews' },
      { name: 'averageSessionDuration' }
    ],
    dimensionFilter: {
      filter: {
        fieldName: 'pagePath',
        stringFilter: {
          matchType: 'CONTAINS',
          value: '/funnel-2025-07'
        }
      }
    }
  });

  // 데이터 가공
  const data = response.rows?.map(row => ({
    page: row.dimensionValues[0].value,
    users: row.metricValues[0].value,
    views: row.metricValues[1].value,
    avgDuration: row.metricValues[2].value
  }));

  res.json({ data });
}
```

### 5.3 환경변수
```bash
# .env.local
GA_PROPERTY_ID=123456789
GA_CLIENT_EMAIL=your-service-account@project.iam.gserviceaccount.com
GA_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----"
```

## 🎯 6. Google Ads API 연동

### 6.1 필요한 패키지
```bash
npm install google-ads-api
```

### 6.2 API 구현
```typescript
// /pages/api/google-ads-data.ts
import { GoogleAdsApi } from 'google-ads-api';

const client = new GoogleAdsApi({
  client_id: process.env.GOOGLE_ADS_CLIENT_ID,
  client_secret: process.env.GOOGLE_ADS_CLIENT_SECRET,
  developer_token: process.env.GOOGLE_ADS_DEVELOPER_TOKEN,
});

export default async function handler(req, res) {
  const customer = client.Customer({
    customer_id: process.env.GOOGLE_ADS_CUSTOMER_ID,
    refresh_token: process.env.GOOGLE_ADS_REFRESH_TOKEN,
  });

  // 캠페인 성과 데이터 가져오기
  const campaigns = await customer.report({
    entity: 'campaign',
    attributes: ['campaign.name', 'campaign.id'],
    metrics: [
      'metrics.impressions',
      'metrics.clicks',
      'metrics.cost_micros',
      'metrics.conversions',
      'metrics.cost_per_conversion'
    ],
    constraints: {
      'campaign.name': ['여름 특별 캠페인']
    },
    from_date: '2025-07-01',
    to_date: '2025-07-31'
  });

  res.json({ campaigns });
}
```

## 📊 7. 대시보드 통합

### 7.1 실시간 데이터 표시
```tsx
// 컴포넌트에서 사용
const [analyticsData, setAnalyticsData] = useState(null);
const [adsData, setAdsData] = useState(null);

useEffect(() => {
  // GA4 데이터
  fetch('/api/analytics-data')
    .then(res => res.json())
    .then(data => setAnalyticsData(data));
  
  // Google Ads 데이터
  fetch('/api/google-ads-data')
    .then(res => res.json())
    .then(data => setAdsData(data));
}, []);
```

## 🔍 8. KPI 추적 체크리스트

### 필수 KPI
- [ ] 페이지 조회수 (GA4 + 자체 추적)
- [ ] 순 방문자 수 (GA4)
- [ ] 평균 체류 시간 (GA4)
- [ ] 이탈률 (GA4)
- [ ] 전환율 (예약/방문)
- [ ] 획득 비용 (CPA)
- [ ] 광고 투자 수익률 (ROAS)

### 추가 KPI
- [ ] 디바이스별 전환율
- [ ] 유입 채널별 성과
- [ ] 시간대별 트래픽
- [ ] 지역별 방문자
- [ ] 광고 노출수 대비 클릭률 (CTR)

## 🚨 9. 즉시 해야 할 일

1. **퍼널 페이지에 추적 코드 추가** (가장 중요!)
   ```bash
   ./scripts/add-view-tracking.sh
   ```

2. **GA4 측정 ID 발급**
   - Google Analytics에서 속성 생성
   - 측정 ID를 환경변수에 추가

3. **Google Ads 전환 추적 설정**
   - 예약 완료 시 전환 이벤트 발생

4. **배포**
   ```bash
   vercel --prod
   ```

이렇게 하면 조회수가 실시간으로 추적되기 시작합니다!
