-- STEP 2: 기존 데이터 마이그레이션
-- 테이블 생성 후 실행

-- 1. bookings에서 고유한 고객 정보로 quiz_results 생성
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
WHERE phone IS NOT NULL AND name IS NOT NULL
ORDER BY phone, created_at ASC;  -- 가장 첫 번째 기록 사용

-- 2. bookings 테이블의 quiz_result_id 업데이트
UPDATE bookings b
SET quiz_result_id = q.id
FROM quiz_results q
WHERE b.phone = q.phone;

-- 3. contacts에서 누락된 고객 추가
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
ORDER BY c.phone, c.created_at ASC;

-- 4. contacts 테이블의 quiz_result_id 업데이트
UPDATE contacts c
SET quiz_result_id = q.id
FROM quiz_results q
WHERE c.phone = q.phone;

-- 5. 마이그레이션 검증
SELECT 
  'Total Bookings' as type,
  COUNT(*) as count
FROM bookings
UNION ALL
SELECT 
  'Bookings with quiz_result_id' as type,
  COUNT(*) as count
FROM bookings
WHERE quiz_result_id IS NOT NULL
UNION ALL
SELECT 
  'Total Contacts' as type,
  COUNT(*) as count
FROM contacts
UNION ALL
SELECT 
  'Contacts with quiz_result_id' as type,
  COUNT(*) as count
FROM contacts
WHERE quiz_result_id IS NOT NULL
UNION ALL
SELECT 
  'Total Quiz Results' as type,
  COUNT(*) as count
FROM quiz_results;

-- 6. 누락된 데이터 확인
SELECT 'Bookings without quiz_result_id' as issue, COUNT(*) as count
FROM bookings
WHERE quiz_result_id IS NULL AND phone IS NOT NULL
UNION ALL
SELECT 'Contacts without quiz_result_id' as issue, COUNT(*) as count
FROM contacts
WHERE quiz_result_id IS NULL AND phone IS NOT NULL;
