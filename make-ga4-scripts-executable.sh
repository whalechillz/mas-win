#!/bin/bash

# 실행 권한 부여
chmod +x check-ga4-info.sh
chmod +x parse-service-account.sh

echo "✅ 실행 권한 부여 완료!"
echo ""
echo "📋 사용 가능한 명령어:"
echo ""
echo "1. GA4 정보 확인 가이드:"
echo "   ./check-ga4-info.sh"
echo ""
echo "2. Service Account JSON 파서:"
echo "   ./parse-service-account.sh"
echo ""
echo "3. 현재 환경변수 확인:"
echo "   grep -E 'GA4_PROPERTY_ID|GOOGLE_SERVICE' .env.local"
