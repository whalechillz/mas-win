#!/bin/bash

# 스크립트 실행 권한 부여
chmod +x deploy-integrated-marketing.sh
chmod +x get-service-role-key.sh
chmod +x fix-debug-tracking.sh
chmod +x fix-build-errors.sh
chmod +x fix-supabase-now.sh
chmod +x fix-ga-domain.sh
chmod +x setup-ga4-realtime.sh
chmod +x ga4-debug-info.sh
chmod +x setup-ga4-service-account.sh

echo "✅ 배포 스크립트 실행 권한 부여 완료"
echo ""
echo "다음 명령어로 배포를 시작하세요:"
echo "./deploy-integrated-marketing.sh"
echo ""
echo "또는 수동으로 진행하려면:"
echo "1. npm install --legacy-peer-deps"
echo "2. npm run build"
echo "3. vercel --prod"