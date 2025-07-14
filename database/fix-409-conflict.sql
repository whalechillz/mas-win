-- 409 Conflict 문제 해결

-- 1. 외래 키 제약조건 확인
SELECT 
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM 
    information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
    AND ccu.table_name = 'content_ideas';

-- 2. RLS 완전 비활성화
ALTER TABLE content_ideas DISABLE ROW LEVEL SECURITY;

-- 3. 모든 정책 삭제
DROP POLICY IF EXISTS "Enable all operations for all users" ON content_ideas;
DROP POLICY IF EXISTS "Enable delete for all users" ON content_ideas;
DROP POLICY IF EXISTS "Enable read for all users" ON content_ideas;
DROP POLICY IF EXISTS "Enable insert for all users" ON content_ideas;
DROP POLICY IF EXISTS "Enable update for all users" ON content_ideas;

-- 4. 특정 ID로 직접 삭제 테스트 (에러 메시지 확인용)
-- DELETE FROM content_ideas WHERE id = '2c59fa...' 부분의 전체 ID를 넣어서 테스트

-- 5. CASCADE 옵션으로 관련 데이터 함께 삭제 (주의!)
-- DELETE FROM content_ideas WHERE id = 'YOUR_ID' CASCADE;