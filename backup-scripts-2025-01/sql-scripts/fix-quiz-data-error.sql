-- 방법 1: bookings와 contacts 테이블에 퀴즈 관련 컬럼 추가
-- Supabase SQL Editor에서 실행하세요

-- bookings 테이블에 컬럼 추가
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS swing_style VARCHAR(50);
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS priority VARCHAR(50);
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS current_distance INTEGER;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS recommended_flex VARCHAR(20);
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS expected_distance INTEGER;

-- contacts 테이블에 컬럼 추가
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS swing_style VARCHAR(50);
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS priority VARCHAR(50);
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS current_distance INTEGER;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS recommended_flex VARCHAR(20);
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS expected_distance INTEGER;

-- 컬럼이 추가되었는지 확인
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name IN ('bookings', 'contacts') 
AND column_name IN ('swing_style', 'priority', 'current_distance', 'recommended_flex', 'expected_distance')
ORDER BY table_name, column_name;