-- Supabase SQL Editor에서 실행
-- 권한 문제 확인 및 해결

-- 1. RLS(Row Level Security) 상태 확인
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('content_ideas', 'monthly_themes', 'marketing_campaigns');

-- 2. RLS가 활성화되어 있다면 비활성화 (테스트용)
ALTER TABLE content_ideas DISABLE ROW LEVEL SECURITY;
ALTER TABLE monthly_themes DISABLE ROW LEVEL SECURITY;
ALTER TABLE marketing_campaigns DISABLE ROW LEVEL SECURITY;

-- 3. 또는 RLS 정책 추가 (권장)
-- content_ideas에 대한 INSERT 정책
CREATE POLICY "Enable insert for anon" ON content_ideas
FOR INSERT TO anon
WITH CHECK (true);

CREATE POLICY "Enable select for anon" ON content_ideas
FOR SELECT TO anon
USING (true);

CREATE POLICY "Enable update for anon" ON content_ideas
FOR UPDATE TO anon
USING (true);

CREATE POLICY "Enable delete for anon" ON content_ideas
FOR DELETE TO anon
USING (true);

-- 4. 권한 직접 부여
GRANT ALL ON content_ideas TO anon;
GRANT ALL ON content_ideas TO authenticated;
GRANT USAGE ON SEQUENCE content_ideas_id_seq TO anon;
GRANT USAGE ON SEQUENCE content_ideas_id_seq TO authenticated;

-- 5. 테스트 INSERT
INSERT INTO content_ideas (title, content, platform, status, assignee, scheduled_date, tags)
VALUES ('권한 테스트', '테스트 콘텐츠', 'blog', 'idea', '테스트', '2025-07-15', '테스트');

-- 6. 확인
SELECT * FROM content_ideas WHERE title = '권한 테스트';