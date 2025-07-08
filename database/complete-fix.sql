-- 모든 문제를 해결하는 완전한 스크립트

-- 1. 모든 뷰 삭제 (의존성 때문에 CASCADE 필수)
DROP VIEW IF EXISTS bookings_with_quiz CASCADE;
DROP VIEW IF EXISTS contacts_with_quiz CASCADE;
DROP VIEW IF EXISTS quiz_conversion_stats CASCADE;
DROP VIEW IF EXISTS customer_quick_view CASCADE;

-- 2. 현재 컬럼 타입 확인
SELECT 
    table_name,
    column_name,
    data_type
FROM information_schema.columns
WHERE table_schema = 'public' 
AND column_name IN ('current_distance', 'expected_distance')
AND table_name IN ('bookings', 'contacts')
ORDER BY table_name, column_name;

-- 3. bookings 테이블의 컬럼 타입 변경
ALTER TABLE bookings 
ALTER COLUMN current_distance TYPE VARCHAR(50) USING COALESCE(current_distance::VARCHAR, '');

ALTER TABLE bookings 
ALTER COLUMN expected_distance TYPE VARCHAR(50) USING COALESCE(expected_distance::VARCHAR, '');

-- 4. contacts 테이블에 해당 컬럼이 있는지 확인하고 있다면 타입 변경
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'contacts' 
        AND column_name = 'current_distance'
    ) THEN
        ALTER TABLE contacts 
        ALTER COLUMN current_distance TYPE VARCHAR(50) 
        USING COALESCE(current_distance::VARCHAR, '');
    END IF;
END $$;

-- 5. bookings_with_quiz 뷰 생성
CREATE VIEW bookings_with_quiz AS
SELECT 
  b.id,
  b.date,
  b.time,
  b.club,
  b.status,
  b.memo,
  b.created_at,
  b.quiz_result_id,
  COALESCE(q.name, b.name) as name,
  COALESCE(q.phone, b.phone) as phone,
  q.email,
  COALESCE(q.swing_style, b.swing_style) as swing_style,
  COALESCE(q.priority, b.priority) as priority,
  COALESCE(q.current_distance, b.current_distance) as current_distance,
  COALESCE(q.recommended_flex, b.recommended_flex) as recommended_flex,
  COALESCE(q.expected_distance, b.expected_distance) as expected_distance,
  COALESCE(q.campaign_source, b.campaign_source) as campaign_source
FROM bookings b
LEFT JOIN quiz_results q ON b.quiz_result_id = q.id;

-- 6. contacts_with_quiz 뷰 생성
CREATE VIEW contacts_with_quiz AS
SELECT 
  c.id,
  c.call_times,
  c.created_at,
  c.quiz_result_id,
  COALESCE(q.name, c.name) as name,
  COALESCE(q.phone, c.phone) as phone,
  q.email,
  q.swing_style,
  q.priority,
  q.current_distance,
  q.recommended_flex,
  q.expected_distance,
  q.campaign_source
FROM contacts c
LEFT JOIN quiz_results q ON c.quiz_result_id = q.id;

-- 7. 통계 뷰 생성
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
    WHEN COUNT(DISTINCT q.id) > 0 
    THEN ROUND(COUNT(DISTINCT c.quiz_result_id)::numeric / COUNT(DISTINCT q.id) * 100, 2) 
    ELSE 0 
  END as contact_conversion_rate
FROM quiz_results q
LEFT JOIN bookings b ON q.id = b.quiz_result_id
LEFT JOIN contacts c ON q.id = c.quiz_result_id;

-- 8. customer_quick_view 재생성 (만약 필요하다면)
-- 이 뷰의 정의를 모르므로 주석 처리
-- CREATE VIEW customer_quick_view AS ...

-- 9. 성공 확인
SELECT 
    'Views created successfully!' as status,
    COUNT(*) as view_count
FROM information_schema.views 
WHERE table_schema = 'public'
AND table_name IN ('bookings_with_quiz', 'contacts_with_quiz', 'quiz_conversion_stats');

-- 10. 샘플 데이터 확인
SELECT * FROM bookings_with_quiz LIMIT 3;
SELECT * FROM quiz_conversion_stats;
