#!/bin/bash

# 로컬 서버에서 Playwright 테스트 실행 스크립트

echo "🎭 로컬 서버 Playwright 테스트"
echo ""

# 로컬 서버가 실행 중인지 확인
check_server() {
    if curl -s http://localhost:3000 > /dev/null 2>&1; then
        return 0
    else
        return 1
    fi
}

# 서버가 실행 중이 아니면 시작
if ! check_server; then
    echo "📦 로컬 서버를 시작합니다..."
    echo "   (백그라운드에서 실행됩니다. 종료하려면 'pkill -f \"next dev\"'를 실행하세요)"
    echo ""
    
    # 백그라운드에서 서버 시작
    npm run dev > /tmp/next-server.log 2>&1 &
    SERVER_PID=$!
    
    echo "⏳ 서버 시작 대기 중..."
    for i in {1..30}; do
        sleep 2
        if check_server; then
            echo "✅ 로컬 서버 시작 완료! (PID: $SERVER_PID)"
            echo ""
            break
        fi
        if [ $i -eq 30 ]; then
            echo "❌ 서버 시작 시간 초과 (60초)"
            kill $SERVER_PID 2>/dev/null
            exit 1
        fi
    done
else
    echo "✅ 로컬 서버가 이미 실행 중입니다."
    echo ""
fi

# Playwright 테스트 실행
echo "🧪 Playwright 테스트 시작..."
echo ""
node playwright-blog-image-check.js

# 테스트 종료 후 서버 종료 여부 확인
echo ""
read -p "로컬 서버를 종료하시겠습니까? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    if [ ! -z "$SERVER_PID" ]; then
        kill $SERVER_PID 2>/dev/null
        echo "✅ 서버 종료됨"
    else
        echo "ℹ️  서버는 다른 프로세스에서 실행 중입니다."
    fi
fi



