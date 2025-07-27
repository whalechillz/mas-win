#!/bin/bash

echo "🔧 빌드 오류 수정 중..."
echo "========================"
echo ""

# 1. recharts 설치
echo "📦 recharts 라이브러리 설치 중..."
npm install recharts --legacy-peer-deps

# 2. 빌드 테스트
echo ""
echo "🏗️ 빌드 테스트 중..."
npm run build

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ 빌드 성공!"
    echo ""
    echo "다음 명령어로 Vercel에 배포하세요:"
    echo "vercel --prod"
else
    echo ""
    echo "❌ 빌드 실패. 오류를 확인하세요."
fi