-- SMS 연결 문제 디버깅

-- 1. cc_content_calendar의 sms_id 확인
SELECT 
  id,
  title,
  sms_id,
  channel_status->'sms' as sms_status
FROM cc_content_calendar 
WHERE sms_id IS NOT NULL OR channel_status->'sms' IS NOT NULL;

-- 2. channel_sms의 실제 ID와 cc_content_calendar의 sms_id 비교
SELECT 
  'channel_sms' as source,
  id,
  message_text,
  calendar_id
FROM channel_sms
UNION ALL
SELECT 
  'cc_content_calendar' as source,
  sms_id::text as id,
  title as message_text,
  id::text as calendar_id
FROM cc_content_calendar 
WHERE sms_id IS NOT NULL;

-- 3. 수동으로 SMS를 허브에 연결하는 방법 확인
SELECT 
  cc.id as hub_id,
  cc.title as hub_title,
  cs.id as sms_id,
  cs.message_text
FROM cc_content_calendar cc
CROSS JOIN channel_sms cs
WHERE cc.sms_id IS NULL 
AND cs.calendar_id IS NULL
LIMIT 5;
