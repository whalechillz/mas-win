#!/bin/bash
# Vercel 빌드 에러 수정 스크립트

echo "🔧 Vercel 빌드 에러 수정 중..."

# 옵션 1: 문제 파일들을 예제 파일로 변경
if [ -f "pages/api/generate-seo-content.ts" ]; then
    mv pages/api/generate-seo-content.ts pages/api/generate-seo-content.ts.example
    echo "✅ generate-seo-content.ts → .example로 변경"
fi

if [ -f "pages/api/generate-ai-content.ts" ]; then
    mv pages/api/generate-ai-content.ts pages/api/generate-ai-content.ts.example
    echo "✅ generate-ai-content.ts → .example로 변경"
fi

if [ -f "pages/api/generate-ai-content-v2.ts" ]; then
    mv pages/api/generate-ai-content-v2.ts pages/api/generate-ai-content-v2.ts.example
    echo "✅ generate-ai-content-v2.ts → .example로 변경"
fi

if [ -f "pages/api/generate-multichannel-content.ts" ]; then
    mv pages/api/generate-multichannel-content.ts pages/api/generate-multichannel-content.ts.example
    echo "✅ generate-multichannel-content.ts → .example로 변경"
fi

echo "✨ 완료! 이제 다시 배포해보세요."
echo ""
echo "📌 나중에 AI 기능을 사용하려면:"
echo "1. npm install @anthropic-ai/sdk"
echo "2. 파일명에서 .example 제거"
