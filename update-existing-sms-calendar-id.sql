-- 기존 SMS 데이터의 calendar_id 업데이트
-- 허브 콘텐츠와 연결되지 않은 SMS 메시지들을 찾아서 연결

-- 1. 현재 상태 확인
SELECT 
  '현재 상태' as status,
  COUNT(*) as total_sms,
  COUNT(calendar_id) as linked_sms,
  COUNT(*) - COUNT(calendar_id) as unlinked_sms
FROM channel_sms;

-- 2. 사용 가능한 허브 콘텐츠 확인
SELECT 
  '허브 콘텐츠' as type,
  COUNT(*) as total_hubs,
  COUNT(blog_post_id) as blog_linked,
  COUNT(sms_id) as sms_linked
FROM cc_content_calendar 
WHERE is_hub_content = true;

-- 3. SMS 메시지들을 허브 콘텐츠와 연결
-- 가장 최근 허브 콘텐츠를 사용하여 연결
UPDATE channel_sms 
SET calendar_id = (
  SELECT id 
  FROM cc_content_calendar 
  WHERE is_hub_content = true 
  ORDER BY created_at DESC 
  LIMIT 1
)
WHERE calendar_id IS NULL;

-- 4. 업데이트 결과 확인
SELECT 
  '업데이트 후' as status,
  COUNT(*) as total_sms,
  COUNT(calendar_id) as linked_sms,
  COUNT(*) - COUNT(calendar_id) as unlinked_sms
FROM channel_sms;

-- 5. 연결된 SMS 메시지 확인
SELECT 
  cs.id,
  cs.message_text,
  cs.calendar_id,
  cc.title as hub_title
FROM channel_sms cs
LEFT JOIN cc_content_calendar cc ON cs.calendar_id = cc.id
WHERE cs.calendar_id IS NOT NULL
ORDER BY cs.created_at DESC;
