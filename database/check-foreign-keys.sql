-- 1. content_ideas를 참조하는 다른 테이블 찾기
SELECT 
    tc.table_name AS referencing_table,
    kcu.column_name AS referencing_column,
    ccu.table_name AS referenced_table,
    ccu.column_name AS referenced_column,
    tc.constraint_name
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

-- 2. 특정 레코드가 다른 테이블에서 참조되고 있는지 확인
-- 예시: 삭제하려는 content_idea의 ID가 'abc123'이라고 가정
-- SELECT * FROM [참조하는_테이블명] WHERE [참조하는_컬럼명] = 'abc123';

-- 3. 트리거 확인 (이미 있는 것으로 보임)
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table,
    action_statement
FROM information_schema.triggers 
WHERE event_object_table = 'content_ideas';

-- 4. 임시 해결책: CASCADE 삭제 (주의! 관련 데이터도 함께 삭제됨)
-- DELETE FROM content_ideas WHERE id = '삭제하려는_ID' CASCADE;

-- 5. 더 안전한 방법: 외래 키 제약조건 임시 비활성화
-- 이 방법은 Supabase에서는 권한 문제로 작동하지 않을 수 있음
-- ALTER TABLE [참조하는_테이블] DROP CONSTRAINT [제약조건명];
-- DELETE FROM content_ideas WHERE id = '삭제하려는_ID';
-- ALTER TABLE [참조하는_테이블] ADD CONSTRAINT [제약조건명] FOREIGN KEY (...) REFERENCES ...;