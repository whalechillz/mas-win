#!/bin/bash

echo "🚀 MASGOLF 전체 데이터 관리 시스템 적용 중..."
echo ""

# 1. 백업 생성
echo "📦 기존 파일 백업 중..."
cp pages/admin.tsx "pages/admin-backup-$(date +%Y%m%d-%H%M%S).tsx"
cp -r components/admin/bookings "components/admin/bookings-backup-$(date +%Y%m%d-%H%M%S)" 2>/dev/null || true

# 2. 새 버전 적용
echo "🔄 새로운 관리 시스템 적용 중..."
cp pages/admin-realtime.tsx pages/admin.tsx

# 3. 성공 메시지
echo ""
echo "✅ 완료! 다음 단계를 진행하세요:"
echo ""
echo "1️⃣  Supabase SQL Editor에서 스키마 업데이트:"
echo "    👉 /docs/FULL_DATA_SCHEMA_UPDATE.md 파일의 SQL 실행"
echo ""
echo "2️⃣  로컬에서 테스트:"
echo "    npm run dev"
echo ""
echo "3️⃣  배포:"
echo "    git add ."
echo "    git commit -m 'feat: 전체 데이터 관리 시스템 구현'"
echo "    git push"
echo ""
echo "📊 새로운 기능:"
echo "  - 퀴즈 결과 표시 (스윙 스타일, 우선순위, 거리)"
echo "  - 고객 스타일 분석 차트"
echo "  - 통화 시간대 분석"
echo "  - 캠페인 성과 대시보드"
echo "  - AI 인사이트"
echo ""
echo "🎉 모든 데이터가 이제 관리자 대시보드에 표시됩니다!"
