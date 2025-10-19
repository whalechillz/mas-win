-- 기존 허브 콘텐츠의 "미연결" 상태를 "미발행"으로 수정
UPDATE cc_content_calendar 
SET channel_status = jsonb_set(
  channel_status, 
  '{blog,status}', 
  '"미발행"'
)
WHERE channel_status->'blog'->>'status' = '미연결';

-- 업데이트 결과 확인
SELECT 
  id,
  title,
  channel_status->'blog'->>'status' as blog_status,
  channel_status->'sms'->>'status' as sms_status,
  channel_status->'naver_blog'->>'status' as naver_status,
  channel_status->'kakao'->>'status' as kakao_status
FROM cc_content_calendar 
WHERE title LIKE '%마쓰구%' OR title LIKE '%11월%'
ORDER BY created_at DESC;
