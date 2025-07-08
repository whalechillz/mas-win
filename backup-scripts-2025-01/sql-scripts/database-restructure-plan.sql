-- ====================================
-- MASGOLF 데이터베이스 구조 정비 계획
-- 고객 퍼스널라이제이션을 위한 통합 설계
-- ====================================

-- 1. 고객 마스터 테이블 (중앙 관리)
CREATE TABLE IF NOT EXISTS customers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    phone VARCHAR(20) UNIQUE NOT NULL,  -- 전화번호를 고유 식별자로
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255),
    birth_year INTEGER,
    gender VARCHAR(10),
    golf_experience_years INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- 마케팅 동의
    marketing_consent BOOLEAN DEFAULT false,
    marketing_consent_date TIMESTAMPTZ,
    
    -- 고객 등급/상태
    customer_grade VARCHAR(20) DEFAULT 'BRONZE', -- BRONZE, SILVER, GOLD, VIP
    is_active BOOLEAN DEFAULT true,
    last_contact_date DATE,
    
    -- 추가 인덱스
    INDEX idx_phone (phone),
    INDEX idx_created_at (created_at)
);

-- 2. 고객 골프 프로필 (퍼스널라이제이션 핵심)
CREATE TABLE IF NOT EXISTS customer_golf_profiles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
    
    -- 스윙 스타일 & 플레이 성향
    swing_style VARCHAR(50), -- 안정형, 파워형, 복합형
    play_priority VARCHAR(50), -- 비거리, 방향성, 편안함
    
    -- 현재 실력
    current_distance INTEGER,
    average_score INTEGER,
    handicap DECIMAL(3,1),
    
    -- 신체 정보 (클럽 피팅용)
    height INTEGER,
    arm_length INTEGER,
    swing_speed DECIMAL(4,1),
    
    -- 추천 스펙
    recommended_flex VARCHAR(20),
    recommended_cpm INTEGER,
    recommended_loft DECIMAL(3,1),
    recommended_lie DECIMAL(3,1),
    
    -- 기대 성과
    expected_distance INTEGER,
    expected_improvement VARCHAR(255),
    
    -- 현재 사용 장비
    current_driver_brand VARCHAR(100),
    current_driver_model VARCHAR(100),
    satisfaction_level INTEGER, -- 1-5
    pain_points TEXT[], -- 배열로 저장 ['비거리 부족', '슬라이스']
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(customer_id),
    INDEX idx_customer_id (customer_id)
);

-- 3. 퀴즈 응답 이력 (모든 퀴즈 기록 보존)
CREATE TABLE IF NOT EXISTS quiz_responses (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    customer_id UUID REFERENCES customers(id),
    session_id VARCHAR(100),
    
    -- 퀴즈 응답
    swing_style VARCHAR(50),
    priority VARCHAR(50),
    current_distance INTEGER,
    
    -- 추천 결과
    recommended_product VARCHAR(100),
    recommended_flex VARCHAR(20),
    expected_distance INTEGER,
    
    -- 세션 정보
    ip_address VARCHAR(45),
    user_agent TEXT,
    referrer VARCHAR(255),
    utm_source VARCHAR(100),
    utm_medium VARCHAR(100),
    utm_campaign VARCHAR(100),
    
    completed_at TIMESTAMPTZ DEFAULT NOW(),
    
    INDEX idx_customer_id (customer_id),
    INDEX idx_session_id (session_id),
    INDEX idx_completed_at (completed_at)
);

-- 4. 예약 정보 (기존 테이블 확장)
ALTER TABLE bookings 
ADD COLUMN IF NOT EXISTS customer_id UUID REFERENCES customers(id),
ADD COLUMN IF NOT EXISTS quiz_response_id UUID REFERENCES quiz_responses(id),
ADD COLUMN IF NOT EXISTS booking_source VARCHAR(50), -- 'quiz', 'direct', 'phone'
ADD COLUMN IF NOT EXISTS booking_status VARCHAR(20) DEFAULT 'pending', -- pending, confirmed, completed, cancelled
ADD COLUMN IF NOT EXISTS visited_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS purchase_amount INTEGER,
ADD COLUMN IF NOT EXISTS purchased_products TEXT[],
ADD COLUMN IF NOT EXISTS notes TEXT;

