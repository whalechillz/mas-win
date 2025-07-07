-- 1. 스윙 스타일별 고객 분포
SELECT 
    swing_style, 
    COUNT(*) as customer_count,
    AVG(current_distance) as avg_distance
FROM personalization_segments
GROUP BY swing_style;

-- 2. 개선 가능성이 높은 고객 찾기
SELECT 
    name, 
    phone, 
    current_distance,
    expected_distance,
    improvement_potential
FROM personalization_segments
WHERE improvement_potential = '높은 개선 가능성'
ORDER BY expected_distance - current_distance DESC;

-- 3. 비활성 고객 재활성화 대상
SELECT 
    c.name,
    c.phone,
    c.last_contact_date,
    cgp.swing_style,
    cgp.recommended_flex
FROM customers c
JOIN customer_golf_profiles cgp ON c.id = cgp.customer_id
WHERE c.last_contact_date < CURRENT_DATE - INTERVAL '30 days'
AND c.is_active = true;
