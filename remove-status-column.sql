-- status 컬럼 삭제 (발행 상태가 의미 없으므로)
ALTER TABLE cc_content_calendar DROP COLUMN IF EXISTS status;

-- 삭제 확인
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'cc_content_calendar' 
ORDER BY ordinal_position;
