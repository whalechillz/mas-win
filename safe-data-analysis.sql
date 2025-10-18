-- 안전한 데이터 분석 쿼리 (읽기 전용)

-- 1. 전체 레코드 수 확인
SELECT COUNT(*) as total_records FROM cc_content_calendar;

-- 2. content_type별 분포 확인
SELECT 
  content_type,
  COUNT(*) as count
FROM cc_content_calendar 
GROUP BY content_type
ORDER BY count DESC;

-- 3. 최근 5개 콘텐츠 확인
SELECT 
  id,
  title,
  content_type,
  content_date,
  created_at
FROM cc_content_calendar 
ORDER BY created_at DESC 
LIMIT 5;

-- 4. blog_post_id 연결 상태 확인
SELECT 
  COUNT(*) as total,
  COUNT(blog_post_id) as blog_connected,
  ROUND(COUNT(blog_post_id)::numeric / COUNT(*) * 100, 2) as connection_rate
FROM cc_content_calendar;
