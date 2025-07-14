-- 테이블 타입 확인
SELECT 
    table_name,
    column_name, 
    data_type,
    udt_name
FROM information_schema.columns 
WHERE table_name IN ('marketing_funnel_stages', 'campaigns', 'marketing_channels')
AND column_name = 'id'
ORDER BY table_name;