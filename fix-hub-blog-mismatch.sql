-- 허브-블로그 불일치 수정
-- 허브 ID: e7191ea8-4040-402a-8d3b-2375c4864dbe
-- 블로그 ID: 454

-- 1. 허브의 blog_post_id를 454로 설정
UPDATE cc_content_calendar
SET
  blog_post_id = 454,
  channel_status = jsonb_set(
    COALESCE(channel_status, '{}'::jsonb),
    '{blog}',
    '{"status": "수정중", "post_id": 454, "created_at": "2025-10-22T00:00:00Z"}'::jsonb,
    true
  ),
  updated_at = NOW()
WHERE id = 'e7191ea8-4040-402a-8d3b-2375c4864dbe';

-- 2. 수정 결과 확인
SELECT 
  id, 
  title, 
  blog_post_id,
  channel_status->'blog' as blog_channel_status,
  updated_at
FROM cc_content_calendar 
WHERE id = 'e7191ea8-4040-402a-8d3b-2375c4864dbe';
