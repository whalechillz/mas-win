-- MAS Golf 7월 캠페인 데이터베이스 구조

-- 시타 예약 테이블
CREATE TABLE bookings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    date DATE NOT NULL,
    time TIME NOT NULL,
    club VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    status VARCHAR(20) DEFAULT 'pending' -- pending, confirmed, cancelled
);

-- 문의 테이블
CREATE TABLE contacts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    call_times TEXT, -- 콤마로 구분된 시간대
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    contacted BOOLEAN DEFAULT FALSE,
    contacted_at TIMESTAMP WITH TIME ZONE,
    notes TEXT
);

-- 퀴즈 결과 저장 (선택사항)
CREATE TABLE quiz_results (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    style VARCHAR(50),
    priority VARCHAR(50),
    current_distance INTEGER,
    recommended_product VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ip_address VARCHAR(45),
    user_agent TEXT
);

-- Row Level Security 활성화
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_results ENABLE ROW LEVEL SECURITY;

-- 정책 생성 (읽기는 인증된 사용자만, 쓰기는 모두 가능)
CREATE POLICY "Anyone can insert bookings" ON bookings
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Authenticated users can view bookings" ON bookings
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Anyone can insert contacts" ON contacts
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Authenticated users can view contacts" ON contacts
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Anyone can insert quiz results" ON quiz_results
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Authenticated users can view quiz results" ON quiz_results
    FOR SELECT USING (auth.role() = 'authenticated');

-- 인덱스 생성
CREATE INDEX idx_bookings_date ON bookings(date);
CREATE INDEX idx_bookings_created_at ON bookings(created_at);
CREATE INDEX idx_contacts_created_at ON contacts(created_at);
CREATE INDEX idx_contacts_contacted ON contacts(contacted);