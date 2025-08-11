#!/bin/bash

# 퀴즈 데이터 표시 업데이트 스크립트

echo "🔧 관리자 페이지와 슬랙 알림 업데이트 시작..."

# 1. 관리자 페이지 업데이트
echo "1. 관리자 페이지 업데이트 중..."
if [ -f "update_admin_page.py" ]; then
    python3 update_admin_page.py
    
    if [ -f "pages/admin-updated.tsx" ]; then
        # 백업 생성
        cp pages/admin.tsx pages/admin-backup-$(date +%Y%m%d_%H%M%S).tsx
        # 업데이트 적용
        mv pages/admin-updated.tsx pages/admin.tsx
        echo "✅ 관리자 페이지 업데이트 완료"
    fi
    
    rm update_admin_page.py
fi

# 2. 슬랙 알림 파일 확인 및 수정
echo "2. 슬랙 알림 업데이트 중..."

# funnel-2025-07-complete.html에서 슬랙 알림 부분 확인
echo "   프론트엔드에서 퀴즈 데이터 전송 확인..."
if grep -q "swing_style: quizData.styleText" public/versions/funnel-2025-07-complete.html; then
    echo "   ✅ 프론트엔드는 이미 퀴즈 데이터를 전송하고 있습니다"
else
    echo "   ⚠️  프론트엔드에서 퀴즈 데이터를 전송하지 않고 있습니다"
fi

# 슬랙 알림 API 업데이트
if [ -f "pages/api/slack/notify-updated.js" ]; then
    cp pages/api/slack/notify.js pages/api/slack/notify-backup-$(date +%Y%m%d_%H%M%S).js
    mv pages/api/slack/notify-updated.js pages/api/slack/notify.js
    echo "✅ 슬랙 알림 API 업데이트 완료"
fi

# 3. Next.js 서버 재시작 필요 확인
echo ""
echo "📌 중요: 변경사항 적용을 위해 다음 작업이 필요합니다:"
echo "1. Next.js 개발 서버 재시작 (Ctrl+C 후 npm run dev)"
echo "2. 또는 프로덕션인 경우: npm run build && npm start"
echo ""

# 4. 테스트 SQL 생성
cat > test_quiz_data.sql << 'EOF'
-- 퀴즈 데이터가 잘 저장되고 있는지 확인
SELECT 
    b.name,
    b.phone,
    b.date,
    b.club,
    b.swing_style,
    b.current_distance,
    b.recommended_flex,
    b.created_at
FROM bookings b
WHERE b.swing_style IS NOT NULL 
   OR b.current_distance IS NOT NULL
ORDER BY b.created_at DESC
LIMIT 10;

-- customer_quick_view 확인
SELECT * FROM customer_quick_view
WHERE swing_style IS NOT NULL
ORDER BY last_activity DESC
LIMIT 10;
EOF

echo "✅ 테스트 SQL 생성: test_quiz_data.sql"
echo ""
echo "🎯 완료! 이제 관리자 페이지와 슬랙에서 퀴즈 데이터를 볼 수 있습니다."