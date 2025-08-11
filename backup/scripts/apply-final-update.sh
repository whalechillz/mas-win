#!/bin/bash

echo "🚀 MASGOLF 관리자 대시보드 최종 업데이트"
echo ""

# 백업
echo "📦 백업 중..."
cp pages/admin.tsx "pages/admin-backup-$(date +%Y%m%d-%H%M%S).tsx"

# 적용
echo "✨ 새 버전 적용 중..."
cp pages/admin-realtime.tsx pages/admin.tsx

echo ""
echo "✅ 완료!"
echo ""
echo "🔥 다음 단계:"
echo ""
echo "1️⃣  Supabase에서 quiz_results 테이블 삭제:"
echo "    DROP TABLE IF EXISTS quiz_results CASCADE;"
echo ""
echo "2️⃣  로컬 테스트:"
echo "    npm run dev"
echo ""
echo "3️⃣  배포:"
echo "    git add . && git commit -m 'fix: DB 구조 정리 및 관리자 대시보드 최적화' && git push"
echo ""
echo "📊 이제 모든 데이터가 관리자 대시보드에 표시됩니다!"
echo "  - 퀴즈 결과 (스윙 스타일, 우선순위, 거리)"
echo "  - 고객 스타일 분석 차트"
echo "  - 통화 시간대 분석"
echo "  - 실시간 업데이트"
