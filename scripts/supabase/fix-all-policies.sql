-- 1. bookings 테이블의 모든 정책 확인 및 삭제
DO $$ 
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'bookings'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON bookings', pol.policyname);
    END LOOP;
END $$;

-- 2. contacts 테이블의 모든 정책 확인 및 삭제
DO $$ 
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'contacts'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON contacts', pol.policyname);
    END LOOP;
END $$;

-- 3. 새로운 정책 생성
CREATE POLICY "Anyone can insert bookings" ON bookings 
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can select bookings" ON bookings 
  FOR SELECT USING (true);

CREATE POLICY "Anyone can update bookings" ON bookings 
  FOR UPDATE USING (true);

CREATE POLICY "Anyone can insert contacts" ON contacts 
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can select contacts" ON contacts 
  FOR SELECT USING (true);

CREATE POLICY "Anyone can update contacts" ON contacts 
  FOR UPDATE USING (true);

-- 4. 정책 확인
SELECT 
    tablename,
    policyname,
    permissive,
    cmd,
    qual
FROM pg_policies
WHERE tablename IN ('bookings', 'contacts')
ORDER BY tablename, policyname;