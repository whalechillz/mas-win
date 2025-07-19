#!/bin/bash

echo "🏃 빠른 로컬 테스트"
echo "=================="

# 로컬 개발 서버만 재시작
echo "🔄 서버 재시작 중..."
# 기존 프로세스 종료
pkill -f "next dev" 2>/dev/null || true

# 새로 시작
npm run dev &

echo ""
echo "✅ 로컬 서버가 시작되었습니다!"
echo ""
echo "🌐 브라우저에서 확인:"
echo "http://localhost:3000/marketing-enhanced"
echo ""
echo "💡 Ctrl+C로 종료할 수 있습니다."
