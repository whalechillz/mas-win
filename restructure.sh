#!/bin/bash

echo "🔧 프로젝트 구조 정리 중..."

# 1. mas-win의 내용을 루트로 이동
echo "📦 Moving Next.js files to root..."

# 중요 파일들 복사
cp mas-win/package.json ./package-nextjs.json
cp mas-win/next.config.js ./
cp -r mas-win/pages ./
cp -r mas-win/public/* ./public/ 2>/dev/null || true
cp -r mas-win/styles ./ 2>/dev/null || true
cp -r mas-win/components ./ 2>/dev/null || true

# 2. package.json 병합
echo "📝 Merging package.json..."
# Next.js package.json을 메인으로 사용
mv package-nextjs.json package.json

echo "✅ 구조 정리 완료!"
echo ""
echo "다음 단계:"
echo "1. npm install"
echo "2. npm run dev (로컬 테스트)"
echo "3. git add . && git commit -m 'refactor: 프로젝트 구조 정리'"
echo "4. git push"
echo "5. Vercel이 자동으로 재배포됩니다"
