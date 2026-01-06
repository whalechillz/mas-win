-- ==========================================
-- 고객 상담 이력 및 서비스 이력 테이블 생성
-- ==========================================

-- 1. 상담 이력 테이블
CREATE TABLE IF NOT EXISTS customer_consultations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id INTEGER REFERENCES customers(id) ON DELETE CASCADE,
  
  -- 상담 정보
  consultation_type VARCHAR(50) NOT NULL, -- 'phone', 'visit', 'online', 'survey', 'booking'
  consultation_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  consultant_name VARCHAR(100), -- 담당자 이름
  
  -- 상담 내용
  topic VARCHAR(200), -- 주제 (예: "제품 문의", "시타 예약", "설문 참여")
  content TEXT NOT NULL, -- 상담 내용
  related_survey_id UUID REFERENCES surveys(id) ON DELETE SET NULL,
  related_booking_id INTEGER REFERENCES bookings(id) ON DELETE SET NULL,
  
  -- 메타데이터
  tags TEXT[], -- 태그 (예: ['제품문의', '시타예약', '관심제품'])
  follow_up_required BOOLEAN DEFAULT false,
  follow_up_date DATE,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_consultations_customer ON customer_consultations(customer_id);
CREATE INDEX IF NOT EXISTS idx_consultations_date ON customer_consultations(consultation_date);
CREATE INDEX IF NOT EXISTS idx_consultations_type ON customer_consultations(consultation_type);
CREATE INDEX IF NOT EXISTS idx_consultations_survey ON customer_consultations(related_survey_id);
CREATE INDEX IF NOT EXISTS idx_consultations_booking ON customer_consultations(related_booking_id);

-- 2. 서비스 이력 테이블
CREATE TABLE IF NOT EXISTS customer_services (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id INTEGER REFERENCES customers(id) ON DELETE CASCADE,
  
  -- 서비스 정보
  service_type VARCHAR(50) NOT NULL, -- 'repair', 'trade_in', 'rental', 'purchase', 'refund', 'exchange'
  service_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  service_staff VARCHAR(100), -- 담당 직원
  
  -- 서비스 내용
  description TEXT NOT NULL, -- 서비스 설명
  amount INTEGER, -- 금액 (보상, 구매 등)
  payment_method VARCHAR(50), -- 'cash', 'card', 'transfer', 'trade_in'
  account_info TEXT, -- 계좌 정보 (송금 시)
  
  -- 관련 정보
  related_product_id INTEGER REFERENCES products(id) ON DELETE SET NULL,
  related_booking_id INTEGER REFERENCES bookings(id) ON DELETE SET NULL,
  notes TEXT, -- 추가 메모
  
  -- 상태
  status VARCHAR(20) DEFAULT 'completed', -- 'pending', 'in_progress', 'completed', 'cancelled'
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_services_customer ON customer_services(customer_id);
CREATE INDEX IF NOT EXISTS idx_services_date ON customer_services(service_date);
CREATE INDEX IF NOT EXISTS idx_services_type ON customer_services(service_type);
CREATE INDEX IF NOT EXISTS idx_services_booking ON customer_services(related_booking_id);

-- 3. updated_at 자동 업데이트 트리거 함수 (이미 있으면 무시)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 트리거 생성
DROP TRIGGER IF EXISTS update_consultations_updated_at ON customer_consultations;
CREATE TRIGGER update_consultations_updated_at
    BEFORE UPDATE ON customer_consultations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_services_updated_at ON customer_services;
CREATE TRIGGER update_services_updated_at
    BEFORE UPDATE ON customer_services
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 4. RLS 정책 설정
ALTER TABLE customer_consultations ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_services ENABLE ROW LEVEL SECURITY;

-- 인증된 사용자만 조회/수정 가능
CREATE POLICY "Enable select for authenticated users" ON customer_consultations
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Enable insert for authenticated users" ON customer_consultations
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update for authenticated users" ON customer_consultations
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Enable delete for authenticated users" ON customer_consultations
  FOR DELETE USING (auth.role() = 'authenticated');

CREATE POLICY "Enable select for authenticated users" ON customer_services
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Enable insert for authenticated users" ON customer_services
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update for authenticated users" ON customer_services
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Enable delete for authenticated users" ON customer_services
  FOR DELETE USING (auth.role() = 'authenticated');

