-- 삭제된 블로그로 인한 허브 상태 복구
-- 허브 ID: e7191ea8-4040-402a-8d3b-2375c4864dbe

-- 1. 현재 허브 상태 확인
SELECT 
  id,
  title,
  channel_status,
  blog_post_id
FROM cc_content_calendar 
WHERE id = 'e7191ea8-4040-402a-8d3b-2375c4864dbe';

-- 2. 남은 블로그 게시물 확인
SELECT 
  id,
  title,
  calendar_id,
  status
FROM blog_posts 
WHERE calendar_id = 'e7191ea8-4040-402a-8d3b-2375c4864dbe';

-- 3. 허브 상태를 미발행으로 복구 (blog 채널 제거)
UPDATE cc_content_calendar 
SET 
  channel_status = jsonb_set(
    channel_status, 
    '{blog}', 
    '{"status": "미발행", "post_id": null, "created_at": null}'::jsonb
  ),
  blog_post_id = null,
  updated_at = NOW()
WHERE id = 'e7191ea8-4040-402a-8d3b-2375c4864dbe';

-- 4. 복구 후 상태 확인
SELECT 
  id,
  title,
  channel_status,
  blog_post_id
FROM cc_content_calendar 
WHERE id = 'e7191ea8-4040-402a-8d3b-2375c4864dbe';
