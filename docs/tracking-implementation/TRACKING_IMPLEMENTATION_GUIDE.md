# 실제 데이터 추적 구현 가이드

## 현재 상황
프로젝트에는 이미 추적을 위한 기본 구조가 마련되어 있습니다:
- ✅ PageViewTracker 컴포넌트
- ✅ ConversionTracker 컴포넌트
- ✅ Supabase 데이터베이스 테이블 (page_views, conversions)

## 구현 필요 사항

### 1. 조회수 추적 구현

#### 퍼널 페이지에 추적 적용
```tsx
// pages/funnel-2025-07.tsx 또는 새로운 퍼널 페이지
import { PageViewTracker } from '../components/tracking/PageViewTracker';

export default function FunnelPage() {
  const [supabase, setSupabase] = useState(null);
  
  // Supabase 초기화 (기존 코드 활용)
  
  return (
    <>
      {/* 페이지뷰 추적 컴포넌트 추가 */}
      {supabase && <PageViewTracker 
        campaignId="2025-07-prime" 
        supabase={supabase} 
      />}
      
      {/* 기존 퍼널 콘텐츠 */}
    </>
  );
}
```

### 2. 예약 전환 추적

#### 예약 성공 시 추적
```tsx
// 예약 처리 함수에 추가
const handleBookingSubmit = async (bookingData) => {
  try {
    // 예약 데이터 저장
    const { data, error } = await supabase
      .from('contacts')
      .insert(bookingData);
    
    if (!error) {
      // 전환 추적 추가
      await supabase
        .from('conversions')
        .insert({
          conversion_type: 'booking',
          campaign_id: campaignId,
          session_id: sessionStorage.getItem('session_id'),
          conversion_value: bookingData.price || 0,
          utm_source: sessionStorage.getItem('utm_source'),
          utm_medium: sessionStorage.getItem('utm_medium'),
          utm_campaign: sessionStorage.getItem('utm_campaign'),
          page_url: window.location.pathname
        });
    }
  } catch (error) {
    console.error('예약 처리 오류:', error);
  }
};
```

### 3. 문의 전환 추적

#### 문의 제출 시 추적
```tsx
// 문의 처리 함수에 추가
const handleInquirySubmit = async (inquiryData) => {
  try {
    // 문의 데이터 저장
    const { data, error } = await supabase
      .from('contacts')
      .insert(inquiryData);
    
    if (!error) {
      // 전환 추적 추가
      await supabase
        .from('conversions')
        .insert({
          conversion_type: 'inquiry',
          campaign_id: campaignId,
          session_id: sessionStorage.getItem('session_id'),
          utm_source: sessionStorage.getItem('utm_source'),
          utm_medium: sessionStorage.getItem('utm_medium'),
          utm_campaign: sessionStorage.getItem('utm_campaign'),
          page_url: window.location.pathname
        });
    }
  } catch (error) {
    console.error('문의 처리 오류:', error);
  }
};
```

### 4. Google Analytics 4 설정

#### GA4 태그 추가
```jsx
// pages/_app.js
import Script from 'next/script';

export default function MyApp({ Component, pageProps }) {
  return (
    <>
      {/* Google Analytics */}
      <Script
        src="https://www.googletagmanager.com/gtag/js?id=G-YOUR_MEASUREMENT_ID"
        strategy="afterInteractive"
      />
      <Script id="google-analytics" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', 'G-YOUR_MEASUREMENT_ID');
        `}
      </Script>
      
      <Component {...pageProps} />
    </>
  );
}
```

#### GA4 이벤트 추적
```javascript
// 페이지뷰 이벤트
gtag('event', 'page_view', {
  page_title: '골프 예약 퍼널',
  page_location: window.location.href,
  page_path: window.location.pathname,
  campaign_id: campaignId
});

// 예약 전환 이벤트
gtag('event', 'conversion', {
  'send_to': 'AW-CONVERSION_ID/CONVERSION_LABEL',
  'value': bookingValue,
  'currency': 'KRW',
  'transaction_id': sessionId
});
```

### 5. Google Ads 전환 추적

#### Google Ads 태그 추가
```html
<!-- Google Ads 전환 태그 -->
<script async src="https://www.googletagmanager.com/gtag/js?id=AW-YOUR_CONVERSION_ID"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'AW-YOUR_CONVERSION_ID');
</script>
```

#### 전환 이벤트 발생
```javascript
// 예약 완료 시
gtag('event', 'conversion', {
  'send_to': 'AW-YOUR_CONVERSION_ID/YOUR_BOOKING_LABEL',
  'value': bookingPrice,
  'currency': 'KRW'
});

