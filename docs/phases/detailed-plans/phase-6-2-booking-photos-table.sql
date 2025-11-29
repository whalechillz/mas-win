-- Phase 6-2: booking_photos 테이블 생성 (별도 실행)
-- Supabase SQL Editor에서 이 부분만 따로 실행하세요

-- booking_photos 테이블 생성
CREATE TABLE IF NOT EXISTS booking_photos (
  id SERIAL PRIMARY KEY,
  booking_id INTEGER REFERENCES bookings(id) ON DELETE CASCADE,
  customer_profile_id INTEGER,
  
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
  photo_type VARCHAR(50) DEFAULT 'general',
  
  -- 타임스탬프
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_booking_photos_booking ON booking_photos(booking_id);
CREATE INDEX IF NOT EXISTS idx_booking_photos_customer ON booking_photos(customer_profile_id);
CREATE INDEX IF NOT EXISTS idx_booking_photos_type ON booking_photos(photo_type);

-- RLS 활성화
ALTER TABLE booking_photos ENABLE ROW LEVEL SECURITY;

-- RLS 정책 생성 (기존 정책이 있으면 삭제 후 재생성)
DROP POLICY IF EXISTS "Authenticated users can view booking photos" ON booking_photos;
CREATE POLICY "Authenticated users can view booking photos" ON booking_photos
    FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Anyone can insert booking photos" ON booking_photos;
CREATE POLICY "Anyone can insert booking photos" ON booking_photos
    FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated users can update booking photos" ON booking_photos;
CREATE POLICY "Authenticated users can update booking photos" ON booking_photos
    FOR UPDATE USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Authenticated users can delete booking photos" ON booking_photos;
CREATE POLICY "Authenticated users can delete booking photos" ON booking_photos
    FOR DELETE USING (auth.role() = 'authenticated');

