#!/bin/bash

echo "🔧 최종 수정 스크립트"
echo "===================="

# 1. 캐시 완전 정리
echo "🧹 캐시 완전 정리..."
rm -rf .next
rm -rf node_modules/.cache

# 2. 개발 서버 재시작
echo "🔄 서버 재시작..."
pkill -f "next dev" 2>/dev/null || true
sleep 2

# 3. 새로 시작
echo "🚀 새 서버 시작..."
npm run dev &

sleep 5

echo ""
echo "✅ 완료!"
echo ""
echo "🌐 브라우저에서 확인:"
echo "1. http://localhost:3000/marketing-enhanced (메인)"
echo "2. http://localhost:3000/marketing-debug (디버그)"
echo ""
echo "💡 팁:"
echo "- 브라우저 강제 새로고침: Ctrl+Shift+R"
echo "- 시크릿 모드에서도 테스트해보세요"
echo "- F12 → Network 탭에서 실패한 요청이 있는지 확인"
