-- 1. 테이블이 없을 경우 생성
CREATE TABLE IF NOT EXISTS bookings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    date DATE NOT NULL,
    time TIME NOT NULL,
    club VARCHAR(100),
    status VARCHAR(20) DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS contacts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    call_times TEXT,
    contacted BOOLEAN DEFAULT FALSE,
    contacted_at TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS quiz_results (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    style VARCHAR(50),
    priority VARCHAR(50),
    current_distance INTEGER,
    recommended_product VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ip_address VARCHAR(45),
    user_agent TEXT
);

-- 2. RLS 비활성화 (가장 간단한 해결책)
ALTER TABLE bookings DISABLE ROW LEVEL SECURITY;
ALTER TABLE contacts DISABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_results DISABLE ROW LEVEL SECURITY;

-- 3. 테스트 데이터 입력
INSERT INTO bookings (name, phone, date, time, club, status) VALUES
('홍길동', '010-1234-5678', '2025-01-10', '10:00', '드라이버', 'pending'),
('김철수', '010-2345-6789', '2025-01-11', '14:00', '아이언', 'confirmed'),
('이영희', '010-3456-7890', '2025-01-12', '16:00', '퍼터', 'pending');

INSERT INTO contacts (name, phone, call_times, contacted) VALUES
('박민수', '010-4567-8901', '오전 10시-12시', false),
('정희진', '010-5678-9012', '오후 2시-5시', true),
('최성호', '010-6789-0123', '언제든지', false);