#!/bin/bash

echo "🔍 MAS Golf 프로젝트 상태 확인 스크립트"
echo "======================================="
echo ""

# 1. 현재 디렉토리 확인
echo "1. 현재 위치:"
pwd
echo ""

# 2. Git 상태 확인
echo "2. Git 상태:"
git status --short
echo ""

# 3. 최근 커밋 확인
echo "3. 최근 커밋 (5개):"
git log --oneline -5
echo ""

# 4. admin.js 파일 확인
echo "4. admin.js 파일 내용 확인 (로그인 부분):"
grep -A 10 "handleLogin" pages/admin.js | grep -E "(email|password|1234)"
echo ""

# 5. supabaseClient.js 확인
echo "5. supabaseClient.js 환경변수 사용 확인:"
grep -E "(process.env|NEXT_PUBLIC)" lib/supabaseClient.js
echo ""

# 6. .env.local 파일 확인
echo "6. 환경변수 설정 확인:"
grep -E "(SUPABASE|ADMIN)" .env.local
echo ""

# 7. Vercel 환경변수 확인
echo "7. vercel.json 확인:"
cat vercel.json 2>/dev/null || echo "vercel.json 파일이 없습니다"
echo ""

# 8. 원격 저장소 확인
echo "8. 원격 저장소 상태:"
git remote -v
echo ""

# 9. 원격과 로컬 차이 확인
echo "9. 원격 저장소와 차이점:"
git fetch origin
git log HEAD..origin/main --oneline
echo ""

# 10. 배포 상태 확인을 위한 URL
echo "10. 확인해야 할 URL들:"
echo "   - Vercel Dashboard: https://vercel.com/dashboard"
echo "   - Admin Page: https://win.masgolf.co.kr/admin"
echo "   - API Test: https://win.masgolf.co.kr/api/test-db"
echo ""

echo "✅ 확인 완료"
