-- 예약 양식 개선을 위한 스키마 확장
-- 실행일: 2025-11-24

-- bookings 테이블 확장 (클럽 정보 구조화, 탄도, 구질 필드 추가)
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS club_brand TEXT;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS club_loft DECIMAL(3,1);
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS club_shaft TEXT;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS trajectory TEXT; -- 'high', 'mid', 'low'
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS shot_shape TEXT; -- 'fade', 'draw', 'straight', 'hook', 'slice'

-- customers 테이블 확장 (고객 프로필 자동 생성용)
ALTER TABLE customers ADD COLUMN IF NOT EXISTS avg_distance INTEGER;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS preferred_trajectory TEXT;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS typical_shot_shape TEXT;

-- 확인 쿼리
SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns
WHERE table_name = 'bookings' 
  AND column_name IN ('club_brand', 'club_loft', 'club_shaft', 'trajectory', 'shot_shape')
ORDER BY column_name;

SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns
WHERE table_name = 'customers' 
  AND column_name IN ('avg_distance', 'preferred_trajectory', 'typical_shot_shape')
ORDER BY column_name;

