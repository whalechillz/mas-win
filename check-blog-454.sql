-- 블로그 ID 454 존재 여부 확인
SELECT id, title, status, created_at, updated_at 
FROM blog_posts 
WHERE id = 454;

-- 허브에서 blog_post_id = 454인 항목 확인
SELECT id, title, blog_post_id, channel_status->'blog' as blog_status
FROM cc_content_calendar 
WHERE blog_post_id = 454;

-- 허브에서 blog_post_id가 454인 항목의 전체 정보
SELECT 
  cc.id as hub_id,
  cc.title as hub_title,
  cc.blog_post_id,
  cc.channel_status->'blog' as blog_channel_status,
  bp.id as blog_id,
  bp.title as blog_title,
  bp.status as blog_status
FROM cc_content_calendar cc
LEFT JOIN blog_posts bp ON cc.blog_post_id = bp.id
WHERE cc.blog_post_id = 454;
