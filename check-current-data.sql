-- 현재 데이터 상태 확인

-- 1. 각 채널 테이블의 데이터 개수 확인
SELECT 'channel_sms' as table_name, COUNT(*) as total_count, COUNT(calendar_id) as linked_count FROM channel_sms
UNION ALL
SELECT 'channel_naver_blog' as table_name, COUNT(*) as total_count, COUNT(calendar_id) as linked_count FROM channel_naver_blog
UNION ALL
SELECT 'channel_kakao' as table_name, COUNT(*) as total_count, COUNT(calendar_id) as linked_count FROM channel_kakao;

-- 2. cc_content_calendar의 채널 ID 확인
SELECT 
  'cc_content_calendar' as table_name,
  COUNT(*) as total_count,
  COUNT(blog_post_id) as blog_linked,
  COUNT(sms_id) as sms_linked,
  COUNT(naver_blog_id) as naver_linked,
  COUNT(kakao_id) as kakao_linked
FROM cc_content_calendar;

-- 3. channel_sms의 실제 데이터 샘플
SELECT id, message_text, calendar_id, created_at FROM channel_sms ORDER BY created_at DESC LIMIT 3;
