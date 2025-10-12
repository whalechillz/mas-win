-- 중복된 멀티채널 콘텐츠 확인
-- cc_content_calendar 테이블에서 같은 year, month, content_date, title을 가진 레코드 확인

-- 1. unique constraint 확인
SELECT 
    conname AS constraint_name,
    contype AS constraint_type,
    pg_get_constraintdef(c.oid) AS definition
FROM pg_constraint c
JOIN pg_namespace n ON n.oid = c.connamespace
WHERE conrelid = 'cc_content_calendar'::regclass
AND contype = 'u';

-- 2. blog_post_id 409와 관련된 모든 레코드 확인
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

-- 3. 멀티채널 콘텐츠만 확인
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
