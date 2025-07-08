#!/bin/bash

# 프로젝트 구조 정리 스크립트 v2
# 날짜: 2025년 1월

echo "🏗️ 프로젝트 구조 정리 시작..."

# 1. Setup/Config 문서 이동
echo "📁 Setup 문서 정리 중..."
SETUP_DOCS=(
    "GOOGLE_ADS_CONVERSION_SETUP.md"
    "SLACK_SETUP_GUIDE.md"
    "SLACK_SIMPLE_DESIGN.md"
    "SUPABASE_SETUP_GUIDE.md"
    "VERCEL_ENV_SETUP.md"
)

for doc in "${SETUP_DOCS[@]}"; do
    if [ -f "$doc" ]; then
        mv "$doc" "docs/setup/"
        echo "  ✓ $doc → docs/setup/"
    fi
done

# 2. Troubleshooting 문서 이동
echo "📁 문제 해결 문서 정리 중..."
TROUBLESHOOTING_DOCS=(
    "IFRAME_TEL_FIX_GUIDE.md"
    "KOREAN_DATA_FIX.md"
    "SLACK_TROUBLESHOOTING.md"
    "STATIC_FILE_CACHE_FIX.md"
    "TROUBLESHOOTING.md"
)

for doc in "${TROUBLESHOOTING_DOCS[@]}"; do
    if [ -f "$doc" ]; then
        mv "$doc" "docs/troubleshooting/"
        echo "  ✓ $doc → docs/troubleshooting/"
    fi
done

# 3. 테스트 파일 이동
echo "📁 테스트 파일 정리 중..."
if [ -f "test-booking.html" ]; then
    mv "test-booking.html" "tests/"
    echo "  ✓ test-booking.html → tests/"
fi

# 4. 임시/정리 관련 파일 백업
echo "📁 임시 파일 백업 중..."
TEMP_FILES=(
    "CLEANUP_GUIDE.md"
    "CLEANUP_PLAN.md"
    "cleanup-scripts.sh"
    "quick-cleanup.sh"
    "iframe-parent-handler.tsx"
)

for file in "${TEMP_FILES[@]}"; do
    if [ -f "$file" ]; then
        mv "$file" "backup-scripts-2025-01/"
        echo "  ✓ $file → backup-scripts-2025-01/"
    fi
done

# 5. 프로젝트 구조 업데이트
echo "📝 프로젝트 구조 문서 업데이트 중..."

# README.md 업데이트
cat > README_NEW.md << 'EOF'
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

## 🔗 주요 URL

- **메인**: https://win.masgolf.co.kr
- **7월 캠페인**: https://win.masgolf.co.kr/funnel-2025-07
- **관리자**: https://win.masgolf.co.kr/admin

자세한 내용은 [사이트 구조 문서](./docs/SITE_STRUCTURE.md)를 참조하세요.

## 📚 추가 문서

- [설정 가이드](./docs/setup/) - 각종 서비스 설정 방법
- [문제 해결](./docs/troubleshooting/) - 일반적인 문제 해결법
- [API 문서](./pages/api/) - API 엔드포인트 설명
EOF

mv README_NEW.md README.md

echo ""
echo "✅ 프로젝트 구조 정리 완료!"
echo ""
echo "📊 정리 결과:"
echo "  - Setup 문서: docs/setup/ 폴더로 이동"
echo "  - 문제 해결 문서: docs/troubleshooting/ 폴더로 이동"
echo "  - 테스트 파일: tests/ 폴더로 이동"
echo "  - 임시 파일: backup-scripts-2025-01/ 폴더로 이동"
echo ""
echo "📍 현재 루트 디렉토리 상태:"
ls -la | grep -E "\.md$|\.html$|\.sh$" | wc -l
echo "개의 파일만 남음"
