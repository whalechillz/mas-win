#!/bin/bash

echo "🚀 마케팅 대시보드 로컬 테스트"
echo "============================"

# 프로세스 정리
echo "🧹 기존 프로세스 정리..."
pkill -f "next dev" 2>/dev/null || true

# 캐시 정리
echo "🗑️  캐시 정리..."
rm -rf .next
rm -rf node_modules/.cache

# 개발 서버 시작
echo "🔄 개발 서버 시작..."
npm run dev &

# 잠시 대기
sleep 5

echo ""
echo "✅ 서버가 시작되었습니다!"
echo ""
echo "🌐 브라우저에서 다음 페이지들을 확인하세요:"
echo ""
echo "1. 작동하는 버전: http://localhost:3000/marketing-working"
echo "2. 수정된 버전: http://localhost:3000/marketing-fixed"
echo "3. 디버그 버전: http://localhost:3000/marketing-debug"
echo "4. 테스트 버전: http://localhost:3000/marketing-test"
echo "5. 심플 버전: http://localhost:3000/marketing-simple"
echo ""
echo "💡 Ctrl+C로 서버를 종료할 수 있습니다."
echo ""
echo "🔍 콘솔 에러를 확인하려면:"
echo "브라우저에서 F12 → Console 탭을 확인하세요."
