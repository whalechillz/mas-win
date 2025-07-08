# 🗂️ 프로젝트 정리 계획 v2

## 현재 루트에 있는 파일들 정리

### 📚 문서 파일 (MD) 정리 계획

#### → `/docs/setup/` 로 이동
- `GOOGLE_ADS_CONVERSION_SETUP.md` - Google Ads 설정
- `SLACK_SETUP_GUIDE.md` - Slack 설정
- `SLACK_SIMPLE_DESIGN.md` - Slack 디자인
- `SUPABASE_SETUP_GUIDE.md` - Supabase 설정
- `VERCEL_ENV_SETUP.md` - Vercel 환경 설정

#### → `/docs/troubleshooting/` 로 이동
- `IFRAME_TEL_FIX_GUIDE.md` - iframe 전화번호 문제
- `KOREAN_DATA_FIX.md` - 한글 데이터 문제
- `SLACK_TROUBLESHOOTING.md` - Slack 문제 해결
- `STATIC_FILE_CACHE_FIX.md` - 정적 파일 캐시
- `TROUBLESHOOTING.md` - 일반 문제 해결

#### → 루트에 유지 (중요 문서)
- `README.md` - 프로젝트 소개
- `MAIN_GUIDE.md` - 메인 가이드 ⭐
- `CHANGE_LOG.md` - 변경 이력
- `DEPLOY_CHECKLIST.md` - 배포 체크리스트

### 🧪 테스트 파일 정리

#### → `/tests/` 로 이동
- `test-booking.html` - 예약 테스트

### 🛠️ 스크립트 파일 정리

#### → 루트에 유지 (핵심 스크립트)
- `deploy-commands.sh` - 배포 명령
- `setup-vercel.sh` - Vercel 설정
- `test-local.sh` - 로컬 테스트

### 📦 임시/정리 파일

#### → `/backup-scripts-2025-01/` 로 이동
- `CLEANUP_GUIDE.md` - 정리 가이드
- `CLEANUP_PLAN.md` - 정리 계획
- `cleanup-scripts.sh` - 정리 스크립트
- `quick-cleanup.sh` - 빠른 정리
- `organize-project.sh` - 프로젝트 구조화
- `iframe-parent-handler.tsx` - 임시 코드

## 정리 후 루트 디렉토리 (깔끔!)

```
win.masgolf.co.kr/
├── 📄 설정 파일
│   ├── .env.local
│   ├── .gitignore
│   ├── next.config.js
│   ├── package.json
│   ├── postcss.config.js
│   ├── tailwind.config.js
│   ├── tsconfig.json
│   └── vercel.json
│
├── 📄 중요 문서
│   ├── README.md
│   ├── MAIN_GUIDE.md ⭐
│   ├── CHANGE_LOG.md
│   └── DEPLOY_CHECKLIST.md
│
├── 🔧 핵심 스크립트
│   ├── deploy-commands.sh
│   ├── setup-vercel.sh
│   └── test-local.sh
│
└── 📁 디렉토리들
    ├── pages/
    ├── public/
    ├── components/
    ├── styles/
    ├── lib/
    ├── database/
    ├── docs/
    ├── scripts/
    └── tests/
```

## 실행 명령

```bash
# 프로젝트 구조 정리 실행
bash organize-project.sh
```

정리하시겠습니까? 🧹
