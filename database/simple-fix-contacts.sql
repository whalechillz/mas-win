-- contacts 테이블 전체 재구성 SQL

-- 1. 기존 뷰 삭제
DROP VIEW IF EXISTS contacts_with_quiz CASCADE;
DROP VIEW IF EXISTS bookings_with_quiz CASCADE;

-- 2. contacts 테이블에 필요한 컬럼들 추가 (이미 있으면 무시)
ALTER TABLE contacts 
ADD COLUMN IF NOT EXISTS memo TEXT,
ADD COLUMN IF NOT EXISTS contacted BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- 3. contacts_with_quiz 뷰 생성 (간단한 버전)
CREATE OR REPLACE VIEW contacts_with_quiz AS
SELECT 
  c.*,
  -- quiz_results에서 조인된 필드들
  q.swing_style,
  q.priority,
  q.current_distance,
  q.recommended_flex,
  q.expected_distance,
  q.recommended_club
FROM contacts c
LEFT JOIN quiz_results q ON c.quiz_result_id = q.id;

-- 4. 권한 부여
GRANT ALL ON contacts TO authenticated;
GRANT ALL ON contacts_with_quiz TO authenticated;

-- 5. 테스트 쿼리
SELECT * FROM contacts_with_quiz LIMIT 5;
