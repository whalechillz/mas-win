#!/bin/bash

echo "🔍 Vercel 배포 디버깅"
echo "===================="

# 1. 최근 배포 확인
echo ""
echo "1️⃣ 최근 배포 목록:"
vercel list --count 5

# 2. 로컬 빌드 테스트
echo ""
echo "2️⃣ 로컬 빌드 테스트:"
npm run build 2>&1 | tail -20

# 3. 파일 구조 확인
echo ""
echo "3️⃣ pages 디렉토리 구조:"
find pages -type f \( -name "*.js" -o -name "*.jsx" -o -name "*.ts" -o -name "*.tsx" \) | sort

# 4. public 디렉토리 확인
echo ""
echo "4️⃣ public/versions 파일 확인:"
ls -la public/versions/*.html 2>/dev/null | wc -l
echo "HTML 파일 개수: $(ls public/versions/*.html 2>/dev/null | wc -l)"

# 5. Git 상태 확인
echo ""
echo "5️⃣ Git 상태:"
git log --oneline -5
