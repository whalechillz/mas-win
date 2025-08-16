#!/bin/bash

echo "🔍 파일 변경 이력 추적 시작..."

# 1. 현재 파일 상태
echo "📅 현재 파일 상태:"
ls -la public/versions/funnel-2025-08-*.html

echo ""
echo "📋 Git 히스토리 확인:"
git log --follow --oneline -- public/versions/funnel-2025-08-*.html

echo ""
echo "📊 파일 내용 해시 확인:"
for file in public/versions/funnel-2025-08-*.html; do
  if [ -f "$file" ]; then
    echo "$(basename "$file"): $(md5sum "$file" | cut -d' ' -f1)"
  fi
done

echo ""
echo "🔍 백업 파일 확인:"
find backup -name "*funnel-2025-08*" -type f 2>/dev/null | head -5

echo ""
echo "✅ 추적 완료!"
