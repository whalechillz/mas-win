#!/bin/bash

echo "🚀 빠른 배포 시작..."

# Git 추가 및 커밋
git add .
git commit -m "Fix: Supabase connection and admin page update"

# main 브랜치로 푸시
git push origin main

echo "✅ 배포 완료!"
echo ""
echo "📝 다음 단계:"
echo "1. Supabase SQL Editor에서 다음 실행:"
echo "   /scripts/supabase/create-tables-no-rls.sql"
echo ""
echo "2. Vercel 배포 확인:"
echo "   https://vercel.com/dashboard"
echo ""
echo "3. 테스트:"
echo "   - https://win.masgolf.co.kr/api/test-db"
echo "   - https://win.masgolf.co.kr/admin (비밀번호: 1234)"
