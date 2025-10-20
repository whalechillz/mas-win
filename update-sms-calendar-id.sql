-- SMS에 캘린더 ID 입력 쿼리

-- 1. 허브 콘텐츠 확인 (연결 가능한 허브 찾기)
SELECT 
  id,
  title,
  created_at
FROM cc_content_calendar 
ORDER BY created_at DESC 
LIMIT 3;

-- 2. SMS ID 20번에 캘린더 ID 설정
UPDATE channel_sms 
SET calendar_id = (
  SELECT id FROM cc_content_calendar 
  ORDER BY created_at DESC 
  LIMIT 1
)
WHERE id = 20;

-- 3. 허브의 channel_status 업데이트
UPDATE cc_content_calendar 
SET channel_status = COALESCE(channel_status, '{}'::jsonb) || 
jsonb_build_object(
  'sms', jsonb_build_object(
    'status', '수정중',
    'post_id', '20',
    'created_at', NOW()::text
  )
)
WHERE id = (
  SELECT calendar_id FROM channel_sms WHERE id = 20
);

-- 4. 결과 확인
SELECT 
  cs.id as sms_id,
  cs.message_text,
  cs.calendar_id,
  cc.title as hub_title,
  cc.channel_status->'sms' as sms_status
FROM channel_sms cs
LEFT JOIN cc_content_calendar cc ON cs.calendar_id = cc.id
WHERE cs.id = 20;
