-- SMS를 허브에 연결하는 쿼리

-- 1. 먼저 허브 콘텐츠 확인 (연결 가능한 허브 찾기)
SELECT 
  id,
  title,
  sms_id,
  channel_status->'sms' as sms_status
FROM cc_content_calendar 
WHERE sms_id IS NULL 
AND channel_status->'sms'->>'status' = '미발행'
ORDER BY created_at DESC
LIMIT 3;

-- 2. SMS를 허브에 연결 (ID: 20번을 연결)
-- 먼저 허브 콘텐츠를 찾아서 연결
UPDATE cc_content_calendar 
SET sms_id = gen_random_uuid(),  -- 새로운 UUID 생성
    channel_status = COALESCE(channel_status, '{}'::jsonb) || 
    jsonb_build_object(
      'sms', jsonb_build_object(
        'status', '수정중',
        'post_id', '20',
        'created_at', NOW()::text
      )
    )
WHERE id = (
  SELECT id FROM cc_content_calendar 
  WHERE sms_id IS NULL 
  ORDER BY created_at DESC 
  LIMIT 1
);

-- 3. channel_sms에 calendar_id 설정 (허브 ID 직접 사용)
UPDATE channel_sms 
SET calendar_id = (
  SELECT id FROM cc_content_calendar 
  WHERE channel_status->'sms'->>'post_id' = '20'
)
WHERE id = 20;

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
