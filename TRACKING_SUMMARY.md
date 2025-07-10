# 실제 데이터 추적 구현 요약

## 현재 상황
win.masgolf.co.kr 프로젝트에는 이미 기본적인 추적 인프라가 구축되어 있습니다:
- ✅ PageViewTracker 컴포넌트 (페이지 조회수 추적)
- ✅ ConversionTracker 컴포넌트 (전환 추적)
- ✅ Supabase 데이터베이스 테이블 구조

## 필요한 작업

### 1. 즉시 구현 가능 (코드 수정만 필요)
- 모든 퍼널 페이지에 PageViewTracker 컴포넌트 추가
- 예약/문의 처리 함수에 전환 추적 코드 추가
- UTM 파라미터 저장 로직 활성화

### 2. 외부 서비스 연동 필요
- **Google Analytics 4**: 측정 ID 발급 후 설정
- **Google Ads**: 전환 추적 ID 및 라벨 생성
- **Facebook Pixel**: 픽셀 ID 발급 (선택사항)

### 3. 구현 예시
```javascript
// 페이지뷰 추적 (이미 구현됨)
<PageViewTracker campaignId="2025-07-prime" supabase={supabase} />

// 예약 전환 추적 (추가 필요)
const handleBooking = async () => {
  // 예약 저장
  await supabase.from('contacts').insert(bookingData);
  
  // 전환 추적
  await supabase.from('conversions').insert({
    conversion_type: 'booking',
    campaign_id: campaignId,
    session_id: sessionStorage.getItem('session_id')
  });
  
  // Google Ads 전환
  gtag('event', 'conversion', {
    'send_to': 'AW-xxx/xxx' // 실제 ID로 교체
  });
};
```

### 4. 실시간 통계 API
`/api/stats/realtime` 엔드포인트로 실시간 데이터 조회 가능:
- 총 조회수, 순 방문자수
- 예약/문의 전환율
- UTM 소스별 성과
- 시간대별 트래픽

### 5. 다음 단계
1. Google Analytics/Ads 계정 설정
2. 퍼널 페이지에 추적 코드 적용
3. 관리자 페이지에서 실시간 통계 확인
4. A/B 테스트 구현 (선택사항)

## 파일 위치
- 추적 컴포넌트: `/components/tracking/`
- UTM 처리: `/lib/tracking/utm-handler.js`
- 통계 API: `/pages/api/stats/realtime.js`
- 구현 예시: `/pages/funnel-enhanced.tsx`
- 상세 가이드: `/docs/tracking-implementation/`

실제 데이터를 수집하려면 외부 서비스 연동이 필요하지만, 
Supabase를 통한 자체 추적은 바로 시작할 수 있습니다!
