-- 기존 데이터를 새 구조로 마이그레이션

-- 1. 기존 bookings 테이블에서 quiz_results 생성
INSERT INTO quiz_results (
  name, 
  phone, 
  swing_style, 
  priority, 
  current_distance, 
  recommended_flex, 
  expected_distance,
  campaign_source,
  created_at
)
SELECT DISTINCT ON (phone)
  name,
  phone,
  swing_style,
  priority,
  current_distance,
  recommended_flex,
  expected_distance,
  campaign_source,
  created_at
FROM bookings
WHERE phone IS NOT NULL
ORDER BY phone, created_at DESC;

-- 2. bookings 테이블에 quiz_result_id 업데이트
UPDATE bookings b
SET quiz_result_id = q.id
FROM quiz_results q
WHERE b.phone = q.phone;

-- 3. 기존 contacts 테이블도 동일하게 처리
UPDATE contacts c
SET quiz_result_id = q.id
FROM quiz_results q
WHERE c.phone = q.phone;

-- 4. 중복 컬럼 제거 (나중에 실행)
-- ALTER TABLE bookings 
-- DROP COLUMN name,
-- DROP COLUMN phone,
-- DROP COLUMN swing_style,
-- DROP COLUMN priority,
-- DROP COLUMN current_distance,
-- DROP COLUMN recommended_flex,
-- DROP COLUMN expected_distance,
-- DROP COLUMN campaign_source;
