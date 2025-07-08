-- 개선된 데이터베이스 구조

-- 1. 퀴즈 결과 테이블 (독립적)
CREATE TABLE quiz_results (
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

-- 2. 예약 테이블 (quiz_results 참조)
CREATE TABLE bookings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  quiz_result_id UUID REFERENCES quiz_results(id),
  
  -- 예약 정보
  date DATE NOT NULL,
  time TIME NOT NULL,
  club VARCHAR(100),
  
  -- 상태 관리
  status VARCHAR(50) DEFAULT '대기중',
  memo TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. 문의 테이블 (quiz_results 참조)
CREATE TABLE contacts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  quiz_result_id UUID REFERENCES quiz_results(id),
  
  -- 문의 정보
  inquiry_type VARCHAR(50), -- '상담요청', '제품문의', '기타'
  message TEXT,
  preferred_contact_time VARCHAR(100),
  
  -- 상태 관리
  status VARCHAR(50) DEFAULT '대기중',
  memo TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 인덱스 추가
CREATE INDEX idx_quiz_results_phone ON quiz_results(phone);
CREATE INDEX idx_quiz_results_created_at ON quiz_results(created_at);
CREATE INDEX idx_bookings_quiz_result_id ON bookings(quiz_result_id);
CREATE INDEX idx_contacts_quiz_result_id ON contacts(quiz_result_id);
CREATE INDEX idx_bookings_status ON bookings(status);
CREATE INDEX idx_contacts_status ON contacts(status);

-- 뷰 생성 (조인된 데이터 쉽게 조회)
CREATE VIEW bookings_with_quiz AS
SELECT 
  b.*,
  q.name,
  q.phone,
  q.email,
  q.swing_style,
  q.priority,
  q.current_distance,
  q.recommended_flex,
  q.expected_distance,
  q.campaign_source
FROM bookings b
LEFT JOIN quiz_results q ON b.quiz_result_id = q.id;

CREATE VIEW contacts_with_quiz AS
SELECT 
  c.*,
  q.name,
  q.phone,
  q.email,
  q.swing_style,
  q.priority,
  q.current_distance,
  q.recommended_flex,
  q.expected_distance,
  q.campaign_source
FROM contacts c
LEFT JOIN quiz_results q ON c.quiz_result_id = q.id;
