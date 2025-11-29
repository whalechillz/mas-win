-- booking_hours 테이블의 unique constraint 제거 및 수정
-- Supabase SQL Editor에서 실행

-- 1. 현재 constraint 확인
SELECT 
  conname as constraint_name,
  contype as constraint_type,
  pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint
WHERE conrelid = 'booking_hours'::regclass
AND contype = 'u';  -- 'u' = unique constraint

-- 2. 기존 unique constraint 제거 (unique_location_day)
ALTER TABLE booking_hours 
DROP CONSTRAINT IF EXISTS unique_location_day;

-- 3. 새로운 unique constraint 생성 (같은 장소, 같은 요일, 같은 시간대는 중복 방지)
-- 이렇게 하면 하루에 여러 타임슬롯을 저장할 수 있지만, 완전히 동일한 시간대는 중복 방지
ALTER TABLE booking_hours 
ADD CONSTRAINT unique_location_day_time 
UNIQUE (location_id, day_of_week, start_time, end_time);

-- 4. 확인: constraint가 제대로 변경되었는지 확인
SELECT 
  conname as constraint_name,
  contype as constraint_type,
  pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint
WHERE conrelid = 'booking_hours'::regclass
AND contype = 'u';


