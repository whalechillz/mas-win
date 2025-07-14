-- content_ideas 테이블 RLS 정책 확인 및 수정

-- 1. 현재 RLS 정책 확인
SELECT * FROM pg_policies WHERE tablename = 'content_ideas';

-- 2. RLS 비활성화 (개발/테스트용)
ALTER TABLE content_ideas DISABLE ROW LEVEL SECURITY;

-- 또는 RLS를 유지하면서 정책 추가
-- 3. 기존 정책 삭제 (있다면)
DROP POLICY IF EXISTS "Enable delete for all users" ON content_ideas;
DROP POLICY IF EXISTS "Enable read for all users" ON content_ideas;
DROP POLICY IF EXISTS "Enable insert for all users" ON content_ideas;
DROP POLICY IF EXISTS "Enable update for all users" ON content_ideas;

-- 4. 새 정책 생성
CREATE POLICY "Enable all operations for all users" ON content_ideas
    FOR ALL
    TO public
    USING (true)
    WITH CHECK (true);

-- 5. 테스트: 직접 삭제 시도
-- DELETE FROM content_ideas WHERE title LIKE '%테스트%';