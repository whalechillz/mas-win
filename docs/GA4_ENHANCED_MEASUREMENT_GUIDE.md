# GA4 향상된 측정 최적화 가이드

## 🎯 MASGOLF 맞춤 설정

### 1. 기본 활성화 항목
```
✅ 페이지 조회 - 필수
✅ 스크롤 - 필수 (콘텐츠 참여도)
✅ 이탈 클릭 - 필수 (외부 링크 추적)
✅ 파일 다운로드 - 필수 (브로셔, 가격표)
✅ 양식 상호작용 - 필수 (예약 폼)
✅ 사이트 검색 - 활성화 (골프장 검색)
✅ 동영상 참여 - 활성화 (홍보 영상)
```

### 2. 세부 설정 최적화

#### 2.1 스크롤 깊이 커스텀
```javascript
// GTM에서 추가 설정
dataLayer.push({
  'event': 'scroll',
  'scroll_depth': '50%',
  'page_location': window.location.href
});
```

#### 2.2 이탈 클릭 세분화
- 네이버 예약: `naver.com/booking`
- 카카오맵: `map.kakao.com`
- 전화번호 클릭: `tel:` 링크

#### 2.3 양식 상호작용 개선
```javascript
// 예약 폼 추적 강화
gtag('event', 'form_start', {
  'form_name': 'golf_booking',
  'form_destination': '/api/booking'
});

gtag('event', 'form_submit', {
  'form_name': 'golf_booking',
  'form_success': true
});
```

### 3. 커스텀 이벤트 추가

#### 3.1 골프장별 관심도
```javascript
// 특정 골프장 상세 페이지 체류 시간
gtag('event', 'golf_course_interest', {
  'course_name': 'SKY 72 GOLF',
  'time_spent': timeSpent,
  'scroll_depth': maxScrollDepth
});
```

#### 3.2 가격 조회 추적
```javascript
gtag('event', 'price_check', {
  'course_name': courseName,
  'date_selected': selectedDate,
  'price_range': priceRange
});
```

### 4. 제외 설정

#### 4.1 내부 트래픽 제외
```
관리 → 데이터 스트림 → 태그 설정 구성 → 내부 트래픽 정의
- IP 주소 추가
- 개발자 트래픽 제외
```

#### 4.2 봇 트래픽 제외
```
관리 → 속성 설정 → 봇 필터링
✅ 알려진 봇 및 스파이더 제외
```

### 5. 성능 최적화

#### 5.1 이벤트 제한
- 페이지당 최대 500개 이벤트
- 중요 이벤트 우선순위 설정

#### 5.2 샘플링 설정
```javascript
gtag('config', 'G-XXXXXXXXXX', {
  'sample_rate': 100  // 100% = 모든 데이터 수집
});
```

### 6. 디버깅 도구

#### 6.1 DebugView 활성화
```javascript
// 개발 환경에서만
gtag('config', 'G-XXXXXXXXXX', {
  'debug_mode': true
});
```

#### 6.2 실시간 확인
1. GA4 → 보고서 → 실시간
2. 이벤트 발생 즉시 확인
3. 파라미터 값 검증

## 📊 권장 보고서 설정

### 1. 맞춤 측정기준
- 골프장 이름
- 예약 날짜
- 가격대
- 지역

### 2. 맞춤 측정항목
- 평균 스크롤 깊이
- 폼 완료율
- 골프장별 전환율

### 3. 대시보드 구성
```
1. 트래픽 소스별 전환
2. 골프장별 인기도
3. 시간대별 예약 패턴
4. 디바이스별 성과
```

## ⚠️ 주의사항

1. **개인정보 수집 금지**
   - 이름, 전화번호 등 PII 제외
   - 양식 필드명만 추적

2. **페이지 속도 영향**
   - 필요한 이벤트만 활성화
   - 과도한 추적 피하기

3. **데이터 정확성**
   - 중복 이벤트 방지
   - 적절한 디바운싱 적용

## 🚀 구현 우선순위

### Phase 1 (즉시)
- 모든 향상된 측정 활성화
- 기본 설정 완료

### Phase 2 (1주일)
- 커스텀 이벤트 추가
- GTM 고급 설정

### Phase 3 (1개월)
- 보고서 최적화
- 인사이트 도출
