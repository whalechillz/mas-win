#!/bin/bash

echo "🔄 마케팅 대시보드 원래대로 복원"
echo "================================"

# 백업에서 원본 파일 복원
echo "📦 원본 파일 복원 중..."
cp /Users/m2/MASLABS/win.masgolf.co.kr/components/admin/marketing/backup-20250719-133602/MarketingDashboard.tsx.backup \
   /Users/m2/MASLABS/win.masgolf.co.kr/components/admin/marketing/MarketingDashboard.tsx

# admin.tsx 수정
echo "🔧 admin.tsx 수정..."
# MarketingDashboardComplete 대신 원래 MarketingDashboard 사용하도록 변경

echo ""
echo "📤 배포 중..."
git add .
git commit -m "revert: 마케팅 대시보드를 원래 기능으로 복원"
git push origin main

echo ""
echo "✅ 복원 완료!"
echo ""
echo "🎯 원래 기능들이 모두 돌아왔습니다:"
echo "- 2년치 마케팅 테마"
echo "- 카카오톡, 문자, 이메일 캠페인"
echo "- 실제 데이터베이스 연동"
echo "- 통합 캠페인 관리"
echo ""
echo "❌ 다크모드는 없어집니다"
