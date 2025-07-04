-- Supabase SQL Editor에서 실행

-- 1. RLS 비활성화 (테스트용)
ALTER TABLE bookings DISABLE ROW LEVEL SECURITY;

-- 2. 또는 모든 사용자에게 INSERT 권한 부여
CREATE POLICY "Enable insert for all users" ON bookings
FOR INSERT
TO anon
WITH CHECK (true);

-- 3. 현재 정책 확인
SELECT * FROM pg_policies WHERE tablename = 'bookings';
