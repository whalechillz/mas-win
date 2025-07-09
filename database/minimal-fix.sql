-- contacts 테이블에 누락된 필드 추가 및 뷰 생성

-- 1. contacts 테이블에 recommended_club 필드 추가
ALTER TABLE contacts 
ADD COLUMN IF NOT EXISTS recommended_club character varying;

-- 2. 뷰는 필요없음 - 이미 모든 데이터가 contacts 테이블에 있으므로
-- 하지만 코드 호환성을 위해 간단한 뷰 생성
CREATE OR REPLACE VIEW contacts_with_quiz AS
SELECT * FROM contacts;

-- 3. bookings 테이블도 이미 모든 필드를 가지고 있으므로 간단한 뷰 생성
CREATE OR REPLACE VIEW bookings_with_quiz AS
SELECT * FROM bookings;

-- 4. 권한 부여
GRANT ALL ON contacts TO authenticated;
GRANT ALL ON bookings TO authenticated;
GRANT SELECT ON contacts_with_quiz TO authenticated;
GRANT SELECT ON bookings_with_quiz TO authenticated;
