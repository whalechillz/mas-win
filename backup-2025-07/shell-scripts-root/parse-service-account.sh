#!/bin/bash

echo "🔧 Service Account JSON 파일 파서"
echo "================================="
echo ""

# JSON 파일 찾기
JSON_FILE=$(find ~/Downloads -name "*.json" -type f -exec grep -l "client_email" {} \; | head -1)

if [ -z "$JSON_FILE" ]; then
    echo "❌ Downloads 폴더에서 Service Account JSON 파일을 찾을 수 없습니다."
    echo "   다른 위치에 있다면 직접 경로를 입력하세요:"
    read -p "   JSON 파일 경로: " JSON_FILE
fi

if [ -f "$JSON_FILE" ]; then
    echo "✅ JSON 파일 발견: $JSON_FILE"
    echo ""
    echo "📋 .env.local에 추가할 내용:"
    echo "================================="
    
    # client_email 추출
    CLIENT_EMAIL=$(grep -o '"client_email": "[^"]*"' "$JSON_FILE" | cut -d'"' -f4)
    echo "GOOGLE_SERVICE_ACCOUNT_EMAIL=$CLIENT_EMAIL"
    echo ""
    
    # private_key 추출 (전체 내용 포함)
    echo "GOOGLE_SERVICE_ACCOUNT_KEY=\"$(grep -o '"private_key": "[^"]*"' "$JSON_FILE" | cut -d'"' -f4)\""
    echo ""
    echo "================================="
    echo ""
    echo "✅ 위 내용을 .env.local 파일에 복사하세요."
    echo ""
    echo "📝 .env.local 파일 열기:"
    echo "   code .env.local"
    echo "   또는"
    echo "   nano .env.local"
else
    echo "❌ JSON 파일을 찾을 수 없습니다."
fi
