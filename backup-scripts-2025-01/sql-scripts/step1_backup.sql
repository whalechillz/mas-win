-- 현재 데이터 백업
-- Supabase 대시보드에서 백업을 먼저 생성하세요!

-- 백업 테이블 생성
CREATE TABLE bookings_backup AS SELECT * FROM bookings;
CREATE TABLE contacts_backup AS SELECT * FROM contacts;
CREATE TABLE quiz_results_backup AS SELECT * FROM quiz_results;

-- 백업 확인
SELECT 'bookings' as table_name, COUNT(*) as row_count FROM bookings
UNION ALL
SELECT 'bookings_backup', COUNT(*) FROM bookings_backup
UNION ALL
SELECT 'contacts', COUNT(*) FROM contacts
UNION ALL
SELECT 'contacts_backup', COUNT(*) FROM contacts_backup;
