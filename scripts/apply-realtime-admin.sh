#!/bin/bash
# 실시간 데이터 연동 admin 페이지 적용 스크립트

# 백업 생성
echo "📦 기존 admin.tsx 백업 중..."
cp pages/admin.tsx "pages/admin-backup-$(date +%Y%m%d-%H%M%S).tsx"

# 새 버전 적용
echo "🚀 실시간 데이터 연동 버전 적용 중..."
cp pages/admin-realtime.tsx pages/admin.tsx

echo "✅ 완료! 이제 실시간 데이터가 연동됩니다."
echo ""
echo "🔍 로컬에서 테스트하려면:"
echo "   npm run dev"
echo ""
echo "📤 배포하려면:"
echo "   git add ."
echo "   git commit -m 'feat: 실시간 캠페인 데이터 연동 구현'"
echo "   git push"
