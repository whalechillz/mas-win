# GA4 멀티 도메인 추적 설정 가이드

## 🎯 설정 목표
- mas9golf.com (기존)
- win.masgolf.co.kr (신규)
- www.masgolf.co.kr (신규)

## 📋 설정 단계

### 1. GA4 속성 설정

#### 1.1 현재 진행 중인 화면에서
```
비즈니스 목표 선택:
✅ 리드 생성
✅ 판매 촉진
✅ 웹 트래픽 파악
→ "다음" 클릭
```

#### 1.2 데이터 수집 설정
- 플랫폼: **웹**
- 기본 URL: `https://win.masgolf.co.kr`
- 스트림 이름: "MASGOLF 통합"

### 2. 교차 도메인 추적 설정

#### 2.1 데이터 스트림 설정
1. **관리 → 데이터 스트림**
2. 생성된 스트림 클릭
3. **태그 설정 구성** → **더보기**
4. **도메인 구성** 섹션에서:

```
포함할 도메인:
- win.masgolf.co.kr
- www.masgolf.co.kr
- masgolf.co.kr
- mas9golf.com
```

### 3. 측정 ID별 추적 코드 설치

#### 3.1 기본 GA4 추적 코드
```html
<!-- 모든 도메인의 <head> 태그에 추가 -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  
  // 교차 도메인 추적 활성화
  gtag('config', 'G-XXXXXXXXXX', {
    'linker': {
      'domains': ['win.masgolf.co.kr', 'www.masgolf.co.kr', 'masgolf.co.kr', 'mas9golf.com']
    }
  });
</script>
```

#### 3.2 Next.js 프로젝트용 (win.masgolf.co.kr)

`/pages/_app.tsx`:
```tsx
import Script from 'next/script'

export default function App({ Component, pageProps }) {
  return (
    <>
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
            linker: {
              domains: ['win.masgolf.co.kr', 'www.masgolf.co.kr', 'masgolf.co.kr', 'mas9golf.com']
            }
          });
        `}
      </Script>
      <Component {...pageProps} />
    </>
  )
}
```

### 4. 전환 추적 통합

#### 4.1 예약 전환 추적
```javascript
// 모든 도메인에서 동일하게 사용
gtag('event', 'conversion', {
  'send_to': 'G-XXXXXXXXXX/booking_complete',
  'value': 1000000,
  'currency': 'KRW',
  'transaction_id': bookingId
});
```

#### 4.2 문의 전환 추적
```javascript
gtag('event', 'generate_lead', {
  'currency': 'KRW',
  'value': 500000
});
```

### 5. 필터 설정

#### 5.1 내부 트래픽 제외
1. **관리 → 데이터 설정 → 데이터 필터**
2. **필터 만들기**:
   - 필터 이름: "내부 트래픽 제외"
   - 필터 유형: "내부 트래픽"
   - IP 주소 추가

#### 5.2 호스트명별 보기 필터
1. **관리 → 데이터 설정 → 데이터 필터**
2. 각 도메인별 필터 생성:
   - "win.masgolf.co.kr 트래픽"
   - "www.masgolf.co.kr 트래픽"
   - "mas9golf.com 트래픽"

### 6. 맞춤 보고서 설정

#### 6.1 도메인별 성과 보고서
1. **탐색 → 새 탐색 만들기**
2. 측정기준 추가:
   - 호스트명
   - 페이지 경로
3. 측정항목 추가:
   - 사용자
   - 세션
   - 전환수

#### 6.2 교차 도메인 사용자 경로
1. **경로 탐색** 템플릿 사용
2. 이벤트: page_view
3. 분류: 호스트명별

### 7. 환경변수 설정

#### 7.1 win.masgolf.co.kr
```bash
# .env.local
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX
NEXT_PUBLIC_GA_PROPERTY_ID=123456789
```

#### 7.2 Vercel 환경변수
```bash
vercel env add NEXT_PUBLIC_GA_MEASUREMENT_ID
vercel env add NEXT_PUBLIC_GA_PROPERTY_ID
```

### 8. 테스트 및 검증

#### 8.1 실시간 보고서 확인
1. **보고서 → 실시간**
2. 각 도메인 접속 후 확인
3. 교차 도메인 이동 시 세션 유지 확인

#### 8.2 디버그 모드
```javascript
// 개발 환경에서 디버그 활성화
gtag('config', 'G-XXXXXXXXXX', {
  'debug_mode': true
});
```

### 9. 주의사항

1. **동일한 측정 ID 사용**: 모든 도메인에서 같은 G-XXXXXXXXXX 사용
2. **쿠키 설정**: 교차 도메인 추적을 위해 `_gl` 매개변수 자동 추가됨
3. **참조 제외**: 자체 도메인을 참조 제외 목록에 추가
4. **SSL 필수**: 모든 도메인이 HTTPS를 사용해야 함

### 10. 추가 설정 (선택사항)

#### 10.1 Google Tag Manager 사용
```html
<!-- GTM 컨테이너를 모든 도메인에 설치 -->
<script>(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','GTM-XXXXXX');</script>
```

#### 10.2 향상된 전자상거래
```javascript
// 제품 조회
gtag('event', 'view_item', {
  currency: 'KRW',
  value: 1000000,
  items: [{
    item_id: 'GOLF_CLUB_001',
    item_name: '프리미엄 드라이버',
    price: 1000000,
    quantity: 1
  }]
});
```

## 📊 확인 사항 체크리스트

- [ ] 모든 도메인에 추적 코드 설치
- [ ] 교차 도메인 설정 완료
- [ ] 전환 추적 설정
- [ ] 내부 트래픽 필터 설정
- [ ] 실시간 보고서에서 데이터 확인
- [ ] 교차 도메인 이동 시 세션 유지 확인
- [ ] 전환 이벤트 정상 작동 확인

## 🚀 다음 단계

1. Google Ads와 연결
2. Search Console 연동
3. BigQuery 내보내기 설정 (선택사항)
4. 맞춤 대시보드 생성
