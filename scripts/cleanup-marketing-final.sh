#!/bin/bash
# chmod +x cleanup-marketing-final.sh 로 실행 권한을 부여하세요

# 마케팅 대시보드 최종 정리 스크립트
# 실행 전 백업을 권장합니다

MARKETING_DIR="/Users/m2/MASLABS/win.masgolf.co.kr/components/admin/marketing"
BACKUP_DIR="$MARKETING_DIR/backup-$(date +%Y%m%d-%H%M%S)"

echo "=== 마케팅 대시보드 최종 정리 ==="
echo "백업 디렉토리 생성 중..."
mkdir -p "$BACKUP_DIR"

# Fixed 파일들을 정식 버전으로 교체
echo "Fixed 파일들을 정식 버전으로 교체 중..."

# BlogCalendar
if [ -f "$MARKETING_DIR/BlogCalendarFixed.tsx" ]; then
    cp "$MARKETING_DIR/BlogCalendar.tsx" "$BACKUP_DIR/BlogCalendar.tsx.backup" 2>/dev/null
    cp "$MARKETING_DIR/BlogCalendarFixed.tsx" "$MARKETING_DIR/BlogCalendar.tsx"
    echo "✓ BlogCalendar.tsx 업데이트 완료"
fi

# MarketingFunnelPlan
if [ -f "$MARKETING_DIR/MarketingFunnelPlanFixed.tsx" ]; then
    cp "$MARKETING_DIR/MarketingFunnelPlan.tsx" "$BACKUP_DIR/MarketingFunnelPlan.tsx.backup" 2>/dev/null
    cp "$MARKETING_DIR/MarketingFunnelPlanFixed.tsx" "$MARKETING_DIR/MarketingFunnelPlan.tsx"
    echo "✓ MarketingFunnelPlan.tsx 업데이트 완료"
fi

# 최종 버전 설정
echo -e "\n최종 버전 파일 설정 중..."
if [ -f "$MARKETING_DIR/MarketingDashboardEnhancedFinal.tsx" ]; then
    cp "$MARKETING_DIR/MarketingDashboard.tsx" "$BACKUP_DIR/MarketingDashboard.tsx.backup" 2>/dev/null
    cp "$MARKETING_DIR/MarketingDashboardEnhancedFinal.tsx" "$MARKETING_DIR/MarketingDashboard.tsx"
    echo "✓ MarketingDashboard.tsx 최종 버전으로 업데이트"
fi

# 중복 파일 정리
echo -e "\n중복 파일 정리 중..."

# 이전 버전 파일들 백업 후 삭제
OLD_FILES=(
    "BlogCalendar-fixed.tsx"
    "BlogCalendarFixed.tsx"
    "MarketingFunnelPlanFixed.tsx"
    "IntegratedCampaignManager-fixed.tsx"
    "IntegratedCampaignManager-fullYear.tsx"
    "IntegratedCampaignManager-v2.tsx"
    "IntegratedCampaignManagerFixed.tsx"
    "MarketingDashboard-updated.tsx"
    "MarketingDashboardNew.tsx"
    "MarketingDashboardRenewed.tsx"
    "MarketingDashboardEnhanced.tsx"
    "MultiChannelManager-hard-delete-option.tsx"
    "MultiChannelManager-soft-delete.tsx"
    "UnifiedMultiChannelManagerFixed.tsx"
    "dashboard-stats-fix.tsx"
    "soft-delete-example.tsx"
)

for file in "${OLD_FILES[@]}"; do
    if [ -f "$MARKETING_DIR/$file" ]; then
        mv "$MARKETING_DIR/$file" "$BACKUP_DIR/"
        echo "✓ $file 백업 및 제거"
    fi
done

# framer-motion 패키지 설치 확인
echo -e "\n패키지 의존성 확인 중..."
cd /Users/m2/MASLABS/win.masgolf.co.kr
if ! npm list framer-motion >/dev/null 2>&1; then
    echo "⚠️  framer-motion이 설치되어 있지 않습니다!"
    echo "다음 명령어를 실행하세요: npm install framer-motion"
else
    echo "✓ framer-motion 패키지 확인됨"
fi

# 정리 결과 요약
echo -e "\n=== 정리 완료 ==="
echo "백업 위치: $BACKUP_DIR"
echo "남은 파일 수: $(ls -1 "$MARKETING_DIR"/*.tsx 2>/dev/null | wc -l)"
echo ""
echo "다음 단계:"
echo "1. npm install framer-motion (필요시)"
echo "2. npm run build"
echo "3. npm run dev로 테스트"
echo ""
echo "정리된 파일들은 백업 디렉토리에 보관되었습니다."