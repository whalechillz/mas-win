# 카카오톡 콘텐츠 슬랙 연동 가이드

## 📋 개요

카카오톡 콘텐츠 시스템과 Slack을 연동하여 매일 아침 자동으로 콘텐츠를 전송하고, 슬랙에서 "다시" 명령으로 재생성할 수 있는 기능을 제공합니다.

## 🎯 주요 기능

### 1. 매일 아침 9시 30분 자동 알림
- 오늘 날짜의 카카오톡 콘텐츠를 슬랙으로 전송
- 계정명, 이미지 URL, 문구를 복붙하기 쉽게 정리
- `created: false`인 항목도 포함하여 미생성 상태 표시

### 2. 슬랙에서 재생성 명령
- 슬랙 채널에서 "다시" 또는 "재생성" 입력 시 자동 생성 시작
- 생성 시작 알림 전송
- 생성 완료 후 최종 알림 전송 (생성된 콘텐츠 정보 포함)

## 🔧 설정 방법

### 1. 환경 변수 설정

Vercel 대시보드에서 다음 환경 변수를 설정하세요:

```bash
# 슬랙 웹훅 URL (필수)
SLACK_WEBHOOK_URL_01_MA_OP=https://hooks.slack.com/services/YOUR/WEBHOOK/URL

# Cron Job 보안 (선택사항)
CRON_SECRET=your-secret-key

# 내부 API 보안 (선택사항)
INTERNAL_API_SECRET=your-internal-secret
```

### 2. Vercel Cron Job 설정

`vercel.json`에 다음 설정이 포함되어 있습니다:

```json
{
  "crons": [
    {
      "path": "/api/kakao-content/slack-daily-notification",
      "schedule": "30 9 * * *"
    }
  ]
}
```

이 설정으로 매일 오전 9시 30분에 자동으로 알림이 전송됩니다.

## 📡 API 엔드포인트

### 1. 일일 알림 API
**엔드포인트**: `/api/kakao-content/slack-daily-notification`

**설명**: 오늘 날짜의 카카오톡 콘텐츠를 슬랙으로 전송

**호출 방법**:
- Vercel Cron Job에서 자동 호출 (매일 9시 30분)
- 수동 호출: `POST` 요청

**응답**:
```json
{
  "success": true,
  "date": "2025-11-12",
  "accounts": {
    "account1": true,
    "account2": true
  },
  "sent": true
}
```

### 2. 자동 생성 API
**엔드포인트**: `/api/kakao-content/auto-generate-today`

**설명**: 오늘 날짜의 카카오톡 콘텐츠를 자동 생성하고 완료 후 슬랙으로 알림 전송

**호출 방법**:
- 슬랙 재생성 명령 시 자동 호출
- 수동 호출: `POST` 요청

**요청 본문**:
```json
{}
```

**응답**:
```json
{
  "success": true,
  "date": "2025-11-12",
  "results": {
    "account1": {
      "success": true,
      "error": null
    },
    "account2": {
      "success": true,
      "error": null
    }
  }
}
```

### 3. 슬랙 재생성 웹훅
**엔드포인트**: `/api/slack/kakao-regenerate`

**설명**: 슬랙에서 "다시" 또는 "재생성" 명령을 받아 자동 생성 API 호출

**호출 방법**:
- Slack Workflow Builder에서 웹훅으로 설정
- 또는 Slack Events API로 설정

**요청 본문** (Slack 웹훅 형식):
```json
{
  "text": "다시"
}
```

## 🔄 슬랙에서 재생성하는 방법

### 방법 1: Slack Workflow Builder 사용 (권장)

1. Slack Workflow Builder 열기
2. 새 워크플로우 생성
3. 트리거: "키워드" 선택
4. 키워드: "다시" 또는 "재생성" 입력
5. 단계 추가: "웹훅으로 전송"
6. 웹훅 URL: `https://your-domain.com/api/slack/kakao-regenerate`
7. 요청 본문:
   ```json
   {
     "text": "{{trigger_word}}"
   }
   ```

### 방법 2: Slack Events API 사용

