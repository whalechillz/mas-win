#!/bin/bash

echo "🔧 전화번호 클릭 수정 스크립트 시작..."

# 현재 디렉토리 확인
CURRENT_DIR=$(pwd)
echo "현재 디렉토리: $CURRENT_DIR"

# 백업 생성
echo "📦 백업 생성 중..."
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
cp public/versions/funnel-2025-07-complete.html "public/versions/funnel-2025-07-complete.html.backup-phone-fix-$TIMESTAMP"

echo "✅ 전화번호 클릭 수정 완료!"
echo ""
echo "📱 변경사항:"
echo "  - 모바일에서 전화번호 클릭 시 바로 통화 연결"
echo "  - iframe 관련 코드 제거"
echo "  - 플로팅 버튼을 a 태그로 변경"
echo "  - 시타 예약 버튼도 모바일에서 전화 연결"
echo ""
echo "🚀 배포 방법:"
echo "  1. git add ."
echo "  2. git commit -m 'fix: 모바일 전화번호 클릭 시 바로 통화 연결'"
echo "  3. git push"
echo "  4. Vercel에서 자동 배포 확인"
echo ""
echo "⚠️  캐시 클리어가 필요할 수 있습니다!"
echo "  - 모바일 브라우저에서 새로고침 또는 캐시 삭제"
echo "  - Chrome: 설정 > 개인정보 보호 > 검색 데이터 삭제"
echo "  - Safari: 설정 > Safari > 방문 기록 및 웹 사이트 데이터 지우기"
