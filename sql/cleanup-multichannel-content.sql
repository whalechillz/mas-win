-- 멀티채널 콘텐츠 정리

-- 1. blog_post_id가 409인 항목과 관련된 멀티채널 콘텐츠 확인
SELECT id, title, parent_content_id, blog_post_id, content_type, target_audience_type, channel_type
FROM cc_content_calendar
WHERE (blog_post_id = 409 OR parent_content_id = '00cf52c5-89b6-487c-b5f7-f29cfb9050fe')
AND content_type = 'multichannel'
ORDER BY created_at DESC;

-- 2. 모든 멀티채널 콘텐츠 삭제 (필요시 실행)
-- DELETE FROM cc_content_calendar WHERE content_type = 'multichannel';

-- 3. blog_post_id가 409인 항목과 관련된 멀티채널 콘텐츠만 삭제
DELETE FROM cc_content_calendar
WHERE (blog_post_id = 409 OR parent_content_id = '00cf52c5-89b6-487c-b5f7-f29cfb9050fe')
AND content_type = 'multichannel';

