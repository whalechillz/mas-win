#!/bin/bash

# Vercel 환경 변수 업데이트 스크립트
echo "🚀 Vercel 환경 변수 업데이트 스크립트"
echo "=================================="

# .env.local 파일에서 환경 변수 읽기
if [ ! -f ".env.local" ]; then
    echo "❌ .env.local 파일을 찾을 수 없습니다."
    exit 1
fi

echo "📋 업데이트할 환경 변수들:"
echo ""

# 주요 API 키들 추출
OPENAI_KEY=$(grep "OPENAI_API_KEY" .env.local | cut -d'=' -f2)
ANTHROPIC_KEY=$(grep "ANTHROPIC_API_KEY" .env.local | cut -d'=' -f2)
PERPLEXITY_KEY=$(grep "PERPLEXITY_API_KEY" .env.local | cut -d'=' -f2)
SUPABASE_URL=$(grep "NEXT_PUBLIC_SUPABASE_URL" .env.local | cut -d'=' -f2)
SUPABASE_SERVICE_KEY=$(grep "SUPABASE_SERVICE_ROLE_KEY" .env.local | cut -d'=' -f2)

echo "1. OpenAI API Key: ${OPENAI_KEY:0:20}..."
echo "2. Anthropic API Key: ${ANTHROPIC_KEY:0:20}..."
echo "3. Perplexity API Key: ${PERPLEXITY_KEY:0:20}..."
echo "4. Supabase URL: ${SUPABASE_URL:0:30}..."
echo "5. Supabase Service Key: ${SUPABASE_SERVICE_KEY:0:20}..."
echo ""

# Vercel CLI 설치 확인
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI가 설치되지 않았습니다."
    echo "설치 명령어: npm install -g vercel"
    exit 1
fi

echo "🔧 Vercel 환경 변수 업데이트 중..."
echo ""

# Production 환경 변수 업데이트
echo "📦 Production 환경 업데이트:"
vercel env add OPENAI_API_KEY production <<< "$OPENAI_KEY"
vercel env add ANTHROPIC_API_KEY production <<< "$ANTHROPIC_KEY"
vercel env add PERPLEXITY_API_KEY production <<< "$PERPLEXITY_KEY"
vercel env add NEXT_PUBLIC_SUPABASE_URL production <<< "$SUPABASE_URL"
vercel env add SUPABASE_SERVICE_ROLE_KEY production <<< "$SUPABASE_SERVICE_KEY"

echo ""
echo "🔧 Preview 환경 업데이트:"
vercel env add OPENAI_API_KEY preview <<< "$OPENAI_KEY"
vercel env add ANTHROPIC_API_KEY preview <<< "$ANTHROPIC_KEY"
vercel env add PERPLEXITY_API_KEY preview <<< "$PERPLEXITY_KEY"
vercel env add NEXT_PUBLIC_SUPABASE_URL preview <<< "$SUPABASE_URL"
vercel env add SUPABASE_SERVICE_ROLE_KEY preview <<< "$SUPABASE_SERVICE_KEY"

echo ""
echo "🛠️ Development 환경 업데이트:"
vercel env add OPENAI_API_KEY development <<< "$OPENAI_KEY"
vercel env add ANTHROPIC_API_KEY development <<< "$ANTHROPIC_KEY"
vercel env add PERPLEXITY_API_KEY development <<< "$PERPLEXITY_KEY"
vercel env add NEXT_PUBLIC_SUPABASE_URL development <<< "$SUPABASE_URL"
vercel env add SUPABASE_SERVICE_ROLE_KEY development <<< "$SUPABASE_SERVICE_KEY"

echo ""
echo "✅ 모든 환경 변수가 업데이트되었습니다!"
echo ""
echo "📋 다음 단계:"
echo "1. vercel --prod 로 프로덕션 배포"
echo "2. vercel env ls 로 환경 변수 확인"
echo "3. 각 환경에서 API 테스트"
