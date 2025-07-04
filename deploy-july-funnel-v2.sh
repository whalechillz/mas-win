#!/bin/bash

echo "🚀 7월 퍼널 추가 수정사항 배포 중..."

# 수정 스크립트 실행
chmod +x apply-july-funnel-changes-v2.sh
./apply-july-funnel-changes-v2.sh

# Git 커밋
echo ""
echo "💾 변경사항 저장 중..."
git add .
git commit -m "feat: 7월 퍼널 페이지 UI 개선 및 콘텐츠 최적화

- 헤드 클로즈업 영역 제거 (불필요한 섹션 정리)
- 상세보기 버튼 제거 (CTA 간소화)
- 비거리 예상 박스를 하단으로 재배치
- 제품별 상세 스펙 추가 (페이스 두께, 반발계수, 헤드 체적, 샤프트)
- 마일드한 애니메이션 효과 추가 (펄스, 글로우, 라인 드로잉)"

# Vercel 배포
echo ""
echo "🚀 Vercel로 배포 중..."
vercel --prod

echo ""
echo "✅ 배포 완료!"
echo ""
echo "🌐 확인 URL:"
echo "- 수정된 7월 퍼널: https://win.masgolf.co.kr/funnel-2025-07"
echo "- 메인 사이트: https://win.masgolf.co.kr"
echo ""
echo "🎨 적용된 애니메이션 효과:"
echo "- 성공 펄스: 비거리 비교 시 부드러운 확대/축소 효과"
echo "- 글로우 효과: 붉은색 빛이 퍼지는 효과"
echo "- 라인 드로잉: 황금색 선이 그려지는 효과"
echo "- 카운트업: +25m가 0부터 올라가는 효과"