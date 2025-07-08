#!/bin/bash

echo "🚀 7월 퍼널 수정사항 배포 중..."

# 수정 스크립트 실행
chmod +x apply-july-funnel-changes.sh
./apply-july-funnel-changes.sh

# Git 커밋
echo ""
echo "💾 변경사항 저장 중..."
git add .
git commit -m "feat: 7월 퍼널 페이지 UX/UI 개선

- 완벽한 스윙 문구 브랜드 컬러(노란색) 적용
- 영상보기 버튼 제거 및 스타일 찾기 버튼 디자인 통일
- MAS 고반발 드라이버로 문구 수정
- 제품 추천 영역 개선 (후킹 설명 추가, 비거리 박스 재배치)
- 비거리 입력값 자동 연동
- 스크롤 시 비교 애니메이션 자동 실행
- 비거리 증가 카운트업 애니메이션 추가"

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
echo "📸 헤드 클로즈업 영역 개선 제안:"
echo "1. 인터랙티브 요소 추가 (호버 시 상세 스펙)"
echo "2. 실제 타구음 재생 기능"
echo "3. 360도 회전 뷰 또는 줌 기능"
echo "4. 각 모델별 차이점 더 명확히 표시"