-- Supabase SQL Editor에서 실행할 쿼리들
-- 예약관리 삭제 기능을 위한 RLS 정책 수정

-- 1. 기존 정책 삭제 (중복 방지)
DROP POLICY IF EXISTS "allow_anonymous_delete_bookings" ON public.bookings;
DROP POLICY IF EXISTS "allow_anonymous_update_bookings" ON public.bookings;
DROP POLICY IF EXISTS "allow_anonymous_delete_contacts" ON public.contacts;
DROP POLICY IF EXISTS "allow_anonymous_update_contacts" ON public.contacts;

-- 2. bookings 테이블 RLS 정책 추가
-- 모든 사용자가 DELETE 가능 (관리자용)
CREATE POLICY "allow_anonymous_delete_bookings" ON public.bookings
FOR DELETE 
TO anon
USING (true);

-- 모든 사용자가 UPDATE 가능 (관리자용)
CREATE POLICY "allow_anonymous_update_bookings" ON public.bookings
FOR UPDATE 
TO anon
USING (true)
WITH CHECK (true);

-- 3. contacts 테이블 RLS 정책 추가
-- 모든 사용자가 DELETE 가능 (관리자용)
CREATE POLICY "allow_anonymous_delete_contacts" ON public.contacts
FOR DELETE 
TO anon
USING (true);

-- 모든 사용자가 UPDATE 가능 (관리자용)
CREATE POLICY "allow_anonymous_update_contacts" ON public.contacts
FOR UPDATE 
TO anon
USING (true)
WITH CHECK (true);

-- 4. 정책 확인
SELECT 
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename IN ('bookings', 'contacts')
ORDER BY tablename, policyname; 