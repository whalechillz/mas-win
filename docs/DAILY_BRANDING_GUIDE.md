# 데일리 브랜딩 가이드

## 📋 개요

데일리 브랜딩은 **365일 매일 브랜드 노출**을 위한 콘텐츠입니다.
- **카카오톡**: 프로필 배경 + 프로필 이미지 + 메시지 + 피드
- **당근 피드**: 이미지 + 캡션 (추가 예정)
- **인스타그램**: 피드 + 스토리 (추가 예정)
- **쓰레드, 그록**: (추가 예정)

## 🎯 오늘 카톡 배경/프로필 생성 방법

### 방법 1: UI에서 자동 생성 (권장)

1. **허브 시스템 → 데일리 브랜딩 탭** 클릭
2. **"카카오톡 콘텐츠 관리"** 링크 클릭
3. `/admin/kakao-content` 페이지로 이동
4. **오늘 날짜의 콘텐츠가 자동으로 표시됨**

#### 생성 단계:

**1단계: 브랜드 전략 설정**
- 페이지 상단 "🎯 마쓰구 브랜드 전략" 섹션
- 콘텐츠 유형, 페르소나, 오디언스 온도 등 설정
- 이미지 톤과 스타일 결정

**2단계: 프롬프트 설정 선택**
- "⚙️ 프롬프트 설정 관리" 섹션
- 저장된 프롬프트 설정 선택 (선택사항)
- 기본 설정 사용 가능

**3단계: 이미지 생성**
- **계정 1 (대표폰)**: "🏆 골드톤 이미지 생성" 버튼 클릭
  - 배경 이미지 생성
  - 프로필 이미지 생성
- **계정 2 (업무폰)**: "⚡ 블랙톤 이미지 생성" 버튼 클릭
  - 배경 이미지 생성
  - 프로필 이미지 생성

**4단계: 자동 생성 (전체)**
- 페이지 하단 "🚀 전체 자동 생성" 버튼 클릭
- 계정 1 → 계정 2 순서로 자동 생성
- 모든 이미지 생성 및 캘린더에 저장

### 방법 2: JSON 파일 직접 수정

**파일 위치**: `docs/content-calendar/2025-11.json`

**구조**:
```json
{
  "profileContent": {
    "account1": {
      "dailySchedule": [
        {
          "date": "2025-11-12",
          "background": {
            "image": "해안 코스",
            "prompt": "해안 골프 코스, 노을, 따뜻한 분위기",
            "status": "planned"
          },
          "profile": {
            "image": "시니어 골퍼",
            "prompt": "시니어 골퍼, 해안 배경, 감성적인 포즈",
            "status": "planned"
          },
          "message": "스윙보다 마음이 먼저다.",
          "status": "planned",
          "created": false
        }
      ]
    }
  }
}
```

**수정 후**:
- UI에서 "계정 자동 생성" 버튼 클릭
- 또는 Playwright 스크립트 실행

## 📅 월간/주간/일간 허브 콘텐츠 JSON 구조

### 현재 구조 (2025-11.json)

```json
{
  "month": "2025-11",
  "strategy": {
    "theme": "MUZIIK 콜라보 런칭 & 신제품 소개",
    "targetAudience": "시니어 골퍼 (50-60대)",
    "contentTypes": {
      "신제품 소개": 5,
      "고객 후기": 4,
      "테스트 결과": 3,
      "시의성": 4,
      "이벤트": 3,
      "교육/팁": 2
    }
  },
  
  // ⚠️ 현재 hubContents는 DB에만 있고 JSON에는 없음
  // 통합 구조 제안 (아직 구현 안 됨):
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
  
  // ✅ 현재 구현됨: 데일리 브랜딩
  "profileContent": {
    "account1": {
      "dailySchedule": [
        {
          "date": "2025-11-12",
          "background": { "image": "...", "prompt": "..." },
          "profile": { "image": "...", "prompt": "..." },
          "message": "...",
          "status": "planned"
        }
      ]
    },
    "account2": { ... }
  },
  
  "kakaoFeed": {
    "dailySchedule": [
      {
        "date": "2025-11-12",
        "account1": {
          "imageCategory": "시니어 골퍼의 스윙",
          "imagePrompt": "...",
          "caption": "...",
          "status": "planned"
        },
        "account2": { ... }
      }
    ]
  }
}
```

