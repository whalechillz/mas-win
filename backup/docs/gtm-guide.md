# MASGOLF 퍼널페이지 Google Tag Manager(GTM) 설정 가이드

## 1. GTM 설치 코드

### <head> 시작 직후
```html
<!-- Google Tag Manager -->
<script>(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id=GTM-WPBX97JG';f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','GTM-WPBX97JG');</script>
<!-- End Google Tag Manager -->
```

### <body> 시작 직후
```html
<!-- Google Tag Manager (noscript) -->
<noscript><iframe src="https://www.googletagmanager.com/ns.html?id=GTM-WPBX97JG"
height="0" width="0" style="display:none;visibility:hidden"></iframe></noscript>
<!-- End Google Tag Manager (noscript) -->
```

---

## 2. 주요 이벤트 트래킹

- 전화 클릭:  
  `dataLayer.push({event: 'cta_click', cta_type: 'tel', cta_label: '무료 비거리 상담'});`
- 예약 클릭:  
  `dataLayer.push({event: 'cta_click', cta_type: 'link', cta_label: '시타 예약'});`
- 체류 시간:  
  `stay_3s`, `stay_5s`, `stay_10s`
- 스크롤:  
  `scroll_50`, `scroll_75`

---

## 3. GTM 내 태그/트리거 설정

- GA4 구성 태그: G-YY0EB8HJNG
- Google Ads 전환/리마케팅 태그: 필요시 추가
- 사용자 정의 이벤트 트리거:  
  - `cta_click`, `stay_3s`, `stay_5s`, `stay_10s`, `scroll_50`, `scroll_75`
- GA4 이벤트 태그:  
  - 이벤트 이름 및 파라미터 위와 동일

---

## 4. 참고

- GTM 미리보기/디버그 모드로 이벤트 정상 수집 확인
- GA4 > 실시간 > 이벤트에서 데이터 유입 확인 