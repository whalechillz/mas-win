-- 즉시 적용 가능한 최소 수정
-- 5분 안에 오류 해결 + 기본 퍼스널라이제이션 구축

-- 1. 오류 해결 (필수)
ALTER TABLE bookings 
ADD COLUMN IF NOT EXISTS swing_style VARCHAR(50),
ADD COLUMN IF NOT EXISTS priority VARCHAR(50),
ADD COLUMN IF NOT EXISTS current_distance INTEGER,
ADD COLUMN IF NOT EXISTS recommended_flex VARCHAR(20),
ADD COLUMN IF NOT EXISTS expected_distance INTEGER;

ALTER TABLE contacts
ADD COLUMN IF NOT EXISTS swing_style VARCHAR(50),
ADD COLUMN IF NOT EXISTS priority VARCHAR(50),
ADD COLUMN IF NOT EXISTS current_distance INTEGER,
ADD COLUMN IF NOT EXISTS recommended_flex VARCHAR(20),
ADD COLUMN IF NOT EXISTS expected_distance INTEGER;

-- 2. 간단한 고객 통합 뷰 (선택)
CREATE OR REPLACE VIEW customer_quick_view AS
SELECT 
    phone,
    MAX(name) as name,
    MAX(swing_style) as swing_style,
    MAX(current_distance) as current_distance,
    MAX(recommended_flex) as recommended_flex,
    COUNT(DISTINCT CASE WHEN source = 'booking' THEN id END) as booking_count,
    COUNT(DISTINCT CASE WHEN source = 'contact' THEN id END) as contact_count,
    MAX(created_at) as last_activity
FROM (
    SELECT id, phone, name, swing_style, current_distance, recommended_flex, created_at, 'booking' as source
    FROM bookings WHERE phone IS NOT NULL
    UNION ALL
    SELECT id, phone, name, swing_style, current_distance, recommended_flex, created_at, 'contact' as source
    FROM contacts WHERE phone IS NOT NULL
) combined
GROUP BY phone;

-- 3. 퍼스널라이제이션 기본 쿼리
-- 스윙 스타일별 통계
SELECT 
    swing_style,
    COUNT(DISTINCT phone) as customer_count,
    AVG(current_distance) as avg_distance,
    MIN(current_distance) as min_distance,
    MAX(current_distance) as max_distance
FROM customer_quick_view
WHERE swing_style IS NOT NULL
GROUP BY swing_style;

-- 재방문 고객 찾기
SELECT 
    phone,
    name,
    swing_style,
    current_distance,
    booking_count + contact_count as total_interactions
FROM customer_quick_view
WHERE booking_count + contact_count > 1
ORDER BY last_activity DESC;