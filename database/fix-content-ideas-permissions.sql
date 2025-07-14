-- 1. RLS (Row Level Security) 정책 확인 및 비활성화
ALTER TABLE content_ideas ENABLE ROW LEVEL SECURITY;

-- 2. 모든 사용자에게 읽기 권한 부여
CREATE POLICY "Enable read access for all users" ON "public"."content_ideas"
AS PERMISSIVE FOR SELECT
TO public
USING (true);

-- 3. 모든 사용자에게 쓰기 권한 부여
CREATE POLICY "Enable insert for all users" ON "public"."content_ideas"
AS PERMISSIVE FOR INSERT
TO public
WITH CHECK (true);

-- 4. 모든 사용자에게 업데이트 권한 부여
CREATE POLICY "Enable update for all users" ON "public"."content_ideas"
AS PERMISSIVE FOR UPDATE
TO public
USING (true)
WITH CHECK (true);

-- 5. 모든 사용자에게 삭제 권한 부여
CREATE POLICY "Enable delete for all users" ON "public"."content_ideas"
AS PERMISSIVE FOR DELETE
TO public
USING (true);

-- 또는 더 간단하게 RLS 비활성화 (테스트용)
ALTER TABLE content_ideas DISABLE ROW LEVEL SECURITY;

-- 6. 필수 필드들에 기본값 설정
ALTER TABLE content_ideas ALTER COLUMN status SET DEFAULT 'idea';
ALTER TABLE content_ideas ALTER COLUMN priority SET DEFAULT 3;
ALTER TABLE content_ideas ALTER COLUMN for_naver SET DEFAULT false;
ALTER TABLE content_ideas ALTER COLUMN for_website SET DEFAULT false;