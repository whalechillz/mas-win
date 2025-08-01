#!/bin/bash

echo "=== 7월 퍼널 이미지 경로 검증 ==="
echo ""

# HTML 파일 경로
HTML_FILE="public/versions/funnel-2025-07-complete.html"

# 잘못된 경로 찾기
echo "❌ 잘못된 /assets/campaigns/ 경로:"
grep -n "/assets/campaigns/" "$HTML_FILE" | head -20

echo ""
echo "✅ 올바른 /campaigns/ 경로:"
grep -n '"/campaigns/' "$HTML_FILE" | grep -E '\.(jpg|jpeg|png|gif|webp)' | head -10

echo ""
echo "=== 실제 이미지 파일 확인 ==="
echo ""
echo "📁 /campaigns/2025-07/ 폴더:"
ls -la public/campaigns/2025-07/ 2>/dev/null || echo "폴더가 없습니다"

echo ""
echo "📁 /campaigns/common/gifts/ 폴더:"
ls -la public/campaigns/common/gifts/ 2>/dev/null || echo "폴더가 없습니다"

echo ""
echo "=== 수정 제안 ==="
echo "다음 명령어로 잘못된 경로를 수정할 수 있습니다:"
echo ""
echo "sed -i '' 's|/assets/campaigns/|/campaigns/|g' $HTML_FILE"
echo ""

# 실제로 몇 개의 경로를 수정해야 하는지 카운트
COUNT=$(grep -c "/assets/campaigns/" "$HTML_FILE")
echo "총 $COUNT개의 경로를 수정해야 합니다."