1. Slack App 생성 (https://api.slack.com/apps)
2. Event Subscriptions 활성화
3. Subscribe to bot events: `message.channels`
4. Request URL: `https://your-domain.com/api/slack/kakao-regenerate`

## 📱 슬랙 메시지 포맷

### 일일 알림 메시지

```
📱 2025-11-12 카카오톡 콘텐츠
━━━━━━━━━━━━━━━━━━━

📱 대표폰 (010-6669-9000)

[프로필 배경 이미지]
```
https://yyytjudftvpmcnppaymw.supabase.co/storage/v1/object/public/blog-images/...
```

[프로필 이미지]
```
https://yyytjudftvpmcnppaymw.supabase.co/storage/v1/object/public/blog-images/...
```

[프로필 문구]
`스윙보다 마음이 먼저다.`

[피드 이미지]
```
https://yyytjudftvpmcnppaymw.supabase.co/storage/v1/object/public/blog-images/...
```

[피드 문구]
`시니어 골퍼도 비거리 20m 증가 가능`
```

### 재생성 시작 알림

```
🔄 2025-11-12 카카오톡 콘텐츠 자동 생성 시작

이미지 생성 중입니다. 완료되면 알려드리겠습니다.
예상 소요 시간: 1-2분
```

### 재생성 완료 알림

```
✅ 2025-11-12 카카오톡 콘텐츠 생성 완료!

[생성 결과 요약]
• 대표폰: ✅ 생성 완료
• 업무폰: ✅ 생성 완료

[생성된 콘텐츠 정보 - 일일 알림과 동일한 포맷]
...
```

## 🔍 동작 방식

### 저장된 기준으로 전송

- 일일 알림은 **캘린더 JSON 파일에 저장된 데이터**를 기준으로 전송됩니다
- `created: true`인 항목: 생성 완료 상태로 표시
- `created: false`인 항목: ⚠️ 미생성 상태로 표시
- 이미지 URL이 없으면: ❌ 미생성으로 표시

### 재생성 프로세스

1. 슬랙에서 "다시" 입력
2. 생성 시작 알림 전송
3. Account 1 자동 생성 (배경, 프로필, 피드)
4. Account 2 자동 생성 (배경, 프로필, 피드)
5. 캘린더 파일 업데이트
6. 생성 완료 알림 전송 (생성된 콘텐츠 정보 포함)

## 🛠️ 유틸리티 함수

### `lib/slack-notification.js`

슬랙 알림 관련 유틸리티 함수를 제공합니다:

- `sendSlackNotification(message, webhookUrl)`: 슬랙 메시지 전송
- `formatKakaoContentSlackMessage(params)`: 카카오톡 콘텐츠 슬랙 메시지 포맷 생성

## 📝 파일 구조

```
pages/api/
├── kakao-content/
│   ├── slack-daily-notification.js    # 매일 9시 30분 알림
│   ├── auto-generate-today.js         # 자동 생성 + 완료 알림
│   ├── auto-create-account1.js        # Account 1 자동 생성
│   └── auto-create-account2.js        # Account 2 자동 생성
└── slack/
    └── kakao-regenerate.js            # 슬랙 재생성 웹훅

lib/
└── slack-notification.js              # 슬랙 알림 유틸리티
```

## ⚠️ 주의사항

1. **크레딧 확인**: FAL AI 크레딧이 부족하면 이미지 생성이 실패합니다. 에러 메시지가 슬랙으로 전송됩니다.

2. **생성 시간**: 이미지 생성에는 시간이 걸립니다 (각 이미지당 약 10-30초). 재생성 시 1-2분 정도 소요될 수 있습니다.

3. **캘린더 파일**: 자동 생성 시 캘린더 JSON 파일이 업데이트됩니다. Git에 커밋하는 것을 권장합니다.

4. **환경 변수**: `SLACK_WEBHOOK_URL_01_MA_OP`가 설정되지 않으면 알림이 전송되지 않습니다.

## 🔗 관련 문서

- [프로필 운영 가이드](./PROFILE_OPERATION_GUIDE.md)
- [콘텐츠 캘린더 시스템](./README.md)
- [카카오톡 콘텐츠 저장 가이드](../KAKAO_CONTENT_STORAGE_GUIDE.md)