-- 5. 문의/상담 이력 (기존 테이블 확장)
ALTER TABLE contacts
ADD COLUMN IF NOT EXISTS customer_id UUID REFERENCES customers(id),
ADD COLUMN IF NOT EXISTS quiz_response_id UUID REFERENCES quiz_responses(id),
ADD COLUMN IF NOT EXISTS contact_type VARCHAR(50), -- 'quiz', 'general', 'support'
ADD COLUMN IF NOT EXISTS contact_status VARCHAR(20) DEFAULT 'new', -- new, in_progress, completed
ADD COLUMN IF NOT EXISTS assigned_to VARCHAR(100),
ADD COLUMN IF NOT EXISTS follow_up_date DATE,
ADD COLUMN IF NOT EXISTS conversation_notes TEXT[];

-- 6. 구매 이력 테이블 (신규)
CREATE TABLE IF NOT EXISTS purchases (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
    booking_id UUID REFERENCES bookings(id),
    
    -- 구매 정보
    purchase_date DATE NOT NULL,
    product_name VARCHAR(200) NOT NULL,
    product_category VARCHAR(50), -- driver, iron, etc
    product_price INTEGER NOT NULL,
    discount_amount INTEGER DEFAULT 0,
    final_amount INTEGER NOT NULL,
    
    -- 사은품
    gift_items TEXT[],
    
    -- 커스터마이징 스펙
    custom_flex VARCHAR(20),
    custom_loft DECIMAL(3,1),
    custom_lie DECIMAL(3,1),
    custom_length DECIMAL(4,2),
    custom_grip VARCHAR(50),
    custom_shaft VARCHAR(100),
    
    -- 배송/수령
    delivery_method VARCHAR(20), -- store, delivery
    delivery_address TEXT,
    delivered_at TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    INDEX idx_customer_id (customer_id),
    INDEX idx_purchase_date (purchase_date)
);

-- 7. 고객 행동 로그 (웹사이트 활동 추적)
CREATE TABLE IF NOT EXISTS customer_activities (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    customer_id UUID REFERENCES customers(id),
    session_id VARCHAR(100),
    
    activity_type VARCHAR(50), -- page_view, quiz_start, quiz_complete, booking, purchase
    activity_details JSONB,
    page_url VARCHAR(500),
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    INDEX idx_customer_id (customer_id),
    INDEX idx_session_id (session_id),
    INDEX idx_activity_type (activity_type),
    INDEX idx_created_at (created_at)
);

-- 8. 마케팅 캠페인 반응
CREATE TABLE IF NOT EXISTS campaign_responses (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    customer_id UUID REFERENCES customers(id),
    campaign_id VARCHAR(100),
    campaign_name VARCHAR(200),
    
    -- 반응 데이터
    channel VARCHAR(50), -- sms, email, kakao
    action VARCHAR(50), -- sent, opened, clicked, converted
    action_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- 전환 데이터
    converted BOOLEAN DEFAULT false,
    conversion_value INTEGER,
    
    INDEX idx_customer_id (customer_id),
    INDEX idx_campaign_id (campaign_id),
    INDEX idx_action_at (action_at)
);

-- ====================================
-- 데이터 마이그레이션 쿼리
-- ====================================

-- 1. 기존 contacts에서 customers 테이블로 마이그레이션
INSERT INTO customers (phone, name, created_at)
SELECT DISTINCT phone, name, created_at 
FROM contacts 
WHERE phone IS NOT NULL
ON CONFLICT (phone) DO NOTHING;

-- 2. 기존 bookings에서 customers 테이블로 마이그레이션
INSERT INTO customers (phone, name, created_at)
SELECT DISTINCT phone, name, created_at 
FROM bookings 
WHERE phone IS NOT NULL
ON CONFLICT (phone) DO UPDATE SET
    name = EXCLUDED.name,
    last_contact_date = CURRENT_DATE;

-- 3. customer_id 연결
UPDATE bookings b
SET customer_id = c.id
FROM customers c
WHERE b.phone = c.phone;

UPDATE contacts ct
SET customer_id = c.id
FROM customers c
WHERE ct.phone = c.phone;

-- ====================================
-- 뷰(View) 생성 - 퍼스널라이제이션 분석용
-- ====================================

-- 고객 360도 뷰
CREATE OR REPLACE VIEW customer_360_view AS
SELECT 
    c.*,
    cgp.swing_style,
    cgp.current_distance,
    cgp.recommended_flex,
    cgp.expected_distance,
    COUNT(DISTINCT b.id) as total_bookings,
    COUNT(DISTINCT p.id) as total_purchases,
    SUM(p.final_amount) as lifetime_value,
    MAX(b.created_at) as last_booking_date,
    MAX(p.purchase_date) as last_purchase_date
FROM customers c
LEFT JOIN customer_golf_profiles cgp ON c.id = cgp.customer_id
LEFT JOIN bookings b ON c.id = b.customer_id
LEFT JOIN purchases p ON c.id = p.customer_id
GROUP BY c.id, cgp.swing_style, cgp.current_distance, cgp.recommended_flex, cgp.expected_distance;

