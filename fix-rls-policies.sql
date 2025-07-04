-- RLS 정책 재설정
-- 기존 정책 삭제
DROP POLICY IF EXISTS "Enable insert for all users" ON bookings;
DROP POLICY IF EXISTS "Enable insert for all users" ON contacts;
DROP POLICY IF EXISTS "Enable read for authenticated users only" ON bookings;
DROP POLICY IF EXISTS "Enable read for authenticated users only" ON contacts;

-- 테스트를 위해 임시로 모든 접근 허용
CREATE POLICY "Allow all access" ON bookings
    FOR ALL TO anon, authenticated 
    USING (true) 
    WITH CHECK (true);

CREATE POLICY "Allow all access" ON contacts
    FOR ALL TO anon, authenticated 
    USING (true) 
    WITH CHECK (true);

-- 또는 RLS 자체를 비활성화 (테스트용)
-- ALTER TABLE bookings DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE contacts DISABLE ROW LEVEL SECURITY;