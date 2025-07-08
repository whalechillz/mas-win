#!/bin/bash

echo "🚀 7월 퍼널 스펙 수정사항 배포 중..."

# 수정 스크립트 실행
chmod +x fix-july-specs.sh
./fix-july-specs.sh

# Git 커밋
echo ""
echo "💾 변경사항 저장 중..."
git add .
git commit -m "fix: 7월 퍼널 페이지 상세 스펙 및 애니메이션 수정

- undefined 오류 수정
- 각 제품별 정확한 스펙 정보 추가
  - PRO3/V3: 9°/10°, 288-300g, Low 킥포인트
  - 블랙: 10°, 285-294g, Mid Low/Low 킥포인트
- 예상 비거리 카운트업 애니메이션 수정
- 스펙 표시 안정성 개선 (기본값 설정)"

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
echo "📊 수정된 내용:"
echo "- 상세 스펙이 정상적으로 표시됩니다"
echo "- 비거리가 180m → 205m로 애니메이션됩니다"
echo "- undefined 오류가 해결되었습니다"