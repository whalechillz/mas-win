# MASGOLF 웹사이트

골프 클럽 판매를 위한 Next.js 기반 랜딩 페이지 프로젝트입니다.

## 🚨 필독! 중요 가이드

- **[📢 메인 가이드](./MAIN_GUIDE.md)** - 수정 전 반드시 확인!
- **[📝 수정 로그](./CHANGE_LOG.md)** - 변경 사항 기록
- **[📁 프로젝트 구조](./docs/PROJECT_STRUCTURE_GUIDE.md)** - 파일 구조 설명

## 기술 스택

- **프레임워크**: Next.js 14
- **언어**: JavaScript/TypeScript
- **스타일링**: Tailwind CSS
- **데이터베이스**: Supabase
- **알림**: Slack Webhook
- **배포**: Vercel

## 프로젝트 구조

```
/pages
  /api          - API 라우트
  /admin        - 관리자 페이지
  /campaign     - 캠페인 페이지
  funnel-*.tsx  - 퍼널 페이지들

/public
  /assets       - 이미지 및 정적 파일
  /versions     - HTML 랜딩 페이지

/components     - React 컴포넌트
/styles         - 글로벌 스타일
```

## 환경 설정

`.env.local` 파일에 다음 환경 변수 설정:

```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_key
SLACK_WEBHOOK_URL=your_slack_webhook_url
ADMIN_PASS=admin_password
```

## 개발 서버 실행

```bash
npm install
npm run dev
```

## 배포

Vercel을 사용한 배포:

```bash
vercel --prod
```

## API 엔드포인트

- `/api/contact` - 문의 접수
- `/api/booking` - 시타 예약
- `/api/quiz-result` - 퀴즈 결과 저장
- `/api/admin-login` - 관리자 로그인

## 주요 페이지

- `/funnel-2025-07` - 7월 여름 캠페인
- `/funnel-2025-06` - 6월 프라임타임 캠페인
- `/funnel-2025-05` - 5월 가정의달 캠페인
- `/admin` - 관리자 대시보드

## 백업 정보

`/backup-2025-01` 디렉토리에 이전 버전 및 임시 파일들이 백업되어 있습니다.