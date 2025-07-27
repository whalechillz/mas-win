#!/bin/bash

echo "🔍 멀티채널 생성 문제 진단 중..."

# 1. API 파일 확인
echo ""
echo "1. API 파일 확인:"
if [ -f "pages/api/generate-multichannel-content.ts" ]; then
    echo "✅ generate-multichannel-content.ts 존재"
else
    echo "❌ generate-multichannel-content.ts 없음"
fi

# 2. 환경 변수 확인
echo ""
echo "2. 환경 변수 확인:"
if [ -f ".env.local" ]; then
    echo "✅ .env.local 파일 존재"
    if grep -q "SUPABASE_SERVICE_ROLE_KEY" .env.local; then
        echo "✅ SUPABASE_SERVICE_ROLE_KEY 설정됨"
    else
        echo "❌ SUPABASE_SERVICE_ROLE_KEY 없음"
    fi
else
    echo "❌ .env.local 파일 없음"
fi

# 3. 안전한 API 생성
echo ""
echo "3. 안전한 API 버전 준비:"
if [ -f "pages/api/generate-multichannel-content-safe.ts" ]; then
    echo "✅ 안전한 버전이 준비되어 있습니다"
    echo ""
    echo "적용하려면 다음 명령을 실행하세요:"
    echo "cp pages/api/generate-multichannel-content.ts pages/api/generate-multichannel-content.backup.ts"
    echo "cp pages/api/generate-multichannel-content-safe.ts pages/api/generate-multichannel-content.ts"
else
    echo "⚠️  안전한 버전이 없습니다"
fi

# 4. SQL 파일 확인
echo ""
echo "4. SQL 함수 파일 확인:"
if [ -f "database/generate-monthly-content-selective.sql" ]; then
    echo "✅ SQL 함수 파일 존재"
    echo "   Supabase SQL Editor에서 이 파일을 실행하세요"
else
    echo "❌ SQL 함수 파일 없음"
fi

echo ""
echo "📋 권장 조치:"
echo "1. Supabase SQL Editor에서 함수 생성 확인"
echo "2. 안전한 API 버전으로 교체"
echo "3. 서버 재시작 (npm run dev)"
echo "4. 브라우저 캐시 삭제 후 테스트"