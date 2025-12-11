-- MASSGOO X MUZIIK 설문 조사 테이블 생성
-- Supabase SQL Editor에서 실행

-- surveys 테이블 생성
CREATE TABLE IF NOT EXISTS surveys (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- 고객 정보
  name VARCHAR(100) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  age INTEGER,
  age_group VARCHAR(20), -- 20대, 30대, 40대, 50대, 60대, 70대, 80대 이상
  address TEXT NOT NULL,
  
  -- 설문 응답
  selected_model VARCHAR(100) NOT NULL, -- 선택한 모델
  important_factors TEXT[], -- 중요 요소 배열 (비거리, 방향성, 타구감)
  additional_feedback TEXT, -- 추가 의견
  
  -- 고객 연결
  customer_id INTEGER REFERENCES customers(id),
  
  -- 메타데이터
  campaign_source VARCHAR(100) DEFAULT 'muziik-survey-2025',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_surveys_phone ON surveys(phone);
CREATE INDEX IF NOT EXISTS idx_surveys_customer_id ON surveys(customer_id);
CREATE INDEX IF NOT EXISTS idx_surveys_created_at ON surveys(created_at);
CREATE INDEX IF NOT EXISTS idx_surveys_selected_model ON surveys(selected_model);

-- RLS 정책 설정
ALTER TABLE surveys ENABLE ROW LEVEL SECURITY;

-- 모든 사용자가 설문 제출 가능
CREATE POLICY "Enable insert for all users" ON surveys
  FOR INSERT WITH CHECK (true);

-- 인증된 사용자만 조회 가능 (관리자)
CREATE POLICY "Enable select for authenticated users" ON surveys
  FOR SELECT USING (auth.role() = 'authenticated');

-- 인증된 사용자만 수정 가능
CREATE POLICY "Enable update for authenticated users" ON surveys
  FOR UPDATE USING (auth.role() = 'authenticated');

-- 인증된 사용자만 삭제 가능
CREATE POLICY "Enable delete for authenticated users" ON surveys
  FOR DELETE USING (auth.role() = 'authenticated');

