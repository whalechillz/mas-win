-- 현재 코드와의 호환성을 위한 임시 컬럼 추가
-- 이렇게 하면 즉시 오류가 해결됩니다

-- bookings 테이블에 퀴즈 컬럼 추가
ALTER TABLE bookings 
ADD COLUMN IF NOT EXISTS swing_style VARCHAR(50),
ADD COLUMN IF NOT EXISTS priority VARCHAR(50),
ADD COLUMN IF NOT EXISTS current_distance INTEGER,
ADD COLUMN IF NOT EXISTS recommended_flex VARCHAR(20),
ADD COLUMN IF NOT EXISTS expected_distance INTEGER;

-- contacts 테이블에 퀴즈 컬럼 추가
ALTER TABLE contacts
ADD COLUMN IF NOT EXISTS swing_style VARCHAR(50),
ADD COLUMN IF NOT EXISTS priority VARCHAR(50),
ADD COLUMN IF NOT EXISTS current_distance INTEGER,
ADD COLUMN IF NOT EXISTS recommended_flex VARCHAR(20),
ADD COLUMN IF NOT EXISTS expected_distance INTEGER;

-- 추가된 컬럼 확인
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name IN ('bookings', 'contacts') 
AND column_name IN ('swing_style', 'priority', 'current_distance', 'recommended_flex', 'expected_distance')
ORDER BY table_name, column_name;
