-- Phase 6: 시타 예약 시스템 개선 - 데이터베이스 스키마 확장
-- Wix 데이터 마이그레이션 및 기능 개선을 위한 스키마 변경

-- ==========================================
-- 1. customers 테이블 확장
-- ==========================================

-- 이메일 추가 (메일 서비스용)
ALTER TABLE customers ADD COLUMN IF NOT EXISTS email VARCHAR(255);

-- Wix 등록일 추가
ALTER TABLE customers ADD COLUMN IF NOT EXISTS wix_registered_at TIMESTAMPTZ;

-- 방문 횟수 추가
ALTER TABLE customers ADD COLUMN IF NOT EXISTS visit_count INTEGER DEFAULT 0;

-- 노쇼 횟수 추가
ALTER TABLE customers ADD COLUMN IF NOT EXISTS no_show_count INTEGER DEFAULT 0;

-- 최근 방문일 추가
ALTER TABLE customers ADD COLUMN IF NOT EXISTS last_visit_date DATE;

-- 방문일시 배열 추가 (선택사항)
ALTER TABLE customers ADD COLUMN IF NOT EXISTS visit_dates DATE[];

-- ==========================================
-- 2. bookings 테이블 확장
-- ==========================================

-- 참석 상태 추가 ('attended', 'no_show', 'cancelled', 'pending')
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS attendance_status VARCHAR(20);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_bookings_attendance_status ON bookings(attendance_status);

-- ==========================================
-- 3. booking_blocks 테이블 생성 (예약 불가 시간대)
-- ==========================================

CREATE TABLE IF NOT EXISTS booking_blocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL,
  time TIME NOT NULL,
  duration INTEGER DEFAULT 60, -- 분 단위
  location VARCHAR(100) DEFAULT 'Massgoo Studio',
  reason TEXT, -- 차단 사유
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID, -- 관리자 ID (선택사항)
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_booking_blocks_date_time ON booking_blocks(date, time);
CREATE INDEX IF NOT EXISTS idx_booking_blocks_location ON booking_blocks(location);

-- updated_at 자동 업데이트 트리거
CREATE OR REPLACE FUNCTION update_booking_blocks_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_booking_blocks_updated_at
BEFORE UPDATE ON booking_blocks
FOR EACH ROW
EXECUTE FUNCTION update_booking_blocks_updated_at();

-- RLS 정책 설정
ALTER TABLE booking_blocks ENABLE ROW LEVEL SECURITY;

-- 읽기: 인증된 사용자만
CREATE POLICY "Authenticated users can view booking blocks" ON booking_blocks
  FOR SELECT USING (auth.role() = 'authenticated');

-- 쓰기: 인증된 사용자만
CREATE POLICY "Authenticated users can manage booking blocks" ON booking_blocks
  FOR ALL USING (auth.role() = 'authenticated');

-- ==========================================
-- 4. 뷰 및 함수 생성
-- ==========================================

-- 고객별 예약 통계 뷰
CREATE OR REPLACE VIEW customer_booking_stats AS
SELECT 
  c.id,
  c.name,
  c.phone,
  c.email,
  COUNT(b.id) as total_bookings,
  COUNT(CASE WHEN b.attendance_status = 'attended' THEN 1 END) as attended_count,
  COUNT(CASE WHEN b.attendance_status = 'no_show' THEN 1 END) as no_show_count,
  MAX(b.date) as last_booking_date,
  MIN(b.date) as first_booking_date
FROM customers c
LEFT JOIN bookings b ON c.phone = b.phone
GROUP BY c.id, c.name, c.phone, c.email;

-- ==========================================
-- 5. 유틸리티 함수
-- ==========================================

-- 예약 불가 시간대 확인 함수
CREATE OR REPLACE FUNCTION is_time_blocked(
  p_date DATE,
  p_time TIME,
  p_duration INTEGER DEFAULT 60,
  p_location VARCHAR DEFAULT 'Massgoo Studio'
)
RETURNS BOOLEAN AS $$
DECLARE
  v_block_end TIME;
  v_block_start TIME;
BEGIN
  -- 해당 시간대에 블록이 있는지 확인
  SELECT EXISTS (
    SELECT 1
    FROM booking_blocks
    WHERE date = p_date
      AND location = p_location
      AND (
        -- 블록 시작 시간이 예약 시간 내에 있거나
        (time <= p_time AND time + (duration || ' minutes')::INTERVAL > p_time)
        OR
        -- 예약 시간이 블록 시간 내에 있거나
        (p_time <= time AND p_time + (p_duration || ' minutes')::INTERVAL > time)
      )
  );
END;
$$ LANGUAGE plpgsql;

