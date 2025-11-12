# 콘텐츠 시스템 아키텍처

## 📊 시스템 구분

### 1. 콘텐츠 허브 (Content Hub)
**특성**: 주제 기반, 멀티채널 배포

- **목적**: 하나의 주제를 여러 채널에 배포
- **채널**: blog, sms, naver_blog, kakao (채널 파생)
- **주기**: 주제별 (불규칙)
- **저장**: `cc_content_calendar` 테이블 (DB)
- **관리**: `/admin/content-calendar-hub`

**예시**:
- 주제: "MUZIIK 콜라보 런칭"
- 배포: 블로그, SMS, 네이버 블로그, 카카오 채널

### 2. 데일리 브랜딩 콘텐츠 (Daily Branding Content)
**특성**: 365일 일별 브랜딩

- **목적**: 매일 브랜드 노출 및 인지도 향상
- **채널**: 카톡, 당근 피드, 인스타그램, 쓰레드, 그록 등
- **주기**: 매일 (365일, 규칙적)
- **저장**: `docs/content-calendar/YYYY-MM.json` (JSON 파일)
- **관리**: `/admin/kakao-content` (확장 필요)

**예시**:
- 카카오톡: 매일 프로필 + 피드 업데이트
- 당근 피드: 매일 이미지 + 캡션
- 인스타그램: 매일 피드 + 스토리

## 🎯 캘린더 구조 제안

### 통합 캘린더 구조 (권장)

**하나의 캘린더로 모든 콘텐츠 관리**

```json
{
  "month": "2025-11",
  "strategy": {
    "theme": "월별 전략",
    "targetAudience": "..."
  },
  
  // 1. 콘텐츠 허브 (주제 기반, 멀티채널)
  "hubContents": [
    {
      "date": "2025-11-12",
      "topic": "MUZIIK 콜라보 런칭",
      "title": "...",
      "summary": "...",
      "channels": ["blog", "sms", "naver_blog", "kakao"],
      "status": "planned"
    }
  ],
  
  // 2. 데일리 브랜딩 (365일, 채널별)
  "dailyBranding": {
    "kakao": {
      "account1": { "dailySchedule": [...] },
      "account2": { "dailySchedule": [...] }
    },
    "karrot": {
      "dailySchedule": [
        {
          "date": "2025-11-12",
          "imagePrompt": "...",
          "caption": "...",
          "status": "planned"
        }
      ]
    },
    "instagram": {
      "dailySchedule": [...]
    },
    "threads": {
      "dailySchedule": [...]
    },
    "grok": {
      "dailySchedule": [...]
    }
  }
}
```

## 📋 구조 비교

| 구분 | 콘텐츠 허브 | 데일리 브랜딩 |
|------|------------|--------------|
| **목적** | 주제 기반 배포 | 브랜드 노출 |
| **주기** | 불규칙 (주제별) | 규칙적 (매일) |
| **채널** | blog, sms, naver_blog, kakao | 카톡, 당근, 인스타, 쓰레드, 그록 |
| **저장** | DB (`cc_content_calendar`) | JSON 파일 |
| **관리** | `/admin/content-calendar-hub` | `/admin/kakao-content` (확장) |

## 🔄 통합 방안

### 옵션 1: 통합 캘린더 (권장) ✅

**장점**:
- 하나의 파일로 전체 관리
- 일별/주별/월별 통합 뷰
- 중복 방지
- 일관성 유지

**구조**:
```
docs/content-calendar/2025-11.json
├── hubContents (콘텐츠 허브)
└── dailyBranding (데일리 브랜딩)
    ├── kakao
    ├── karrot
    ├── instagram
    ├── threads
    └── grok
```

### 옵션 2: 분리 캘린더

**장점**:
- 역할 분리 명확
- 파일 크기 관리 용이

**단점**:
- 두 곳에서 관리 필요
- 중복 가능성

## 💡 최종 권장안

### 통합 캘린더 구조

1. **콘텐츠 허브**: `hubContents` 배열
   - 주제 기반
   - 멀티채널 배포
   - DB와 동기화

2. **데일리 브랜딩**: `dailyBranding` 객체
   - 채널별 일별 스케줄
   - 365일 자동 생성
   - JSON 파일 저장

3. **통합 관리 UI** ✅ (구현 완료)
   - 허브 시스템 페이지 (`/admin/content-calendar-hub`)
   - 콘텐츠 허브 탭 (리스트 뷰 / 달력 뷰 토글)
   - 데일리 브랜딩 탭 (카카오톡 링크 포함, 향후 확장)

## 🚀 구현 단계

### Phase 1: 구조 통합
- [ ] 기존 `contents` → `hubContents`로 변경
- [ ] `dailyBranding` 섹션 추가
- [ ] 채널별 일별 스케줄 구조 정의

### Phase 2: UI 통합 ✅ (완료)
- [x] 콘텐츠 허브 섹션 (기존 유지)
- [x] 리스트 뷰 / 달력 뷰 토글 추가
- [x] 데일리 브랜딩 섹션 (탭 추가)
  - [x] 카카오톡 (링크 연결)
  - [ ] 당근 피드 (신규, 예정)
  - [ ] 인스타그램 (신규, 예정)
  - [ ] 쓰레드 (신규, 예정)
  - [ ] 그록 (신규, 예정)

### Phase 3: 자동화
- [ ] 365일 스케줄 자동 생성
- [ ] 채널별 이미지 프롬프트 생성
- [ ] 일괄 배포 기능

## 📝 결론

**권장**: 통합 캘린더 구조
- 하나의 파일로 관리
- 콘텐츠 허브와 데일리 브랜딩 구분
- 확장성 고려

**구분**:
- **콘텐츠 허브**: 주제 기반, 멀티채널 배포 (불규칙)
- **데일리 브랜딩**: 365일 일별 브랜딩 (규칙적)

