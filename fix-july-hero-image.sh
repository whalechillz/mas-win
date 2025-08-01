#!/bin/bash

# 7월 퍼널 이미지 경로 수정 스크립트

echo "=== 7월 퍼널 이미지 경로 수정 중... ==="

# HTML 파일 경로
HTML_FILE="/Users/m2/MASLABS/win.masgolf.co.kr/public/versions/funnel-2025-07-complete.html"

# 백업 생성
echo "1. 백업 생성 중..."
cp "$HTML_FILE" "$HTML_FILE.backup-hero-fix-$(date +%Y%m%d-%H%M%S)"

# 잘못된 경로 수정
echo "2. 이미지 경로 수정 중..."

# /assets/campaigns/ -> /campaigns/ 변경
sed -i '' 's|/assets/campaigns/|/campaigns/|g' "$HTML_FILE"

# 상대 경로도 절대 경로로 변경 (필요한 경우)
sed -i '' 's|"\.\./\.\./campaigns/|"/campaigns/|g' "$HTML_FILE"
sed -i '' 's|url(\.\./\.\./campaigns/|url(/campaigns/|g' "$HTML_FILE"

echo "3. 수정 완료!"

# 변경 사항 확인
echo ""
echo "=== 히어로 이미지 경로 확인 ==="
grep -n "hero-summer" "$HTML_FILE" | head -5

echo ""
echo "=== 배경 이미지 경로 확인 ==="
grep -n "background.*url.*campaigns" "$HTML_FILE" | head -5

echo ""
echo "수정이 완료되었습니다. 브라우저를 새로고침해주세요!"
echo ""
echo "문제가 지속되면 다음을 확인하세요:"
echo "1. 브라우저 캐시 삭제 (Cmd+Shift+R)"
echo "2. Next.js 캐시 삭제: rm -rf .next"
echo "3. 개발 서버 재시작: npm run dev"
