-- bookings 테이블의 기존 정책 삭제
DROP POLICY IF EXISTS "Public can insert bookings" ON bookings;
DROP POLICY IF EXISTS "Authenticated users can view all" ON bookings;

-- 새로운 정책 생성 (anon 사용자도 읽기/쓰기 가능)
CREATE POLICY "Public can insert bookings" ON bookings 
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Public can select bookings" ON bookings 
  FOR SELECT USING (true);

-- contacts 테이블도 동일하게 처리
DROP POLICY IF EXISTS "Public can insert contacts" ON contacts;
DROP POLICY IF EXISTS "Authenticated users can view all" ON contacts;

CREATE POLICY "Public can insert contacts" ON contacts 
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Public can select contacts" ON contacts 
  FOR SELECT USING (true);

-- quiz_results 테이블도 동일하게 처리
CREATE POLICY "Public can select quiz_results" ON quiz_results 
  FOR SELECT USING (true);
