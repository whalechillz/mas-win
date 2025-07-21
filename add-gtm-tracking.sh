#!/bin/bash
# chmod +x add-gtm-tracking.sh

# 7월 퍼널에 GTM 추적 코드 추가하는 스크립트

echo "🔄 7월 퍼널에 GTM 추적 코드 추가 중..."

# 백업 생성
cp public/versions/funnel-2025-07-complete.html public/versions/funnel-2025-07-complete.html.backup-gtm-$(date +%Y%m%d%H%M%S)

# GTM 추적 스크립트 로드 추가
sed -i '' '/<script src="..\/..\/prevent-duplicate.js"><\/script>/a\
    <script src="../../gtm-tracking.js"></script>' public/versions/funnel-2025-07-complete.html

# 전화번호 클릭에 추적 추가
sed -i '' 's/makePhoneCall(phoneNumber)/trackPhoneClick(phoneNumber); makePhoneCall(phoneNumber)/g' public/versions/funnel-2025-07-complete.html

# 플로팅 버튼 클릭에 추적 추가
sed -i '' 's/function handleFloatingButtonClick(event)/function handleFloatingButtonClick(event) {\n            trackFloatingButtonClick();/g' public/versions/funnel-2025-07-complete.html

# 퀴즈 완료에 추적 추가
sed -i '' '/document.getElementById('\''recommendedProduct'\'').innerHTML = resultHTML;/i\
            // GTM 퀴즈 완료 추적\
            trackQuizComplete(quizData);' public/versions/funnel-2025-07-complete.html

# 시타 예약 폼 제출에 추적 추가
sed -i '' '/alert('\''예약이 완료되었습니다/i\
                // GTM 시타 예약 추적\
                trackBookingSubmit({\
                    ...data,\
                    swing_style: quizData.styleText,\
                    current_distance: quizData.distance\
                });' public/versions/funnel-2025-07-complete.html

# 문의 접수 폼 제출에 추적 추가
sed -i '' '/alert('\''문의가 접수되었습니다/i\
                // GTM 문의 접수 추적\
                trackContactSubmit({\
                    ...data,\
                    swing_style: quizData.styleText,\
                    current_distance: quizData.distance\
                });' public/versions/funnel-2025-07-complete.html

# 비거리 비교에 추적 추가
sed -i '' '/animateMasDistance(userDistance, masDistance);/a\
                    \
                    // GTM 비거리 비교 추적\
                    trackDistanceComparison(userDistance, masDistance);' public/versions/funnel-2025-07-complete.html

# 맞춤 클럽 찾기 버튼에 추적 추가
sed -i '' 's/<a href="#quiz-section"/<a href="#quiz-section" onclick="trackFindClubClick()"/g' public/versions/funnel-2025-07-complete.html

echo "✅ GTM 추적 코드 추가 완료!"
echo ""
echo "📋 추가된 추적 이벤트:"
echo "  - phone_click (전화번호 클릭)"
echo "  - quiz_complete (퀴즈 완료)"
echo "  - booking_submit (시타 예약)"
echo "  - contact_submit (문의 접수)"
echo "  - floating_button_click (플로팅 버튼)"
echo "  - find_club_click (맞춤 클럽 찾기)"
echo "  - distance_comparison (비거리 비교)"
echo "  - scroll_depth (스크롤 깊이)"
echo "  - page_view (페이지뷰)"
echo ""
echo "🚀 배포 명령어:"
echo "  vercel --prod"
