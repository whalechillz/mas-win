#!/bin/bash

echo "📋 환경변수 체크리스트"
echo "================================="
echo ""
echo "✅ .env.local 파일에 추가할 내용:"
echo ""
cat << 'ENV_COMPLETE'
# Supabase 설정 (기존 값 유지)
NEXT_PUBLIC_SUPABASE_URL=your_existing_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_existing_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_existing_service_role_key

# Google Analytics & Tag Manager (새로 추가)
NEXT_PUBLIC_GTM_ID=GTM-WPBX97JG
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-SMJWL2TRM7
GA4_PROPERTY_ID=497433231

# Google Service Account (JSON 파일 생성 후 추가)
GOOGLE_SERVICE_ACCOUNT_EMAIL=여기에_client_email_입력
GOOGLE_SERVICE_ACCOUNT_KEY="여기에_private_key_전체_입력"

# Slack (선택사항 - 기존 값 유지)
SLACK_WEBHOOK_URL=your_existing_slack_webhook_url
ENV_COMPLETE
echo ""
echo "================================="
echo ""
echo "⚠️  주의사항:"
echo "1. Supabase 설정은 기존 값을 그대로 유지하세요"
echo "2. Google Service Account는 JSON 파일 생성 후 추가"
echo "3. Slack은 사용하지 않으면 생략 가능"
echo ""
echo "📝 현재 .env.local 확인:"
echo "cat .env.local | grep -E 'SUPABASE|GA|GTM|GOOGLE'"
