-- 시타 예약 테이블
CREATE TABLE bookings (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  date DATE NOT NULL,
  time TIME NOT NULL,
  club VARCHAR(100) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- 문의 테이블
CREATE TABLE contacts (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  call_times TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- RLS (Row Level Security) 활성화
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;

-- 읽기/쓰기 정책 추가 (모든 사용자 허용 - 실제로는 더 엄격하게 설정)
CREATE POLICY "Enable insert for all users" ON bookings
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable select for all users" ON bookings
  FOR SELECT USING (true);

CREATE POLICY "Enable insert for all users" ON contacts
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable select for all users" ON contacts
  FOR SELECT USING (true);
