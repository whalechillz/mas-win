-- 외래 키 참조 찾기 및 해결

-- 1. content_ideas를 참조하는 테이블 찾기
SELECT 
    conname AS constraint_name,
    conrelid::regclass AS referencing_table,
    a.attname AS referencing_column
FROM pg_constraint c
JOIN pg_attribute a ON a.attnum = ANY(c.conkey) AND a.attrelid = c.conrelid
WHERE c.confrelid = 'content_ideas'::regclass
AND c.contype = 'f';

-- 2. 만약 다른 테이블이 참조하고 있다면, 해당 데이터 먼저 삭제
-- 예: blog_contents 테이블이 content_ideas를 참조한다면
-- DELETE FROM blog_contents WHERE content_idea_id = '삭제하려는ID';

-- 3. 그 다음 content_ideas 삭제
-- DELETE FROM content_ideas WHERE id = '삭제하려는ID';

-- 4. 또는 새로운 테스트 데이터로 시도
INSERT INTO content_ideas (
    title, 
    content, 
    platform, 
    status, 
    assignee,
    topic,
    priority,
    for_naver,
    for_website
) VALUES (
    '삭제테스트', 
    '이것은 삭제 테스트입니다', 
    'blog', 
    'idea', 
    '제이',
    '테스트 주제',
    1,
    false,
    false
);

-- 5. 방금 추가한 데이터 삭제 (외래 키 참조가 없으므로 삭제 가능)
DELETE FROM content_ideas WHERE title = '삭제테스트';