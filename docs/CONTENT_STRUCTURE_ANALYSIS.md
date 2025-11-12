# 콘텐츠 구조 분석 및 개선안

## 📊 현재 구조 분석

### 1. 콘텐츠 허브 (Content Hub)
**특성**: 주제 기반, 멀티채널 배포
- **목적**: 하나의 주제를 여러 채널에 배포
- **채널**: blog, sms, naver_blog, kakao (채널 파생)
- **주기**: 주제별 (불규칙)
- **저장**: `cc_content_calendar` 테이블

### 2. 카카오톡 콘텐츠 (현재)
**특성**: 일별 브랜딩 콘텐츠
- **목적**: 매일 브랜드 노출
- **채널**: 카카오톡 프로필 + 피드
- **주기**: 매일 (365일)
- **저장**: `docs/content-calendar/2025-11.json` (JSON 파일)

### 3. 데일리 브랜딩 콘텐츠 (확장 필요)
**특성**: 365일 일별 브랜딩
- **목적**: 매일 브랜드 노출 및 인지도 향상
- **채널**: 카톡, 당근 피드, 인스타그램, 쓰레드, 그록 등
- **주기**: 매일 (365일)
- **저장**: 현재 미구현

## 🎯 구조 개선안

### 옵션 1: 통합 캘린더 (권장)

**하나의 캘린더로 모든 콘텐츠 관리**

```
docs/content-calendar/2025-11.json
{
  "month": "2025-11",
  
  // 1. 콘텐츠 허브 (주제 기반)
  "hubContents": [
    {
      "date": "2025-11-12",
      "topic": "MUZIIK 콜라보 런칭",
      "title": "...",
      "summary": "...",
      "channels": ["blog", "sms", "naver_blog", "kakao"]
    }
  ],
  
  // 2. 데일리 브랜딩 콘텐츠 (365일)
  "dailyBranding": {
    "kakao": {
      "account1": { ... },
      "account2": { ... }
    },
    "karrot": {
      "dailySchedule": [ ... ]
    },
    "instagram": {
      "dailySchedule": [ ... ]
    },
    "threads": {
      "dailySchedule": [ ... ]
    },
    "grok": {
      "dailySchedule": [ ... ]
    }
  }
}
```

**장점**:
- 하나의 파일로 전체 관리
- 일별/주별/월별 통합 뷰
- 중복 방지

**단점**:
- 파일이 커질 수 있음
- 채널별로 구조가 다를 수 있음

### 옵션 2: 분리 캘린더

**콘텐츠 허브와 데일리 브랜딩 분리**

```
docs/content-calendar/
├── hub/                    # 콘텐츠 허브 (주제 기반)
│   └── 2025-11.json
└── daily-branding/          # 데일리 브랜딩 (365일)
    └── 2025-11.json
```

**장점**:
- 역할 분리 명확
- 파일 크기 관리 용이

**단점**:
- 두 곳에서 관리 필요
- 중복 가능성

## 💡 추천 구조 (통합 캘린더)

### 구조 설계

```json
{
  "month": "2025-11",
  "strategy": {
    "theme": "월별 전략",
    "targetAudience": "..."
  },
  
  // 콘텐츠 허브 (주제 기반, 멀티채널)
  "hubContents": [
    {
      "date": "2025-11-12",
      "topic": "주제",
      "title": "제목",
      "summary": "요약",
      "overview": "개요",
      "channels": ["blog", "sms", "naver_blog", "kakao"],
      "status": "planned",
      "created": false
    }
  ],
  
  // 데일리 브랜딩 (365일, 채널별)
  "dailyBranding": {
    "kakao": {
      "account1": { ... },
      "account2": { ... }
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
      "dailySchedule": [ ... ]
    },
    "threads": {
      "dailySchedule": [ ... ]
    },
    "grok": {
      "dailySchedule": [ ... ]
    }
  }
}
```

## 🔧 구현 계획

### Phase 1: 구조 통합
1. 기존 `contents` → `hubContents`로 변경
2. `dailyBranding` 섹션 추가
3. 채널별 일별 스케줄 구조 정의

### Phase 2: UI 통합
1. 콘텐츠 허브 섹션 (기존 유지)
2. 데일리 브랜딩 섹션 (채널별 탭)
   - 카카오톡 (기존)
   - 당근 피드 (신규)
   - 인스타그램 (신규)
   - 쓰레드 (신규)
   - 그록 (신규)

### Phase 3: 자동화
1. 365일 스케줄 자동 생성
2. 채널별 이미지 프롬프트 생성
3. 일괄 배포 기능

## 📝 결론

**권장**: 통합 캘린더 구조
- 하나의 파일로 관리
- 일별/주별/월별 통합 뷰
- 확장성 고려

**구분**:
- **콘텐츠 허브**: 주제 기반, 멀티채널 배포 (불규칙)
- **데일리 브랜딩**: 365일 일별 브랜딩 (규칙적)