-- 퍼스널라이제이션 세그먼트 뷰
CREATE OR REPLACE VIEW personalization_segments AS
SELECT 
    customer_id,
    swing_style,
    play_priority,
    current_distance,
    CASE 
        WHEN current_distance < 180 THEN '초급'
        WHEN current_distance < 220 THEN '중급'
        WHEN current_distance < 250 THEN '상급'
        ELSE '프로급'
    END as skill_level,
    CASE
        WHEN expected_distance - current_distance >= 30 THEN '높은 개선 가능성'
        WHEN expected_distance - current_distance >= 20 THEN '중간 개선 가능성'
        ELSE '낮은 개선 가능성'
    END as improvement_potential
FROM customer_golf_profiles;

-- ====================================
-- RLS (Row Level Security) 정책
-- ====================================

ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_golf_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchases ENABLE ROW LEVEL SECURITY;

-- 관리자만 모든 데이터 접근 가능
CREATE POLICY "Admin full access" ON customers
FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

-- ====================================
-- 인덱스 최적화
-- ====================================

-- 퍼스널라이제이션 쿼리 최적화
CREATE INDEX idx_golf_profiles_style_distance 
ON customer_golf_profiles(swing_style, current_distance);

CREATE INDEX idx_quiz_responses_customer_date 
ON quiz_responses(customer_id, completed_at DESC);

-- 마케팅 세그먼트 최적화
CREATE INDEX idx_customers_grade_active 
ON customers(customer_grade, is_active);

-- ====================================
-- 트리거 - 자동 업데이트
-- ====================================

-- 고객 프로필 자동 업데이트
CREATE OR REPLACE FUNCTION update_customer_profile_from_quiz()
RETURNS TRIGGER AS $$
BEGIN
    -- 고객 골프 프로필 업데이트 또는 생성
    INSERT INTO customer_golf_profiles (
        customer_id,
        swing_style,
        play_priority,
        current_distance,
        recommended_flex,
        expected_distance,
        updated_at
    ) VALUES (
        NEW.customer_id,
        NEW.swing_style,
        NEW.priority,
        NEW.current_distance,
        NEW.recommended_flex,
        NEW.expected_distance,
        NOW()
    )
    ON CONFLICT (customer_id) DO UPDATE SET
        swing_style = EXCLUDED.swing_style,
        play_priority = EXCLUDED.play_priority,
        current_distance = EXCLUDED.current_distance,
        recommended_flex = EXCLUDED.recommended_flex,
        expected_distance = EXCLUDED.expected_distance,
        updated_at = NOW();
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profile_after_quiz
AFTER INSERT ON quiz_responses
FOR EACH ROW
WHEN (NEW.customer_id IS NOT NULL)
EXECUTE FUNCTION update_customer_profile_from_quiz();

-- ====================================
-- 분석 쿼리 예시
-- ====================================

-- 1. 스윙 스타일별 평균 구매 금액
SELECT 
    cgp.swing_style,
    COUNT(DISTINCT c.id) as customer_count,
    AVG(p.final_amount) as avg_purchase_amount,
    AVG(cgp.current_distance) as avg_current_distance,
    AVG(cgp.expected_distance - cgp.current_distance) as avg_improvement
FROM customers c
JOIN customer_golf_profiles cgp ON c.id = cgp.customer_id
LEFT JOIN purchases p ON c.id = p.customer_id
GROUP BY cgp.swing_style;

-- 2. 퍼스널라이제이션 추천 성공률
SELECT 
    qr.recommended_product,
    COUNT(DISTINCT qr.customer_id) as recommended_count,
    COUNT(DISTINCT p.customer_id) as purchased_count,
    ROUND(COUNT(DISTINCT p.customer_id)::NUMERIC / COUNT(DISTINCT qr.customer_id) * 100, 2) as conversion_rate
FROM quiz_responses qr
LEFT JOIN purchases p ON qr.customer_id = p.customer_id 
    AND p.product_name LIKE '%' || qr.recommended_product || '%'
GROUP BY qr.recommended_product;

-- 3. 고객 세그먼트별 LTV
SELECT 
    ps.skill_level,
    ps.improvement_potential,
    COUNT(DISTINCT ps.customer_id) as customer_count,
    AVG(cv.lifetime_value) as avg_ltv
FROM personalization_segments ps
JOIN customer_360_view cv ON ps.customer_id = cv.id
GROUP BY ps.skill_level, ps.improvement_potential
ORDER BY avg_ltv DESC;