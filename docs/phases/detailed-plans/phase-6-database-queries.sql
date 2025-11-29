-- Phase 6: 시타 예약 시스템 마이그레이션 - 데이터베이스 쿼리
-- 기존 bookings 테이블 확장 및 booking_photos 테이블 생성

-- ==========================================
-- 1. 기존 bookings 테이블 확장
-- ==========================================

-- 서비스 타입 컬럼 추가
ALTER TABLE bookings 
ADD COLUMN IF NOT EXISTS service_type VARCHAR(100);

-- 이메일 컬럼 추가
ALTER TABLE bookings 
ADD COLUMN IF NOT EXISTS email VARCHAR(255);

-- 현재 비거리 컬럼 추가
ALTER TABLE bookings 
ADD COLUMN IF NOT EXISTS current_distance INTEGER;

-- 연령대 컬럼 추가
ALTER TABLE bookings 
ADD COLUMN IF NOT EXISTS age_group VARCHAR(20);

-- 예약 지속 시간 (분 단위) 컬럼 추가
ALTER TABLE bookings 
ADD COLUMN IF NOT EXISTS duration INTEGER DEFAULT 60;

-- 담당자 컬럼 추가 (UUID 또는 사용자 ID)
ALTER TABLE bookings 
ADD COLUMN IF NOT EXISTS assigned_to VARCHAR(100);

-- 위치 컬럼 추가
ALTER TABLE bookings 
ADD COLUMN IF NOT EXISTS location VARCHAR(100) DEFAULT 'Massgoo Studio';

-- 상태 관리 타임스탬프 추가
ALTER TABLE bookings 
ADD COLUMN IF NOT EXISTS confirmed_at TIMESTAMPTZ;
ALTER TABLE bookings 
ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;
ALTER TABLE bookings 
ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMPTZ;

-- updated_at 컬럼 추가 (없는 경우)
ALTER TABLE bookings 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- updated_at 자동 업데이트 트리거 함수 생성
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- updated_at 트리거 생성
DROP TRIGGER IF EXISTS update_bookings_updated_at ON bookings;
CREATE TRIGGER update_bookings_updated_at
    BEFORE UPDATE ON bookings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ==========================================
-- 2. booking_photos 테이블 생성
-- ==========================================

