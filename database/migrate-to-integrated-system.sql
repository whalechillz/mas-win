-- 기존 blog_contents 데이터를 새로운 content_ideas로 마이그레이션

-- 1. 기존 콘텐츠를 content_ideas로 이동
INSERT INTO content_ideas (
    title, 
    topic, 
    status, 
    for_naver, 
    for_website,
    created_at
)
SELECT 
    title,
    COALESCE(content, topic, ''),  -- content 또는 topic 필드 사용
    CASE 
        WHEN status = 'published' THEN 'ready'
        WHEN status = 'scheduled' THEN 'writing'
        ELSE 'idea'
    END,
    true,  -- 기존 콘텐츠는 네이버용으로 표시
    false, -- 자사몰은 아직 미사용
    created_at
FROM blog_contents
WHERE NOT EXISTS (
    SELECT 1 FROM content_ideas ci 
    WHERE ci.title = blog_contents.title
);

-- 2. 네이버 블로그 정보 마이그레이션 (필요한 경우)
-- 플랫폼 이름으로 계정 구분
INSERT INTO naver_publishing (
    content_idea_id,
    mas9golf_status,
    massgoogolf_status,  
    massgoogolfkorea_status,
    naver_title,
    created_at
)
SELECT 
    ci.id,
    CASE WHEN bp.name LIKE '%조%' THEN 'planned' ELSE NULL END,
    CASE WHEN bp.name LIKE '%미%' THEN 'planned' ELSE NULL END,
    CASE WHEN bp.name LIKE '%싸%' OR bp.name LIKE '%스테피%' THEN 'planned' ELSE NULL END,
    bc.title,
    bc.created_at
FROM blog_contents bc
JOIN content_ideas ci ON ci.title = bc.title
LEFT JOIN blog_platforms bp ON bc.platform_id = bp.id
WHERE bc.platform_id IS NOT NULL;

-- 3. 마이그레이션 확인
SELECT 
    'content_ideas' as table_name, 
    COUNT(*) as count 
FROM content_ideas
UNION ALL
SELECT 
    'naver_publishing' as table_name, 
    COUNT(*) as count 
FROM naver_publishing
UNION ALL
SELECT 
    'blog_contents (원본)' as table_name, 
    COUNT(*) as count 
FROM blog_contents;
