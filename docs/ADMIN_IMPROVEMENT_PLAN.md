# 🚀 MASGOLF 관리자 시스템 개선 계획

## 1. 즉시 수정 사항

### A. 캠페인 링크 수정
```javascript
// 7월 캠페인
{
  opManual: 'https://docs.google.com/document/d/YOUR_OP_MANUAL_ID',
  googleAds: 'https://ads.google.com/aw/campaigns/YOUR_CAMPAIGN_ID',
  landingPage: '/funnel-2025-07'
}
```

### B. 10명 남음 카운터
```javascript
// 실시간 계산
const getRemainingCount = () => {
  const totalSlots = 20;
  const usedSlots = bookings.filter(b => b.campaign === '7월').length;
  return Math.max(0, totalSlots - usedSlots);
};
```

## 2. 재고 관리 시스템

### 테이블 구조
```sql
-- 재고 마스터
CREATE TABLE inventory (
  id UUID PRIMARY KEY,
  type VARCHAR(20), -- 'gift' or 'alcohol'
  name VARCHAR(255),
  total_quantity INTEGER,
  remaining_quantity INTEGER,
  purchase_price DECIMAL,
  purchase_date DATE
);

-- 배포 이력
CREATE TABLE distributions (
  id UUID PRIMARY KEY,
  item_id UUID REFERENCES inventory(id),
  recipient_name VARCHAR(100),
  recipient_phone VARCHAR(20),
  quantity INTEGER,
  campaign VARCHAR(100),
  date TIMESTAMP,
  notes TEXT
);
```

### 주요 기능
1. **재고 등록**: 사은품/술 입고 등록
2. **배포 관리**: 누구에게 언제 나갔는지
3. **잔량 확인**: 실시간 재고 현황
4. **ROI 분석**: 캠페인별 사은품 효과

## 3. 캠페인 관리 통합

### 현재 문제점
- 대시보드와 캠페인 관리가 중복
- 실제 데이터 연동 부족
- 액션 버튼 미작동

### 개선안
```
📊 대시보드 (메인)
  └─ 전체 현황 요약

🚀 캠페인 센터 (통합)
  ├─ 캠페인 목록
  ├─ 성과 분석
  ├─ 새 캠페인 생성
  └─ A/B 테스트

📦 재고 관리 (신규)
  ├─ 사은품 관리
  ├─ 배포 이력
  └─ 재고 리포트
```

## 4. 구현 우선순위

### Phase 1 (즉시)
- [ ] OP 매뉴얼 링크 연결
- [ ] Google Ads 링크 연결
- [ ] 남은 인원 실시간 계산
- [ ] 캠페인 버튼 활성화

### Phase 2 (1주일)
- [ ] 재고 관리 시스템
- [ ] 배포 이력 추적
- [ ] 마케팅 효과 분석

### Phase 3 (2주일)
- [ ] 캠페인 템플릿
- [ ] 자동 리포트
- [ ] A/B 테스트 도구

## 5. 실제 구현 코드

### 캠페인 데이터 수정
```typescript
const campaigns: Campaign[] = [
  {
    id: '2025-07',
    name: '여름 특별 캠페인',
    assets: {
      landingPage: '/versions/funnel-2025-07-complete.html',
      landingPageUrl: '/funnel-2025-07',
      opManual: 'https://docs.google.com/document/d/abc123', // 실제 링크
      googleAds: 'https://ads.google.com/aw/campaigns/123456', // 실제 링크
    },
    settings: {
      phoneNumber: '080-028-8888',
      remainingSlots: calculateRemainingSlots(), // 동적 계산
    }
  }
];
```

### 재고 관리 컴포넌트
- 위에 작성한 InventoryManagement.tsx 사용
- 관리자 페이지에 탭 추가
- Supabase 테이블 생성

## 6. 마케팅 효율 측정

### 핵심 지표
1. **사은품 ROI**
   - 사은품별 전환율
   - 고객 만족도
   - 재구매율

2. **캠페인 효과**
   - 비용 대비 매출
   - 고객 획득 비용
   - 생애 가치(LTV)

3. **재고 회전율**
   - 월별 소진율
   - 인기 사은품
   - 계절별 트렌드
