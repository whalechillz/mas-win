#!/bin/bash

echo "🎉 마케팅 대시보드 버그 수정 완료!"
echo "================================"

# Git 커밋 및 푸시
echo ""
echo "📤 변경사항 배포 중..."
git add .
git commit -m "fix: 마케팅 대시보드 완전 수정 - 간단한 컴포넌트로 교체"
git push origin main

echo ""
echo "✅ 수정 완료!"
echo ""
echo "🌐 확인할 수 있는 페이지들:"
echo ""
echo "1. 메인 페이지 (수정됨): http://localhost:3000/marketing-enhanced"
echo "2. 디버그 페이지: http://localhost:3000/marketing-debug"
echo "3. 작동 확인 페이지: http://localhost:3000/marketing-working"
echo ""
echo "🚀 배포 URL (3-5분 후):"
echo "https://win.masgolf.co.kr/marketing-enhanced"
echo ""
echo "💡 브라우저 캐시를 지우려면: Ctrl+Shift+R"
echo ""
echo "🔄 로컬 테스트:"
echo "npm run dev"
