-- 정확한 중복 데이터 찾기

-- 1. blog_post_id 409와 관련된 모든 레코드 확인 (멀티채널 포함)
SELECT 
    id, 
    title, 
    content_type, 
    parent_content_id, 
    blog_post_id,
    year, 
    month, 
    content_date,
    is_root_content,
    multichannel_status,
    created_at
FROM cc_content_calendar 
WHERE blog_post_id = 409
ORDER BY created_at DESC;

-- 2. 멀티채널 콘텐츠만 확인
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
AND blog_post_id = 409
ORDER BY created_at DESC;

-- 3. parent_content_id로 찾기 (UUID 기반)
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
WHERE parent_content_id = '7afee284-0592-4885-816f-8affd64cff3d'
ORDER BY created_at DESC;

-- 4. 중복된 (year, month, content_date, title) 조합 찾기
SELECT 
    year, 
    month, 
    content_date, 
    title,
    COUNT(*) as count
FROM cc_content_calendar 
WHERE blog_post_id = 409
GROUP BY year, month, content_date, title
HAVING COUNT(*) > 1;

-- 5. 실제로 중복된 레코드들의 상세 정보
SELECT 
    id, 
    title, 
    year, 
    month, 
    content_date,
    content_type,
    parent_content_id,
    created_at
FROM cc_content_calendar 
WHERE (year, month, content_date, title) IN (
    SELECT year, month, content_date, title
    FROM cc_content_calendar 
    WHERE blog_post_id = 409
    GROUP BY year, month, content_date, title
    HAVING COUNT(*) > 1
)
ORDER BY year, month, content_date, title, created_at;

-- 6. 모든 멀티채널 콘텐츠 확인 (전체)
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
ORDER BY created_at DESC
LIMIT 20;
