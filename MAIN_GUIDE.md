# 🚨 WIN.MASGOLF.CO.KR 메인 가이드 🚨

> **이 문서를 반드시 읽고 작업하세요!**

## 📂 중요 문서 링크

### 핵심 문서
1. **[프로젝트 구조 가이드](./docs/PROJECT_STRUCTURE_GUIDE.md)** - 파일 구조와 수정 규칙
2. **[사이트 구조](./docs/SITE_STRUCTURE.md)** - URL 및 페이지 구조
3. **[변경 이력](./CHANGE_LOG.md)** - 수정 사항 기록
4. **[배포 체크리스트](./DEPLOY_CHECKLIST.md)** - 배포 전 확인사항
5. **[직원용 블로그 가이드](./docs/EMPLOYEE_BLOG_GUIDE.md)** - 🆕 블로그 관리 실무 가이드

### 설정 가이드
- **[설정 가이드 목록](./docs/setup/)** - 각종 서비스 설정
  - Slack, Supabase, Google Ads, Vercel 등

### 문제 해결
- **[문제 해결 가이드](./docs/troubleshooting/)** - 일반적인 문제 해결
  - iframe 전화번호, 한글 데이터, 캐시 등

## ⚡ 빠른 참조

### 현재 활성 페이지
- **7월 캠페인**: `/funnel-2025-07` → `/public/versions/funnel-2025-07-complete.html`

### API 엔드포인트
```
/api/booking    - 시타 예약
/api/contact    - 문의 접수
/api/quiz-result - 퀴즈 결과
/api/admin-login - 관리자 로그인
```

### 자주 수정하는 항목

#### 1. 전화번호 변경
```bash
파일: /public/versions/funnel-2025-07-complete.html
검색: "080-028-8888"
```

#### 2. 이벤트 날짜/시간
```bash
파일: /public/versions/funnel-2025-07-complete.html
검색: "7월 31일"
```

#### 3. 남은 인원 수
```bash
파일: /public/versions/funnel-2025-07-complete.html
검색: "remaining-count"
```

## ❌ 절대 하지 말아야 할 것

1. **Repl로 파일 수정** → 파일시스템 사용
2. **TSX와 HTML 동시 수정** → 한 번에 하나만
3. **백업 없이 수정** → 항상 백업 먼저
4. **중복 파일 생성** → 기존 파일 수정

## 🐛 문제 해결

### iframe에서 전화번호가 안 될 때
1. HTML 파일의 스크립트 확인
2. TSX 파일의 메시지 리스너 확인
3. 콘솔 로그 확인

### API가 작동하지 않을 때
1. `/api/` 경로 확인
2. 환경 변수 확인 (.env.local)
3. Supabase 연결 상태 확인

### 스타일이 적용되지 않을 때
1. 캐시 강제 새로고침 (Ctrl+Shift+R)
2. HTML 파일의 `<style>` 태그 확인
3. 클래스명 오타 확인

## 📞 긴급 연락처

문제 발생 시:
1. 이 가이드 먼저 확인
2. `/docs` 폴더의 상세 가이드 확인
3. 백업 폴더 확인 (`/backup-2025-01`)

---

**마지막 업데이트**: 2025년 1월
**작성자**: MASLABS 개발팀
