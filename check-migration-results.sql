-- 마이그레이션 결과 전체 확인

-- 1. 전체 허브 콘텐츠 수 확인
SELECT COUNT(*) as total_hub_contents FROM cc_content_calendar;

-- 2. 블로그 연결 상태 확인
SELECT 
  COUNT(*) as total,
  COUNT(blog_post_id) as blog_connected,
  ROUND(COUNT(blog_post_id)::numeric / COUNT(*) * 100, 2) as blog_connection_rate
FROM cc_content_calendar;

-- 3. 채널별 상태 분포 확인
SELECT 
  channel_status->'blog'->>'status' as blog_status,
  COUNT(*) as count
FROM cc_content_calendar 
GROUP BY channel_status->'blog'->>'status';

-- 4. 최근 생성된 허브 콘텐츠 확인 (10개)
SELECT 
  id,
  title,
  blog_post_id,
  channel_status->'blog'->>'status' as blog_status,
  content_date,
  created_at
FROM cc_content_calendar 
ORDER BY created_at DESC 
LIMIT 10;

-- 5. 날짜별 분포 확인
SELECT 
  content_date,
  COUNT(*) as count
FROM cc_content_calendar 
GROUP BY content_date 
ORDER BY content_date DESC 
LIMIT 10;
