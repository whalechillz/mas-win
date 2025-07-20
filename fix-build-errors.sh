#!/bin/bash

# 문제가 되는 파일들을 임시로 이동시키는 스크립트

echo "🔧 문제 파일 임시 제거 중..."

# mcp-helpers 디렉토리 전체를 백업
if [ -d "pages/api/mcp-helpers" ]; then
    mv pages/api/mcp-helpers pages/api/mcp-helpers.bak
    echo "✓ mcp-helpers 디렉토리 백업"
fi

# 기타 문제가 될 수 있는 파일들
files_to_backup=(
    "pages/admin-debug.tsx"
    "pages/admin-fixed.tsx"
    "pages/admin-new.tsx"
    "pages/admin-realtime.tsx"
    "pages/admin-v2.tsx"
    "pages/debug.tsx"
    "pages/funnel-2025-07-with-tracking.tsx"
    "pages/funnel-enhanced.tsx"
)

for file in "${files_to_backup[@]}"; do
    if [ -f "$file" ]; then
        mv "$file" "$file.bak"
        echo "✓ $file 백업"
    fi
done

echo ""
echo "✅ 문제 파일 정리 완료!"
echo ""
echo "이제 다음 명령어를 실행하세요:"
echo "npm run build"
echo "vercel --prod"