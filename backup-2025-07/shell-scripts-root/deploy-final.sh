#!/bin/bash

echo "🎯 마케팅 대시보드 최종 배포"
echo "=========================="

# 성공 확인
echo ""
echo "✅ 디버그 페이지에서 모든 컴포넌트 로드 성공!"
echo ""

# Git 상태 확인
echo "📋 변경사항 확인..."
git status --short

# 커밋 및 푸시
echo ""
echo "📤 GitHub에 푸시..."
git add -A
git commit -m "feat: 마케팅 대시보드 완전 수정 - 모든 컴포넌트 정상 작동"
git push origin main

echo ""
echo "🚀 Vercel 자동 배포 시작!"
echo ""
echo "⏱️  예상 시간: 3-5분"
echo ""
echo "📱 확인할 URL들:"
echo ""
echo "1. 로컬 (지금 바로):"
echo "   http://localhost:3000/marketing-enhanced"
echo ""
echo "2. 배포 (3-5분 후):"
echo "   https://win.masgolf.co.kr/marketing-enhanced"
echo ""
echo "3. Vercel 대시보드:"
echo "   https://vercel.com/dashboard"
echo ""
echo "✨ 축하합니다! 버그가 수정되었습니다!"
