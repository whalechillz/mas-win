-- Q2 답변(priority) 확인 쿼리

-- 1. priority 컬럼에 데이터가 있는지 확인
SELECT 
    COUNT(*) as total_bookings,
    COUNT(swing_style) as with_q1,
    COUNT(priority) as with_q2,  -- 이 값이 0이면 Q2가 저장 안 됨
    COUNT(current_distance) as with_q3
FROM bookings
WHERE created_at > NOW() - INTERVAL '7 days';

-- 2. 최근 예약의 상세 데이터 확인
SELECT 
    name,
    phone,
    swing_style as "Q1_스윙스타일",
    priority as "Q2_중요요소",  -- NULL일 가능성
    current_distance as "Q3_현재거리",
    recommended_flex as "추천플렉스",
    created_at
FROM bookings
ORDER BY created_at DESC
LIMIT 10;

-- 3. quiz_results 테이블도 확인 (혹시 여기에 저장되나?)
SELECT * FROM quiz_results 
ORDER BY created_at DESC 
LIMIT 5;