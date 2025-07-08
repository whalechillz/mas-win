-- ===== 데이터베이스 정규화 스크립트 =====
-- quiz_results를 중심으로 데이터 정규화

-- 1. contacts 테이블에서 중복 필드 제거
ALTER TABLE contacts 
DROP COLUMN IF EXISTS swing_style,
DROP COLUMN IF EXISTS priority,
DROP COLUMN IF EXISTS current_distance;

-- 2. bookings 테이블에서 중복 필드 제거  
ALTER TABLE bookings
DROP COLUMN IF EXISTS swing_style,
DROP COLUMN IF EXISTS priority,
DROP COLUMN IF EXISTS current_distance,
DROP COLUMN IF EXISTS recommended_flex,
DROP COLUMN IF EXISTS expected_distance;

-- 3. quiz_result_id가 없는 경우 처리를 위한 인덱스
CREATE INDEX IF NOT EXISTS idx_contacts_quiz_result_id ON contacts(quiz_result_id);
CREATE INDEX IF NOT EXISTS idx_bookings_quiz_result_id ON bookings(quiz_result_id);

-- 4. 뷰 생성 - 조인된 데이터를 쉽게 조회
CREATE OR REPLACE VIEW contacts_with_quiz AS
SELECT 
    c.*,
    q.swing_style,
    q.priority,
    q.current_distance,
    q.recommended_flex,
    q.expected_distance
FROM contacts c
LEFT JOIN quiz_results q ON c.quiz_result_id = q.id;

CREATE OR REPLACE VIEW bookings_with_quiz AS
SELECT 
    b.*,
    q.swing_style,
    q.priority,
    q.current_distance,
    q.recommended_flex,
    q.expected_distance
FROM bookings b
LEFT JOIN quiz_results q ON b.quiz_result_id = q.id;

-- 5. 기존 데이터 마이그레이션 (중복 제거 전에 실행)
-- contacts의 퀴즈 데이터를 quiz_results로 이동
INSERT INTO quiz_results (name, phone, swing_style, priority, current_distance, campaign_source)
SELECT DISTINCT 
    c.name, 
    c.phone, 
    c.swing_style, 
    c.priority, 
    c.current_distance::varchar,
    'migrated-from-contacts'
FROM contacts c
WHERE c.quiz_result_id IS NULL 
    AND c.swing_style IS NOT NULL
ON CONFLICT (phone) DO NOTHING;

-- contacts 테이블 quiz_result_id 업데이트
UPDATE contacts c
SET quiz_result_id = q.id
FROM quiz_results q
WHERE c.phone = q.phone 
    AND c.quiz_result_id IS NULL;

-- bookings의 퀴즈 데이터를 quiz_results로 이동
INSERT INTO quiz_results (name, phone, swing_style, priority, current_distance, recommended_flex, expected_distance, campaign_source)
SELECT DISTINCT 
    b.name, 
    b.phone, 
    b.swing_style, 
    b.priority, 
    b.current_distance::varchar,
    b.recommended_flex,
    b.expected_distance::varchar,
    'migrated-from-bookings'
FROM bookings b
WHERE b.quiz_result_id IS NULL 
    AND b.swing_style IS NOT NULL
ON CONFLICT (phone) DO UPDATE SET
    swing_style = EXCLUDED.swing_style,
    priority = EXCLUDED.priority,
    current_distance = EXCLUDED.current_distance,
    recommended_flex = EXCLUDED.recommended_flex,
    expected_distance = EXCLUDED.expected_distance;

-- bookings 테이블 quiz_result_id 업데이트
UPDATE bookings b
SET quiz_result_id = q.id
FROM quiz_results q
WHERE b.phone = q.phone 
    AND b.quiz_result_id IS NULL;
