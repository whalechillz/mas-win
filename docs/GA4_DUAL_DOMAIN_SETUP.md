# GA4 멀티 도메인 통합 추적 가이드

## 🎯 설정 방법

### 1. GA4 데이터 스트림 설정

#### 1.1 기본 도메인 설정
```
웹사이트 URL: win.masgolf.co.kr
스트림 이름: MASGOLF 통합
```

#### 1.2 교차 도메인 추적 설정
1. **데이터 스트림** 생성 후
2. **태그 설정 구성** 클릭
3. **도메인 구성** 섹션에서:
   ```
   추가할 도메인:
   - win.masgolf.co.kr
   - www.masgolf.co.kr
   - masgolf.co.kr
   ```

### 2. GTM 설치 코드

#### 2.1 win.masgolf.co.kr (Next.js)
`pages/_app.js` 수정:
```javascript
import Script from 'next/script';

function MyApp({ Component, pageProps }) {
  return (
    <>
      {/* GTM 스크립트 */}
      <Script
        id="gtm-script"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
            new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
            j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
            'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
            })(window,document,'script','dataLayer','GTM-WPBX97JG');
          `,
        }}
      />
      
      {/* GTM noscript */}
      <noscript>
        <iframe 
          src="https://www.googletagmanager.com/ns.html?id=GTM-WPBX97JG"
          height="0" 
          width="0" 
          style={{ display: 'none', visibility: 'hidden' }}
        />
      </noscript>
      
      <Component {...pageProps} />
    </>
  );
}

export default MyApp;
```

#### 2.2 www.masgolf.co.kr (일반 HTML)
`<head>` 태그 안:
```html
<!-- Google Tag Manager -->
<script>(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','GTM-WPBX97JG');</script>
<!-- End Google Tag Manager -->
```

`<body>` 바로 다음:
```html
<!-- Google Tag Manager (noscript) -->
<noscript><iframe src="https://www.googletagmanager.com/ns.html?id=GTM-WPBX97JG"
height="0" width="0" style="display:none;visibility:hidden"></iframe></noscript>
<!-- End Google Tag Manager (noscript) -->
```

### 3. GTM 내 GA4 설정

#### 3.1 GA4 구성 태그
1. **태그** → **새로 만들기**
2. **태그 유형**: Google 애널리틱스: GA4 구성
3. **측정 ID**: G-XXXXXXXXXX (GA4에서 받은 ID)
4. **구성 매개변수** 추가:
   ```
   매개변수 이름: cookie_domain
   값: auto
   
   매개변수 이름: linker
   값: {"domains": ["win.masgolf.co.kr", "www.masgolf.co.kr"]}
   ```
5. **트리거**: 모든 페이지

### 4. 도메인별 추적 설정

#### 4.1 캠페인 퍼널 전용 이벤트 (win.masgolf.co.kr)
```javascript
// 퍼널 단계 추적
dataLayer.push({
  'event': 'funnel_step',
  'funnel_name': '2025년 7월 캠페인',
  'step_name': 'landing',
  'step_number': 1
});

// 스크롤 추적 (캠페인 효과 측정)
dataLayer.push({
  'event': 'campaign_engagement',
  'engagement_type': 'scroll',
  'scroll_depth': 75
});
```

#### 4.2 메인 사이트 전용 이벤트 (www.masgolf.co.kr)
```javascript
// 메뉴 네비게이션
dataLayer.push({
  'event': 'navigation_click',
  'menu_item': '골프장 소개',
  'destination': '/golf-courses'
});

// 브랜드 페이지 체류
dataLayer.push({
  'event': 'brand_engagement',
  'page_section': 'about_us',
  'time_spent': 120
});
```

### 5. 보고서 구성

#### 5.1 도메인별 성과 분석
1. **탐색** → **새 탐색**
2. **측정기준** 추가:
   - 호스트명
   - 랜딩 페이지
   - 트래픽 소스
3. **세그먼트** 생성:
   - 캠페인 트래픽 (win.masgolf.co.kr)
   - 브랜드 트래픽 (www.masgolf.co.kr)

#### 5.2 통합 전환 경로
```
예시 경로:
1. 광고 클릭 → win.masgolf.co.kr (캠페인)
2. 브랜드 검색 → www.masgolf.co.kr (메인)
3. 최종 예약 완료
```

### 6. 테스트 및 검증

#### 6.1 실시간 보고서 확인
1. 각 도메인 접속
2. GA4 실시간 보고서에서 확인
3. 호스트명 필터로 구분

#### 6.2 교차 도메인 테스트
1. win.masgolf.co.kr 접속
2. www.masgolf.co.kr로 이동
3. URL에 `_gl` 매개변수 확인
4. 동일 사용자로 추적되는지 확인

## ⚠️ 주의사항

1. **측정 ID 통일**: 두 도메인 모두 같은 G-XXXXXXXXXX 사용
2. **GTM 컨테이너 통일**: 같은 GTM-WPBX97JG 사용
3. **도메인 구성 필수**: GA4와 GTM 모두에서 설정

## 📊 활용 예시

### 캠페인 효과 측정
```
win.masgolf.co.kr 전환율: 15%
www.masgolf.co.kr 전환율: 5%
→ 캠페인 페이지가 3배 효과적
```

### 사용자 여정 분석
```
1일차: 광고 클릭 → 캠페인 페이지
3일차: 직접 방문 → 메인 사이트
5일차: 예약 완료
→ 평균 구매 결정 기간: 5일
```
