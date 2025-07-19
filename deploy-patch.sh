#!/bin/bash

echo "🔧 마케팅 대시보드 버그 패치"
echo "=========================="

# 1. 테스트 페이지 안내
echo ""
echo "📋 사용 가능한 테스트 페이지:"
echo ""
echo "1️⃣ 심플 버전 (정적 UI만)"
echo "   http://localhost:3000/marketing-simple"
echo ""
echo "2️⃣ 테스트 버전 (기본 기능)"
echo "   http://localhost:3000/marketing-test"
echo ""
echo "3️⃣ 디버그 버전 (컴포넌트별 테스트)"
echo "   http://localhost:3000/marketing-debug"
echo ""
echo "4️⃣ 수정된 버전 (안정화)"
echo "   http://localhost:3000/marketing-fixed"
echo ""
echo "5️⃣ 원본 버전 (문제 있음)"
echo "   http://localhost:3000/marketing-enhanced"
echo ""

# 2. Git 커밋 및 푸시
echo "📤 변경사항 배포 중..."
git add .
git commit -m "feat: 마케팅 대시보드 버그 패치 - 여러 테스트 페이지 추가"
git push origin main

echo ""
echo "✅ 배포 완료!"
echo ""
echo "🚀 로컬 테스트:"
echo "npm run dev"
echo ""
echo "🌐 배포된 페이지들 (3-5분 후):"
echo "- https://win.masgolf.co.kr/marketing-simple"
echo "- https://win.masgolf.co.kr/marketing-test"
echo "- https://win.masgolf.co.kr/marketing-debug"
echo "- https://win.masgolf.co.kr/marketing-fixed"
echo ""
echo "💡 추천: marketing-fixed 페이지를 먼저 확인해보세요!"
