#!/bin/bash

echo "🚀 Vercel 환경변수 자동 설정 스크립트"

# 환경변수를 자동으로 설정
echo "NEXT_PUBLIC_SUPABASE_URL=https://yyytjudftrvpmcnppaymw.supabase.co" | vercel env add NEXT_PUBLIC_SUPABASE_URL production
echo "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl5eXRqdWRmdHZwbWNucHBheW13Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE0NDcxMTksImV4cCI6MjA2NzAyMzExOX0.TxT-vnDjFip_CCL7Ag8mR7G59dMdQAKfPLY1S3TJqRE" | vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production
echo "https://hooks.slack.com/services/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" | vercel env add SLACK_WEBHOOK_URL production

echo "✅ 환경변수 설정 완료"

# 환경변수 확인
echo "📋 설정된 환경변수:"
vercel env ls

echo "🔄 재배포를 시작하시겠습니까? (y/n)"
read -r response
if [[ "$response" == "y" ]]; then
    vercel --prod
fi
