-- 문의 관리에 추천 클럽 정보 추가를 위한 뷰 업데이트

-- 1. 기존 뷰 삭제
DROP VIEW IF EXISTS contacts_with_quiz;
DROP VIEW IF EXISTS bookings_with_quiz;

-- 2. contacts_with_quiz 뷰 재생성 (recommended_club 포함)
CREATE VIEW contacts_with_quiz AS
SELECT 
  c.id,
  c.name,
  c.phone,
  c.call_times,
  c.contacted,
  c.created_at,
  c.memo,
  c.campaign_source,
  c.quiz_result_id,
  -- quiz_results에서 조인된 필드들
  q.swing_style,
  q.priority,
  q.current_distance,
  q.recommended_flex,
  q.expected_distance,
  q.recommended_club  -- 추천 클럽 추가
FROM contacts c
LEFT JOIN quiz_results q ON c.quiz_result_id = q.id;

-- 3. bookings_with_quiz 뷰도 업데이트
CREATE VIEW bookings_with_quiz AS
SELECT 
  b.*,
  q.name,
  q.phone,
  q.email,
  q.swing_style,
  q.priority,
  q.current_distance,
  q.recommended_flex,
  q.expected_distance,
  q.recommended_club,  -- 추천 클럽 추가
  q.campaign_source
FROM bookings b
LEFT JOIN quiz_results q ON b.quiz_result_id = q.id;

-- 4. 권한 부여
GRANT SELECT ON contacts_with_quiz TO authenticated;
GRANT SELECT ON bookings_with_quiz TO authenticated;
