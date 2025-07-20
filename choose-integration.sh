#!/bin/bash

echo "🎯 마케팅 대시보드 통합 방식 선택"
echo "================================"
echo ""
echo "1) 어드민 페이지에 통합 (마케팅 탭에서 바로 사용)"
echo "2) 별도 페이지로 유지 (링크로 연결)"
echo "3) 전체 어드민에 다크모드 추가 (시간 소요)"
echo ""
read -p "선택하세요 (1-3): " choice

case $choice in
  1)
    echo ""
    echo "✅ 옵션 1: 어드민 페이지에 통합"
    echo "이미 수정이 완료되었습니다!"
    echo ""
    echo "📤 배포 중..."
    git add .
    git commit -m "feat: 마케팅 대시보드를 어드민 페이지에 통합"
    git push origin main
    echo ""
    echo "✅ 완료! /admin 페이지의 마케팅 탭에서 사용할 수 있습니다."
    ;;
    
  2)
    echo ""
    echo "✅ 옵션 2: 별도 페이지로 유지"
    echo "MarketingDashboardLink 컴포넌트로 변경 중..."
    
    # admin.tsx 수정
    cat > /tmp/admin_marketing_import.txt << 'EOF'
// MarketingDashboard를 dynamic import로 변경
const MarketingDashboard = dynamic(
  () => import('../components/admin/marketing/MarketingDashboardLink'),
  { 
    ssr: false,
    loading: () => <div className="p-8 text-center">마케팅 대시보드 로딩 중...</div>
  }
);
EOF
    
    echo ""
    echo "📤 배포 중..."
    git add .
    git commit -m "feat: 마케팅 대시보드를 별도 페이지로 분리"
    git push origin main
    echo ""
    echo "✅ 완료!"
    echo "- 어드민: /admin (마케팅 탭에서 링크 제공)"
    echo "- 마케팅 대시보드: /marketing-enhanced"
    ;;
    
  3)
    echo ""
    echo "✅ 옵션 3: 전체 어드민에 다크모드 추가"
    echo "이 작업은 시간이 걸립니다. 나중에 구현하시겠습니까?"
    echo ""
    echo "현재는 옵션 1 또는 2를 선택하는 것을 추천합니다."
    ;;
    
  *)
    echo "잘못된 선택입니다."
    ;;
esac

echo ""
echo "🌐 확인 방법:"
echo "로컬: http://localhost:3000/admin"
echo "배포: https://win.masgolf.co.kr/admin (3-5분 후)"
