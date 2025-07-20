# GA4 완벽 설정 체크리스트 (2025 최신)

## 📋 필수 설정 항목

### 1. 향상된 측정 설정 ✅
위치: 웹 스트림 세부정보 → 향상된 측정

```
✅ 페이지 조회
✅ 스크롤 
✅ 이탈 클릭
✅ 사이트 검색
✅ 동영상 참여
✅ 파일 다운로드
✅ 양식 상호작용
```

### 2. 교차 도메인 추적 설정 🌐
위치: 웹 스트림 세부정보 → 태그 설정 구성 → 도메인 구성

```
포함할 도메인:
- win.masgolf.co.kr
- www.masgolf.co.kr
- masgolf.co.kr
```

### 3. 내부 트래픽 제외 🚫
위치: 관리 → 데이터 스트림 → 태그 설정 구성 → 내부 트래픽 정의

```javascript
규칙 이름: "회사 내부 트래픽"
IP 주소 추가:
- 사무실 IP
- 개발팀 IP
- 마케팅팀 IP
```

### 4. 전환 이벤트 설정 🎯
위치: 구성 → 이벤트

필수 전환 이벤트:
```
- form_submit → 전환으로 표시
- generate_lead → 전환으로 표시  
- purchase → 전환으로 표시
- file_download → 전환으로 표시 (선택)
```

### 5. Google Ads 연결 💰
위치: 관리 → Google Ads 링크

```
1. "링크" 클릭
2. Google Ads 계정 선택
3. 전환 가져오기 활성화
4. 잠재고객 공유 활성화
```

### 6. 맞춤 측정기준 설정 📊
위치: 구성 → 맞춤 정의 → 맞춤 측정기준

추가할 측정기준:
```
- golf_course_name (골프장 이름)
- booking_date (예약 날짜)
- price_range (가격대)
- user_type (신규/재방문)
- campaign_name (캠페인명)
```

### 7. 잠재고객 생성 👥
위치: 구성 → 잠재고객

필수 잠재고객:
```
1. "예약 완료 고객"
   - 조건: form_submit 이벤트 발생
   
2. "고관여 방문자"
   - 조건: 세션당 이벤트 > 5
   - 또는: 세션 시간 > 3분
   
3. "가격 확인 고객"
   - 조건: price_check 이벤트 발생
```

### 8. 데이터 보관 설정 📅
위치: 관리 → 데이터 설정 → 데이터 보관

```
이벤트 데이터 보관: 14개월 (최대)
기타 데이터 보관: 14개월 (최대)
```

### 9. Google 신호 데이터 활성화 📡
위치: 관리 → 데이터 설정 → 데이터 수집

```
✅ Google 신호 데이터 수집 활성화
- 크로스 디바이스 추적
- 리마케팅 기능 향상
```

### 10. BigQuery 연결 (선택) 🗄️
위치: 관리 → BigQuery 링크

```
- 원시 데이터 분석 가능
- 머신러닝 모델 구축
- 커스텀 대시보드 생성
```

## 🏷️ GTM 설정 (GTM-WPBX97JG)

### 1. GA4 구성 태그
```javascript
태그 이름: "GA4 구성 - 전체 사이트"
태그 유형: Google 애널리틱스: GA4 구성
측정 ID: G-SMJWL2TRM7

구성 매개변수:
- cookie_domain: auto
- send_page_view: true
- linker: {"domains": ["win.masgolf.co.kr", "www.masgolf.co.kr"]}

트리거: 모든 페이지
```

### 2. 전환 추적 태그
```javascript
태그 이름: "GA4 이벤트 - 예약 완료"
태그 유형: Google 애널리틱스: GA4 이벤트
구성 태그: GA4 구성 - 전체 사이트
이벤트 이름: form_submit

이벤트 매개변수:
- form_name: {{Form Name}}
- form_destination: {{Form URL}}
- value: {{Booking Value}}

트리거: 폼 제출 성공
```

