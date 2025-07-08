#!/bin/bash

echo "🚀 MASGOLF 전문가 수준 관리자 대시보드 배포 시작..."

# Git 추가 및 커밋
git add pages/admin.tsx
git commit -m "feat: 세계적 수준의 전문 관리자 대시보드 구현

- 현대적이고 직관적인 UI/UX 디자인
- 실시간 통계 및 데이터 시각화
- 고급 필터링 및 검색 기능
- CSV 내보내기 기능
- 반응형 디자인
- 상태 관리 개선"

# Vercel로 배포
echo "📦 Vercel로 배포 중..."
vercel --prod

echo "✅ 배포 완료!"
echo "🌐 접속 URL: https://win.masgolf.co.kr/admin"
echo ""
echo "주요 기능:"
echo "- 대시보드: 실시간 통계 및 최근 활동"
echo "- 시타 예약: 예약 관리 및 필터링"
echo "- 문의 관리: 고객 문의 추적 및 상태 관리"
echo "- CSV 내보내기: 데이터 다운로드"