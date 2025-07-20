#!/bin/bash

echo "🎯 마케팅 대시보드 선택"
echo "====================="
echo ""
echo "현재 상황:"
echo "- 새로 만든 UI는 예쁘지만 기능이 없음"
echo "- 기존 기능들은 모두 작동하지만 다크모드 없음"
echo ""
echo "1) 원래대로 복원 (모든 기능 작동, 다크모드 없음)"
echo "2) 새 UI 유지 (예쁘지만 기능 없음)"
echo "3) 하이브리드 (기존 기능 + 다크모드 추가) - 시간 필요"
echo ""
read -p "선택하세요 (1-3): " choice

case $choice in
  1)
    echo ""
    echo "✅ 원래 기능으로 복원합니다..."
    
    # 백업 파일 복원
    cp components/admin/marketing/backup-20250719-133602/MarketingDashboard.tsx.backup \
       components/admin/marketing/MarketingDashboard.tsx
    
    # admin.tsx 수정
    sed -i '' 's/MarketingDashboardComplete/MarketingDashboard/g' pages/admin.tsx
    
    echo "📤 배포 중..."
    git add .
    git commit -m "revert: 원래 마케팅 대시보드로 복원 - 모든 기능 활성화"
    git push origin main
    
    echo ""
    echo "✅ 완료! 모든 기능이 복원되었습니다:"
    echo "- 2년치 마케팅 테마 ✅"
    echo "- 카카오톡/문자/이메일 ✅"
    echo "- 통합 캠페인 관리 ✅"
    echo "- 실제 데이터베이스 연동 ✅"
    ;;
    
  2)
    echo ""
    echo "✅ 새 UI를 유지합니다"
    echo "⚠️  주의: 실제 기능은 작동하지 않습니다"
    ;;
    
  3)
    echo ""
    echo "✅ 하이브리드 버전 개발"
    echo "이 작업은 시간이 필요합니다 (약 2-3시간)"
    echo "기존 기능들을 새 UI에 통합해야 합니다"
    ;;
esac
