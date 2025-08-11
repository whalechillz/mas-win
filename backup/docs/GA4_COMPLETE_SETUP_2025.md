# GA4 완벽 설정 가이드 2025

## 🎯 도메인 구성 설정

### 1. 교차 도메인 설정 (이미지 3 화면)
```
검색 유형: 다음 값을 포함
도메인 입력:
1. win.masgolf.co.kr
2. www.masgolf.co.kr
3. masgolf.co.kr

→ 각각 입력 후 "조건 만들기" 클릭
```

## 📋 필수 추가 설정 체크리스트

### 1. 전환 이벤트 설정
```
관리 → 이벤트 → 전환으로 표시:
✅ form_submit (예약 완료)
✅ generate_lead (문의하기)
✅ file_download (브로셔 다운)
✅ click (전화번호 클릭)
```

### 2. 잠재고객 설정
```
관리 → 잠재고객 → 새 잠재고객:
- 예약 완료자
- 7일 재방문자
- 고가치 사용자 (3페이지 이상 조회)
```

### 3. 맞춤 측정기준 생성
```
관리 → 맞춤 정의 → 맞춤 측정기준:
- user_type (신규/재방문)
- campaign_source (캠페인 출처)
- golf_course_name (골프장명)
- booking_date (예약일)
```

### 4. 맞춤 측정항목 생성
```
관리 → 맞춤 정의 → 맞춤 측정항목:
- booking_value (예약 금액)
- form_completion_rate (폼 완료율)
- average_scroll_depth (평균 스크롤 깊이)
```

## 🚀 2025 최신 설정 기법

### 1. Server-side GTM 통합
```javascript
// 서버 컨테이너 URL 설정
gtag('config', 'G-SMJWL2TRM7', {
  'transport_url': 'https://gtm.masgolf.co.kr',
  'first_party_collection': true
});
```

### 2. Consent Mode v2 (필수)
```javascript
// 쿠키 동의 전
gtag('consent', 'default', {
  'ad_storage': 'denied',
  'ad_user_data': 'denied',
  'ad_personalization': 'denied',
  'analytics_storage': 'denied',
  'functionality_storage': 'granted',
  'personalization_storage': 'granted',
  'security_storage': 'granted',
  'wait_for_update': 500
});

// 사용자 동의 후
function updateConsent() {
  gtag('consent', 'update', {
    'ad_storage': 'granted',
    'ad_user_data': 'granted',
    'ad_personalization': 'granted',
    'analytics_storage': 'granted'
  });
}
```

### 3. Enhanced Conversions 설정
```javascript
// 향상된 전환 - 이메일/전화번호 해시
gtag('config', 'G-SMJWL2TRM7', {
  'allow_enhanced_conversions': true
});

// 전환 이벤트 시
gtag('event', 'conversion', {
  'send_to': 'G-SMJWL2TRM7/booking_complete',
  'value': 1000000,
  'currency': 'KRW',
  'email': hashEmail(userEmail), // SHA256 해시
  'phone_number': hashPhone(userPhone)
});
```

### 4. 예측 잠재고객 활용
```
관리 → 잠재고객 → 예측 잠재고객:
✅ 구매 가능성 높음
✅ 이탈 가능성 높음
✅ 수익 예측 상위 28일
```

### 5. BigQuery 연동 (무료)
```
관리 → BigQuery 연결:
- 프로젝트 ID: masgolf-analytics
- 데이터 세트: ga4_masgolf
- 내보내기 빈도: 매일
```

## 🛠️ GTM 고급 설정

### 1. 커스텀 템플릿
```javascript
// 골프장 조회 추적 템플릿
function() {
  return {
    'event': 'view_golf_course',
    'golf_course_data': {
      'name': {{Golf Course Name}},
      'location': {{Golf Course Location}},
      'price_range': {{Price Range}},
      'availability': {{Availability Status}}
    }
  };
}
```

### 2. 트리거 시퀀스
```
1차: 페이지뷰 → 2차: 스크롤 50% → 3차: CTA 클릭
→ 퍼널 완성도 측정
```

### 3. 변수 그룹
```javascript
// 사용자 세그먼트 변수
function() {
  var bookingCount = {{Cookie - booking_count}} || 0;
  var lastVisit = {{Cookie - last_visit}} || 0;
  var daysSinceLastVisit = (Date.now() - lastVisit) / (1000 * 60 * 60 * 24);
  
  if (bookingCount >= 5) return 'vip_customer';
  if (bookingCount >= 2) return 'returning_customer';
  if (daysSinceLastVisit <= 7) return 'engaged_user';
  return 'new_visitor';
}
```

## 🎨 실시간 대시보드 설정

### 1. Looker Studio 연동
```
1. GA4 데이터 소스 연결
2. 실시간 새로고침 설정 (15분)
3. 맞춤 계산된 필드:
   - 전환율 = 전환수 / 세션수 * 100
   - 평균 예약 가치 = 총 수익 / 예약 수
   - 이탈률 개선 = (이전 이탈률 - 현재 이탈률) / 이전 이탈률
```

### 2. 알림 설정
```
관리 → 맞춤 인사이트:
- 일일 트래픽 30% 감소 시
- 전환율 20% 하락 시
- 404 오류 급증 시
- 사이트 속도 3초 초과 시
```

## 📱 모바일 앱 추적 (선택)

### Firebase SDK 통합
```javascript
// 앱 + 웹 통합 추적
gtag('config', 'G-SMJWL2TRM7', {
  'app_name': 'MASGOLF',
  'app_version': '1.0.0',
  'screen_name': 'golf_course_list'
});
```

## 🔒 개인정보 보호 설정

### 1. IP 익명화
```javascript
gtag('config', 'G-SMJWL2TRM7', {
  'anonymize_ip': true
});
```

### 2. 데이터 보존 기간
```
관리 → 데이터 설정 → 데이터 보존:
- 이벤트 데이터: 14개월
- 사용자 데이터: 14개월
```

### 3. 데이터 삭제 요청
```
관리 → 데이터 설정 → 데이터 삭제 요청
→ 사용자 요청 시 즉시 처리
```

## ⚡ 즉시 해야 할 작업

1. **도메인 구성 완료** (이미지 3)
   - win.masgolf.co.kr 추가 → 조건 만들기
   - www.masgolf.co.kr 추가 → 조건 만들기

2. **GTM 설치 확인**
   ```bash
   # win.masgolf.co.kr의 _app.js에 추가
   GTM-WPBX97JG 코드 설치
   ```

3. **전환 이벤트 활성화**
   - 관리 → 이벤트 → 전환으로 표시

4. **실시간 테스트**
   - 각 도메인 접속 → 실시간 보고서 확인

## 🎯 성과 측정 KPI

```
주간 모니터링:
- 전환율: 목표 15%
- 평균 세션 시간: 3분 이상
- 이탈률: 40% 이하
- 페이지/세션: 4페이지 이상
```
