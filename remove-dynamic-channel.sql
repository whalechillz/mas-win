-- 동적 채널 삭제 후 기본 SMS 사용

-- 1. 현재 허브 상태 확인
SELECT 
  id,
  title,
  channel_status
FROM cc_content_calendar 
WHERE id = '4ad49265-421e-4ebf-9e0c-4317c7f0d180';

-- 2. 동적 채널 제거
UPDATE cc_content_calendar
SET channel_status = channel_status - 'sms_1760910334660'
WHERE id = '4ad49265-421e-4ebf-9e0c-4317c7f0d180';

-- 3. 기본 SMS 채널에 기존 SMS 연결
UPDATE cc_content_calendar
SET 
  sms_id = '20'::text::uuid,
  channel_status = COALESCE(channel_status, '{}'::jsonb) ||
    jsonb_build_object(
      'sms', jsonb_build_object(
        'status', '수정중',
        'post_id', '20',
        'created_at', NOW()::text
      )
    )
WHERE id = '4ad49265-421e-4ebf-9e0c-4317c7f0d180';

-- 4. 결과 확인
SELECT 
  id,
  title,
  sms_id,
  channel_status->'sms' as sms_status
FROM cc_content_calendar 
WHERE id = '4ad49265-421e-4ebf-9e0c-4317c7f0d180';
