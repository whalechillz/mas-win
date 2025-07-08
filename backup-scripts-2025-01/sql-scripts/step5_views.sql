-- 고객 360도 뷰
CREATE OR REPLACE VIEW customer_360_view AS
SELECT 
    c.*,
    cgp.swing_style,
    cgp.current_distance,
    cgp.recommended_flex,
    cgp.expected_distance,
    COUNT(DISTINCT b.id) as total_bookings,
    COUNT(DISTINCT ct.id) as total_contacts,
    MAX(b.created_at) as last_booking_date,
    MAX(ct.created_at) as last_contact_date
FROM customers c
LEFT JOIN customer_golf_profiles cgp ON c.id = cgp.customer_id
LEFT JOIN bookings b ON c.id = b.customer_id
LEFT JOIN contacts ct ON c.id = ct.customer_id
GROUP BY c.id, cgp.swing_style, cgp.current_distance, 
         cgp.recommended_flex, cgp.expected_distance;

-- 퍼스널라이제이션 세그먼트 뷰
CREATE OR REPLACE VIEW personalization_segments AS
SELECT 
    c.id as customer_id,
    c.name,
    c.phone,
    cgp.swing_style,
    cgp.play_priority,
    cgp.current_distance,
    CASE 
        WHEN cgp.current_distance < 180 THEN '초급'
        WHEN cgp.current_distance < 220 THEN '중급'
        WHEN cgp.current_distance < 250 THEN '상급'
        ELSE '프로급'
    END as skill_level,
    CASE
        WHEN cgp.expected_distance - cgp.current_distance >= 30 THEN '높은 개선 가능성'
        WHEN cgp.expected_distance - cgp.current_distance >= 20 THEN '중간 개선 가능성'
        ELSE '낮은 개선 가능성'
    END as improvement_potential,
    c.customer_grade,
    c.is_active
FROM customers c
JOIN customer_golf_profiles cgp ON c.id = cgp.customer_id;

-- 뷰 확인
SELECT * FROM customer_360_view LIMIT 5;
SELECT * FROM personalization_segments LIMIT 5;
