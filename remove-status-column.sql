-- 불필요한 컬럼들 삭제 (발행 상태, 콘텐츠 타입이 의미 없으므로)
ALTER TABLE cc_content_calendar DROP COLUMN IF EXISTS status;
ALTER TABLE cc_content_calendar DROP COLUMN IF EXISTS content_type;
ALTER TABLE cc_content_calendar DROP COLUMN IF EXISTS is_hub_content;
ALTER TABLE cc_content_calendar DROP COLUMN IF EXISTS hub_priority;
ALTER TABLE cc_content_calendar DROP COLUMN IF EXISTS auto_derive_channels;

-- 삭제 확인
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'cc_content_calendar' 
ORDER BY ordinal_position;
