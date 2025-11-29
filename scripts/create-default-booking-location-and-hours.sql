-- 기본 예약장소 및 운영시간 생성 스크립트
-- Supabase SQL Editor에서 실행

-- 1. 기본 예약장소 생성 (이미 있으면 스킵)
INSERT INTO booking_locations (id, name, address, phone, is_active, created_at)
SELECT 
  gen_random_uuid(),
  'Massgoo Studio',
  '경기도 수원시 영통구 법조로149번길 200',
  '031-215-0013',
  true,
  NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM booking_locations WHERE name = 'Massgoo Studio'
)
RETURNING id;

-- 2. 생성된 장소 ID 가져오기
DO $$
DECLARE
  location_id_val UUID;
BEGIN
  -- 기본 장소 ID 가져오기
  SELECT id INTO location_id_val 
  FROM booking_locations 
  WHERE name = 'Massgoo Studio' 
  LIMIT 1;

  -- 기본 장소가 없으면 생성
  IF location_id_val IS NULL THEN
    INSERT INTO booking_locations (id, name, address, phone, is_active, created_at)
    VALUES (gen_random_uuid(), 'Massgoo Studio', '경기도 수원시 영통구 법조로149번길 200', '031-215-0013', true, NOW())
    RETURNING id INTO location_id_val;
  END IF;

  -- 3. 기본 운영시간 생성 (월~금: 11-12시, 13-14시, 15-16시)
  -- 월요일 (1)
  INSERT INTO booking_hours (location_id, day_of_week, start_time, end_time, is_available)
  VALUES (location_id_val, 1, '11:00', '12:00', true)
  ON CONFLICT DO NOTHING;
  
  INSERT INTO booking_hours (location_id, day_of_week, start_time, end_time, is_available)
  VALUES (location_id_val, 1, '13:00', '14:00', true)
  ON CONFLICT DO NOTHING;
  
  INSERT INTO booking_hours (location_id, day_of_week, start_time, end_time, is_available)
  VALUES (location_id_val, 1, '15:00', '16:00', true)
  ON CONFLICT DO NOTHING;

  -- 화요일 (2)
  INSERT INTO booking_hours (location_id, day_of_week, start_time, end_time, is_available)
  VALUES (location_id_val, 2, '11:00', '12:00', true)
  ON CONFLICT DO NOTHING;
  
  INSERT INTO booking_hours (location_id, day_of_week, start_time, end_time, is_available)
  VALUES (location_id_val, 2, '13:00', '14:00', true)
  ON CONFLICT DO NOTHING;
  
  INSERT INTO booking_hours (location_id, day_of_week, start_time, end_time, is_available)
  VALUES (location_id_val, 2, '15:00', '16:00', true)
  ON CONFLICT DO NOTHING;

  -- 수요일 (3)
  INSERT INTO booking_hours (location_id, day_of_week, start_time, end_time, is_available)
  VALUES (location_id_val, 3, '11:00', '12:00', true)
  ON CONFLICT DO NOTHING;
  
  INSERT INTO booking_hours (location_id, day_of_week, start_time, end_time, is_available)
  VALUES (location_id_val, 3, '13:00', '14:00', true)
  ON CONFLICT DO NOTHING;
  
  INSERT INTO booking_hours (location_id, day_of_week, start_time, end_time, is_available)
  VALUES (location_id_val, 3, '15:00', '16:00', true)
  ON CONFLICT DO NOTHING;

  -- 목요일 (4)
  INSERT INTO booking_hours (location_id, day_of_week, start_time, end_time, is_available)
  VALUES (location_id_val, 4, '11:00', '12:00', true)
  ON CONFLICT DO NOTHING;
  
  INSERT INTO booking_hours (location_id, day_of_week, start_time, end_time, is_available)
  VALUES (location_id_val, 4, '13:00', '14:00', true)
  ON CONFLICT DO NOTHING;
  
  INSERT INTO booking_hours (location_id, day_of_week, start_time, end_time, is_available)
  VALUES (location_id_val, 4, '15:00', '16:00', true)
  ON CONFLICT DO NOTHING;

  -- 금요일 (5)
  INSERT INTO booking_hours (location_id, day_of_week, start_time, end_time, is_available)
  VALUES (location_id_val, 5, '11:00', '12:00', true)
  ON CONFLICT DO NOTHING;
  
  INSERT INTO booking_hours (location_id, day_of_week, start_time, end_time, is_available)
  VALUES (location_id_val, 5, '13:00', '14:00', true)
  ON CONFLICT DO NOTHING;
  
  INSERT INTO booking_hours (location_id, day_of_week, start_time, end_time, is_available)
  VALUES (location_id_val, 5, '15:00', '16:00', true)
  ON CONFLICT DO NOTHING;

  -- 토요일 (6) - 주말도 가능하면 추가
  INSERT INTO booking_hours (location_id, day_of_week, start_time, end_time, is_available)
  VALUES (location_id_val, 6, '11:00', '12:00', true)
  ON CONFLICT DO NOTHING;
  
  INSERT INTO booking_hours (location_id, day_of_week, start_time, end_time, is_available)
  VALUES (location_id_val, 6, '13:00', '14:00', true)
  ON CONFLICT DO NOTHING;
  
  INSERT INTO booking_hours (location_id, day_of_week, start_time, end_time, is_available)
  VALUES (location_id_val, 6, '15:00', '16:00', true)
  ON CONFLICT DO NOTHING;

  -- 일요일 (0) - 주말도 가능하면 추가
  INSERT INTO booking_hours (location_id, day_of_week, start_time, end_time, is_available)
  VALUES (location_id_val, 0, '11:00', '12:00', true)
  ON CONFLICT DO NOTHING;
  
  INSERT INTO booking_hours (location_id, day_of_week, start_time, end_time, is_available)
  VALUES (location_id_val, 0, '13:00', '14:00', true)
  ON CONFLICT DO NOTHING;
  
  INSERT INTO booking_hours (location_id, day_of_week, start_time, end_time, is_available)
  VALUES (location_id_val, 0, '15:00', '16:00', true)
  ON CONFLICT DO NOTHING;

END $$;

-- 확인 쿼리
SELECT 
  l.name as 장소명,
  l.address as 주소,
  l.phone as 전화번호,
  l.is_active as 활성화,
  COUNT(h.id) as 운영시간_개수
FROM booking_locations l
LEFT JOIN booking_hours h ON h.location_id = l.id
WHERE l.name = 'Massgoo Studio'
GROUP BY l.id, l.name, l.address, l.phone, l.is_active;

