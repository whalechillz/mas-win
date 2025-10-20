-- 간단한 캘린더 ID 업데이트

-- 1. 현재 SMS 상태 확인
SELECT 
  id,
  message_text,
  calendar_id,
  status
FROM channel_sms 
WHERE id = 20;

-- 2. 허브 ID로 직접 업데이트 (이미 연결된 상태라면 무시됨)
UPDATE channel_sms 
SET calendar_id = '4ad49265-421e-4ebf-9e0c-4317c7f0d180'::uuid
WHERE id = 20;

-- 3. 결과 확인
SELECT 
  id,
  message_text,
  calendar_id,
  status
FROM channel_sms 
WHERE id = 20;
