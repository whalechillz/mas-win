-- 기존 SMS를 동적 채널에 연결

-- 1. 현재 SMS 상태 확인
SELECT 
  id,
  message_text,
  calendar_id,
  status
FROM channel_sms 
WHERE calendar_id = '4ad49265-421e-4ebf-9e0c-4317c7f0d180';

-- 2. 허브 콘텐츠의 동적 채널 상태 확인
SELECT 
  id,
  title,
  channel_status->'sms_1760910334660' as dynamic_sms_status
FROM cc_content_calendar 
WHERE id = '4ad49265-421e-4ebf-9e0c-4317c7f0d180';

-- 3. 동적 채널에 기존 SMS 연결
UPDATE cc_content_calendar
SET channel_status = COALESCE(channel_status, '{}'::jsonb) ||
  jsonb_build_object(
    'sms_1760910334660', jsonb_build_object(
      'status', '수정중',
      'post_id', '20', -- 기존 SMS ID
      'created_at', NOW()::text
    )
  )
WHERE id = '4ad49265-421e-4ebf-9e0c-4317c7f0d180';

-- 4. 결과 확인
SELECT 
  id,
  title,
  channel_status->'sms_1760910334660' as dynamic_sms_status
FROM cc_content_calendar 
WHERE id = '4ad49265-421e-4ebf-9e0c-4317c7f0d180';
