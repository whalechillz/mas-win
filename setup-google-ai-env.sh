#!/bin/bash

# Google AI API 환경 변수 설정 스크립트

echo "🚀 Google AI API 환경 변수 설정"
echo "=================================="

# .env.local 파일 확인
if [ ! -f ".env.local" ]; then
    echo "📝 .env.local 파일을 생성합니다..."
    touch .env.local
fi

# Google AI API 키 입력
echo ""
echo "Google AI API 키를 입력하세요:"
echo "(https://aistudio.google.com/ 에서 발급받은 API 키)"
read -p "API Key: " GOOGLE_AI_API_KEY

if [ -z "$GOOGLE_AI_API_KEY" ]; then
    echo "❌ API 키가 입력되지 않았습니다."
    exit 1
fi

# .env.local에 추가
echo ""
echo "📝 .env.local 파일에 Google AI API 키를 추가합니다..."

# 기존 GOOGLE_AI_API_KEY 라인 제거
sed -i '' '/GOOGLE_AI_API_KEY/d' .env.local

# 새로운 API 키 추가
echo "GOOGLE_AI_API_KEY=$GOOGLE_AI_API_KEY" >> .env.local

echo "✅ Google AI API 키가 성공적으로 설정되었습니다!"
echo ""
echo "🔧 설정된 내용:"
echo "GOOGLE_AI_API_KEY=$GOOGLE_AI_API_KEY"
echo ""
echo "📋 다음 단계:"
echo "1. 개발 서버 재시작: npm run dev"
echo "2. 블로그 마이그레이션 탭에서 테스트"
echo "3. Vercel 배포 시 환경 변수 설정"
echo ""
echo "⚠️  주의사항:"
echo "- API 키를 공개 저장소에 커밋하지 마세요"
echo "- .env.local 파일은 .gitignore에 포함되어 있습니다"
echo "- Vercel 배포 시 별도로 환경 변수를 설정해야 합니다"
