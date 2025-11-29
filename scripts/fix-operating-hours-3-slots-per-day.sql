-- 운영시간 수정: 하루에 3개 타임슬롯으로 변경
-- Supabase SQL Editor에서 실행

-- 먼저 unique constraint를 수정해야 합니다!
-- fix-booking-hours-unique-constraint.sql 파일을 먼저 실행하세요.

DO $$
DECLARE
  location_id_val UUID;
BEGIN
  -- Massgoo Studio 장소 ID 가져오기
  SELECT id INTO location_id_val 
  FROM booking_locations 
  WHERE name = 'Massgoo Studio' 
  LIMIT 1;

  IF location_id_val IS NULL THEN
    RAISE EXCEPTION 'Massgoo Studio 장소를 찾을 수 없습니다.';
  END IF;

  -- 기존 운영시간 모두 삭제
  DELETE FROM booking_hours WHERE location_id = location_id_val;

  -- 월~금: 각 3개 타임슬롯 생성 (11-12시, 13-14시, 15-16시)
  -- 월요일 (1)
  INSERT INTO booking_hours (location_id, day_of_week, start_time, end_time, is_available)
  VALUES 
    (location_id_val, 1, '11:00', '12:00', true),
    (location_id_val, 1, '13:00', '14:00', true),
    (location_id_val, 1, '15:00', '16:00', true);

  -- 화요일 (2)
  INSERT INTO booking_hours (location_id, day_of_week, start_time, end_time, is_available)
  VALUES 
    (location_id_val, 2, '11:00', '12:00', true),
    (location_id_val, 2, '13:00', '14:00', true),
    (location_id_val, 2, '15:00', '16:00', true);

  -- 수요일 (3)
  INSERT INTO booking_hours (location_id, day_of_week, start_time, end_time, is_available)
  VALUES 
    (location_id_val, 3, '11:00', '12:00', true),
    (location_id_val, 3, '13:00', '14:00', true),
    (location_id_val, 3, '15:00', '16:00', true);

  -- 목요일 (4)
  INSERT INTO booking_hours (location_id, day_of_week, start_time, end_time, is_available)
  VALUES 
    (location_id_val, 4, '11:00', '12:00', true),
    (location_id_val, 4, '13:00', '14:00', true),
    (location_id_val, 4, '15:00', '16:00', true);

  -- 금요일 (5)
  INSERT INTO booking_hours (location_id, day_of_week, start_time, end_time, is_available)
  VALUES 
    (location_id_val, 5, '11:00', '12:00', true),
    (location_id_val, 5, '13:00', '14:00', true),
    (location_id_val, 5, '15:00', '16:00', true);

  RAISE NOTICE '운영시간이 성공적으로 업데이트되었습니다. (월~금, 각 3개 타임슬롯)';
END $$;

-- 확인 쿼리: 요일별 타임슬롯 개수 확인
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

