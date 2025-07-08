-- 테이블 구조 수정
-- time 컬럼을 VARCHAR로 변경

ALTER TABLE bookings 
ALTER COLUMN time TYPE VARCHAR(50);

ALTER TABLE contacts
ALTER COLUMN call_time TYPE VARCHAR(100);