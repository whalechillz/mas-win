#!/bin/bash

echo "=== 7월 퍼널 이미지 경로 완전 수정 ==="

cd /Users/m2/MASLABS/win.masgolf.co.kr

# 백업 생성
echo "1. 백업 생성..."
cp public/versions/funnel-2025-07-complete.html public/versions/funnel-2025-07-complete.html.backup-$(date +%Y%m%d-%H%M%S)

# 모든 잘못된 경로 수정
echo "2. 이미지 경로 수정 중..."

# /assets/campaigns/ -> /campaigns/
sed -i '' 's|/assets/campaigns/|/campaigns/|g' public/versions/funnel-2025-07-complete.html

# /assets/review/ -> /review/
sed -i '' 's|/assets/review/|/review/|g' public/versions/funnel-2025-07-complete.html

# /gifts/ 경로가 올바른지 확인 (이미 올바른 경로인 경우가 많음)
# 단, /assets/gifts/가 있다면 수정
sed -i '' 's|/assets/gifts/|/campaigns/common/gifts/|g' public/versions/funnel-2025-07-complete.html

# gifts 폴더 경로 수정 (만약 상대경로로 되어있다면)
sed -i '' 's|src="/gifts/|src="/campaigns/common/gifts/|g' public/versions/funnel-2025-07-complete.html

echo "3. 수정 완료!"

# 수정 결과 확인
echo ""
echo "=== 수정 결과 확인 ==="
echo ""
echo "히어로 이미지 경로:"
grep -n "hero-summer" public/versions/funnel-2025-07-complete.html | head -3

echo ""
echo "사은품 이미지 경로:"
grep -n "cooling-towel\|cooling-sleeves\|SALUTE21" public/versions/funnel-2025-07-complete.html | head -5

echo ""
echo "잘못된 /assets/ 경로가 남아있는지 확인:"
if grep -q "/assets/" public/versions/funnel-2025-07-complete.html; then
    echo "⚠️  아직 /assets/ 경로가 남아있습니다:"
    grep -n "/assets/" public/versions/funnel-2025-07-complete.html | head -5
else
    echo "✅ 모든 /assets/ 경로가 수정되었습니다!"
fi

echo ""
echo "=== 완료! ==="
echo "브라우저에서 캐시를 삭제하고 새로고침하세요 (Cmd+Shift+R)"
