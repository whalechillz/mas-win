#!/bin/bash

echo "🎯 현재 상태 체크리스트"
echo "================================="
echo ""
echo "✅ 완료된 항목:"
echo "  [✓] Supabase 테이블 생성"
echo "  [✓] GTM Container ID: GTM-WPBX97JG"
echo "  [✓] GA4 Measurement ID: G-SMJWL2TRM7"
echo "  [✓] GA4 Property ID: 497433231"
echo ""
echo "❌ 남은 작업:"
echo "  [ ] Google Service Account 생성"
echo "  [ ] .env.local 파일 업데이트"
echo "  [ ] HTML 파일에 추적 코드 추가"
echo "  [ ] 테스트 및 검증"
echo ""
echo "================================="
echo ""
echo "📋 현재 .env.local에 추가해야 할 내용:"
echo ""
cat << 'ENV_TEMPLATE'
# Supabase (이미 있음)
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# GA4 설정 (새로 추가)
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-SMJWL2TRM7
GA4_PROPERTY_ID=497433231

# Google Service Account (JSON 파일 생성 후 추가)
GOOGLE_SERVICE_ACCOUNT_EMAIL=여기에_client_email_입력
GOOGLE_SERVICE_ACCOUNT_KEY="여기에_private_key_전체_입력"
ENV_TEMPLATE
echo ""
echo "================================="
echo ""
echo "다음 단계 실행:"
echo "./next-steps-service-account.sh"
