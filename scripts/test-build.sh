#!/bin/bash

echo "🔧 Next.js 빌드 테스트"
echo "===================="

# 1. 로컬 빌드 테스트
echo ""
echo "1️⃣ 로컬 빌드 시작..."
npm run build

# 2. 빌드 성공 시 로컬 서버 시작
if [ $? -eq 0 ]; then
    echo ""
    echo "✅ 빌드 성공!"
    echo "2️⃣ 로컬 서버 시작 (http://localhost:3000)"
    echo "Ctrl+C로 중단하세요."
    npm start
else
    echo ""
    echo "❌ 빌드 실패!"
    echo "위의 에러 메시지를 확인하세요."
fi
