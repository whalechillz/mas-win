#!/bin/bash

echo "🚀 7월 퍼널 최종 수정사항 배포 중..."

# 수정 스크립트 실행
chmod +x apply-july-funnel-final.sh
./apply-july-funnel-final.sh

# Git 커밋
echo ""
echo "💾 변경사항 저장 중..."
git add .
git commit -m "feat: 7월 퍼널 페이지 최종 UI/UX 개선

- 헤드 클로즈업 영역 제거
- 상세보기 버튼 제거로 CTA 간소화
- 비거리 예상 박스를 하단으로 재배치
- 제품별 상세 스펙 확대 (8가지 스펙 정보)
  - 페이스 두께, 반발계수, 헤드 체적, 샤프트
  - 로프트 각도, 라이 각도, 중량, 소재
- 마일드한 애니메이션 효과 유지"

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
echo "- https://win.masgolf.co.kr (메인)"
echo ""
echo "📊 추가된 상세 스펙:"
echo "- 로프트 각도: 9°~12° (모델별 상이)"
echo "- 라이 각도: 58.5°~60°"
echo "- 중량: 305g~315g"
echo "- 소재: 일본산 티타늄/프리미엄 티타늄"