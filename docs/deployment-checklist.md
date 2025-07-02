# 🚀 MAS Golf 7월 캠페인 배포 체크리스트

## 📋 배포 전 필수 확인 사항

### 1. 환경 설정
- [ ] `.env.local` 파일 생성 완료
- [ ] Supabase URL 및 Anon Key 설정
- [ ] Slack Webhook URL 설정 (선택)

### 2. Supabase 설정
- [ ] Supabase 프로젝트 생성
- [ ] 데이터베이스 테이블 생성 (`scripts/supabase-schema.sql` 실행)
- [ ] 관리자 계정 생성
- [ ] Row Level Security 정책 확인

### 3. 코드 수정
- [ ] HTML 파일의 Supabase 설정 부분 수정
  ```javascript
  // /public/versions/funnel-2025-07-complete.html 14-17번 줄
  const SUPABASE_URL = 'YOUR_SUPABASE_URL';
  const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY';
  ```

### 4. 이미지 확인
- [ ] `/public/assets/campaigns/2025-07/` 폴더의 모든 이미지 존재 확인
  - [ ] hero-summer-golf-mas.jpg
  - [ ] secret-force-pro3.jpg
  - [ ] secret-weapon-black.jpg
  - [ ] secret-force-v3.jpg

### 5. 의존성 설치
```bash
npm install
# 또는
yarn install
```

### 6. 로컬 테스트
- [ ] 개발 서버 실행 (`npm run dev`)
- [ ] 캠페인 페이지 접속 테스트
  - [ ] `/campaign/2025-07`
  - [ ] `/campaign/july-2025`
  - [ ] `/versions/funnel-2025-07-complete.html`
- [ ] 퀴즈 기능 테스트
- [ ] 비거리 애니메이션 테스트
- [ ] 시타 예약 폼 제출 테스트
- [ ] 문의 폼 제출 테스트
- [ ] 관리자 페이지 로그인 테스트 (`/admin`)

### 7. 빌드 및 배포
```bash
# 빌드
npm run build

# 로컬에서 프로덕션 모드 테스트
npm run start
```

### 8. Vercel 배포 (권장)
- [ ] Vercel에 프로젝트 연결
- [ ] 환경 변수 설정
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `SLACK_WEBHOOK_URL`
- [ ] 자동 배포 확인

### 9. 배포 후 확인
- [ ] 실제 도메인에서 페이지 접속
- [ ] HTTPS 적용 확인
- [ ] 모든 기능 정상 작동 확인
- [ ] Supabase 대시보드에서 데이터 수신 확인
- [ ] Slack 알림 수신 확인

### 10. 모니터링 설정
- [ ] Google Analytics 설정 (선택)
- [ ] Vercel Analytics 활성화 (선택)
- [ ] 에러 모니터링 도구 설정 (선택)

## 🔧 문제 해결

### 일반적인 문제
1. **Supabase 연결 실패**
   - API 키 확인
   - CORS 설정 확인

2. **Slack 알림 미수신**
   - Webhook URL 확인
   - `/api/slack-notify` 엔드포인트 응답 확인

3. **이미지 로드 실패**
   - 파일 경로 확인
   - 파일명 대소문자 확인

## 📞 긴급 연락처
- 기술 지원: dev@masgolf.com
- 고객 문의: 080-028-8888

---
마지막 업데이트: 2025년 7월 2일