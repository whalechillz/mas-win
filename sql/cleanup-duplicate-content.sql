-- 중복된 멀티채널 콘텐츠 정리
-- blog_post_id 409와 관련된 모든 멀티채널 콘텐츠 삭제

-- 1. 먼저 어떤 데이터가 있는지 확인
SELECT 
    id, 
    title, 
    content_type, 
    parent_content_id, 
    blog_post_id,
    year, 
    month, 
    content_date,
    created_at
FROM cc_content_calendar 
WHERE content_type = 'multichannel' 
AND (parent_content_id = '409' OR blog_post_id = 409)
ORDER BY created_at DESC;

-- 2. 중복된 데이터 삭제 (실행 전에 위 쿼리로 확인)
DELETE FROM cc_content_calendar 
WHERE content_type = 'multichannel' 
AND (parent_content_id = '409' OR blog_post_id = 409);

-- 3. 삭제 후 확인
SELECT COUNT(*) as remaining_multichannel_content
FROM cc_content_calendar 
WHERE content_type = 'multichannel';
