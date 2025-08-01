#!/bin/bash

echo "=== 8월 퍼널 이미지 경로 수정 ==="

HTML_FILE="/Users/m2/MASLABS/win.masgolf.co.kr/public/versions/funnel-2025-08-vacation.html"

# 백업 생성
cp "$HTML_FILE" "$HTML_FILE.backup-$(date +%Y%m%d-%H%M%S)"

# 이미지 경로 수정
# 1. /assets/campaigns/ -> /campaigns/
sed -i '' 's|/assets/campaigns/|/campaigns/|g' "$HTML_FILE"

# 2. 8월 이미지 경로 확인 및 수정
# hero 이미지들
sed -i '' 's|src="[^"]*hero-image-1[^"]*"|src="/campaigns/2025-08/hero-image-1-face.jpg"|g' "$HTML_FILE"
sed -i '' 's|src="[^"]*hero-image-2[^"]*"|src="/campaigns/2025-08/hero-image-2-face.jpg"|g' "$HTML_FILE"
sed -i '' 's|src="[^"]*hero-image-3[^"]*"|src="/campaigns/2025-08/hero-image-3-face.jpg"|g' "$HTML_FILE"

# 사은품 이미지들
sed -i '' 's|src="[^"]*perfume[^"]*\.jpg"|src="/campaigns/2025-08/perfume-540x480.jpg"|g' "$HTML_FILE"
sed -i '' 's|src="[^"]*perfume[^"]*\.png"|src="/campaigns/2025-08/perfume-1024x1024.png"|g' "$HTML_FILE"
sed -i '' 's|src="[^"]*sunbed[^"]*"|src="/campaigns/2025-08/sunbed-1080x1920.jpg"|g' "$HTML_FILE"
sed -i '' 's|src="[^"]*waterproof[^"]*"|src="/campaigns/2025-08/waterproof-pouch-640x480.png"|g' "$HTML_FILE"
sed -i '' 's|src="[^"]*chanel-perfume[^"]*\.jpg"|src="/campaigns/2025-08/chanel-perfume-640x480.jpg"|g' "$HTML_FILE"
sed -i '' 's|src="[^"]*chanel-perfume[^"]*\.png"|src="/campaigns/2025-08/chanel-perfume-1024x1024.png"|g' "$HTML_FILE"

echo "수정 완료!"

# 확인
echo ""
echo "=== 수정된 이미지 경로 확인 ==="
grep -n "/campaigns/2025-08/" "$HTML_FILE" | head -10

echo ""
echo "=== 잘못된 경로 확인 ==="
if grep -q "/assets/" "$HTML_FILE"; then
    echo "⚠️ 아직 /assets/ 경로가 있습니다:"
    grep -n "/assets/" "$HTML_FILE" | head -5
else
    echo "✅ 모든 /assets/ 경로가 수정되었습니다!"
fi
