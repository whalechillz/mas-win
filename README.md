# MASGOLF 웹사이트

골프 클럽 판매를 위한 Next.js 기반 랜딩 페이지 프로젝트입니다.

## 🚨 중요 문서

- **[📢 메인 가이드](./MAIN_GUIDE.md)** - 프로젝트 작업 전 필독!
- **[📝 변경 이력](./CHANGE_LOG.md)** - 수정 사항 기록
- **[🌐 사이트 구조](./docs/SITE_STRUCTURE.md)** - URL 및 페이지 구조
- **[📁 프로젝트 구조](./docs/PROJECT_STRUCTURE_GUIDE.md)** - 파일 구조 설명

## 📂 프로젝트 구조

```
win.masgolf.co.kr/
├── 📄 핵심 파일
│   ├── package.json         # 프로젝트 설정
│   ├── next.config.js       # Next.js 설정
│   ├── .env.local           # 환경 변수
│   └── vercel.json          # Vercel 설정
│
├── 📁 소스 코드
│   ├── pages/               # Next.js 페이지 및 API
│   ├── public/              # 정적 파일 및 HTML
│   ├── components/          # React 컴포넌트
│   ├── styles/              # 스타일 파일
│   └── lib/                 # 유틸리티 라이브러리
│
├── 📁 문서
│   ├── docs/                # 프로젝트 문서
│   │   ├── setup/           # 설정 가이드
│   │   └── troubleshooting/ # 문제 해결
│   ├── MAIN_GUIDE.md        # 메인 가이드
│   └── CHANGE_LOG.md        # 변경 이력
│
├── 📁 데이터베이스
│   └── database/            # DB 스키마 및 설정
│
├── 📁 스크립트
│   ├── scripts/             # 유틸리티 스크립트
│   ├── deploy-commands.sh   # 배포 명령어
│   ├── setup-vercel.sh      # Vercel 설정
│   └── test-local.sh        # 로컬 테스트
│
└── 📁 테스트
    └── tests/               # 테스트 파일
```

## 🚀 시작하기

1. **환경 설정**
   ```bash
   cp .env.example .env.local
   # .env.local 파일 편집
   ```

2. **패키지 설치**
   ```bash
   npm install
   ```

3. **개발 서버 실행**
   ```bash
   npm run dev
   ```

4. **배포**
   ```bash
   ./deploy-commands.sh
   ```

## 🆕 신규 기능

### 간편 블로그 관리 시스템
- **네이버 SEO 최적화**: 중복 콘텐츠 방지 전략
- **1개 주제 → 3개 다른 앵글**: 후기/팁/비교 자동 생성
- **직관적 UI**: 주제별 그룹, 계정별 색상
- [📖 직원용 가이드](./docs/EMPLOYEE_BLOG_GUIDE.md) | [🔧 설정 가이드](./docs/SIMPLE_BLOG_SETUP.md)

## 🔗 주요 URL

- **메인**: https://win.masgolf.co.kr
- **7월 캠페인**: https://win.masgolf.co.kr/funnel-2025-07
- **관리자**: https://win.masgolf.co.kr/admin

자세한 내용은 [사이트 구조 문서](./docs/SITE_STRUCTURE.md)를 참조하세요.

## 📚 추가 문서

- [설정 가이드](./docs/setup/) - 각종 서비스 설정 방법
- [문제 해결](./docs/troubleshooting/) - 일반적인 문제 해결법
- [API 문서](./pages/api/) - API 엔드포인트 설명
