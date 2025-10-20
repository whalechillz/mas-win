-- SMS를 허브에 수동으로 연결

-- 방법 1: 기존 허브 콘텐츠에 SMS 연결
UPDATE cc_content_calendar 
SET sms_id = '20'::uuid  -- 첫 번째 SMS ID
WHERE id = '4ad49265-421e-4ebf-9e0c-4317c7f0d180'::uuid;  -- 허브 ID

UPDATE cc_content_calendar 
SET sms_id = '9'::uuid   -- 두 번째 SMS ID  
WHERE id = 'a01458c9-1234-5678-9abc-def012345678'::uuid;  -- 다른 허브 ID

-- 방법 2: channel_sms에 calendar_id 직접 설정
UPDATE channel_sms 
SET calendar_id = '4ad49265-421e-4ebf-9e0c-4317c7f0d180'::uuid
WHERE id = 20;

UPDATE channel_sms 
SET calendar_id = 'a01458c9-1234-5678-9abc-def012345678'::uuid  
WHERE id = 9;

-- 결과 확인
SELECT 
  cs.id as sms_id,
  cs.message_text,
  cs.calendar_id,
  cc.title as hub_title
FROM channel_sms cs
LEFT JOIN cc_content_calendar cc ON cs.calendar_id = cc.id
WHERE cs.id IN (20, 9);
