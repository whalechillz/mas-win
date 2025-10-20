-- 기존 SMS 데이터의 calendar_id 마이그레이션

-- 1. channel_sms 테이블의 기존 데이터에 calendar_id 연결
UPDATE channel_sms
SET calendar_id = cc.id
FROM cc_content_calendar cc
WHERE channel_sms.id::text = cc.sms_id::text 
AND channel_sms.calendar_id IS NULL;

-- 2. 결과 확인
SELECT 
  cs.id,
  cs.message_text,
  cs.calendar_id,
  cc.title as hub_title
FROM channel_sms cs
LEFT JOIN cc_content_calendar cc ON cs.calendar_id = cc.id
ORDER BY cs.created_at DESC;
