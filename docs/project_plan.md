# 프로젝트 계획

## 1. 목표
- MASGOLF 퍼널페이지 구축 및 운영

## 2. 주요 일정
- 기획: 2024-06-01 ~ 2024-06-05
- 디자인: 2024-06-06 ~ 2024-06-10
- 개발: 2024-06-11 ~ 2024-06-20
- 테스트/배포: 2024-06-21 ~ 2024-06-25

## 3. 담당자
- 기획: 홍길동
- 디자인: 김디자이너
- 개발: 이개발

## 4. 비고
- 일정은 상황에 따라 조정될 수 있음 

## 2024-06-25

### 작업 내역
- 5월 퍼널 백업 파일(`public/versions/funnel-2025-05.html`) git에서 복원
- 관리자 인증(비밀번호 기반) 로그인 페이지(`/pages/admin/login.tsx`) 생성
- 인증 성공 시 쿠키(`admin_auth=1`) 발급 및 관리자 전용 라우트 접근 허용
- `/pages/admin/versions/[filename].tsx`에서 인증된 관리자만 정적 퍼널 파일을 볼 수 있도록 구현
- 쿠키 파싱을 위해 `cookie` 패키지 설치
- 인증 안 된 경우 `/admin/login`으로 리다이렉트 처리

### 변경 파일
- public/versions/funnel-2025-05.html (복원)
- pages/admin/login.tsx (신규)
- pages/api/admin-login.ts (신규)
- pages/admin/versions/[filename].tsx (신규)
- package.json, package-lock.json (cookie 패키지 추가)

### 남은 작업
- 환경변수(.env.local)에 ADMIN_PASS 값 추가 필요 (예: ADMIN_PASS=원하는비밀번호)
- 관리자 인증 UI/UX 개선(필요시)
- 추가 퍼널 파일 접근/관리 기능 확장(필요시) 

## 2024-06-13

### 작업 내역
- `public/versions` 폴더의 HTML 파일들을 Git에 추가
- `pages/api/html/` 디렉토리 전체를 Git에 추가
- 기타 변경된 파일(예: next.config.js, pages/campaign/2025-07.js 등) 포함 전체 변경사항 커밋
- 커밋 메시지: `Fix: Add static HTML files and API handler`
- 원격 저장소(main 브랜치)로 푸시 완료

### 변경된 파일
- public/versions/*.html
- pages/api/html/*
- next.config.js
- pages/campaign/2025-07.js
- scripts/check-git-files.sh

### 작업 목적
- 정적 HTML 파일 및 API 핸들러를 Git에 반영하여 배포 시 누락 방지
- 라우팅 및 정적 파일 제공 문제 해결

### 남은 작업
- 배포 후 정상 동작 확인
- 필요시 추가 라우팅/핸들러 개선 