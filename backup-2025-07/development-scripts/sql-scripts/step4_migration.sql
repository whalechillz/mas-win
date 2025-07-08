-- 기존 데이터를 새 구조로 마이그레이션

-- 1. contacts에서 고객 정보 추출
INSERT INTO customers (phone, name, created_at)
SELECT DISTINCT 
    phone, 
    name, 
    MIN(created_at) as created_at
FROM contacts 
WHERE phone IS NOT NULL AND name IS NOT NULL
GROUP BY phone, name
ON CONFLICT (phone) DO NOTHING;

-- 2. bookings에서 고객 정보 추출
INSERT INTO customers (phone, name, created_at)
SELECT DISTINCT 
    phone, 
    name, 
    MIN(created_at) as created_at
FROM bookings 
WHERE phone IS NOT NULL AND name IS NOT NULL
GROUP BY phone, name
ON CONFLICT (phone) DO UPDATE SET
    name = EXCLUDED.name,
    last_contact_date = CURRENT_DATE;

-- 3. 기존 테이블에 customer_id 연결
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS customer_id UUID REFERENCES customers(id);
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS customer_id UUID REFERENCES customers(id);

UPDATE bookings b
SET customer_id = c.id
FROM customers c
WHERE b.phone = c.phone;

UPDATE contacts ct
SET customer_id = c.id
FROM customers c
WHERE ct.phone = c.phone;

-- 4. 퀴즈 데이터를 골프 프로필로 마이그레이션
INSERT INTO customer_golf_profiles (
    customer_id,
    swing_style,
    play_priority,
    current_distance,
    recommended_flex,
    expected_distance
)
SELECT DISTINCT ON (c.id)
    c.id,
    COALESCE(b.swing_style, ct.swing_style),
    COALESCE(b.priority, ct.priority),
    COALESCE(b.current_distance, ct.current_distance),
    COALESCE(b.recommended_flex, ct.recommended_flex),
    COALESCE(b.expected_distance, ct.expected_distance)
FROM customers c
LEFT JOIN bookings b ON c.id = b.customer_id
LEFT JOIN contacts ct ON c.id = ct.customer_id
WHERE (b.swing_style IS NOT NULL OR ct.swing_style IS NOT NULL)
ON CONFLICT (customer_id) DO UPDATE SET
    swing_style = EXCLUDED.swing_style,
    play_priority = EXCLUDED.play_priority,
    current_distance = EXCLUDED.current_distance,
    recommended_flex = EXCLUDED.recommended_flex,
    expected_distance = EXCLUDED.expected_distance,
    updated_at = NOW();

-- 마이그레이션 결과 확인
SELECT 
    'customers' as table_name, COUNT(*) as count 
FROM customers
UNION ALL
SELECT 
    'customer_golf_profiles', COUNT(*) 
FROM customer_golf_profiles
UNION ALL
SELECT 
    'bookings with customer_id', COUNT(*) 
FROM bookings 
WHERE customer_id IS NOT NULL;
