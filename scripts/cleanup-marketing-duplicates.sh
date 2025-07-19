#!/bin/bash
# chmod +x cleanup-marketing-duplicates.sh 로 실행 권한을 부여하세요

# 마케팅 대시보드 중복 파일 정리 스크립트
# 실행 전 백업을 권장합니다

MARKETING_DIR="/Users/m2/MASLABS/win.masgolf.co.kr/components/admin/marketing"
BACKUP_DIR="$MARKETING_DIR/backup-$(date +%Y%m%d-%H%M%S)"

echo "=== 마케팅 대시보드 중복 파일 정리 ==="
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

# 새로운 대시보드를 메인으로 설정
echo -e "\n대시보드 파일 정리 중..."
if [ -f "$MARKETING_DIR/MarketingDashboardEnhanced.tsx" ]; then
    cp "$MARKETING_DIR/MarketingDashboard.tsx" "$BACKUP_DIR/MarketingDashboard.tsx.backup" 2>/dev/null
    cp "$MARKETING_DIR/MarketingDashboardEnhanced.tsx" "$MARKETING_DIR/MarketingDashboard.tsx"
    echo "✓ MarketingDashboard.tsx 업데이트 완료"
fi

# 불필요한 임시 파일 정리
echo -e "\n임시 파일 정리 중..."
find "$MARKETING_DIR" -name "*.tmp" -o -name "*.bak" -o -name "*~" | while read tmpfile; do
    rm -f "$tmpfile"
    echo "✓ 임시 파일 제거: $(basename "$tmpfile")"
done

# 정리 결과 요약
echo -e "\n=== 정리 완료 ==="
echo "백업 위치: $BACKUP_DIR"
echo "남은 파일 수: $(ls -1 "$MARKETING_DIR"/*.tsx 2>/dev/null | wc -l)"
echo "정리된 파일들은 백업 디렉토리에 보관되었습니다."

# 파일 목록 표시
echo -e "\n현재 마케팅 디렉토리 파일 목록:"
ls -la "$MARKETING_DIR"/*.tsx | awk '{print $9}' | xargs -n 1 basename | sort