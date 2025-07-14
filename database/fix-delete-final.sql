-- 409 Conflict 완전 해결 방법

-- 1. 먼저 어떤 테이블이 content_ideas를 참조하는지 확인
SELECT 
    conname AS constraint_name,
    conrelid::regclass AS table_name,
    confrelid::regclass AS referenced_table
FROM pg_constraint
WHERE confrelid = 'content_ideas'::regclass
AND contype = 'f';

-- 2. 트리거 비활성화 (있다면)
ALTER TABLE content_ideas DISABLE TRIGGER ALL;

-- 3. 테스트 삭제 (간단한 데이터로)
DELETE FROM content_ideas 
WHERE title = '드그' 
OR title = '로'
OR title = '골프 비거리';

-- 4. 만약 여전히 안 된다면, 관련 데이터 확인
-- 예: blog_contents, content_marketing 등 다른 테이블에서 이 ID를 참조하고 있을 수 있음

-- 5. 강제 삭제 방법 (주의!)
-- TRUNCATE content_ideas RESTART IDENTITY CASCADE;
-- 이 명령은 테이블의 모든 데이터를 삭제하므로 주의!

-- 6. 트리거 다시 활성화
-- ALTER TABLE content_ideas ENABLE TRIGGER ALL;