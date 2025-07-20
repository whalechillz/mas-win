#!/bin/bash

# 퍼널 페이지에 조회수 추적 코드 추가하는 스크립트

FUNNEL_FILE="./public/versions/funnel-2025-07-complete.html"
BACKUP_FILE="./public/versions/funnel-2025-07-complete.html.backup-$(date +%Y%m%d%H%M%S)"

# 백업 생성
echo "백업 파일 생성 중..."
cp "$FUNNEL_FILE" "$BACKUP_FILE"
echo "백업 완료: $BACKUP_FILE"

# 추적 코드 추가
echo "조회수 추적 코드 추가 중..."

# </body> 태그 바로 앞에 추적 코드 삽입
TRACKING_CODE='
<!-- 페이지 조회수 추적 -->
<script>
(function() {
    window.addEventListener("load", function() {
        const campaignId = "2025-07";
        const currentPage = window.location.pathname || "/funnel-2025-07";
        const trackingKey = "viewed_" + campaignId + "_" + currentPage;
        
        if (sessionStorage.getItem(trackingKey)) {
            return;
        }
        
        fetch("/api/track-view", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                campaign_id: campaignId,
                page: currentPage
            })
        }).then(function(response) {
            if (response.ok) {
                sessionStorage.setItem(trackingKey, "true");
            }
        }).catch(function(error) {
            console.error("View tracking failed:", error);
        });
    });
})();
</script>
'

# sed를 사용하여 </body> 태그 앞에 코드 삽입
if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    sed -i '' "s|</body>|${TRACKING_CODE}\n</body>|" "$FUNNEL_FILE"
else
    # Linux
    sed -i "s|</body>|${TRACKING_CODE}\n</body>|" "$FUNNEL_FILE"
fi

echo "조회수 추적 코드가 성공적으로 추가되었습니다!"
echo ""
echo "다음 단계:"
echo "1. Supabase에서 page-views-tracking.sql 실행"
echo "2. 로컬에서 테스트: npm run dev"
echo "3. 배포: ./deploy-commands.sh"
echo ""
echo "원본으로 복원하려면: cp $BACKUP_FILE $FUNNEL_FILE"
