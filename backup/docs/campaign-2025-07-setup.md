# MAS Golf 7월 캠페인 페이지 설정 가이드

## 🚀 프로젝트 개요
- **캠페인명**: 7월 썸머 스페셜 - 뜨거운 여름, 완벽한 스윙
- **주요 기능**: 
  - 비거리 비교 애니메이션
  - 스타일 퀴즈
  - 시타 예약
  - 문의 접수
  - 관리자 대시보드

## 📋 필수 설정 사항

### 1. 환경 변수 설정
`.env.local` 파일을 생성하고 다음 내용을 추가하세요:

```bash
# Supabase 설정
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Slack Webhook 설정 (선택사항)
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/WEBHOOK/URL
```

### 2. Supabase 설정

#### 2.1 프로젝트 생성
1. [Supabase](https://supabase.com)에서 새 프로젝트 생성
2. 프로젝트 URL과 Anon Key를 복사하여 환경변수에 추가

#### 2.2 테이블 생성
1. Supabase 대시보드에서 SQL Editor 열기
2. `/scripts/supabase-schema.sql` 파일의 내용을 실행

#### 2.3 인증 설정
1. Authentication > Users에서 관리자 계정 생성
2. 이메일과 비밀번호로 로그인 가능하도록 설정

### 3. Slack 알림 설정 (선택사항)

#### 3.1 Slack App 생성
1. [Slack API](https://api.slack.com/apps)에서 새 앱 생성
2. Incoming Webhooks 활성화
3. 채널 선택 후 Webhook URL 생성
4. URL을 환경변수에 추가

### 4. 이미지 파일 확인
다음 이미지 파일들이 있는지 확인:
- `/public/assets/campaigns/2025-07/hero-summer-golf-mas.jpg`
- `/public/assets/campaigns/2025-07/secret-force-pro3.jpg`
- `/public/assets/campaigns/2025-07/secret-weapon-black.jpg`
- `/public/assets/campaigns/2025-07/secret-force-v3.jpg`

## 🌐 페이지 접근 URL

### 캠페인 페이지
- **정적 HTML**: `/versions/funnel-2025-07-complete.html`
- **Next.js 라우트**: `/campaign/2025-07`

### 관리자 페이지
- **URL**: `/admin`
- **로그인**: Supabase에 등록한 이메일/비밀번호 사용

## 🔧 HTML 파일 내 설정 변경

`/public/versions/funnel-2025-07-complete.html` 파일에서 다음 부분을 수정하세요:

```javascript
// 14-17번 줄
const SUPABASE_URL = 'YOUR_SUPABASE_URL';
const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY';
const SLACK_WEBHOOK_URL = 'YOUR_SLACK_WEBHOOK_URL';
```

## 📱 기능 테스트

### 1. 퀴즈 기능
- 3가지 질문에 답변
- 추천 제품 확인
- 비거리 증가 시뮬레이션

### 2. 예약/문의 기능
- 시타 예약하기 클릭
- 폼 작성 후 제출
- Supabase 대시보드에서 데이터 확인
- Slack 알림 확인 (설정한 경우)

### 3. 관리자 기능
- `/admin` 접속
- 로그인
- 예약/문의 목록 확인
- 상태 변경

## 🚀 배포 체크리스트

- [ ] 환경변수 설정 완료
- [ ] Supabase 테이블 생성 완료
- [ ] 관리자 계정 생성 완료
- [ ] 이미지 파일 업로드 완료
- [ ] HTML 파일 내 API 키 수정 완료
- [ ] 전화번호 확인 (080-028-8888)
- [ ] 테스트 예약/문의 제출 확인
- [ ] 관리자 페이지 접속 확인

## 📞 지원

문제가 있으신 경우:
1. 콘솔 에러 확인
2. Supabase 로그 확인
3. 네트워크 탭에서 API 호출 확인

## 🎯 성공 지표

- 일일 방문자 수
- 퀴즈 완료율
- 예약 전환율
- 문의 응답률

---

마지막 업데이트: 2025년 7월 2일