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
