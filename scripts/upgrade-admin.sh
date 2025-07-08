#!/bin/bash
# 세계 최고의 마케팅 세일즈 관리자 대시보드 적용 스크립트

echo "🚀 MASGOLF Admin 업그레이드 시작..."
echo ""

# 1. 백업 생성
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
echo "📦 기존 파일 백업 중..."
cp /Users/m2/MASLABS/win.masgolf.co.kr/pages/admin.tsx /Users/m2/MASLABS/win.masgolf.co.kr/pages/admin.tsx.backup-$TIMESTAMP
echo "✅ 백업 완료: admin.tsx.backup-$TIMESTAMP"

# 2. 새 파일 적용 확인
echo ""
echo "🔄 새로운 관리자 페이지를 적용하시겠습니까?"
echo "  - 통합 캠페인 관리"
echo "  - 실시간 대시보드"
echo "  - 세계 최고 수준의 UX/UI"
echo ""
echo "주의: 현재 admin.tsx가 admin-new.tsx로 교체됩니다."
echo ""
read -p "계속하시겠습니까? (y/n): " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]
then
    # 3. 파일 교체
    echo ""
    echo "📝 파일 교체 중..."
    mv /Users/m2/MASLABS/win.masgolf.co.kr/pages/admin.tsx /Users/m2/MASLABS/win.masgolf.co.kr/pages/admin-old-$TIMESTAMP.tsx
    cp /Users/m2/MASLABS/win.masgolf.co.kr/pages/admin-new.tsx /Users/m2/MASLABS/win.masgolf.co.kr/pages/admin.tsx
    echo "✅ 새로운 관리자 페이지가 적용되었습니다!"
    
    echo ""
    echo "📊 다음 단계:"
    echo "1. npm run dev로 로컬에서 테스트"
    echo "2. Supabase에서 캠페인 테이블 생성 (선택사항)"
    echo "3. Vercel로 배포"
    
    echo ""
    echo "📚 참고 문서:"
    echo "- /docs/ADMIN_ARCHITECTURE.md - 아키텍처 설명"
    echo "- /docs/ADMIN_UPGRADE_SUMMARY.md - 업그레이드 요약"
    echo "- /docs/campaign-improvement/CAMPAIGN_IMPROVEMENT_PLAN.md - 개선 계획"
else
    echo ""
    echo "❌ 업그레이드가 취소되었습니다."
    echo "💡 나중에 다시 시도하려면 이 스크립트를 다시 실행하세요."
fi

echo ""
echo "✨ 세계 최고의 마케팅 팀을 위한 대시보드가 준비되었습니다!"
