-- 고객 마스터 테이블 생성
CREATE TABLE IF NOT EXISTS customers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    phone VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255),
    birth_year INTEGER,
    gender VARCHAR(10),
    golf_experience_years INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    marketing_consent BOOLEAN DEFAULT false,
    marketing_consent_date TIMESTAMPTZ,
    customer_grade VARCHAR(20) DEFAULT 'BRONZE',
    is_active BOOLEAN DEFAULT true,
    last_contact_date DATE
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone);
CREATE INDEX IF NOT EXISTS idx_customers_created_at ON customers(created_at);

-- 고객 골프 프로필 테이블
CREATE TABLE IF NOT EXISTS customer_golf_profiles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
    swing_style VARCHAR(50),
    play_priority VARCHAR(50),
    current_distance INTEGER,
    average_score INTEGER,
    handicap DECIMAL(3,1),
    height INTEGER,
    arm_length INTEGER,
    swing_speed DECIMAL(4,1),
    recommended_flex VARCHAR(20),
    recommended_cpm INTEGER,
    recommended_loft DECIMAL(3,1),
    recommended_lie DECIMAL(3,1),
    expected_distance INTEGER,
    expected_improvement VARCHAR(255),
    current_driver_brand VARCHAR(100),
    current_driver_model VARCHAR(100),
    satisfaction_level INTEGER,
    pain_points TEXT[],
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(customer_id)
);

CREATE INDEX IF NOT EXISTS idx_golf_profiles_customer_id ON customer_golf_profiles(customer_id);
