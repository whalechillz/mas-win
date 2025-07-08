-- STEP 1: 새로운 테이블 구조 생성 (수정됨)
-- 기존 테이블에 누락된 컬럼 먼저 추가

-- 1-1. bookings 테이블에 누락된 컬럼 추가
ALTER TABLE bookings 
ADD COLUMN IF NOT EXISTS quiz_result_id UUID,
ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT '대기중',
ADD COLUMN IF NOT EXISTS memo TEXT;

-- 1-2. contacts 테이블에 quiz_result_id 추가
ALTER TABLE contacts 
ADD COLUMN IF NOT EXISTS quiz_result_id UUID;

-- 2. 퀴즈 결과 테이블 생성
CREATE TABLE IF NOT EXISTS quiz_results (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  -- 고객 정보
  name VARCHAR(100) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  email VARCHAR(255),
  
  -- 퀴즈 결과
  swing_style VARCHAR(50),
  priority VARCHAR(100),
  current_distance VARCHAR(50),
  recommended_flex VARCHAR(50),
  expected_distance VARCHAR(50),
  recommended_club VARCHAR(100),
  
  -- 추적 정보
  campaign_source VARCHAR(100),
  utm_source VARCHAR(100),
  utm_medium VARCHAR(100),
  utm_campaign VARCHAR(100),
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. 외래키 제약조건 추가
ALTER TABLE bookings 
ADD CONSTRAINT fk_bookings_quiz_result 
FOREIGN KEY (quiz_result_id) 
REFERENCES quiz_results(id);

ALTER TABLE contacts 
ADD CONSTRAINT fk_contacts_quiz_result 
FOREIGN KEY (quiz_result_id) 
REFERENCES quiz_results(id);

-- 4. 인덱스 추가
CREATE INDEX IF NOT EXISTS idx_quiz_results_phone ON quiz_results(phone);
CREATE INDEX IF NOT EXISTS idx_quiz_results_created_at ON quiz_results(created_at);
CREATE INDEX IF NOT EXISTS idx_bookings_quiz_result_id ON bookings(quiz_result_id);
CREATE INDEX IF NOT EXISTS idx_contacts_quiz_result_id ON contacts(quiz_result_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);

-- 5. RLS 정책 추가
ALTER TABLE quiz_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable insert for all users" ON quiz_results
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable select for all users" ON quiz_results
  FOR SELECT USING (true);

CREATE POLICY "Enable update for all users" ON quiz_results
  FOR UPDATE USING (true);

-- 6. 유용한 뷰 생성 (이제 memo 컬럼이 있으므로 에러 없음)
CREATE OR REPLACE VIEW bookings_with_quiz AS
SELECT 
  b.id,
  b.date,
  b.time,
  b.club,
  b.status,
  b.memo,
  b.created_at,
  b.quiz_result_id,
  COALESCE(q.name, b.name) as name,
  COALESCE(q.phone, b.phone) as phone,
  q.email,
  COALESCE(q.swing_style, b.swing_style) as swing_style,
  COALESCE(q.priority, b.priority) as priority,
  COALESCE(q.current_distance, b.current_distance) as current_distance,
  COALESCE(q.recommended_flex, b.recommended_flex) as recommended_flex,
  COALESCE(q.expected_distance, b.expected_distance) as expected_distance,
  COALESCE(q.campaign_source, b.campaign_source) as campaign_source
FROM bookings b
LEFT JOIN quiz_results q ON b.quiz_result_id = q.id;

CREATE OR REPLACE VIEW contacts_with_quiz AS
SELECT 
  c.id,
  c.call_times,
  c.created_at,
  c.quiz_result_id,
  COALESCE(q.name, c.name) as name,
  COALESCE(q.phone, c.phone) as phone,
  q.email,
  q.swing_style,
  q.priority,
  q.current_distance,
  q.recommended_flex,
  q.expected_distance,
  q.campaign_source
FROM contacts c
LEFT JOIN quiz_results q ON c.quiz_result_id = q.id;

-- 7. 통계 뷰
CREATE OR REPLACE VIEW quiz_conversion_stats AS
SELECT 
  COUNT(DISTINCT q.id) as total_quiz_completed,
  COUNT(DISTINCT b.quiz_result_id) as quiz_to_booking,
  COUNT(DISTINCT c.quiz_result_id) as quiz_to_contact,
  CASE 
    WHEN COUNT(DISTINCT q.id) > 0 
    THEN ROUND(COUNT(DISTINCT b.quiz_result_id)::numeric / COUNT(DISTINCT q.id) * 100, 2) 
    ELSE 0 
  END as booking_conversion_rate,
  CASE 
    WHEN COUNT(DISTINCT q.id) > 0 
    THEN ROUND(COUNT(DISTINCT c.quiz_result_id)::numeric / COUNT(DISTINCT q.id) * 100, 2) 
    ELSE 0 
  END as contact_conversion_rate
FROM quiz_results q
LEFT JOIN bookings b ON q.id = b.quiz_result_id
LEFT JOIN contacts c ON q.id = c.quiz_result_id;
