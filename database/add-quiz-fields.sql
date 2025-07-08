-- bookings 테이블에 퀴즈 결과 및 추가 필드들 추가
ALTER TABLE bookings 
ADD COLUMN IF NOT EXISTS swing_style VARCHAR(50),
ADD COLUMN IF NOT EXISTS priority VARCHAR(100),
ADD COLUMN IF NOT EXISTS current_distance VARCHAR(50),
ADD COLUMN IF NOT EXISTS recommended_flex VARCHAR(50),
ADD COLUMN IF NOT EXISTS expected_distance VARCHAR(50),
ADD COLUMN IF NOT EXISTS campaign_source VARCHAR(100),
ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT '대기중',
ADD COLUMN IF NOT EXISTS memo TEXT;

-- 기본값 설정 (선택사항)
UPDATE bookings 
SET status = '대기중' 
WHERE status IS NULL;

-- 인덱스 추가 (성능 향상)
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_date ON bookings(date);
CREATE INDEX IF NOT EXISTS idx_bookings_phone ON bookings(phone);
