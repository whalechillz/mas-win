# MASGOLF 슬랙 알림 설정 가이드

## 1. 슬랙 웹훅 URL 생성하기

### 단계 1: 슬랙 워크스페이스에서 Incoming Webhooks 앱 추가
1. 슬랙 워크스페이스에 로그인
2. https://api.slack.com/apps 접속
3. "Create New App" 클릭
4. "From scratch" 선택
5. 앱 이름: "MASGOLF 알림봇" (또는 원하는 이름)
6. 워크스페이스 선택

### 단계 2: Incoming Webhooks 활성화
1. 생성된 앱의 설정 페이지에서 "Incoming Webhooks" 클릭
2. "Activate Incoming Webhooks" 토글을 ON으로 변경
3. "Add New Webhook to Workspace" 클릭
4. 알림을 받을 채널 선택 (예: #masgolf-예약알림)
5. "Allow" 클릭

### 단계 3: 웹훅 URL 복사
1. 생성된 Webhook URL 복사 (예: https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXXXXXXXXXXXXXX)

## 2. Vercel 환경변수 설정

### 방법 1: Vercel 대시보드에서 설정
1. https://vercel.com 로그인
2. win.masgolf.co.kr 프로젝트 선택
3. Settings → Environment Variables
4. 다음 환경변수 추가:
   - Key: `SLACK_WEBHOOK_URL`
   - Value: 복사한 웹훅 URL
   - Environment: Production, Preview, Development 모두 체크
5. "Save" 클릭

### 방법 2: Vercel CLI로 설정
```bash
vercel env add SLACK_WEBHOOK_URL
# 프롬프트에서 웹훅 URL 입력
# Production, Preview, Development 모두 선택
```

## 3. 배포 및 테스트

```bash
# 변경사항 커밋
git add .
git commit -m "feat: 슬랙 알림 기능 추가"

# Vercel 배포
vercel --prod
```

## 4. 알림 형식

### 시타 예약 알림
```
🎯 새로운 시타 예약
고객명: 홍길동
연락처: 010-1234-5678
희망날짜: 2025-07-10
희망시간: 오후 2시
관심클럽: 드라이버
접수시간: 2025. 7. 4. 오후 3:45:30
[관리자 페이지에서 확인]
```

### 상담 문의 알림
```
📞 새로운 상담 문의
고객명: 김철수
연락처: 010-9876-5432
통화가능시간: 오전 10시-12시
접수시간: 2025. 7. 4. 오후 3:45:30
⚠️ 빠른 연락 부탁드립니다!
[관리자 페이지에서 확인]
```

## 5. 문제 해결

### 알림이 오지 않는 경우
1. Vercel 환경변수가 제대로 설정되었는지 확인
2. 슬랙 웹훅 URL이 올바른지 확인
3. 슬랙 채널에 웹훅 앱이 추가되었는지 확인
4. Vercel Functions 로그 확인: Vercel 대시보드 → Functions → 로그 확인

### 테스트 방법
1. 사이트에서 실제 예약/문의 폼 제출
2. 슬랙 채널에 알림이 오는지 확인
3. 관리자 페이지에서도 데이터 확인

## 6. 추가 커스터마이징

슬랙 알림 형식을 변경하려면 `/pages/api/slack/notify.js` 파일을 수정하세요.

- 이모지 변경
- 메시지 형식 변경
- 추가 필드 표시
- 버튼 추가/제거

## 7. 보안 주의사항

- 슬랙 웹훅 URL은 절대 클라이언트 코드에 노출하지 마세요
- 환경변수로만 관리하세요
- Git에 커밋하지 마세요
