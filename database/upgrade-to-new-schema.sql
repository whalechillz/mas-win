-- 마쓰구(MASGOLF) 데이터베이스 고도화 스크립트
-- 기존 테이블 삭제 후 새로운 3개 테이블 생성

-- 1. 기존 테이블 삭제 (존재하는 경우)
DROP TABLE IF EXISTS contacts CASCADE;
DROP TABLE IF EXISTS bookings CASCADE;
DROP TABLE IF EXISTS quiz_results CASCADE;

-- 2. 새로운 고객 프로필 테이블 생성
CREATE TABLE customer_profiles (
  id SERIAL PRIMARY KEY,
  phone VARCHAR(20) UNIQUE NOT NULL,
  name VARCHAR(100),
  
  -- 기본 정보
  age_group VARCHAR(20),           -- 연령대 (40대, 50대, 60대, 70대, 80대+)
  
  -- 현재 상황 (퀴즈 결과)
  current_distance INTEGER,         -- 현재 비거리 (m)
  current_club_brand VARCHAR(100), -- 현재 사용클럽 브랜드
  current_club_spec_raw VARCHAR(20), -- 원본 입력 (10.5R, 9S 등)
  current_shaft_flex VARCHAR(10),    -- 파싱된 샤프트 (R1/R2/R/SR/S)
  current_head_angle INTEGER,        -- 파싱된 각도 (도)
  ball_speed INTEGER,              -- 볼스피드 (m/s)
  
  -- 골프 스타일 (퀴즈 결과)
  swing_style VARCHAR(50),         -- 스윙 스타일
  ball_flight VARCHAR(50),         -- 볼 플라이트
  priority VARCHAR(50),            -- 중요 요소
  
  -- 페이스 타입 선호도 (퀴즈 결과)
  tee_height_preference VARCHAR(20), -- 티 높이 선호 (40mm/45mm/50mm)
  ball_flight_preference VARCHAR(20), -- 볼 플라이트 선호 (고탄도/중탄도/저탄도)
  control_need VARCHAR(50),        -- 컨트롤 요구사항 (구질컨트롤/스핀량컨트롤/방향성컨트롤)
  
  -- 원하는 것 (퀴즈 결과)
  desired_distance INTEGER,        -- 원하는 비거리 (m)
  desired_direction VARCHAR(50),   -- 원하는 방향성
  desired_shaft_flex VARCHAR(10),  -- 원하는 샤프트 (R2/R1/R/SR/S)
  desired_head_angle INTEGER,      -- 원하는 각도 (도)
  desired_spec_adjustment JSONB,   -- 스펙조정 (클럽웨이트, 길이, 그립굵기)
  desired_impact_feel VARCHAR(50), -- 타구감/타구음
  
  -- 추천 정보 (퀴즈 결과)
  recommended_club VARCHAR(100),   -- 추천 클럽
  recommended_flex VARCHAR(10),    -- 추천 플렉스 (R1/R2/R/SR/S)
  recommended_head_angle INTEGER,  -- 추천 각도 (도)
  improvement_potential INTEGER,   -- 개선 가능성 (m)
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. 새로운 문의하기 테이블 생성
CREATE TABLE contacts (
  id SERIAL PRIMARY KEY,
  customer_profile_id INTEGER REFERENCES customer_profiles(id),
  name VARCHAR(100) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  call_times TEXT,                 -- 연락 가능 시간
  inquiry_type VARCHAR(50),        -- 문의 유형
  notes TEXT,                     -- 추가 메모
  status VARCHAR(20) DEFAULT 'new', -- new/contacted/completed
  contacted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. 새로운 시타예약 테이블 생성
CREATE TABLE bookings (
  id SERIAL PRIMARY KEY,
  customer_profile_id INTEGER REFERENCES customer_profiles(id),
  name VARCHAR(100) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  date DATE NOT NULL,
  time TIME NOT NULL,
  club VARCHAR(100) NOT NULL,      -- 희망 클럽
  status VARCHAR(20) DEFAULT 'pending', -- pending/confirmed/completed/cancelled
  notes TEXT,                     -- 예약 메모
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. 인덱스 생성 (성능 최적화)
CREATE INDEX idx_customer_profiles_phone ON customer_profiles(phone);
CREATE INDEX idx_contacts_phone ON contacts(phone);
CREATE INDEX idx_contacts_status ON contacts(status);
CREATE INDEX idx_bookings_date ON bookings(date);
CREATE INDEX idx_bookings_status ON bookings(status);

-- 6. RLS (Row Level Security) 정책 설정
ALTER TABLE customer_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

-- 모든 사용자에게 읽기/쓰기 권한 부여
CREATE POLICY "Enable read access for all users" ON customer_profiles FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON customer_profiles FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON customer_profiles FOR UPDATE USING (true);

CREATE POLICY "Enable read access for all users" ON contacts FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON contacts FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON contacts FOR UPDATE USING (true);

CREATE POLICY "Enable read access for all users" ON bookings FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON bookings FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON bookings FOR UPDATE USING (true);

-- 7. 완료 메시지
SELECT '데이터베이스 고도화 완료!' as status; 