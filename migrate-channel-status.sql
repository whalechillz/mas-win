-- channel_status JSONB 구조를 SMS 배열로 변경하는 마이그레이션 스크립트

-- 1. 기존 SMS 데이터를 배열 형태로 마이그레이션
UPDATE cc_content_calendar
SET channel_status = jsonb_set(
    channel_status,
    '{sms}',
    COALESCE(
        (
            SELECT jsonb_agg(
                jsonb_build_object(
                    'id', s.id,
                    'status', CASE 
                        WHEN s.status = 'sent' THEN '발행됨'
                        WHEN s.status = 'draft' THEN '수정중'
                        ELSE '미발행'
                    END,
                    'message_text', s.message_text,
                    'created_at', s.created_at
                )
            )
            FROM channel_sms s 
            WHERE s.calendar_id = cc_content_calendar.id
        ),
        '[]'::jsonb
    ),
    true
)
WHERE EXISTS (
    SELECT 1 FROM channel_sms s 
    WHERE s.calendar_id = cc_content_calendar.id
);

-- 2. 마이그레이션 결과 확인
SELECT 
    id,
    title,
    channel_status->'sms' as sms_array,
    jsonb_array_length(channel_status->'sms') as sms_count
FROM cc_content_calendar 
WHERE channel_status->'sms' IS NOT NULL 
  AND jsonb_typeof(channel_status->'sms') = 'array'
ORDER BY created_at DESC;
