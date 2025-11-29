-- 운영시간 데이터 확인 쿼리
-- Supabase SQL Editor에서 실행

-- 1. 예약장소별 운영시간 개수 확인
SELECT 
  l.name as 장소명,
  l.is_active as 활성화,
  COUNT(h.id) as 운영시간_개수
FROM booking_locations l
LEFT JOIN booking_hours h ON h.location_id = l.id
GROUP BY l.id, l.name, l.is_active
ORDER BY l.name;

-- 2. 상세 운영시간 확인 (Massgoo Studio)
SELECT 
  l.name as 장소명,
  CASE h.day_of_week
    WHEN 0 THEN '일요일'
    WHEN 1 THEN '월요일'
    WHEN 2 THEN '화요일'
    WHEN 3 THEN '수요일'
    WHEN 4 THEN '목요일'
    WHEN 5 THEN '금요일'
    WHEN 6 THEN '토요일'
  END as 요일,
  h.day_of_week,
  h.start_time as 시작시간,
  h.end_time as 종료시간,
  h.is_available as 사용가능
FROM booking_locations l
INNER JOIN booking_hours h ON h.location_id = l.id
WHERE l.name = 'Massgoo Studio'
ORDER BY h.day_of_week, h.start_time;

-- 3. 요일별 운영시간 요약
SELECT 
  CASE h.day_of_week
    WHEN 0 THEN '일요일'
    WHEN 1 THEN '월요일'
    WHEN 2 THEN '화요일'
    WHEN 3 THEN '수요일'
    WHEN 4 THEN '목요일'
    WHEN 5 THEN '금요일'
    WHEN 6 THEN '토요일'
  END as 요일,
  COUNT(*) as 타임슬롯_개수,
  STRING_AGG(h.start_time || '~' || h.end_time, ', ' ORDER BY h.start_time) as 운영시간
FROM booking_locations l
INNER JOIN booking_hours h ON h.location_id = l.id
WHERE l.name = 'Massgoo Studio'
GROUP BY h.day_of_week
ORDER BY h.day_of_week;


