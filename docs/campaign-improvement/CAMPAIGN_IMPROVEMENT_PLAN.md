# 캠페인 관리 시스템 개선 계획

## 현재 문제점 및 개선 방안

### 1. 중복 기능 통합

**현재 상황:**
- `/admin`의 "버전 관리" 탭
- `/admin`의 "캠페인 관리" 탭
- `/versions` 페이지

이 세 가지가 모두 동일한 HTML 파일들을 다른 방식으로 보여주고 있음.

**개선 방안:**
- 모든 기능을 "캠페인 관리" 하나로 통합
- 캠페인별로 관련된 모든 자료(페이지, OP 메뉴얼, 광고 소재 등)를 한 곳에서 관리
- `/versions` 페이지는 제거하거나 캠페인 관리로 리다이렉트

### 2. 불필요한 UI 요소 제거

**제거할 항목:**
```javascript
// 1. Live/실시간 연동 표시 제거
// admin.tsx에서 다음 부분 삭제
<span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
  Live
</span>

// 2. 새로고침 버튼 애니메이션 제거
// RefreshCw 아이콘의 animate-spin 클래스 제거
<RefreshCw className={`w-4 h-4 ${refreshing ? '' : ''}`} />
```

### 3. 캠페인별 OP 메뉴얼 체계화

**구현 방안:**
```
/docs/op-manuals/
  ├── 2025-05-가정의달/
  │   ├── README.md (운영 가이드)
  │   ├── scripts.md (응대 스크립트)
  │   └── faq.md (자주 묻는 질문)
  ├── 2025-06-프라임타임/
  │   └── ...
  └── 2025-07-여름특별/
      └── ...
```

### 4. 캠페인 관리 데이터 구조 개선

```javascript
// 기존: 분산된 데이터
const versions = [...];
const campaigns = [...];

// 개선: 통합된 캠페인 데이터
const campaigns = [
  {
    id: "2025-07",
    name: "여름 특별 캠페인",
    status: "active",
    period: {
      start: "2025-07-01",
      end: "2025-07-31"
    },
    files: {
      landingPage: "/versions/funnel-2025-07-complete.html",
      opManual: "/docs/op-manuals/2025-07-여름특별/",
      googleAds: "/google_ads/2025.07.여름특별/"
    },
    settings: {
      phoneNumber: "080-028-8888",
      eventDate: "7월 31일",
      remainingSlots: 10
    }
  }
];
```

### 5. 구현 순서

1. **Phase 1: 데이터 구조 통합** (즉시)
   - campaigns 데이터 구조 개선
   - versions 배열 제거

2. **Phase 2: UI 정리** (1일)
   - 중복 탭 제거
   - 불필요한 표시 제거
   - 새로고침 애니메이션 제거

3. **Phase 3: OP 메뉴얼 체계화** (2-3일)
   - 캠페인별 폴더 구조 생성
   - 기존 메뉴얼 이동
   - 템플릿 생성

4. **Phase 4: 고급 기능** (1주일)
   - 캠페인 복제 기능
   - 자동 OP 메뉴얼 생성
   - 성과 분석 대시보드

## 즉시 적용 가능한 수정사항

### 1. admin.tsx 수정
```javascript
// Line 420-450 부근
// "Live" 표시 제거
// animate-spin 클래스 제거

// 탭 배열 수정
const tabs = [
  { id: 'overview', label: '대시보드', icon: Activity },
  { id: 'campaigns', label: '캠페인 관리', icon: Megaphone }, // 통합된 관리
  { id: 'bookings', label: '예약 관리', icon: Calendar },
  { id: 'contacts', label: '문의 관리', icon: MessageSquare },
  // 'versions' 탭 제거
];
```

### 2. 캠페인 쉽게 추가하는 방법

```javascript
// 캠페인 템플릿 함수
function createNewCampaign(month, name) {
  return {
    id: `2025-${month}`,
    name: name,
    status: 'planned',
    period: {
      start: `2025-${month}-01`,
      end: `2025-${month}-${new Date(2025, month, 0).getDate()}`
    },
    files: {
      landingPage: `/versions/funnel-2025-${month}.html`,
      opManual: null, // 생성 필요
      googleAds: null  // 생성 필요
    },
    settings: {
      phoneNumber: "080-028-8888",
      eventDate: `${month}월 말일`,
      remainingSlots: 30
    }
  };
}
```

## 장기적 개선 방향

1. **Supabase 활용**
   - 캠페인 데이터를 DB에 저장
   - 실시간 성과 추적
   - 버전 관리 히스토리

2. **자동화**
   - 캠페인 종료시 자동 상태 변경
   - 월별 캠페인 자동 생성
   - 성과 리포트 자동 생성

3. **통합 분석**
   - 캠페인별 ROI 분석
   - A/B 테스트 기능
   - 고객 행동 분석
