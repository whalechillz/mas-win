#!/bin/bash

echo "🚀 MASGOLF 퀴즈 데이터 표시 기능 완전 업데이트"
echo "============================================"

# 1. 관리자 페이지 업데이트
echo ""
echo "1️⃣ 관리자 페이지 업데이트 중..."
chmod +x final-admin-update.sh
./final-admin-update.sh

# 2. 슬랙 알림 업데이트
echo ""
echo "2️⃣ 슬랙 알림 업데이트 중..."
if [ -f "pages/api/slack/notify-updated.js" ]; then
    cp pages/api/slack/notify.js pages/api/slack/notify-backup-$(date +%Y%m%d_%H%M%S).js
    cp pages/api/slack/notify-updated.js pages/api/slack/notify.js
    echo "✅ 슬랙 알림 업데이트 완료"
else
    echo "⚠️  슬랙 알림 파일이 없습니다. 수동으로 업데이트 필요"
fi

# 3. 테스트 SQL 생성
echo ""
echo "3️⃣ 테스트 SQL 생성..."
cat > test_quiz_display.sql << 'EOF'
-- 퀴즈 데이터가 있는 예약 확인
SELECT 
    name as "고객명",
    phone as "연락처",
    date as "예약날짜",
    club as "관심클럽",
    swing_style as "스윙타입",
    current_distance as "현재거리",
    recommended_flex as "추천플렉스",
    created_at as "신청시간"
FROM bookings
WHERE swing_style IS NOT NULL 
   OR current_distance IS NOT NULL
ORDER BY created_at DESC
LIMIT 10;

-- 퀴즈 완료율 확인
SELECT 
    COUNT(*) as "전체예약",
    COUNT(swing_style) as "퀴즈완료",
    ROUND(COUNT(swing_style)::numeric / COUNT(*) * 100, 1) || '%' as "퀴즈완료율"
FROM bookings
WHERE created_at > NOW() - INTERVAL '30 days';
EOF

echo "✅ 테스트 SQL 생성: test_quiz_display.sql"

# 4. 최종 안내
echo ""
echo "=========================================="
echo "✅ 모든 업데이트 완료!"
echo "=========================================="
echo ""
echo "📋 체크리스트:"
echo "□ Next.js 서버 재시작 (Ctrl+C → npm run dev)"
echo "□ 관리자 페이지 확인 (http://localhost:3000/admin)"
echo "□ 테스트: 퀴즈 완료 후 예약하기"
echo "□ Supabase에서 test_quiz_display.sql 실행"
echo ""
echo "🎯 기대 결과:"
echo "- 관리자 페이지: 스윙타입, 현재거리 표시"
echo "- 슬랙 알림: 퀴즈 데이터 포함"
echo "- 데이터베이스: 퀴즈 데이터 저장"
echo ""
echo "💡 참고: 퀴즈를 하지 않은 고객은 '-'로 표시됩니다"