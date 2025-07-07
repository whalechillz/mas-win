# 슬랙 알림 문제 해결 가이드

## 1. 환경변수 확인

### Vercel 대시보드에서 확인
1. https://vercel.com 로그인
2. win-masgolf-co-kr 프로젝트 선택
3. Settings → Environment Variables
4. `SLACK_WEBHOOK_URL` 확인

### 로컬 테스트용 (.env.local)
```
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/WEBHOOK/URL
```

## 2. 슬랙 웹훅 URL 테스트

터미널에서 직접 테스트:
```bash
curl -X POST -H 'Content-type: application/json' \
--data '{"text":"테스트 메시지입니다"}' \
YOUR_SLACK_WEBHOOK_URL
```

## 3. 브라우저 콘솔에서 확인

개발자 도구 (F12) → Network 탭에서:
- `/api/slack/notify` 요청 확인
- Status Code 확인 (200이어야 함)
- Response 확인

## 4. 서버 로그 확인

Vercel Functions 로그:
1. Vercel 대시보드 → Functions
2. api/slack/notify 선택
3. Logs 확인

## 5. 심플 디자인 예시

### 시타 예약 메시지
```
🎯 시타 예약

홍길동
010-1234-5678

📅 2025-07-07 14:00
🏌️ 시크리트포스 PRO 3

━━━━━━━━━━━━━━━━━━━
스윙: 안정형 | 중요: 비거리
비거리: 180m → 추천: R2
```

### 상담 문의 메시지
```
📞 상담 문의

김철수
010-5678-1234

⏰ 오후 2시, 오후 3시

━━━━━━━━━━━━━━━━━━━
스윙: 파워형 | 중요: 방향성
비거리: 200m → 추천: R1
```

## 6. 일반적인 문제와 해결

### 문제: 403 Forbidden
- 원인: 잘못된 웹훅 URL
- 해결: 슬랙에서 새 웹훅 URL 생성

### 문제: 404 Not Found  
- 원인: API 경로 오류
- 해결: `/api/slack/notify` 경로 확인

### 문제: 500 Internal Error
- 원인: 코드 오류
- 해결: Vercel Functions 로그 확인

### 문제: 메시지는 가지만 형식이 깨짐
- 원인: JSON 구조 오류
- 해결: message 객체 구조 확인

## 7. 긴급 복구

원래 버전으로 되돌리기:
```bash
cd /Users/m2/MASLABS/win.masgolf.co.kr
cp pages/api/slack/notify.js.backup-최신날짜 pages/api/slack/notify.js
vercel --prod
```
