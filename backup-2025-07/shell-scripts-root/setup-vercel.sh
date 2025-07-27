#!/bin/bash

echo "🚀 Vercel 환경 변수 설정 스크립트"

# Supabase 설정
vercel env add NEXT_PUBLIC_SUPABASE_URL production
echo "https://yyytjudftrvpmcnppaymw.supabase.co 입력하세요"

vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production
echo "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl5eXRqdWRmdHZwbWNucHBheW13Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE0NDcxMTksImV4cCI6MjA2NzAyMzExOX0.TxT-vnDjFip_CCL7Ag8mR7G59dMdQAKfPLY1S3TJqRE 입력하세요"

vercel env add SLACK_WEBHOOK_URL production
echo "임시로 'test' 입력하세요"

echo "✅ 환경 변수 설정 완료"
echo "🔄 재배포 중..."
vercel --prod