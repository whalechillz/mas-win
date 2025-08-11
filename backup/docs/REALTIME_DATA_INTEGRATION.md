# 🔌 MASGOLF Admin 완전한 데이터 연동 가이드

## 1. Supabase 캠페인 테이블 생성

### SQL 실행 (Supabase SQL Editor)
```sql
-- 1. 캠페인 테이블 생성
CREATE TABLE IF NOT EXISTS campaigns (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  status TEXT CHECK (status IN ('active', 'ended', 'planned', 'draft')) NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  landing_page_url TEXT,
  landing_page_file TEXT,
  op_manual_url TEXT,
  google_ads_url TEXT,
  phone_number TEXT DEFAULT '080-028-8888',
  event_date TEXT,
  remaining_slots INTEGER DEFAULT 30,
  discount_rate INTEGER DEFAULT 50,
  target_audience TEXT,
  views INTEGER DEFAULT 0,
  bookings INTEGER DEFAULT 0,
  inquiries INTEGER DEFAULT 0,
  conversion_rate DECIMAL(5,2) DEFAULT 0,
  roi DECIMAL(10,2) DEFAULT 0,
  cost_per_acquisition DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 2. 캠페인 메트릭 테이블
CREATE TABLE IF NOT EXISTS campaign_metrics (
  id SERIAL PRIMARY KEY,
  campaign_id TEXT REFERENCES campaigns(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  views INTEGER DEFAULT 0,
  bookings INTEGER DEFAULT 0,
  inquiries INTEGER DEFAULT 0,
  unique_visitors INTEGER DEFAULT 0,
  bounce_rate DECIMAL(5,2) DEFAULT 0,
  avg_session_duration INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE(campaign_id, date)
);

-- 3. 초기 데이터 삽입
INSERT INTO campaigns (
  id, name, status, start_date, end_date,
  landing_page_url, landing_page_file, op_manual_url, google_ads_url,
  event_date, remaining_slots, discount_rate, target_audience,
  views, bookings, inquiries, conversion_rate, roi, cost_per_acquisition
) VALUES 
(
  '2025-07', '여름 특별 캠페인', 'active', '2025-07-01', '2025-07-31',
  '/funnel-2025-07', '/versions/funnel-2025-07-complete.html',
  '/docs/op-manuals/2025-07-여름특별/', '/google_ads/2025.07.여름특별/',
  '7월 31일', 10, 50, '골프 입문자 및 실력 향상 희망자',
  1523, 87, 245, 5.7, 250, 50000
),
(
  '2025-06', '프라임타임 캠페인', 'ended', '2025-06-01', '2025-06-30',
  '/funnel-2025-06', '/versions/funnel-2025-06.html',
  '/docs/op-manuals/2025-06-프라임타임/', '/google_ads/2025.06.11.프라임타임/',
  '6월 30일', 0, 40, '주말 골퍼',
  2341, 134, 389, 5.7, 180, 65000
),
(
  '2025-05', '가정의 달 캠페인', 'ended', '2025-05-01', '2025-05-31',
  '/funnel-2025-05', '/versions/funnel-2025-05.html',
  '/docs/op-manuals/2025-05-가정의달/', '/google_ads/2025.05.01.가정의달/',
  '5월 31일', 0, 30, '가족 단위 고객',
  2897, 156, 412, 5.4, 220, 55000
);

-- 4. 실시간 뷰 생성
CREATE OR REPLACE VIEW campaign_summary AS
SELECT 
  COUNT(*) as total_campaigns,
  COUNT(*) FILTER (WHERE status = 'active') as active_campaigns,
  SUM(bookings) as total_bookings,
  SUM(inquiries) as total_inquiries,
  SUM(views) as total_views,
  AVG(conversion_rate) as avg_conversion_rate,
  SUM(bookings * 1000000) as estimated_revenue -- 예약당 100만원 가정
FROM campaigns;

-- 5. 인덱스 생성
CREATE INDEX idx_campaigns_status ON campaigns(status);
CREATE INDEX idx_campaigns_dates ON campaigns(start_date, end_date);
CREATE INDEX idx_campaign_metrics_date ON campaign_metrics(campaign_id, date);
```

## 2. 코드 수정 - 실제 데이터 연동