### 3. 스크롤 추적 태그
```javascript
태그 이름: "GA4 이벤트 - 스크롤 깊이"
태그 유형: Google 애널리틱스: GA4 이벤트
이벤트 이름: scroll

이벤트 매개변수:
- percent_scrolled: {{Scroll Depth Threshold}}

트리거: 스크롤 깊이 (25%, 50%, 75%, 90%)
```

## 🎨 고급 설정 (2025 최신)

### 1. Consent Mode V2 설정
```javascript
// GTM 맞춤 HTML 태그
<script>
  // 기본 동의 상태
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
  
  // 동의 획득 후
  function updateConsent() {
    gtag('consent', 'update', {
      'ad_storage': 'granted',
      'ad_user_data': 'granted',
      'ad_personalization': 'granted',
      'analytics_storage': 'granted'
    });
  }
</script>
```

### 2. 서버사이드 태깅 준비
```
1. Google Cloud Platform 프로젝트 생성
2. App Engine 활성화
3. GTM 서버 컨테이너 생성
4. 서브도메인 설정: gtm-server.masgolf.co.kr
```

### 3. Enhanced Conversions 설정
```javascript
// 전환 향상을 위한 사용자 데이터
gtag('config', 'G-SMJWL2TRM7', {
  'allow_enhanced_conversions': true
});

// 예약 시 데이터 전송
gtag('event', 'conversion', {
  'send_to': 'G-SMJWL2TRM7/booking',
  'value': bookingValue,
  'currency': 'KRW',
  'email': hashedEmail, // SHA256 해시
  'phone_number': hashedPhone // SHA256 해시
});
```

### 4. 사용자 속성 설정
```javascript
// 사용자 등급 설정
gtag('config', 'G-SMJWL2TRM7', {
  'user_properties': {
    'user_type': 'vip',
    'membership_level': 'gold',
    'preferred_golf_course': 'SKY72'
  }
});
```

## 📱 모바일 앱 추적 준비

### Firebase SDK 통합
```javascript
// 앱과 웹 데이터 통합
- Firebase 프로젝트 연결
- 앱 + 웹 속성 생성
- User-ID 통합
```

## 🔍 디버깅 도구

### 1. DebugView 활성화
```javascript
// 개발 환경
gtag('config', 'G-SMJWL2TRM7', {
  'debug_mode': true
});

// 또는 URL 매개변수
?_dbg=1
```

### 2. GTM Preview Mode
```
1. GTM 관리 화면 → Preview
2. 웹사이트 URL 입력
3. 실시간 태그 실행 확인
```

### 3. GA4 Debugger Extension
```
Chrome 확장 프로그램 설치:
- GA Debugger
- Tag Assistant Legacy
- GTM/GA Debug
```

## 📊 맞춤 보고서 템플릿

### 1. 마케팅 대시보드
```
탐색 → 템플릿 갤러리:
- 획득 개요
- 사용자 행동 플로우
- 전환 경로 분석
```

### 2. 실시간 모니터링
```
보고서 → 실시간:
- 현재 활성 사용자
- 이벤트 발생
- 전환 추적
```

## ⚡ 성능 최적화

### 1. 태그 실행 순서
```
1순위: GA4 구성 태그
2순위: 필수 전환 태그
3순위: 기타 마케팅 태그
```

### 2. 태그 실행 조건
```javascript
// 성능 저하 방지
if (window.location.pathname.includes('/checkout')) {
  // 결제 페이지에서만 특정 태그 실행
}
```

## 🚨 설정 완료 확인

### 체크리스트
- [ ] 측정 ID 설치 확인
- [ ] 실시간 데이터 수신
- [ ] 전환 이벤트 작동
- [ ] Google Ads 연결
- [ ] 내부 트래픽 제외
- [ ] 교차 도메인 추적
- [ ] 향상된 측정 활성화
- [ ] 잠재고객 생성
- [ ] 디버그 모드 테스트
- [ ] 첫 보고서 생성

## 📅 정기 점검 항목

### 매주
- 데이터 수집 정상 여부
- 전환 추적 확인

### 매월
- 새로운 이벤트 추가
- 잠재고객 업데이트
- 보고서 최적화

### 분기별
- 태그 정리
- 성능 최적화
- 새 기능 적용
