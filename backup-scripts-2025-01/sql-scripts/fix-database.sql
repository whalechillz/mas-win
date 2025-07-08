-- Supabase SQL Editor에서 실행할 쿼리들

-- 1. RLS 상태 확인
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('bookings', 'contacts');

-- 2. 기존 정책 확인
SELECT 
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename IN ('bookings', 'contacts');

-- 3. bookings 테이블 RLS 정책 추가
-- 모든 사용자가 INSERT 가능
CREATE POLICY "allow_anonymous_insert_bookings" ON public.bookings
FOR INSERT 
TO anon
WITH CHECK (true);

-- 모든 사용자가 자신의 데이터 읽기 가능 (선택사항)
CREATE POLICY "allow_anonymous_select_bookings" ON public.bookings
FOR SELECT 
TO anon
USING (true);

-- 4. contacts 테이블 RLS 정책 추가
-- 모든 사용자가 INSERT 가능
CREATE POLICY "allow_anonymous_insert_contacts" ON public.contacts
FOR INSERT 
TO anon
WITH CHECK (true);

-- 5. 테이블에 필요한 컬럼이 있는지 확인
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'bookings' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 6. 만약 퀴즈 관련 컬럼이 없다면 추가
ALTER TABLE public.bookings 
ADD COLUMN IF NOT EXISTS swing_style TEXT,
ADD COLUMN IF NOT EXISTS priority TEXT,
ADD COLUMN IF NOT EXISTS current_distance INTEGER,
ADD COLUMN IF NOT EXISTS recommended_flex TEXT,
ADD COLUMN IF NOT EXISTS expected_distance INTEGER;

ALTER TABLE public.contacts 
ADD COLUMN IF NOT EXISTS swing_style TEXT,
ADD COLUMN IF NOT EXISTS priority TEXT,
ADD COLUMN IF NOT EXISTS current_distance INTEGER,
ADD COLUMN IF NOT EXISTS recommended_flex TEXT,
ADD COLUMN IF NOT EXISTS expected_distance INTEGER;