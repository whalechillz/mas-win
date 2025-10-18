-- 블로그 데이터를 허브로 마이그레이션

-- 1단계: 블로그 포스트에서 허브 콘텐츠 생성
INSERT INTO cc_content_calendar (
  title,
  summary,
  content_body,
  content_date,
  blog_post_id,
  channel_status,
  is_hub_content,
  hub_priority,
  auto_derive_channels,
  created_at,
  updated_at
)
SELECT 
  bp.title,
  bp.excerpt as summary,
  bp.content as content_body,
  COALESCE(bp.published_at::date, bp.created_at::date) as content_date,
  bp.id as blog_post_id,
  jsonb_build_object(
    'blog', jsonb_build_object(
      'status', '연결됨',
      'post_id', bp.id,
      'created_at', bp.created_at::text
    ),
    'sms', jsonb_build_object(
      'status', '미발행',
      'post_id', null,
      'created_at', null
    ),
    'naver_blog', jsonb_build_object(
      'status', '미발행',
      'post_id', null,
      'created_at', null
    ),
    'kakao', jsonb_build_object(
      'status', '미발행',
      'post_id', null,
      'created_at', null
    )
  ) as channel_status,
  true as is_hub_content,
  1 as hub_priority,
  '["blog", "sms", "naver_blog", "kakao"]'::jsonb as auto_derive_channels,
  bp.created_at,
  bp.updated_at
FROM blog_posts bp
WHERE bp.status = 'published'
ORDER BY bp.published_at DESC;

-- 2단계: 마이그레이션 결과 확인
SELECT 
  COUNT(*) as total_hub_contents,
  COUNT(blog_post_id) as blog_connected,
  ROUND(COUNT(blog_post_id)::numeric / COUNT(*) * 100, 2) as blog_connection_rate
FROM cc_content_calendar;

-- 3단계: 샘플 데이터 확인
SELECT 
  id,
  title,
  blog_post_id,
  channel_status->'blog'->>'status' as blog_status,
  channel_status->'sms'->>'status' as sms_status,
  content_date
FROM cc_content_calendar 
ORDER BY created_at DESC 
LIMIT 5;
