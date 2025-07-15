-- 긴급 권한 해결 스크립트
-- Supabase SQL Editor에서 실행

-- 1. Service Role 권한 확인
SELECT 
    grantee,
    privilege_type,
    table_name
FROM information_schema.table_privileges
WHERE table_schema = 'public' 
AND table_name = 'content_ideas'
AND grantee IN ('anon', 'authenticated', 'service_role');

-- 2. RLS 완전 비활성화
ALTER TABLE content_ideas DISABLE ROW LEVEL SECURITY;

-- 3. 모든 권한 부여
GRANT ALL PRIVILEGES ON TABLE content_ideas TO anon;
GRANT ALL PRIVILEGES ON TABLE content_ideas TO authenticated;
GRANT ALL PRIVILEGES ON TABLE content_ideas TO service_role;

-- 4. 시퀀스 권한도 부여
GRANT USAGE, SELECT ON SEQUENCE content_ideas_id_seq TO anon;
GRANT USAGE, SELECT ON SEQUENCE content_ideas_id_seq TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE content_ideas_id_seq TO service_role;

-- 5. 테스트 INSERT (SQL Editor에서 직접)
INSERT INTO content_ideas (title, content, platform, status, assignee, scheduled_date, tags)
VALUES ('권한 테스트 SQL', '직접 SQL 테스트', 'blog', 'idea', '테스트', '2025-07-15', '테스트');

-- 6. 확인
SELECT * FROM content_ideas WHERE title = '권한 테스트 SQL';