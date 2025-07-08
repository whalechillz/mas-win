-- 현재 상황 확인 및 단계별 해결

-- 1. 현재 컬럼 타입 확인
SELECT 
    table_name,
    column_name,
    data_type
FROM information_schema.columns
WHERE table_schema = 'public' 
AND column_name IN ('current_distance', 'expected_distance')
AND table_name IN ('bookings', 'contacts', 'quiz_results')
ORDER BY table_name, column_name;

-- 2. 기존 뷰 삭제 (CASCADE로 의존성도 함께 삭제)
DROP VIEW IF EXISTS bookings_with_quiz CASCADE;
DROP VIEW IF EXISTS contacts_with_quiz CASCADE;  
DROP VIEW IF EXISTS quiz_conversion_stats CASCADE;

-- 3. bookings 테이블 컬럼 타입 확인 및 변경
-- current_distance가 integer라면 varchar로 변경
DO $$ 
BEGIN
    -- current_distance 타입 변경
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'bookings' 
        AND column_name = 'current_distance'
        AND data_type = 'integer'
    ) THEN
        ALTER TABLE bookings 
        ALTER COLUMN current_distance TYPE VARCHAR(50) 
        USING current_distance::VARCHAR;
    END IF;
    
    -- expected_distance 타입 변경
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'bookings' 
        AND column_name = 'expected_distance'
        AND data_type = 'integer'
    ) THEN
        ALTER TABLE bookings 
        ALTER COLUMN expected_distance TYPE VARCHAR(50) 
        USING expected_distance::VARCHAR;
    END IF;
END $$;

-- 4. 뷰 생성
CREATE VIEW bookings_with_quiz AS
SELECT 
  b.*,
  q.email as quiz_email,
  COALESCE(q.name, b.name) as display_name,
  COALESCE(q.phone, b.phone) as display_phone,
  COALESCE(q.swing_style, b.swing_style) as display_swing_style,
  COALESCE(q.priority, b.priority) as display_priority,
  COALESCE(q.current_distance, b.current_distance) as display_current_distance,
  COALESCE(q.recommended_flex, b.recommended_flex) as display_recommended_flex,
  COALESCE(q.expected_distance, b.expected_distance) as display_expected_distance,
  COALESCE(q.campaign_source, b.campaign_source) as display_campaign_source
FROM bookings b
LEFT JOIN quiz_results q ON b.quiz_result_id = q.id;

-- 5. 다른 뷰들도 생성
CREATE VIEW contacts_with_quiz AS
SELECT 
  c.*,
  q.email as quiz_email,
  q.swing_style as quiz_swing_style,
  q.priority as quiz_priority,
  q.current_distance as quiz_current_distance,
  q.recommended_flex as quiz_recommended_flex,
  q.expected_distance as quiz_expected_distance,
  q.campaign_source as quiz_campaign_source
FROM contacts c
LEFT JOIN quiz_results q ON c.quiz_result_id = q.id;

CREATE VIEW quiz_conversion_stats AS
SELECT 
  COUNT(DISTINCT q.id) as total_quiz_completed,
  COUNT(DISTINCT b.quiz_result_id) as quiz_to_booking,
  COUNT(DISTINCT c.quiz_result_id) as quiz_to_contact,
  CASE 
    WHEN COUNT(DISTINCT q.id) > 0 
    THEN ROUND(COUNT(DISTINCT b.quiz_result_id)::numeric / COUNT(DISTINCT q.id) * 100, 2) 
    ELSE 0 
  END as booking_conversion_rate,
  CASE 
    WHEN COUNT(DISTINCT c.quiz_result_id) > 0 
    THEN ROUND(COUNT(DISTINCT c.quiz_result_id)::numeric / COUNT(DISTINCT q.id) * 100, 2) 
    ELSE 0 
  END as contact_conversion_rate
FROM quiz_results q
LEFT JOIN bookings b ON q.id = b.quiz_result_id
LEFT JOIN contacts c ON q.id = c.quiz_result_id;

-- 6. 확인
SELECT 'Views created successfully!' as status;
