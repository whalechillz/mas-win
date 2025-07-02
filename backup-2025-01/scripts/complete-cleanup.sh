#!/bin/bash

echo "🔧 Git 저장소를 포함한 완전한 프로젝트 정리"
echo "==========================================="

# 1. Git 저장소를 루트로 이동
echo "📂 Git 저장소 이동..."
if [ -d "mas-win/.git" ]; then
    mv mas-win/.git ./
    echo "✅ Git 저장소를 루트로 이동했습니다"
fi

# 2. mas-win의 모든 Next.js 파일들을 루트로 이동
echo "📦 Next.js 프로젝트 파일들 이동..."

# 설정 파일들
mv mas-win/package.json ./
mv mas-win/package-lock.json ./
mv mas-win/next.config.js ./
mv mas-win/next-env.d.ts ./
mv mas-win/tsconfig.json ./
mv mas-win/tailwind.config.js ./
mv mas-win/postcss.config.js ./
mv mas-win/.gitignore ./

# 폴더들
mv mas-win/pages ./
mv mas-win/components ./ 2>/dev/null || true
mv mas-win/styles ./
mv mas-win/docs ./

# public 폴더 병합
echo "📁 public 폴더 병합..."
if [ ! -d "./public" ]; then
    mkdir -p ./public
fi
cp -r mas-win/public/* ./public/ 2>/dev/null || true

# .next 폴더 이동
mv mas-win/.next ./ 2>/dev/null || true

# README 이동
if [ -f "mas-win/README.md" ]; then
    mv mas-win/README.md ./README-nextjs.md
fi

# 3. 스크립트 파일들 정리
echo "📝 스크립트 파일들 정리..."
mv mas-win/*.sh ./scripts/ 2>/dev/null || true

# 4. 백업 폴더들 정리
echo "🗑️ 백업 폴더들 제거..."
rm -rf mas-win/backup-static
rm -rf mas-win/node_modules

# 5. 빈 mas-win 폴더 삭제
echo "🧹 빈 폴더 삭제..."
rm -rf mas-win

# 6. node_modules 정리
echo "📦 의존성 재설치 준비..."
rm -rf node_modules

echo ""
echo "✅ 완전한 정리 완료!"
echo ""
echo "📋 이제 다음 명령어를 실행하세요:"
echo ""
echo "npm install"
echo "npm run dev"
echo ""
echo "git add ."
echo "git commit -m '🏗️ refactor: 프로젝트 구조 완전 정리'"
echo "git push"
echo ""
echo "🎯 이제 Vercel이 제대로 인식합니다!"
