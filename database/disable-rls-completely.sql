-- RLS(Row Level Security) 완전 비활성화
-- Supabase SQL Editor에서 실행

-- 1. 기존 정책 확인
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename = 'content_ideas';

-- 2. RLS 비활성화
ALTER TABLE content_ideas DISABLE ROW LEVEL SECURITY;
ALTER TABLE monthly_themes DISABLE ROW LEVEL SECURITY;
ALTER TABLE marketing_campaigns DISABLE ROW LEVEL SECURITY;
ALTER TABLE contacts DISABLE ROW LEVEL SECURITY;
ALTER TABLE team_members DISABLE ROW LEVEL SECURITY;

-- 3. 모든 권한 부여 (anon, authenticated, service_role)
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN SELECT tablename FROM pg_tables WHERE schemaname = 'public' 
    LOOP
        EXECUTE format('GRANT ALL ON TABLE %I TO anon, authenticated, service_role', r.tablename);
    END LOOP;
END $$;

-- 4. 시퀀스 권한도 부여
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN SELECT sequence_name FROM information_schema.sequences WHERE sequence_schema = 'public' 
    LOOP
        EXECUTE format('GRANT USAGE, SELECT ON SEQUENCE %I TO anon, authenticated, service_role', r.sequence_name);
    END LOOP;
END $$;

-- 5. 테스트 INSERT
INSERT INTO content_ideas (
    title, 
    content, 
    platform, 
    status, 
    assignee, 
    scheduled_date, 
    tags
) VALUES (
    'RLS 테스트 ' || NOW()::text,
    'RLS 비활성화 테스트',
    'blog',
    'idea',
    '시스템',
    '2025-07-15',
    'test'
) RETURNING *;