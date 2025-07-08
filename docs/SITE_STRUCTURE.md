# 🌐 WIN.MASGOLF.CO.KR 사이트 구조

## 📍 URL 맵

### 메인 페이지
- **홈**: https://win.masgolf.co.kr/
- **버전 목록**: https://win.masgolf.co.kr/versions

### 월별 캠페인 페이지
- **5월 캠페인**: https://win.masgolf.co.kr/funnel-2025-05
- **6월 캠페인**: https://win.masgolf.co.kr/funnel-2025-06
- **7월 캠페인**: https://win.masgolf.co.kr/funnel-2025-07 (현재 활성)

### 관리자 영역
- **관리자 로그인**: https://win.masgolf.co.kr/admin-login
- **관리자 대시보드**: https://win.masgolf.co.kr/admin

### 테스트/디버그 페이지
- **디버그 테스트**: https://win.masgolf.co.kr/debug-test.html
- **Supabase 테스트**: https://win.masgolf.co.kr/test-supabase

### API 엔드포인트
- **예약**: `/api/booking`
- **문의**: `/api/contact`
- **퀴즈 결과**: `/api/quiz-result`
- **관리자 로그인**: `/api/admin-login`
- **슬랙 테스트**: `/api/slack-test`

### 정적 HTML (iframe 소스)
- `/public/versions/funnel-2025-05-complete.html`
- `/public/versions/funnel-2025-06-complete.html`
- `/public/versions/funnel-2025-07-complete.html`

## 📂 파일-URL 매핑

| URL | 파일 위치 | 설명 |
|-----|---------|------|
| `/` | `/pages/index.js` | 메인 홈페이지 |
| `/versions` | `/pages/versions.js` | 버전 목록 페이지 |
| `/funnel-2025-XX` | `/pages/funnel-2025-XX.tsx` | 월별 캠페인 (iframe 컨테이너) |
| `/admin` | `/pages/admin.tsx` | 관리자 대시보드 |
| `/admin-login` | `/pages/admin-login.tsx` | 관리자 로그인 |
| `/api/*` | `/pages/api/*` | API 라우트 |

## 🔍 캠페인 페이지 작동 방식

1. 사용자가 `/funnel-2025-07` 접속
2. `pages/funnel-2025-07.tsx` 로드
3. iframe으로 `/public/versions/funnel-2025-07-complete.html` 표시
4. 전화번호 클릭 시 postMessage로 통신

## 💡 중요 참고사항

- **현재 활성 캠페인**: 7월 (funnel-2025-07)
- **이전 캠페인**: 계속 접속 가능 (SEO/북마크 고려)
- **관리자 페이지**: 비밀번호 필요 (.env.local의 ADMIN_PASS)
