# 조회수 추적 구현 가이드

## 1. 데이터베이스 설정

먼저 Supabase에서 다음 SQL을 실행하세요:

```sql
-- /database/page-views-tracking.sql 파일 내용 실행
```

## 2. 퍼널 페이지에 추적 코드 추가

### 방법 1: HTML 페이지에 직접 추가

```html
<!-- 페이지 하단에 추가 -->
<script>
// 페이지 로드 시 조회수 추적
window.addEventListener('load', function() {
  // 캠페인 ID 설정 (페이지별로 변경)
  const campaignId = '2025-07'; // 7월 캠페인
  const currentPage = window.location.pathname;
  
  // 조회수 추적 API 호출
  fetch('/api/track-view', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      campaign_id: campaignId,
      page: currentPage
    })
  }).catch(console.error);
});
</script>
```

### 방법 2: Next.js 페이지 컴포넌트에 추가

```tsx
// pages/funnel/[slug].tsx 또는 해당 페이지 컴포넌트

useEffect(() => {
  const trackView = async () => {
    try {
      await fetch('/api/track-view', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          campaign_id: '2025-07',
          page: router.asPath
        })
      });
    } catch (error) {
      console.error('조회수 추적 실패:', error);
    }
  };
  
  trackView();
}, []);
```

## 3. Google Analytics 연동 (선택사항)

더 정확한 분석을 원한다면 Google Analytics를 연동할 수 있습니다:

### GA4 설정

1. Google Analytics 4 속성 생성
2. 측정 ID 획득 (G-XXXXXXXXXX)
3. 환경변수에 추가:
   ```
   NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX
   ```

### 페이지에 GA4 추가

```html
<!-- Google Analytics -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-XXXXXXXXXX');
</script>
```

### GA4 API로 데이터 가져오기

```typescript
// pages/api/analytics.ts
import { google } from 'googleapis';

const analytics = google.analyticsdata('v1beta');

export default async function handler(req, res) {
  const auth = new google.auth.GoogleAuth({
    credentials: {
      // 서비스 계정 인증 정보
    },
    scopes: ['https://www.googleapis.com/auth/analytics.readonly'],
  });

  const response = await analytics.properties.runReport({
    property: 'properties/YOUR_PROPERTY_ID',
    auth,
    requestBody: {
      dateRanges: [{ startDate: '7daysAgo', endDate: 'today' }],
      dimensions: [{ name: 'pagePath' }],
      metrics: [{ name: 'screenPageViews' }],
      dimensionFilter: {
        filter: {
          fieldName: 'pagePath',
          stringFilter: {
            matchType: 'CONTAINS',
            value: '/funnel-2025-07'
          }
        }
      }
    }
  });

  res.json(response.data);
}
```

## 4. 실시간 조회수 표시

UnifiedCampaignManagerEnhanced 컴포넌트는 이미 Supabase에서 실시간으로 조회수를 가져오도록 구성되어 있습니다:

- campaigns 테이블의 views 필드 사용
- Supabase 실시간 구독으로 자동 업데이트

## 5. 주의사항

1. **중복 방지**: 같은 사용자의 반복 조회를 방지하려면 쿠키나 세션을 사용
2. **봇 필터링**: user-agent를 확인하여 봇 트래픽 제외
3. **성능**: 대량 트래픽 시 캐싱 고려

## 6. 테스트

1. 로컬 환경에서 퍼널 페이지 접속
2. 개발자 도구 > Network 탭에서 `/api/track-view` 요청 확인
3. Supabase 대시보드에서 campaigns 테이블의 views 증가 확인
