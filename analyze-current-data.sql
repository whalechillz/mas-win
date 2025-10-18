-- 현재 cc_content_calendar 데이터 분석

-- 1. 전체 레코드 수 확인
SELECT COUNT(*) as total_records FROM cc_content_calendar;

-- 2. content_type별 분포 확인
SELECT 
  content_type,
  COUNT(*) as count,
  COUNT(blog_post_id) as blog_connected,
  COUNT(sms_id) as sms_connected,
  COUNT(naver_blog_id) as naver_connected
FROM cc_content_calendar 
GROUP BY content_type
ORDER BY count DESC;

-- 3. 최근 생성된 콘텐츠 확인
SELECT 
  id,
  title,
  content_type,
  content_date,
  blog_post_id,
  created_at
FROM cc_content_calendar 
ORDER BY created_at DESC 
LIMIT 10;

-- 4. 채널별 연결 상태 확인
SELECT 
  'blog' as channel,
  COUNT(*) as total,
  COUNT(blog_post_id) as connected,
  ROUND(COUNT(blog_post_id)::numeric / COUNT(*) * 100, 2) as connection_rate
FROM cc_content_calendar
UNION ALL
SELECT 
  'sms' as channel,
  COUNT(*) as total,
  COUNT(sms_id) as connected,
  ROUND(COUNT(sms_id)::numeric / COUNT(*) * 100, 2) as connection_rate
FROM cc_content_calendar
UNION ALL
SELECT 
  'naver_blog' as channel,
  COUNT(*) as total,
  COUNT(naver_blog_id) as connected,
  ROUND(COUNT(naver_blog_id)::numeric / COUNT(*) * 100, 2) as connection_rate
FROM cc_content_calendar;

-- 5. 현재 테이블 구조 확인
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'cc_content_calendar' 
ORDER BY ordinal_position;
