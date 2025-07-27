#!/bin/bash

# 5월 퍼널 이미지 정리 스크립트

echo "🖼️ 5월 퍼널 이미지 정리 시작..."

# 1. 캠페인 폴더에서 이미지 복사
echo "1️⃣ 캠페인 폴더 이미지 이동..."
cp -r /Users/m2/MASLABS/win.masgolf.co.kr/public/campaigns/2025-05-가정의달/* /Users/m2/MASLABS/win.masgolf.co.kr/public/assets/campaigns/2025-05/ 2>/dev/null

# 2. hero 폴더에서 5월 관련 이미지 복사
echo "2️⃣ Hero 이미지 복사..."
cp /Users/m2/MASLABS/win.masgolf.co.kr/public/assets/hero/hero_father_son_golf_1080x1920.jpg /Users/m2/MASLABS/win.masgolf.co.kr/public/assets/campaigns/2025-05/

# 3. story 폴더에서 이미지 복사
echo "3️⃣ Story 이미지 복사..."
cp /Users/m2/MASLABS/win.masgolf.co.kr/public/assets/story/senior_golfer_smiling_1080x1350.jpg /Users/m2/MASLABS/win.masgolf.co.kr/public/assets/campaigns/2025-05/
cp /Users/m2/MASLABS/win.masgolf.co.kr/public/assets/story/senior_golfer_swinging_1080x1350.jpg /Users/m2/MASLABS/win.masgolf.co.kr/public/assets/campaigns/2025-05/

# 4. product 폴더에서 이미지 복사
echo "4️⃣ Product 이미지 복사..."
cp /Users/m2/MASLABS/win.masgolf.co.kr/public/assets/product/titanium_club_face_1200x800.jpg /Users/m2/MASLABS/win.masgolf.co.kr/public/assets/campaigns/2025-05/
cp /Users/m2/MASLABS/win.masgolf.co.kr/public/assets/product/driver_impact_1200x800.jpg /Users/m2/MASLABS/win.masgolf.co.kr/public/assets/campaigns/2025-05/
cp /Users/m2/MASLABS/win.masgolf.co.kr/public/assets/product/premium_golf_shaft_detail_1200x800.jpg /Users/m2/MASLABS/win.masgolf.co.kr/public/assets/campaigns/2025-05/

# 5. package 폴더에서 이미지 복사
echo "5️⃣ Package 이미지 복사..."
cp /Users/m2/MASLABS/win.masgolf.co.kr/public/assets/package/father_son_teeoff_package_1080x1350.jpg /Users/m2/MASLABS/win.masgolf.co.kr/public/assets/campaigns/2025-05/
cp /Users/m2/MASLABS/win.masgolf.co.kr/public/assets/package/family_golf_playing_1080x1350.jpg /Users/m2/MASLABS/win.masgolf.co.kr/public/assets/campaigns/2025-05/
cp /Users/m2/MASLABS/win.masgolf.co.kr/public/assets/package/couple_golf_round_1080x1350.jpg /Users/m2/MASLABS/win.masgolf.co.kr/public/assets/campaigns/2025-05/
cp /Users/m2/MASLABS/win.masgolf.co.kr/public/assets/package/fitting_experience_coupon.jpg /Users/m2/MASLABS/win.masgolf.co.kr/public/assets/campaigns/2025-05/

# 6. review 폴더에서 이미지 복사
echo "6️⃣ Review 이미지 복사..."
cp /Users/m2/MASLABS/win.masgolf.co.kr/public/assets/review/golfer_avatar_512x512_01.jpg /Users/m2/MASLABS/win.masgolf.co.kr/public/assets/campaigns/2025-05/
cp /Users/m2/MASLABS/win.masgolf.co.kr/public/assets/review/golfer_avatar_512x512_02.jpg /Users/m2/MASLABS/win.masgolf.co.kr/public/assets/campaigns/2025-05/
cp /Users/m2/MASLABS/win.masgolf.co.kr/public/assets/review/golfer_avatar_512x512_03.jpg /Users/m2/MASLABS/win.masgolf.co.kr/public/assets/campaigns/2025-05/

echo "✅ 이미지 복사 완료!"
