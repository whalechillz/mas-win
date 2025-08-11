#!/bin/bash

echo "🚀 더 자세히 보기 기능 배포 중..."

# 수정 스크립트 실행
chmod +x add-detail-view.sh
./add-detail-view.sh

# Git 커밋
echo ""
echo "💾 변경사항 저장 중..."
git add .
git commit -m "feat: 제품 상세 스펙 확장 기능 추가

- '더 자세히 보기' 토글 버튼 추가
- 기본 8개 스펙 + 추가 7개 스펙 (총 15개)
- 추가 스펙:
  - 가변형 밸런스 (D0, D1, D2, C9)
  - 샤프트 진동수 (202-240 cpm)
  - 맞춤 볼스피드 (48-62 m/s)
  - 탄성 그립 (35/45)
  - 최적의 길이 (45.75\")
  - 샤프트 플렉스 (R1/R2/S 스페셜 오더)
  - 소재 정보"

# Vercel 배포
echo ""
echo "🚀 Vercel로 배포 중..."
vercel --prod

echo ""
echo "✅ 배포 완료!"
echo ""
echo "🌐 확인 URL:"
echo "- https://win.masgolf.co.kr/funnel-2025-07"
echo "- https://win.masgolf.co.kr/campaign/2025-07"
echo ""
echo "📊 추가된 기능:"
echo "- 기본적으로 8개 주요 스펙 표시"
echo "- '더 자세히 보기' 클릭 시 7개 추가 스펙 표시"
echo "- 부드러운 확장/축소 애니메이션"
echo "- 아이콘 변경 (아래/위 화살표)"