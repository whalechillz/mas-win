-- contacts_with_quiz 뷰 생성을 위한 수정된 SQL

-- 1. 먼저 현재 테이블 구조 확인
-- SELECT column_name, data_type 
-- FROM information_schema.columns 
-- WHERE table_name = 'contacts';

-- 2. 기존 뷰 삭제 (있을 경우)
DROP VIEW IF EXISTS contacts_with_quiz CASCADE;
DROP VIEW IF EXISTS bookings_with_quiz CASCADE;

-- 3. contacts_with_quiz 뷰 생성 (수정된 버전)
CREATE VIEW contacts_with_quiz AS
SELECT 
  c.id,
  c.name,
  c.phone,
  c.call_times,
  c.contacted,
  c.created_at,
  c.campaign_source,
  c.quiz_result_id,
  -- quiz_results에서 조인된 필드들
  q.swing_style,
  q.priority,
  q.current_distance,
  q.recommended_flex,
  q.expected_distance,
  q.recommended_club
FROM contacts c
LEFT JOIN quiz_results q ON c.quiz_result_id = q.id;

-- 4. bookings_with_quiz 뷰도 생성
CREATE VIEW bookings_with_quiz AS
SELECT 
  b.*,
  q.swing_style,
  q.priority,
  q.current_distance,
  q.recommended_flex,
  q.expected_distance,
  q.recommended_club,
  q.campaign_source
FROM bookings b
LEFT JOIN quiz_results q ON b.quiz_result_id = q.id;

-- 5. 권한 부여
GRANT SELECT ON contacts_with_quiz TO authenticated;
GRANT SELECT ON bookings_with_quiz TO authenticated;
