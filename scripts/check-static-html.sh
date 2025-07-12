#!/bin/bash

echo "🔍 정적 HTML 파일 백업 상태 확인"
echo "================================="

# 백업 디렉토리 확인
echo "📁 백업 디렉토리 상태:"
if [ -d "backup-2025-01/public-static-html" ]; then
    echo "✅ backup-2025-01/public-static-html 존재"
    ls -la backup-2025-01/public-static-html/
else
    echo "❌ 백업 디렉토리 없음"
fi

echo ""
echo "📁 현재 public 폴더 상태:"
ls -la public/

echo ""
echo "🔍 정적 HTML 파일 확인:"
if [ -f "public/index.html" ]; then
    echo "⚠️  public/index.html 존재 - Next.js 라우팅 방해 가능"
else
    echo "✅ public/index.html 없음"
fi

if [ -f "public/404.html" ]; then
    echo "⚠️  public/404.html 존재 - Next.js 라우팅 방해 가능"
else
    echo "✅ public/404.html 없음"
fi

echo ""
echo "📋 Next.js 페이지 목록:"
find pages -name "*.js" -o -name "*.jsx" -o -name "*.ts" -o -name "*.tsx" | grep -v "api/" | sort

echo ""
echo "🚀 로컬 빌드 테스트 (5초 후 중단):"
timeout 5 npm run build || true

echo ""
echo "✅ 확인 완료!"
