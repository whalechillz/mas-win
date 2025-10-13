# Slack 알림 설정 가이드

## 1. Slack Webhook URL 설정

### Slack App 생성
1. https://api.slack.com/apps 에서 "Create New App" 클릭
2. "From scratch" 선택
3. App Name: "MASLABS 업무봇"
4. Workspace 선택

### Incoming Webhooks 활성화
1. App 설정에서 "Incoming Webhooks" 메뉴 선택
2. "Activate Incoming Webhooks" 토글 ON
3. "Add New Webhook to Workspace" 클릭
4. 채널 선택: `#31-gg-업무전달-매장관리-환경개선` (또는 원하는 채널)
5. "Allow" 클릭

### Webhook URL 복사
1. 생성된 Webhook URL을 복사
2. `.env.local` 파일에 추가:

```bash
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/WEBHOOK/URL
NEXT_PUBLIC_APP_URL=https://maslabs.kr
```

## 2. 채널 ID 확인

현재 설정된 채널 ID: `C04DEABHEM8`

채널 ID를 확인하려면:
1. Slack에서 해당 채널로 이동
2. 채널 이름 클릭 → "About" 탭
3. 하단에 "Channel ID" 표시됨

## 3. 테스트

업무 등록 후 다음을 확인:
1. Slack 채널에 알림 메시지 도착
2. 공유 업무 페이지에서 업무 내용 확인 가능

## 4. 메시지 포맷

Slack 알림에는 다음 정보가 포함됩니다:
- 업무 유형 (OP10)
- 작성자 정보
- 업무명
- 업무 내용 (200자 제한)
- 고객명
- 포인트
- 등록 시간
