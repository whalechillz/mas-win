-- 데이터 타입 확인 및 수정

-- 1. 현재 컬럼 타입 확인
SELECT 
    table_name,
    column_name,
    data_type,
    character_maximum_length
FROM information_schema.columns
WHERE table_schema = 'public' 
AND column_name IN ('current_distance', 'expected_distance')
ORDER BY table_name, column_name;

-- 2. bookings 테이블의 current_distance가 integer라면 VARCHAR로 변경
ALTER TABLE bookings 
ALTER COLUMN current_distance TYPE VARCHAR(50) USING current_distance::VARCHAR;

ALTER TABLE bookings 
ALTER COLUMN expected_distance TYPE VARCHAR(50) USING expected_distance::VARCHAR;

-- 3. 이제 뷰를 다시 생성 (타입이 일치하므로 에러 없음)
CREATE OR REPLACE VIEW bookings_with_quiz AS
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

-- 4. contacts_with_quiz 뷰도 생성
CREATE OR REPLACE VIEW contacts_with_quiz AS
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
CREATE OR REPLACE VIEW quiz_conversion_stats AS
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
