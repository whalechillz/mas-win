#!/bin/bash

echo "🧹 프로젝트 구조 대청소 시작!"
echo "=============================="

# 1. 백업 폴더 생성
echo "📦 백업 중..."
mkdir -p backup-before-cleanup
cp package.json backup-before-cleanup/package-root.json 2>/dev/null || true
cp package-lock.json backup-before-cleanup/package-lock-root.json 2>/dev/null || true

# 2. mas-win의 Next.js 파일들을 루트로 이동
echo "📂 Next.js 파일들을 루트로 이동..."

# 필수 파일들 이동
mv mas-win/package.json ./
mv mas-win/package-lock.json ./
mv mas-win/next.config.js ./
mv mas-win/next-env.d.ts ./
mv mas-win/tsconfig.json ./
mv mas-win/tailwind.config.js ./
mv mas-win/postcss.config.js ./

# 폴더들 이동
mv mas-win/pages ./
mv mas-win/components ./ 2>/dev/null || true
mv mas-win/styles ./
mv mas-win/docs ./

# public 폴더 내용 병합
echo "📁 public 폴더 병합..."
cp -r mas-win/public/* ./public/
mv mas-win/.next ./ 2>/dev/null || true

# README 이동
mv mas-win/README.md ./README-nextjs.md 2>/dev/null || true

# 3. mas-win 폴더에서 필요한 스크립트 파일들 이동
echo "📝 스크립트 파일들 이동..."
mv mas-win/*.sh ./scripts/ 2>/dev/null || true

# 4. .gitignore 업데이트
echo "📄 .gitignore 병합..."
if [ -f "mas-win/.gitignore" ]; then
    cat mas-win/.gitignore >> .gitignore
    sort -u .gitignore -o .gitignore
fi

# 5. 빈 mas-win 폴더 삭제
echo "🗑️ 빈 폴더 삭제..."
rm -rf mas-win

# 6. 불필요한 백업 폴더들 삭제
rm -rf backup-static

# 7. node_modules 정리
echo "🧹 node_modules 재설치 준비..."
rm -rf node_modules

echo ""
echo "✅ 정리 완료!"
echo ""
echo "📋 다음 단계:"
echo "1. npm install (의존성 재설치)"
echo "2. npm run dev (로컬에서 테스트)"
echo "3. git add ."
echo "4. git commit -m '🧹 refactor: 프로젝트 구조 정리 - mas-win 폴더 제거'"
echo "5. git push"
echo ""
echo "🎯 Vercel이 이제 제대로 인식할 것입니다!"
