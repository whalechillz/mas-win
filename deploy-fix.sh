#!/bin/bash

echo "🚀 빠른 배포 스크립트"
echo "===================="

# 1. Git 커밋 및 푸시
echo "📦 Git 커밋 중..."
git add .
git commit -m "fix: bookings_with_quiz 뷰 에러 해결 - 직접 테이블 사용으로 변경"
git push origin main

echo ""
echo "✅ 수정사항이 배포되었습니다!"
echo ""
echo "🔍 확인 방법:"
echo "1. Vercel 자동 배포 완료 대기 (3-5분)"
echo "2. 브라우저에서 새로고침 (Ctrl+F5)"
echo "3. 확인 URL: https://win.masgolf.co.kr/marketing-enhanced"
echo ""
echo "💡 로컬에서 테스트하려면:"
echo "npm run dev"
echo ""
echo "📱 배포 상태 확인:"
echo "https://vercel.com/dashboard"
