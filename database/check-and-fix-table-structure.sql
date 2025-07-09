-- 1. 현재 테이블 구조 확인
SELECT 
    table_name,
    column_name, 
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name IN ('contacts', 'quiz_results', 'bookings')
ORDER BY table_name, ordinal_position;

-- 2. contacts 테이블에 누락된 필드 추가
ALTER TABLE contacts 
ADD COLUMN IF NOT EXISTS memo TEXT;

-- 3. 테스트: contacts 테이블 구조 재확인
SELECT * FROM contacts LIMIT 1;
