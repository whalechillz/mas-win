-- anon 역할도 INSERT 할 수 있도록 정책 수정
CREATE POLICY "Enable insert for anon" ON public.contacts
FOR INSERT TO anon
WITH CHECK (true);

CREATE POLICY "Enable insert for anon" ON public.bookings
FOR INSERT TO anon
WITH CHECK (true);

CREATE POLICY "Enable insert for anon" ON public.quiz_results
FOR INSERT TO anon
WITH CHECK (true);

-- 확인
SELECT tablename, policyname, permissive, roles, cmd 
FROM pg_policies 
WHERE schemaname = 'public';