// 문의 완료 시
gtag('event', 'conversion', {
  'send_to': 'AW-YOUR_CONVERSION_ID/YOUR_INQUIRY_LABEL',
  'value': 0,
  'currency': 'KRW'
});
```

### 6. UTM 파라미터 저장

#### UTM 파라미터 저장 함수
```javascript
// lib/tracking/utm-handler.js
export function saveUTMParams() {
  const urlParams = new URLSearchParams(window.location.search);
  const utmParams = {
    utm_source: urlParams.get('utm_source') || '',
    utm_medium: urlParams.get('utm_medium') || '',
    utm_campaign: urlParams.get('utm_campaign') || '',
    utm_term: urlParams.get('utm_term') || '',
    utm_content: urlParams.get('utm_content') || ''
  };
  
  // sessionStorage에 저장
  sessionStorage.setItem('utm_params', JSON.stringify(utmParams));
  
  // 개별 저장 (호환성)
  Object.entries(utmParams).forEach(([key, value]) => {
    if (value) sessionStorage.setItem(key, value);
  });
}

// 페이지 로드 시 실행
if (typeof window !== 'undefined') {
  saveUTMParams();
}
```

### 7. 관리자 페이지에서 실시간 데이터 보기

#### 실시간 통계 API
```javascript
// pages/api/stats/realtime.js
export default async function handler(req, res) {
  const { campaignId } = req.query;
  
  // 오늘 데이터 조회
  const today = new Date().toISOString().split('T')[0];
  
  // 페이지뷰
  const { data: pageViews } = await supabase
    .from('page_views')
    .select('*')
    .eq('campaign_id', campaignId)
    .gte('created_at', today);
  
  // 전환
  const { data: conversions } = await supabase
    .from('conversions')
    .select('*')
    .eq('campaign_id', campaignId)
    .gte('created_at', today);
  
  // 통계 계산
  const stats = {
    views: pageViews?.length || 0,
    uniqueVisitors: new Set(pageViews?.map(pv => pv.session_id)).size,
    bookings: conversions?.filter(c => c.conversion_type === 'booking').length || 0,
    inquiries: conversions?.filter(c => c.conversion_type === 'inquiry').length || 0,
    conversionRate: pageViews?.length 
      ? ((conversions?.length || 0) / pageViews.length * 100).toFixed(2)
      : '0'
  };
  
  res.json(stats);
}
```

### 8. 실제 배포 전 체크리스트

- [ ] Supabase 프로덕션 환경 설정
- [ ] Google Analytics 4 계정 및 측정 ID 설정
- [ ] Google Ads 전환 추적 ID 및 라벨 생성
- [ ] 모든 퍼널 페이지에 추적 컴포넌트 추가
- [ ] 예약/문의 핸들러에 전환 추적 추가
- [ ] UTM 파라미터 처리 로직 추가
- [ ] 관리자 페이지에 실시간 통계 표시
- [ ] 테스트 환경에서 추적 검증

### 9. 추가 고려사항

#### A/B 테스트 추적
```javascript
// 버전별 추적
const abTestVersion = Math.random() > 0.5 ? 'A' : 'B';
sessionStorage.setItem('ab_test_version', abTestVersion);

// 페이지뷰에 버전 포함
{
  ...pageViewData,
  ab_test_version: abTestVersion
}
```

#### 히트맵 추적 (Hotjar/Clarity)
```html
<!-- Microsoft Clarity -->
<script type="text/javascript">
  (function(c,l,a,r,i,t,y){
    c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
    t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
    y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
  })(window, document, "clarity", "script", "YOUR_PROJECT_ID");
</script>
```

## 구현 우선순위

1. **즉시 구현 (Phase 1)**
   - PageViewTracker를 모든 퍼널 페이지에 추가
   - UTM 파라미터 저장 로직 구현
   - 기본 전환 추적 (예약/문의)

2. **단기 구현 (Phase 2)**
   - Google Analytics 4 연동
   - Google Ads 전환 추적
   - 관리자 페이지 실시간 통계

3. **장기 구현 (Phase 3)**
   - A/B 테스트 추적
   - 히트맵 도구 연동
   - 고급 분석 대시보드
