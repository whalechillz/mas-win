-- 타입 변경 및 뷰 생성 (올바른 순서)

-- 1. 먼저 기존 뷰들을 삭제 (존재하는 경우)
DROP VIEW IF EXISTS bookings_with_quiz CASCADE;
DROP VIEW IF EXISTS contacts_with_quiz CASCADE;
DROP VIEW IF EXISTS quiz_conversion_stats CASCADE;

-- 2. 이제 안전하게 컬럼 타입 변경
ALTER TABLE bookings 
ALTER COLUMN current_distance TYPE VARCHAR(50) USING current_distance::VARCHAR;

ALTER TABLE bookings 
ALTER COLUMN expected_distance TYPE VARCHAR(50) USING expected_distance::VARCHAR;

-- contacts 테이블에도 해당 컬럼이 있다면 타입 변경
ALTER TABLE contacts 
ALTER COLUMN current_distance TYPE VARCHAR(50) USING current_distance::VARCHAR
WHERE EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'contacts' 
    AND column_name = 'current_distance'
);

-- 3. 이제 뷰를 생성 (타입이 일치하므로 에러 없음)
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

-- 4. contacts_with_quiz 뷰 생성
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

-- 5. 통계 뷰 생성
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

-- 6. 뷰가 제대로 생성되었는지 확인
SELECT table_name 
FROM information_schema.views 
WHERE table_schema = 'public'
ORDER BY table_name;

-- 7. 뷰 테스트
SELECT * FROM bookings_with_quiz LIMIT 3;
SELECT * FROM quiz_conversion_stats;
