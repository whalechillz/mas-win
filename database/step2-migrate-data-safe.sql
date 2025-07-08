-- STEP 2: 기존 데이터 마이그레이션 (안전한 버전)

-- 1. 먼저 데이터 확인
SELECT COUNT(*) as total_bookings FROM bookings;
SELECT COUNT(*) as bookings_with_name_phone FROM bookings WHERE name IS NOT NULL AND phone IS NOT NULL;

-- 2. bookings에서 고유한 고객 정보로 quiz_results 생성
-- (중복 방지를 위해 ON CONFLICT 사용)
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
  current_distance::VARCHAR,  -- 타입 변환
  recommended_flex,
  expected_distance::VARCHAR,  -- 타입 변환
  campaign_source,
  created_at
FROM bookings
WHERE phone IS NOT NULL 
  AND name IS NOT NULL
  AND phone != ''
  AND name != ''
ORDER BY phone, created_at ASC
ON CONFLICT (phone) DO NOTHING;  -- 중복 방지

-- 3. bookings 테이블의 quiz_result_id 업데이트
UPDATE bookings b
SET quiz_result_id = q.id
FROM quiz_results q
WHERE b.phone = q.phone
  AND b.quiz_result_id IS NULL;

-- 4. contacts에서 누락된 고객 추가
INSERT INTO quiz_results (name, phone, created_at)
SELECT DISTINCT ON (c.phone)
  c.name,
  c.phone,
  c.created_at
FROM contacts c
LEFT JOIN quiz_results q ON c.phone = q.phone
WHERE q.id IS NULL 
  AND c.phone IS NOT NULL 
  AND c.name IS NOT NULL
  AND c.phone != ''
  AND c.name != ''
ORDER BY c.phone, c.created_at ASC
ON CONFLICT (phone) DO NOTHING;

-- 5. contacts 테이블의 quiz_result_id 업데이트
UPDATE contacts c
SET quiz_result_id = q.id
FROM quiz_results q
WHERE c.phone = q.phone
  AND c.quiz_result_id IS NULL;

-- 6. 마이그레이션 결과 확인
SELECT 
  'Total Quiz Results' as type,
  COUNT(*) as count
FROM quiz_results

UNION ALL

SELECT 
  'Bookings with quiz_result_id' as type,
  COUNT(*) as count
FROM bookings
WHERE quiz_result_id IS NOT NULL

UNION ALL

SELECT 
  'Contacts with quiz_result_id' as type,
  COUNT(*) as count
FROM contacts
WHERE quiz_result_id IS NOT NULL

UNION ALL

SELECT 
  'Bookings without quiz_result_id' as type,
  COUNT(*) as count
FROM bookings
WHERE quiz_result_id IS NULL 
  AND phone IS NOT NULL
  AND phone != ''

UNION ALL

SELECT 
  'Contacts without quiz_result_id' as type,
  COUNT(*) as count
FROM contacts
WHERE quiz_result_id IS NULL
  AND phone IS NOT NULL
  AND phone != '';
