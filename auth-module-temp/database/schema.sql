-- 로그인/로그아웃 모듈을 위한 필수 데이터베이스 스키마

-- employees 테이블 (필수)
CREATE TABLE IF NOT EXISTS employees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  phone TEXT UNIQUE NOT NULL,
  email TEXT,
  password_hash TEXT,
  pin_code TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'on_leave', 'resigned')),
  last_login TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_employees_phone ON employees(phone);
CREATE INDEX IF NOT EXISTS idx_employees_employee_id ON employees(employee_id);
CREATE INDEX IF NOT EXISTS idx_employees_status ON employees(status);

-- RLS (Row Level Security) 정책 설정 (선택사항)
-- ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
-- 
-- -- 직원은 자신의 정보만 조회 가능
-- CREATE POLICY "Employees can view own data"
-- ON employees FOR SELECT
-- USING (auth.uid()::text = id::text);

-- 샘플 데이터 (개발용)
-- INSERT INTO employees (employee_id, name, phone, email, password_hash, status)
-- VALUES 
--   ('EMP-001', '홍길동', '010-1234-5678', 'hong@example.com', '12345678', 'active'),
--   ('EMP-002', '김철수', '010-2345-6789', 'kim@example.com', '23456789', 'active');

