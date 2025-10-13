# MASLABS 슬랙 메시지 구현 파일 모음

## 📁 포함된 파일들

### API 엔드포인트
- `api/slack/notify/` - 업무 알림 API
- `api/schedule-notify/` - 스케줄 알림 API  
- `api/daily-summary/` - 일일 요약 API
- `api/schedule-daily-report/` - 스케줄 일일 보고서 API

### 설정 및 테스트 파일
- `SLACK_SETUP.md` - 슬랙 설정 가이드
- `test-slack-webhook.js` - 슬랙 웹훅 테스트 스크립트
- `slack-*.js` - 슬랙 자동 설정 스크립트들

### 프론트엔드 파일
- `tasks_page_with_slack.tsx` - 슬랙 알림 호출 로직이 포함된 업무 페이지

## 🔧 핵심 기능

1. **업무 알림**: 업무 등록/수정 시 슬랙 알림
2. **스케줄 알림**: 스케줄 변경 시 알림
3. **일일 요약**: 자동화된 일일 성과 리포트
4. **스케줄 보고서**: 일일 스케줄 변경사항 보고서

## 📋 환경 변수

```bash
SLACK_WEBHOOK_URL_MASGOLF=      # 마스골프 전용 채널
SLACK_WEBHOOK_URL_SINGSINGOLF=  # 싱싱골프 전용 채널  
SLACK_WEBHOOK_URL_COMMON=       # 공통 채널
SLACK_WEBHOOK_URL_01_MA_OP=     # OP5 전용 채널
SLACK_WEBHOOK_URL_SCHEDULE_REPORT= # 스케줄 보고서 채널
```

## 🚀 사용법

1. 환경 변수 설정
2. 슬랙 앱 생성 및 웹훅 URL 설정
3. API 엔드포인트 배포
4. 프론트엔드에서 알림 호출

자세한 설정 방법은 `SLACK_SETUP.md` 파일을 참조하세요.