### 허브 콘텐츠 vs 데일리 브랜딩

| 구분 | 허브 콘텐츠 | 데일리 브랜딩 |
|------|------------|--------------|
| **목적** | 주제 기반 멀티채널 배포 | 매일 브랜드 노출 |
| **주기** | 불규칙 (주제별) | 규칙적 (매일) |
| **저장 위치** | DB (`cc_content_calendar`) | JSON 파일 |
| **관리 페이지** | `/admin/content-calendar-hub` | `/admin/kakao-content` |
| **JSON 구조** | ⚠️ 아직 없음 (제안만 있음) | ✅ 구현됨 |

## 🎨 이미지 프롬프트와 메시지 생성 위치

### 1. 자동 생성 스크립트 (월간 생성)

**파일**: `scripts/generate-monthly-content.js`

**사용법**:
```bash
node scripts/generate-monthly-content.js
```

**기능**:
- 월별 전략 기반 콘텐츠 생성
- 주간 테마 기반 일별 스케줄 생성
- 이미지 프롬프트 자동 생성
- 메시지 자동 생성

**생성 내용**:
- `profileContent.dailySchedule` (배경, 프로필, 메시지)
- `kakaoFeed.dailySchedule` (피드 이미지, 캡션)

### 2. 수동 생성 (JSON 파일 직접 수정)

**파일**: `docs/content-calendar/YYYY-MM.json`

**프롬프트 작성 가이드**:
- **골드톤 (계정 1)**: "따뜻한 골드·브라운 톤", "시니어 골퍼", "감성적인 분위기"
- **블랙톤 (계정 2)**: "쿨 블루·그레이 톤", "젊은 골퍼", "하이테크 분위기"

**메시지 작성 가이드**:
- 짧고 임팩트 있는 문구 (10-15자)
- 주간 테마와 연관
- 브랜드 가치 전달

### 3. UI에서 생성 (실시간)

**페이지**: `/admin/kakao-content`

**프롬프트 생성**:
1. 브랜드 전략 설정
2. 프롬프트 설정 선택
3. "이미지 생성" 버튼 클릭
4. AI가 프롬프트를 기반으로 이미지 생성

**메시지 수정**:
- 프로필 메시지: 텍스트 입력 필드에서 직접 수정
- 피드 캡션: 텍스트 입력 필드에서 직접 수정
- 저장 버튼 클릭 시 캘린더에 자동 저장

## 🔄 워크플로우

### 오늘 작업 순서 (권장)

1. **허브 시스템** (`/admin/content-calendar-hub`)
   - "데일리 브랜딩" 탭 클릭
   - "카카오톡 콘텐츠 관리" 링크 클릭

2. **카카오 콘텐츠 생성** (`/admin/kakao-content`)
   - 브랜드 전략 설정
   - 프롬프트 설정 선택
   - "🚀 전체 자동 생성" 버튼 클릭
   - 생성된 이미지 확인 및 수정

3. **캘린더 확인**
   - 생성된 이미지 URL이 JSON에 저장됨
   - `created: true`로 변경됨

### 월간 계획 수립

1. **월간 전략 수립**
   - `docs/content-calendar/YYYY-MM.json` 파일 생성
   - `strategy` 섹션 작성

2. **자동 생성 스크립트 실행**
   ```bash
   node scripts/generate-monthly-content.js
   ```

3. **수동 검토 및 수정**
   - 생성된 프롬프트와 메시지 검토
   - 필요시 수정

4. **일별 실행**
   - 매일 오전 7-9시에 UI에서 자동 생성 실행

## 📝 참고 문서

- [콘텐츠 캘린더 시스템](./content-calendar/README.md)
- [카카오 프로필 운영 가이드](./content-calendar/PROFILE_OPERATION_GUIDE.md)
- [카카오 콘텐츠 사용 가이드](./kakao-content-usage-guide.md)
- [콘텐츠 시스템 아키텍처](./CONTENT_SYSTEM_ARCHITECTURE.md)


