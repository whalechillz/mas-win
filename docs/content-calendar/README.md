# 콘텐츠 캘린더 시스템

MASGOLF의 허브 콘텐츠, 프로필 콘텐츠, 카카오 피드를 체계적으로 관리하기 위한 캘린더 시스템입니다.

## 📁 파일 구조

```
docs/content-calendar/
├── README.md                    # 이 파일
├── 2025-11.json                 # 11월 캘린더 계획
├── 2025-12.json                 # 12월 캘린더 계획 (예정)
├── kakao-feed-schedule.json     # 카카오 피드 스케줄 템플릿
├── execution-log.md             # 작성일지
└── strategy-template.json       # 전략 템플릿 (예정)
```

## 🎯 주요 기능

### 1. 허브 콘텐츠 관리
- 블로그, SMS, 네이버 블로그, 카카오 채널용 통합 콘텐츠
- 제목, 요약, 간단한 개요로 구성
- 멀티채널 자동 파생

### 2. 프로필 콘텐츠 관리
- **대표폰** (010-6669-9000): 시니어 중심 감성형 브랜딩
  - 페르소나: 따뜻한 톤 (골드·브라운)
  - 교체 주기: 매일 (배경 1 + 프로필 1)
  - 목적: 시니어 타깃의 '공감 신뢰' 확보
  
- **업무폰** (010-5704-0013): 하이테크 중심 혁신형 브랜딩
  - 페르소나: 쿨 톤 (블루·그레이)
  - 교체 주기: 매일 (배경 1 + 프로필 1)
  - 목적: 중장년층의 '기술 신뢰' 확보

자세한 내용은 [프로필 운영 가이드](./PROFILE_OPERATION_GUIDE.md)를 참고하세요.

### 3. 카카오 피드 관리
- **2개 계정 운영**: 매일 발행
- **이미지 카테고리** (4일 주기 로테이션):
  1. 젊은 골퍼의 스윙
  2. 매장의 모습
  3. 피팅 상담의 모습
  4. 시니어 골퍼의 스윙

## 📝 사용 방법

### 1. 월별 캘린더 생성

새로운 월의 캘린더를 생성하려면 `2025-11.json` 파일을 복사하여 수정하세요.

```bash
cp docs/content-calendar/2025-11.json docs/content-calendar/2025-12.json
```

### 2. 피드 스케줄 생성

11월 피드 스케줄을 생성하려면:

```bash
node scripts/generate-november-feed-schedule.js
```

이 스크립트는 `2025-11.json` 파일의 `kakaoFeed.dailySchedule`을 자동으로 채웁니다.

### 3. 자동 생성 실행

매일 오전에 다음 스크립트를 실행하여 오늘 날짜의 콘텐츠를 자동 생성합니다:

```bash
node scripts/auto-create-hub-content.js
```

이 스크립트는:
- 허브 콘텐츠 생성
- 카카오 피드 생성 (UI 구조에 맞게 수정 필요)
- 작성일지 업데이트

## 📋 캘린더 파일 구조

### 허브 콘텐츠
```json
{
  "date": "2025-11-11",
  "title": "제목",
  "summary": "요약 (SMS, 네이버 블로그용)",
  "overview": "간단한 개요",
  "type": "신제품 소개",
  "channels": ["blog", "sms", "kakao", "naver_blog"],
  "status": "planned",
  "created": false
}
```

### 프로필 콘텐츠
```json
{
  "pc": {
    "account": "010-6669-9000",
    "schedule": [
      {
        "date": "2025-11-11",
        "theme": "한 번의 샷으로 인생을 바꾼다.",
        "status": "planned"
      }
    ]
  },
  "mobile": {
    "account": "010-5704-0013",
    "schedule": [
      {
        "date": "2025-11-11",
        "type": "비거리 조언",
        "message": "테이크백은 천천히, 임팩트는 빠르게.",
        "status": "planned"
      }
    ]
  }
}
```

### 카카오 피드
```json
{
  "kakaoFeed": {
    "dailySchedule": [
      {
        "date": "2025-11-11",
        "account1": {
          "imageCategory": "젊은 골퍼의 스윙",
          "imagePrompt": "프롬프트...",
          "caption": "캡션...",
          "status": "planned"
        },
        "account2": {
          "imageCategory": "매장의 모습",
          "imagePrompt": "프롬프트...",
          "caption": "캡션...",
          "status": "planned"
        }
      }
    ]
  }
}
```

## 🔄 워크플로우

1. **월 초**: 다음 달 캘린더 계획 수립
2. **주 단위**: 프로필 콘텐츠 업데이트 (PC: 2주 1회, 모바일: 주 2회)
3. **일 단위**: 
   - 허브 콘텐츠 생성 (해당 날짜)
   - 카카오 피드 생성 (매일 2개 계정)
4. **작성일지**: `execution-log.md`에 생성 내역 기록

## 📊 작성일지 형식

`execution-log.md` 파일에 다음 형식으로 기록됩니다:

```markdown
## 2025-11-11 (화)
- ✅ MASSGOO X MUZIIK 콜라보레이션 런칭 콘텐츠
  - 생성 시간: 2025-11-11T09:30:00.000Z
  - 허브 ID: [생성된 ID]
  - 채널: blog, sms, kakao, naver_blog
  - 상태: success
```

## ⚠️ 주의사항

1. **카카오 피드 자동화**: 현재 `auto-create-hub-content.js`의 카카오 피드 생성 기능은 실제 UI 구조에 맞게 수정이 필요합니다.
2. **프로필 업데이트**: PC/모바일 프로필은 수동으로 업데이트해야 합니다.
3. **이미지 생성**: 피드 이미지는 갤러리에서 선택하거나 AI로 생성해야 합니다.

## 🔧 개선 예정

- [ ] 카카오 피드 자동 생성 기능 완성
- [ ] 프로필 콘텐츠 자동 업데이트 기능
- [ ] 이미지 자동 생성 및 선택 기능
- [ ] 월별 캘린더 자동 생성 스크립트
- [ ] 통계 및 분석 대시보드

## 📚 관련 문서

- [프로젝트 계획](../project_plan.md)
- [허브 시스템 가이드](../phases/phase13-hub-system.md) (예정)