CREATE TABLE IF NOT EXISTS booking_photos (
  id SERIAL PRIMARY KEY,
  booking_id INTEGER REFERENCES bookings(id) ON DELETE CASCADE,
  customer_profile_id INTEGER, -- customers 테이블과 연결 (필요시)
  
  -- 이미지 정보
  image_url TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  file_name VARCHAR(255),
  file_size INTEGER,
  width INTEGER,
  height INTEGER,
  
  -- 메타데이터
  description TEXT,
  taken_at TIMESTAMPTZ,
  photo_type VARCHAR(50) DEFAULT 'general', -- 'before', 'after', 'fitting', 'general'
  
  -- 타임스탬프
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- 3. 인덱스 생성
-- ==========================================

-- bookings 테이블 인덱스
CREATE INDEX IF NOT EXISTS idx_bookings_customer_profile ON bookings(customer_profile_id);
CREATE INDEX IF NOT EXISTS idx_bookings_date ON bookings(date);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_phone ON bookings(phone);
CREATE INDEX IF NOT EXISTS idx_bookings_service_type ON bookings(service_type);
CREATE INDEX IF NOT EXISTS idx_bookings_assigned_to ON bookings(assigned_to);

-- booking_photos 테이블 인덱스
CREATE INDEX IF NOT EXISTS idx_booking_photos_booking ON booking_photos(booking_id);
CREATE INDEX IF NOT EXISTS idx_booking_photos_customer ON booking_photos(customer_profile_id);
CREATE INDEX IF NOT EXISTS idx_booking_photos_type ON booking_photos(photo_type);

-- ==========================================
-- 4. RLS (Row Level Security) 정책 설정
-- ==========================================

-- booking_photos 테이블 RLS 활성화
ALTER TABLE booking_photos ENABLE ROW LEVEL SECURITY;

-- booking_photos 읽기 정책 (인증된 사용자만)
CREATE POLICY "Authenticated users can view booking photos" ON booking_photos
    FOR SELECT USING (auth.role() = 'authenticated');

-- booking_photos 삽입 정책 (모든 사용자)
CREATE POLICY "Anyone can insert booking photos" ON booking_photos
    FOR INSERT WITH CHECK (true);

-- booking_photos 업데이트 정책 (인증된 사용자만)
CREATE POLICY "Authenticated users can update booking photos" ON booking_photos
    FOR UPDATE USING (auth.role() = 'authenticated');

-- booking_photos 삭제 정책 (인증된 사용자만)
CREATE POLICY "Authenticated users can delete booking photos" ON booking_photos
    FOR DELETE USING (auth.role() = 'authenticated');

-- ==========================================
-- 5. 유용한 뷰 생성
-- ==========================================

-- 예약과 고객 정보를 함께 조회하는 뷰
CREATE OR REPLACE VIEW bookings_with_customer AS
SELECT 
  b.id,
  b.customer_profile_id,
  b.name,
  b.phone,
  b.email,
  b.service_type,
  b.date,
  b.time,
  b.duration,
  b.club,
  b.current_distance,
  b.age_group,
  b.status,
  b.notes,
  b.assigned_to,
  b.location,
  b.created_at,
  b.updated_at,
  b.confirmed_at,
  b.completed_at,
  b.cancelled_at,
  c.name AS customer_name,
  c.phone AS customer_phone
FROM bookings b
LEFT JOIN customer_profiles c ON b.customer_profile_id = c.id;

-- 예약과 사진 개수를 함께 조회하는 뷰
CREATE OR REPLACE VIEW bookings_with_photo_count AS
SELECT 
  b.*,
  COUNT(bp.id) AS photo_count
FROM bookings b
LEFT JOIN booking_photos bp ON b.id = bp.booking_id
GROUP BY b.id;

-- ==========================================
-- 6. 유용한 함수 생성
-- ==========================================

-- 예약 가능한 시간 조회 함수
CREATE OR REPLACE FUNCTION get_available_times(
  p_date DATE,
  p_duration INTEGER DEFAULT 60
)
RETURNS TABLE (
  available_time TIME
) AS $$
BEGIN
  RETURN QUERY
  WITH booked_times AS (
    SELECT 
      time,
      time + (duration || ' minutes')::INTERVAL AS end_time
    FROM bookings
    WHERE date = p_date
      AND status IN ('pending', 'confirmed')
  ),
  time_slots AS (
    SELECT generate_series(
      '09:00'::TIME,
      '18:00'::TIME,
      '1 hour'::INTERVAL
    )::TIME AS slot_time
  )
  SELECT ts.slot_time
  FROM time_slots ts
  WHERE NOT EXISTS (
    SELECT 1
    FROM booked_times bt
    WHERE ts.slot_time < bt.end_time
      AND ts.slot_time + (p_duration || ' minutes')::INTERVAL > bt.time
  )
  ORDER BY ts.slot_time;
END;
$$ LANGUAGE plpgsql;

-- 고객 예약 히스토리 조회 함수
CREATE OR REPLACE FUNCTION get_customer_booking_history(
  p_phone VARCHAR(20)
)
RETURNS TABLE (
  booking_id INTEGER,
  booking_date DATE,
  booking_time TIME,
  service_type VARCHAR(100),
  status VARCHAR(20),
  photo_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    b.id AS booking_id,
    b.date AS booking_date,
    b.time AS booking_time,
    b.service_type,
    b.status,
    COUNT(bp.id) AS photo_count
  FROM bookings b
  LEFT JOIN booking_photos bp ON b.id = bp.booking_id
  WHERE b.phone = p_phone
  GROUP BY b.id, b.date, b.time, b.service_type, b.status
  ORDER BY b.date DESC, b.time DESC;
END;
$$ LANGUAGE plpgsql;

-- ==========================================
-- 7. 데이터 마이그레이션 (기존 데이터 업데이트)
-- ==========================================

-- 기존 예약 데이터에 기본값 설정
UPDATE bookings 
SET 
  service_type = 'KGFA 1급 시타 체험하기'
WHERE service_type IS NULL;

UPDATE bookings 
SET 
  location = 'Massgoo Studio'
WHERE location IS NULL;

UPDATE bookings 
SET 
  duration = 60
WHERE duration IS NULL;

-- ==========================================
-- 8. 샘플 데이터 (테스트용)
-- ==========================================

-- 샘플 예약 데이터 (필요시 주석 해제)
/*
INSERT INTO bookings (
  customer_profile_id,
  name,
  phone,
  date,
  time,
  club,
  service_type,
  email,
  current_distance,
  age_group,
  status,
  location,
  duration
) VALUES (
  NULL,
  '홍길동',
  '010-1234-5678',
  CURRENT_DATE + INTERVAL '7 days',
  '14:00',
  '드라이버',
  'KGFA 1급 시타 체험하기',
  'hong@example.com',
  250,
  '30대',
  'pending',
  'Massgoo Studio',
  60
);
*/

-- ==========================================
-- 완료 메시지
-- ==========================================
SELECT 'Phase 6 데이터베이스 스키마 확장 완료!' AS message;