### admin-realtime.tsx 생성
```typescript
// 캠페인 데이터를 Supabase에서 가져오는 함수
const loadCampaigns = async () => {
  if (!supabase) return;
  
  const { data, error } = await supabase
    .from('campaigns')
    .select('*')
    .order('start_date', { ascending: false });
  
  if (!error && data) {
    // Campaign 타입에 맞게 변환
    const formattedCampaigns = data.map(camp => ({
      id: camp.id,
      name: camp.name,
      status: camp.status,
      period: {
        start: camp.start_date,
        end: camp.end_date
      },
      assets: {
        landingPage: camp.landing_page_file || '',
        landingPageUrl: camp.landing_page_url || '',
        opManual: camp.op_manual_url,
        googleAds: camp.google_ads_url
      },
      settings: {
        phoneNumber: camp.phone_number,
        eventDate: camp.event_date,
        remainingSlots: camp.remaining_slots,
        discountRate: camp.discount_rate,
        targetAudience: camp.target_audience || ''
      },
      metrics: {
        views: camp.views,
        bookings: camp.bookings,
        inquiries: camp.inquiries,
        conversionRate: camp.conversion_rate,
        roi: camp.roi || 0,
        costPerAcquisition: camp.cost_per_acquisition || 0
      },
      performance: { daily: [] }
    }));
    
    setCampaigns(formattedCampaigns);
  }
};

// 실시간 메트릭 계산
const calculateRealMetrics = () => {
  const totalRevenue = bookings.length * 1000000; // 예약당 100만원
  const activeCampaigns = campaigns.filter(c => c.status === 'active').length;
  const conversionRate = bookings.length > 0 
    ? ((bookings.length / (bookings.length + contacts.length)) * 100).toFixed(1)
    : 0;
  const totalCustomers = bookings.length + contacts.length;
  
  return {
    totalRevenue,
    activeCampaigns,
    conversionRate,
    totalCustomers
  };
};
```

## 3. 실시간 업데이트 구현

### Supabase Realtime 구독
```typescript
useEffect(() => {
  if (!supabase) return;
  
  // 예약 테이블 실시간 구독
  const bookingSubscription = supabase
    .channel('bookings-channel')
    .on('postgres_changes', 
      { event: '*', schema: 'public', table: 'bookings' },
      (payload) => {
        console.log('예약 변경:', payload);
        loadBookings(); // 데이터 새로고침
      }
    )
    .subscribe();
  
  // 문의 테이블 실시간 구독
  const contactSubscription = supabase
    .channel('contacts-channel')
    .on('postgres_changes',
      { event: '*', schema: 'public', table: 'contacts' },
      (payload) => {
        console.log('문의 변경:', payload);
        loadContacts(); // 데이터 새로고침
      }
    )
    .subscribe();
  
  // 캠페인 테이블 실시간 구독
  const campaignSubscription = supabase
    .channel('campaigns-channel')
    .on('postgres_changes',
      { event: '*', schema: 'public', table: 'campaigns' },
      (payload) => {
        console.log('캠페인 변경:', payload);
        loadCampaigns(); // 데이터 새로고침
      }
    )
    .subscribe();
  
  // 정리
  return () => {
    bookingSubscription.unsubscribe();
    contactSubscription.unsubscribe();
    campaignSubscription.unsubscribe();
  };
}, [supabase]);
```

## 4. Google Analytics 연동 (선택사항)

### GA4 데이터 가져오기
```javascript
// Google Analytics Reporting API 사용
const getAnalyticsData = async () => {
  const response = await fetch('/api/analytics', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      metrics: ['sessions', 'pageviews', 'conversions'],
      dimensions: ['date', 'landingPage'],
      dateRange: {
        startDate: '7daysAgo',
        endDate: 'today'
      }
    })
  });
  
  const data = await response.json();
  return data;
};
```

## 5. 적용 순서

### Step 1: Supabase 설정
1. Supabase 대시보드 접속
2. SQL Editor에서 위 SQL 실행
3. Table Editor에서 데이터 확인

### Step 2: 코드 업데이트
```bash
# 1. 백업
cp pages/admin.tsx pages/admin.backup-$(date +%Y%m%d)

# 2. 수정된 파일 적용
cp pages/admin-fixed.tsx pages/admin.tsx

# 3. 로컬 테스트
npm run dev
```

### Step 3: 환경변수 확인
```bash
# .env.local
NEXT_PUBLIC_SUPABASE_URL=https://yyytjudftvpmcnppaymw.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
```

### Step 4: 배포
```bash
git add .
git commit -m "feat: 실시간 데이터 연동 구현"
git push
```

## 6. 추가 개선사항

### 데이터 자동 수집
- Google Ads API 연동
- 전화 통화 로그 연동
- 결제 시스템 연동

### 성과 자동 계산
- 일별/주별/월별 리포트
- ROI 자동 계산
- 예측 분석

### 알림 시스템
- 목표 달성 알림
- 이상 징후 감지
- 실시간 리포트

---

이제 완전한 실시간 데이터 연동이 가능합니다! 🚀
