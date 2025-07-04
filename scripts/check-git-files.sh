#!/bin/bash

echo "🔍 Git 상태 확인"
echo "==============="

# public/versions 폴더가 Git에 추가되었는지 확인
echo ""
echo "📁 public/versions 폴더 상태:"
git ls-files public/versions/ | head -10

if [ -z "$(git ls-files public/versions/)" ]; then
    echo "⚠️  public/versions 폴더가 Git에 추가되지 않았습니다!"
    echo ""
    echo "🔧 해결 방법:"
    echo "git add public/versions/"
    echo "git commit -m 'Add static HTML files'"
    echo "git push origin main"
else
    echo "✅ public/versions 폴더가 Git에 포함되어 있습니다."
fi

echo ""
echo "📋 현재 Git 상태:"
git status --short

echo ""
echo "🌐 Vercel 배포 파일 확인:"
if [ -f ".vercelignore" ]; then
    echo "⚠️  .vercelignore 파일 내용:"
    cat .vercelignore
else
    echo "✅ .vercelignore 파일 없음 (모든 파일 배포됨)"
fi
